import { describe, expect, it } from 'vitest'

const loadPos = async () => (await import('./pos')) as Record<string, any>

describe('Timpla order rules', () => {
  it('provides the catalog and cart operations needed by the kiosk', async () => {
    const pos = await loadPos()
    for (const name of ['PRODUCTS', 'createCart', 'adjustQuantity', 'calculateTotal', 'validateCash', 'createTransactionReference']) {
      expect(pos[name], `${name} should be exported`).toBeDefined()
    }
  })

  it('adds products, clamps decreases at zero, and calculates subtotals and the total', async () => {
    const pos = await loadPos()
    const coffee = pos.PRODUCTS[0]
    let cart = pos.createCart()
    cart = pos.adjustQuantity(cart, coffee.id, 2)
    expect(cart[coffee.id]).toBe(2)
    expect(pos.calculateTotal(cart, pos.PRODUCTS)).toBe(coffee.price * 2)
    cart = pos.adjustQuantity(cart, coffee.id, -3)
    expect(cart[coffee.id] ?? 0).toBe(0)
    expect(pos.calculateTotal(cart, pos.PRODUCTS)).toBe(0)
  })

  it('rejects blank, malformed, negative, and insufficient cash while allowing exact and overpayment', async () => {
    const pos = await loadPos()
    expect(pos.validateCash('', 140).valid).toBe(false)
    expect(pos.validateCash('abc', 140).valid).toBe(false)
    expect(pos.validateCash('-1', 140).valid).toBe(false)
    expect(pos.validateCash('100', 140).valid).toBe(false)
    expect(pos.validateCash('140', 140)).toMatchObject({ valid: true, amountPaid: 140, change: 0 })
    expect(pos.validateCash('200', 140)).toMatchObject({ valid: true, amountPaid: 200, change: 60 })
  })

  it('creates distinct transaction references with the Timpla prefix', async () => {
    const pos = await loadPos()
    const first = pos.createTransactionReference(new Date('2026-10-07T09:00:00Z'))
    const second = pos.createTransactionReference(new Date('2026-10-07T09:00:00Z'))
    expect(first).toMatch(/^TMP-261007-/)
    expect(second).not.toBe(first)
  })
})

describe('cash touchscreen entry', () => {
  it('handles decimal entry, deletion, clearing and excess decimal digits', async () => {
    const { updateCashInput } = await import('./pos')
    expect(updateCashInput('', '.')).toBe('0.')
    expect(updateCashInput('85.1', '5')).toBe('85.15')
    expect(updateCashInput('85.15', '9')).toBe('85.15')
    expect(updateCashInput('85.', '.')).toBe('85.')
    expect(updateCashInput('85', 'Backspace')).toBe('8')
    expect(updateCashInput('85', 'Clear')).toBe('')
  })
  it('previews shortfall, exact payment and change without accepting malformed amounts', async () => {
    const { getCashPreview } = await import('./pos')
    expect(getCashPreview('80', 85)).toEqual({ kind: 'shortfall', amount: 5 })
    expect(getCashPreview('85', 85)).toEqual({ kind: 'change', amount: 0 })
    expect(getCashPreview('100', 85)).toEqual({ kind: 'change', amount: 15 })
    expect(getCashPreview('100.50', 85.25)).toEqual({ kind: 'change', amount: 15.25 })
    expect(getCashPreview('abc', 85).kind).toBe('invalid')
    expect(getCashPreview('', 85).kind).toBe('empty')
  })
})
