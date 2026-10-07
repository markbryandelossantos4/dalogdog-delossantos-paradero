The kiosk had 25px quantity controls and small transaction text, and cash checkout relied on keyboard entry. This change makes ordering easier on a touchscreen and shows cash change or shortfall before payment.

## Changes

- Enlarge quantity controls to 48px and improve product, payment, cart, and receipt readability.
- Add a numeric cash keypad, delete/clear controls, and PHP100/200/500/1000 shortcuts; retain Exact amount and keyboard entry.
- Preview change or cash still needed while preserving checkout validation.
- Add a mobile cart shortcut that hides when the cart is visible to keep checkout accessible.
- Improve removal feedback, announce cart totals, focus screen headings, and associate cash errors with the input.
- Add fullscreen entry/exit controls with unavailable-browser feedback.
- Document contribution verification and the Git/PR workflow.

## Validation

- `pnpm test`: 13 tests passed, including keypad decimal boundaries and cash-preview cases.
- `pnpm build`: TypeScript and Vite production build passed.
- Browser walkthrough: PHP85 order rejects PHP80, previews PHP15 change for PHP100, and produces the corresponding Cash receipt.
- Verified reset confirmation, fullscreen entry/exit, phone/desktop layout, 48px quantity buttons, and mobile cart access without covering checkout.

## Review notes

Payments remain simulated. Please check physical touchscreen use, tablet layout, receipt print preview, and existing QR/card flows on the group's submission device. Cloud synchronization was not exercised in this change.

AI assisted with implementation and verification. The submitting member should review and explain the changes; member/PR/reviewer evidence must reflect the actual GitHub records.
