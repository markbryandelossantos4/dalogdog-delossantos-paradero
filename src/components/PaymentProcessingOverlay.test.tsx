import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PaymentProcessingOverlay } from './PaymentProcessingOverlay'

describe('payment processing overlay', () => {
  it('announces the selected simulated method and keeps the no-payment notice visible', () => {
    const html = renderToStaticMarkup(
      <PaymentProcessingOverlay method="QR Payment" total={153} />,
    )

    expect(html).toContain('role="status"')
    expect(html).toContain('Confirming your QR payment')
    expect(html).toContain('₱153')
    expect(html).toContain('no real payment will be taken')
  })

  it('shows a contactless card tap animation for simulated card payments', () => {
    const html = renderToStaticMarkup(
      <PaymentProcessingOverlay method="Credit/Debit Card" total={238} />,
    )

    expect(html).toContain('card-tap-scene')
    expect(html).toContain('Tap your card')
    expect(html).toContain('Hold your card near the reader')
    expect(html).toContain('no card data or payment is collected')
    expect(html).toContain('₱238')
  })
})
