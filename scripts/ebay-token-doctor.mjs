import { readFileSync } from "node:fs";

loadDotEnv(".env.local");

const oauthToken = process.env.EBAY_OAUTH_USER_TOKEN || "";
const authNAuthToken = process.env.EBAY_AUTH_N_AUTH_TOKEN || "";
const candidate = process.argv[2] || oauthToken || authNAuthToken;

if (!candidate) {
  console.log("No eBay token found. Set EBAY_OAUTH_USER_TOKEN or EBAY_AUTH_N_AUTH_TOKEN in .env.local.");
  process.exit(1);
}

const kind = classifyToken(candidate);

console.log(`eBay token type: ${kind.label}`);
console.log(`Length: ${candidate.length} chars`);
console.log(`Safe preview: ${safePreview(candidate)}`);
console.log(`Sell API usable: ${kind.sellApiUsable ? "yes" : "no"}`);
console.log(kind.note);

function classifyToken(token) {
  if (token.startsWith("v^")) {
    return {
      label: "Auth'n'Auth user token",
      sellApiUsable: false,
      note: "This is a legacy user token. It can be useful for traditional Trading API calls, but RAMROD's planned Inventory/Offer/Order flow needs an OAuth User Access Token."
    };
  }

  if (token.startsWith("v%5E")) {
    return {
      label: "URL-encoded Auth'n'Auth user token",
      sellApiUsable: false,
      note: "Decode it only for traditional API tests. For eBay Sell APIs, generate an OAuth User Access Token instead."
    };
  }

  if (token.split(".").length === 3 || token.length > 500) {
    return {
      label: "Likely OAuth access token",
      sellApiUsable: true,
      note: "Looks like the right family of token for Sell APIs. Scope still needs to be verified by making a safe sandbox API request."
    };
  }

  return {
    label: "unknown",
    sellApiUsable: false,
    note: "Token shape is unknown. Do not use for publish calls until verified."
  };
}

function safePreview(value) {
  if (value.length <= 12) return "<too-short-to-preview>";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function loadDotEnv(path) {
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equals = trimmed.indexOf("=");
      if (equals === -1) continue;
      const key = trimmed.slice(0, equals).trim();
      const value = trimmed.slice(equals + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Optional local file.
  }
}
