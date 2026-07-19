import { spawn } from "node:child_process";

const controlPlaneUrl = String(process.env.RAMROD_CONTROL_PLANE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const idempotencyKey = `worker-smoke-${Date.now()}`;

const createResponse = await fetch(`${controlPlaneUrl}/api/jobs`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jobType: "health_check",
    priority: 100,
    maxAttempts: 1,
    idempotencyKey
  })
});
const created = await readJson(createResponse);

if (!createResponse.ok || !created.job?.id) {
  console.error(JSON.stringify({ step: "enqueue", status: createResponse.status, response: created }, null, 2));
  process.exit(1);
}

let job = null;
let resultResponse = null;
for (let attempt = 1; attempt <= 10; attempt += 1) {
  const workerExitCode = await runWorkerOnce();
  if (workerExitCode !== 0) {
    console.error(JSON.stringify({ step: "worker", attempt, exitCode: workerExitCode }, null, 2));
    process.exit(1);
  }

  resultResponse = await fetch(`${controlPlaneUrl}/api/jobs?id=${encodeURIComponent(created.job.id)}&limit=1`);
  const result = await readJson(resultResponse);
  job = result.jobs?.[0] || null;
  if (job?.status === "succeeded" || job?.status === "failed") break;
}

console.log(JSON.stringify({
  controlPlaneUrl,
  jobId: created.job.id,
  status: job?.status || "missing",
  attempts: job?.attempts ?? null,
  workerResult: job?.result?.worker || null,
  machine: job?.result?.machine || null,
  error: job?.error || null
}, null, 2));

if (!resultResponse?.ok || job?.status !== "succeeded" || job?.result?.status !== "ok") {
  process.exit(1);
}

function runWorkerOnce() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/ramrod-worker.mjs", "--once"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        RAMROD_WORKER_CAPABILITIES: "health_check",
        RAMROD_WORKER_KEY: `smoke-${process.pid}`,
        RAMROD_WORKER_NAME: "RAMROD Smoke Worker"
      },
      stdio: "inherit"
    });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text.slice(0, 500) };
  }
}
