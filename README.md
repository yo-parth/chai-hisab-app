# ☕ चाय खाता — Chai Khata

> **सरल हिसाब किताब** | Simple accounting for chai shop owners

A lightweight, **offline-first Progressive Web App (PWA)** built for chai vendors to effortlessly track customer credit — who has had how many cups, and who still owes payment. No internet required. No sign-up. Just open and use.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Data Storage](#data-storage)
- [PWA & Offline Support](#pwa--offline-support)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Contributing](#contributing)

---

## Overview

**चाय खाता** (Chai Khata) is a mobile-first web application designed specifically for small chai shop owners who extend credit to regular customers. The entire interface is in **Hindi (हिन्दी)**, making it accessible for local vendors. Think of it as a digital version of the classic paper "khata" (ledger book).

Key goals:
- Simple enough to use without any training
- Works completely offline — no server, no database, no login
- Installable on Android/iOS just like a native app (PWA)
- All data lives on the user's device

---

## Features

### 👥 Customer Management
- Add customers with a custom name and per-cup price
- View a searchable list of all customers with their outstanding cup balance
- Delete customers (along with all their entries)

### ☕ Transaction Tracking
- Record chai sales with a single tap — **"चाय जोड़ें"** (Add Chai)
- Mark full payment/settlement — **"भुगतान किया"** (Payment Done)
- View the complete transaction history per customer with timestamps
- Outstanding cup count and total rupee amount shown at a glance

### 📤 Data Export
- Export all customer data as a **CSV file** (comma-separated values)
- CSV headers and content are in Hindi for familiar reading
- Exported file includes: customer name, cup quantity, type (sale/payment), notes, and date

### ⚙️ Settings
- Set a **default price per cup** (₹10 by default) — applied to all new customers
- Override price per customer individually
- Optional **4-digit PIN lock** to prevent unauthorized access to the app
- PIN is stored locally on the device

### 📱 PWA (Progressive Web App)
- Installable on Android and iOS home screens
- Works **100% offline** — no internet needed after the first load
- Portrait-mode optimized for mobile use
- Custom chai-themed app icon and splash screen

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI component framework |
| **TypeScript** | Type-safe JavaScript |
| **Vite 5** | Build tool and dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **shadcn/ui** (Radix UI) | Accessible, pre-built UI components |
| **React Router DOM 6** | Client-side routing |
| **TanStack Query v5** | Async state management |
| **localForage** | Offline-first storage (IndexedDB/localStorage) |
| **vite-plugin-pwa** | PWA manifest + service worker generation |
| **Workbox** | Service worker caching strategies |
| **Lucide React** | Icon library |
| **Sonner** | Toast notifications |
| **date-fns** | Date formatting |
| **Noto Sans Devanagari** | Hindi script font |

---

## Project Structure

```
chai-hisab-main/
├── public/
│   ├── chai-icon-512.png        # App icon (PWA + favicon)
│   └── manifest.webmanifest     # Generated PWA manifest
│
├── src/
│   ├── main.tsx                 # App entry point
│   ├── App.tsx                  # Root component with routing setup
│   ├── index.css                # Global styles & Tailwind directives
│   ├── App.css                  # App-level styles
│   │
│   ├── pages/
│   │   ├── Index.tsx            # Home page — customer list
│   │   ├── CustomerDetail.tsx   # Per-customer ledger & transaction page
│   │   ├── Export.tsx           # CSV export page
│   │   ├── Settings.tsx         # App settings (price, PIN lock)
│   │   └── NotFound.tsx         # 404 fallback page
│   │
│   ├── components/
│   │   ├── CustomerList.tsx     # Renders the list of all customers
│   │   ├── AddCustomerDialog.tsx # Dialog to add a new customer
│   │   ├── BottomNav.tsx        # Bottom navigation bar (Home / Export / Settings)
│   │   └── ui/                  # shadcn/ui components (Button, Card, Input, etc.)
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx       # Hook to detect mobile viewport
│   │   └── use-toast.ts         # Toast notification hook
│   │
│   └── lib/
│       ├── db.ts                # All data access functions (localForage CRUD)
│       └── utils.ts             # Tailwind class merge utility (cn)
│
├── vite.config.ts               # Vite + PWA plugin configuration
├── tailwind.config.ts           # Tailwind theme customization
├── components.json              # shadcn/ui configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
└── index.html                   # HTML shell (lang="hi")
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** (or **bun**, which is used as the lock file manager in this project)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd chai-hisab-main

# 2. Install dependencies
npm install
# or, if using bun:
bun install
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:8080**

### Building for Production

```bash
npm run build
```

The production-ready build is output to the `dist/` folder. This includes the optimized PWA with a generated service worker.

### Preview the Production Build

```bash
npm run preview
```

---

## Usage Guide

### 1. Adding a Customer
- On the home screen, tap the **"+ ग्राहक जोड़ें"** (Add Customer) button
- Enter the customer's name
- Optionally set a custom per-cup price (defaults to the price configured in Settings)
- Tap **"जोड़ें"** (Add)

### 2. Recording a Chai Sale
- Tap on any customer's name from the home list
- On the customer detail page, tap **"चाय जोड़ें"** (Add Chai)
- One cup is recorded immediately with the current timestamp

### 3. Marking a Payment
- On the customer detail page, tap **"भुगतान किया"** (Payment Done)
- This records a settlement entry for all outstanding cups
- The balance resets to **0 cups**

### 4. Viewing Transaction History
- All transactions (sales and payments) are listed on the customer detail page under **"इतिहास"** (History)
- Each entry shows the type, quantity, rupee amount, and date/time in Hindi locale format

### 5. Exporting Data
- Navigate to the **Export** page via the bottom navigation
- Tap the export button to download a `.csv` file
- The file is formatted with Hindi column headers and can be opened in Excel/Sheets

### 6. Configuring Settings
- Navigate to **Settings** via the bottom navigation
- Change the **default price per cup** (applies to new customers)
- Enable a **4-digit PIN** to lock the app

---

## Data Storage

All data is stored **entirely on the user's device** using [localForage](https://localforage.github.io/localForage/), which uses **IndexedDB** as its primary storage backend (falling back to WebSQL/localStorage in older browsers).

There are three separate storage stores under the database name `chai-khata`:

| Store | Contents |
|---|---|
| `customers` | Customer records (`id`, `name`, `price_per_cup`, `created_at`) |
| `entries` | Transaction records (`id`, `customer_id`, `qty`, `type`, `note`, `timestamp`) |
| `settings` | App settings (`default_price`, optional `pin`) |

### Balance Calculation Logic

The outstanding balance for a customer is calculated dynamically:
1. Find the timestamp of the **most recent settlement** entry
2. Sum the `qty` of all **sales entries** that occurred **after** that settlement
3. This gives the current unpaid cup count

This approach means you can settle and re-start a tab without losing historical data.

> ⚠️ **Data is local only.** If the user clears browser data or switches devices, data will be lost. There is no cloud sync or backup mechanism.

---

## PWA & Offline Support

Chai Khata is configured as a full PWA using `vite-plugin-pwa` with Workbox:

- **Service Worker**: Auto-registered and auto-updated on new deployments (`registerType: 'autoUpdate'`)
- **App Shell Caching**: All JS, CSS, HTML, icons, and PNG assets are pre-cached on install
- **Google Fonts Caching**: Noto Sans Devanagari font is cached with a `CacheFirst` strategy (1-year expiry)
- **Manifest**: Configured for standalone display, portrait orientation, with a Hindi app name and a warm brown chai-themed color (`#6B4423`)
- **iOS Support**: Includes `apple-mobile-web-app-capable` and `apple-touch-icon` meta tags

To install on mobile:
- **Android (Chrome)**: Tap the "Add to Home Screen" prompt or use the browser menu
- **iOS (Safari)**: Use Share → "Add to Home Screen"

---

## Configuration

### Vite (`vite.config.ts`)
- Dev server runs on port **8080** and binds to all network interfaces (`::`)
- Path alias `@` maps to `./src` for clean imports
- PWA plugin configuration (see above)

### Tailwind (`tailwind.config.ts`)
- Custom design tokens for the chai theme (warm browns, cream backgrounds)
- Custom utility classes like `gradient-chai` and `shadow-card`
- Dark mode support via `class` strategy
- Tailwind Typography plugin included

### shadcn/ui (`components.json`)
- Component style: `default`
- Import alias: `@/components/ui`

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server on port 8080 |
| `npm run build` | Build for production (output to `dist/`) |
| `npm run build:dev` | Build with development mode flags |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint on all source files |

---

## Contributing

This is a focused utility app. If you'd like to extend it:

1. Fork the repository and create a feature branch
2. Follow the existing TypeScript + React patterns
3. New data operations should be added to `src/lib/db.ts`
4. New UI components should use shadcn/ui primitives from `src/components/ui/`
5. Keep the interface in Hindi to maintain the target audience experience

---

*चाय खाता v1.0 — चाय विक्रेताओं के लिए सरल हिसाब* ☕
