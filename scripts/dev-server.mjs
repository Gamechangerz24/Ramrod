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
  normalizeVisualSearchMatches,
  scoreItemRecognition
} from "./lib/item-recognition.mjs";
import { channelRegistryVersion, publicChannelRegistry } from "./lib/channel-registry.mjs";
import {
  estimatePriceFromEvidence,
  evaluateComparableEvidence
} from "./lib/price-evidence.mjs";
import { reconcileSalesDecision } from "./lib/sales-decision.mjs";
import {
  buildAgentPlan,
  buildApprovalSummary,
  buildTelegramApprovalMessage,
  isUuid,
  parseTelegramApprovalCallback,
  publicAgentPlaybooks,
  redactAgentPayload,
  telegramApprovalKeyboard
} from "./lib/agent-control.mjs";
import {
  buildEbayConsentUrl,
  createEbayOAuthState,
  ebayOAuthConfig,
  ebayOAuthReadiness,
  ensureFreshEbayCredentials,
  exchangeEbayAuthorizationCode,
  inspectEbaySellerSetup,
  mapEbayTokenResponse,
  verifyEbayOAuthState
} from "./lib/ebay-oauth.mjs";
import {
  buildEbayListingPreview,
  buildEbayListingPrompt,
  buildFallbackEbayContent,
  createEbayOffer,
  createOrReplaceEbayInventoryItem,
  ebayListingContentSchema,
  getEbayCategoryAspects,
  normalizeEbayListingContent,
  publishEbayOffer,
  suggestEbayCategory,
  uploadEbayImageFromDataUrl,
  uploadEbayImageFromUrl
} from "./lib/ebay-listing.mjs";
import {
  buildSecretRef,
  createEncryptedSecretStore
} from "./lib/secret-store.mjs";
import {
  buildPrivateEbaySellerSetup,
  createMissingEbaySellerDefaults
} from "./lib/ebay-seller-setup.mjs";
import {
  getTradingEbayUser,
  publishTradingEbayItem,
  verifyTradingEbayItem
} from "./lib/ebay-trading-listing.mjs";
import {
  canAssignOrganizationRole,
  createInvitationToken,
  hashInvitationToken,
  hasOrganizationPermission,
  invitationExpiresAt,
  normalizeInvitationEmail,
  normalizeOrganizationRole,
  permissionsForRole
} from "./lib/workspace-access.mjs";
import {
  aggregateRecognitionFeedback,
  correctedIdentitySignature,
  recognitionFingerprint,
  scopeAllowsCollectionItem
} from "./lib/recognition-learning.mjs";
import {
  buildPhotoGroupingPrompt,
  normalizePhotoGroups,
  photoGroupingSchema
} from "./lib/photo-grouping.mjs";

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
const agentApiToken = process.env.RAMROD_AGENT_TOKEN || "";
const telegramBotToken = process.env.RAMROD_TELEGRAM_BOT_TOKEN || "";
const telegramWebhookSecret = process.env.RAMROD_TELEGRAM_WEBHOOK_SECRET || "";
const telegramApprovalChatId = String(process.env.RAMROD_TELEGRAM_APPROVAL_CHAT_ID || "").trim();
const telegramAllowedChatIds = new Set(
  String(process.env.RAMROD_TELEGRAM_ALLOWED_CHAT_IDS || telegramApprovalChatId)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
);
const authRequired = String(process.env.AUTH_REQUIRED || "false").toLowerCase() === "true";
const selfServiceSignup = String(process.env.RAMROD_SELF_SERVICE_SIGNUP || "true").toLowerCase() !== "false";
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
const automaticPriceCheckSources = new Set(["live_openai", "live_recognition", "batch_openai", "local_qwen", "vault-handoff"]);
const publicAppUrl = String(process.env.RAMROD_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
const ebaySellerOAuthConfig = ebayOAuthConfig(process.env);
const credentialStore = createEncryptedSecretStore();
let ebayAppTokenCache = null;
let multiTenantSchemaAvailable = null;
let lastAgentMaintenanceAt = 0;

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
        selfServiceSignup,
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
          serpApi: Boolean(process.env.SERPAPI_API_KEY),
          googleLens: Boolean(process.env.SERPAPI_API_KEY),
          telegramApprovals: Boolean(telegramBotToken && telegramWebhookSecret && telegramApprovalChatId),
          agentControl: Boolean(agentApiToken)
        },
        agentPlaybooks: publicAgentPlaybooks()
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/shop/catalog") {
      await handleShopCatalog(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/telegram/webhook") {
      await handleTelegramWebhook(request, response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/ebay/oauth/callback") {
      await handleEbayOAuthCallback(request, response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/ebay/oauth/declined") {
      sendEbayOAuthResult(response, {
        ok: false,
        title: "eBay-Verbindung abgebrochen",
        message: "Es wurde nichts geändert. Du kannst die Verbindung jederzeit erneut starten."
      });
      return;
    }

    const invitationPreviewMatch = /^\/api\/invitations\/([A-Za-z0-9_-]{40,100})$/i.exec(pathname);
    if (request.method === "GET" && invitationPreviewMatch) {
      await handleInvitationPreview(response, invitationPreviewMatch[1]);
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

    if (request.method === "POST" && pathname === "/api/onboarding/organizations") {
      await handleSelfServiceOrganization(request, response);
      return;
    }

    const invitationAcceptMatch = /^\/api\/invitations\/([A-Za-z0-9_-]{40,100})\/accept$/i.exec(pathname);
    if (request.method === "POST" && invitationAcceptMatch) {
      await handleAcceptInvitation(request, response, invitationAcceptMatch[1]);
      return;
    }

    if (request.method === "GET" && pathname === "/api/organization-team") {
      await handleOrganizationTeam(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/recognition-feedback") {
      await handleRecognitionFeedback(request, response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/collection-network") {
      await handleCollectionNetwork(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/collection-shares") {
      await handleCreateCollectionShare(request, response);
      return;
    }

    const collectionShareActionMatch = /^\/api\/collection-shares\/([0-9a-f-]{36})\/(revoke)$/i.exec(pathname);
    if (request.method === "POST" && collectionShareActionMatch) {
      await handleCollectionShareAction(request, response, collectionShareActionMatch[1], collectionShareActionMatch[2]);
      return;
    }

    if (request.method === "POST" && pathname === "/api/collection-access-requests") {
      await handleCreateCollectionAccessRequest(request, response);
      return;
    }

    const collectionAccessActionMatch = /^\/api\/collection-access-requests\/([0-9a-f-]{36})\/(approve|decline|cancel)$/i.exec(pathname);
    if (request.method === "POST" && collectionAccessActionMatch) {
      await handleCollectionAccessRequestAction(request, response, collectionAccessActionMatch[1], collectionAccessActionMatch[2]);
      return;
    }

    if (request.method === "POST" && pathname === "/api/collection-loan-requests") {
      await handleCreateCollectionLoanRequest(request, response);
      return;
    }

    const collectionLoanActionMatch = /^\/api\/collection-loan-requests\/([0-9a-f-]{36})\/(approve|decline|return|cancel)$/i.exec(pathname);
    if (request.method === "POST" && collectionLoanActionMatch) {
      await handleCollectionLoanRequestAction(request, response, collectionLoanActionMatch[1], collectionLoanActionMatch[2]);
      return;
    }

    if (request.method === "POST" && pathname === "/api/organization-invitations") {
      await handleCreateOrganizationInvitation(request, response);
      return;
    }

    const invitationActionMatch = /^\/api\/organization-invitations\/([0-9a-f-]{36})\/(revoke|renew)$/i.exec(pathname);
    if (request.method === "POST" && invitationActionMatch) {
      await handleOrganizationInvitationAction(request, response, invitationActionMatch[1], invitationActionMatch[2]);
      return;
    }

    const membershipUpdateMatch = /^\/api\/organization-memberships\/([0-9a-f-]{36})$/i.exec(pathname);
    if (request.method === "PATCH" && membershipUpdateMatch) {
      await handleUpdateOrganizationMembership(request, response, membershipUpdateMatch[1]);
      return;
    }

    if (request.method === "POST" && pathname === "/api/organization-channels") {
      await handleSaveOrganizationChannels(request, response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/channel-setup/ebay") {
      await handleEbaySetupStatus(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/channel-setup/ebay/start") {
      await handleEbaySetupStart(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/channel-setup/ebay/verify") {
      await handleEbaySetupVerify(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/channel-setup/ebay/defaults") {
      await handleEbaySetupDefaults(request, response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/agent-control") {
      await handleAgentControl(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/agent-runs") {
      await handleCreateAgentRun(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/approval-requests") {
      await handleCreateApprovalRequest(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/agent-steps/claim") {
      await handleClaimAgentStep(request, response);
      return;
    }

    const agentStepActionMatch = /^\/api\/agent-steps\/([0-9a-f-]{36})\/(complete|fail|heartbeat)$/i.exec(pathname);
    if (request.method === "POST" && agentStepActionMatch) {
      await handleAgentStepAction(request, response, agentStepActionMatch[1], agentStepActionMatch[2]);
      return;
    }

    const approvalDecisionMatch = /^\/api\/approvals\/([0-9a-f-]{36})\/(approve|reject)$/i.exec(pathname);
    if (request.method === "POST" && approvalDecisionMatch) {
      await handleApprovalDecision(request, response, approvalDecisionMatch[1], approvalDecisionMatch[2]);
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

    if (request.method === "POST" && pathname === "/api/group-collection-photos") {
      await handleGroupCollectionPhotos(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/intake/capture") {
      await handleIntakeCapture(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/visual-match") {
      await handleVisualMatch(request, response);
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

    if (request.method === "POST" && pathname === "/api/ebay-listing/prepare") {
      await handlePrepareEbayListing(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/ebay-listing/publish") {
      await handlePublishEbayListing(request, response);
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
    sendJson(response, error.status || 500, {
      error: error.code || "internal_error",
      message: redactSecret(error.message)
    });
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

  if (isAgentApiPath(pathname) && agentApiToken && safeTokenEquals(bearerToken, agentApiToken)) {
    return {
      ok: true,
      status: 200,
      user: { id: "ramrod-agent", email: "agent@ramrod.internal", service: true, agent: true }
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
    if (!selfServiceSignup && authAllowedEmails.size && !authAllowedEmails.has(email) && !roleAllowed) {
      return { ok: false, status: 403, error: "account_not_allowed", message: "Dieses Konto ist für RAMROD nicht freigeschaltet." };
    }

    return { ok: true, status: 200, user };
  } catch (error) {
    return { ok: false, status: 503, error: "auth_unavailable", message: `Anmeldung konnte nicht geprüft werden: ${redactSecret(error.message)}` };
  }
}

function isAgentApiPath(pathname) {
  return pathname === "/api/agent-control"
    || pathname === "/api/agent-runs"
    || pathname === "/api/approval-requests"
    || pathname === "/api/agent-steps/claim"
    || /^\/api\/agent-steps\/[0-9a-f-]{36}\/(complete|fail|heartbeat)$/i.test(pathname);
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
      agentControl: unavailableAgentControl("Supabase ist nicht konfiguriert."),
      message: "Supabase is not configured."
    });
    return;
  }

  try {
    const tenant = await resolveTenantContext(request);
    if (!tenant.activeOrganization) {
      const invitations = await pendingInvitationsForEmail(request.ramrodUser?.email).catch(() => []);
      sendJson(response, 200, {
        needsOnboarding: true,
        message: "Lege einen neuen Kundenbereich an oder nimm eine Einladung an.",
        persistence,
        organizations: tenant.organizations,
        activeOrganization: null,
        platformAdmin: tenant.platformAdmin,
        membership: null,
        permissions: tenant.platformAdmin ? permissionsForRole("owner", true) : [],
        invitations,
        boxes: [],
        items: [],
        agentControl: unavailableAgentControl("Kein Kundenbereich ausgewählt.")
      });
      return;
    }

    const organizationId = tenant.activeOrganization.id;
    const organizationFilter = encodeURIComponent(organizationId);
    const [boxes, items, priceJobs, analysisJobs, adminOverview, agentControl] = await Promise.all([
      supabaseSelect(`/boxes?select=id,code,label,location,status,customer_id&customer_id=eq.${organizationFilter}&order=code.asc`),
      supabaseSelect(`/items?select=*&customer_id=eq.${organizationFilter}&order=created_at.desc&limit=500`),
      persistence.writable
        ? supabaseSelect(`/jobs?select=id,item_id,status,attempts,max_attempts,created_at,updated_at,result,error&customer_id=eq.${organizationFilter}&job_type=eq.price_check&order=created_at.desc&limit=500`)
        : [],
      persistence.writable
        ? supabaseSelect(`/jobs?select=id,item_id,status,attempts,max_attempts,created_at,updated_at,result,error&customer_id=eq.${organizationFilter}&job_type=eq.analyze_image&order=created_at.desc&limit=500`)
        : [],
      tenant.platformAdmin ? buildAdminOverview(tenant.organizations) : [],
      buildAgentControlSnapshot(organizationId)
    ]);
    const latestPriceJobByItem = new Map();
    for (const job of priceJobs) {
      if (job.item_id && !latestPriceJobByItem.has(job.item_id)) {
        latestPriceJobByItem.set(job.item_id, job);
      }
    }
    const latestAnalysisJobByItem = new Map();
    for (const job of analysisJobs) {
      if (job.item_id && !latestAnalysisJobByItem.has(job.item_id)) {
        latestAnalysisJobByItem.set(job.item_id, job);
      }
    }
    const itemIds = items.map((item) => item.id).filter(isUuid);
    const ebayListings = itemIds.length
      ? await supabaseSelect(`/listings?select=*&channel_id=eq.ebay&item_id=in.(${itemIds.map(encodeURIComponent).join(",")})&order=created_at.desc&limit=1000`)
      : [];
    const latestEbayListingByItem = new Map();
    for (const listing of ebayListings) {
      if (listing.item_id && !latestEbayListingByItem.has(listing.item_id)) {
        latestEbayListingByItem.set(listing.item_id, listing);
      }
    }

    sendJson(response, 200, {
      persistence,
      organizations: tenant.organizations,
      activeOrganization: tenant.activeOrganization,
      platformAdmin: tenant.platformAdmin,
      membership: tenant.activeMembership,
      permissions: tenant.permissions,
      needsOnboarding: false,
      adminOverview,
      tenantMode: tenant.tenantMode,
      boxes: boxes.map(mapDbBoxToUi),
      items: items.map((item) => mapDbItemToUi(
        item,
        boxes,
        latestPriceJobByItem.get(item.id),
        latestEbayListingByItem.get(item.id) || null,
        latestAnalysisJobByItem.get(item.id)
      )),
      agentControl
    });
  } catch (error) {
    sendJson(response, 200, {
      persistence: { ...persistence, available: false },
      organizations: [],
      activeOrganization: null,
      platformAdmin: false,
      boxes: [],
      items: [],
      agentControl: unavailableAgentControl(redactSecret(error.message)),
      message: redactSecret(error.message)
    });
  }
}

function unavailableAgentControl(message = "Agent Control ist noch nicht eingerichtet.") {
  return {
    available: false,
    message,
    playbooks: publicAgentPlaybooks(),
    runs: [],
    approvals: [],
    channelAccounts: [],
    ebaySetup: null,
    runners: []
  };
}

async function buildAgentControlSnapshot(organizationId) {
  if (!organizationId) return unavailableAgentControl("Kein Kundenbereich ausgewählt.");
  const organizationFilter = encodeURIComponent(organizationId);
  try {
    const [runs, approvals, channelAccounts, workers, ebaySetup] = await Promise.all([
      supabaseSelect(`/agent_runs?select=id,organization_id,item_id,channel_account_id,agent_type,objective,status,risk_level,plan,result,error,started_at,completed_at,created_at,updated_at&organization_id=eq.${organizationFilter}&order=created_at.desc&limit=40`),
      supabaseSelect(`/approval_requests?select=id,organization_id,agent_run_id,agent_step_id,approval_type,status,summary,payload,expires_at,decided_at,decision_note,created_at,updated_at&organization_id=eq.${organizationFilter}&order=created_at.desc&limit=60`),
      supabaseSelect(`/organization_channel_accounts?select=id,organization_id,channel_id,display_name,auth_mode,status,external_account_ref,browser_profile_key,capabilities,metadata,last_verified_at,created_at,updated_at&organization_id=eq.${organizationFilter}&order=created_at.desc&limit=80`),
      supabaseSelect("/workers?select=id,worker_key,name,status,capabilities,metadata,last_seen_at,created_at,updated_at&order=last_seen_at.desc&limit=80"),
      buildEbaySetupState(organizationId)
    ]);
    const runIds = runs.map((run) => run.id).filter(Boolean);
    const steps = runIds.length
      ? await supabaseSelect(`/agent_steps?select=id,agent_run_id,ordinal,step_key,title,action_type,execution_mode,status,risk_level,approval_required,summary,output,error,attempts,max_attempts,locked_by,locked_at,lease_expires_at,started_at,completed_at,created_at,updated_at&agent_run_id=in.(${encodeURIComponent(runIds.join(","))})&order=ordinal.asc`)
      : [];
    const stepsByRun = new Map();
    for (const step of steps) {
      if (!stepsByRun.has(step.agent_run_id)) stepsByRun.set(step.agent_run_id, []);
      stepsByRun.get(step.agent_run_id).push(step);
    }
    return {
      available: true,
      message: "",
      telegramConfigured: Boolean(telegramBotToken && telegramWebhookSecret && telegramApprovalChatId),
      agentApiConfigured: Boolean(agentApiToken),
      playbooks: publicAgentPlaybooks(),
      runs: runs.map((run) => ({ ...run, steps: stepsByRun.get(run.id) || [] })),
      approvals,
      channelAccounts,
      ebaySetup,
      runners: workers.filter((entry) => entry.metadata?.runner || entry.capabilities?.some((capability) => String(capability).startsWith("agent:")))
    };
  } catch (error) {
    return unavailableAgentControl(`Migration ausstehend: ${redactSecret(error.message)}`);
  }
}

async function handleAgentControl(request, response) {
  const tenant = await resolveTenantContext(request);
  if (!tenant.activeOrganization) {
    sendJson(response, 403, { error: "organization_access_required", message: "Kein Kundenbereich ausgewählt." });
    return;
  }
  sendJson(response, 200, { agentControl: await buildAgentControlSnapshot(tenant.activeOrganization.id) });
}

async function handleClaimAgentStep(request, response) {
  if (!request.ramrodUser?.agent && authRequired) {
    sendJson(response, 403, { error: "agent_service_required", message: "Agentenschritte können nur von einem registrierten Runner übernommen werden." });
    return;
  }
  if (!supabasePersistenceStatus().writable) {
    sendJson(response, 503, { error: "agent_executor_not_writable", message: "Der Agent Runner benötigt den Supabase Service Role Key." });
    return;
  }

  let body;
  try {
    body = JSON.parse(await readRequestBody(request, 128 * 1024));
  } catch (error) {
    sendJson(response, 400, { error: "invalid_agent_claim", message: redactSecret(error.message) });
    return;
  }

  const workerKey = cleanAgentWorkerKey(body.workerKey);
  if (!workerKey) {
    sendJson(response, 400, { error: "invalid_worker_key", message: "workerKey wird benötigt." });
    return;
  }
  const executionModes = cleanAgentCapabilityList(body.executionModes, 16);
  const actionTypes = cleanAgentCapabilityList(body.actionTypes, 24);
  const stepKeys = cleanAgentCapabilityList(body.stepKeys, 50);
  if (!executionModes.length || !actionTypes.length || !stepKeys.length) {
    sendJson(response, 400, { error: "missing_agent_capabilities", message: "executionModes, actionTypes und stepKeys dürfen nicht leer sein." });
    return;
  }

  const requestedOrganizationId = String(body.organizationId || request.headers["x-ramrod-organization"] || "").trim();
  if (requestedOrganizationId && !isUuid(requestedOrganizationId)) {
    sendJson(response, 400, { error: "invalid_organization", message: "organizationId muss eine gültige UUID sein." });
    return;
  }

  try {
    await runAgentMaintenanceIfDue();
    const worker = await registerAgentWorker({
      workerKey,
      workerName: String(body.workerName || workerKey).trim().slice(0, 160),
      executionModes,
      actionTypes,
      stepKeys,
      metadata: body.metadata
    });
    const rows = await supabaseRpc("claim_ramrod_agent_step", {
      p_worker_id: worker.id,
      p_organization_id: requestedOrganizationId || null,
      p_execution_modes: executionModes,
      p_action_types: actionTypes,
      p_step_keys: stepKeys,
      p_lease_seconds: clampNumber(body.leaseSeconds, 30, 3600, 180)
    });
    const step = rows[0] || null;
    if (!step) {
      sendJson(response, 200, { worker, step: null });
      return;
    }
    sendJson(response, 200, await hydrateAgentStepClaim(worker, step));
  } catch (error) {
    sendJson(response, 500, { error: "agent_step_claim_failed", message: redactSecret(error.message) });
  }
}

async function handleAgentStepAction(request, response, stepId, action) {
  if (!request.ramrodUser?.agent && authRequired) {
    sendJson(response, 403, { error: "agent_service_required", message: "Agentenschritte können nur von einem registrierten Runner aktualisiert werden." });
    return;
  }
  if (!isUuid(stepId)) {
    sendJson(response, 400, { error: "invalid_agent_step", message: "Ungültige Agentenschritt-ID." });
    return;
  }
  const bodyText = await readRequestBody(request, 512 * 1024);
  const body = bodyText ? JSON.parse(bodyText) : {};
  const workerKey = cleanAgentWorkerKey(body.workerKey);
  if (!workerKey) {
    sendJson(response, 400, { error: "invalid_worker_key", message: "workerKey wird benötigt." });
    return;
  }

  try {
    const workers = await supabaseSelect(`/workers?select=*&worker_key=eq.${encodeURIComponent(workerKey)}&limit=1`);
    const worker = workers[0];
    if (!worker) {
      sendJson(response, 404, { error: "agent_worker_not_found", message: "Runner wurde nicht gefunden." });
      return;
    }

    if (action === "heartbeat") {
      const renewed = await supabaseRpc("renew_ramrod_agent_step_lease", {
        p_step_id: stepId,
        p_worker_id: worker.id,
        p_lease_seconds: clampNumber(body.leaseSeconds, 30, 3600, 180)
      });
      if (renewed !== true) {
        sendJson(response, 409, { error: "agent_step_lease_lost", message: "Der Runner besitzt diesen Schritt nicht mehr." });
        return;
      }
      sendJson(response, 200, { renewed: true });
      return;
    }

    const succeeded = action === "complete";
    const rows = await supabaseRpc("finish_ramrod_agent_step", {
      p_step_id: stepId,
      p_worker_id: worker.id,
      p_succeeded: succeeded,
      p_output: succeeded ? redactAgentPayload(body.output || {}) : null,
      p_error: succeeded ? null : redactAgentPayload(body.error || { code: "agent_step_failed", message: "Runner meldete einen Fehler.", retryable: true }),
      p_retry_delay_seconds: clampNumber(body.retryDelaySeconds, 1, 86400, 30)
    });
    const step = rows[0];
    if (!step) {
      sendJson(response, 409, { error: "agent_step_lease_lost", message: "Der Runner besitzt diesen Schritt nicht mehr." });
      return;
    }
    await supabaseUpdate(`/workers?id=eq.${encodeURIComponent(worker.id)}`, { status: "online", last_seen_at: new Date().toISOString() });
    const runRows = await supabaseSelect(`/agent_runs?select=organization_id&id=eq.${encodeURIComponent(step.agent_run_id)}&limit=1`);
    if (runRows[0]?.organization_id) {
      await supabaseInsert("/audit_events", {
        actor_id: null,
        organization_id: runRows[0].organization_id,
        entity_type: "agent_step",
        entity_id: step.id,
        event_type: succeeded ? "agent_step_succeeded" : "agent_step_failed",
        payload: redactAgentPayload({ workerId: worker.id, workerKey: worker.worker_key, runId: step.agent_run_id, stepKey: step.step_key, attempts: step.attempts })
      }).catch((error) => console.error("Agent step audit failed:", redactSecret(error.message)));
    }
    const approval = succeeded ? await ensureNextAgentApproval(step.agent_run_id) : null;
    sendJson(response, 200, { step, approval });
  } catch (error) {
    sendJson(response, 500, { error: "agent_step_update_failed", message: redactSecret(error.message) });
  }
}

async function registerAgentWorker({ workerKey, workerName, executionModes, actionTypes, stepKeys, metadata }) {
  const rows = await supabaseUpsert("/workers?on_conflict=worker_key", {
    worker_key: workerKey,
    name: workerName || workerKey,
    status: "online",
    capabilities: [
      ...executionModes.map((entry) => `agent:mode:${entry}`),
      ...actionTypes.map((entry) => `agent:action:${entry}`),
      ...stepKeys.map((entry) => `agent:step:${entry}`)
    ],
    max_concurrency: 1,
    metadata: redactAgentPayload({ ...(metadata && typeof metadata === "object" ? metadata : {}), runner: true }),
    last_seen_at: new Date().toISOString()
  });
  if (!rows[0]?.id) throw new Error("Supabase hat keine Runner-ID zurückgegeben.");
  return rows[0];
}

async function hydrateAgentStepClaim(worker, step) {
  const runs = await supabaseSelect(`/agent_runs?select=*&id=eq.${encodeURIComponent(step.agent_run_id)}&limit=1`);
  const run = runs[0];
  if (!run) throw new Error("Agentenmission wurde nicht gefunden.");
  const [organizations, priorSteps, itemRows, candidateRows] = await Promise.all([
    supabaseSelect(`/customers?select=id,name,slug,organization_type,short_code&id=eq.${encodeURIComponent(run.organization_id)}&limit=1`),
    supabaseSelect(`/agent_steps?select=id,ordinal,step_key,title,status,output,error,completed_at&agent_run_id=eq.${encodeURIComponent(run.id)}&ordinal=lt.${step.ordinal}&order=ordinal.asc`),
    run.item_id ? supabaseSelect(`/items?select=*&id=eq.${encodeURIComponent(run.item_id)}&customer_id=eq.${encodeURIComponent(run.organization_id)}&limit=1`) : Promise.resolve([]),
    ["distribute_inventory", "create_demand_campaign"].includes(run.agent_type)
      ? supabaseSelect(`/items?select=*&customer_id=eq.${encodeURIComponent(run.organization_id)}&order=updated_at.desc&limit=200`)
      : Promise.resolve([])
  ]);
  return redactAgentPayload({
    worker,
    step,
    run,
    organization: organizations[0] || null,
    item: itemRows[0] || null,
    candidates: candidateRows,
    priorSteps
  });
}

async function ensureNextAgentApproval(runId) {
  const [runs, steps] = await Promise.all([
    supabaseSelect(`/agent_runs?select=*&id=eq.${encodeURIComponent(runId)}&limit=1`),
    supabaseSelect(`/agent_steps?select=*&agent_run_id=eq.${encodeURIComponent(runId)}&status=eq.waiting_approval&order=ordinal.asc&limit=1`)
  ]);
  const run = runs[0];
  const step = steps[0];
  if (!run || !step) return null;
  const organizations = await supabaseSelect(`/customers?select=*&id=eq.${encodeURIComponent(run.organization_id)}&limit=1`);
  const organization = organizations[0];
  if (!organization) return null;
  return createApprovalForStep({
    organization,
    run,
    step,
    itemId: run.item_id,
    channelId: run.context?.channelId || step.input?.channelId || null
  });
}

async function runAgentMaintenanceIfDue() {
  if (Date.now() - lastAgentMaintenanceAt < 60_000) return;
  lastAgentMaintenanceAt = Date.now();
  await supabaseRpc("requeue_stale_ramrod_agent_steps", {});
}

function cleanAgentWorkerKey(value) {
  const key = String(value || "").trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,119}$/.test(key) ? key : "";
}

function cleanAgentCapabilityList(value, maxItems) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((entry) => String(entry || "").trim().toLowerCase()).filter((entry) => /^[a-z0-9][a-z0-9_-]{0,79}$/.test(entry)))].slice(0, maxItems);
}

async function handleCreateAgentRun(request, response) {
  if (!supabasePersistenceStatus().writable) {
    sendJson(response, 503, { error: "agent_control_not_writable", message: "Die Agentensteuerung benötigt den Supabase Service Role Key." });
    return;
  }
  const tenant = await requireTenantPermission(request, response, "agents:run");
  if (!tenant) return;

  let body;
  let plan;
  try {
    body = JSON.parse(await readRequestBody(request, 128 * 1024));
    plan = buildAgentPlan({
      agentType: body.agentType,
      objective: body.objective,
      channelId: body.channelId,
      itemId: body.itemId,
      accountEmail: body.accountEmail,
      sellerMode: body.sellerMode,
      accountLabel: body.accountLabel
    });
  } catch (error) {
    sendJson(response, 400, { error: "invalid_agent_mission", message: redactSecret(error.message) });
    return;
  }

  const organizationId = tenant.activeOrganization.id;
  if (plan.agentType === "onboard_channel_account") {
    if (!tenant.permissions.includes("channels:manage")) {
      sendJson(response, 403, { error: "channel_management_required", message: "Nur Inhaber und Admins können Verkaufskonten einrichten." });
      return;
    }
    if (!plan.channelId || !plan.accountEmail || !plan.sellerMode) {
      sendJson(response, 400, { error: "account_context_required", message: "Plattform, Kontakt-E-Mail und Verkäuferart werden benötigt." });
      return;
    }
  }
  if (plan.itemId) {
    if (!isUuid(plan.itemId)) {
      sendJson(response, 400, { error: "invalid_item", message: "itemId muss eine gültige UUID sein." });
      return;
    }
    const item = await supabaseSelect(`/items?select=id&customer_id=eq.${encodeURIComponent(organizationId)}&id=eq.${encodeURIComponent(plan.itemId)}&limit=1`);
    if (!item[0]) {
      sendJson(response, 404, { error: "item_not_found", message: "Der Artikel gehört nicht zu diesem Kundenbereich." });
      return;
    }
  }

  try {
    let channelAccount = null;
    if (plan.agentType === "onboard_channel_account") {
      const channel = publicChannelRegistry().find((entry) => entry.id === plan.channelId);
      if (!channel) throw httpError(400, "Unbekannter Verkaufskanal.");
      const displayName = (plan.accountLabel || `${channel.name} · ${plan.accountEmail}`).slice(0, 160);
      const existingAccounts = await supabaseSelect(`/organization_channel_accounts?select=*&organization_id=eq.${encodeURIComponent(organizationId)}&channel_id=eq.${encodeURIComponent(plan.channelId)}&order=created_at.desc&limit=50`);
      channelAccount = existingAccounts.find((entry) => entry.display_name === displayName || entry.metadata?.accountEmail === plan.accountEmail) || null;
      if (!channelAccount) {
        const accountRows = await supabaseInsert("/organization_channel_accounts", {
          organization_id: organizationId,
          channel_id: plan.channelId,
          display_name: displayName,
          auth_mode: plan.channelId === "ebay" ? "oauth" : "browser",
          status: "onboarding",
          capabilities: [],
          metadata: redactAgentPayload({
            accountEmail: plan.accountEmail,
            sellerMode: plan.sellerMode,
            onboardingAgent: "ramrod_sales_director"
          })
        });
        channelAccount = accountRows[0] || null;
      }
    }

    const missionContext = redactAgentPayload({
      channelId: plan.channelId,
      accountEmail: plan.accountEmail,
      sellerMode: plan.sellerMode,
      accountLabel: plan.accountLabel,
      channelAccountId: channelAccount?.id || null,
      source: request.ramrodUser?.agent ? "mcp" : "ramrod_ui"
    });
    const runRows = await supabaseInsert("/agent_runs", {
      organization_id: organizationId,
      item_id: plan.itemId,
      channel_account_id: channelAccount?.id || null,
      agent_type: plan.agentType,
      objective: plan.objective,
      status: plan.status,
      risk_level: plan.riskLevel,
      requested_by: isUuid(request.ramrodUser?.id) ? request.ramrodUser.id : null,
      plan: redactAgentPayload(plan),
      context: missionContext
    });
    const run = runRows[0];
    if (!run) throw new Error("Agentenmission wurde nicht zurückgegeben.");
    const stepRows = await supabaseInsert("/agent_steps", plan.steps.map((step) => ({
      agent_run_id: run.id,
      ordinal: step.ordinal,
      step_key: step.key,
      title: step.title,
      action_type: step.actionType,
      execution_mode: step.executionMode,
      status: step.status,
      risk_level: step.riskLevel,
      approval_required: step.approvalRequired,
      summary: step.summary,
      input: redactAgentPayload({ ...missionContext, itemId: plan.itemId })
    })));
    const approvalPlan = plan.steps.find((step) => step.status === "waiting_approval") || null;
    const approvalStep = approvalPlan
      ? stepRows.find((step) => step.step_key === approvalPlan.key)
      : null;
    const approval = approvalStep
      ? await createApprovalForStep({
        organization: tenant.activeOrganization,
        run: { ...run, label: plan.label },
        step: approvalStep,
        requestedBy: isUuid(request.ramrodUser?.id) ? request.ramrodUser.id : null,
        itemId: plan.itemId,
        channelId: plan.channelId
      })
      : null;
    const snapshot = await buildAgentControlSnapshot(organizationId);
    sendJson(response, 201, { run, steps: stepRows, approval, snapshot });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "agent_mission_create_failed", message: redactSecret(error.message) });
  }
}

async function handleCreateApprovalRequest(request, response) {
  const tenant = await requireTenantPermission(request, response, "agents:run");
  if (!tenant) return;
  const body = JSON.parse(await readRequestBody(request, 64 * 1024));
  if (!isUuid(body.runId) || !isUuid(body.stepId)) {
    sendJson(response, 400, { error: "invalid_approval_request", message: "runId und stepId müssen gültige UUIDs sein." });
    return;
  }
  const organizationId = tenant.activeOrganization.id;
  const [runs, steps] = await Promise.all([
    supabaseSelect(`/agent_runs?select=*&id=eq.${encodeURIComponent(body.runId)}&organization_id=eq.${encodeURIComponent(organizationId)}&limit=1`),
    supabaseSelect(`/agent_steps?select=*&id=eq.${encodeURIComponent(body.stepId)}&agent_run_id=eq.${encodeURIComponent(body.runId)}&limit=1`)
  ]);
  if (!runs[0] || !steps[0] || !steps[0].approval_required) {
    sendJson(response, 404, { error: "approval_step_not_found", message: "Der freigabepflichtige Schritt wurde nicht gefunden." });
    return;
  }
  try {
    const approval = await createApprovalForStep({
      organization: tenant.activeOrganization,
      run: runs[0],
      step: steps[0],
      requestedBy: isUuid(request.ramrodUser?.id) ? request.ramrodUser.id : null,
      customSummary: body.summary
    });
    sendJson(response, 201, { approval, snapshot: await buildAgentControlSnapshot(organizationId) });
  } catch (error) {
    sendJson(response, 500, { error: "approval_create_failed", message: redactSecret(error.message) });
  }
}

async function createApprovalForStep({ organization, run, step, requestedBy = null, itemId = null, channelId = null, customSummary = "" }) {
  const existing = await supabaseSelect(`/approval_requests?select=*&agent_step_id=eq.${encodeURIComponent(step.id)}&status=eq.pending&limit=1`);
  if (existing[0]) return existing[0];
  let itemTitle = "";
  if (itemId) {
    const items = await supabaseSelect(`/items?select=title&id=eq.${encodeURIComponent(itemId)}&customer_id=eq.${encodeURIComponent(organization.id)}&limit=1`).catch(() => []);
    itemTitle = items[0]?.title || "";
  }
  const summary = String(customSummary || "").trim().slice(0, 240) || buildApprovalSummary({
    organizationName: organization.name,
    run,
    step,
    itemTitle,
    channelName: channelId || ""
  });
  const rows = await supabaseInsert("/approval_requests", {
    organization_id: organization.id,
    agent_run_id: run.id,
    agent_step_id: step.id,
    approval_type: step.action_type || "external_action",
    status: "pending",
    summary,
    payload: redactAgentPayload({ itemId, itemTitle, channelId, riskLevel: step.risk_level, actionType: step.action_type }),
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    requested_by: requestedBy
  });
  const approval = rows[0];
  if (approval) {
    await sendTelegramApproval({ organization, run, step, approval, itemTitle, channelName: channelId || "" }).catch((error) => {
      console.error("Telegram approval delivery failed:", redactSecret(error.message));
    });
  }
  return approval;
}

async function handleApprovalDecision(request, response, approvalId, action) {
  if (!isUuid(approvalId)) {
    sendJson(response, 400, { error: "invalid_approval", message: "Ungültige Freigabe-ID." });
    return;
  }
  const tenant = await requireTenantPermission(request, response, "sales:approve");
  if (!tenant) return;
  const bodyText = await readRequestBody(request, 16 * 1024);
  const body = bodyText ? JSON.parse(bodyText) : {};
  try {
    const result = await decideApproval({
      approvalId,
      decision: action === "approve" ? "approved" : "rejected",
      organizationId: tenant.activeOrganization.id,
      actorId: isUuid(request.ramrodUser?.id) ? request.ramrodUser.id : null,
      note: String(body.note || "Entscheidung in RAMROD").slice(0, 500)
    });
    sendJson(response, 200, { ...result, snapshot: await buildAgentControlSnapshot(tenant.activeOrganization.id) });
  } catch (error) {
    sendJson(response, 400, { error: "approval_decision_failed", message: redactSecret(error.message) });
  }
}

async function decideApproval({ approvalId, decision, organizationId = null, actorId = null, note = "" }) {
  const organizationFilter = organizationId ? `&organization_id=eq.${encodeURIComponent(organizationId)}` : "";
  const rows = await supabaseSelect(`/approval_requests?select=*&id=eq.${encodeURIComponent(approvalId)}${organizationFilter}&limit=1`);
  const approval = rows[0];
  if (!approval) throw new Error("Freigabe nicht gefunden.");
  if (approval.status !== "pending") return { approval, repeated: true };
  const approved = decision === "approved";
  const decidedRows = await supabaseUpdate(`/approval_requests?id=eq.${encodeURIComponent(approval.id)}&status=eq.pending`, {
    status: approved ? "approved" : "rejected",
    decided_by: actorId,
    decided_at: new Date().toISOString(),
    decision_note: String(note || "").slice(0, 500)
  });
  if (!decidedRows[0]) throw new Error("Freigabe wurde bereits entschieden.");
  await Promise.all([
    supabaseUpdate(`/agent_steps?id=eq.${encodeURIComponent(approval.agent_step_id)}`, {
      status: approved ? "approved" : "cancelled"
    }),
    supabaseUpdate(`/agent_runs?id=eq.${encodeURIComponent(approval.agent_run_id)}`, {
      status: approved ? "ready" : "cancelled",
      ...(approved ? {} : { completed_at: new Date().toISOString() })
    }),
    supabaseInsert("/audit_events", {
      actor_id: actorId,
      organization_id: approval.organization_id,
      entity_type: "approval_request",
      entity_id: approval.id,
      event_type: approved ? "agent_action_approved" : "agent_action_rejected",
      payload: redactAgentPayload({ agentRunId: approval.agent_run_id, agentStepId: approval.agent_step_id, note })
    })
  ]);
  return { approval: decidedRows[0], repeated: false };
}

async function sendTelegramApproval({ organization, run, step, approval, itemTitle = "", channelName = "" }) {
  if (!telegramBotToken || !telegramApprovalChatId || !approval?.id) return null;
  const telegramResponse = await telegramApi("sendMessage", {
    chat_id: telegramApprovalChatId,
    text: buildTelegramApprovalMessage({ organizationName: organization.name, run, step, itemTitle, channelName, approvalId: approval.id }),
    reply_markup: telegramApprovalKeyboard(approval.id)
  });
  const message = telegramResponse.result;
  if (message?.message_id) {
    await supabaseUpdate(`/approval_requests?id=eq.${encodeURIComponent(approval.id)}`, {
      telegram_chat_id: Number(message.chat?.id || telegramApprovalChatId),
      telegram_message_id: Number(message.message_id)
    });
  }
  return message || null;
}

async function handleTelegramWebhook(request, response) {
  if (!telegramWebhookSecret) {
    sendJson(response, 503, { error: "telegram_not_configured" });
    return;
  }
  const suppliedSecret = String(request.headers["x-telegram-bot-api-secret-token"] || "");
  if (!suppliedSecret || !safeTokenEquals(suppliedSecret, telegramWebhookSecret)) {
    sendJson(response, 401, { error: "invalid_telegram_secret" });
    return;
  }
  const update = JSON.parse(await readRequestBody(request, 256 * 1024));
  const callback = update.callback_query;
  const parsed = parseTelegramApprovalCallback(callback?.data);
  if (!callback || !parsed) {
    sendJson(response, 200, { ok: true, ignored: true });
    return;
  }
  const chatId = String(callback.message?.chat?.id || callback.from?.id || "");
  if (!telegramAllowedChatIds.has(chatId)) {
    await telegramApi("answerCallbackQuery", { callback_query_id: callback.id, text: "Keine Berechtigung.", show_alert: true }).catch(() => null);
    sendJson(response, 200, { ok: true, ignored: true });
    return;
  }
  try {
    const result = await decideApproval({
      approvalId: parsed.approvalId,
      decision: parsed.decision,
      note: `Entscheidung via Telegram Chat ${chatId}`
    });
    await telegramApi("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: parsed.decision === "approved" ? "Freigegeben. RAMROD kann fortfahren." : "Abgelehnt. Mission wurde gestoppt.",
      show_alert: false
    });
    sendJson(response, 200, { ok: true, repeated: result.repeated });
  } catch (error) {
    await telegramApi("answerCallbackQuery", { callback_query_id: callback.id, text: redactSecret(error.message).slice(0, 180), show_alert: true }).catch(() => null);
    sendJson(response, 200, { ok: true, error: "decision_failed" });
  }
}

async function telegramApi(method, payload) {
  if (!telegramBotToken) throw new Error("Telegram Bot Token fehlt.");
  const result = await fetch(`https://api.telegram.org/bot${telegramBotToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await result.json();
  if (!result.ok || !body.ok) throw new Error(body.description || `Telegram HTTP ${result.status}`);
  return body;
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
  const activeMembership = activeOrganization
    ? memberships.find((entry) => entry.organization_id === activeOrganization.id) || null
    : null;
  const activeRole = activeOrganization?.role || activeMembership?.role || (platformAdmin ? "platform_admin" : "viewer");

  return {
    organizations: accessibleOrganizations,
    activeOrganization,
    activeMembership: activeOrganization ? {
      organizationId: activeOrganization.id,
      role: activeRole,
      status: activeMembership?.status || "active",
      supportAccess: Boolean(activeMembership?.support_access)
    } : null,
    permissions: permissionsForRole(activeRole, platformAdmin),
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

  try {
    const body = JSON.parse(await readRequestBody(request, 64 * 1024));
    const organization = await createOrganizationWorkspace({ body, user: request.ramrodUser, allowPrivilegedTypes: true });
    sendJson(response, 201, { organization: mapOrganizationRow(organization) });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "organization_create_failed", message: redactSecret(error.message) });
  }
}

async function handleSelfServiceOrganization(request, response) {
  if (!selfServiceSignup) {
    sendJson(response, 403, { error: "self_service_disabled", message: "Neue Kundenbereiche werden derzeit nur auf Einladung angelegt." });
    return;
  }
  if (!isUuid(request.ramrodUser?.id)) {
    sendJson(response, 401, { error: "authentication_required", message: "Bitte zuerst ein Konto anlegen oder anmelden." });
    return;
  }
  try {
    const body = JSON.parse(await readRequestBody(request, 128 * 1024));
    const organization = await createOrganizationWorkspace({ body, user: request.ramrodUser, allowPrivilegedTypes: false });
    sendJson(response, 201, { organization: mapOrganizationRow(organization) });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "workspace_onboarding_failed", message: redactSecret(error.message) });
  }
}

async function createOrganizationWorkspace({ body, user, allowPrivilegedTypes = false }) {
  const name = String(body.name || "").trim();
  const allowedTypes = allowPrivilegedTypes ? ["internal", "customer", "personal", "demo"] : ["customer", "personal"];
  const organizationType = allowedTypes.includes(body.type) ? body.type : "customer";
  const slugBase = slugify(String(body.slug || name));
  if (name.length < 2 || !slugBase) throw httpError(400, "Bitte einen gültigen Namen angeben.");
  if (!allowPrivilegedTypes && isUuid(user?.id)) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recent = await supabaseSelect(`/customers?select=id&created_by=eq.${encodeURIComponent(user.id)}&created_at=gte.${encodeURIComponent(since)}&limit=4`);
    if (recent.length >= 3) throw httpError(429, "Du hast heute bereits mehrere Bereiche angelegt. Bitte wende dich an den RAMROD-Support.");
  }

  const duplicate = await supabaseSelect(`/customers?select=id&slug=eq.${encodeURIComponent(slugBase)}&limit=1`);
  const slug = duplicate.length ? `${slugBase}-${randomUUID().slice(0, 6)}` : slugBase;
  const shortCode = String(body.shortCode || name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2) || "OR").toUpperCase().slice(0, 3);
  const rows = await supabaseInsert("/customers", {
    name,
    slug,
    organization_type: organizationType,
    short_code: shortCode,
    brand_color: String(body.brandColor || "#ff6a00"),
    seller_mode: organizationType === "personal" ? "private" : "business",
    onboarding_status: "ready",
    onboarding_completed_at: new Date().toISOString(),
    created_by: isUuid(user?.id) ? user.id : null,
    notes: String(body.notes || "Über RAMROD angelegter Kundenbereich")
  });
  const organization = rows[0];
  if (!organization) throw new Error("Organisation wurde nicht zurückgegeben.");

  const sideEffects = [supabaseInsert("/boxes", {
    customer_id: organization.id,
    code: `${shortCode}-001`,
    label: "Erste Erfassung",
    location: "Noch nicht zugeordnet",
    status: "intake"
  })];
  if (isUuid(user?.id)) {
    sideEffects.push(supabaseUpsert("/organization_memberships?on_conflict=organization_id,user_id", {
      organization_id: organization.id,
      user_id: user.id,
      role: "owner",
      status: "active"
    }));
  }
  const channelIds = cleanOnboardingChannelIds(body.channels);
  if (channelIds.length) {
    sideEffects.push(supabaseInsert("/organization_channel_accounts", channelIds.map((channelId) => {
      const channel = publicChannelRegistry().find((entry) => entry.id === channelId);
      return {
        organization_id: organization.id,
        channel_id: channelId,
        display_name: channel?.name || channelId,
        auth_mode: channelId === "ebay" ? "oauth" : "manual",
        status: "planned",
        metadata: { selectedDuringOnboarding: true }
      };
    })));
  }
  const results = await Promise.allSettled(sideEffects);
  const failed = results.find((result) => result.status === "rejected");
  if (failed) throw new Error(`Kundenbereich angelegt, Einrichtung aber unvollständig: ${failed.reason?.message || "Unbekannter Fehler"}`);
  return organization;
}

async function handleInvitationPreview(response, token) {
  try {
    const invitation = await invitationByToken(token);
    if (!invitation || invitation.status !== "pending") {
      sendJson(response, 404, { error: "invitation_not_found", message: "Diese Einladung ist nicht mehr gültig." });
      return;
    }
    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      await supabaseUpdate(`/organization_invitations?id=eq.${encodeURIComponent(invitation.id)}`, { status: "expired" }).catch(() => null);
      sendJson(response, 410, { error: "invitation_expired", message: "Diese Einladung ist abgelaufen. Bitte den Admin um einen neuen Link." });
      return;
    }
    const organizations = await supabaseSelect(`/customers?select=id,name,slug,short_code,brand_color,organization_type&id=eq.${encodeURIComponent(invitation.organization_id)}&limit=1`);
    sendJson(response, 200, {
      invitation: {
        organization: organizations[0] ? mapOrganizationRow(organizations[0]) : null,
        role: invitation.role,
        emailHint: maskEmail(invitation.email),
        expiresAt: invitation.expires_at
      }
    });
  } catch (error) {
    sendJson(response, 503, { error: "invitation_unavailable", message: redactSecret(error.message) });
  }
}

async function handleAcceptInvitation(request, response, token) {
  try {
    const invitation = await invitationByToken(token);
    const email = normalizeInvitationEmail(request.ramrodUser?.email);
    if (!invitation || invitation.status !== "pending") throw httpError(404, "Diese Einladung ist nicht mehr gültig.");
    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      await supabaseUpdate(`/organization_invitations?id=eq.${encodeURIComponent(invitation.id)}`, { status: "expired" });
      throw httpError(410, "Diese Einladung ist abgelaufen.");
    }
    if (!email || email !== invitation.email) throw httpError(403, `Diese Einladung wurde für ${maskEmail(invitation.email)} erstellt.`);
    const membershipRows = await supabaseUpsert("/organization_memberships?on_conflict=organization_id,user_id", {
      organization_id: invitation.organization_id,
      user_id: request.ramrodUser.id,
      role: invitation.role,
      status: "active"
    });
    await supabaseUpdate(`/organization_invitations?id=eq.${encodeURIComponent(invitation.id)}&status=eq.pending`, {
      status: "accepted",
      accepted_by: request.ramrodUser.id,
      accepted_at: new Date().toISOString()
    });
    const organizations = await supabaseSelect(`/customers?select=*&id=eq.${encodeURIComponent(invitation.organization_id)}&limit=1`);
    sendJson(response, 200, { organization: mapOrganizationRow(organizations[0]), membership: membershipRows[0] });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "invitation_accept_failed", message: redactSecret(error.message) });
  }
}

async function handleOrganizationTeam(request, response) {
  const tenant = await requireTenantPermission(request, response, "team:manage");
  if (!tenant) return;
  try {
    const organizationId = tenant.activeOrganization.id;
    const [memberships, invitations, authUsers] = await Promise.all([
      supabaseSelect(`/organization_memberships?select=id,organization_id,user_id,role,status,support_access,created_at,updated_at&organization_id=eq.${encodeURIComponent(organizationId)}&order=created_at.asc`),
      supabaseSelect(`/organization_invitations?select=id,email,role,status,expires_at,created_at,updated_at&organization_id=eq.${encodeURIComponent(organizationId)}&order=created_at.desc&limit=100`),
      supabaseAdminUsers().catch(() => [])
    ]);
    const userById = new Map(authUsers.map((user) => [user.id, user]));
    sendJson(response, 200, {
      members: memberships.map((entry) => ({
        ...entry,
        email: userById.get(entry.user_id)?.email || (entry.user_id === request.ramrodUser?.id ? request.ramrodUser.email : "Mitglied"),
        name: userById.get(entry.user_id)?.user_metadata?.name || userById.get(entry.user_id)?.user_metadata?.full_name || ""
      })),
      invitations,
      channels: await organizationChannelAccounts(organizationId),
      permissions: tenant.permissions
    });
  } catch (error) {
    sendJson(response, 500, { error: "team_load_failed", message: redactSecret(error.message) });
  }
}

async function handleCreateOrganizationInvitation(request, response) {
  const tenant = await requireTenantPermission(request, response, "team:manage");
  if (!tenant) return;
  try {
    const body = JSON.parse(await readRequestBody(request, 64 * 1024));
    const email = normalizeInvitationEmail(body.email);
    const role = normalizeOrganizationRole(body.role, "operator");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw httpError(400, "Bitte eine gültige E-Mail-Adresse angeben.");
    if (!canAssignOrganizationRole(tenant.activeOrganization.role, role, tenant.platformAdmin)) {
      throw httpError(403, "Diese Rolle darfst du nicht vergeben.");
    }
    const token = createInvitationToken();
    const tokenHash = hashInvitationToken(token);
    const organizationId = tenant.activeOrganization.id;
    const existing = await supabaseSelect(`/organization_invitations?select=id&organization_id=eq.${encodeURIComponent(organizationId)}&email=eq.${encodeURIComponent(email)}&status=eq.pending&limit=1`);
    const payload = {
      organization_id: organizationId,
      email,
      role,
      token_hash: tokenHash,
      status: "pending",
      invited_by: isUuid(request.ramrodUser?.id) ? request.ramrodUser.id : null,
      expires_at: invitationExpiresAt(body.expiresInDays || 7),
      accepted_by: null,
      accepted_at: null
    };
    const rows = existing[0]
      ? await supabaseUpdate(`/organization_invitations?id=eq.${encodeURIComponent(existing[0].id)}`, payload)
      : await supabaseInsert("/organization_invitations", payload);
    sendJson(response, 201, {
      invitation: { ...rows[0], token_hash: undefined },
      inviteUrl: `${requestBaseUrl(request)}/?invite=${encodeURIComponent(token)}`
    });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "invitation_create_failed", message: redactSecret(error.message) });
  }
}

async function handleOrganizationInvitationAction(request, response, invitationId, action) {
  const tenant = await requireTenantPermission(request, response, "team:manage");
  if (!tenant) return;
  try {
    const organizationId = tenant.activeOrganization.id;
    const rows = await supabaseSelect(`/organization_invitations?select=*&id=eq.${encodeURIComponent(invitationId)}&organization_id=eq.${encodeURIComponent(organizationId)}&limit=1`);
    if (!rows[0]) throw httpError(404, "Einladung nicht gefunden.");
    if (action === "revoke") {
      const updated = await supabaseUpdate(`/organization_invitations?id=eq.${encodeURIComponent(invitationId)}`, { status: "revoked" });
      sendJson(response, 200, { invitation: publicInvitation(updated[0]) });
      return;
    }
    const token = createInvitationToken();
    const updated = await supabaseUpdate(`/organization_invitations?id=eq.${encodeURIComponent(invitationId)}`, {
      token_hash: hashInvitationToken(token),
      status: "pending",
      expires_at: invitationExpiresAt(7),
      accepted_by: null,
      accepted_at: null
    });
    sendJson(response, 200, { invitation: publicInvitation(updated[0]), inviteUrl: `${requestBaseUrl(request)}/?invite=${encodeURIComponent(token)}` });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "invitation_update_failed", message: redactSecret(error.message) });
  }
}

async function handleUpdateOrganizationMembership(request, response, membershipId) {
  const tenant = await requireTenantPermission(request, response, "team:manage");
  if (!tenant) return;
  try {
    const body = JSON.parse(await readRequestBody(request, 32 * 1024));
    const organizationId = tenant.activeOrganization.id;
    const rows = await supabaseSelect(`/organization_memberships?select=*&id=eq.${encodeURIComponent(membershipId)}&organization_id=eq.${encodeURIComponent(organizationId)}&limit=1`);
    const target = rows[0];
    if (!target) throw httpError(404, "Mitglied nicht gefunden.");
    if (target.role === "owner") throw httpError(403, "Die Inhaberrolle kann hier nicht geändert oder gesperrt werden.");
    const role = body.role ? normalizeOrganizationRole(body.role, "") : target.role;
    const status = ["active", "suspended"].includes(body.status) ? body.status : target.status;
    if (!canAssignOrganizationRole(tenant.activeOrganization.role, role, tenant.platformAdmin)) throw httpError(403, "Diese Rolle darfst du nicht vergeben.");
    if (target.user_id === request.ramrodUser?.id && status === "suspended") throw httpError(400, "Du kannst deinen eigenen Zugang nicht sperren.");
    const updated = await supabaseUpdate(`/organization_memberships?id=eq.${encodeURIComponent(membershipId)}`, { role, status });
    sendJson(response, 200, { membership: updated[0] });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "membership_update_failed", message: redactSecret(error.message) });
  }
}

async function handleSaveOrganizationChannels(request, response) {
  const tenant = await requireTenantPermission(request, response, "channels:manage");
  if (!tenant) return;
  try {
    const body = JSON.parse(await readRequestBody(request, 64 * 1024));
    const channelIds = cleanOnboardingChannelIds(body.channels);
    const existing = await organizationChannelAccounts(tenant.activeOrganization.id);
    const existingIds = new Set(existing.map((entry) => entry.channel_id));
    const createIds = channelIds.filter((id) => !existingIds.has(id));
    if (createIds.length) {
      await supabaseInsert("/organization_channel_accounts", createIds.map((channelId) => {
        const channel = publicChannelRegistry().find((entry) => entry.id === channelId);
        return {
          organization_id: tenant.activeOrganization.id,
          channel_id: channelId,
          display_name: channel?.name || channelId,
          auth_mode: channelId === "ebay" ? "oauth" : "manual",
          status: "planned",
          metadata: { selectedInSettings: true }
        };
      }));
    }
    sendJson(response, 200, { channels: await organizationChannelAccounts(tenant.activeOrganization.id) });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "channel_save_failed", message: redactSecret(error.message) });
  }
}

async function handleEbaySetupStatus(request, response) {
  const tenant = await requireTenantPermission(request, response, "channels:manage");
  if (!tenant) return;
  sendJson(response, 200, {
    setup: await buildEbaySetupState(tenant.activeOrganization.id, request)
  });
}

async function handleEbaySetupStart(request, response) {
  const tenant = await requireTenantPermission(request, response, "channels:manage");
  if (!tenant) return;
  const readiness = ebayOAuthReadiness(ebaySellerOAuthConfig);
  if (!credentialStore.available) readiness.missing.push("RAMROD_SECRET_ENCRYPTION_KEY");
  if (!readiness.ready || !credentialStore.available) {
    sendJson(response, 409, {
      error: "ebay_oauth_not_ready",
      message: "RAMROD muss den eBay-Zugang noch technisch vervollständigen.",
      missing: [...new Set(readiness.missing)]
    });
    return;
  }

  try {
    const account = await ensureEbayChannelAccount(tenant.activeOrganization.id);
    const state = createEbayOAuthState({
      organizationId: tenant.activeOrganization.id,
      channelAccountId: account.id,
      requestedBy: isUuid(request.ramrodUser?.id) ? request.ramrodUser.id : null
    }, ebaySellerOAuthConfig.stateSecret);
    const authorizeUrl = buildEbayConsentUrl(ebaySellerOAuthConfig, state);
    await supabaseUpdate(`/organization_channel_accounts?id=eq.${encodeURIComponent(account.id)}`, {
      status: "onboarding",
      metadata: {
        ...(account.metadata || {}),
        setupStartedAt: new Date().toISOString(),
        oauthEnvironment: ebaySellerOAuthConfig.environment
      }
    });
    sendJson(response, 200, {
      authorizeUrl,
      message: "Melde dich bei eBay an und bestätige den Zugriff. Danach prüft RAMROD automatisch weiter."
    });
  } catch (error) {
    sendJson(response, 500, { error: "ebay_setup_start_failed", message: redactSecret(error.message) });
  }
}

async function handleEbaySetupVerify(request, response) {
  const tenant = await requireTenantPermission(request, response, "channels:manage");
  if (!tenant) return;
  try {
    const account = await ebayChannelAccount(tenant.activeOrganization.id);
    if (!account?.secret_ref || !credentialStore.has(account.secret_ref)) {
      sendJson(response, 409, { error: "ebay_oauth_required", message: "Bitte eBay zuerst verbinden." });
      return;
    }
    await verifyAndPersistEbaySetup(account);
    sendJson(response, 200, {
      setup: await buildEbaySetupState(tenant.activeOrganization.id, request)
    });
  } catch (error) {
    sendJson(response, 400, { error: "ebay_setup_verify_failed", message: redactSecret(error.message) });
  }
}

async function handleEbaySetupDefaults(request, response) {
  const tenant = await requireTenantPermission(request, response, "channels:manage");
  if (!tenant) return;
  try {
    const body = JSON.parse(await readRequestBody(request, 32 * 1024));
    if (body.confirm !== true) {
      sendJson(response, 400, {
        error: "explicit_confirmation_required",
        message: "Bitte die einmalige Einrichtung ausdrücklich bestätigen."
      });
      return;
    }

    const account = await ebayChannelAccount(tenant.activeOrganization.id);
    if (!account?.secret_ref || !credentialStore.has(account.secret_ref)) {
      sendJson(response, 409, { error: "ebay_oauth_required", message: "Bitte eBay zuerst verbinden." });
      return;
    }

    let credentials = credentialStore.get(account.secret_ref);
    const fresh = await ensureFreshEbayCredentials(ebaySellerOAuthConfig, credentials);
    if (fresh.updatedAt !== credentials.updatedAt) {
      credentialStore.put(account.secret_ref, fresh);
      credentials = fresh;
    }

    const currentSetup = await inspectEbaySellerSetup(ebaySellerOAuthConfig, credentials.accessToken);
    const privateSeller = tenant.activeOrganization.sellerMode === "private";
    if (privateSeller) {
      const result = buildPrivateEbaySellerSetup(currentSetup, body.settings || {});
      await supabaseUpdate(`/organization_channel_accounts?id=eq.${encodeURIComponent(account.id)}`, {
        status: "connected",
        capabilities: ["sell.trading", "sell.fulfillment"],
        last_verified_at: result.sellerSetup.verifiedAt,
        metadata: {
          ...(account.metadata || {}),
          sellerSetup: result.sellerSetup,
          sellerDefaults: result.settings,
          verificationMessage: "Privates eBay-Konto verbunden; Versand und Rückgabe werden pro Artikel übertragen."
        }
      });
      sendJson(response, 200, {
        created: ["Private Verkaufsregeln"],
        setup: await buildEbaySetupState(tenant.activeOrganization.id, request),
        message: "Private Verkaufsregeln gespeichert. Versand und Rückgabe werden für jeden Artikel einzeln gesetzt. Es wurde nichts veröffentlicht."
      });
      return;
    }

    const result = await createMissingEbaySellerDefaults(
      ebaySellerOAuthConfig,
      credentials.accessToken,
      currentSetup,
      body.settings || {}
    );
    const sellerSetup = await verifyAndPersistEbaySetup(account);
    await supabaseUpdate(`/organization_channel_accounts?id=eq.${encodeURIComponent(account.id)}`, {
      metadata: {
        ...(account.metadata || {}),
        sellerSetup,
        sellerDefaults: result.settings,
        verificationMessage: "eBay ist für Listing-Entwürfe vorbereitet."
      }
    });
    sendJson(response, 200, {
      created: result.created,
      setup: await buildEbaySetupState(tenant.activeOrganization.id, request),
      message: result.created.length
        ? `${result.created.join(", ")} wurden bei eBay angelegt. Es wurde kein Artikel veröffentlicht.`
        : "Die benötigten eBay-Regeln waren bereits vorhanden. Es wurde kein Artikel veröffentlicht."
    });
  } catch (error) {
    console.error("eBay seller defaults failed:", redactSecret(error.message));
    sendJson(response, 400, { error: "ebay_setup_defaults_failed", message: redactSecret(error.message) });
  }
}

async function handleEbayOAuthCallback(request, response) {
  const url = new URL(request.url, "http://localhost");
  const code = url.searchParams.get("code") || "";
  const stateValue = url.searchParams.get("state") || "";
  if (!code || !stateValue) {
    sendEbayOAuthResult(response, {
      ok: false,
      title: "eBay-Verbindung unvollständig",
      message: "eBay hat keine vollständige Freigabe zurückgegeben. Starte die Verbindung in RAMROD erneut."
    });
    return;
  }

  try {
    const state = verifyEbayOAuthState(stateValue, ebaySellerOAuthConfig.stateSecret);
    if (!isUuid(state.organizationId) || !isUuid(state.channelAccountId)) {
      throw new Error("Der Kundenbereich der eBay-Freigabe ist ungültig.");
    }
    const accounts = await supabaseSelect(`/organization_channel_accounts?select=id,organization_id,channel_id,display_name,status,secret_ref,capabilities,metadata&id=eq.${encodeURIComponent(state.channelAccountId)}&organization_id=eq.${encodeURIComponent(state.organizationId)}&channel_id=eq.ebay&limit=1`);
    const account = accounts[0];
    if (!account) throw new Error("Das zugehörige eBay-Konto wurde in RAMROD nicht gefunden.");

    const token = await exchangeEbayAuthorizationCode(ebaySellerOAuthConfig, code);
    const credentials = mapEbayTokenResponse(token, ebaySellerOAuthConfig.scopes, {
      environment: ebaySellerOAuthConfig.environment
    });
    const secretRef = account.secret_ref || buildSecretRef("ebay", account.organization_id, account.id);
    credentialStore.put(secretRef, credentials);
    await supabaseUpdate(`/organization_channel_accounts?id=eq.${encodeURIComponent(account.id)}`, {
      secret_ref: secretRef,
      status: "connected",
      capabilities: ["sell.account", "sell.inventory", "sell.fulfillment"],
      metadata: {
        ...(account.metadata || {}),
        oauthEnvironment: ebaySellerOAuthConfig.environment,
        oauthConnectedAt: new Date().toISOString()
      }
    });

    const updatedAccount = { ...account, secret_ref: secretRef };
    await verifyAndPersistEbaySetup(updatedAccount).catch(async (error) => {
      await supabaseUpdate(`/organization_channel_accounts?id=eq.${encodeURIComponent(account.id)}`, {
        status: "action_required",
        metadata: {
          ...(account.metadata || {}),
          oauthEnvironment: ebaySellerOAuthConfig.environment,
          oauthConnectedAt: new Date().toISOString(),
          verificationMessage: redactSecret(error.message)
        }
      });
    });

    const redirectBase = publicAppUrl || requestBaseUrl(request);
    response.writeHead(302, {
      Location: `${redirectBase}/?view=agents&ebay=connected`,
      "Cache-Control": "no-store"
    });
    response.end();
  } catch (error) {
    console.error("eBay OAuth callback failed:", redactSecret(error.message));
    sendEbayOAuthResult(response, {
      ok: false,
      title: "eBay konnte noch nicht verbunden werden",
      message: redactSecret(error.message)
    });
  }
}

async function buildEbaySetupState(organizationId, request = null) {
  const readiness = ebayOAuthReadiness(ebaySellerOAuthConfig);
  if (!credentialStore.available) readiness.missing.push("RAMROD_SECRET_ENCRYPTION_KEY");
  const account = await ebayChannelAccount(organizationId).catch(() => null);
  const sellerMode = await organizationSellerMode(organizationId).catch(() => "business");
  const oauthConnected = Boolean(account?.secret_ref && credentialStore.available && credentialStore.has(account.secret_ref));
  const verification = account?.metadata?.sellerSetup || null;
  const privateSeller = sellerMode === "private";
  const privateListingMode = privateSeller;
  const privateRulesReady = Boolean(verification?.privateSellerRulesReady && verification?.merchantPostalCode);
  const policiesReady = privateListingMode
    ? privateRulesReady
    : Boolean(
      verification?.paymentPolicyCount > 0
      && verification?.fulfillmentPolicyCount > 0
      && verification?.returnPolicyCount > 0
    );
  const locationReady = privateListingMode
    ? privateRulesReady
    : Boolean(verification?.locationCount > 0);
  const verified = Boolean(verification?.verifiedAt);
  const ready = Boolean(readiness.ready && credentialStore.available && oauthConnected && policiesReady && locationReady);
  const callbackBase = publicAppUrl || (request ? requestBaseUrl(request) : "");

  let nextAction = "complete";
  let actionLabel = "eBay ist bereit";
  if (!readiness.ready || !credentialStore.available) {
    nextAction = "developer";
    actionLabel = "Technik vervollständigen";
  } else if (!oauthConnected) {
    nextAction = "connect";
    actionLabel = "Mit eBay verbinden";
  } else if (!verified) {
    nextAction = "verify";
    actionLabel = "Verbindung prüfen";
  } else if (!policiesReady || !locationReady) {
    nextAction = "defaults";
    actionLabel = "Verkaufsregeln anlegen";
  }

  return {
    environment: ebaySellerOAuthConfig.environment,
    sellerMode,
    listingMode: privateListingMode ? "trading" : "inventory",
    privateSeller,
    accountId: account?.id || null,
    accountStatus: account?.status || "planned",
    ready,
    oauthConnected,
    policiesReady,
    locationReady,
    needsSellerDefaults: oauthConnected && (!policiesReady || !locationReady),
    verifiedAt: verification?.verifiedAt || account?.last_verified_at || null,
    warnings: verification?.warnings || [],
    sellerDefaults: account?.metadata?.sellerDefaults || null,
    missingConfiguration: [...new Set(readiness.missing)],
    callbackUrl: callbackBase ? `${callbackBase}/api/ebay/oauth/callback` : "",
    nextAction,
    actionLabel,
    links: {
      developerPortal: "https://developer.ebay.com/my/keys",
      sellerPolicies: "https://www.ebay.de/sh/pp",
      sellerHub: "https://www.ebay.de/sh/ovw"
    },
    steps: [
      { id: "technical", label: "RAMROD-Zugang", ready: readiness.ready && credentialStore.available, detail: readiness.ready && credentialStore.available ? "Sicher vorbereitet" : "Technische Konfiguration offen" },
      { id: "oauth", label: "eBay-Freigabe", ready: oauthConnected, detail: oauthConnected ? "Zugriff bestätigt" : "Einmal anmelden und zustimmen" },
      { id: "policies", label: "Verkaufsregeln", ready: policiesReady, detail: privateListingMode ? (policiesReady ? "Versand und Rückgabe pro Artikel gespeichert" : "Privatregeln noch bestätigen") : (policiesReady ? "Zahlung, Versand und Rückgabe gefunden" : "eBay-Regeln noch prüfen") },
      { id: "location", label: "Versandort", ready: locationReady, detail: privateListingMode ? (locationReady ? "Versand-PLZ gespeichert" : "Versand-PLZ noch speichern") : (locationReady ? "Lagerort gefunden" : "Lagerort noch prüfen") }
    ]
  };
}

async function organizationSellerMode(organizationId) {
  if (!organizationId) return "business";
  try {
    const rows = await supabaseSelect(`/customers?select=seller_mode&id=eq.${encodeURIComponent(organizationId)}&limit=1`);
    return rows[0]?.seller_mode || "business";
  } catch {
    return "business";
  }
}

async function ensureEbayChannelAccount(organizationId) {
  const existing = await ebayChannelAccount(organizationId);
  if (existing) return existing;
  const rows = await supabaseInsert("/organization_channel_accounts", {
    organization_id: organizationId,
    channel_id: "ebay",
    display_name: "eBay",
    auth_mode: "oauth",
    status: "planned",
    metadata: { selectedInSettings: true }
  });
  return rows[0];
}

async function ebayChannelAccount(organizationId) {
  const rows = await supabaseSelect(`/organization_channel_accounts?select=id,organization_id,channel_id,display_name,auth_mode,status,external_account_ref,secret_ref,browser_profile_key,capabilities,metadata,last_verified_at,created_at,updated_at&organization_id=eq.${encodeURIComponent(organizationId)}&channel_id=eq.ebay&order=created_at.asc&limit=1`);
  return rows[0] || null;
}

async function verifyAndPersistEbaySetup(account) {
  let credentials = credentialStore.get(account.secret_ref);
  const fresh = await ensureFreshEbayCredentials(ebaySellerOAuthConfig, credentials);
  if (fresh.updatedAt !== credentials.updatedAt) {
    credentialStore.put(account.secret_ref, fresh);
    credentials = fresh;
  }
  const inspectedSetup = await inspectEbaySellerSetup(ebaySellerOAuthConfig, credentials.accessToken);
  const sellerMode = await organizationSellerMode(account.organization_id);
  const previousSetup = account.metadata?.sellerSetup || {};
  const privateListingMode = sellerMode === "private";
  const sellerSetup = privateListingMode
    ? { ...inspectedSetup, ...previousSetup, warnings: inspectedSetup.warnings, verifiedAt: inspectedSetup.verifiedAt, listingMode: "trading" }
    : inspectedSetup;
  const complete = privateListingMode
    ? Boolean(sellerSetup.privateSellerRulesReady && sellerSetup.merchantPostalCode)
    : sellerSetup.paymentPolicyCount > 0
      && sellerSetup.fulfillmentPolicyCount > 0
      && sellerSetup.returnPolicyCount > 0
      && sellerSetup.locationCount > 0;
  await supabaseUpdate(`/organization_channel_accounts?id=eq.${encodeURIComponent(account.id)}`, {
    status: complete ? "connected" : "action_required",
    capabilities: privateListingMode ? ["sell.trading", "sell.fulfillment"] : ["sell.account", "sell.inventory", "sell.fulfillment"],
    last_verified_at: sellerSetup.verifiedAt,
    metadata: {
      ...(account.metadata || {}),
      sellerSetup,
      verificationMessage: complete
        ? (privateListingMode ? "Privates eBay-Konto verbunden; Regeln werden pro Artikel übertragen." : "eBay ist für Listing-Entwürfe vorbereitet.")
        : (privateListingMode ? "eBay ist verbunden; private Verkaufsregeln müssen noch bestätigt werden." : "eBay ist verbunden; mindestens eine Verkaufseinstellung fehlt noch.")
    }
  });
  return sellerSetup;
}

function sendEbayOAuthResult(response, { ok, title, message }) {
  const appUrl = publicAppUrl || "https://admin.ramrod.live";
  const tone = ok ? "#267a50" : "#a33b00";
  response.writeHead(ok ? 200 : 400, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font:16px/1.5 system-ui;margin:0;background:#f4f5f6;color:#111827}.box{max-width:620px;margin:12vh auto;background:#fff;border-top:4px solid ${tone};padding:28px}h1{margin-top:0}a{display:inline-block;background:#111;color:#fff;padding:12px 16px;text-decoration:none;margin-top:12px}</style></head><body><main class="box"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><a href="${escapeHtml(appUrl)}/?view=agents">Zurück zu RAMROD</a></main></body></html>`);
}

async function requireTenantPermission(request, response, permission) {
  const tenant = await resolveTenantContext(request);
  if (!tenant.activeOrganization) {
    sendJson(response, 403, { error: "organization_access_required", message: "Kein Kundenbereich ausgewählt." });
    return null;
  }
  if (!hasOrganizationPermission(tenant.activeOrganization.role, permission, tenant.platformAdmin)) {
    sendJson(response, 403, { error: "organization_permission_required", message: "Für diese Aktion fehlen dir die Rechte." });
    return null;
  }
  return tenant;
}

function recognitionContextBarcode(recognition, body = {}) {
  if (body.barcode) return String(body.barcode).replace(/\s/g, "");
  const identifier = (recognition?.identifiers || []).find((entry) =>
    /barcode|ean|upc|gtin/i.test(String(entry?.type || ""))
    || /^\d{8,14}$/.test(String(entry?.value || "").replace(/\s/g, ""))
  );
  return identifier?.value ? String(identifier.value).replace(/\s/g, "") : "";
}

function sanitizeRecognitionCorrectionNote(value) {
  return String(value || "")
    .trim()
    .slice(0, 1000)
    .replace(/\b(?=[a-z0-9-]{12,}\b)(?=[a-z0-9-]*\d)[a-z0-9-]+\b/gi, "[vertraulicher Code entfernt]");
}

async function compareRecognitionLearning(recognition, body = {}) {
  const identity = recognition?.identity || {};
  const barcode = recognitionContextBarcode(recognition, body);
  const fingerprint = recognitionFingerprint(identity, { barcode });
  try {
    const [patterns, feedbackRows] = await Promise.all([
      supabaseSelect(`/recognition_learning_patterns?select=fingerprint,canonical_identity,confirmations,distinct_organizations,status,updated_at&fingerprint=eq.${encodeURIComponent(fingerprint)}&limit=1`),
      supabaseSelect(`/recognition_feedback?select=id,organization_id,item_id,corrected_identity,status,created_at&fingerprint=eq.${encodeURIComponent(fingerprint)}&status=in.(pending,corroborated,validated)&order=created_at.desc&limit=100`)
    ]);
    const groups = aggregateRecognitionFeedback(feedbackRows);
    const strongest = groups[0] || null;
    const pattern = patterns[0] || null;
    const recommendation = pattern?.canonical_identity || strongest?.correctedIdentity || null;
    const active = pattern?.status === "active";
    const conflicts = Boolean(recommendation)
      && correctedIdentitySignature(recommendation) !== correctedIdentitySignature(identity);
    if (active && conflicts) {
      recognition.evidence = {
        ...(recognition.evidence || {}),
        originalStatus: recognition.evidence?.originalStatus || recognition.evidence?.status,
        status: "manual_review_ready",
        manualIdentityRequired: true,
        autoApprovalEligible: false
      };
    }
    return {
      available: true,
      fingerprint,
      comparedCases: feedbackRows.length,
      confirmations: Number(pattern?.confirmations || strongest?.confirmations || 0),
      distinctOrganizations: Number(pattern?.distinct_organizations || strongest?.distinctOrganizations || 0),
      status: pattern?.status || (strongest ? "candidate" : "none"),
      conflicts,
      recommendation,
      notice: active
        ? "Bestätigtes Vergleichsmuster gefunden. Es wird zur Gegenprüfung angezeigt, aber nicht automatisch übernommen."
        : feedbackRows.length
          ? "Ähnliche Korrekturen wurden gefunden. Sie bleiben Vergleichshinweise, bis mehrere unabhängige Bestätigungen vorliegen."
          : "Noch kein vergleichbarer Korrekturfall vorhanden."
    };
  } catch (error) {
    return { available: false, fingerprint, comparedCases: 0, status: "unavailable", notice: redactSecret(error.message) };
  }
}

async function handleRecognitionFeedback(request, response) {
  const tenant = await requireTenantPermission(request, response, "inventory:write");
  if (!tenant) return;
  try {
    const body = JSON.parse(await readRequestBody(request, 256 * 1024));
    const predicted = body.predictedIdentity && typeof body.predictedIdentity === "object" ? body.predictedIdentity : {};
    const corrected = body.correctedIdentity && typeof body.correctedIdentity === "object" ? body.correctedIdentity : {};
    if (!String(corrected.title || "").trim()) throw httpError(400, "Der korrigierte Titel fehlt.");
    const context = body.comparisonContext && typeof body.comparisonContext === "object" ? body.comparisonContext : {};
    const fingerprint = recognitionFingerprint(predicted, { barcode: context.barcode });
    const inserted = await supabaseInsert("/recognition_feedback", {
      organization_id: tenant.activeOrganization.id,
      item_id: isUuid(body.itemId) ? body.itemId : null,
      submitted_by: isUuid(request.ramrodUser?.id) ? request.ramrodUser.id : null,
      fingerprint,
      predicted_identity: predicted,
      corrected_identity: corrected,
      comparison_context: {
        barcode: String(context.barcode || ""),
        captureIntent: String(context.captureIntent || ""),
        source: String(context.source || "manual_correction"),
        conditionExcluded: true,
        completenessExcluded: true
      },
      correction_note: sanitizeRecognitionCorrectionNote(body.correctionNote) || null,
      status: "pending"
    });
    const rows = await supabaseSelect(`/recognition_feedback?select=id,organization_id,item_id,corrected_identity,status,created_at&fingerprint=eq.${encodeURIComponent(fingerprint)}&status=in.(pending,corroborated,validated)&order=created_at.desc&limit=200`);
    const strongest = aggregateRecognitionFeedback(rows)[0];
    const active = Boolean(strongest && strongest.confirmations >= 3 && strongest.distinctOrganizations >= 2);
    let pattern = null;
    if (strongest) {
      const patterns = await supabaseUpsert("/recognition_learning_patterns?on_conflict=fingerprint", {
        fingerprint,
        canonical_identity: strongest.correctedIdentity,
        confirmations: strongest.confirmations,
        distinct_organizations: strongest.distinctOrganizations,
        supporting_feedback_ids: strongest.feedbackIds,
        status: active ? "active" : "candidate",
        activated_at: active ? new Date().toISOString() : null
      });
      pattern = patterns[0] || null;
      if (strongest.feedbackIds.length) {
        await supabaseUpdate(`/recognition_feedback?id=in.(${strongest.feedbackIds.map(encodeURIComponent).join(",")})`, {
          status: active ? "validated" : "corroborated"
        });
      }
    }
    sendJson(response, 201, {
      feedback: inserted[0] || null,
      comparison: {
        confirmations: strongest?.confirmations || 1,
        distinctOrganizations: strongest?.distinctOrganizations || 1,
        status: pattern?.status || "candidate",
        canonicalIdentity: pattern?.canonical_identity || strongest?.correctedIdentity || corrected,
        appliedAutomatically: false
      }
    });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "recognition_feedback_failed", message: redactSecret(error.message) });
  }
}

function cleanCollectionScope(scope = {}) {
  const allowedMediaTypes = new Set(["film", "game", "other"]);
  const mediaTypes = [...new Set((Array.isArray(scope.mediaTypes) ? scope.mediaTypes : ["film", "game", "other"])
    .map((entry) => String(entry || "").toLowerCase())
    .filter((entry) => allowedMediaTypes.has(entry)))];
  return {
    mediaTypes: mediaTypes.length ? mediaTypes : ["film", "game", "other"],
    hiddenAgeRatings: [...new Set((Array.isArray(scope.hiddenAgeRatings) ? scope.hiddenAgeRatings : ["FSK 18"])
      .map((entry) => String(entry || "").trim()).filter(Boolean))].slice(0, 20),
    hiddenItemIds: [...new Set((Array.isArray(scope.hiddenItemIds) ? scope.hiddenItemIds : [])
      .map((entry) => String(entry || "").trim()).filter(isUuid))].slice(0, 500),
    allowLoans: scope.allowLoans !== false
  };
}

function publicCollectionShare(row, organizations = []) {
  const owner = organizations.find((entry) => entry.id === row.owner_organization_id);
  return {
    id: row.id,
    ownerOrganizationId: row.owner_organization_id,
    ownerName: owner?.name || "Private Sammlung",
    recipientEmail: row.recipient_email,
    status: row.status,
    scope: cleanCollectionScope(row.scope || {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function sanitizeSharedCollectionItem(row, share, ownerName, boxes = []) {
  const item = mapDbItemToUi(row, boxes);
  const collection = item.collection || {};
  return {
    id: item.id,
    dbId: row.id,
    sku: item.sku,
    title: item.title,
    category: item.category,
    franchise: item.franchise,
    condition: item.condition,
    completeness: item.completeness,
    confidence: item.confidence,
    low: item.low,
    fair: item.fair,
    aggressive: item.aggressive,
    image: item.image,
    collection: {
      status: collection.status || "owned",
      mediaType: collection.mediaType || "other",
      platform: collection.platform || "",
      edition: collection.edition || "",
      estimatedValue: Number(collection.estimatedValue || item.fair || 0),
      genres: Array.isArray(collection.genres) ? collection.genres : [],
      themes: Array.isArray(collection.themes) ? collection.themes : [],
      moods: Array.isArray(collection.moods) ? collection.moods : [],
      releaseYear: collection.releaseYear || "",
      ageRating: collection.ageRating || "",
      summary: collection.summary || "",
      reviewLinks: Array.isArray(collection.reviewLinks) ? collection.reviewLinks : []
    },
    sharedAccess: {
      shareId: share.id,
      ownerOrganizationId: share.owner_organization_id,
      ownerName,
      allowLoans: cleanCollectionScope(share.scope).allowLoans
    }
  };
}

function collectionParticipantQuery(user) {
  const filters = [];
  if (isUuid(user?.id)) filters.push(`recipient_user_id.eq.${user.id}`);
  const email = normalizeInvitationEmail(user?.email);
  if (email) filters.push(`recipient_email.eq.${email}`);
  return filters.length ? `or=(${filters.join(",")})` : "";
}

async function handleCollectionNetwork(request, response) {
  const tenant = await requireTenantPermission(request, response, "inventory:read");
  if (!tenant) return;
  if (tenant.activeOrganization.type !== "personal") {
    sendJson(response, 200, { available: false, message: "Wechsle in deinen Bereich „Privat“, um persönliche Freigaben und Ausleihen zu verwalten." });
    return;
  }
  const user = request.ramrodUser || {};
  if (!isUuid(user.id) || !normalizeInvitationEmail(user.email)) {
    sendJson(response, 200, { available: false, message: "Sammlungsfreigaben benötigen ein persönliches RAMROD-Konto." });
    return;
  }
  try {
    const organizationId = tenant.activeOrganization.id;
    const participantQuery = collectionParticipantQuery(user);
    const [organizations, ownedShares, receivedShares, incomingAccessRequests, outgoingAccessRequests, ownerLoanRequests, requesterLoanRequests] = await Promise.all([
      selectOrganizations(),
      supabaseSelect(`/collection_shares?select=*&owner_organization_id=eq.${encodeURIComponent(organizationId)}&order=created_at.desc`),
      participantQuery ? supabaseSelect(`/collection_shares?select=*&${participantQuery}&status=eq.active&order=created_at.desc`) : [],
      supabaseSelect(`/collection_access_requests?select=*&owner_organization_id=eq.${encodeURIComponent(organizationId)}&order=created_at.desc`),
      supabaseSelect(`/collection_access_requests?select=*&requester_user_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc`),
      supabaseSelect(`/collection_loan_requests?select=*&owner_organization_id=eq.${encodeURIComponent(organizationId)}&order=created_at.desc`),
      supabaseSelect(`/collection_loan_requests?select=*&requester_user_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc`)
    ]);
    const sharedItems = [];
    for (const share of receivedShares) {
      const owner = organizations.find((entry) => entry.id === share.owner_organization_id);
      const [rows, boxes] = await Promise.all([
        supabaseSelect(`/items?select=*&customer_id=eq.${encodeURIComponent(share.owner_organization_id)}&order=created_at.desc&limit=1000`),
        supabaseSelect(`/boxes?select=id,code,label,location,status,customer_id&customer_id=eq.${encodeURIComponent(share.owner_organization_id)}&order=code.asc`)
      ]);
      for (const row of rows) {
        const item = mapDbItemToUi(row, boxes);
        if (!item.collection || !["owned", "loaned"].includes(String(item.collection.status || "owned"))) continue;
        if (!scopeAllowsCollectionItem(cleanCollectionScope(share.scope), item)) continue;
        sharedItems.push(sanitizeSharedCollectionItem(row, share, owner?.name || "Private Sammlung", boxes));
      }
    }
    sendJson(response, 200, {
      available: true,
      ownedShares: ownedShares.map((entry) => publicCollectionShare(entry, organizations)),
      receivedShares: receivedShares.map((entry) => publicCollectionShare(entry, organizations)),
      sharedItems,
      incomingAccessRequests,
      outgoingAccessRequests,
      ownerLoanRequests,
      requesterLoanRequests
    });
  } catch (error) {
    sendJson(response, 200, { available: false, message: `Sammlungsnetzwerk noch nicht eingerichtet: ${redactSecret(error.message)}` });
  }
}

async function handleCreateCollectionShare(request, response) {
  const tenant = await requireTenantPermission(request, response, "team:manage");
  if (!tenant) return;
  try {
    if (tenant.activeOrganization.type !== "personal") throw httpError(400, "Sammlungen können nur aus einem persönlichen Bereich freigegeben werden.");
    const body = JSON.parse(await readRequestBody(request, 128 * 1024));
    const email = normalizeInvitationEmail(body.email);
    if (!email) throw httpError(400, "Bitte eine gültige E-Mail-Adresse angeben.");
    const users = await supabaseAdminUsers();
    const recipient = users.find((entry) => normalizeInvitationEmail(entry.email) === email);
    if (!recipient) throw httpError(404, "Für diese E-Mail gibt es noch kein RAMROD-Konto. Die Person muss zuerst ein eigenes Konto anlegen.");
    const rows = await supabaseUpsert("/collection_shares?on_conflict=owner_organization_id,recipient_email", {
      owner_organization_id: tenant.activeOrganization.id,
      recipient_user_id: recipient.id,
      recipient_email: email,
      status: "active",
      scope: cleanCollectionScope(body.scope),
      created_by: isUuid(request.ramrodUser?.id) ? request.ramrodUser.id : null
    });
    sendJson(response, 201, { share: publicCollectionShare(rows[0], await selectOrganizations()) });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "collection_share_failed", message: redactSecret(error.message) });
  }
}

async function handleCollectionShareAction(request, response, shareId, action) {
  const tenant = await requireTenantPermission(request, response, "team:manage");
  if (!tenant) return;
  try {
    if (tenant.activeOrganization.type !== "personal") throw httpError(400, "Wechsle zuerst in deinen persönlichen Bereich.");
    const rows = await supabaseUpdate(`/collection_shares?id=eq.${encodeURIComponent(shareId)}&owner_organization_id=eq.${encodeURIComponent(tenant.activeOrganization.id)}`, {
      status: action === "revoke" ? "revoked" : "active"
    });
    if (!rows[0]) throw httpError(404, "Freigabe nicht gefunden.");
    sendJson(response, 200, { share: rows[0] });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "collection_share_action_failed", message: redactSecret(error.message) });
  }
}

async function findPersonalOrganizationForUser(userId) {
  const memberships = await supabaseSelect(`/organization_memberships?select=organization_id,role,status&user_id=eq.${encodeURIComponent(userId)}&status=eq.active`);
  if (!memberships.length) return null;
  const ids = memberships.map((entry) => entry.organization_id);
  const organizations = await selectOrganizations();
  return organizations.find((entry) => ids.includes(entry.id) && entry.type === "personal") || null;
}

async function handleCreateCollectionAccessRequest(request, response) {
  const tenant = await requireTenantPermission(request, response, "inventory:read");
  if (!tenant) return;
  try {
    if (tenant.activeOrganization.type !== "personal") throw httpError(400, "Wechsle zuerst in deinen persönlichen Bereich.");
    const body = JSON.parse(await readRequestBody(request, 128 * 1024));
    const ownerEmail = normalizeInvitationEmail(body.ownerEmail);
    const requesterEmail = normalizeInvitationEmail(request.ramrodUser?.email);
    if (!ownerEmail || !requesterEmail || !isUuid(request.ramrodUser?.id)) throw httpError(400, "Für die Anfrage werden zwei gültige RAMROD-Konten benötigt.");
    const users = await supabaseAdminUsers();
    const ownerUser = users.find((entry) => normalizeInvitationEmail(entry.email) === ownerEmail);
    if (!ownerUser) throw httpError(404, "Die angegebene Person hat noch kein RAMROD-Konto.");
    const ownerOrganization = await findPersonalOrganizationForUser(ownerUser.id);
    if (!ownerOrganization) throw httpError(404, "Für diese Person wurde noch keine private Sammlung gefunden.");
    if (ownerOrganization.id === tenant.activeOrganization.id) throw httpError(400, "Du bist bereits in dieser Sammlung.");
    const rows = await supabaseUpsert("/collection_access_requests?on_conflict=owner_organization_id,requester_user_id", {
      owner_organization_id: ownerOrganization.id,
      requester_user_id: request.ramrodUser.id,
      requester_email: requesterEmail,
      requester_name: String(request.ramrodUser.user_metadata?.name || body.requesterName || requesterEmail.split("@")[0]).slice(0, 120),
      message: String(body.message || "Ich möchte deine freigegebenen Sammlungsbereiche sehen.").slice(0, 1000),
      status: "requested",
      decided_by: null,
      decided_at: null
    });
    sendJson(response, 201, { request: rows[0] || null });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "collection_access_request_failed", message: redactSecret(error.message) });
  }
}

async function handleCollectionAccessRequestAction(request, response, requestId, action) {
  try {
    const rows = await supabaseSelect(`/collection_access_requests?select=*&id=eq.${encodeURIComponent(requestId)}&limit=1`);
    const accessRequest = rows[0];
    if (!accessRequest) throw httpError(404, "Zugriffsanfrage nicht gefunden.");
    const tenant = await resolveTenantContext(request);
    const isRequester = accessRequest.requester_user_id === request.ramrodUser?.id;
    const isOwner = tenant.activeOrganization?.id === accessRequest.owner_organization_id
      && hasOrganizationPermission(tenant.activeOrganization.role, "team:manage", tenant.platformAdmin);
    if ((action === "cancel" && !isRequester) || (action !== "cancel" && !isOwner)) throw httpError(403, "Diese Anfrage darfst du nicht bearbeiten.");
    const body = JSON.parse(await readRequestBody(request, 128 * 1024));
    if (action === "approve") {
      const shareRows = await supabaseUpsert("/collection_shares?on_conflict=owner_organization_id,recipient_email", {
        owner_organization_id: accessRequest.owner_organization_id,
        recipient_user_id: accessRequest.requester_user_id,
        recipient_email: normalizeInvitationEmail(accessRequest.requester_email),
        status: "active",
        scope: cleanCollectionScope(body.scope),
        created_by: isUuid(request.ramrodUser?.id) ? request.ramrodUser.id : null
      });
      await supabaseUpdate(`/collection_access_requests?id=eq.${encodeURIComponent(requestId)}`, {
        status: "approved",
        decided_by: request.ramrodUser.id,
        decided_at: new Date().toISOString()
      });
      sendJson(response, 200, { request: { ...accessRequest, status: "approved" }, share: shareRows[0] || null });
      return;
    }
    const status = action === "decline" ? "declined" : "cancelled";
    const updated = await supabaseUpdate(`/collection_access_requests?id=eq.${encodeURIComponent(requestId)}`, {
      status,
      decided_by: action === "decline" ? request.ramrodUser.id : null,
      decided_at: new Date().toISOString()
    });
    sendJson(response, 200, { request: updated[0] || null });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "collection_access_action_failed", message: redactSecret(error.message) });
  }
}

async function handleCreateCollectionLoanRequest(request, response) {
  try {
    const body = JSON.parse(await readRequestBody(request, 128 * 1024));
    if (!isUuid(request.ramrodUser?.id)) throw httpError(401, "Bitte zuerst anmelden.");
    const shares = await supabaseSelect(`/collection_shares?select=*&id=eq.${encodeURIComponent(body.shareId)}&status=eq.active&limit=1`);
    const share = shares[0];
    if (!share) throw httpError(404, "Sammlungsfreigabe nicht gefunden.");
    const email = normalizeInvitationEmail(request.ramrodUser.email);
    if (share.recipient_user_id !== request.ramrodUser.id && normalizeInvitationEmail(share.recipient_email) !== email) throw httpError(403, "Dieses Stück ist nicht für dich freigegeben.");
    const scope = cleanCollectionScope(share.scope);
    if (!scope.allowLoans) throw httpError(403, "Für diesen Sammlungsbereich sind keine Ausleihanfragen erlaubt.");
    const itemRows = await supabaseSelect(`/items?select=*&id=eq.${encodeURIComponent(body.itemId)}&customer_id=eq.${encodeURIComponent(share.owner_organization_id)}&limit=1`);
    const row = itemRows[0];
    if (!row) throw httpError(404, "Sammlungsstück nicht gefunden.");
    const item = mapDbItemToUi(row);
    if (!item.collection || !scopeAllowsCollectionItem(scope, item)) throw httpError(403, "Dieses Stück ist nicht Teil der Freigabe.");
    if (String(item.collection.status || "owned") !== "owned") throw httpError(409, "Dieses Stück ist aktuell nicht verfügbar.");
    const existing = await supabaseSelect(`/collection_loan_requests?select=id,status&item_id=eq.${encodeURIComponent(row.id)}&requester_user_id=eq.${encodeURIComponent(request.ramrodUser.id)}&status=in.(requested,approved,loaned)&limit=1`);
    if (existing[0]) throw httpError(409, "Für dieses Stück gibt es bereits eine offene Ausleihanfrage.");
    const inserted = await supabaseInsert("/collection_loan_requests", {
      share_id: share.id,
      item_id: row.id,
      owner_organization_id: share.owner_organization_id,
      requester_user_id: request.ramrodUser.id,
      requester_email: email,
      requester_name: String(request.ramrodUser.user_metadata?.name || body.requesterName || email.split("@")[0]).slice(0, 120),
      note: String(body.note || "").slice(0, 1000) || null,
      due_at: body.dueAt || null,
      status: "requested"
    });
    sendJson(response, 201, { request: inserted[0] || null });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "collection_loan_request_failed", message: redactSecret(error.message) });
  }
}

async function updateCollectionLoanedItem(loanRequest, loaned) {
  const rows = await supabaseSelect(`/items?select=*&id=eq.${encodeURIComponent(loanRequest.item_id)}&customer_id=eq.${encodeURIComponent(loanRequest.owner_organization_id)}&limit=1`);
  const row = rows[0];
  if (!row) throw httpError(404, "Sammlungsstück nicht gefunden.");
  const raw = row.raw_analysis || {};
  const item = mapDbItemToUi(row);
  const now = new Date().toISOString();
  const previous = item.collection || {};
  const collection = loaned ? {
    ...previous,
    status: "loaned",
    borrowerName: loanRequest.requester_name || loanRequest.requester_email,
    borrowerContact: loanRequest.requester_email,
    loanedAt: now,
    dueAt: loanRequest.due_at || "",
    history: [...(Array.isArray(previous.history) ? previous.history : []), { type: "loaned", at: now, borrowerName: loanRequest.requester_name || loanRequest.requester_email, requestId: loanRequest.id }]
  } : {
    ...previous,
    status: "owned",
    borrowerName: "",
    borrowerContact: "",
    loanedAt: "",
    dueAt: "",
    returnedAt: now,
    history: [...(Array.isArray(previous.history) ? previous.history : []), { type: "returned", at: now, requestId: loanRequest.id }]
  };
  item.collection = collection;
  await supabaseUpdate(`/items?id=eq.${encodeURIComponent(row.id)}&customer_id=eq.${encodeURIComponent(loanRequest.owner_organization_id)}`, {
    status: "Sammlung",
    primary_channel: "Sammlung",
    raw_analysis: { ...raw, uiItem: item }
  });
}

async function handleCollectionLoanRequestAction(request, response, requestId, action) {
  try {
    const rows = await supabaseSelect(`/collection_loan_requests?select=*&id=eq.${encodeURIComponent(requestId)}&limit=1`);
    const loanRequest = rows[0];
    if (!loanRequest) throw httpError(404, "Ausleihanfrage nicht gefunden.");
    const tenant = await resolveTenantContext(request);
    const isRequester = loanRequest.requester_user_id === request.ramrodUser?.id;
    const isOwner = tenant.activeOrganization?.id === loanRequest.owner_organization_id
      && hasOrganizationPermission(tenant.activeOrganization.role, "inventory:write", tenant.platformAdmin);
    if ((action === "cancel" && !isRequester) || (action !== "cancel" && !isOwner)) throw httpError(403, "Diese Ausleihanfrage darfst du nicht bearbeiten.");
    if (action === "approve") await updateCollectionLoanedItem(loanRequest, true);
    if (action === "return") await updateCollectionLoanedItem(loanRequest, false);
    const status = { approve: "loaned", decline: "declined", return: "returned", cancel: "cancelled" }[action];
    const updated = await supabaseUpdate(`/collection_loan_requests?id=eq.${encodeURIComponent(requestId)}`, {
      status,
      decided_by: isUuid(request.ramrodUser?.id) ? request.ramrodUser.id : null,
      decided_at: new Date().toISOString()
    });
    sendJson(response, 200, { request: updated[0] || null });
  } catch (error) {
    sendJson(response, error.status || 500, { error: "collection_loan_action_failed", message: redactSecret(error.message) });
  }
}

async function pendingInvitationsForEmail(email) {
  const normalized = normalizeInvitationEmail(email);
  if (!normalized) return [];
  const rows = await supabaseSelect(`/organization_invitations?select=id,organization_id,email,role,status,expires_at,created_at&email=eq.${encodeURIComponent(normalized)}&status=eq.pending&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&order=created_at.desc`);
  if (!rows.length) return [];
  const organizations = await selectOrganizations();
  const organizationById = new Map(organizations.map((entry) => [entry.id, entry]));
  return rows.map((entry) => ({ ...entry, email: undefined, organization: organizationById.get(entry.organization_id) || null }));
}

async function invitationByToken(token) {
  const rows = await supabaseSelect(`/organization_invitations?select=*&token_hash=eq.${encodeURIComponent(hashInvitationToken(token))}&limit=1`);
  return rows[0] || null;
}

async function organizationChannelAccounts(organizationId) {
  return supabaseSelect(`/organization_channel_accounts?select=id,organization_id,channel_id,display_name,auth_mode,status,capabilities,metadata,last_verified_at,created_at,updated_at&organization_id=eq.${encodeURIComponent(organizationId)}&order=created_at.asc`);
}

function cleanOnboardingChannelIds(channels) {
  const known = new Set(publicChannelRegistry().map((entry) => entry.id));
  return [...new Set((Array.isArray(channels) ? channels : []).map((entry) => String(entry || "").trim()).filter((entry) => known.has(entry)))].slice(0, 12);
}

function requestBaseUrl(request) {
  const protocol = String(request.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
  const hostName = String(request.headers["x-forwarded-host"] || request.headers.host || `localhost:${port}`).split(",")[0].trim();
  return `${protocol}://${hostName}`;
}

function maskEmail(email) {
  const [local, domain] = normalizeInvitationEmail(email).split("@");
  if (!domain) return "die eingeladene Adresse";
  return `${local.slice(0, 2)}${"*".repeat(Math.max(2, Math.min(6, local.length - 2)))}@${domain}`;
}

function publicInvitation(invitation) {
  if (!invitation) return null;
  const { token_hash: _tokenHash, ...safeInvitation } = invitation;
  return safeInvitation;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
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
  const tenant = await requireTenantPermission(request, response, "inventory:write");
  if (!tenant) return;

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
      customerId: tenant.activeOrganization.id,
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
    const tenant = await requireTenantPermission(request, response, "inventory:write");
    if (!tenant) return;
    const customer = tenant.activeOrganization || await getOrCreateCustomer();
    if (!customer) {
      sendJson(response, 403, {
        error: "organization_access_required",
        message: "Vor dem Speichern muss ein Kundenbereich ausgewählt werden."
      });
      return;
    }
    if (!hasOrganizationPermission(tenant.activeOrganization.role, "sales:approve", tenant.platformAdmin)) {
      const existingRows = await supabaseSelect(`/items?select=id,status,raw_analysis&customer_id=eq.${encodeURIComponent(customer.id)}&sku=eq.${encodeURIComponent(item.sku)}&limit=1`);
      const existingApproval = existingRows[0]?.raw_analysis?.uiItem?.approval?.status;
      const incomingApproval = item.approval?.status;
      const incomingReady = ["Verkaufsbereit", "Gelistet", "Verkauft", "Versand"].includes(String(item.stage || ""));
      if (existingApproval === "approved" || incomingApproval === "approved" || incomingReady) {
        sendJson(response, 403, {
          error: "sales_approval_required",
          message: "Freigegebene Artikel und Verkaufsstatus dürfen nur Inhaber oder Admins ändern."
        });
        return;
      }
    }
    const box = await getBoxByCode(customer.id, item.boxId || "SV-001");
    const conflictTarget = multiTenantSchemaAvailable === false ? "sku" : "customer_id,sku";
    const savedRows = await supabaseUpsert(`/items?on_conflict=${conflictTarget}`, mapUiItemToDb(item, customer, box));
    const saved = savedRows[0] || null;

    if (item.priceCheck && saved) {
      await supabaseInsert("/price_checks", mapUiPriceCheckToDb(saved.id, item.priceCheck));
    }

    let automationJob = null;
    if (saved && !item.priceCheck && !item.archivedAt && item.stage !== "Archiviert" && automaticPriceCheckSources.has(item.sourceType)) {
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

async function handleIntakeCapture(request, response) {
  const persistence = supabasePersistenceStatus();
  if (!persistence.writable) {
    sendJson(response, 503, {
      error: "intake_not_configured",
      message: "Supabase Storage und die Jobqueue werden für die schnelle Aufnahme benötigt."
    });
    return;
  }

  const tenant = await requireTenantPermission(request, response, "inventory:write");
  if (!tenant) return;

  const body = JSON.parse(await readRequestBody(request, 48 * 1024 * 1024));
  const images = normalizeImageDataUrls(body);
  if (!images.length) {
    sendJson(response, 400, { error: "missing_image", message: "Mindestens ein Bild wird benötigt." });
    return;
  }

  const customer = tenant.activeOrganization || await getOrCreateCustomer();
  if (!customer) {
    sendJson(response, 403, {
      error: "organization_access_required",
      message: "Vor der Aufnahme muss ein Kundenbereich ausgewählt werden."
    });
    return;
  }

  const captureId = String(body.captureId || randomUUID()).replace(/[^a-zA-Z0-9]/g, "").slice(-16) || randomUUID().replaceAll("-", "").slice(-16);
  const skuPrefix = String(customer.short_code || "RR").replace(/[^A-Z0-9]/gi, "").toUpperCase() || "RR";
  const sku = `${skuPrefix}-CAP-${captureId.toUpperCase()}`;
  const existingItems = await supabaseSelect(`/items?select=*&customer_id=eq.${encodeURIComponent(customer.id)}&sku=eq.${encodeURIComponent(sku)}&limit=1`);
  if (existingItems[0]) {
    const existingJobs = await supabaseSelect(`/jobs?select=*&customer_id=eq.${encodeURIComponent(customer.id)}&item_id=eq.${encodeURIComponent(existingItems[0].id)}&job_type=eq.analyze_image&order=created_at.desc&limit=1`);
    sendJson(response, 200, {
      captured: true,
      duplicate: true,
      item: { ...mapDbItemToUi(existingItems[0]), analysisJob: existingJobs[0] ? mapWorkerJobToUi(existingJobs[0]) : null },
      analysisJob: existingJobs[0] ? mapWorkerJobToUi(existingJobs[0]) : null
    });
    return;
  }

  const storedImages = [];
  try {
    for (const image of images) storedImages.push(await uploadWorkerImage(image));
    const boxCode = String(body.boxId || `${customer.short_code || "RR"}-001`).trim();
    const box = await getBoxByCode(customer.id, boxCode);
    const capturedAt = new Date().toISOString();
    const item = {
      id: `capture-${randomUUID()}`,
      sku,
      boxId: boxCode,
      title: String(body.query || "").trim() || "Wird im Hintergrund erkannt",
      category: "Analyse ausstehend",
      franchise: "",
      condition: String(body.condition || "Gebraucht"),
      completeness: String(body.completeness || "Ungeprüft, Fotos vorhanden"),
      confidence: 0,
      low: 0,
      fair: 0,
      aggressive: 0,
      channel: "Pruefen",
      stage: "Analyse läuft",
      weight: numberOrNull(body.weight) || 0,
      barcode: String(body.barcode || ""),
      image: storedImages[0].signedUrl,
      imageStoragePath: storedImages[0].path,
      imageStoragePaths: storedImages.map((image) => image.path),
      notes: "Fotos sind sicher gespeichert. Identität, Marktwert, Verkaufskanal und Strategie werden im Hintergrund ermittelt.",
      sourceType: "background_capture",
      analysisPending: true,
      capturedAt,
      captureIntent: String(body.captureIntent || "sales"),
      research: []
    };

    const savedRows = await supabaseInsert("/items", mapUiItemToDb(item, customer, box));
    const saved = savedRows[0];
    if (!saved?.id) throw new Error("Der Intake-Artikel konnte nicht gespeichert werden.");

    const queued = await createWorkerJob({
      customerId: customer.id,
      itemId: saved.id,
      jobType: "analyze_image",
      payload: {
        imageUrl: storedImages[0].signedUrl,
        imageUrls: storedImages.map((image) => image.signedUrl),
        imageStoragePath: storedImages[0].path,
        imageStoragePaths: storedImages.map((image) => image.path),
        sku,
        boxId: boxCode,
        condition: item.condition,
        completeness: item.completeness,
        barcode: item.barcode,
        query: String(body.query || ""),
        captureIntent: item.captureIntent,
        weight: item.weight,
        clientImageQualities: Array.isArray(body.clientImageQualities) ? body.clientImageQualities.slice(0, 6) : []
      },
      priority: 90,
      maxAttempts: 3,
      idempotencyKey: `intake-analysis:${customer.id}:${captureId}:v1`
    });

    sendJson(response, 202, {
      captured: true,
      item: {
        ...mapDbItemToUi(saved, box ? [box] : []),
        analysisJob: mapWorkerJobToUi(queued.job)
      },
      analysisJob: mapWorkerJobToUi(queued.job)
    });
  } catch (error) {
    sendJson(response, 500, {
      error: "intake_capture_failed",
      message: redactSecret(error.message)
    });
  }
}

async function handleRecognizeImage(request, response) {
  const tenant = await requireTenantPermission(request, response, "inventory:write");
  if (!tenant) return;
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

async function handleGroupCollectionPhotos(request, response) {
  const tenant = await requireTenantPermission(request, response, "inventory:write");
  if (!tenant) return;
  const body = JSON.parse(await readRequestBody(request, 48 * 1024 * 1024));
  const images = normalizeCollectionGroupImages(body);
  if (!images.length) {
    sendJson(response, 400, { error: "missing_images", message: "Mindestens ein Bild wird benötigt." });
    return;
  }
  if (images.length === 1) {
    sendJson(response, 200, {
      provider: "deterministic",
      groups: [{ imageIndexes: [0], titleHint: "", confidence: 100, reason: "Ein einzelnes Bild." }]
    });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(response, 503, {
      error: "grouping_not_configured",
      message: "Die automatische Foto-Gruppierung ist noch nicht konfiguriert."
    });
    return;
  }

  const startedAt = Date.now();
  const candidateModel = recognitionModel;
  const requestBody = {
    model: candidateModel,
    input: [{
      role: "user",
      content: [
        { type: "input_text", text: buildPhotoGroupingPrompt(images.length) },
        ...images.flatMap((imageUrl, index) => [
          { type: "input_text", text: `Bild ${index + 1}` },
          { type: "input_image", image_url: imageUrl, detail: "low" }
        ])
      ]
    }],
    max_output_tokens: 1400,
    text: {
      ...(isGpt56Model(candidateModel) ? { verbosity: "low" } : {}),
      format: {
        type: "json_schema",
        name: "ramrod_collection_photo_groups",
        strict: true,
        schema: photoGroupingSchema(images.length)
      }
    },
    ...(isGpt56Model(candidateModel) ? { reasoning: { effort: recognitionReasoningEffort } } : {})
  };

  const { response: openAiResponse, body: result } = await fetchJsonUpstream("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  }, {
    label: "OpenAI-Fotogruppierung",
    retries: 1
  });
  if (!openAiResponse.ok) {
    sendJson(response, openAiResponse.status, {
      error: result.error?.code || "photo_grouping_failed",
      message: redactSecret(result.error?.message || "Die Fotos konnten nicht automatisch gruppiert werden.")
    });
    return;
  }

  sendJson(response, 200, {
    provider: "openai-vision-grouping",
    model: result.model || candidateModel,
    durationMs: Date.now() - startedAt,
    groups: normalizePhotoGroups(extractJson(result), images.length)
  });
}

async function handleVisualMatch(request, response) {
  const tenant = await requireTenantPermission(request, response, "inventory:write");
  if (!tenant) return;
  if (!process.env.SERPAPI_API_KEY) {
    sendJson(response, 503, {
      error: "visual_search_not_configured",
      message: "Die externe Bildsuche ist noch nicht konfiguriert."
    });
    return;
  }
  if (!supabasePersistenceStatus().writable) {
    sendJson(response, 503, {
      error: "visual_search_storage_unavailable",
      message: "Die Bildsuche benötigt den geschützten RAMROD-Bildspeicher."
    });
    return;
  }

  const body = JSON.parse(await readRequestBody(request, 18 * 1024 * 1024));
  const image = normalizeImageDataUrls(body)[0];
  if (!image) {
    sendJson(response, 400, { error: "missing_image", message: "Ein Bild wird benötigt." });
    return;
  }

  let storedImage;
  try {
    storedImage = await uploadWorkerImage(image);
    const matches = await fetchSerpApiGoogleLensMatches(storedImage.signedUrl, body.query);
    sendJson(response, 200, {
      provider: "serpapi-google-lens",
      matches,
      notice: "Das Foto wurde für diese Identitätsprüfung an Google Lens über SerpApi übermittelt."
    });
  } catch (error) {
    sendJson(response, error.status || 502, {
      error: error.code || "visual_search_failed",
      message: redactSecret(error.message)
    });
  } finally {
    if (storedImage?.path) await deleteWorkerImage(storedImage.path).catch(() => {});
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
        { type: "input_text", text: buildItemRecognitionPrompt({ captureIntent: body.captureIntent, visualMatches: body.visualMatches }) },
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
  const { response: openAiResponse, body: result } = await fetchJsonUpstream("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  }, {
    label: "OpenAI-Schnellerkennung",
    retries: 1
  });
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
    captureIntent: body.captureIntent,
    clientImageQualities: body.clientImageQualities
  });
  recognition.externalVisualEvidence = buildExternalVisualEvidence(body.visualMatches);
  recognition.learningComparison = await compareRecognitionLearning(recognition, body);
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
        captureIntent: body.captureIntent || "sales",
        clientImageQualities: body.clientImageQualities || [],
        visualMatches: normalizeVisualSearchMatches(body.visualMatches)
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
  const tenant = await requireTenantPermission(request, response, "inventory:write");
  if (!tenant) return;
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
        { type: "input_text", text: buildItemAnalysisPrompt(body.recognition, { captureIntent: body.captureIntent, operatorHint: body.query }) },
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
  const { response: openAiResponse, body: result } = await fetchJsonUpstream("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  }, {
    label: "OpenAI-Markt- und Strategieanalyse",
    retries: 1
  });

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
  applyProvisionalSalesDecision(item, body.recognition);

  sendJson(response, 200, {
    provider: "openai-strategy",
    model: result.model || model,
    usage: result.usage || null,
    analysis,
    item
  });
}

function applyProvisionalSalesDecision(item, recognition = null) {
  item.recognition = recognition || item.recognition || null;
  item.recognitionEvidence = recognition?.evidence || item.recognitionEvidence || null;
  const priceCheck = {
    method: "ai-precheck",
    low: item.low,
    fair: item.fair,
    aggressive: item.aggressive,
    confidence: Math.max(55, Math.min(70, Number(item.confidence) || 55)),
    evidence: []
  };
  const decision = reconcileSalesDecision(item, priceCheck);
  item.channel = decision.channel;
  item.whatnotEligible = decision.whatnotEligible;
  item.reviewRequired = decision.reviewRequired;
  item.salesStrategy = decision.salesStrategy;
  return item;
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
        query: body.query || "",
        captureIntent: body.captureIntent || "sales",
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
  const unique = [...new Set(candidates)].slice(0, 6);
  return unique.filter((value) => /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(String(value)));
}

function normalizeCollectionGroupImages(body) {
  const candidates = Array.isArray(body.imageDataUrls) ? body.imageDataUrls : [];
  return candidates
    .slice(0, 30)
    .filter((value) => /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(String(value)));
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
    body: JSON.stringify({ expiresIn: 7 * 24 * 60 * 60 })
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

async function deleteWorkerImage(path) {
  if (!path) return;
  const objectUrl = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(storageBucket)}/${String(path).split("/").map(encodeURIComponent).join("/")}`;
  await fetch(objectUrl, {
    method: "DELETE",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`
    }
  });
}

