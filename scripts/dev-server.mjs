import { createServer } from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, normalize, resolve } from "node:path";
import {
  applyAnalysisGuardrails,
  buildItemAnalysisPrompt,
  itemAnalysisSchema as sharedItemAnalysisSchema,
  mapAnalysisToItem as mapSharedAnalysisToItem
} from "./lib/item-analysis.mjs";
import {
  buildItemRecognitionPrompt,
  itemRecognitionSchema,
  scoreItemRecognition
} from "./lib/item-recognition.mjs";
import { channelRegistryVersion, publicChannelRegistry } from "./lib/channel-registry.mjs";
import { reconcileSalesDecision } from "./lib/sales-decision.mjs";

loadDotEnv(".env.local");

const root = resolve(".");
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "0.0.0.0";
const model = process.env.OPENAI_STRATEGY_MODEL || process.env.OPENAI_MODEL || "gpt-5.6-terra";
const recognitionModel = process.env.OPENAI_RECOGNITION_MODEL || "gpt-5.4-mini";
const recognitionFallbackModel = process.env.OPENAI_RECOGNITION_FALLBACK_MODEL || "gpt-5.6-luna";
const recognitionMode = String(process.env.RAMROD_RECOGNITION_MODE || "hybrid").toLowerCase();
const recognitionImageDetail = process.env.OPENAI_RECOGNITION_IMAGE_DETAIL || "low";
const recognitionReasoningEffort = process.env.OPENAI_RECOGNITION_REASONING_EFFORT || "none";
const strategyReasoningEffort = process.env.OPENAI_STRATEGY_REASONING_EFFORT || "none";
const liveImageDetail = process.env.OPENAI_LIVE_IMAGE_DETAIL || process.env.OPENAI_IMAGE_DETAIL || "low";
const ebayPriceProvider = (process.env.EBAY_PRICE_PROVIDER || "local").toLowerCase();
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "ramrod-item-images";
const imageAnalysisMode = String(process.env.RAMROD_IMAGE_ANALYSIS_MODE || "openai").toLowerCase();
const workerApiToken = process.env.RAMROD_WORKER_TOKEN || "";
const workerApiPaths = new Set(["/api/price-check", "/api/ebay-draft", "/api/recognize-image", "/api/analyze-image"]);
const authRequired = String(process.env.AUTH_REQUIRED || "false").toLowerCase() === "true";
const shopPreviewMode = String(process.env.SHOP_PREVIEW_MODE || "false").toLowerCase() === "true";
const shopHostRouting = String(process.env.SHOP_HOST_ROUTING || "false").toLowerCase() === "true";
const shopOrganizationSlug = String(process.env.SHOP_ORGANIZATION_SLUG || "creators").trim().toLowerCase();
const authAllowedEmails = new Set(
  String(process.env.AUTH_ALLOWED_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);
const platformAdminEmails = new Set(
  String(process.env.RAMROD_PLATFORM_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);
const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || "";
const elevenLabsModelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const workerJobTypes = new Set(["health_check", "price_check", "ebay_draft", "recognize_image", "analyze_image"]);
const automaticPriceCheckSources = new Set(["live_openai", "batch_openai", "local_qwen"]);
let ebayAppTokenCache = null;
let multiTenantSchemaAvailable = null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://localhost").pathname;

    if (request.method === "GET" && pathname === "/api/health") {
      sendJson(response, 200, {
        status: "ok",
        service: "ramrod-control-plane",
        time: new Date().toISOString()
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/config") {
      sendJson(response, 200, {
        authRequired,
        supabaseUrl,
        supabaseAnonKey,
        channelRegistryVersion,
        channels: publicChannelRegistry(),
        providers: {
          openai: Boolean(process.env.OPENAI_API_KEY),
          localQwen: imageAnalysisMode === "worker",
          imageAnalysisMode,
          recognitionMode,
          recognitionModel,
          strategyModel: model,
          ebay: Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
          serpApi: Boolean(process.env.SERPAPI_API_KEY)
        }
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/shop/catalog") {
      await handleShopCatalog(request, response);
      return;
    }

    if (pathname.startsWith("/api/") && authRequired) {
      const auth = await authenticateRequest(request, pathname);
      if (!auth.ok) {
        sendJson(response, auth.status, { error: auth.error, message: auth.message });
        return;
      }
      request.ramrodUser = auth.user;
    }

    if (request.method === "GET" && pathname === "/api/app-state") {
      await handleAppState(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/organizations") {
      await handleCreateOrganization(request, response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/voice-status") {
      sendJson(response, 200, {
        elevenLabsConfigured: Boolean(process.env.ELEVENLABS_API_KEY && elevenLabsVoiceId),
        elevenLabsVoiceId: elevenLabsVoiceId ? "configured" : "",
        elevenLabsModelId
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/jobs") {
      await handleJobs(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/jobs") {
      await handleCreateJob(request, response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/workers") {
      await handleWorkers(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/analyze-image") {
      await handleAnalyzeImage(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/recognize-image") {
      await handleRecognizeImage(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/items") {
      await handleSaveItem(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/price-check") {
      await handlePriceCheck(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/ebay-draft") {
      await handleEbayDraft(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/elevenlabs-tts") {
      await handleElevenLabsTts(request, response);
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "method_not_allowed" });
      return;
    }

    serveStatic(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "internal_error", message: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`Scanapp server listening on http://${host}:${port}`);
});

async function authenticateRequest(request, pathname) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      status: 503,
      error: "auth_not_configured",
      message: "Supabase Auth ist auf dem Server nicht vollständig konfiguriert."
    };
  }

  const authorization = String(request.headers.authorization || "");
  if (!authorization.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "authentication_required", message: "Bitte anmelden." };
  }

  const bearerToken = authorization.slice("Bearer ".length);
  if (workerApiPaths.has(pathname) && workerApiToken && safeTokenEquals(bearerToken, workerApiToken)) {
    return {
      ok: true,
      status: 200,
      user: { id: "ramrod-worker", email: "worker@ramrod.internal", service: true }
    };
  }

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: authorization
      }
    });
    const user = await authResponse.json();
    if (!authResponse.ok || !user?.id) {
      return { ok: false, status: 401, error: "invalid_session", message: "Die Sitzung ist abgelaufen. Bitte erneut anmelden." };
    }

    const email = String(user.email || "").toLowerCase();
    const ramrodRole = String(user.app_metadata?.ramrod_role || "").toLowerCase();
    const roleAllowed = ["admin", "operator"].includes(ramrodRole);
    if (authAllowedEmails.size && !authAllowedEmails.has(email) && !roleAllowed) {
      return { ok: false, status: 403, error: "account_not_allowed", message: "Dieses Konto ist für RAMROD nicht freigeschaltet." };
    }

    return { ok: true, status: 200, user };
  } catch (error) {
    return { ok: false, status: 503, error: "auth_unavailable", message: `Anmeldung konnte nicht geprüft werden: ${redactSecret(error.message)}` };
  }
}

function safeTokenEquals(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function handleAppState(request, response) {
  const persistence = supabasePersistenceStatus();

  if (!persistence.configured) {
    sendJson(response, 200, {
      persistence,
      organizations: [],
      activeOrganization: null,
      platformAdmin: false,
      boxes: [],
      items: [],
      message: "Supabase is not configured."
    });
    return;
  }

  try {
    const tenant = await resolveTenantContext(request);
    if (!tenant.activeOrganization) {
      sendJson(response, 403, {
        error: "organization_access_required",
        message: "Dieses Konto ist noch keinem Kundenbereich zugeordnet.",
        persistence,
        organizations: tenant.organizations,
        activeOrganization: null,
        platformAdmin: tenant.platformAdmin,
        boxes: [],
        items: []
      });
      return;
    }

    const organizationId = tenant.activeOrganization.id;
    const organizationFilter = encodeURIComponent(organizationId);
    const [boxes, items, priceJobs, adminOverview] = await Promise.all([
      supabaseSelect(`/boxes?select=id,code,label,location,status,customer_id&customer_id=eq.${organizationFilter}&order=code.asc`),
      supabaseSelect(`/items?select=*&customer_id=eq.${organizationFilter}&order=created_at.desc&limit=500`),
      persistence.writable
        ? supabaseSelect(`/jobs?select=id,item_id,status,attempts,max_attempts,created_at,updated_at,result,error&customer_id=eq.${organizationFilter}&job_type=eq.price_check&order=created_at.desc&limit=500`)
        : [],
      tenant.platformAdmin ? buildAdminOverview(tenant.organizations) : []
    ]);
    const latestPriceJobByItem = new Map();
    for (const job of priceJobs) {
      if (job.item_id && !latestPriceJobByItem.has(job.item_id)) {
        latestPriceJobByItem.set(job.item_id, job);
      }
    }

    sendJson(response, 200, {
      persistence,
      organizations: tenant.organizations,
      activeOrganization: tenant.activeOrganization,
      platformAdmin: tenant.platformAdmin,
      adminOverview,
      tenantMode: tenant.tenantMode,
      boxes: boxes.map(mapDbBoxToUi),
      items: items.map((item) => mapDbItemToUi(item, boxes, latestPriceJobByItem.get(item.id)))
    });
  } catch (error) {
    sendJson(response, 200, {
      persistence: { ...persistence, available: false },
      organizations: [],
      activeOrganization: null,
      platformAdmin: false,
      boxes: [],
      items: [],
      message: redactSecret(error.message)
    });
  }
}

async function resolveTenantContext(request) {
  const organizations = await selectOrganizations();
  const user = request.ramrodUser || null;
  const developmentAccess = !authRequired || user?.service === true;
  let platformAdmin = developmentAccess || isConfiguredPlatformAdmin(user);
  let memberships = [];
  let tenantMode = "memberships";

  if (!developmentAccess && user?.id) {
    try {
      const [adminRows, membershipRows] = await Promise.all([
        supabaseSelect(`/platform_admins?select=user_id,role,active&user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&limit=1`),
        supabaseSelect(`/organization_memberships?select=organization_id,role,status,support_access&user_id=eq.${encodeURIComponent(user.id)}&status=eq.active`)
      ]);
      platformAdmin = platformAdmin || Boolean(adminRows[0]);
      memberships = membershipRows;
    } catch {
      tenantMode = "legacy";
      memberships = [];
    }
  }

  let accessibleOrganizations = organizations;
  if (!platformAdmin && !developmentAccess) {
    const membershipByOrganization = new Map(memberships.map((entry) => [entry.organization_id, entry]));
    accessibleOrganizations = organizations
      .filter((organization) => membershipByOrganization.has(organization.id))
      .map((organization) => ({
        ...organization,
        role: membershipByOrganization.get(organization.id)?.role || "viewer",
        supportAccess: Boolean(membershipByOrganization.get(organization.id)?.support_access)
      }));

    // Until the migration is installed, keep the pilot account usable without
    // exposing future customer organizations.
    if (!accessibleOrganizations.length && tenantMode === "legacy") {
      const pilot = organizations.find((entry) => entry.slug === "strongvision");
      accessibleOrganizations = pilot ? [{ ...pilot, role: "operator" }] : [];
    }
  } else {
    accessibleOrganizations = organizations.map((organization) => ({
      ...organization,
      role: organization.role || (platformAdmin ? "platform_admin" : "operator")
    }));
  }

  const requestedId = String(request.headers["x-ramrod-organization"] || "").trim();
  const activeOrganization = accessibleOrganizations.find((entry) => entry.id === requestedId)
    || accessibleOrganizations.find((entry) => entry.slug === "strongvision")
    || accessibleOrganizations[0]
    || null;

  return {
    organizations: accessibleOrganizations,
    activeOrganization,
    platformAdmin,
    tenantMode
  };
}

function isConfiguredPlatformAdmin(user) {
  if (!user) return false;
  const email = String(user.email || "").toLowerCase();
  const role = String(user.app_metadata?.ramrod_role || "").toLowerCase();
  return role === "admin" || platformAdminEmails.has(email);
}

async function selectOrganizations() {
  let rows;
  try {
    rows = await supabaseSelect("/customers?select=id,name,slug,organization_type,short_code,brand_color,icon_url,seller_mode,active,created_at&active=eq.true&order=name.asc");
    multiTenantSchemaAvailable = true;
  } catch {
    multiTenantSchemaAvailable = false;
    rows = await supabaseSelect("/customers?select=id,name,slug,created_at&order=name.asc");
  }
  return rows.map(mapOrganizationRow);
}

function mapOrganizationRow(row) {
  const name = String(row.name || "Organisation");
  const shortCode = String(row.short_code || name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2) || "OR").toUpperCase();
  return {
    id: row.id,
    name,
    slug: row.slug,
    type: row.organization_type || (row.slug === "strongvision" ? "customer" : "internal"),
    shortCode,
    brandColor: row.brand_color || "#ff6a00",
    iconUrl: row.icon_url || "",
    sellerMode: row.seller_mode || "business",
    active: row.active !== false,
    role: row.role || ""
  };
}

async function buildAdminOverview(organizations) {
  if (!organizations.length) return [];
  const ids = organizations.map((entry) => entry.id);
  const inFilter = ids.map((id) => `"${id}"`).join(",");
  const rows = await supabaseSelect(`/items?select=id,customer_id,price_fair,confidence,primary_channel,status,created_at&customer_id=in.(${encodeURIComponent(inFilter)})&order=created_at.desc&limit=5000`);
  return organizations.map((organization) => {
    const items = rows.filter((item) => item.customer_id === organization.id);
    const reviewCount = items.filter((item) => Number(item.confidence || 0) < 70 || ["Pruefen", "Problemfall"].includes(item.primary_channel)).length;
    return {
      organizationId: organization.id,
      itemCount: items.length,
      fairValue: items.reduce((sum, item) => sum + Number(item.price_fair || 0), 0),
      reviewCount,
      readyCount: items.filter((item) => ["Verkaufsbereit", "Gelistet"].includes(item.status)).length,
      lastActivity: items[0]?.created_at || null
    };
  });
}

async function handleCreateOrganization(request, response) {
  const tenant = await resolveTenantContext(request);
  if (!tenant.platformAdmin) {
    sendJson(response, 403, { error: "platform_admin_required", message: "Nur Plattform-Admins können Kundenbereiche anlegen." });
    return;
  }

  const body = JSON.parse(await readRequestBody(request, 64 * 1024));
  const name = String(body.name || "").trim();
  const organizationType = ["internal", "customer", "personal", "demo"].includes(body.type) ? body.type : "customer";
  const slug = slugify(String(body.slug || name));
  if (name.length < 2 || !slug) {
    sendJson(response, 400, { error: "invalid_organization", message: "Bitte einen gültigen Namen angeben." });
    return;
  }

  try {
    const shortCode = String(body.shortCode || name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2) || "OR").toUpperCase();
    const rows = await supabaseInsert("/customers", {
      name,
      slug,
      organization_type: organizationType,
      short_code: shortCode,
      brand_color: String(body.brandColor || "#ff6a00"),
      seller_mode: organizationType === "personal" ? "private" : "business",
      notes: String(body.notes || "Über RAMROD angelegter Kundenbereich")
    });
    const organization = rows[0];
    if (!organization) throw new Error("Organisation wurde nicht zurückgegeben.");

    const defaultBoxCode = `${shortCode}-001`;
    const sideEffects = [
      supabaseInsert("/boxes", {
        customer_id: organization.id,
        code: defaultBoxCode,
        label: "Erste Erfassung",
        location: "Noch nicht zugeordnet",
        status: "intake"
      })
    ];
    if (request.ramrodUser?.id && !request.ramrodUser?.service) {
      sideEffects.push(supabaseUpsert("/organization_memberships?on_conflict=organization_id,user_id", {
        organization_id: organization.id,
        user_id: request.ramrodUser.id,
        role: "owner",
        status: "active"
      }));
    }
    await Promise.allSettled(sideEffects);

    sendJson(response, 201, { organization: mapOrganizationRow(organization) });
  } catch (error) {
    sendJson(response, 500, { error: "organization_create_failed", message: redactSecret(error.message) });
  }
}

async function handleShopCatalog(_request, response) {
  const persistence = supabasePersistenceStatus();
  if (!persistence.configured) {
    sendJson(response, 200, { preview: shopPreviewMode, items: [], categories: [] });
    return;
  }

  try {
    const organizations = await selectOrganizations();
    const shopOrganization = organizations.find((entry) => entry.slug === shopOrganizationSlug);
    if (!shopOrganization) {
      sendJson(response, 200, { preview: shopPreviewMode, items: [], categories: [] });
      return;
    }
    const organizationFilter = encodeURIComponent(shopOrganization.id);
    const [rows, boxes] = await Promise.all([
      supabaseSelect(`/items?select=*&customer_id=eq.${organizationFilter}&order=created_at.desc&limit=500`),
      supabaseSelect(`/boxes?select=id,code,label,location,status,customer_id&customer_id=eq.${organizationFilter}&order=code.asc`)
    ]);
    const entries = rows
      .map((row) => {
        const item = mapDbItemToUi(row, boxes);
        const raw = row.raw_analysis || {};
        const shop = raw.shop || raw.uiItem?.shop || {};
        const approved = ["Verkaufsbereit", "Gelistet", "Verkauft"].includes(String(row.status || item.stage));
        const published = Boolean(shop.published || raw.uiItem?.shopPublished)
          || (row.primary_channel === "RAMROD Shop" && approved);
        const previewEligible = shopPreviewMode
          && ["Freigabe", "Verkaufsbereit", "Gelistet"].includes(String(row.status || item.stage))
          && String(item.sourceType || "").toLowerCase() !== "mock";
        return { row, item, shop, published, previewEligible };
      })
      .filter(({ item, published, previewEligible }) => {
        const image = String(item.image || "");
        return (published || previewEligible)
          && Number(item.fair) > 0
          && image
          && !image.startsWith("data:")
          && !/^unbekannter\s+sammlerartikel$/i.test(String(item.title || ""));
      })
      .map(({ row, item, shop, published }) => mapItemToShopProduct(row, item, shop, published));

    const categories = [...new Set(entries.map((item) => item.department))]
      .sort((left, right) => left.localeCompare(right, "de"));

    sendJson(response, 200, {
      preview: shopPreviewMode,
      generatedAt: new Date().toISOString(),
      items: entries,
      categories
    });
  } catch (error) {
    sendJson(response, 200, {
      preview: shopPreviewMode,
      items: [],
      categories: [],
      message: redactSecret(error.message)
    });
  }
}

function mapItemToShopProduct(row, item, shop, published) {
  const department = shop.department || shopDepartment(item);
  const listing = item.listingDraft || {};
  const attributes = Array.isArray(listing.attributes)
    ? listing.attributes.slice(0, 8).map((entry) => String(entry))
    : [];
  const condition = normalizeShopCondition(item.condition);
  const description = String(
    shop.description
      || listing.description
      || item.completeness
      || "Gebrauchtes Einzelstück. Lieferumfang und Zustand sind auf den Fotos dokumentiert."
  ).trim();

  return {
    id: row.id,
    slug: `${slugify(item.title)}-${String(row.id).slice(0, 8)}`,
    title: item.title,
    category: item.category || department,
    department,
    franchise: item.franchise || "",
    condition,
    completeness: item.completeness || "Siehe Fotos",
    description,
    attributes,
    price: Number(item.fair),
    image: shopImageUrl(item.image),
    badge: shop.badge || (published ? "Einzelstück" : "Vorschau"),
    stock: published ? 1 : 0,
    purchasable: Boolean(published && shop.purchasable !== false),
    featured: Boolean(shop.featured),
    publishedAt: shop.publishedAt || row.updated_at || row.created_at || null
  };
}

function shopDepartment(item) {
  const text = `${item.title || ""} ${item.category || ""} ${item.franchise || ""}`.toLowerCase();
  if (/comic|manga|karte|card|tcg|pokemon|pokémon/.test(text)) return "Comics & Karten";
  if (/figur|figure|toy|amiibo|bobble|statue|modell|collectible/.test(text)) return "Figuren & Toys";
  if (/spiel|game|xbox|playstation|ps[1-5]|dreamcast|atari|nintendo|sega|wii/.test(text)) return "Games";
  if (/film|blu.?ray|dvd|vhs|serie|soundtrack|vinyl/.test(text)) return "Film & Musik";
  return "Fundstücke";
}

function shopImageUrl(value) {
  const source = String(value || "").trim();
  if (!source || /^(https?:|data:)/i.test(source)) return source;
  const cleanSource = source.replace(/^\/+/, "");
  const stem = basename(cleanSource, extname(cleanSource));
  const optimized = [`app/assets/shop/${stem}.jpg`, `app/assets/shop/${stem}.JPG`]
    .find((candidate) => existsSync(resolve(root, candidate)));
  return optimized ? `/${optimized}` : source;
}

function normalizeShopCondition(value) {
  const text = String(value || "Gebraucht").trim();
  if (/pruefen|prüfen|ungepr/i.test(text)) return "Noch zu prüfen";
  return text.replace(/ae/g, "ä").replace(/ue/g, "ü").replace(/oe/g, "ö");
}

function slugify(value) {
  return String(value || "artikel")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "artikel";
}

async function handleJobs(request, response) {
  const persistence = supabasePersistenceStatus();
  if (!persistence.writable) {
    sendJson(response, 503, {
      error: "job_queue_not_configured",
      message: "SUPABASE_SERVICE_ROLE_KEY is required for the job queue."
    });
    return;
  }

  const url = new URL(request.url, "http://localhost");
  const status = String(url.searchParams.get("status") || "").trim();
  const jobType = String(url.searchParams.get("jobType") || "").trim();
  const itemId = String(url.searchParams.get("itemId") || "").trim();
  const jobId = String(url.searchParams.get("id") || "").trim();
  const limit = clampNumber(url.searchParams.get("limit"), 1, 200, 50);
  const filters = [
    "select=id,customer_id,item_id,job_type,status,priority,attempts,max_attempts,run_after,locked_by,started_at,completed_at,created_at,updated_at,result,error",
    "order=created_at.desc",
    `limit=${limit}`
  ];

  if (status) filters.push(`status=eq.${encodeURIComponent(status)}`);
  if (jobType) filters.push(`job_type=eq.${encodeURIComponent(jobType)}`);
  if (itemId) filters.push(`item_id=eq.${encodeURIComponent(itemId)}`);
  if (jobId) filters.push(`id=eq.${encodeURIComponent(jobId)}`);

  try {
    const jobs = await supabaseSelect(`/jobs?${filters.join("&")}`);
    sendJson(response, 200, { jobs });
  } catch (error) {
    sendJson(response, 500, {
      error: "job_queue_read_failed",
      message: redactSecret(error.message)
    });
  }
}

async function handleWorkers(_request, response) {
  const persistence = supabasePersistenceStatus();
  if (!persistence.writable) {
    sendJson(response, 503, {
      error: "job_queue_not_configured",
      message: "SUPABASE_SERVICE_ROLE_KEY is required for worker status."
    });
    return;
  }

  try {
    const workers = await supabaseSelect("/workers?select=id,worker_key,name,status,capabilities,max_concurrency,metadata,last_seen_at,created_at,updated_at&order=name.asc");
    sendJson(response, 200, { workers });
  } catch (error) {
    sendJson(response, 500, {
      error: "worker_status_read_failed",
      message: redactSecret(error.message)
    });
  }
}

async function handleCreateJob(request, response) {
  const persistence = supabasePersistenceStatus();
  if (!persistence.writable) {
    sendJson(response, 503, {
      error: "job_queue_not_configured",
      message: "SUPABASE_SERVICE_ROLE_KEY is required to create jobs."
    });
    return;
  }

  const body = JSON.parse(await readRequestBody(request, 12 * 1024 * 1024));
  const jobType = String(body.jobType || "").trim();
  if (!workerJobTypes.has(jobType)) {
    sendJson(response, 400, {
      error: "unsupported_job_type",
      message: `jobType must be one of: ${[...workerJobTypes].join(", ")}`
    });
    return;
  }

  const payload = body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
    ? body.payload
    : {};
  const idempotencyKey = String(body.idempotencyKey || "").trim() || null;

  if (jobType === "analyze_image" && !validHttpsUrl(payload.imageUrl)) {
    sendJson(response, 400, {
      error: "invalid_image_url",
      message: "analyze_image jobs require payload.imageUrl with an HTTPS storage URL."
    });
    return;
  }

  try {
    const queued = await createWorkerJob({
      customerId: body.customerId || null,
      itemId: body.itemId || payload.item?.dbId || null,
      jobType,
      payload,
      priority: body.priority,
      maxAttempts: body.maxAttempts,
      runAfter: body.runAfter,
      idempotencyKey
    });
    sendJson(response, queued.created ? 202 : 200, queued);
  } catch (error) {
    sendJson(response, 500, {
      error: "job_queue_write_failed",
      message: redactSecret(error.message)
    });
  }
}

async function createWorkerJob({
  customerId = null,
  itemId = null,
  jobType,
  payload = {},
  priority = 50,
  maxAttempts = 3,
  runAfter = null,
  idempotencyKey = null
}) {
  if (idempotencyKey) {
    const existing = await supabaseSelect(`/jobs?select=*&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`);
    if (existing[0]) return { created: false, job: existing[0] };
  }

  try {
    const rows = await supabaseInsert("/jobs", {
      customer_id: customerId,
      item_id: itemId,
      job_type: jobType,
      status: "queued",
      priority: clampNumber(priority, 0, 100, 50),
      payload,
      max_attempts: clampNumber(maxAttempts, 1, 20, 3),
      run_after: validIsoDate(runAfter) || new Date().toISOString(),
      idempotency_key: idempotencyKey
    });
    return { created: true, job: rows[0] || null };
  } catch (error) {
    if (idempotencyKey) {
      const existing = await supabaseSelect(`/jobs?select=*&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`).catch(() => []);
      if (existing[0]) return { created: false, job: existing[0] };
    }
    throw error;
  }
}

async function handleElevenLabsTts(request, response) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey || !elevenLabsVoiceId) {
    sendJson(response, 400, {
      error: "elevenlabs_not_configured",
      message: "ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID are required."
    });
    return;
  }

  const body = JSON.parse(await readRequestBody(request, 24 * 1024));
  const text = String(body.text || "").trim();

  if (!text) {
    sendJson(response, 400, {
      error: "missing_text",
      message: "text is required."
    });
    return;
  }

  const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(elevenLabsVoiceId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey
    },
    body: JSON.stringify({
      text: text.slice(0, 900),
      model_id: elevenLabsModelId,
      language_code: "de",
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.75,
        style: 0.12,
        use_speaker_boost: true
      }
    })
  });

  if (!elevenResponse.ok) {
    let message = `ElevenLabs HTTP ${elevenResponse.status}`;
    try {
      const errorBody = await elevenResponse.json();
      message = errorBody.detail?.message || errorBody.message || message;
    } catch (_error) {
      // Keep the generic HTTP message when ElevenLabs returns non-JSON.
    }

    sendJson(response, elevenResponse.status, {
      error: "elevenlabs_tts_failed",
      message
    });
    return;
  }

  const audio = Buffer.from(await elevenResponse.arrayBuffer());
  response.writeHead(200, {
    "Content-Type": "audio/mpeg",
    "Cache-Control": "no-store"
  });
  response.end(audio);
}

