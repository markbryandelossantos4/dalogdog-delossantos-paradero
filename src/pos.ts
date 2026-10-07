export type Product = {
  id: string
  name: string
  description: string
  price: number
  category: 'Drinks' | 'Bakes' | 'Merienda'
  art: string
  color: string
  featured?: boolean
}

export type Cart = Record<string, number>

export type PaymentMethod = 'Cash' | 'QR Payment' | 'Credit/Debit Card'

export type SaleItem = {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export type SaleRecord = {
  reference: string
  issuedAt: string
  paymentMethod: PaymentMethod
  total: number
  amountPaid: number
  change: number
  items: SaleItem[]
}

export const PRODUCTS: Product[] = [
  { id: 'ube-latte', name: 'Ube Cloud Latte', description: 'Espresso, purple yam & oat milk', price: 85, category: 'Drinks', art: '🧋', color: 'lilac', featured: true },
  { id: 'pandesal-melt', name: 'Pandesal Melt', description: 'Toasted rolls, kesong puti & honey', price: 68, category: 'Merienda', art: '🥪', color: 'sunshine' },
  { id: 'calamansi-fizz', name: 'Calamansi Fizz', description: 'Fresh citrus, soda & mint', price: 48, category: 'Drinks', art: '🍋', color: 'citrus' },
  { id: 'turon-bites', name: 'Turon Bites', description: 'Banana, langka & crisp caramel', price: 42, category: 'Merienda', art: '🍌', color: 'peach' },
  { id: 'tablea-cookie', name: 'Tablea Cookie', description: 'Dark cacao with a soft center', price: 38, category: 'Bakes', art: '🍪', color: 'cocoa' },
  { id: 'coco-water', name: 'Coco Water', description: 'Chilled young coconut water', price: 35, category: 'Drinks', art: '🥥', color: 'mint' },
]

export function createCart(): Cart {
  return {}
}

export function adjustQuantity(cart: Cart, productId: string, amount: number): Cart {
  const nextQuantity = Math.max(0, (cart[productId] ?? 0) + Math.trunc(amount))
  const next = { ...cart }
  if (nextQuantity === 0) delete next[productId]
  else next[productId] = nextQuantity
  return next
}

export function calculateTotal(cart: Cart, products: Product[] = PRODUCTS): number {
  const prices = new Map(products.map((product) => [product.id, product.price]))
  return Object.entries(cart).reduce((sum, [id, quantity]) => sum + (prices.get(id) ?? 0) * Math.max(0, quantity), 0)
}

export function validateCash(input: string, total: number): { valid: boolean; amountPaid?: number; change?: number; error?: string } {
  const normalized = input.trim()
  if (!normalized || !/^(?:\d+)(?:\.\d{1,2})?$/.test(normalized)) {
    return { valid: false, error: 'Enter a valid amount in pesos.' }
  }
  const amountPaid = Math.round(Number(normalized) * 100) / 100
  if (!Number.isFinite(amountPaid) || amountPaid < 0) return { valid: false, error: 'Enter a valid amount in pesos.' }
  if (amountPaid < total) return { valid: false, error: `Insufficient cash. Please enter at least ₱${total.toFixed(2)}.` }
  return { valid: true, amountPaid, change: Math.round((amountPaid - total) * 100) / 100 }
}

export function createTransactionReference(date = new Date()): string {
  const year = String(date.getFullYear()).slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const suffix = globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()
  return `TMP-${year}${month}${day}-${suffix}`
}
