# Timpla Campus Café Kiosk

A touch-first point-of-sale kiosk for a Filipino campus café. Timpla uses large product cards, a warm merienda-inspired palette, short checkout steps, and a digital receipt.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ and pnpm 10+.

```powershell
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The app works without a Supabase account in **Demo mode**; completed simulated sales are saved in the browser's local storage on that device.

## Verify

```powershell
pnpm test
pnpm build
```

The test suite covers cart totals and quantity boundaries, cash validation and change, unique transaction references, local demo saving, successful cloud saving, and retrying a failed cloud save.

## Kiosk flow

1. Tap a product card to add it; use the plus/minus controls or Remove to edit quantities.
2. Review the order. Back to menu preserves the current cart.
3. Choose Cash, QR Payment, or Credit/Debit Card. Each is a simulation; no real payment is taken.
4. Cash requires a valid amount at least equal to the total. The receipt shows the calculated change. QR and card simulations pay the exact total with no change.
5. View the receipt for the unique reference, date, items, quantities, prices, total, payment method, amount paid, and change.
6. New transaction asks for confirmation before clearing the screen. Completed sales remain saved; the active cart and receipt view reset for the next order.

The fixed sample menu has six original items: Ube Cloud Latte (₱85), Pandesal Melt (₱68), Calamansi Fizz (₱48), Turon Bites (₱42), Tablea Cookie (₱38), and Coco Water (₱35).

## Supabase setup (optional)

1. Create a Supabase project.
2. In the project SQL Editor, run the migration files in timestamp order: first [`20261007000000_create_kiosk_transactions.sql`](supabase/migrations/20261007000000_create_kiosk_transactions.sql), then [`20261007160000_validate_kiosk_receipts.sql`](supabase/migrations/20261007160000_validate_kiosk_receipts.sql). If `kiosk_transactions` already exists from the first migration, run only the second migration.
3. Copy `.env.example` to `.env.local` and set the project URL and publishable key:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

4. Restart `pnpm dev`. The success screen shows whether the sale synced. If the cloud is unavailable, the receipt stays in local storage as pending and the kiosk retries pending records on the next load; a retry button is also shown on the success screen.

The browser only uses a publishable key. The migrations enable row-level security and grant the anonymous kiosk role INSERT access only, through an INSERT policy. The app submits each completed receipt once with a plain insert; it does not read, update, or delete sales. The follow-up migration adds database checks for line-item structure, quantity and price arithmetic, receipt totals, and exact QR/card payment amounts. Run [`supabase/tests/kiosk_receipt_integrity.sql`](supabase/tests/kiosk_receipt_integrity.sql) in the SQL Editor after both migrations to check valid and invalid receipt snapshots; it does not write sales. Applying a migration is separate from pushing a Git branch, so these branch changes do not modify the hosted database by themselves. No customer or card data is collected. This is a practical-exam demonstration, not a production payment system.

## Technology and storage choices

- **UI:** React, TypeScript, Vite, and custom responsive CSS. No external design plugin is required by the running app.
- **Catalog:** A six-item TypeScript catalog, so the demo menu works without network access.
- **Demo storage:** Browser local storage, with a pending-sync status when cloud saving is configured but unavailable.
- **Optional backend:** Supabase Postgres stores completed receipt snapshots in one `kiosk_transactions` row per sale and rejects inconsistent receipt arithmetic at the database boundary.
- **Payments:** Cash validation and change are real application calculations; QR and card processing are simulated only.

## GitHub and group contribution evidence

Shared repository: [markbryandelossantos4/dalogdog-delossantos-paradero](https://github.com/markbryandelossantos4/dalogdog-delossantos-paradero). The repository was empty when this project was prepared for its initial push to `main`. That initial snapshot does not establish the checklist's seven real development stages, member identities, feature branches, contributions, pull-request reviews, instructor access, or final integration evidence. Complete the table from the group's actual work and GitHub records; do not invent members, branches, PRs, reviews, or staged history to meet a count.

| Member ID | Name / GitHub username | Feature branch(es) | Feature / task | Commit(s) | PR / reviewer / status |
|---|---|---|---|---|---|
| M1 |  |  |  |  |  |
| M2 |  |  |  |  |  |
| M3 |  |  |  |  |  |
| M4 |  |  |  |  |  |
| M5 |  |  |  |  |  |
| M6 |  |  |  |  |  |

Record the actual final integration commit, verified clone, repository URL, and instructor access in the group's checklist. Preserve branch and PR evidence after merges.

## AI assistance record

| Prompt / task | AI-generated response | Evaluation | Human review or modification |
|---|---|---|---|
| The user supplied the IT415 practical-exam brief and acceptance checklist and requested the Timpla Campus Kiosk implementation. Follow-up prompts requested Supabase setup, payment loading feedback, and confirmation dialogs. | Generated the React/TypeScript kiosk, cart and payment rules, local-first receipt storage, optional Supabase persistence, setup guidance, payment-processing animation, confirmation dialogs, and automated tests. | Eleven automated tests passed; TypeScript and the Vite production build passed. Browser walkthroughs verified product selection, cart editing, preserved back navigation, cash validation and change, QR/card simulations, receipt details, reset, cloud sync, payment feedback, and cancel/confirm modal behavior. Two simulated receipts were confirmed in Supabase with RLS enabled and no anonymous SELECT policy. | Group members should review and explain the code, add their genuine contributions and review evidence, and record the actual submission commit before submission. |

| The user requested a backend-focused branch with stronger database receipt integrity. | Added a follow-up SQL migration that validates receipt item JSON, quantities, prices, line subtotals, totals, and exact non-cash payment amounts, plus a non-writing SQL validation script. | Added only on `feature/backend-database`; the migration and SQL validation script have not been applied or run against a Supabase database yet. | AI-assisted implementation; a group member should inspect and run the migration and validation script against a development database before merge. |
For future AI-assisted edits, add the prompt, response or code area used, how the group checked it, and any changes made. The group should be able to explain its own submitted code.

## Touchscreen and cash-checkout improvements

Quantity controls use 48px touch targets, and product, order, payment, and receipt details use larger text. Cash checkout includes an on-screen keypad, denomination shortcuts, and live change/shortfall feedback while retaining keyboard entry and validation. On narrow screens, View order scrolls to the cart and hides once the cart is visible. Fullscreen controls are available when supported by the browser.

See [the PR description](docs/PR_DESCRIPTION.md) when opening the feature PR.

AI assistance for this follow-up: the user requested frontend improvements and guidance on branching, committing, pushing, and opening a PR. AI generated the touchscreen/cash UX changes and two additional rule tests. Verification: 13 tests passed, production build passed, and browser checks covered cash shortfall/change/receipt, mobile cart access, reset, and fullscreen. The member should review and explain the implementation and record their actual PR and review evidence.
