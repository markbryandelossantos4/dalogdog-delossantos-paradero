import type { SaleRecord } from '../pos'

export const money = (amount: number) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  maximumFractionDigits: 2,
}).format(amount)

export const receiptDate = (isoDate: string) => new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(isoDate))

type ReceiptProps = { sale: SaleRecord }

export function Receipt({ sale }: ReceiptProps) {
  return (
    <article className="receipt-paper" aria-label="Timpla digital receipt">
      <div className="receipt-top">
        <div className="receipt-brand-mark">t.</div>
        <p className="receipt-brand">Timpla <span>Campus Café</span></p>
        <p className="receipt-thanks">GOOD MERIENDA, GOOD DAY.</p>
      </div>
      <div className="receipt-meta">
        <span>Transaction</span><strong>{sale.reference}</strong>
        <span>Date &amp; time</span><strong>{receiptDate(sale.issuedAt)}</strong>
      </div>
      <div className="receipt-lines">
        {sale.items.map((item) => (
          <div className="receipt-line" key={item.productId}>
            <div><strong>{item.name}</strong><span>{item.quantity} × {money(item.unitPrice)}</span></div>
            <strong>{money(item.subtotal)}</strong>
          </div>
        ))}
      </div>
      <div className="receipt-total"><span>Total</span><strong>{money(sale.total)}</strong></div>
      <div className="receipt-payment">
        <div><span>Payment method</span><strong>{sale.paymentMethod}</strong></div>
        <div><span>Amount paid</span><strong>{money(sale.amountPaid)}</strong></div>
        <div><span>Change</span><strong>{money(sale.change)}</strong></div>
      </div>
      <div className="receipt-foot"><span className="receipt-check">✓</span><span>Payment successful<br /><small>Salamat — see you again soon!</small></span></div>
    </article>
  )
}
