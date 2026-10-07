// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { SALE_STORAGE_KEY } from './sales'

vi.mock('./supabase', () => ({ isSupabaseConfigured: false, remoteSalesSink: null }))

const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const savedSales = () => JSON.parse(localStorage.getItem(SALE_STORAGE_KEY) ?? '[]')

function buildOrder() {
  // Two lattes (170) plus one melt (68) = 238.
  click('Add Ube Cloud Latte, 85 pesos')
  click('Add Ube Cloud Latte, 85 pesos')
  click('Add Pandesal Melt, 68 pesos')
}

function checkout() {
  click('Review order')
  click('Continue to payment')
}

function chooseCash(amount: string) {
  fireEvent.click(screen.getByRole('radio', { name: /Cash/ }))
  fireEvent.change(screen.getByLabelText('Amount received'), { target: { value: amount } })
}

async function completePayment(button: string) {
  click(button)
  await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
  expect(screen.getByRole('heading', { name: 'Salamat, your order is in!' })).toBeTruthy()
}

function expectAmounts(region: HTMLElement, total: string, paid: string, change: string) {
  for (const [label, amount] of [['Order total', total], ['Amount paid', paid], ['Change', change]]) {
    expect(within(region).getByText(label).nextElementSibling?.textContent).toBe(amount)
  }
}

function expectReceipt(paid: string, change: string, method: string) {
  click('View receipt')
  const receipt = screen.getByRole('article', { name: 'Timpla digital receipt' })
  for (const [label, value] of [['Total', '₱238'], ['Amount paid', paid], ['Change', change], ['Payment method', method]]) {
    expect(within(receipt).getByText(label).nextElementSibling?.textContent).toBe(value)
  }
  expect(within(receipt).getByText('Ube Cloud Latte')).toBeTruthy()
  expect(within(receipt).getByText('2 × ₱85')).toBeTruthy()
  expect(within(receipt).getByText('Pandesal Melt')).toBeTruthy()
}

beforeEach(async () => {
  vi.useFakeTimers()
  localStorage.clear()
  render(<App />)
  await act(async () => { await Promise.resolve() })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('checkout flow', () => {
  it('rejects insufficient cash without creating a sale or showing success', async () => {
    buildOrder()
    checkout()
    chooseCash('200')
    click('Pay ₱238')
    await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
    expect(screen.getByRole('alert').textContent).toContain('Insufficient cash')
    expect((screen.getByLabelText('Amount received') as HTMLInputElement).value).toBe('200')
    expect(screen.getByRole('heading', { name: 'How would you like to pay?' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'View receipt' })).toBeNull()
    expect(screen.queryByRole('complementary', { name: 'Payment confirmation details' })).toBeNull()
    expect(savedSales()).toEqual([])
  })

  it.each([
    ['exact cash', '238', '₱238', '₱0', 0],
    ['cash overpayment', '300', '₱300', '₱62', 62],
  ])('confirms %s with correct order total, amount paid, change, and receipt', async (_case, input, paid, change, numericChange) => {
    buildOrder()
    checkout()
    chooseCash(input)
    await completePayment('Pay ₱238')
    expectAmounts(screen.getByRole('complementary', { name: 'Payment confirmation details' }), '₱238', paid, change)
    expect(screen.queryByText('Paid today')).toBeNull()
    expect(savedSales()).toMatchObject([{ total: 238, amountPaid: Number(input), change: numericChange, paymentMethod: 'Cash' }])
    expectReceipt(paid, change, 'Cash')
  })

  it.each([
    ['QR Payment', 'Confirm simulated payment'],
    ['Credit/Debit Card', 'Simulate card payment'],
  ])('completes %s with exact payment and zero change', async (method, button) => {
    buildOrder()
    checkout()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(method) }))
    await completePayment(button)
    const confirmation = screen.getByRole('complementary', { name: 'Payment confirmation details' })
    expectAmounts(confirmation, '₱238', '₱238', '₱0')
    expect(within(confirmation).getByText(method)).toBeTruthy()
    expect(savedSales()).toMatchObject([{ total: 238, amountPaid: 238, change: 0, paymentMethod: method }])
    expectReceipt('₱238', '₱0', method)
  })

  it('preserves products and quantities when returning from payment and review, and allows editing', () => {
    buildOrder()
    checkout()
    chooseCash('300')
    click('Back to order')
    expect(screen.getByText('Total to pay').nextElementSibling?.textContent).toBe('₱238')
    expect(screen.getByLabelText('Ube Cloud Latte quantity').textContent).toContain('2')
    click('Back to menu')
    const order = screen.getByRole('complementary', { name: 'Your current order' })
    expect(within(order).getByText('Subtotal').nextElementSibling?.textContent).toBe('₱238')
    expect(within(order).getByLabelText('Ube Cloud Latte quantity').textContent).toContain('2')
    expect(within(order).getByLabelText('Pandesal Melt quantity').textContent).toContain('1')
    click('Increase Pandesal Melt quantity')
    checkout()
    expect(screen.getByText('Total due').nextElementSibling?.textContent).toBe('₱306')
    click('Edit your order')
    expect(screen.getByLabelText('Pandesal Melt quantity').textContent).toContain('2')
    expect(savedSales()).toEqual([])
  })

  it.each(['success', 'receipt'])('clears the previous transaction when starting again from %s', async (from) => {
    buildOrder()
    checkout()
    chooseCash('300')
    await completePayment('Pay ₱238')
    const reference = savedSales()[0].reference
    if (from === 'receipt') click('View receipt')
    click(from === 'receipt' ? 'New transaction' : 'Start new transaction')
    const dialog = screen.getByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Start new transaction' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByText('Your tray is waiting')).toBeTruthy()
    expect(screen.getByText('Subtotal').nextElementSibling?.textContent).toBe('₱0')
    expect((screen.getByRole('button', { name: 'Review order' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByText(reference)).toBeNull()
    expect(screen.queryByRole('article', { name: 'Timpla digital receipt' })).toBeNull()
    expect(screen.queryByRole('complementary', { name: 'Payment confirmation details' })).toBeNull()
    // Completed records remain saved; only the active transaction is reset.
    expect(savedSales()).toHaveLength(1)
    click('Add Coco Water, 35 pesos')
    checkout()
    expect(screen.getByText('Total due').nextElementSibling?.textContent).toBe('₱35')
    expect((screen.getByRole('button', { name: 'Choose payment' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getAllByRole('radio').every((radio) => radio.getAttribute('aria-checked') === 'false')).toBe(true)
    fireEvent.click(screen.getByRole('radio', { name: /Cash/ }))
    expect((screen.getByLabelText('Amount received') as HTMLInputElement).value).toBe('')
    expect(screen.queryByRole('alert')).toBeNull()
    fireEvent.change(screen.getByLabelText('Amount received'), { target: { value: '35' } })
    await completePayment('Pay ₱35')
    expectAmounts(screen.getByRole('complementary', { name: 'Payment confirmation details' }), '₱35', '₱35', '₱0')
    expect(savedSales()).toHaveLength(2)
    expect(savedSales()[1].reference).not.toBe(reference)
    expect(savedSales()[1].items).toMatchObject([{ productId: 'coco-water', quantity: 1 }])
    expect(savedSales()[1].items).toHaveLength(1)
  })
})
