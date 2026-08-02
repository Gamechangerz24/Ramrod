import { XMLBuilder, XMLParser } from "fast-xml-parser";

const XML_NAMESPACE = "urn:ebay:apis:eBLBaseComponents";

export function buildTradingItemRequest(preview) {
  const itemSpecifics = Object.entries(preview.itemSpecifics || {}).map(([name, values]) => ({
    Name: name,
    Value: Array.isArray(values) ? values : [values]
  }));
  const item = {
    Title: preview.title,
    Description: { "#cdata": preview.descriptionHtml },
    PrimaryCategory: { CategoryID: String(preview.category?.id || "") },
    StartPrice: money(preview.price),
    CategoryMappingAllowed: true,
    Country: "DE",
    Currency: "EUR",
    DispatchTimeMax: Number(preview.handlingDays ?? 2),
    ListingDuration: "GTC",
    ListingType: "FixedPriceItem",
    PostalCode: String(preview.merchantPostalCode || ""),
    Quantity: 1,
    SKU: preview.sku,
    ConditionID: tradingConditionId(preview.condition),
    PictureDetails: {
      GalleryType: "Gallery",
      PictureURL: preview.ebayImages || preview.sourceImages || []
    },
    ShippingDetails: {
      ShippingType: "Flat",
      ShippingServiceOptions: {
        ShippingServicePriority: 1,
        ShippingService: preview.shipping?.serviceCode || "DE_DHLPaket",
        ShippingServiceCost: money(preview.shipping?.shippingCost || 0)
      }
    },
    ReturnPolicy: buildReturnPolicy(preview)
  };
  if (itemSpecifics.length) item.ItemSpecifics = { NameValueList: itemSpecifics };
  return item;
}

export async function getTradingEbayUser(config, accessToken, fetchImpl = fetch) {
  const result = await tradingRequest(config, accessToken, "GetUser", {
    GetUserRequest: {
      "@_xmlns": XML_NAMESPACE,
      DetailLevel: "ReturnAll",
      ErrorLanguage: "de_DE",
      WarningLevel: "High"
    }
  }, fetchImpl);
  const user = result.body?.User || {};
  return {
    userId: String(user.UserID || ""),
    email: String(user.Email || ""),
    sellerBusinessType: String(user.SellerInfo?.SellerBusinessType || ""),
    registrationSite: String(user.RegistrationSite || ""),
    feedbackScore: Number(user.FeedbackScore || 0)
  };
}

export async function verifyTradingEbayItem(config, accessToken, preview, imageUrls, fetchImpl = fetch) {
  const requestPreview = { ...preview, ebayImages: imageUrls };
  const result = await tradingRequest(config, accessToken, "VerifyAddItem", {
    VerifyAddItemRequest: {
      "@_xmlns": XML_NAMESPACE,
      ErrorLanguage: "de_DE",
      WarningLevel: "High",
      Item: buildTradingItemRequest(requestPreview)
    }
  }, fetchImpl);
  return tradingListingResult(result.body, result.ack);
}

export async function publishTradingEbayItem(config, accessToken, preview, imageUrls, fetchImpl = fetch) {
  const requestPreview = { ...preview, ebayImages: imageUrls };
  const result = await tradingRequest(config, accessToken, "AddItem", {
    AddItemRequest: {
      "@_xmlns": XML_NAMESPACE,
      ErrorLanguage: "de_DE",
      WarningLevel: "High",
      Item: buildTradingItemRequest(requestPreview)
    }
  }, fetchImpl);
  const listing = tradingListingResult(result.body, result.ack);
  if (!listing.listingId) throw new Error("eBay hat keine Listing-ID geliefert.");
  return listing;
}

export function tradingConditionId(value = "") {
  const text = String(value).toLowerCase();
  if (text.includes("neu")) return 1000;
  if (text.includes("defekt")) return 7000;
  return 3000;
}

async function tradingRequest(config, accessToken, callName, payload, fetchImpl) {
  const endpoint = config.tradingApiUrl
    || (config.environment === "sandbox" ? "https://api.sandbox.ebay.com/ws/api.dll" : "https://api.ebay.com/ws/api.dll");
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "#cdata",
    format: false
  });
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "X-EBAY-API-CALL-NAME": callName,
      "X-EBAY-API-COMPATIBILITY-LEVEL": String(config.tradingCompatibilityLevel || 1455),
      "X-EBAY-API-SITEID": String(config.tradingSiteId || 77),
      "X-EBAY-API-IAF-TOKEN": accessToken
    },
    body: `<?xml version="1.0" encoding="utf-8"?>${builder.build(payload)}`
  });
  const xml = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", parseTagValue: true });
  const parsed = parser.parse(xml || "");
  const body = parsed?.[`${callName}Response`] || parsed?.["GetUserResponse"] || {};
  const ack = String(body.Ack || "");
  const errors = normalizeArray(body.Errors).map(normalizeTradingError);
  const blocking = errors.filter((entry) => entry.severity === "Error");
  if (!response.ok || blocking.length || !["Success", "Warning"].includes(ack)) {
    const error = new Error(blocking[0]?.longMessage || blocking[0]?.shortMessage || `eBay ${callName} fehlgeschlagen.`);
    error.status = response.status || 400;
    error.details = errors;
    throw error;
  }
  return { body, ack, errors };
}

function tradingListingResult(body, ack) {
  const fees = normalizeArray(body.Fees?.Fee)
    .map((entry) => ({ name: String(entry.Name || ""), amount: Number(moneyValue(entry.Fee) || 0), currency: currencyValue(entry.Fee) || "EUR" }))
    .filter((entry) => entry.name && entry.amount !== 0);
  const warnings = normalizeArray(body.Errors)
    .map(normalizeTradingError)
    .filter((entry) => entry.severity !== "Error");
  return {
    ack,
    listingId: body.ItemID ? String(body.ItemID) : "",
    fees,
    feeTotal: fees.reduce((sum, entry) => sum + entry.amount, 0),
    warnings
  };
}

function buildReturnPolicy(preview) {
  if (!preview.returnsAccepted) return { ReturnsAcceptedOption: "ReturnsNotAccepted" };
  return {
    ReturnsAcceptedOption: "ReturnsAccepted",
    RefundOption: "MoneyBack",
    ReturnsWithinOption: `Days_${Number(preview.returnDays || 30)}`,
    ShippingCostPaidByOption: String(preview.returnShippingCostPayer || "BUYER").toLowerCase() === "seller" ? "Seller" : "Buyer"
  };
}

function money(value) {
  return { "@_currencyID": "EUR", "#text": Number(value || 0).toFixed(2) };
}

function moneyValue(value) {
  if (value && typeof value === "object") return value["#text"] ?? value["#value"] ?? 0;
  return value ?? 0;
}

function currencyValue(value) {
  return value && typeof value === "object" ? value["@_currencyID"] : "";
}

function normalizeTradingError(entry = {}) {
  return {
    code: String(entry.ErrorCode || ""),
    severity: String(entry.SeverityCode || ""),
    shortMessage: String(entry.ShortMessage || ""),
    longMessage: String(entry.LongMessage || entry.ShortMessage || "")
  };
}

function normalizeArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}