async function handleSaveItem(request, response) {
  const persistence = supabasePersistenceStatus();
  if (!persistence.writable) {
    sendJson(response, 503, {
      error: "supabase_not_writable",
      message: "SUPABASE_SERVICE_ROLE_KEY is required for server-side writes."
    });
    return;
  }

  const body = JSON.parse(await readRequestBody(request, 12 * 1024 * 1024));
  const item = body.item;

  if (!item?.sku || !item?.title) {
    sendJson(response, 400, {
      error: "missing_item",
      message: "item with sku and title is required."
    });
    return;
  }

  try {
    const tenant = await resolveTenantContext(request);
    const customer = tenant.activeOrganization || await getOrCreateCustomer();
    if (!customer) {
      sendJson(response, 403, {
        error: "organization_access_required",
        message: "Vor dem Speichern muss ein Kundenbereich ausgewählt werden."
      });
      return;
    }
    const box = await getBoxByCode(customer.id, item.boxId || "SV-001");
    const conflictTarget = multiTenantSchemaAvailable === false ? "sku" : "customer_id,sku";
    const savedRows = await supabaseUpsert(`/items?on_conflict=${conflictTarget}`, mapUiItemToDb(item, customer, box));
    const saved = savedRows[0] || null;

    if (item.priceCheck && saved) {
      await supabaseInsert("/price_checks", mapUiPriceCheckToDb(saved.id, item.priceCheck));
    }

    let automationJob = null;
    if (saved && !item.priceCheck && automaticPriceCheckSources.has(item.sourceType)) {
      const queued = await createWorkerJob({
        customerId: customer.id,
        itemId: saved.id,
        jobType: "price_check",
        payload: { item: buildPriceCheckJobItem(item, saved.id) },
        priority: 60,
        maxAttempts: 3,
        idempotencyKey: `auto-price-check:${saved.id}:v1`
      });
      automationJob = queued.job;
    }

    sendJson(response, 200, {
      persistence,
      item: saved ? mapDbItemToUi(saved, box ? [box] : [], automationJob) : item,
      automationJob
    });
  } catch (error) {
    sendJson(response, 500, {
      error: "supabase_save_failed",
      message: redactSecret(error.message)
    });
  }
}

