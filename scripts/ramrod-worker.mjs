import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { arch, cpus, hostname, platform, totalmem } from "node:os";
import { applyAnalysisGuardrails, buildItemAnalysisPrompt, itemAnalysisSchema, mapAnalysisToItem } from "./lib/item-analysis.mjs";
import { buildItemRecognitionPrompt, itemRecognitionSchema, scoreItemRecognition } from "./lib/item-recognition.mjs";
import { reconcileSalesDecision } from "./lib/sales-decision.mjs";

loadDotEnv(".env.local");

const config = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  workerKey: process.env.RAMROD_WORKER_KEY || defaultWorkerKey(),
  workerName: process.env.RAMROD_WORKER_NAME || `RAMROD Worker ${hostname()}`,
  capabilities: parseList(process.env.RAMROD_WORKER_CAPABILITIES || "health_check,price_check,ebay_draft,recognize_image,analyze_image"),
  controlPlaneUrl: String(process.env.RAMROD_CONTROL_PLANE_URL || "http://127.0.0.1:3001").replace(/\/$/, ""),
  controlPlaneToken: process.env.RAMROD_WORKER_TOKEN || "",
  pollMs: clampInteger(process.env.RAMROD_WORKER_POLL_MS, 1000, 60000, 5000),
  leaseSeconds: clampInteger(process.env.RAMROD_WORKER_LEASE_SECONDS, 30, 3600, 180),
  imageAnalysisProvider: String(process.env.RAMROD_IMAGE_ANALYSIS_PROVIDER || "control-plane").trim().toLowerCase(),
  ollamaUrl: String(process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, ""),
  ollamaModel: process.env.OLLAMA_VISION_MODEL || "qwen3-vl:8b-instruct",
  ollamaRecognitionModel: process.env.OLLAMA_RECOGNITION_MODEL || "qwen3-vl:2b-instruct",
  ollamaTimeoutMs: clampInteger(process.env.OLLAMA_TIMEOUT_MS, 30_000, 900_000, 300_000),
  ollamaKeepAlive: process.env.OLLAMA_KEEP_ALIVE || "10m",
  cloudFallback: String(process.env.RAMROD_IMAGE_CLOUD_FALLBACK || "false").toLowerCase() === "true",
  once: process.argv.includes("--once")
};

validateConfig();

let stopping = false;
let worker = null;
let lastMaintenanceAt = 0;

process.on("SIGINT", requestStop);
process.on("SIGTERM", requestStop);

await run();

async function run() {
  worker = await registerWorker("online");
  log("worker_started", {
    workerId: worker.id,
    workerKey: worker.worker_key,
    capabilities: config.capabilities,
    once: config.once
  });

  try {
    do {
      await runMaintenanceIfDue();
      await registerWorker("online");

      const job = await claimJob();
      if (!job) {
        if (config.once) break;
        await sleep(config.pollMs);
        continue;
      }

      await executeJob(job);
      if (config.once) break;
    } while (!stopping);
  } finally {
    await registerWorker("offline").catch((error) => {
      log("worker_shutdown_heartbeat_failed", { message: safeMessage(error) });
    });
    log("worker_stopped", { workerId: worker?.id || null });
  }
}

async function executeJob(job) {
  const startedAt = Date.now();
  const leaseTimer = setInterval(() => {
    renewJobLease(job).catch((error) => {
      log("job_lease_renewal_failed", {
        jobId: job.id,
        message: safeMessage(error)
      });
    });
  }, Math.max(10, Math.floor(config.leaseSeconds / 3)) * 1000);
  leaseTimer.unref();

  await registerWorker("busy");
  log("job_started", {
    jobId: job.id,
    jobType: job.job_type,
    attempt: job.attempts,
    itemId: job.item_id
  });

  try {
    const result = await handleJob(job);
    await applyJobResult(job, result);
    await finishJob(job, true, {
      ...result,
      worker: {
        id: worker.id,
        key: worker.worker_key,
        durationMs: Date.now() - startedAt
      }
    });
    log("job_succeeded", {
      jobId: job.id,
      jobType: job.job_type,
      durationMs: Date.now() - startedAt
    });
  } catch (error) {
    const retryDelaySeconds = Math.min(3600, 30 * (2 ** Math.max(0, Number(job.attempts || 1) - 1)));
    try {
      await finishJob(job, false, null, {
        code: error.code || "worker_job_failed",
        message: safeMessage(error),
        retryable: error.retryable !== false,
        failedAt: new Date().toISOString()
      }, retryDelaySeconds);
    } catch (finishError) {
      log("job_failure_could_not_be_persisted", {
        jobId: job.id,
        message: safeMessage(finishError)
      });
    }
    log("job_failed", {
      jobId: job.id,
      jobType: job.job_type,
      attempt: job.attempts,
      retryDelaySeconds,
      message: safeMessage(error)
    });
  } finally {
    clearInterval(leaseTimer);
    await registerWorker(stopping ? "draining" : "online");
  }
}

