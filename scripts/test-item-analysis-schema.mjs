import assert from "node:assert/strict";

import { itemAnalysisSchema } from "./lib/item-analysis.mjs";

const errors = [];
validateStrictObjects(itemAnalysisSchema(), "root", errors);

assert.deepEqual(errors, [], `Invalid strict JSON schema:\n${errors.join("\n")}`);
console.log("Item analysis strict schema test passed.");

function validateStrictObjects(schema, path, issues) {
  if (!schema || typeof schema !== "object") return;

  if (schema.type === "object" && schema.additionalProperties === false) {
    const propertyNames = Object.keys(schema.properties || {});
    const requiredNames = Array.isArray(schema.required) ? schema.required : [];
    const missing = propertyNames.filter((name) => !requiredNames.includes(name));
    if (missing.length) issues.push(`${path}: required is missing ${missing.join(", ")}`);
  }

  for (const [name, child] of Object.entries(schema.properties || {})) {
    validateStrictObjects(child, `${path}.properties.${name}`, issues);
  }
  if (schema.items) validateStrictObjects(schema.items, `${path}.items`, issues);
}
