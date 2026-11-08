# AL-MUKHTARI ERP

ERP system for **AL-MUKHTARI GENERAL TRADING COMPANY**.

## Technology
- React 18 + TypeScript + Vite
- Supabase PostgreSQL + Auth (RLS protected)
- GitHub source control
- Vercel hosting (deployment is a later project phase)

## Current phase
**Phase 4 — Products & Inventory** is in progress.

Implemented in the current frontend:
- Email/password sign-in through Supabase Auth
- Profile and active-account check
- Product registration and product listing
- Category and base-unit selection
- USD cost, wholesale and retail prices
- Barcode on the base unit
- Alternate unit conversion setup
- Inventory balances and stock movement entry through the database RPC
- Low-stock indicators and recent movement list
- Somali-first responsive dashboard

## Supabase environment
Copy `.env.example` to `.env.local` for local development, then set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The publishable key is intended for browser use. **Never put a Supabase service-role or secret key in frontend environment variables.**

## Company configuration
- Country: Somalia
- Time zone: Africa/Mogadishu
- Primary currency: USD
- Future currency: SOS (inactive until enabled)
- VAT: 5%
- Branch: Bariire Branch
- Warehouse: Main Warehouse

No sample products, stock, sales, or supplier transactions are seeded.

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Remaining before Phase 4 sign-off
- Add edit/archive product workflows and full alternate-unit listing/editing
- Test sign-in and role permissions in a real browser session
- Verify product and stock workflows end-to-end against the connected Supabase project
- Resolve the Supabase Auth leaked-password-protection warning before production
- Run CI build and review the build result