async function applyJobResult(job, result) {
  if (job.job_type !== "price_check" || !job.item_id || !result?.priceCheck) return;

  const priceCheck = result.priceCheck;
  const decision = result.decision || null;
  await supabaseRequest(`/items?id=eq.${encodeURIComponent(job.item_id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      price_low: numberOrNull(priceCheck.low),
      price_fair: numberOrNull(priceCheck.fair),
      price_aggressive: numberOrNull(priceCheck.aggressive),
      ...(decision?.channel ? { primary_channel: decision.channel } : {})
    })
  });

  await supabaseRequest("/price_checks?on_conflict=source_job_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      item_id: job.item_id,
      source_job_id: job.id,
      method: priceCheck.method || "unknown",
      query: priceCheck.query || null,
      low: numberOrNull(priceCheck.low),
      fair: numberOrNull(priceCheck.fair),
      aggressive: numberOrNull(priceCheck.aggressive),
      confidence: clampInteger(priceCheck.confidence, 0, 100, 0),
      evidence: priceCheck.evidence || [],
      notes: priceCheck.notes || [],
      checked_at: priceCheck.checkedAt || new Date().toISOString()
    })
  });
}

async function handleJob(job) {
  switch (job.job_type) {
    case "health_check":
      return {
        status: "ok",
        checkedAt: new Date().toISOString(),
        machine: machineMetadata()
      };
    case "price_check":
      return callControlPlane("/api/price-check", job.payload);
    case "ebay_draft":
      return callControlPlane("/api/ebay-draft", job.payload);
    case "recognize_image": {
      const hydratedPayload = await hydrateImagePayload(job.payload);
      return recognizeImageWithOllama(hydratedPayload);
    }
    case "analyze_image": {
      const hydratedPayload = await hydrateImagePayload(job.payload);
      let result;
      if (config.imageAnalysisProvider === "ollama") {
        try {
          result = await analyzeImageWithOllama(hydratedPayload);
        } catch (error) {
          if (!config.cloudFallback) throw error;
          log("ollama_analysis_falling_back_to_cloud", {
            jobId: job.id,
            message: safeMessage(error)
          });
          result = await callControlPlane("/api/analyze-image", hydratedPayload);
        }
      } else {
        result = await callControlPlane("/api/analyze-image", hydratedPayload);
      }
      return compactImageAnalysisResult(result);
    }
    default: {
      const error = new Error(`Unsupported job type: ${job.job_type}`);
      error.code = "unsupported_job_type";
      error.retryable = false;
      throw error;
    }
  }
}

async function analyzeImageWithOllama(payload) {
  const images = parseImageDataUrls(payload);
  const startedAt = Date.now();
  let response;

  try {
    response = await fetch(`${config.ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(config.ollamaTimeoutMs),
      body: JSON.stringify({
        model: config.ollamaModel,
        stream: false,
        think: false,
        keep_alive: config.ollamaKeepAlive,
        format: itemAnalysisSchema(),
        messages: [{
          role: "user",
          content: buildItemAnalysisPrompt(payload.recognition, { captureIntent: payload.captureIntent, operatorHint: payload.query }),
          images: images.map((image) => image.base64)
        }],
        options: {
          temperature: 0.1,
          num_ctx: 16384
        }
      })
    });
  } catch (error) {
    const wrapped = new Error(`Ollama ist nicht erreichbar: ${safeMessage(error)}`);
    wrapped.code = "ollama_unavailable";
    wrapped.retryable = true;
    throw wrapped;
  }

  const body = parseJson(await response.text());
  if (!response.ok) {
    const error = new Error(body?.error || `Ollama HTTP ${response.status}`);
    error.code = response.status === 404 ? "ollama_model_missing" : "ollama_error";
    error.retryable = response.status >= 500 || response.status === 429;
    throw error;
  }

  let analysis;
  try {
    analysis = applyAnalysisGuardrails(JSON.parse(String(body?.message?.content || "")));
  } catch {
    const error = new Error("Qwen hat keine gueltige strukturierte Analyse geliefert.");
    error.code = "ollama_invalid_json";
    error.retryable = true;
    throw error;
  }

  const item = mapAnalysisToItem(analysis, payload, {
    model: body.model || config.ollamaModel,
    sourceType: "local_qwen",
    researchSource: "Qwen Query"
  });
  item.recognition = payload.recognition || null;
  item.recognitionEvidence = payload.recognition?.evidence || null;
  const decision = reconcileSalesDecision(item, {
    method: "ai-precheck",
    low: item.low,
    fair: item.fair,
    aggressive: item.aggressive,
    confidence: Math.max(55, Math.min(70, Number(item.confidence) || 55)),
    evidence: []
  });
  item.channel = decision.channel;
  item.whatnotEligible = decision.whatnotEligible;
  item.reviewRequired = decision.reviewRequired;
  item.salesStrategy = decision.salesStrategy;

  return {
    provider: "local-qwen",
    model: body.model || config.ollamaModel,
    usage: {
      durationMs: Date.now() - startedAt,
      loadDurationMs: nanosecondsToMilliseconds(body.load_duration),
      promptTokens: numberOrNull(body.prompt_eval_count),
      outputTokens: numberOrNull(body.eval_count)
    },
    analysis,
    item
  };
}