async function fetchSerpApiGoogleLensMatches(imageUrl, query = "") {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_lens");
  url.searchParams.set("type", "visual_matches");
  url.searchParams.set("url", imageUrl);
  url.searchParams.set("country", "de");
  url.searchParams.set("hl", "de");
  url.searchParams.set("safe", "active");
  url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);
  if (String(query || "").trim()) url.searchParams.set("q", String(query).trim().slice(0, 180));

  const serpResponse = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  const body = await serpResponse.json();
  if (!serpResponse.ok || body.error) {
    const error = new Error(body.error || `Google Lens HTTP ${serpResponse.status}`);
    error.status = serpResponse.status;
    error.code = "google_lens_error";
    throw error;
  }
  return normalizeVisualSearchMatches(body.visual_matches);
}

function buildExternalVisualEvidence(entries = []) {
  const matches = normalizeVisualSearchMatches(entries);
  return matches.length ? { provider: "serpapi-google-lens", matches } : null;
}

function imageExtension(contentType) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/heic" || contentType === "image/heif") return "heic";
  return "jpg";
}

async function handlePriceCheck(request, response) {
  const tenant = await requireTenantPermission(request, response, "inventory:write");
  if (!tenant) return;
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
  const ebayDraft = null;

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
  const tenant = await requireTenantPermission(request, response, "inventory:write");
  if (!tenant) return;
  const body = JSON.parse(await readRequestBody(request, 8 * 1024 * 1024));
  const item = body.item;

  if (!item?.sku || !item?.title) {
    sendJson(response, 400, {
      error: "missing_item",
      message: "item with sku and title is required."
    });
    return;
  }

  try {
    const account = await ebayChannelAccount(tenant.activeOrganization.id);
    if (!account?.secret_ref || !credentialStore.has(account.secret_ref)) {
      throw httpError(409, "Verbinde zuerst das eBay-Verkaeuferkonto dieses Kundenbereichs.");
    }
    const sellerSetup = account.metadata?.sellerSetup || await verifyAndPersistEbaySetup(account);
    const appToken = await getEbayAppToken();
    const category = await suggestEbayCategory(ebaySellerOAuthConfig, appToken, item.title);
    const categoryAspects = await getEbayCategoryAspects(ebaySellerOAuthConfig, appToken, category);
    const sellerProfile = await activeSellerProfile(tenant.activeOrganization.id);
    const content = await optimizeEbayListingContent(item, category, categoryAspects);
    const ebayDraft = buildEbayListingPreview({
      item,
      content,
      category,
      categoryAspects,
      sellerSetup,
      sellerProfile
    });
    sendJson(response, 200, {
      provider: process.env.OPENAI_API_KEY ? "openai-listing-copy-editor" : "deterministic-listing-copy-editor",
      ebayDraft
    });
  } catch (error) {
    sendJson(response, error.status || 500, {
      error: "ebay_preview_failed",
      message: redactSecret(error.message),
      details: redactEbayErrors(error.details)
    });
  }
}

