import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const manifestPath = process.argv[2] || "data/drive-demo-files.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const normalizedDir = path.join("imports", "drive-demo-normalized");

await mkdir(normalizedDir, { recursive: true });

const orientationToSteps = {
  "2": [["-f", "horizontal"]],
  "3": [["-r", "180"]],
  "4": [["-f", "vertical"]],
  "5": [["-r", "90"], ["-f", "horizontal"]],
  "6": [["-r", "90"]],
  "7": [["-r", "270"], ["-f", "horizontal"]],
  "8": [["-r", "270"]]
};

for (const file of manifest.files) {
  const source = file.localPath;
  const target = path.join(normalizedDir, path.basename(source));
  const orientation = readOrientation(source);
  const steps = orientationToSteps[orientation] || [];

  if (steps.length === 0) {
    await copyFile(source, target);
  } else {
    await copyFile(source, target);
    for (const args of steps) {
      runSips([...args, target]);
    }
    runSips(["-s", "orientation", "1", target]);
  }

  file.originalLocalPath = file.localPath;
  file.normalizedLocalPath = target;
  file.orientationBeforeNormalize = orientation || "unknown";
  file.orientationNormalized = true;
}

manifest.normalizedAt = new Date().toISOString();
manifest.normalizedDir = normalizedDir;

await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Normalized ${manifest.files.length} images -> ${normalizedDir}`);

function readOrientation(filePath) {
  const result = spawnSync("sips", ["-g", "orientation", filePath], {
    encoding: "utf8"
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const match = output.match(/orientation:\s*(\d+)/);
  return match?.[1] || "";
}

function runSips(args) {
  const result = spawnSync("sips", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`sips failed: ${result.stderr || result.stdout}`);
  }
}
