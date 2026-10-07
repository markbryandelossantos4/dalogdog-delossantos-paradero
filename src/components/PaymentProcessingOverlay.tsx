import type { PaymentMethod } from '../pos'
import { money } from './Receipt'

type Props = {
  method: PaymentMethod
  total: number
}

function paymentLabel(method: PaymentMethod) {
  if (method === 'QR Payment') return 'QR payment'
  if (method === 'Credit/Debit Card') return 'card payment'
  return 'cash payment'
}

export function PaymentProcessingOverlay({ method, total }: Props) {
  return (
    <div className="payment-processing-backdrop" role="status" aria-live="polite" aria-atomic="true">
      <div className="payment-processing-card">
        <div className="processing-art" aria-hidden="true">
          <span className="processing-orbit" />
          <span className="processing-orbit-dot" />
          <span className="processing-steam processing-steam-one" />
          <span className="processing-steam processing-steam-two" />
          <span className="processing-steam processing-steam-three" />
          <span className="processing-cup">☕</span>
          <span className="processing-spark">✳</span>
        </div>
        <p className="processing-eyebrow">JUST A MOMENT</p>
        <h2>Confirming your {paymentLabel(method)}</h2>
        <p className="processing-copy">Preparing your Timpla receipt for <strong>{money(total)}</strong>.</p>
        <div className="processing-progress" aria-hidden="true"><span /></div>
        <p className="processing-safe-note"><span aria-hidden="true">✓</span> Demo only · no real payment will be taken</p>
      </div>
    </div>
  )
}
