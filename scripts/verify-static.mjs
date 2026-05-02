import { access, readFile } from "node:fs/promises";

const required = ["index.html", "app/globals.css", "src/static-app.js"];

for (const file of required) {
  await access(file);
}

const html = await readFile("index.html", "utf8");
const js = await readFile("src/static-app.js", "utf8");

if (!html.includes("src/static-app.js")) {
  throw new Error("index.html does not load the static app script");
}

for (const token of ["Neuen Artikel erfassen", "Verkaufskanal", "Versandstation", "Whatnot Skript"]) {
  if (!js.includes(token)) {
    throw new Error(`Missing required UI token: ${token}`);
  }
}

console.log("Static Scanapp verification passed.");