async function handlePrepareEbayListing(request, response) {
  const tenant = await requireTenantPermission(request, response, "sales:approve");
  if (!tenant) return;
  const body = JSON.parse(await readRequestBody(request, 12 * 1024 * 1024));
  const item = body.item;
  const preview = item?.ebayDraft;
  if (!item?.sku || !preview?.title) {
    sendJson(response, 400, { error: "missing_ebay_preview", message: "Erzeuge und pruefe zuerst die eBay-Vorschau." });
    return;
  }
  const missing = (preview.readiness || []).filter((entry) => !entry.ready);
  if (missing.length || preview.status !== "ready_for_ebay") {
    sendJson(response, 409, {
      error: "ebay_preview_incomplete",
      message: `Vor dem eBay-Entwurf fehlt: ${missing.map((entry) => entry.label).join(", ") || "Pflichtangaben"}.`
    });
    return;
  }

  try {
    const dbItem = await tenantItem(tenant.activeOrganization.id, item);
    const account = await ebayChannelAccount(tenant.activeOrganization.id);
    if (!account?.secret_ref || !credentialStore.has(account.secret_ref)) {
      throw httpError(409, "Das eBay-Verkaeuferkonto ist nicht verbunden.");
    }
    const previous = await supabaseSelect(`/listings?select=*&item_id=eq.${encodeURIComponent(dbItem.id)}&channel_id=eq.ebay&status=eq.prepared&order=created_at.desc&limit=1`);
    if (previous[0]?.external_id) {
      const preparedFormat = previous[0].payload?.preview?.salesFormat || "fixed_price";
      const requestedFormat = preview.salesFormat || "fixed_price";
      if (preparedFormat !== requestedFormat) {
        throw httpError(409, "Für diesen Artikel existiert bereits ein vorbereiteter eBay-Entwurf mit einer anderen Verkaufsart.");
      }
      sendJson(response, 200, {
        provider: "ebay-inventory-api",
        prepared: true,
        reused: true,
        listing: publicListing(previous[0])
      });
      return;
    }

    let credentials = credentialStore.get(account.secret_ref);
    const fresh = await ensureFreshEbayCredentials(ebaySellerOAuthConfig, credentials);
    if (fresh.updatedAt !== credentials.updatedAt) {
      credentialStore.put(account.secret_ref, fresh);
      credentials = fresh;
    }

    const sourceImages = (preview.sourceImages || [])
      .filter((value) => validHttpsUrl(value) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(String(value)))
      .slice(0, 12);
    if (!sourceImages.length) throw httpError(409, "Mindestens ein Artikelfoto fehlt.");
    const ebayImages = [];
    for (const imageUrl of sourceImages) {
      const uploaded = /^data:image\//i.test(String(imageUrl))
        ? await uploadEbayImageFromDataUrl(ebaySellerOAuthConfig, credentials.accessToken, imageUrl)
        : await uploadEbayImageFromUrl(ebaySellerOAuthConfig, credentials.accessToken, imageUrl);
      ebayImages.push(uploaded.imageUrl);
    }

    const privateTrading = preview.listingMode === "trading";
    const seller = privateTrading
      ? await getTradingEbayUser(ebaySellerOAuthConfig, credentials.accessToken)
      : null;
    const inventoryPayload = privateTrading
      ? null
      : await createOrReplaceEbayInventoryItem(ebaySellerOAuthConfig, credentials.accessToken, preview, ebayImages);
    const offer = privateTrading
      ? { offerId: `verify:${preview.sku}:${Date.now()}`, payload: null, verification: await verifyTradingEbayItem(ebaySellerOAuthConfig, credentials.accessToken, preview, ebayImages) }
      : await createEbayOffer(ebaySellerOAuthConfig, credentials.accessToken, preview);
    const rows = await supabaseInsert("/listings", {
      item_id: dbItem.id,
      channel_id: "ebay",
      external_id: offer.offerId,
      status: "prepared",
      title: preview.title,
      price: preview.price,
      payload: {
        preview,
        inventoryItem: inventoryPayload,
        offer: offer.payload,
        verification: offer.verification || null,
        seller,
        ebayImages,
        preparedAt: new Date().toISOString()
      }
    });
    sendJson(response, 201, {
      provider: "ebay-inventory-api",
      prepared: true,
      reused: false,
      listing: publicListing(rows[0]),
      message: "Der Artikel ist als unveroeffentlichtes eBay-Angebot vorbereitet."
    });
  } catch (error) {
    sendJson(response, error.status || 500, {
      error: "ebay_prepare_failed",
      message: redactSecret(error.message),
      details: redactEbayErrors(error.details)
    });
  }
}