async function recognizeImageWithOllama(payload) {
  const images = parseImageDataUrls(payload);
  const startedAt = Date.now();
  let response;

  try {
    response = await fetch(`${config.ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(config.ollamaTimeoutMs),
      body: JSON.stringify({
        model: config.ollamaRecognitionModel,
        stream: false,
        think: false,
        keep_alive: config.ollamaKeepAlive,
        format: itemRecognitionSchema(),
        messages: [{
          role: "user",
          content: buildItemRecognitionPrompt({ captureIntent: payload.captureIntent, visualMatches: payload.visualMatches }),
          images: images.map((image) => image.base64)
        }],
        options: {
          temperature: 0,
          num_ctx: 6144,
          num_predict: 450
        }
      })
    });
  } catch (error) {
    const wrapped = new Error(`Ollama ist für die Schnellerkennung nicht erreichbar: ${safeMessage(error)}`);
    wrapped.code = "ollama_unavailable";
    wrapped.retryable = true;
    throw wrapped;
  }

  const body = parseJson(await response.text());
  if (!response.ok) {
    const error = new Error(body?.error || `Ollama HTTP ${response.status}`);
    error.code = response.status === 404 ? "ollama_model_missing" : "ollama_error";
    error.retryable = response.status >= 500 || response.status === 429;
    throw error;
  }

  let recognition;
  try {
    recognition = scoreItemRecognition(JSON.parse(String(body?.message?.content || "")), {
      imageCount: images.length,
      barcode: payload.barcode,
      captureIntent: payload.captureIntent,
      clientImageQualities: payload.clientImageQualities
    });
  } catch {
    const error = new Error("Qwen hat keine gültige strukturierte Schnellerkennung geliefert.");
    error.code = "ollama_invalid_recognition_json";
    error.retryable = true;
    throw error;
  }
  const visualMatches = Array.isArray(payload.visualMatches) ? payload.visualMatches : [];
  recognition.externalVisualEvidence = visualMatches.length
    ? { provider: "serpapi-google-lens", matches: visualMatches.slice(0, 6) }
    : null;

  return {
    provider: "local-qwen-fast",
    model: body.model || config.ollamaRecognitionModel,
    durationMs: Date.now() - startedAt,
    usage: {
      loadDurationMs: nanosecondsToMilliseconds(body.load_duration),
      promptTokens: numberOrNull(body.prompt_eval_count),
      outputTokens: numberOrNull(body.eval_count)
    },
    recognition
  };
}

function parseImageDataUrl(value) {
  const match = String(value || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    const error = new Error("Ollama image analysis requires a base64 imageDataUrl.");
    error.code = "invalid_image_data";
    error.retryable = false;
    throw error;
  }
  return { contentType: match[1], base64: match[2] };
}

function parseImageDataUrls(payload) {
  const values = Array.isArray(payload.imageDataUrls) && payload.imageDataUrls.length
    ? payload.imageDataUrls
    : [payload.imageDataUrl];
  return values.slice(0, 6).map(parseImageDataUrl);
}

function nanosecondsToMilliseconds(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number / 1_000_000) : null;
}

async function hydrateImagePayload(payload) {
  const urls = Array.isArray(payload?.imageUrls) && payload.imageUrls.length
    ? payload.imageUrls
    : [payload?.imageUrl];
  const images = await Promise.all(urls.slice(0, 6).map(downloadWorkerImage));
  const { imageUrl: _imageUrl, imageUrls: _imageUrls, ...rest } = payload;
  return {
    ...rest,
    imageDataUrl: images[0],
    imageDataUrls: images
  };
}

async function downloadWorkerImage(value) {
  let imageUrl;
  try {
    imageUrl = new URL(String(value || ""));
  } catch {
    const error = new Error("Image jobs require a valid HTTPS imageUrl.");
    error.code = "invalid_image_url";
    error.retryable = false;
    throw error;
  }
  if (imageUrl.protocol !== "https:") {
    const error = new Error("Image jobs require an HTTPS imageUrl.");
    error.code = "invalid_image_url";
    error.retryable = false;
    throw error;
  }

  const response = await fetch(imageUrl, { redirect: "follow" });
  if (!response.ok) {
    const error = new Error(`Image download failed with HTTP ${response.status}.`);
    error.code = "image_download_failed";
    error.retryable = response.status >= 500 || response.status === 429;
    throw error;
  }

  const contentType = String(response.headers.get("content-type") || "").split(";")[0].trim();
  if (!contentType.startsWith("image/")) {
    const error = new Error(`Expected an image but received ${contentType || "unknown content type"}.`);
    error.code = "invalid_image_content_type";
    error.retryable = false;
    throw error;
  }

  const image = Buffer.from(await response.arrayBuffer());
  if (image.length > 15 * 1024 * 1024) {
    const error = new Error("Image exceeds the 15 MB worker limit.");
    error.code = "image_too_large";
    error.retryable = false;
    throw error;
  }

  return `data:${contentType};base64,${image.toString("base64")}`;
}

function compactImageAnalysisResult(result) {
  if (!result?.item?.image?.startsWith?.("data:image/")) return result;
  return {
    ...result,
    item: {
      ...result.item,
      image: null,
      imageStoredSeparately: true
    }
  };
}

async function callControlPlane(path, payload) {
  const response = await fetch(`${config.controlPlaneUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.controlPlaneToken
        ? { Authorization: `Bearer ${config.controlPlaneToken}` }
        : {})
    },
    body: JSON.stringify(payload || {})
  });

  const text = await response.text();
  const body = text ? parseJson(text) : {};

  if (!response.ok) {
    const error = new Error(body?.message || body?.error || `Control plane HTTP ${response.status}`);
    error.code = body?.error || "control_plane_error";
    error.retryable = response.status >= 500 || response.status === 429;
    throw error;
  }

  return body;
}

