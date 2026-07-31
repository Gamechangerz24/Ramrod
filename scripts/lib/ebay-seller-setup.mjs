const categoryTypes = Object.freeze([{ name: "ALL_EXCLUDING_MOTORS_VEHICLES" }]);

const shippingServices = Object.freeze({
  DE_DHLPaket: { carrierCode: "DHL", label: "DHL Paket" },
  DE_HermesPaketVersichert: { carrierCode: "Hermes", label: "Hermes Paket" },
  DE_Paket: { carrierCode: "Other", label: "Standard-Paketversand" }
});

export function normalizeEbaySellerDefaults(input = {}) {
  const postalCode = String(input.postalCode || "").trim();
  if (!/^\d{5}$/.test(postalCode)) {
    throw new Error("Bitte eine deutsche Postleitzahl mit fünf Ziffern angeben.");
  }

  const shippingServiceCode = String(input.shippingServiceCode || "DE_DHLPaket").trim();
  if (!shippingServices[shippingServiceCode]) {
    throw new Error("Der gewählte Paketdienst wird von RAMROD noch nicht unterstützt.");
  }

  const shippingCost = Number(input.shippingCost);
  if (!Number.isFinite(shippingCost) || shippingCost < 0 || shippingCost > 100) {
    throw new Error("Bitte gültige Versandkosten zwischen 0 und 100 Euro angeben.");
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
    shippingServiceCode,
    shippingCarrierCode: shippingServices[shippingServiceCode].carrierCode,
    shippingLabel: shippingServices[shippingServiceCode].label,
    shippingCost: shippingCost.toFixed(2),
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

  if (!setup.fulfillmentPolicyCount) {
    await ebayJsonRequest(config, "/sell/account/v1/fulfillment_policy", {
      name: "RAMROD Versand Deutschland",
      description: "Von RAMROD angelegte Standardregel für nachverfolgten Paketversand innerhalb Deutschlands.",
      marketplaceId,
      categoryTypes,
      handlingTime: { value: settings.handlingDays, unit: "BUSINESS_DAY" },
      shippingOptions: [{
        optionType: "DOMESTIC",
        costType: "FLAT_RATE",
        shippingServices: [{
          sortOrder: 1,
          shippingCarrierCode: settings.shippingCarrierCode,
          shippingServiceCode: settings.shippingServiceCode,
          freeShipping: Number(settings.shippingCost) === 0,
          shippingCost: { value: settings.shippingCost, currency: "EUR" },
          additionalShippingCost: { value: "0.00", currency: "EUR" }
        }]
      }]
    }, headers, fetchImpl);
    created.push("Versandregel");
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