async function handleRecognizeImage(request, response) {
  const body = JSON.parse(await readRequestBody(request, 48 * 1024 * 1024));
  const images = normalizeImageDataUrls(body);
  if (!images.length) {
    sendJson(response, 400, { error: "missing_image", message: "Mindestens ein Bild wird benötigt." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (recognitionMode === "worker" || (!apiKey && recognitionMode === "hybrid")) {
    await queueImageRecognition(response, body, images);
    return;
  }
  if (!apiKey) {
    sendJson(response, 400, {
      error: "missing_openai_api_key",
      message: "OpenAI ist für die Schnellerkennung nicht konfiguriert."
    });
    return;
  }

  try {
    const result = await recognizeImageWithOpenAI(body, images, apiKey);
    sendJson(response, 200, result);
  } catch (error) {
    if (recognitionMode === "hybrid" && imageAnalysisMode === "worker") {
      await queueImageRecognition(response, body, images, {
        cloudError: error.code || "openai_unavailable"
      });
      return;
    }
    sendJson(response, error.status || 500, {
      error: error.code || "recognition_failed",
      message: redactSecret(error.message)
    });
  }
}

async function recognizeImageWithOpenAI(body, images, apiKey) {
  const startedAt = Date.now();
  const candidates = [...new Set([recognitionModel, recognitionFallbackModel].filter(Boolean))];
  let lastError;

  for (const candidate of candidates) {
    try {
      return await requestOpenAiRecognition(body, images, apiKey, candidate, startedAt);
    } catch (error) {
      lastError = error;
      if (!isUnavailableModelError(error) || candidate === candidates.at(-1)) throw error;
    }
  }

  throw lastError;
}

async function requestOpenAiRecognition(body, images, apiKey, candidateModel, startedAt) {
  const requestBody = {
    model: candidateModel,
    input: [{
      role: "user",
      content: [
        { type: "input_text", text: buildItemRecognitionPrompt() },
        ...images.map((imageUrl) => ({
          type: "input_image",
          image_url: imageUrl,
          detail: recognitionImageDetail
        }))
      ]
    }],
    max_output_tokens: 500,
    text: {
      ...(isGpt56Model(candidateModel) ? { verbosity: "low" } : {}),
      format: {
        type: "json_schema",
        name: "ramrod_fast_item_recognition",
        strict: true,
        schema: itemRecognitionSchema()
      }
    },
    ...(isGpt56Model(candidateModel)
      ? { reasoning: { effort: recognitionReasoningEffort } }
      : {})
  };
  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });
  const result = await openAiResponse.json();
  if (!openAiResponse.ok) {
    const error = new Error(result.error?.message || "OpenAI recognition failed");
    error.status = openAiResponse.status;
    error.code = result.error?.code || "openai_error";
    error.type = result.error?.type || "";
    throw error;
  }

  const recognition = scoreItemRecognition(extractJson(result), {
    imageCount: images.length,
    barcode: body.barcode,
    clientImageQualities: body.clientImageQualities
  });
  return {
    provider: "openai-fast",
    model: result.model || candidateModel,
    durationMs: Date.now() - startedAt,
    usage: result.usage || null,
    recognition
  };
}

function isUnavailableModelError(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "model_not_found"
    || (Number(error?.status) === 400 && /model|access|available/.test(message));
}

async function queueImageRecognition(response, body, images, metadata = {}) {
  if (!supabasePersistenceStatus().writable) {
    sendJson(response, 503, {
      error: "recognition_queue_not_configured",
      message: "Die lokale Schnellerkennung benötigt Supabase Storage und die Jobqueue."
    });
    return;
  }

  try {
    const customer = await getOrCreateCustomer();
    const storedImages = await Promise.all(images.map(uploadWorkerImage));
    const queued = await createWorkerJob({
      customerId: customer.id,
      jobType: "recognize_image",
      payload: {
        imageUrl: storedImages[0].signedUrl,
        imageUrls: storedImages.map((image) => image.signedUrl),
        imageStoragePaths: storedImages.map((image) => image.path),
        barcode: body.barcode || "",
        query: body.query || "",
        clientImageQualities: body.clientImageQualities || []
      },
      priority: 100,
      maxAttempts: 2,
      idempotencyKey: `image-recognition:${storedImages.map((image) => image.objectId).join(":")}`
    });
    sendJson(response, 202, {
      provider: "local-qwen-fast-worker",
      queued: true,
      fallbackReason: metadata.cloudError || null,
      job: mapWorkerJobToUi(queued.job)
    });
  } catch (error) {
    sendJson(response, 500, {
      error: "recognition_queue_failed",
      message: redactSecret(error.message)
    });
  }
}

async function handleAnalyzeImage(request, response) {
  const body = JSON.parse(await readRequestBody(request, 48 * 1024 * 1024));
  const images = normalizeImageDataUrls(body);
  if (!images.length) {
    sendJson(response, 400, { error: "missing_image", message: "Mindestens ein Bild wird benötigt." });
    return;
  }

  if (imageAnalysisMode === "worker") {
    await queueImageAnalysis(response, body, images);
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(response, 400, {
      error: "missing_openai_api_key",
      message: "Weder lokaler Bild-Worker noch OpenAI sind für die Bildanalyse konfiguriert."
    });
    return;
  }

  const requestBody = {
    model,
    input: [{
      role: "user",
      content: [
        { type: "input_text", text: buildItemAnalysisPrompt(body.recognition) },
        ...images.map((imageUrl) => ({
          type: "input_image",
          image_url: imageUrl,
          detail: liveImageDetail
        }))
      ]
    }],
    max_output_tokens: 4000,
    text: {
      ...(isGpt56Model(model) ? { verbosity: "low" } : {}),
      format: {
        type: "json_schema",
        name: "scanapp_live_item_analysis",
        strict: true,
        schema: sharedItemAnalysisSchema()
      }
    },
    ...(isGpt56Model(model) ? { reasoning: { effort: strategyReasoningEffort } } : {})
  };
  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });
  const result = await openAiResponse.json();

  if (!openAiResponse.ok) {
    sendJson(response, openAiResponse.status, {
      error: result.error?.code || "openai_error",
      message: redactSecret(result.error?.message || "OpenAI request failed")
    });
    return;
  }

  const analysis = applyAnalysisGuardrails(extractJson(result));
  const item = mapSharedAnalysisToItem(analysis, { ...body, imageDataUrl: images[0] }, {
    model,
    sourceType: "live_openai",
    researchSource: "OpenAI Query"
  });

  sendJson(response, 200, {
    provider: "openai-strategy",
    model: result.model || model,
    usage: result.usage || null,
    analysis,
    item
  });
}

