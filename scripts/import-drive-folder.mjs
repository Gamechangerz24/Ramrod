import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const folderUrl = process.argv[2];

if (!folderUrl) {
  throw new Error("Usage: node scripts/import-drive-folder.mjs <google-drive-folder-url>");
}

const folderId = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/)?.[1];

if (!folderId) {
  throw new Error("Could not extract folder id from URL");
}

const outDir = path.join("imports", "drive-demo");
const dataDir = "data";
const htmlPath = path.join(outDir, "folder.html");
const manifestPath = path.join(dataDir, "drive-demo-files.json");

await mkdir(outDir, { recursive: true });
await mkdir(dataDir, { recursive: true });

let html = "";

if (existsSync(htmlPath)) {
  html = await readFile(htmlPath, "utf8");
} else {
  const response = await fetch(folderUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch folder HTML: ${response.status}`);
  }
  html = await response.text();
  await writeFile(htmlPath, html);
}

const decoded = html
  .replaceAll("&quot;", '"')
  .replaceAll("&amp;", "&")
  .replaceAll("&#39;", "'");

const matches = [
  ...decoded.matchAll(
    /\[\[null,"([^"]+)"\],null,null,null,"image\/jpeg".*?"(IMG_[0-9]+\.JPG)"/g
  )
];

const byName = new Map();

for (const match of matches) {
  const [, id, name] = match;
  byName.set(name, {
    id,
    name,
    mimeType: "image/jpeg",
    driveUrl: `https://drive.google.com/file/d/${id}/view`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
    localPath: `${outDir}/${name}`
  });
}

const files = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));

for (const file of files) {
  if (existsSync(file.localPath)) continue;
  const response = await fetch(file.downloadUrl);
  if (!response.ok) {
    console.warn(`Skipping ${file.name}: ${response.status}`);
    continue;
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(file.localPath, bytes);
}

await writeFile(
  manifestPath,
  JSON.stringify(
    {
      sourceFolderId: folderId,
      sourceFolderUrl: folderUrl,
      importedAt: new Date().toISOString(),
      count: files.length,
      files
    },
    null,
    2
  )
);

console.log(`Imported manifest with ${files.length} files -> ${manifestPath}`);
