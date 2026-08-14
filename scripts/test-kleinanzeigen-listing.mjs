import assert from "node:assert/strict";
import {
  buildFallbackKleinanzeigenContent,
  buildKleinanzeigenBrowserTask,
  buildKleinanzeigenListingPreview,
  kleinanzeigenListingContentSchema,
  normalizeKleinanzeigenContent
} from "./lib/kleinanzeigen-listing.mjs";

const item = {
  id: "item-local-1",
  dbId: "11111111-1111-4111-8111-111111111111",
  sku: "PR-TEST-001",
  title: "Ikea Kallax Regal weiss 2x4 Faecher",
  category: "Moebel",
  franchise: "Ikea",
  condition: "Gebraucht",
  completeness: "Regal ohne Dekoration",
  notes: "Kleine Kratzer an der linken Seite. Nur Abholung.",
  fair: 45,
  weight: 20,
  salesStrategy: {
    targetPrice: 50,
    channelPlan: {
      primary: { id: "kleinanzeigen", name: "Kleinanzeigen", targetPrice: 50 },
      parallel: [],
      fallback: null
    }
  },
  confidence: 94,
  image: "https://images.example.test/kallax-front.jpg",
  images: [
    "https://images.example.test/kallax-front.jpg",
    "https://images.example.test/kallax-side.jpg"
  ]
};

const content = normalizeKleinanzeigenContent({
  title: "Ikea Kallax Regal weiss 2x4 Faecher",
  shortDescription: "Weisses Ikea Kallax Regal mit zwei mal vier Faechern. Angeboten wird das abgebildete Regal ohne Dekoration.",
  conditionDescription: "Gebrauchter Zustand mit kleinen Kratzern an der linken Seite.",
  includedItems: ["Ein Kallax Regal"],
  defects: ["Kleine Kratzer an der linken Seite"],
  sellingPoints: ["Acht Faecher", "Weiss"],
  buyerSearchTerms: ["Ikea", "Kallax", "Regal"],
  criticalMissingFacts: [],
  categoryHint: "Haus & Garten > Moebel & Wohnen > Regale",
  attributes: [
    { name: "Marke", value: "Ikea", confidence: 99 },
    { name: "Farbe", value: "Weiss", confidence: 91 }
  ]
}, item);

const account = {
  id: "22222222-2222-4222-8222-222222222222",
  status: "connected",
  display_name: "Privat Kleinanzeigen",
  browser_profile_key: "kleinanzeigen-private",
  metadata: {
    postalCode: "73730",
    automationAuthorizationRef: "kleinanzeigen-partner-pilot-2026"
  }
};
const preview = buildKleinanzeigenListingPreview({ item, content, account });
assert.equal(preview.status, "ready_for_approval");
assert.equal(preview.title.length <= 65, true);
assert.equal(preview.price, 50);
assert.equal(preview.priceMode, "negotiable");
assert.equal(preview.deliveryMode, "pickup");
assert.equal(preview.connector.ready, true);
assert.equal(preview.sourceImages.length, 2);
assert.match(preview.description, /Nur Abholung/);

const task = buildKleinanzeigenBrowserTask({ item, preview, account });
assert.deepEqual(task.allowedOrigins, ["https://www.kleinanzeigen.de"]);
assert.equal(task.guardrails.stopBeforeFinalSubmit, true);
assert.equal(task.guardrails.credentialAccess, "browser-profile-only");
assert.equal(JSON.stringify(task).includes("password"), false);
assert.equal(task.listing.images.length, 2);

const noAccountPreview = buildKleinanzeigenListingPreview({ item, content, account: null });
assert.equal(noAccountPreview.status, "ready_for_approval");
assert.equal(noAccountPreview.connector.ready, false);

const connectedWithoutAuthorization = {
  ...account,
  metadata: { postalCode: "73730" }
};
const unauthorizedPreview = buildKleinanzeigenListingPreview({ item, content, account: connectedWithoutAuthorization });
assert.equal(unauthorizedPreview.connector.browserProfileReady, true);
assert.equal(unauthorizedPreview.connector.automatedAccessAuthorized, false);
assert.equal(unauthorizedPreview.connector.ready, false);

const unsafeElectronics = {
  ...item,
  title: "Samsung Staubsauger gebraucht",
  category: "Elektrogeraet",
  weight: 4,
  notes: ""
};
const fallback = buildFallbackKleinanzeigenContent(unsafeElectronics);
const unsafePreview = buildKleinanzeigenListingPreview({ item: unsafeElectronics, content: fallback, account });
assert.equal(unsafePreview.status, "needs_input");
assert.equal(unsafePreview.content.criticalMissingFacts.some((entry) => entry.severity === "blocking"), true);

const schema = kleinanzeigenListingContentSchema();
assert.equal(schema.required.includes("criticalMissingFacts"), true);
assert.equal(schema.properties.title.maxLength, 65);

assert.throws(() => buildKleinanzeigenBrowserTask({ item, preview: noAccountPreview, account: null }), /Browserprofil/);
assert.throws(
  () => buildKleinanzeigenBrowserTask({ item, preview: unauthorizedPreview, account: connectedWithoutAuthorization }),
  /Plattform- oder Partnerfreigabe/
);

console.log("Kleinanzeigen listing tests passed.");
