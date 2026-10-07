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
})
