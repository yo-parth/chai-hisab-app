import localForage from 'localforage';
import {
  getActiveKey,
  deriveKey,
  generateSalt,
  encryptValue,
  decryptValue,
  createVerificationToken,
  checkVerificationToken,
  setActiveKey,
  clearActiveKey,
} from './crypto';

// ─── localForage stores ───────────────────────────────────────────────────────

const customerStore = localForage.createInstance({
  name: 'chai-khata',
  storeName: 'customers',
});

const entryStore = localForage.createInstance({
  name: 'chai-khata',
  storeName: 'entries',
});

const settingsStore = localForage.createInstance({
  name: 'chai-khata',
  storeName: 'settings',
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  price_per_cup?: number;
  created_at: number;
}

export interface Entry {
  id: string;
  customer_id: string;
  qty: number;
  note?: string;
  type: 'sale' | 'settlement' | 'partial';
  timestamp: number;
}

export interface Settings {
  pin?: string;        // kept only for UI backwards-compat; real auth is via crypto
  default_price: number;
  salt?: string;            // base64-encoded 16-byte salt (stored in plain)
  verificationToken?: string; // encrypted sentinel to test PIN on startup
}

// ─── Internal encrypt/decrypt helpers ────────────────────────────────────────

/**
 * Serialize and optionally encrypt a value before writing to localForage.
 * When no active key is set the value is stored as a plain object (legacy / no-PIN mode).
 */
async function encode<T extends object>(value: T): Promise<T | string> {
  const key = getActiveKey();
  if (!key) return value;
  return encryptValue(key, value);
}

/**
 * Read a value from localForage and optionally decrypt it.
 * Handles both the encrypted (string blob) and legacy (plain object) formats.
 *
 * When an active key is set and the stored value is a plain object we return
 * it as-is — this allows reading data that was stored before PIN was enabled.
 * (enableEncryption() migrates all data at enable-time so this path shouldn't
 *  happen in normal usage, but it acts as a safety net.)
 *
 * When an active key is set and the stored value IS an encrypted string we
 * decrypt it — a wrong key will throw here.
 */
async function decodeOrRaw<T>(stored: T | string | null): Promise<T | null> {
  if (stored === null) return null;
  const key = getActiveKey();
  if (!key) {
    // No encryption active — value should be a plain object.
    return stored as T;
  }
  if (typeof stored === 'string') {
    // Encrypted blob — decrypt with the active key.
    return decryptValue<T>(key, stored);
  }
  // Active key set but value is a plain object — stored before PIN was enabled.
  return stored as T;
}

// ─── Customer operations ──────────────────────────────────────────────────────

export const getCustomers = async (): Promise<Customer[]> => {
  const keys = await customerStore.keys();
  const results = await Promise.all(
    keys.map(async (k) => {
      const raw = await customerStore.getItem<Customer | string>(k);
      return decodeOrRaw<Customer>(raw);
    }),
  );
  return results
    .filter((c): c is Customer => c !== null)
    .sort((a, b) => b.created_at - a.created_at);
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
  const raw = await customerStore.getItem<Customer | string>(id);
  return decodeOrRaw<Customer>(raw);
};

export const saveCustomer = async (customer: Customer): Promise<void> => {
  await customerStore.setItem(customer.id, await encode(customer));
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await customerStore.removeItem(id);
  const entries = await getCustomerEntries(id);
  for (const entry of entries) {
    await entryStore.removeItem(entry.id);
  }
};

// ─── Entry operations ─────────────────────────────────────────────────────────

export const getCustomerEntries = async (customerId: string): Promise<Entry[]> => {
  const keys = await entryStore.keys();
  const results = await Promise.all(
    keys.map(async (k) => {
      const raw = await entryStore.getItem<Entry | string>(k);
      return decodeOrRaw<Entry>(raw);
    }),
  );
  return results
    .filter((e): e is Entry => e !== null && e.customer_id === customerId)
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const saveEntry = async (entry: Entry): Promise<void> => {
  await entryStore.setItem(entry.id, await encode(entry));
};

export const deleteEntry = async (id: string): Promise<void> => {
  await entryStore.removeItem(id);
};

export const getAllEntries = async (): Promise<Entry[]> => {
  const keys = await entryStore.keys();
  const results = await Promise.all(
    keys.map(async (k) => {
      const raw = await entryStore.getItem<Entry | string>(k);
      return decodeOrRaw<Entry>(raw);
    }),
  );
  return results
    .filter((e): e is Entry => e !== null)
    .sort((a, b) => b.timestamp - a.timestamp);
};

// ─── Settings operations ──────────────────────────────────────────────────────
// Settings are NEVER encrypted — we need default_price, salt and
// verificationToken before we have the key.

export const getSettings = async (): Promise<Settings> => {
  const settings = await settingsStore.getItem<Settings>('app-settings');
  return settings || { default_price: 10 };
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await settingsStore.setItem('app-settings', settings);
};

// ─── Balance calculation ──────────────────────────────────────────────────────

export const getCustomerBalance = async (
  customerId: string,
): Promise<{ cups: number; lastVisit: number }> => {
  const entries = await getCustomerEntries(customerId);
  let cups = 0;
  let lastVisit = 0;

  const lastSettlement = entries.find((e) => e.type === 'settlement');
  const lastSettlementTime = lastSettlement ? lastSettlement.timestamp : 0;

  for (const entry of entries) {
    if (entry.timestamp > lastSettlementTime) {
      if (entry.type === 'sale') {
        cups += entry.qty;
      } else if (entry.type === 'partial') {
        cups -= entry.qty;
      }
    }
    if (entry.timestamp > lastVisit) {
      lastVisit = entry.timestamp;
    }
  }

  return { cups, lastVisit };
};

// ─── CSV export ───────────────────────────────────────────────────────────────

export const exportToCSV = async (): Promise<string> => {
  const customers = await getCustomers();
  const allEntries = await getAllEntries();

  let csv = 'ग्राहक का नाम,कप संख्या,प्रकार,टिप्पणी,तारीख\n';

  for (const customer of customers) {
    const entries = allEntries.filter((e) => e.customer_id === customer.id);
    for (const entry of entries) {
      const date = new Date(entry.timestamp).toLocaleDateString('hi-IN');
      let typeStr = '';
      if (entry.type === 'sale') typeStr = 'बिक्री';
      else if (entry.type === 'partial') typeStr = 'आंशिक';
      else typeStr = 'भुगतान';
      
      csv += `${customer.name},${entry.qty},${typeStr},${entry.note || ''},${date}\n`;
    }
  }

  return csv;
};

// ─── Encryption management ────────────────────────────────────────────────────

/** True when a PIN / salt is stored in settings. */
export const isEncryptionEnabled = async (): Promise<boolean> => {
  const settings = await getSettings();
  return Boolean(settings.salt);
};

/**
 * Called once on app startup.
 * Returns true  → PIN prompt is required before using the app.
 * Returns false → No PIN set; app opens normally.
 */
export const initEncryptionIfNeeded = async (): Promise<boolean> => {
  return isEncryptionEnabled();
};

/**
 * Attempt to unlock the app with the given PIN.
 * Derives the key from the stored salt, checks the verification token.
 * On success: stores the key in memory and returns true.
 * On wrong PIN: returns false.
 */
export const verifyPinAndUnlock = async (pin: string): Promise<boolean> => {
  const settings = await getSettings();
  if (!settings.salt || !settings.verificationToken) return false;

  const saltBytes = Uint8Array.from(atob(settings.salt), (c) => c.charCodeAt(0));
  const key = await deriveKey(pin, saltBytes);
  const ok = await checkVerificationToken(key, settings.verificationToken);

  if (ok) {
    setActiveKey(key);
    return true;
  }
  return false;
};

/**
 * Enable encryption:
 *  1. Generate a random salt.
 *  2. Derive an AES-GCM key from the PIN + salt.
 *  3. Re-encrypt every customer and entry already in storage.
 *  4. Write the salt and a verification token to settings.
 *  5. Set the active key so subsequent reads/writes are encrypted.
 */
export const enableEncryption = async (pin: string): Promise<void> => {
  const salt = generateSalt();
  const key = await deriveKey(pin, salt);

  // --- Re-encrypt all existing data ----------------------------------------
  const customerKeys = await customerStore.keys();
  const customers = await Promise.all(
    customerKeys.map(async (k) => {
      const raw = await customerStore.getItem<Customer | string>(k);
      const value = await decodeOrRaw<Customer>(raw);
      return value ? { id: k, value } : null;
    }),
  );
  for (const item of customers.filter(Boolean) as Array<{ id: string; value: Customer }>) {
    await customerStore.setItem(item.id, await encryptValue(key, item.value));
  }

  const entryKeys = await entryStore.keys();
  const entries = await Promise.all(
    entryKeys.map(async (k) => {
      const raw = await entryStore.getItem<Entry | string>(k);
      const value = await decodeOrRaw<Entry>(raw);
      return value ? { id: k, value } : null;
    }),
  );
  for (const item of entries.filter(Boolean) as Array<{ id: string; value: Entry }>) {
    await entryStore.setItem(item.id, await encryptValue(key, item.value));
  }

  // --- Persist salt + verification token ------------------------------------
  const saltB64 = btoa(String.fromCharCode(...Array.from(salt)));
  const verificationToken = await createVerificationToken(key);

  const settings = await getSettings();
  await saveSettings({
    ...settings,
    pin: undefined,            // remove legacy plain-text pin
    salt: saltB64,
    verificationToken,
  });

  // Activate the key for this session.
  setActiveKey(key);
};

/**
 * Disable encryption:
 *  1. Decrypt every customer and entry in storage back to plain objects.
 *  2. Remove the salt and verification token from settings.
 *  3. Clear the in-memory key.
 */
export const disableEncryption = async (): Promise<void> => {
  // Collect and decrypt all customers first (key still set at this point).
  const customerKeys = await customerStore.keys();
  const customers = await Promise.all(
    customerKeys.map(async (k) => {
      const raw = await customerStore.getItem<Customer | string>(k);
      const value = await decodeOrRaw<Customer>(raw);
      return value ? { id: k, value } : null;
    }),
  );
  for (const item of customers.filter(Boolean) as Array<{ id: string; value: Customer }>) {
    await customerStore.setItem(item.id, item.value);
  }

  const entryKeys = await entryStore.keys();
  const entries = await Promise.all(
    entryKeys.map(async (k) => {
      const raw = await entryStore.getItem<Entry | string>(k);
      const value = await decodeOrRaw<Entry>(raw);
      return value ? { id: k, value } : null;
    }),
  );
  for (const item of entries.filter(Boolean) as Array<{ id: string; value: Entry }>) {
    await entryStore.setItem(item.id, item.value);
  }

  // Remove crypto fields from settings.
  const settings = await getSettings();
  const { salt: _s, verificationToken: _v, pin: _p, ...rest } = settings;
  await saveSettings(rest as Settings);

  clearActiveKey();
};

// ─── Summary stats ────────────────────────────────────────────────────────────

export interface SummaryStats {
  cupsSold: number;
  totalOwed: number;
  topDebtors: { name: string; balance: number; cups: number }[];
}

export const getSummaryStats = async (
  range: 'today' | 'week',
): Promise<SummaryStats> => {
  // Range boundary
  const now = Date.now();
  const todayStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const rangeStart = range === 'today' ? todayStart : now - 7 * 24 * 60 * 60 * 1000;

  // All entries — goes through decodeOrRaw so encryption is transparent.
  const allEntries = await getAllEntries();

  // cupsSold: sale entries within the selected range, across all customers.
  const cupsSold = allEntries
    .filter((e) => e.type === 'sale' && e.timestamp >= rangeStart)
    .reduce((sum, e) => sum + e.qty, 0);

  // Live balances — range-independent.
  const customers = await getCustomers();
  const balances = await Promise.all(
    customers.map(async (c) => {
      const bal = await getCustomerBalance(c.id);
      return { name: c.name, cups: bal.cups, balance: bal.cups * (c.price_per_cup || 10) };
    }),
  );

  const totalOwed = balances.reduce((sum, b) => sum + b.balance, 0);

  const topDebtors = balances
    .filter((b) => b.cups > 0)
    .sort((a, b) => b.cups - a.cups)
    .slice(0, 3);

  return { cupsSold, totalOwed, topDebtors };
};

// ─── Encrypted backup / restore ───────────────────────────────────────────────

interface BackupBundle {
  version: 1;
  exportedAt: string;
  stores: {
    customers: Record<string, unknown>;
    entries: Record<string, unknown>;
    settings: Record<string, unknown>;
  };
}

/**
 * Export all store data as an encrypted .ckb blob.
 * Raw (pre-decryption) values are read so that individual encrypted records
 * are preserved verbatim inside the bundle — no double-decrypt/re-encrypt needed.
 * The whole bundle is then wrapped with one AES-GCM layer using the active key.
 * Throws if no PIN is enabled (no active key).
 */
export const exportBackup = async (): Promise<Blob> => {
  const key = getActiveKey();
  if (!key) throw new Error('बैकअप के लिए PIN सुरक्षा सक्रिय होनी चाहिए');

  // Read raw values from each store without decryption.
  const readStoreRaw = async (
    store: ReturnType<typeof localForage.createInstance>,
  ): Promise<Record<string, unknown>> => {
    const keys = await store.keys();
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      out[k] = await store.getItem(k);
    }
    return out;
  };

  const bundle: BackupBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    stores: {
      customers: await readStoreRaw(customerStore),
      entries: await readStoreRaw(entryStore),
      settings: await readStoreRaw(settingsStore),
    },
  };

  // Encrypt the entire bundle with the active key.
  const encrypted = await encryptValue(key, bundle);
  const bytes = new TextEncoder().encode(encrypted);
  return new Blob([bytes], { type: 'application/octet-stream' });
};