async function queueImageAnalysis(response, body, images = normalizeImageDataUrls(body)) {
  if (!supabasePersistenceStatus().writable) {
    sendJson(response, 503, {
      error: "image_queue_not_configured",
      message: "Der lokale Bild-Worker benötigt Supabase Storage und die Jobqueue."
    });
    return;
  }

  try {
    const customer = await getOrCreateCustomer();
    const storedImages = await Promise.all(images.map(uploadWorkerImage));
    const queued = await createWorkerJob({
      customerId: customer.id,
      jobType: "analyze_image",
      payload: {
        imageUrl: storedImages[0].signedUrl,
        imageUrls: storedImages.map((image) => image.signedUrl),
        imageStoragePath: storedImages[0].path,
        imageStoragePaths: storedImages.map((image) => image.path),
        boxId: body.boxId || "SV-LIVE",
        condition: body.condition || "Gebraucht",
        completeness: body.completeness || "Ungeprueft",
        barcode: body.barcode || "",
        weight: numberOrNull(body.weight),
        recognition: body.recognition || null
      },
      priority: 90,
      maxAttempts: 2,
      idempotencyKey: `image-analysis:${storedImages.map((image) => image.objectId).join(":")}`
    });

    sendJson(response, 202, {
      provider: "local-qwen-worker",
      queued: true,
      job: mapWorkerJobToUi(queued.job)
    });
  } catch (error) {
    sendJson(response, 500, {
      error: "image_queue_failed",
      message: redactSecret(error.message)
    });
  }
}

