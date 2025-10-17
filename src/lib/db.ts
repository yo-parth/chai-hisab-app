import localForage from 'localforage';

// Initialize storage
const customerStore = localForage.createInstance({
  name: 'chai-khata',
  storeName: 'customers'
});

const entryStore = localForage.createInstance({
  name: 'chai-khata',
  storeName: 'entries'
});

const settingsStore = localForage.createInstance({
  name: 'chai-khata',
  storeName: 'settings'
});

// Types
export interface Customer {
  id: string;
  name: string;
  price_per_cup?: number;
  created_at: number;
}

export interface Entry {
  id: string;
  customer_id: string;
  qty: number;
  note?: string;
  type: 'sale' | 'settlement';
  timestamp: number;
}

export interface Settings {
  pin?: string;
  default_price: number;
}

// Customer operations
export const getCustomers = async (): Promise<Customer[]> => {
  const customers: Customer[] = [];
  await customerStore.iterate<Customer, void>((value) => {
    customers.push(value);
  });
  return customers.sort((a, b) => b.created_at - a.created_at);
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
  return await customerStore.getItem<Customer>(id);
};

export const saveCustomer = async (customer: Customer): Promise<void> => {
  await customerStore.setItem(customer.id, customer);
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await customerStore.removeItem(id);
  // Also delete all entries for this customer
  const entries = await getCustomerEntries(id);
  for (const entry of entries) {
    await entryStore.removeItem(entry.id);
  }
};

// Entry operations
export const getCustomerEntries = async (customerId: string): Promise<Entry[]> => {
  const entries: Entry[] = [];
  await entryStore.iterate<Entry, void>((value) => {
    if (value.customer_id === customerId) {
      entries.push(value);
    }
  });
  return entries.sort((a, b) => b.timestamp - a.timestamp);
};

export const saveEntry = async (entry: Entry): Promise<void> => {
  await entryStore.setItem(entry.id, entry);
};

export const getAllEntries = async (): Promise<Entry[]> => {
  const entries: Entry[] = [];
  await entryStore.iterate<Entry, void>((value) => {
    entries.push(value);
  });
  return entries.sort((a, b) => b.timestamp - a.timestamp);
};

// Settings operations
export const getSettings = async (): Promise<Settings> => {
  const settings = await settingsStore.getItem<Settings>('app-settings');
  return settings || { default_price: 10 };
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await settingsStore.setItem('app-settings', settings);
};

// Utility: Calculate customer balance
export const getCustomerBalance = async (customerId: string): Promise<{ cups: number; lastVisit: number }> => {
  const entries = await getCustomerEntries(customerId);
  let cups = 0;
  let lastVisit = 0;

  // Find the most recent settlement
  const lastSettlement = entries.find(e => e.type === 'settlement');
  const lastSettlementTime = lastSettlement ? lastSettlement.timestamp : 0;

  // Sum all sales after the last settlement
  for (const entry of entries) {
    if (entry.type === 'sale' && entry.timestamp > lastSettlementTime) {
      cups += entry.qty;
    }
    if (entry.timestamp > lastVisit) {
      lastVisit = entry.timestamp;
    }
  }

  return { cups, lastVisit };
};

// Export to CSV
export const exportToCSV = async (): Promise<string> => {
  const customers = await getCustomers();
  const allEntries = await getAllEntries();

  let csv = 'ग्राहक का नाम,कप संख्या,प्रकार,टिप्पणी,तारीख\n';

  for (const customer of customers) {
    const entries = allEntries.filter(e => e.customer_id === customer.id);
    for (const entry of entries) {
      const date = new Date(entry.timestamp).toLocaleDateString('hi-IN');
      const type = entry.type === 'sale' ? 'बिक्री' : 'भुगतान';
      csv += `${customer.name},${entry.qty},${type},${entry.note || ''},${date}\n`;
    }
  }

  return csv;
};