/**
 * Import an encrypted .ckb backup file.
 * Decrypts with the active key, validates the bundle, then overwrites all
 * store data. Does NOT reload the page — caller handles UI feedback.
 * Throws with a Hindi message on decryption failure or invalid format.
 */
export const importBackup = async (file: File): Promise<void> => {
  const key = getActiveKey();
  if (!key) throw new Error('पुनर्स्थापना के लिए PIN सुरक्षा सक्रिय होनी चाहिए');

  const text = await file.text();

  let bundle: BackupBundle;
  try {
    bundle = await decryptValue<BackupBundle>(key, text);
  } catch {
    throw new Error('गलत PIN या दूषित फ़ाइल — डेटा नहीं पढ़ा जा सका');
  }

  // Validate structure.
  if (
    bundle?.version !== 1 ||
    typeof bundle.stores?.customers !== 'object' ||
    typeof bundle.stores?.entries !== 'object' ||
    typeof bundle.stores?.settings !== 'object'
  ) {
    throw new Error('अमान्य बैकअप फ़ाइल — संस्करण या संरचना सही नहीं है');
  }

  // Overwrite each store with the backed-up raw values.
  const restoreStore = async (
    store: ReturnType<typeof localForage.createInstance>,
    data: Record<string, unknown>,
  ) => {
    await store.clear();
    for (const [k, v] of Object.entries(data)) {
      await store.setItem(k, v);
    }
  };

  await restoreStore(customerStore, bundle.stores.customers);
  await restoreStore(entryStore, bundle.stores.entries);
  await restoreStore(settingsStore, bundle.stores.settings);
};


