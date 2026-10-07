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
