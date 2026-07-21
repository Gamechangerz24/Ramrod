import { access, readFile } from "node:fs/promises";

const required = [
  "index.html",
  "shop.html",
  "manifest.webmanifest",
  "service-worker.js",
  "app/globals.css",
  "app/shop.css",
  "app/assets/ramrod-icon-192.png",
  "app/assets/ramrod-icon-512.png",
  "src/static-app.js",
  "src/shop-app.js",
  "src/pwa.js"
];

for (const file of required) {
  await access(file);
}

const html = await readFile("index.html", "utf8");
const shopHtml = await readFile("shop.html", "utf8");
const js = await readFile("src/static-app.js", "utf8");
const shopJs = await readFile("src/shop-app.js", "utf8");

if (!html.includes("src/static-app.js")) {
  throw new Error("index.html does not load the static app script");
}

if (!html.includes("manifest.webmanifest") || !html.includes("src/pwa.js")) {
  throw new Error("index.html does not load the PWA manifest and registration script");
}

for (const token of [
  "Einen Artikel analysieren",
  "Serienaufnahme",
  "Scannen",
  "Freigeben",
  "Verkäufe",
  "Verkaufskanal",
  "Freigabe-Check",
  "Pflichtangaben bestätigen",
  "Jetzt pflegen",
  "Versandstation",
  "Whatnot Skript",
  "Autonomie-Zentrale",
  "Agenten sicher steuern",
  "Anmelden"
]) {
  if (!js.includes(token)) {
    throw new Error(`Missing required UI token: ${token}`);
  }
}

if (!shopHtml.includes("src/shop-app.js") || !shopHtml.includes("app/shop.css")) {
  throw new Error("shop.html does not load the storefront assets");
}

for (const token of ["RAMROD", "Neu eingetroffen", "Einzelstück", "Noch nicht im Verkauf"]) {
  if (!shopJs.includes(token) && !shopHtml.includes(token)) {
    throw new Error(`Missing required shop UI token: ${token}`);
  }
}

console.log("Static Scanapp verification passed.");