async function registerWorker(status) {
  const rows = await supabaseRequest("/workers?on_conflict=worker_key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      worker_key: config.workerKey,
      name: config.workerName,
      status,
      capabilities: config.capabilities,
      max_concurrency: 1,
      metadata: machineMetadata(),
      last_seen_at: new Date().toISOString()
    })
  });

  worker = rows[0] || worker;
  if (!worker?.id) throw new Error("Supabase did not return a worker id.");
  return worker;
}

async function claimJob() {
  const rows = await supabaseRpc("claim_ramrod_job", {
    p_worker_id: worker.id,
    p_capabilities: config.capabilities,
    p_lease_seconds: config.leaseSeconds
  });
  return rows[0] || null;
}

async function finishJob(job, succeeded, result = null, error = null, retryDelaySeconds = 30) {
  const rows = await supabaseRpc("finish_ramrod_job", {
    p_job_id: job.id,
    p_worker_id: worker.id,
    p_succeeded: succeeded,
    p_result: result,
    p_error: error,
    p_retry_delay_seconds: retryDelaySeconds
  });

  if (!rows[0]) {
    throw new Error(`Job ${job.id} could not be finished because its lease is no longer owned by this worker.`);
  }
  return rows[0];
}

async function renewJobLease(job) {
  const renewed = await supabaseRpc("renew_ramrod_job_lease", {
    p_job_id: job.id,
    p_worker_id: worker.id,
    p_lease_seconds: config.leaseSeconds
  });
  if (renewed !== true) {
    const error = new Error(`Lease for job ${job.id} is no longer owned by this worker.`);
    error.code = "job_lease_lost";
    throw error;
  }
}

