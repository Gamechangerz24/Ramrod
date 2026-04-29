import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const itemsPath = process.argv[2] || "data/app-import-items.json";
const configPath = process.argv[3] || "data/channel-config.json";
const outputPath = process.argv[4] || "data/channel-listing-plan.json";

const itemImport = JSON.parse(await readFile(itemsPath, "utf8"));
const config = JSON.parse(await readFile(configPath, "utf8"));
const channels = Object.fromEntries(config.channels.map((channel) => [channel.id, channel]));

const plans = itemImport.items.map((item) => {
  const primary = choosePrimaryChannel(item);
  const secondary = chooseSecondaryChannels(item, primary);
  const approval = approvalPolicy(item, primary);
  const listingActions = [primary, ...secondary].map((channelId, index) =>
    buildListingAction(item, channels[channelId], index === 0 ? "primary" : "secondary", approval)
  );

  return {
    itemId: item.id,
    sku: item.sku,
    sourceFile: item.sourceFile,
    title: item.title,
    category: item.category,
    fairValue: item.fair,
    confidence: item.confidence,
    primaryChannel: primary,
    secondaryChannels: secondary,
    approval,
    listingActions,
    saleLockPolicy: {
      inventoryStateOnSale: "reserved",
      delistEverywhereExceptSoldChannel: true,
      holdMinutesBeforeDelist: item.fair >= 100 ? 0 : 5,
      reason: item.fair >= 100 ? "High value item should be locked immediately." : "Small grace window for low value items while sale import settles."
    }
  };
});

const summary = plans.reduce(
  (acc, plan) => {
    acc.total++;
    acc.byPrimary[plan.primaryChannel] = (acc.byPrimary[plan.primaryChannel] || 0) + 1;
    acc.needsApproval += plan.approval.needsHumanApproval ? 1 : 0;
    acc.fairValue += plan.fairValue || 0;
    return acc;
  },
  { total: 0, byPrimary: {}, needsApproval: 0, fairValue: 0 }
);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      sourceItems: itemsPath,
      sourceConfig: configPath,
      summary,
      plans
    },
    null,
    2
  )
);

console.log(`Generated ${plans.length} channel plans -> ${outputPath}`);

function choosePrimaryChannel(item) {
  const normalized = `${item.category} ${item.title} ${item.franchise}`.toLowerCase();

  if (item.channel === "Problemfall" || item.confidence < 65) return "strongvision_web";
  if (item.channel === "Bundle" || item.fair <= 6) return "whatnot";
  if (normalized.includes("trading card") || normalized.includes("tcg")) return "cardmarket";
  if (normalized.includes("vinyl") || normalized.includes("record")) return "discogs";
  if (normalized.includes("vhs") && item.fair < 10) return "whatnot";
  if (item.channel === "Whatnot") return "whatnot";
  return "ebay";
}

function chooseSecondaryChannels(item, primary) {
  const secondary = new Set(["strongvision_web"]);
  const normalized = `${item.category} ${item.title} ${item.franchise}`.toLowerCase();

  if (primary !== "creators_shop" && item.fair >= 20) secondary.add("creators_shop");
  if (primary !== "whatnot" && item.fair <= 15) secondary.add("whatnot");
  if (normalized.includes("console") || normalized.includes("bulk")) secondary.add("kleinanzeigen");

  secondary.delete(primary);
  return [...secondary];
}

function approvalPolicy(item, primary) {
  const needsHumanApproval =
    item.stage === "Gescannt" ||
    item.condition === "Pruefen" ||
    item.confidence < 85 ||
    item.fair >= 40 ||
    primary === "whatnot";

  const reasons = [];
  if (item.stage === "Gescannt" || item.condition === "Pruefen") reasons.push("Item is still in review stage.");
  if (item.confidence < 85) reasons.push("AI confidence below auto-list threshold.");
  if (item.fair >= 40) reasons.push("Fair value above approval threshold.");
  if (primary === "whatnot") reasons.push("Live sale items need show batching and seller approval.");

  return {
    needsHumanApproval,
    approvalThreshold: "auto-list only when confidence >= 85, fair value < 40 EUR, and item is in Freigabe",
    reasons
  };
}

function buildListingAction(item, channel, role, approval) {
  return {
    channelId: channel.id,
    channelName: channel.name,
    role,
    status: approval.needsHumanApproval || channel.requiresHumanApproval ? "needs_approval" : "ready_to_publish",
    automationLevel: channel.automationLevel,
    connectorStatus: channel.connectorStatus,
    payloadStatus: "draft_ready",
    delistSupported: channel.delistSupported,
    saleDetection: channel.saleDetection,
    draft: {
      title: item.listingDraft?.title || item.title,
      description: item.listingDraft?.description || item.notes,
      price: item.fair,
      floorPrice: item.low,
      highPrice: item.aggressive,
      image: item.image,
      sku: item.sku
    }
  };
}