function normalizeImageDataUrls(body) {
  const candidates = [
    ...(Array.isArray(body.imageDataUrls) ? body.imageDataUrls : []),
    body.imageDataUrl
  ].filter(Boolean);
  const unique = [...new Set(candidates)].slice(0, 4);
  return unique.filter((value) => /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(String(value)));
}

function isGpt56Model(value) {
  return /^gpt-5\.6(?:-|$)/.test(String(value || ""));
}

async function uploadWorkerImage(imageDataUrl) {
  const match = String(imageDataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Das Bild konnte nicht für den lokalen Worker vorbereitet werden.");

  const contentType = match[1];
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 15 * 1024 * 1024) {
    throw new Error("Das Bild ist leer oder groesser als 15 MB.");
  }

  const objectId = randomUUID();
  const extension = imageExtension(contentType);
  const date = new Date().toISOString().slice(0, 10);
  const path = `intake/${date}/${objectId}.${extension}`;
  const objectUrl = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(storageBucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;
  const headers = {
    apikey: supabaseServiceRoleKey,
    Authorization: `Bearer ${supabaseServiceRoleKey}`
  };

  const upload = await fetch(objectUrl, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": contentType,
      "Cache-Control": "3600",
      "x-upsert": "false"
    },
    body: bytes
  });
  if (!upload.ok) {
    const message = await upload.text();
    throw new Error(`Supabase image upload failed (${upload.status}): ${message.slice(0, 300)}`);
  }

  const sign = await fetch(`${supabaseUrl}/storage/v1/object/sign/${encodeURIComponent(storageBucket)}/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 })
  });
  const signed = await sign.json();
  if (!sign.ok || !(signed.signedURL || signed.signedUrl)) {
    throw new Error(`Supabase signed URL failed (${sign.status}).`);
  }

  const signedPath = signed.signedURL || signed.signedUrl;
  return {
    objectId,
    path,
    signedUrl: /^https?:\/\//.test(signedPath)
      ? signedPath
      : `${supabaseUrl}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`
  };
}

function imageExtension(contentType) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/heic" || contentType === "image/heif") return "heic";
  return "jpg";
}

async function handlePriceCheck(request, response) {
  const body = JSON.parse(await readRequestBody(request, 8 * 1024 * 1024));
  const item = body.item;

  if (!item?.sku || !item?.title) {
    sendJson(response, 400, {
      error: "missing_item",
      message: "item with sku and title is required."
    });
    return;
  }

  const priceCheck = await buildPriceCheck(item);
  const decision = reconcileSalesDecision(item, priceCheck);
  const decidedItem = {
    ...item,
    channel: decision.channel,
    whatnotEligible: decision.whatnotEligible,
    salesStrategy: decision.salesStrategy
  };
  const ebayDraft = decision.channel === "eBay" ? buildEbayDraft(decidedItem, priceCheck) : null;

  sendJson(response, 200, {
    provider: priceCheck.method,
    liveProviderAvailable: {
      ebayBrowse: Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
      ebayBrowseEnabled: ebayPriceProvider === "ebay-browse",
      serpApi: Boolean(process.env.SERPAPI_API_KEY),
      webResearch: Boolean(process.env.SERPAPI_API_KEY)
    },
    priceCheck,
    decision,
    ebayDraft
  });
}

async function handleEbayDraft(request, response) {
  const body = JSON.parse(await readRequestBody(request, 8 * 1024 * 1024));
  const item = body.item;

  if (!item?.sku || !item?.title) {
    sendJson(response, 400, {
      error: "missing_item",
      message: "item with sku and title is required."
    });
    return;
  }

  sendJson(response, 200, {
    provider: "local-draft",
    ebayDraft: buildEbayDraft(item, item.priceCheck || null)
  });
}

async function buildPriceCheck(item) {
  const liveEvidence = [];
  const notes = [];
  let ebayFailed = "";
  let webFailed = "";

  if (ebayPriceProvider === "ebay-browse") {
    try {
      const evidence = await fetchEbayBrowseEvidence(item);
      if (evidence.length) {
        liveEvidence.push(...evidence);
        notes.push("Live-eBay-Browse-Preischeck aus aktiven eBay-Angeboten.");
      } else {
        notes.push("eBay Browse wurde abgefragt, lieferte aber keine verwertbaren aktiven Treffer.");
      }
    } catch (error) {
      ebayFailed = redactSecret(error.message);
      notes.push(`eBay Browse nicht verfuegbar: ${ebayFailed}.`);
    }
  }

  if (process.env.SERPAPI_API_KEY) {
    try {
      const webEvidence = await fetchSerpApiEbayEvidence(item);
      if (webEvidence.length) {
        liveEvidence.push(...webEvidence);
        notes.push("Web Research ueber SerpApi wurde in die Preisberechnung einbezogen.");
      } else {
        notes.push("Web Research ueber SerpApi lieferte keine verwertbaren Treffer.");
      }
    } catch (error) {
      webFailed = redactSecret(error.message);
      notes.push(`Web Research nicht verfuegbar: ${webFailed}.`);
    }
  } else {
    notes.push("Web Research ist vorbereitet, aber SERPAPI_API_KEY ist noch nicht gesetzt.");
  }

  if (liveEvidence.length) {
    const hasEbay = liveEvidence.some((entry) => entry.source === "eBay Browse");
    const hasWeb = liveEvidence.some((entry) => entry.source?.startsWith("SerpApi"));
    const method = hasEbay && hasWeb ? "multi-source" : hasWeb ? "web-research" : "ebay-browse";
    return buildPriceCheckFromEvidence(item, liveEvidence, method, [
      ...notes,
      "Finaler Preis bleibt Review-pflichtig."
    ]);
  }

  const fallback = buildLocalPriceCheck(item);
  fallback.notes = [
    ...notes,
    ebayFailed || webFailed
      ? "Keine Live-Quelle konnte verwertbare Treffer liefern; lokaler Fallback genutzt."
      : "Keine Live-Quelle aktiv; lokaler Fallback genutzt.",
    "Weitere Quellen wie SerpApi, PriceCharting oder Kategorie-spezifische Adapter koennen die Trefferquote verbessern."
  ];
  return fallback;
}

function buildLocalPriceCheck(item) {
  const evidence = normalizeResearch(item)
    .filter((entry) => Number(entry.price) > 0)
    .map((entry, index) => ({
      source: entry.source || "RAMROD",
      title: entry.label || item.title,
      price: Math.round(Number(entry.price)),
      status: entry.source?.toLowerCase().includes("sold") ? "sold_hint" : "active_or_hint",
      age: entry.age || "unbekannt",
      matchScore: Math.max(52, Math.min(96, Math.round((Number(item.confidence) || 70) - index * 7)))
    }));

  if (!evidence.length) {
    evidence.push(
      { source: "RAMROD", title: "KI Low Estimate", price: Math.round(Number(item.low) || 1), status: "model_hint", age: "jetzt", matchScore: 56 },
      { source: "RAMROD", title: "KI Fair Estimate", price: Math.round(Number(item.fair) || 1), status: "model_hint", age: "jetzt", matchScore: 62 },
      { source: "RAMROD", title: "KI Aggressive Estimate", price: Math.round(Number(item.aggressive) || Number(item.fair) || 1), status: "model_hint", age: "jetzt", matchScore: 50 }
    );
  }

  return buildPriceCheckFromEvidence(item, evidence, "local-evidence", [
    "Lokaler Preischeck aus vorhandenen RAMROD-Hinweisen.",
    "Noch keine Live-eBay-Abfrage.",
    "Live-Provider wird spaeter ueber eBay Browse oder SerpApi aktiviert."
  ]);
}

function buildPriceCheckFromEvidence(item, evidence, method, notes) {
  const markedEvidence = markPriceOutliers(evidence);
  const usableEvidence = markedEvidence.filter((entry) => !entry.outlier);
  const prices = usableEvidence.map((entry) => entry.price).sort((a, b) => a - b);
  const median = percentile(prices, 0.5);
  const average = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  const fair = Math.round((median * 0.6) + (average * 0.4));
  const variance = Math.max(...prices) - Math.min(...prices);
  const baseConfidence = Math.round((Number(item.confidence) || 65) + Math.min(12, evidence.length * 3) - Math.min(22, variance / Math.max(1, fair) * 20));
  const evidenceCap = method === "ebay-browse" || method === "web-research" || method === "multi-source"
    ? (usableEvidence.length === 1 ? 62 : usableEvidence.length === 2 ? 72 : 94)
    : 94;
  const confidence = Math.max(35, Math.min(evidenceCap, baseConfidence));
  const finalNotes = [
    ...notes,
    ...(["ebay-browse", "web-research", "multi-source"].includes(method) && usableEvidence.length < 3
      ? ["Nur wenige Live-Treffer gefunden; Preis als Indikation, nicht als belastbarer Marktwert."]
      : []),
    ...(markedEvidence.some((entry) => entry.outlier)
      ? ["Ausreisser wurden in der Preisberechnung markiert und nicht gewichtet."]
      : [])
  ];

  return {
    checkedAt: new Date().toISOString(),
    method,
    query: buildSearchQuery(item),
    low: Math.max(1, Math.round(percentile(prices, 0.1) * 0.9)),
    fair,
    aggressive: Math.max(fair, Math.round(percentile(prices, 0.8) * 1.08)),
    confidence,
    previous: {
      low: numberOrNull(item.low),
      fair: numberOrNull(item.fair),
      aggressive: numberOrNull(item.aggressive),
      confidence: clampNumber(item.confidence, 0, 100, 0)
    },
    calculation: {
      basis: priceCheckBasis(method),
      formula: "Marktwert = 60% Median + 40% Durchschnitt; Preisspanne aus 10. bis 80. Perzentil",
      usableCount: usableEvidence.length,
      outlierCount: markedEvidence.filter((entry) => entry.outlier).length,
      median,
      average,
      minComparable: Math.min(...prices),
      maxComparable: Math.max(...prices)
    },
    evidence: representativeEvidence(markedEvidence, 6),
    notes: finalNotes
  };
}

function priceCheckBasis(method) {
  if (method === "multi-source") return "eBay + Web Research";
  if (method === "web-research") return "Web Research";
  if (method === "ebay-browse") return "aktive eBay-Angebote";
  return "lokale RAMROD-Hinweise";
}

function markPriceOutliers(evidence) {
  if (evidence.length < 4) return evidence;

  const prices = evidence.map((entry) => entry.price).filter((price) => Number(price) > 0).sort((a, b) => a - b);
  const q1 = percentile(prices, 0.25);
  const median = percentile(prices, 0.5);
  const q3 = percentile(prices, 0.75);
  const iqr = Math.max(1, q3 - q1);
  const lower = Math.max(1, q1 - (1.5 * iqr));
  const upper = Math.max(q3, Math.min(q3 + (1.5 * iqr), median * 3));

  return evidence.map((entry) => {
    const outlier = entry.price < lower || entry.price > upper;
    return outlier
      ? { ...entry, status: `${entry.status}_outlier`, matchScore: Math.min(entry.matchScore, 35), outlier: true }
      : entry;
  });
}

function percentile(sortedValues, fraction) {
  if (!sortedValues.length) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  const position = (sortedValues.length - 1) * fraction;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  if (lowerIndex === upperIndex) return sortedValues[lowerIndex];
  const weight = position - lowerIndex;
  return Math.round(sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight);
}

function representativeEvidence(evidence, limit) {
  const selected = [];
  const bySource = new Map();
  for (const entry of evidence) {
    const source = entry.source || "unknown";
    if (!bySource.has(source)) bySource.set(source, []);
    bySource.get(source).push(entry);
  }

  for (const entries of bySource.values()) {
    if (selected.length >= limit) break;
    selected.push(entries[0]);
  }

  for (const entry of evidence) {
    if (selected.length >= limit) break;
    if (!selected.includes(entry)) selected.push(entry);
  }

  return selected;
}

async function fetchEbayBrowseEvidence(item) {
  const token = await getEbayAppToken();
  const baseUrl = ebayApiBaseUrl();
  const marketplaceId = process.env.EBAY_MARKETPLACE_ID || "EBAY_DE";
  const results = [];
  for (const query of buildSearchQueries(item).slice(0, 3)) {
    const url = new URL(`${baseUrl}/buy/browse/v1/item_summary/search`);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "10");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
        "Accept-Language": "de-DE"
      }
    });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.errors?.[0]?.message || body.message || `eBay Browse HTTP ${response.status}`);
    }

    results.push(...(body.itemSummaries || [])
      .filter((entry) => Number(entry.price?.value) > 0)
      .map((entry, index) => ({
        source: "eBay Browse",
        title: entry.title || item.title,
        price: Math.round(Number(entry.price.value)),
        status: "active_listing",
        age: entry.itemCreationDate ? new Date(entry.itemCreationDate).toLocaleDateString("de-DE") : "live",
        matchScore: Math.max(48, Math.min(94, Math.round((Number(item.confidence) || 70) - index * 4))),
        url: entry.itemWebUrl || "",
        query
      })));

    if (results.length >= 8) break;
  }

  return uniqueEvidence(results).slice(0, 12);
}

async function fetchSerpApiEbayEvidence(item) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return [];

  const queries = buildSearchQueries(item).slice(0, 3);
  const searches = queries.flatMap((query) => [
    fetchSerpApiEbaySearch(item, query, "Sold"),
    fetchSerpApiEbaySearch(item, query, "")
  ]);
  const settled = await Promise.allSettled(searches);
  const failures = settled.filter((result) => result.status === "rejected");
  const evidence = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);

  if (!evidence.length && failures.length) {
    throw new Error(failures[0].reason?.message || "SerpApi returned no usable results.");
  }

  return uniqueEvidence(evidence).slice(0, 12);
}

async function fetchSerpApiEbaySearch(item, query, showOnly) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "ebay");
  url.searchParams.set("ebay_domain", "ebay.de");
  url.searchParams.set("_nkw", query);
  url.searchParams.set("_ipg", "25");
  url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);
  if (showOnly) url.searchParams.set("show_only", showOnly);

  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error || `SerpApi HTTP ${response.status}`);
  }

  return (body.organic_results || [])
    .map((entry, index) => {
      const price = extractSerpApiPrice(entry.price);
      if (!price) return null;
      const sold = Boolean(entry.sold_date || showOnly === "Sold");
      return {
        source: sold ? "SerpApi eBay Sold" : "SerpApi eBay Web",
        title: entry.title || item.title,
        price: Math.round(price),
        status: sold ? "sold_listing" : "active_web_listing",
        age: entry.sold_date || entry.condition || entry.quantity_sold || "web",
        matchScore: Math.max(44, Math.min(88, Math.round((Number(item.confidence) || 70) - index * 3 + (sold ? 6 : 0)))),
        url: entry.link || "",
        webResearch: true,
        query
      };
    })
    .filter(Boolean);
}

function uniqueEvidence(evidence) {
  const seen = new Set();
  return evidence.filter((entry) => {
    const key = entry.url || `${entry.source}:${entry.title}:${entry.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractSerpApiPrice(price) {
  if (!price) return 0;
  if (Number(price.extracted) > 0) return Number(price.extracted);
  if (Number(price.from?.extracted) > 0 && Number(price.to?.extracted) > 0) {
    return (Number(price.from.extracted) + Number(price.to.extracted)) / 2;
  }
  if (Number(price.from?.extracted) > 0) return Number(price.from.extracted);
  if (Number(price.to?.extracted) > 0) return Number(price.to.extracted);
  return 0;
}

async function getEbayAppToken() {
  const now = Date.now();
  if (ebayAppTokenCache && ebayAppTokenCache.expiresAt > now + 60_000) {
    return ebayAppTokenCache.token;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID and EBAY_CLIENT_SECRET are required for eBay Browse.");
  }

  const baseUrl = ebayApiBaseUrl();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "https://api.ebay.com/oauth/api_scope"
  });

  const response = await fetch(`${baseUrl}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error_description || result.error || `eBay OAuth HTTP ${response.status}`);
  }

  ebayAppTokenCache = {
    token: result.access_token,
    expiresAt: now + Number(result.expires_in || 7200) * 1000
  };

  return ebayAppTokenCache.token;
}

function ebayApiBaseUrl() {
  return (process.env.EBAY_ENV || "sandbox").toLowerCase() === "production"
    ? "https://api.ebay.com"
    : "https://api.sandbox.ebay.com";
}

function buildEbayDraft(item, priceCheck = null) {
  const fair = Number(priceCheck?.fair || item.fair || 1);
  const title = clampText(cleanTitle(item.title), 80);
  const description = [
    `<p><strong>${escapeHtml(title)}</strong></p>`,
    `<p>Zustand: ${escapeHtml(item.condition || "Gebraucht")}</p>`,
    `<p>Vollstaendigkeit: ${escapeHtml(item.completeness || "siehe Fotos")}</p>`,
    item.notes ? `<p>Hinweise: ${escapeHtml(item.notes)}</p>` : "",
    `<p>SKU: ${escapeHtml(item.sku)}</p>`,
    "<p>Bitte Fotos genau pruefen. Verkauf erfolgt aus dem CREATORS RAMROD Intake.</p>"
  ].filter(Boolean).join("");

  return {
    status: "draft_only",
    sku: item.sku,
    marketplaceId: process.env.EBAY_MARKETPLACE_ID || "EBAY_DE",
    inventoryItem: {
      sku: item.sku,
      availability: {
        shipToLocationAvailability: { quantity: 1 }
      },
      condition: mapEbayCondition(item.condition),
      product: {
        title,
        description,
        imageUrls: item.image?.startsWith("http") ? [item.image] : [],
        aspects: {
          Brand: [item.franchise || "Unbekannt"],
          Type: [item.category || "Collectible"],
          ConditionNotes: [item.completeness || item.condition || "siehe Fotos"]
        }
      }
    },
    offerDraft: {
      marketplaceId: process.env.EBAY_MARKETPLACE_ID || "EBAY_DE",
      format: "FIXED_PRICE",
      availableQuantity: 1,
      categoryId: "TODO_TAXONOMY_LOOKUP",
      merchantLocationKey: process.env.EBAY_MERCHANT_LOCATION_KEY || "creators-warehouse-01",
      listingDescription: description,
      pricingSummary: {
        price: { value: fair.toFixed(2), currency: "EUR" }
      },
      listingPolicies: {
        paymentPolicyId: process.env.EBAY_PAYMENT_POLICY_ID || "TODO_PAYMENT_POLICY_ID",
        fulfillmentPolicyId: process.env.EBAY_FULFILLMENT_POLICY_ID || "TODO_FULFILLMENT_POLICY_ID",
        returnPolicyId: process.env.EBAY_RETURN_POLICY_ID || "TODO_RETURN_POLICY_ID"
      }
    },
    warnings: [
      "Noch nicht an eBay gesendet.",
      "Kategorie und Business Policies muessen vor Publish gesetzt sein.",
      "Bilder als Data-URL muessen vor eBay Upload extern gehostet oder per Media API verarbeitet werden."
    ]
  };
}

function normalizeResearch(item) {
  return (item.research || []).map((entry) => {
    if (Array.isArray(entry)) {
      return { source: entry[0], label: entry[1], price: entry[2], age: entry[3] };
    }
  return entry;
  });
}

function supabasePersistenceStatus() {
  return {
    configured: Boolean(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)),
    writable: Boolean(supabaseUrl && supabaseServiceRoleKey),
    projectUrl: supabaseUrl || null
  };
}

async function supabaseSelect(path) {
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  return supabaseRequest(path, { method: "GET" }, key);
}

async function supabaseInsert(path, payload) {
  return supabaseRequest(path, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload)
  }, supabaseServiceRoleKey);
}

async function supabaseUpsert(path, payload) {
  return supabaseRequest(path, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(payload)
  }, supabaseServiceRoleKey);
}

async function supabaseRequest(path, options = {}, key) {
  if (!supabaseUrl || !key) {
    throw new Error("Supabase URL/key missing.");
  }

  const url = new URL(`/rest/v1${path}`, supabaseUrl);
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(body?.message || body?.msg || body?.code || `Supabase HTTP ${response.status}`);
  }

  return body || [];
}

async function getOrCreateCustomer() {
  const customers = await supabaseSelect("/customers?select=id,name,slug&slug=eq.strongvision&limit=1");
  if (customers[0]) return customers[0];
  const rows = await supabaseInsert("/customers", {
    name: "Strongvision",
    slug: "strongvision",
    notes: "Pilotkunde fuer RAMROD Intake"
  });
  return rows[0];
}

async function getBoxByCode(customerId, code) {
  const rows = await supabaseSelect(`/boxes?select=id,code,label,location,status,customer_id&customer_id=eq.${encodeURIComponent(customerId)}&code=eq.${encodeURIComponent(code)}&limit=1`);
  if (rows[0]) return rows[0];
  const inserted = await supabaseInsert("/boxes", {
    customer_id: customerId,
    code,
    label: code,
    location: "CREATORS",
    status: "intake"
  });
  return inserted[0];
}

function mapDbBoxToUi(box) {
  return {
    id: box.code,
    dbId: box.id,
    label: box.label || box.code,
    location: box.location || "CREATORS",
    stage: box.status || "intake"
  };
}

function mapUiItemToDb(item, customer, box) {
  const payload = {
    customer_id: customer.id,
    box_id: box?.id || null,
    sku: item.sku,
    title: item.title,
    category: item.category || null,
    franchise: item.franchise || null,
    condition: item.condition || null,
    completeness: item.completeness || null,
    confidence: clampNumber(item.confidence, 0, 100, 0),
    price_low: numberOrNull(item.low),
    price_fair: numberOrNull(item.fair),
    price_aggressive: numberOrNull(item.aggressive),
    weight_kg: numberOrNull(item.weight),
    primary_channel: item.channel || "Pruefen",
    status: item.stage || "scanned",
    source_type: item.sourceType || "scanapp",
    notes: item.notes || null,
    raw_analysis: {
      uiItem: item,
      image: item.image || "",
      research: item.research || [],
      whatnot: {
        eligible: Boolean(item.whatnotEligible),
        channel: item.whatnotChannel || "",
        channelLabel: item.whatnotChannelLabel || "",
        campaignId: item.campaignId || "",
        campaignSuggestion: item.campaignSuggestion || "",
        showLotType: item.showLotType || "",
        sortOrderScore: item.sortOrderScore || 0,
        bundleSuggestion: item.bundleSuggestion || "",
        script: item.whatnotScript || ""
      },
      listingDraft: item.listingDraft || null,
      ebayDraft: item.ebayDraft || null
    }
  };
  if (multiTenantSchemaAvailable !== false) {
    Object.assign(payload, {
      owner_organization_id: item.ownerOrganizationId || customer.id,
      operator_organization_id: item.operatorOrganizationId || customer.id,
      seller_profile_id: item.sellerProfileId || null,
      location_id: item.locationId || null,
      consignment_contract_id: item.consignmentContractId || null
    });
  }
  return payload;
}

function mapDbItemToUi(row, boxes = [], latestPriceJob = null) {
  const raw = row.raw_analysis || {};
  const ui = raw.uiItem || {};
  const box = boxes.find((entry) => entry.id === row.box_id || entry.dbId === row.box_id);
  const whatnot = raw.whatnot || {};
  const completedPriceCheck = latestPriceJob?.status === "succeeded"
    ? latestPriceJob.result?.priceCheck || null
    : null;
  const completedEbayDraft = latestPriceJob?.status === "succeeded"
    ? latestPriceJob.result?.ebayDraft || null
    : null;
  const completedDecision = latestPriceJob?.status === "succeeded"
    ? latestPriceJob.result?.decision || null
    : null;

  return {
    ...ui,
    id: ui.id || row.id,
    dbId: row.id,
    organizationId: row.customer_id,
    ownerOrganizationId: row.owner_organization_id || row.customer_id,
    operatorOrganizationId: row.operator_organization_id || row.customer_id,
    sellerProfileId: row.seller_profile_id || "",
    locationId: row.location_id || "",
    consignmentContractId: row.consignment_contract_id || "",
    sku: row.sku,
    boxId: ui.boxId || box?.code || box?.id || "SV-001",
    title: row.title,
    category: row.category || ui.category || "",
    franchise: row.franchise || ui.franchise || "",
    condition: row.condition || ui.condition || "Gebraucht",
    completeness: row.completeness || ui.completeness || "siehe Fotos",
    confidence: Number(row.confidence || ui.confidence || 0),
    low: Number(row.price_low ?? ui.low ?? 0),
    fair: Number(row.price_fair ?? ui.fair ?? 0),
    aggressive: Number(row.price_aggressive ?? ui.aggressive ?? 0),
    channel: row.primary_channel || ui.channel || "Pruefen",
    stage: row.status || ui.stage || "Gescannt",
    weight: Number(row.weight_kg ?? ui.weight ?? 0),
    image: shopImageUrl(ui.image || raw.image || "https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=900&q=80"),
    notes: row.notes || ui.notes || "",
    sourceType: row.source_type || ui.sourceType || "supabase",
    research: raw.research || ui.research || [],
    whatnotEligible: Boolean(whatnot.eligible ?? ui.whatnotEligible),
    whatnotChannel: whatnot.channel || ui.whatnotChannel || "",
    whatnotChannelLabel: whatnot.channelLabel || ui.whatnotChannelLabel || "",
    campaignId: whatnot.campaignId || ui.campaignId || "",
    campaignSuggestion: whatnot.campaignSuggestion || ui.campaignSuggestion || "",
    showLotType: whatnot.showLotType || ui.showLotType || "",
    sortOrderScore: Number(whatnot.sortOrderScore || ui.sortOrderScore || 0),
    bundleSuggestion: whatnot.bundleSuggestion || ui.bundleSuggestion || "",
    whatnotScript: whatnot.script || ui.whatnotScript || "",
    salesStrategy: completedDecision?.salesStrategy || ui.salesStrategy || null,
    salesDecision: completedDecision || ui.salesDecision || null,
    listingDraft: raw.listingDraft || ui.listingDraft || null,
    ebayDraft: completedEbayDraft || raw.ebayDraft || ui.ebayDraft || null,
    priceCheck: completedPriceCheck || ui.priceCheck || null,
    automationJob: latestPriceJob ? mapWorkerJobToUi(latestPriceJob) : ui.automationJob || null
  };
}

function mapWorkerJobToUi(job) {
  return {
    id: job.id,
    status: job.status,
    attempts: Number(job.attempts || 0),
    maxAttempts: Number(job.max_attempts || 0),
    createdAt: job.created_at || null,
    updatedAt: job.updated_at || null,
    error: job.error || null
  };
}

function buildPriceCheckJobItem(item, dbId) {
  return {
    dbId,
    id: item.id || dbId,
    sku: item.sku,
    title: item.title,
    category: item.category || "",
    franchise: item.franchise || "",
    condition: item.condition || "",
    completeness: item.completeness || "",
    confidence: clampNumber(item.confidence, 0, 100, 0),
    low: numberOrNull(item.low),
    fair: numberOrNull(item.fair),
    aggressive: numberOrNull(item.aggressive),
    weight: numberOrNull(item.weight),
    channel: item.channel || "Pruefen",
    notes: item.notes || "",
    sourceType: item.sourceType || "scanapp",
    research: Array.isArray(item.research) ? item.research : []
  };
}

function mapUiPriceCheckToDb(itemId, priceCheck) {
  return {
    item_id: itemId,
    method: priceCheck.method || "unknown",
    query: priceCheck.query || null,
    low: numberOrNull(priceCheck.low),
    fair: numberOrNull(priceCheck.fair),
    aggressive: numberOrNull(priceCheck.aggressive),
    confidence: clampNumber(priceCheck.confidence, 0, 100, 0),
    evidence: priceCheck.evidence || [],
    notes: priceCheck.notes || [],
    checked_at: priceCheck.checkedAt || new Date().toISOString()
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function validIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function validHttpsUrl(value) {
  try {
    return new URL(String(value || "")).protocol === "https:";
  } catch {
    return false;
  }
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function buildSearchQuery(item) {
  return buildSearchQueries(item)[0];
}

function buildSearchQueries(item) {
  const haystack = [item.title, item.franchise, item.category, item.completeness, item.notes]
    .filter(Boolean)
    .join(" ");
  const platform = extractPlatform(haystack);
  const title = extractComparableTitle(item.title || haystack, platform);
  const cleanOriginal = normalizeSearchText(item.title || haystack);
  const category = normalizeSearchText(item.category || "");

  return uniqueStrings([
    [title, platform].filter(Boolean).join(" "),
    [title, platform, "gebraucht"].filter(Boolean).join(" "),
    [title, platform, "PAL"].filter(Boolean).join(" "),
    cleanOriginal,
    [title, category].filter(Boolean).join(" ")
  ])
    .map((query) => clampText(query, 80))
    .filter((query) => query.length >= 3);
}

function extractComparableTitle(value, platform = "") {
  const text = normalizeSearchText(value);
  const afterLabel = text.match(/\b(?:spiel|game|titel)\s*:?\s+(.+)$/i);
  let title = afterLabel ? afterLabel[1] : text;

  title = title
    .replace(/\([^)]*(?:dreamcast|xbox|playstation|ps\s*[2-5]|nintendo|gamecube|wii|pal|ntsc|release|wahrscheinlich|ausgabe)[^)]*\)/gi, " ")
    .replace(/\([^)]*(?:electronic arts|bioware|ubisoft|capcom|nintendo|sony|microsoft|sega|bethesda)[^)]*\)/gi, " ")
    .replace(/\b(?:electronic arts|bioware|ubisoft|capcom|nintendo|sony|microsoft|sega|bethesda)\b/gi, " ")
    .replace(/\b(?:videospiel|spiel|game|games|gebraucht|preis|deutschland|ebay|komplett|mit anleitung|pal|usk\s*\d+)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (platform) {
    title = title.replace(new RegExp(platform.replace(/\s+/g, "\\s*"), "ig"), " ").replace(/\s+/g, " ").trim();
  }

  const colonParts = title.split(/\s*:\s*/).filter(Boolean);
  if (colonParts.length > 1) title = colonParts[colonParts.length - 1];

  return title || normalizeSearchText(value);
}

function extractPlatform(value) {
  const text = normalizeSearchText(value).toLowerCase();
  const matches = [
    [/xbox\s*360/, "Xbox 360"],
    [/xbox\s*one/, "Xbox One"],
    [/xbox\s*series\s*x/, "Xbox Series X"],
    [/\bps5\b|playstation\s*5/, "PS5"],
    [/\bps4\b|playstation\s*4/, "PS4"],
    [/\bps3\b|playstation\s*3/, "PS3"],
    [/\bps2\b|playstation\s*2/, "PS2"],
    [/nintendo\s*switch/, "Nintendo Switch"],
    [/\b3ds\b|nintendo\s*3ds/, "Nintendo 3DS"],
    [/\bds\b|nintendo\s*ds/, "Nintendo DS"],
    [/dreamcast/, "Dreamcast"],
    [/gamecube/, "GameCube"],
    [/wii\s*u/, "Wii U"],
    [/\bwii\b/, "Wii"]
  ];
  return matches.find(([pattern]) => pattern.test(text))?.[1] || "";
}

function normalizeSearchText(value) {
  return String(value || "")
    .replace(/[^\p{L}\p{N}:+/(). -]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values) {
  const seen = new Set();
  return values
    .map((value) => normalizeSearchText(value))
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function cleanTitle(value) {
  return String(value || "Sammlerartikel").replace(/\s+/g, " ").trim();
}

function clampText(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trim()}...`;
}

function mapEbayCondition(value = "") {
  const text = value.toLowerCase();
  if (text.includes("neu")) return "NEW";
  if (text.includes("defekt")) return "FOR_PARTS_OR_NOT_WORKING";
  if (text.includes("sehr gut")) return "USED_EXCELLENT";
  if (text.includes("gut")) return "USED_GOOD";
  return "USED_ACCEPTABLE";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function serveStatic(request, response) {
  const url = new URL(request.url, "http://localhost");
  const requestHost = String(request.headers.host || "").split(":")[0].toLowerCase();
  const publicShopHost = shopHostRouting && (requestHost === "ramrod.live" || requestHost === "www.ramrod.live");
  const pathname = url.pathname === "/"
    ? (publicShopHost ? "/shop.html" : "/index.html")
    : (["/shop", "/shop/"].includes(url.pathname)
      ? "/shop.html"
      : (["/admin", "/admin/"].includes(url.pathname) ? "/index.html" : url.pathname));
  const filePath = resolve(root, normalize(pathname).replace(/^\/+/, ""));

  if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    sendJson(response, 404, { error: "not_found" });
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store"
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  response.end(readFileSync(filePath));
}

function readRequestBody(request, limit) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > limit) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function extractJson(body) {
  if (typeof body.output_text === "string") return JSON.parse(body.output_text);
  const text = body.output
    ?.flatMap((entry) => entry.content || [])
    ?.find((part) => part.type === "output_text")?.text;
  if (!text) throw new Error("Could not find output_text in OpenAI response");
  return JSON.parse(text);
}

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function redactSecret(value) {
  return String(value).replace(/(?:sk|k)-proj-[A-Za-z0-9_-]+/g, "[redacted-api-key]");
}