async function runMaintenanceIfDue() {
  if (Date.now() - lastMaintenanceAt < 60_000) return;
  lastMaintenanceAt = Date.now();
  const count = await supabaseRpc("requeue_stale_ramrod_jobs", {});
  const requeued = Array.isArray(count) ? count[0] : count;
  if (Number(requeued) > 0) log("stale_jobs_requeued", { count: Number(requeued) });
}

async function supabaseRpc(name, payload) {
  return supabaseRequest(`/rpc/${name}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

async function supabaseRequest(path, options = {}) {
  const url = new URL(`/rest/v1${path}`, config.supabaseUrl);
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? parseJson(text) : null;

  if (!response.ok) {
    const error = new Error(body?.message || body?.msg || body?.code || `Supabase HTTP ${response.status}`);
    error.code = body?.code || "supabase_error";
    throw error;
  }

  return body ?? [];
}

function machineMetadata() {
  return {
    hostname: hostname(),
    platform: platform(),
    architecture: arch(),
    cpuCount: cpus().length,
    totalMemoryMb: Math.round(totalmem() / 1024 / 1024),
    nodeVersion: process.version,
    processId: process.pid,
    appVersion: "0.1.0",
    imageAnalysis: config.capabilities.includes("analyze_image")
      ? {
          provider: config.imageAnalysisProvider,
          model: config.imageAnalysisProvider === "ollama" ? config.ollamaModel : null,
          recognitionModel: config.imageAnalysisProvider === "ollama" ? config.ollamaRecognitionModel : null
        }
      : null
  };
}

function validateConfig() {
  const missing = [];
  if (!config.supabaseUrl) missing.push("SUPABASE_URL");
  if (!config.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!config.capabilities.length) missing.push("RAMROD_WORKER_CAPABILITIES");
  if (!new Set(["control-plane", "ollama"]).has(config.imageAnalysisProvider)) {
    missing.push("RAMROD_IMAGE_ANALYSIS_PROVIDER must be control-plane or ollama");
  }
  if (missing.length) {
    console.error(`Missing worker configuration: ${missing.join(", ")}`);
    process.exit(1);
  }
}

function defaultWorkerKey() {
  const stableHost = hostname().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  const fingerprint = createHash("sha256").update(`${hostname()}:${platform()}:${arch()}`).digest("hex").slice(0, 10);
  return `${stableHost || "ramrod-worker"}-${fingerprint}`;
}

function parseList(value) {
  return [...new Set(String(value).split(",").map((entry) => entry.trim()).filter(Boolean))];
}

function clampInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return { message: String(value).slice(0, 500) };
  }
}

function safeMessage(error) {
  return String(error?.message || error || "Unknown worker error")
    .replace(/(?:sk|k)-proj-[A-Za-z0-9_-]+/g, "[redacted-api-key]")
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [redacted]")
    .slice(0, 1000);
}

function requestStop() {
  stopping = true;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function log(event, details = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...details
  }));
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
