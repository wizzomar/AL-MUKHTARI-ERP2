# AL-MUKHTARI ERP

ERP system for **AL-MUKHTARI GENERAL TRADING COMPANY**.

## Technology
- React + TypeScript + Vite
- Supabase PostgreSQL + Auth (RLS protected)
- GitHub source control
- Vercel hosting

## Current project status
- Phase 1 — Requirements & Architecture: completed and approved.
- Phase 2 — Database Design & Security: implemented.
- Phase 3 — Company Setup, Users & Permissions: implemented.
- Phase 4 — Products & Inventory: frontend and database foundations implemented; browser end-to-end testing pending.
- Phase 5 — Purchasing & Suppliers: frontend and database functions implemented; browser end-to-end testing and user approval pending.
- Phase 6 onward: not started.

A phase is not considered approved until its required runtime tests pass and the user approves moving forward.

## Supabase environment
Set these Vercel Production environment variables (and Preview/Development if needed):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

For local development, copy `.env.example` to `.env.local`.

The publishable key is intended for browser use. **Never put a Supabase service-role or secret key in frontend environment variables or source control.** Database access must remain protected by Row Level Security.

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
