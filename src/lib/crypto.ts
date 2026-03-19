/**
 * crypto.ts
 * Web Crypto API helpers for chai-khata.
 *
 * Key derivation : PBKDF2 / SHA-256 / 200 000 iterations
 * Encryption     : AES-GCM / 256-bit key / 12-byte random IV per call
 * Storage format : base64-encoded JSON  { iv: string, ct: string }
 */

// ─── Sentinel value encrypted and stored alongside the salt. ─────────────────
// On PIN entry we decrypt this to verify the PIN without touching real data.
const VERIFICATION_SENTINEL = 'chai-khata-ok';

// ─── In-memory active key ─────────────────────────────────────────────────────
let activeKey: CryptoKey | null = null;

export function setActiveKey(key: CryptoKey | null): void {
  activeKey = key;
}

export function getActiveKey(): CryptoKey | null {
  return activeKey;
}

export function clearActiveKey(): void {
  activeKey = null;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Generate a cryptographically random 16-byte salt. */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/** Encode a Uint8Array to a base64 string. */
function bufToBase64(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary);
}

/** Decode a base64 string to a Uint8Array. */
function base64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

// ─── Key derivation ───────────────────────────────────────────────────────────

/**
 * Derive an AES-GCM CryptoKey from a PIN string and a salt.
 * Uses PBKDF2 with 200 000 SHA-256 iterations.
 */
export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 200_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // not extractable
    ['encrypt', 'decrypt'],
  );
}

// ─── Encryption / Decryption ─────────────────────────────────────────────────

interface EncryptedBlob {
  iv: string; // base64
  ct: string; // base64 ciphertext
}

/**
 * Encrypt an arbitrary JSON-serialisable value with AES-GCM.
 * Returns a serialised string safe to store in localForage.
 */
export async function encryptValue(key: CryptoKey, data: unknown): Promise<string> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = enc.encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  const blob: EncryptedBlob = {
    iv: bufToBase64(iv),
    ct: bufToBase64(new Uint8Array(ciphertext)),
  };

  return JSON.stringify(blob);
}

/**
 * Decrypt a value previously produced by encryptValue.
 * Throws a DOMException (OperationError) if the key is wrong or data is tampered.
 */
export async function decryptValue<T = unknown>(key: CryptoKey, stored: string): Promise<T> {
  const blob: EncryptedBlob = JSON.parse(stored);
  const iv = base64ToBuf(blob.iv);
  const ciphertext = base64ToBuf(blob.ct);

  const dec = new TextDecoder();
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(dec.decode(plaintext)) as T;
}

// ─── Verification token helpers ───────────────────────────────────────────────

/** Encrypt the sentinel string and return the ciphertext blob. */
export async function createVerificationToken(key: CryptoKey): Promise<string> {
  return encryptValue(key, VERIFICATION_SENTINEL);
}

/**
 * Try to decrypt the verification token.
 * Returns true if the PIN (and therefore the key) is correct.
 */
export async function checkVerificationToken(
  key: CryptoKey,
  token: string,
): Promise<boolean> {
  try {
    const result = await decryptValue<string>(key, token);
    return result === VERIFICATION_SENTINEL;
  } catch {
    return false;
  }
}
