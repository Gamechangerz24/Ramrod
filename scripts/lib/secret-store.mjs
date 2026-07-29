import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname, resolve } from "node:path";

const STORE_VERSION = 1;

export function createEncryptedSecretStore({
  filePath = process.env.RAMROD_SECRET_STORE_PATH || ".ramrod-secrets/credentials.enc.json",
  encryptionKey = process.env.RAMROD_SECRET_ENCRYPTION_KEY || ""
} = {}) {
  const key = parseEncryptionKey(encryptionKey);
  const resolvedPath = resolve(filePath);

  return {
    available: Boolean(key),
    filePath: resolvedPath,
    has(secretRef) {
      if (!key || !secretRef) return false;
      return Boolean(readStore(resolvedPath).entries?.[secretRef]);
    },
    get(secretRef) {
      if (!key) throw new Error("Der RAMROD Credential-Tresor ist nicht konfiguriert.");
      const record = readStore(resolvedPath).entries?.[secretRef];
      if (!record) return null;
      return decryptRecord(record, key, secretRef);
    },
    put(secretRef, value) {
      if (!key) throw new Error("Der RAMROD Credential-Tresor ist nicht konfiguriert.");
      if (!secretRef) throw new Error("Eine Credential-Referenz wird benötigt.");
      const store = readStore(resolvedPath);
      store.entries[secretRef] = encryptRecord(value, key, secretRef);
      writeStore(resolvedPath, store);
      return secretRef;
    },
    delete(secretRef) {
      if (!key) throw new Error("Der RAMROD Credential-Tresor ist nicht konfiguriert.");
      const store = readStore(resolvedPath);
      if (!store.entries?.[secretRef]) return false;
      delete store.entries[secretRef];
      writeStore(resolvedPath, store);
      return true;
    }
  };
}

export function buildSecretRef(provider, organizationId, accountId) {
  const cleanProvider = String(provider || "").replace(/[^a-z0-9_-]/gi, "").toLowerCase();
  const cleanOrganization = String(organizationId || "").replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const cleanAccount = String(accountId || "").replace(/[^a-z0-9-]/gi, "").toLowerCase();
  if (!cleanProvider || !cleanOrganization || !cleanAccount) {
    throw new Error("Provider, Kundenbereich und Konto werden für die Credential-Referenz benötigt.");
  }
  return `ramrod-vault://${cleanProvider}/${cleanOrganization}/${cleanAccount}`;
}

function parseEncryptionKey(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  if (/^[a-f0-9]{64}$/i.test(text)) return Buffer.from(text, "hex");

  try {
    const decoded = Buffer.from(text, "base64");
    if (decoded.length === 32) return decoded;
  } catch {
    return null;
  }

  return createHash("sha256").update(text).digest();
}

function emptyStore() {
  return { version: STORE_VERSION, entries: {} };
}

function readStore(filePath) {
  if (!existsSync(filePath)) return emptyStore();
  const parsed = JSON.parse(readFileSync(filePath, "utf8"));
  if (parsed?.version !== STORE_VERSION || !parsed.entries || typeof parsed.entries !== "object") {
    throw new Error("Der RAMROD Credential-Tresor hat ein unbekanntes Format.");
  }
  return parsed;
}

function writeStore(filePath, store) {
  mkdirSync(dirname(filePath), { recursive: true, mode: 0o700 });
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(store)}\n`, { mode: 0o600 });
  chmodSync(temporaryPath, 0o600);
  renameSync(temporaryPath, filePath);
  chmodSync(filePath, 0o600);
}

function encryptRecord(value, key, secretRef) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(secretRef));
  const plaintext = Buffer.from(JSON.stringify(value));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  return {
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    updatedAt: new Date().toISOString()
  };
}

function decryptRecord(record, key, secretRef) {
  if (record?.algorithm !== "aes-256-gcm") throw new Error("Unbekannte Credential-Verschlüsselung.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(record.iv, "base64"));
  decipher.setAAD(Buffer.from(secretRef));
  decipher.setAuthTag(Buffer.from(record.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(record.ciphertext, "base64")),
    decipher.final()
  ]);
  return JSON.parse(plaintext.toString("utf8"));
}
