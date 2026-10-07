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
2. In the project SQL Editor, run [`supabase/migrations/20261007000000_create_kiosk_transactions.sql`](supabase/migrations/20261007000000_create_kiosk_transactions.sql).
3. Copy `.env.example` to `.env.local` and set the project URL and publishable key:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

4. Restart `pnpm dev`. The success screen shows whether the sale synced. If the cloud is unavailable, the receipt stays in local storage as pending and the kiosk retries pending records on the next load; a retry button is also shown on the success screen.

The browser only uses a publishable key. The migration enables row-level security and grants the anonymous kiosk role INSERT access only, through an INSERT policy. The app submits each completed receipt once with a plain insert; it does not read, update, or delete sales. No customer or card data is collected. This is a practical-exam demonstration, not a production payment system.

## Technology and storage choices

- **UI:** React, TypeScript, Vite, and custom responsive CSS. No external design plugin is required by the running app.
- **Catalog:** A six-item TypeScript catalog, so the demo menu works without network access.
- **Demo storage:** Browser local storage, with a pending-sync status when cloud saving is configured but unavailable.
- **Optional backend:** Supabase Postgres stores completed receipt snapshots in one `kiosk_transactions` row per sale.
- **Payments:** Cash validation and change are real application calculations; QR and card processing are simulated only.

## GitHub and group contribution evidence

Shared repository: [markbryandelossantos4/dalogdog-delossantos-paradero](https://github.com/markbryandelossantos4/dalogdog-delossantos-paradero). The repository was empty when this project was prepared for its initial push to `main`. That initial snapshot does not establish the checklist's seven real development stages, member identities, feature branches, contributions, pull-request reviews, instructor access, or final integration evidence. Complete the table from the group's actual work and GitHub records; do not invent members, branches, PRs, reviews, or staged history to meet a count.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the member branch/PR workflow and an evidence register aligned with the acceptance checklist. The register is intentionally incomplete until members perform and verify their own work.

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
| The user supplied the IT415 practical-exam brief and acceptance checklist and requested the Timpla Campus Kiosk implementation. Follow-up prompts requested Supabase setup, payment loading feedback, confirmation dialogs, and help preparing authentic group branch/PR evidence. | Generated the React/TypeScript kiosk, cart and payment rules, local-first receipt storage, optional Supabase persistence, setup guidance, payment-processing animation, confirmation dialogs, automated tests, and a checklist-aligned `CONTRIBUTING.md` workflow/register. | Eleven automated tests passed for the application; TypeScript and the Vite production build passed. Browser walkthroughs covered kiosk flows. The contribution guide was checked against the supplied acceptance checklist and `git diff --check`; it does not claim that members have completed or been verified for any work. | Group members should review the guide and application, correct details as needed, perform their own feature work, and enter authentic branch/commit/PR/review evidence. Each member should be able to explain and demonstrate their code. |

For future AI-assisted edits, add the prompt, response or code area used, how the group checked it, and any changes made. The group should be able to explain its own submitted code.