async function handlePublishEbayListing(request, response) {
  const tenant = await requireTenantPermission(request, response, "sales:approve");
  if (!tenant) return;
  const body = JSON.parse(await readRequestBody(request, 256 * 1024));
  if (body.confirm !== true) {
    sendJson(response, 409, { error: "publish_confirmation_required", message: "Die Live-Veroeffentlichung muss ausdruecklich bestaetigt werden." });
    return;
  }

  try {
    const dbItem = await tenantItem(tenant.activeOrganization.id, body.item || {});
    const listings = await supabaseSelect(`/listings?select=*&item_id=eq.${encodeURIComponent(dbItem.id)}&channel_id=eq.ebay&status=eq.prepared&order=created_at.desc&limit=1`);
    const listing = listings[0];
    if (!listing?.external_id) throw httpError(409, "Lege zuerst den unveroeffentlichten eBay-Entwurf an.");
    const account = await ebayChannelAccount(tenant.activeOrganization.id);
    if (!account?.secret_ref || !credentialStore.has(account.secret_ref)) throw httpError(409, "Das eBay-Verkaeuferkonto ist nicht verbunden.");
    let credentials = credentialStore.get(account.secret_ref);
    const fresh = await ensureFreshEbayCredentials(ebaySellerOAuthConfig, credentials);
    if (fresh.updatedAt !== credentials.updatedAt) {
      credentialStore.put(account.secret_ref, fresh);
      credentials = fresh;
    }

    const privateTrading = listing.payload?.preview?.listingMode === "trading";
    const published = privateTrading
      ? await publishTradingEbayItem(
        ebaySellerOAuthConfig,
        credentials.accessToken,
        listing.payload.preview,
        listing.payload.ebayImages || []
      )
      : await publishEbayOffer(
        ebaySellerOAuthConfig,
        credentials.accessToken,
        listing.external_id,
        listing.payload?.preview?.marketplaceId || "EBAY_DE"
      );
    const listingId = String(published.listingId);
    const listingUrl = `https://www.ebay.de/itm/${encodeURIComponent(listingId)}`;
    const listedAt = new Date().toISOString();
    const updatedRows = await supabaseUpdate(`/listings?id=eq.${encodeURIComponent(listing.id)}`, {
      status: "active",
      url: listingUrl,
      listed_at: listedAt,
      payload: { ...(listing.payload || {}), publishResponse: published, publishedAt: listedAt }
    });
    const raw = dbItem.raw_analysis || {};
    const uiItem = {
      ...(raw.uiItem || {}),
      stage: "Gelistet",
      ebayListing: { offerId: listing.external_id, listingId, url: listingUrl, status: "active", listedAt }
    };
    await supabaseUpdate(`/items?id=eq.${encodeURIComponent(dbItem.id)}`, {
      status: "Gelistet",
      raw_analysis: { ...raw, uiItem, ebayListing: uiItem.ebayListing }
    });
    sendJson(response, 200, {
      provider: "ebay-inventory-api",
      published: true,
      listing: publicListing(updatedRows[0]),
      listingId,
      url: listingUrl,
      message: "Der Artikel ist jetzt live bei eBay."
    });
  } catch (error) {
    sendJson(response, error.status || 500, {
      error: "ebay_publish_failed",
      message: redactSecret(error.message),
      details: redactEbayErrors(error.details)
    });
  }
}

