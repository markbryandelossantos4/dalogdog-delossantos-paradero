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

function CardTapArtwork() {
  return (
    <div className="card-tap-scene" aria-hidden="true">
      <div className="card-reader">
        <div className="card-reader-screen"><span className="reader-brand">t.</span><span className="reader-ready">READY</span></div>
        <div className="reader-contactless"><i /><i /><i /></div>
        <div className="reader-keypad"><i /><i /><i /><i /><i /><i /></div>
        <div className="reader-base" />
      </div>
      <div className="tap-signal tap-signal-one" />
      <div className="tap-signal tap-signal-two" />
      <div className="tap-card">
        <span className="tap-card-chip" />
        <span className="tap-card-waves">)))</span>
        <span className="tap-card-brand">t.</span>
        <span className="tap-card-label">TIMPLA DEMO</span>
      </div>
      <span className="tap-spark tap-spark-one">✦</span>
      <span className="tap-spark tap-spark-two">✳</span>
    </div>
  )
}

export function PaymentProcessingOverlay({ method, total }: Props) {
  const isCardPayment = method === 'Credit/Debit Card'

  return (
    <div className="payment-processing-backdrop" role="status" aria-live="polite" aria-atomic="true">
      <div className={'payment-processing-card ' + (isCardPayment ? 'payment-processing-card-tap' : '')}>
        {isCardPayment ? <CardTapArtwork /> : (
          <div className="processing-art" aria-hidden="true">
            <span className="processing-orbit" />
            <span className="processing-orbit-dot" />
            <span className="processing-steam processing-steam-one" />
            <span className="processing-steam processing-steam-two" />
            <span className="processing-steam processing-steam-three" />
            <span className="processing-cup">☕</span>
            <span className="processing-spark">✳</span>
          </div>
        )}
        <p className="processing-eyebrow">{isCardPayment ? 'CONTACTLESS DEMO' : 'JUST A MOMENT'}</p>
        <h2>{isCardPayment ? 'Tap your card' : 'Confirming your ' + paymentLabel(method)}</h2>
        <p className="processing-copy">
          {isCardPayment
            ? <>Hold your card near the reader to simulate paying <strong>{money(total)}</strong>.</>
            : <>Preparing your Timpla receipt for <strong>{money(total)}</strong>.</>}
        </p>
        <div className={'processing-progress ' + (isCardPayment ? 'card-tap-progress' : '')} aria-hidden="true"><span /></div>
        <p className="processing-safe-note"><span aria-hidden="true">✓</span> {isCardPayment ? 'Simulation only · no card data or payment is collected' : 'Demo only · no real payment will be taken'}</p>
      </div>
    </div>
  )
}
