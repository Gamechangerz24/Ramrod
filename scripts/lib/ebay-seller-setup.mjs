const categoryTypes = Object.freeze([{ name: "ALL_EXCLUDING_MOTORS_VEHICLES" }]);

export const ramrodShippingProfiles = Object.freeze([
  Object.freeze({ name: "RAMROD DHL Paket bis 2 kg", maxWeightKg: 2, shippingCost: "6.19" }),
  Object.freeze({ name: "RAMROD DHL Paket bis 5 kg", maxWeightKg: 5, shippingCost: "7.69" }),
  Object.freeze({ name: "RAMROD DHL Paket bis 10 kg", maxWeightKg: 10, shippingCost: "10.49" }),
  Object.freeze({ name: "RAMROD DHL Paket bis 20 kg", maxWeightKg: 20, shippingCost: "18.99" }),
  Object.freeze({ name: "RAMROD DHL Paket bis 31,5 kg", maxWeightKg: 31.5, shippingCost: "23.99" })
]);

export function normalizeEbaySellerDefaults(input = {}) {
  const postalCode = String(input.postalCode || "").trim();
  if (!/^\d{5}$/.test(postalCode)) {
    throw new Error("Bitte eine deutsche Postleitzahl mit fünf Ziffern angeben.");
  }

  const handlingDays = Number(input.handlingDays);
  if (!Number.isInteger(handlingDays) || handlingDays < 0 || handlingDays > 30) {
    throw new Error("Die Bearbeitungszeit muss zwischen 0 und 30 Werktagen liegen.");
  }

  const returnsAccepted = input.returnsAccepted === true || String(input.returnsAccepted) === "true";
  const returnDays = Number(input.returnDays || 30);
  if (returnsAccepted && ![14, 30, 60].includes(returnDays)) {
    throw new Error("Für Rückgaben bitte 14, 30 oder 60 Tage wählen.");
  }

  const returnShippingCostPayer = String(input.returnShippingCostPayer || "BUYER").toUpperCase();
  if (returnsAccepted && !["BUYER", "SELLER"].includes(returnShippingCostPayer)) {
    throw new Error("Bitte festlegen, wer den Rückversand bezahlt.");
  }

  return {
    postalCode,
    country: "DE",
    shippingProfiles: ramrodShippingProfiles.map((profile) => ({ ...profile })),
    handlingDays,
    returnsAccepted,
    returnDays,
    returnShippingCostPayer
  };
}

export async function createMissingEbaySellerDefaults(config, accessToken, currentSetup, input, fetchImpl = fetch) {
  const settings = normalizeEbaySellerDefaults(input);
  const setup = currentSetup || {};
  const marketplaceId = config.marketplaceId || "EBAY_DE";
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "Content-Language": "de-DE",
    "X-EBAY-C-MARKETPLACE-ID": marketplaceId
  };
  const created = [];

  if (!setup.paymentPolicyCount) {
    await ebayJsonRequest(config, "/sell/account/v1/payment_policy", {
      name: "RAMROD Zahlung",
      description: "Von RAMROD angelegte Standardregel für eBay-Zahlungen.",
      marketplaceId,
      categoryTypes
    }, headers, fetchImpl);
    created.push("Zahlungsregel");
  }

  const existingFulfillmentNames = new Set(
    (Array.isArray(setup.fulfillmentPolicies) ? setup.fulfillmentPolicies : [])
      .map((policy) => String(policy?.name || "").trim())
      .filter(Boolean)
  );
  const shippingProfilesToCreate = !setup.fulfillmentPolicyCount
    ? settings.shippingProfiles
    : Array.isArray(setup.fulfillmentPolicies)
      ? settings.shippingProfiles.filter((profile) => !existingFulfillmentNames.has(profile.name))
      : [];
  if (shippingProfilesToCreate.length) {
    for (const profile of shippingProfilesToCreate) {
      await ebayJsonRequest(config, "/sell/account/v1/fulfillment_policy", {
        name: profile.name,
        description: `Von RAMROD angelegte Versandklasse bis ${String(profile.maxWeightKg).replace(".", ",")} kg. Die passende Klasse wird pro Artikel gewählt.`,
        marketplaceId,
        categoryTypes,
        handlingTime: { value: settings.handlingDays, unit: "BUSINESS_DAY" },
        shippingOptions: [{
          optionType: "DOMESTIC",
          costType: "FLAT_RATE",
          shippingServices: [{
            sortOrder: 1,
            shippingCarrierCode: "DHL",
            shippingServiceCode: "DE_DHLPaket",
            freeShipping: false,
            shippingCost: { value: profile.shippingCost, currency: "EUR" },
            additionalShippingCost: { value: "0.00", currency: "EUR" }
          }]
        }]
      }, headers, fetchImpl);
    }
    created.push(`${shippingProfilesToCreate.length} Versandklassen`);
  }

  if (!setup.returnPolicyCount) {
    const returnPolicy = {
      name: settings.returnsAccepted ? `RAMROD Rückgabe ${settings.returnDays} Tage` : "RAMROD Keine freiwillige Rückgabe",
      description: "Von RAMROD angelegte Standardregel. Gesetzliche Rechte bleiben unberührt.",
      marketplaceId,
      categoryTypes,
      returnsAccepted: settings.returnsAccepted
    };
    if (settings.returnsAccepted) {
      returnPolicy.returnPeriod = { value: settings.returnDays, unit: "DAY" };
      returnPolicy.returnShippingCostPayer = settings.returnShippingCostPayer;
    }
    await ebayJsonRequest(config, "/sell/account/v1/return_policy", returnPolicy, headers, fetchImpl);
    created.push("Rückgaberegel");
  }

  if (!setup.locationCount) {
    const merchantLocationKey = buildMerchantLocationKey(settings.postalCode);
    await ebayJsonRequest(config, `/sell/inventory/v1/location/${encodeURIComponent(merchantLocationKey)}`, {
      name: "RAMROD Versandlager",
      location: {
        address: {
          postalCode: settings.postalCode,
          country: settings.country
        }
      },
      locationTypes: ["WAREHOUSE"],
      merchantLocationStatus: "ENABLED"
    }, headers, fetchImpl);
    created.push("Versandstandort");
  }

  return { created, settings };
}

export function buildMerchantLocationKey(postalCode) {
  return `ramrod-de-${String(postalCode || "").replace(/\D/g, "").slice(0, 5)}`;
}

async function ebayJsonRequest(config, path, payload, headers, fetchImpl) {
  const response = await fetchImpl(`${config.apiBaseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(ebayApiMessage(body, response.status));
  }
  return body;
}

function ebayApiMessage(body, status) {
  return body?.error_description
    || body?.message
    || body?.errors?.[0]?.longMessage
    || body?.errors?.[0]?.message
    || `eBay HTTP ${status}`;
}