async function optimizeEbayListingContent(item, category, categoryAspects) {
  const fallback = buildFallbackEbayContent(item);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;
  const requestBody = {
    model,
    input: [{
      role: "user",
      content: [{
        type: "input_text",
        text: buildEbayListingPrompt(item, { category, aspects: categoryAspects })
      }]
    }],
    max_output_tokens: 1800,
    text: {
      ...(isGpt56Model(model) ? { verbosity: "low" } : {}),
      format: {
        type: "json_schema",
        name: "ramrod_ebay_listing_content",
        strict: true,
        schema: ebayListingContentSchema()
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
  const result = await openAiResponse.json().catch(() => ({}));
  if (!openAiResponse.ok) {
    console.warn("eBay listing optimizer fallback:", redactSecret(result.error?.message || `OpenAI HTTP ${openAiResponse.status}`));
    return fallback;
  }
  return normalizeEbayListingContent(extractJson(result), item);
}

async function activeSellerProfile(organizationId) {
  if (multiTenantSchemaAvailable === false) return null;
  const rows = await supabaseSelect(`/seller_profiles?select=id,organization_id,name,seller_type,legal_name,return_policy,config&organization_id=eq.${encodeURIComponent(organizationId)}&active=eq.true&order=created_at.asc&limit=1`).catch(() => []);
  return rows[0] || null;
}

async function tenantItem(organizationId, item) {
  const filters = item.dbId
    ? `id=eq.${encodeURIComponent(item.dbId)}`
    : `sku=eq.${encodeURIComponent(item.sku || "")}`;
  const rows = await supabaseSelect(`/items?select=*&customer_id=eq.${encodeURIComponent(organizationId)}&${filters}&limit=1`);
  if (!rows[0]) throw httpError(404, "Der Artikel wurde in diesem Kundenbereich nicht gefunden.");
  return rows[0];
}

function publicListing(listing) {
  if (!listing) return null;
  return {
    id: listing.id,
    itemId: listing.item_id,
    offerId: listing.external_id,
    status: listing.status,
    title: listing.title,
    price: Number(listing.price || 0),
    seller: listing.payload?.seller ? {
      userId: listing.payload.seller.userId || "",
      sellerBusinessType: listing.payload.seller.sellerBusinessType || "",
      feedbackScore: Number(listing.payload.seller.feedbackScore || 0)
    } : null,
    verification: listing.payload?.verification ? {
      ack: listing.payload.verification.ack || "",
      feeTotal: Number(listing.payload.verification.feeTotal || 0),
      fees: listing.payload.verification.fees || [],
      warnings: listing.payload.verification.warnings || []
    } : null,
    url: listing.url || "",
    listedAt: listing.listed_at || null,
    createdAt: listing.created_at || null
  };
}

function redactEbayErrors(details) {
  return (Array.isArray(details) ? details : []).slice(0, 8).map((entry) => ({
    errorId: entry.errorId || null,
    category: entry.category || "",
    message: redactSecret(entry.longMessage || entry.message || "eBay hat die Anfrage abgelehnt."),
    parameters: (entry.parameters || []).map((parameter) => ({
      name: parameter.name || "",
      value: redactSecret(parameter.value || "")
    }))
  }));
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
  const comparison = evaluateComparableEvidence(item, uniqueEvidence(evidence));
  const markedEvidence = markPriceOutliers(comparison.accepted);
  const usableEvidence = markedEvidence.filter((entry) => !entry.outlier);
  const estimate = estimatePriceFromEvidence(item, usableEvidence);
  const finalNotes = [
    ...notes,
    ...(["ebay-browse", "web-research", "multi-source"].includes(method) && usableEvidence.length < 3
      ? ["Nur wenige Live-Treffer gefunden; Preis als Indikation, nicht als belastbarer Marktwert."]
      : []),
    ...(comparison.rejected.length
      ? [`${comparison.rejected.length} unpassende Treffer wurden wegen Identitaet, Plattform, Variante, Menge oder Zustand ausgeschlossen.`]
      : []),
    ...(!estimate.calculation.soldCount && estimate.calculation.activeCount
      ? ["Keine belastbaren Verkaufspreise gefunden. Aktive Angebotspreise wurden nur rabattiert als Marktindikator verwendet."]
      : []),
    ...(markedEvidence.some((entry) => entry.outlier)
      ? ["Ausreisser wurden in der Preisberechnung markiert und nicht gewichtet."]
      : [])
  ];

  return {
    checkedAt: new Date().toISOString(),
    method,
    query: buildSearchQuery(item),
    low: estimate.low,
    fair: estimate.fair,
    aggressive: estimate.aggressive,
    confidence: estimate.confidence,
    previous: {
      low: numberOrNull(item.low),
      fair: numberOrNull(item.fair),
      aggressive: numberOrNull(item.aggressive),
      confidence: clampNumber(item.confidence, 0, 100, 0)
    },
    calculation: {
      ...estimate.calculation,
      sourceBasis: priceCheckBasis(method),
      outlierCount: markedEvidence.filter((entry) => entry.outlier).length,
      rejectedCount: comparison.rejected.length
    },
    evidence: representativeEvidence(markedEvidence, 6),
    rejectedEvidence: representativeEvidence(comparison.rejected, 5),
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
      .map((entry) => ({
        source: "eBay Browse",
        title: entry.title || item.title,
        price: Math.round(Number(entry.price.value)),
        shippingPrice: Math.round(Number(entry.shippingOptions?.[0]?.shippingCost?.value) || 0),
        condition: entry.condition || entry.conditionId || "",
        status: "active_listing",
        age: entry.itemCreationDate ? new Date(entry.itemCreationDate).toLocaleDateString("de-DE") : "live",
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
    .map((entry) => {
      const price = extractSerpApiPrice(entry.price);
      if (!price) return null;
      const sold = Boolean(
        entry.sold_date
        || entry.is_sold === true
        || /\b(?:sold|verkauft)\b/i.test(`${entry.status || ""} ${entry.availability || ""}`)
      );
      return {
        source: sold ? "SerpApi eBay Sold" : "SerpApi eBay Web",
        title: entry.title || item.title,
        price: Math.round(price),
        shippingPrice: Math.round(extractSerpApiPrice(entry.shipping) || 0),
        condition: entry.condition || "",
        status: sold ? "sold_listing" : "active_web_listing",
        age: entry.sold_date || entry.condition || entry.quantity_sold || "web",
        url: entry.link || "",
        webResearch: true,
        requestedSoldFilter: showOnly === "Sold",
        query
      };
    })
    .filter(Boolean);
}

function uniqueEvidence(evidence) {
  const selected = new Map();
  for (const entry of evidence) {
    const itemId = extractEbayListingId(entry.url);
    const cleanUrl = normalizeEvidenceUrl(entry.url);
    const titlePrice = `${normalizeSearchText(entry.title)}:${Math.round(Number(entry.price) * 100)}`;
    const key = itemId
      ? `ebay:${itemId}`
      : normalizeSearchText(entry.title)
        ? `title:${titlePrice}`
        : `url:${cleanUrl}`;
    const existing = selected.get(key);
    if (!existing || evidencePriority(entry) > evidencePriority(existing)) {
      selected.set(key, entry);
    }
  }
  return [...selected.values()];
}

function extractEbayListingId(value) {
  const text = String(value || "");
  return text.match(/\/itm\/(?:[^/?#]+\/)?(\d{9,15})(?:[/?#]|$)/i)?.[1]
    || text.match(/[?&](?:item|itemid)=(\d{9,15})(?:&|$)/i)?.[1]
    || "";
}

function normalizeEvidenceUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (!/^https?:$/.test(url.protocol)) return "";
    url.hash = "";
    url.search = "";
    return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "";
  }
}

function evidencePriority(entry) {
  const status = String(entry.status || "").toLowerCase();
  const source = String(entry.source || "").toLowerCase();
  if (status.includes("sold") || source.includes("sold")) return 4;
  if (source.includes("pricecharting") || source.includes("bricklink")) return 3;
  if (source === "ebay browse") return 2;
  return 1;
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

async function supabaseUpdate(path, payload) {
  return supabaseRequest(path, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload)
  }, supabaseServiceRoleKey);
}

async function supabaseRpc(name, payload = {}) {
  return supabaseRequest(`/rpc/${name}`, {
    method: "POST",
    body: JSON.stringify(payload)
  }, supabaseServiceRoleKey);
}

async function supabaseAdminUsers() {
  if (!supabaseUrl || !supabaseServiceRoleKey) return [];
  const response = await fetch(new URL("/auth/v1/admin/users?per_page=1000", supabaseUrl), {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      Accept: "application/json"
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message || `Supabase Auth Admin HTTP ${response.status}`);
  return body.users || [];
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

function mapDbItemToUi(row, boxes = [], latestPriceJob = null, latestEbayListing = undefined, latestAnalysisJob = null) {
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
    ...(latestEbayListing !== undefined ? { ebayListing: latestEbayListing ? publicListing(latestEbayListing) : null } : {}),
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
    ebayDraft: Object.prototype.hasOwnProperty.call(ui, "ebayDraft")
      ? ui.ebayDraft
      : completedEbayDraft || raw.ebayDraft || null,
    priceCheck: completedPriceCheck || ui.priceCheck || null,
    automationJob: latestPriceJob ? mapWorkerJobToUi(latestPriceJob) : ui.automationJob || null,
    analysisJob: latestAnalysisJob ? mapWorkerJobToUi(latestAnalysisJob) : ui.analysisJob || null,
    analysisPending: latestAnalysisJob
      ? ["queued", "running"].includes(latestAnalysisJob.status)
      : Boolean(ui.analysisPending)
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
  const identity = item.recognition?.identity || {};
  const canonicalTitle = identity.title || item.title;
  const haystack = [
    canonicalTitle,
    identity.brand,
    identity.franchise,
    identity.platform,
    identity.edition,
    identity.region,
    identity.modelNumber,
    item.franchise,
    item.category,
    item.completeness,
    item.notes
  ]
    .filter(Boolean)
    .join(" ");
  const platform = normalizeSearchText(identity.platform || extractPlatform(haystack));
  const title = extractComparableTitle(canonicalTitle || haystack, platform);
  const cleanOriginal = normalizeSearchText(canonicalTitle || haystack);
  const category = normalizeSearchText(item.category || "");
  const edition = normalizeSearchText(identity.edition || "");
  const region = normalizeSearchText(identity.region || "");
  const identifiers = uniqueStrings([
    identity.modelNumber,
    item.barcode,
    ...(item.recognition?.identifiers || []).map((entry) => entry?.value)
  ])
    .map(normalizeSearchText)
    .filter((value) => value.length >= 5);

  return uniqueStrings([
    ...identifiers,
    [title, platform, edition, region].filter(Boolean).join(" "),
    [title, platform].filter(Boolean).join(" "),
    [title, platform, "gebraucht"].filter(Boolean).join(" "),
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
      : (["/admin", "/admin/", "/vault", "/vault/"].includes(url.pathname) ? "/index.html" : url.pathname));
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

async function fetchJsonUpstream(url, options = {}, { label = "Externer Dienst", retries = 0 } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        const error = new Error(`${label} lieferte keine verwertbare Antwort (HTTP ${response.status}).`);
        error.status = 502;
        error.code = "invalid_upstream_response";
        lastError = error;
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }
        throw error;
      }

      if (!response.ok && response.status >= 500 && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      return { response, body };
    } catch (error) {
      lastError = error;
      if (attempt < retries && !error.status) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error(`${label} ist momentan nicht erreichbar.`);
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
