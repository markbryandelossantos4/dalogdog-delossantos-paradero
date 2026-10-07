import { useEffect, useRef, useState } from 'react'
import { ProductCard } from './components/ProductCard'
import { ConfirmationDialog } from './components/ConfirmationDialog'
import { PaymentProcessingOverlay } from './components/PaymentProcessingOverlay'
import { money, receiptDate, Receipt } from './components/Receipt'
import {
  adjustQuantity,
  calculateTotal,
  createCart,
  createTransactionReference,
  PRODUCTS,
  validateCash,
  updateCashInput,
  getCashPreview,
  type Cart,
  type PaymentMethod,
  type Product,
  type SaleRecord,
} from './pos'
import { createSalesStore, type SyncStatus } from './sales'
import { isSupabaseConfigured, remoteSalesSink } from './supabase'
import './styles.css'

type Step = 'menu' | 'review' | 'payment' | 'success' | 'receipt'
type Category = 'All' | Product['category']
type ConfirmationIntent = { kind: 'remove-item'; product: Product } | { kind: 'new-transaction' }

const categories: Category[] = ['All', 'Drinks', 'Merienda', 'Bakes']
const paymentOptions: { method: PaymentMethod; icon: string; note: string }[] = [
  { method: 'Cash', icon: '₱', note: 'Pay at the kiosk' },
  { method: 'QR Payment', icon: '▦', note: 'Scan & confirm (demo)' },
  { method: 'Credit/Debit Card', icon: '▰', note: 'Tap or insert (demo)' },
]

function OrderItems({
  cart,
  editable,
  onChange,
  onRemove,
}: {
  cart: Cart
  editable: boolean
  onChange: (id: string, amount: number) => void
  onRemove: (id: string) => void
}) {
  const items = PRODUCTS.filter((product) => cart[product.id])
  if (!items.length) {
    return (
      <div className="empty-order">
        <span className="empty-order-icon" aria-hidden="true">✳</span>
        <strong>Your tray is waiting</strong>
        <p>Tap a favourite to start your order.</p>
      </div>
    )
  }
  return (
    <div className="order-items">
      {items.map((product) => (
        <div className="order-item" key={product.id}>
          <span className={`mini-art art-${product.color}`} aria-hidden="true">{product.art}</span>
          <div className="order-item-main">
            <strong>{product.name}</strong>
            <span>{money(product.price)} each</span>
            {editable && (
              <div className="quantity-control" aria-label={`${product.name} quantity`}>
                <button type="button" onClick={() => onChange(product.id, -1)} aria-label={`Decrease ${product.name} quantity`}>−</button>
                <span aria-live="polite">{cart[product.id]}</span>
                <button type="button" onClick={() => onChange(product.id, 1)} aria-label={`Increase ${product.name} quantity`}>+</button>
              </div>
            )}
          </div>
          <div className="order-item-end">
            <strong>{money(product.price * cart[product.id])}</strong>
            {editable && <button className="remove-item" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name}`}>Remove</button>}
          </div>
        </div>
      ))}
    </div>
  )
}

function StepTracker({ step }: { step: Step }) {
  const currentIndex = step === 'menu' ? 0 : step === 'review' ? 1 : step === 'payment' ? 2 : 3
  const labels = ['Build order', 'Review', 'Payment', 'Receipt']
  return (
    <nav className="step-tracker" aria-label="Order progress">
      {labels.map((label, index) => (
        <div className={`step-track-item ${index < currentIndex ? 'is-complete' : ''} ${index === currentIndex ? 'is-current' : ''}`} key={label}>
          <span className="step-number">{index < currentIndex ? '✓' : `0${index + 1}`}</span>
          <span>{label}</span>
          {index < labels.length - 1 && <span className="step-rule" aria-hidden="true" />}
        </div>
      ))}
    </nav>
  )
}

function App() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [orderVisible, setOrderVisible] = useState(false)
  const [step, setStep] = useState<Step>('menu')
  const [cart, setCart] = useState<Cart>(() => createCart())
  const [category, setCategory] = useState<Category>('All')
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [cashInput, setCashInput] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [sale, setSale] = useState<SaleRecord | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [toast, setToast] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationIntent | null>(null)
  const [store] = useState(() => {
    let storage: Storage | null = null
    try { storage = typeof window === 'undefined' ? null : window.localStorage } catch { storage = null }
    return createSalesStore(storage, remoteSalesSink)
  })

  const total = calculateTotal(cart)
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category
    const matchesSearch = `${product.name} ${product.description}`.toLowerCase().includes(search.trim().toLowerCase())
    return matchesCategory && matchesSearch
  })

  useEffect(() => {
    void store.retryPending().finally(() => {
      setPendingCount(store.list().filter((entry) => entry.syncStatus === 'pending').length)
    })
  }, [store])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  function changeQuantity(id: string, amount: number) {
    setCart((current) => adjustQuantity(current, id, amount))
  }

  function requestItemRemoval(id: string) {
    const product = PRODUCTS.find((entry) => entry.id === id)
    if (product) setConfirmation({ kind: 'remove-item', product })
  }

  function addProduct(product: Product) {
    changeQuantity(product.id, 1)
    setToast(`${product.name} added to your order`)
  }

  async function finishPayment(amountPaid: number, change: number) {
    if (!paymentMethod || total <= 0) return
    const processingStartedAt = Date.now()
    setProcessing(true)
    setPaymentError('')

    const issuedAt = new Date().toISOString()
    const receipt: SaleRecord = {
      reference: createTransactionReference(),
      issuedAt,
      paymentMethod,
      total,
      amountPaid,
      change,
      items: PRODUCTS.filter((product) => cart[product.id]).map((product) => ({
        productId: product.id,
        name: product.name,
        quantity: cart[product.id],
        unitPrice: product.price,
        subtotal: product.price * cart[product.id],
      })),
    }

    const saved = await store.save(receipt)
    const minimumProcessingTime = paymentMethod === 'Credit/Debit Card' ? 2200 : 1450
    const remainingProcessingTime = minimumProcessingTime - (Date.now() - processingStartedAt)
    if (remainingProcessingTime > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, remainingProcessingTime))
    }
    setSale(receipt)
    setSyncStatus(saved.syncStatus)
    setPendingCount(store.list().filter((entry) => entry.syncStatus === 'pending').length)
    setStep('success')
    setProcessing(false)
  }

  async function submitPayment() {
    if (!paymentMethod) {
      setPaymentError('Choose a payment method to continue.')
      return
    }
    if (paymentMethod === 'Cash') {
      const result = validateCash(cashInput, total)
      if (!result.valid) {
        setPaymentError(result.error ?? 'Check the amount and try again.')
        return
      }
      await finishPayment(result.amountPaid!, result.change!)
      return
    }
    await finishPayment(total, 0)
  }

  async function retryCloudSync() {
    await store.retryPending()
    setPendingCount(store.list().filter((entry) => entry.syncStatus === 'pending').length)
    const current = store.list().find((entry) => entry.reference === sale?.reference)
    if (current?.syncStatus) setSyncStatus(current.syncStatus)
  }

  function startNewTransaction() {
    setCart(createCart())
    setCategory('All')
    setSearch('')
    setPaymentMethod(null)
    setCashInput('')
    setPaymentError('')
    setProcessing(false)
    setSale(null)
    setSyncStatus(null)
    setStep('menu')
  }

  function requestNewTransaction() {
    if (itemCount > 0 || sale) {
      setConfirmation({ kind: 'new-transaction' })
      return
    }
    startNewTransaction()
  }

  function confirmPendingAction() {
    if (!confirmation) return
    if (confirmation.kind === 'remove-item') {
      changeQuantity(confirmation.product.id, -(cart[confirmation.product.id] ?? 0))
      setToast(`${confirmation.product.name} removed from your order`)
    } else {
      startNewTransaction()
    }
    setConfirmation(null)
  }

  useEffect(() => { headingRef.current?.focus() }, [step])

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])

  useEffect(() => {
    setOrderVisible(false)
    const panel = document.getElementById('current-order')
    if (!panel || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setOrderVisible(entry.isIntersecting), { threshold: 0.1 })
    observer.observe(panel)
    return () => observer.disconnect()
  }, [step])

  function viewCurrentOrder() {
    const panel = document.getElementById('current-order')
    panel?.focus({ preventScroll: true })
    panel?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch { setToast('Fullscreen is unavailable in this browser. You can continue ordering.') }
  }

  function enterCashKey(key: string) {
    setCashInput((current) => updateCashInput(current, key))
    setPaymentError('')
  }

  const cashPreview = getCashPreview(cashInput, total)
  const subTotal = total
  const currentStepTitle = step === 'menu' ? 'What sounds good?' : step === 'review' ? 'One last look.' : step === 'payment' ? 'Make it yours.' : step === 'success' ? 'All set, salamat!' : 'A little thank-you.'
  const currentStepDescription = step === 'menu' ? 'Fresh from our campus kitchen, made for your break.' : step === 'review' ? 'Check your picks before you choose how to pay.' : step === 'payment' ? 'Choose a way to pay. All methods are safely simulated.' : step === 'success' ? 'Your order is confirmed and ready for pickup.' : 'Here’s the good stuff, all in one place.'

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand-lockup" href="#top" aria-label="Timpla Campus Café home" onClick={(event) => { event.preventDefault(); requestNewTransaction() }}>
          <span className="brand-logo">t<span>.</span></span>
          <span className="brand-name">Timpla<small>Campus Café</small></span>
        </a>
        <div className="header-note"><span className="open-dot" /> A little pause, made better <span className="header-note-sun">✳</span></div>
        <button className="fullscreen-button" onClick={() => void toggleFullscreen()}>{fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</button><div className="pickup-pill"><span aria-hidden="true">⌖</span> Campus pickup</div>
      </header>

      <main id="top" className="main-content">
        <div className="welcome-row">
          <div>
            <p className="eyebrow"><span>ORDER AT YOUR OWN PACE</span><span className="eyebrow-line" /></p>
            <h1 ref={headingRef} tabIndex={-1}>{currentStepTitle}</h1>
            <p className="welcome-copy">{currentStepDescription}</p>
          </div>
          <StepTracker step={step} />
        </div>

        {!isSupabaseConfigured && step !== 'success' && step !== 'receipt' && (
          <div className="demo-ribbon"><span className="demo-spark">✦</span><strong>Demo mode</strong><span>Orders stay on this device. Payments are simulated.</span></div>
        )}
        {pendingCount > 0 && step !== 'success' && step !== 'receipt' && (
          <div className="sync-ribbon">{pendingCount} {pendingCount === 1 ? 'receipt is' : 'receipts are'} waiting to sync when the connection returns.</div>
        )}

        {step === 'menu' && (
          <div className="menu-layout">
            <section className="menu-section" aria-label="Menu">
              <div className="menu-toolbar">
                <div className="category-tabs" role="tablist" aria-label="Menu category">
                  {categories.map((tab) => (
                    <button key={tab} role="tab" aria-selected={category === tab} className={category === tab ? 'category-tab active' : 'category-tab'} onClick={() => setCategory(tab)}>{tab}</button>
                  ))}
                </div>
                <label className="search-box"><span aria-hidden="true">⌕</span><span className="sr-only">Search the menu</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a favourite" /></label>
              </div>
              <div className="product-grid">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} quantity={cart[product.id] ?? 0} onAdd={addProduct} />)}
              </div>
              {filteredProducts.length === 0 && <div className="no-results">No merienda by that name. Try another search.</div>}
              {!orderVisible && <button className="mobile-cart-button" onClick={viewCurrentOrder}>View order · {itemCount} {itemCount === 1 ? 'item' : 'items'} · {money(total)}</button>}<div className="menu-note"><span>✳</span> Small-batch sips &amp; snacks, made with a little extra love.</div>
            </section>

            <aside id="current-order" tabIndex={-1} className="order-panel" aria-label="Your current order">
              <div className="order-panel-header"><div><p className="panel-overline">YOUR TRAY</p><h2>Your order <span className="item-count">{itemCount}</span></h2></div><span className="tray-mark" aria-hidden="true">✳</span></div>
              <OrderItems cart={cart} editable onChange={changeQuantity} onRemove={requestItemRemoval} />
              <div className="order-panel-footer">
                <div className="subtotal-row"><span>Subtotal</span><strong aria-live="polite">{money(subTotal)}</strong></div>
                <div className="pickup-note"><span className="pickup-note-icon">⌖</span><span>Ready for pickup at<br /><strong>Timpla Campus Café</strong></span></div>
                <button className="button button-primary button-wide" disabled={itemCount === 0} onClick={() => setStep('review')}>Review order <span aria-hidden="true">→</span></button>
                <p className="tax-note">Prices are in Philippine pesos · No hidden fees</p>
              </div>
            </aside>
          </div>
        )}

        {step === 'review' && (
          <section className="flow-card review-card">
            <div className="flow-card-heading"><div><p className="panel-overline">ORDER SUMMARY</p><h2>Looking good.</h2><p>Your merienda break, just the way you like it.</p></div><span className="review-illustration" aria-hidden="true">☕</span></div>
            <OrderItems cart={cart} editable onChange={changeQuantity} onRemove={requestItemRemoval} />
            <div className="summary-total"><span>Total to pay</span><strong>{money(total)}</strong></div>
            <div className="flow-actions"><button className="button button-secondary" onClick={() => setStep('menu')}><span aria-hidden="true">←</span> Back to menu</button><button className="button button-primary" disabled={itemCount === 0} onClick={() => { setPaymentMethod(null); setPaymentError(''); setStep('payment') }}>Continue to payment <span aria-hidden="true">→</span></button></div>
          </section>
        )}

        {step === 'payment' && (
          <section className="payment-layout">
            <div className="flow-card payment-card">
              <div className="flow-card-heading payment-heading"><div><p className="panel-overline">PAYMENT METHOD</p><h2>How would you like to pay?</h2><p>Choose one option to finish your order.</p></div><span className="payment-flower" aria-hidden="true">✿</span></div>
              <div className="payment-options" role="radiogroup" aria-label="Payment method">
                {paymentOptions.map((option) => (
                  <button key={option.method} role="radio" aria-checked={paymentMethod === option.method} className={`payment-option ${paymentMethod === option.method ? 'selected' : ''}`} onClick={() => { setPaymentMethod(option.method); setPaymentError(''); setCashInput('') }}>
                    <span className={`payment-icon payment-icon-${option.method === 'Cash' ? 'cash' : option.method === 'QR Payment' ? 'qr' : 'card'}`} aria-hidden="true">{option.icon}</span>
                    <span className="payment-option-copy"><strong>{option.method}</strong><small>{option.note}</small></span>
                    <span className="radio-dot" aria-hidden="true" />
                  </button>
                ))}
              </div>

              {paymentMethod === 'Cash' && (
                <div className="payment-detail cash-detail">
                  <label htmlFor="cash-amount">Amount received</label>
                  <div className="cash-input-wrap"><span>₱</span><input id="cash-amount" aria-invalid={Boolean(paymentError)} aria-describedby={paymentError ? "cash-error cash-preview" : "cash-preview"} inputMode="decimal" autoComplete="off" placeholder="0" value={cashInput} onChange={(event) => { setCashInput(event.target.value); setPaymentError('') }} /></div>
                  <div className="cash-helper"><span>Total due <strong>{money(total)}</strong></span><button onClick={() => { setCashInput(String(total)); setPaymentError('') }}>Exact amount</button></div>
                  <div className="cash-shortcuts" aria-label="Cash amount shortcuts">
                    {[100, 200, 500, 1000].map((amount) => <button key={amount} type="button" onClick={() => { setCashInput(String(amount)); setPaymentError('') }}>{money(amount)}</button>)}
                  </div>
                  <p id="cash-preview" className={`cash-preview ${cashPreview.kind}`} role="status">{cashPreview.kind === 'empty' ? 'Enter the cash amount using the keypad or keyboard.' : cashPreview.kind === 'invalid' ? 'Enter a valid amount with up to two decimal places.' : cashPreview.kind === 'shortfall' ? `Still needed: ${money(cashPreview.amount)}` : `Change: ${money(cashPreview.amount)}`}</p>
                  <div className="cash-keypad" aria-label="Cash numeric keypad">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'Backspace'].map((key) => <button type="button" key={key} aria-label={key === 'Backspace' ? 'Delete last digit' : key === '.' ? 'Decimal point' : key} onClick={() => enterCashKey(key)}>{key === 'Backspace' ? '⌫' : key}</button>)}
                    <button className="keypad-clear" type="button" onClick={() => enterCashKey('Clear')}>Clear amount</button>
                  </div>
                  {paymentError && <p id="cash-error" className="form-error" role="alert">{paymentError}</p>}
                </div>
              )}

              {paymentMethod === 'QR Payment' && (
                <div className="payment-detail qr-detail">
                  <div className="qr-art" aria-label="Demonstration QR placeholder, not connected to a payment provider">
                    <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
                      <rect width="100" height="100" rx="4" fill="#fffdf8" />
                      <path d="M8 8h28v28H8zM64 8h28v28H64zM8 64h28v28H8z" fill="#214a3d" />
                      <path d="M14 14h16v16H14zM70 14h16v16H70zM14 70h16v16H14z" fill="#fffdf8" />
                      <path d="M19 19h6v6h-6zM75 19h6v6h-6zM19 75h6v6h-6zM43 9h7v7h-7zM51 22h8v8h-8zM41 34h8v8h-8zM59 39h7v7h-7zM39 51h7v7h-7zM50 49h8v8h-8zM67 50h9v9h-9zM39 65h7v7h-7zM49 65h6v6h-6zM61 68h8v8h-8zM43 79h8v8h-8zM54 82h6v6h-6zM76 65h8v8h-8zM83 78h8v8h-8z" fill="#214a3d" />
                    </svg>
                    <span>DEMO QR</span>
                  </div>
                  <div><strong>Scan to imagine paying</strong><p>This is a visual placeholder only. No wallet or payment app is connected.</p><span className="secure-caption"><span>✓</span> Simulated checkout · no payment is taken</span></div>
                </div>
              )}

              {paymentMethod === 'Credit/Debit Card' && (
                <div className="payment-detail card-detail"><div className="card-chip-icon" aria-hidden="true">▰</div><div><strong>Tap, insert, or swipe your card</strong><p>Card payment is simulated for this practical exam. No card number or personal details will be requested.</p></div></div>
              )}

              {paymentError && paymentMethod !== 'Cash' && <p className="form-error payment-error" role="alert">{paymentError}</p>}
              <div className="flow-actions payment-actions"><button className="button button-secondary" disabled={processing} onClick={() => setStep('review')}><span aria-hidden="true">←</span> Back to order</button><button className="button button-primary" disabled={processing || !paymentMethod} onClick={() => void submitPayment()}>{processing ? <><span className="button-spinner" /> Processing…</> : paymentMethod === 'Cash' ? `Pay ${money(total)}` : paymentMethod === 'QR Payment' ? 'Confirm simulated payment' : paymentMethod === 'Credit/Debit Card' ? 'Start simulation' : 'Choose payment'} <span aria-hidden="true">→</span></button></div>
              <p className="simulation-note"><span>ⓘ</span> This kiosk demonstrates a checkout flow; it never processes real payments.</p>
            </div>
            <aside className="payment-order-card"><p className="panel-overline">YOUR ORDER</p><h3>{itemCount} {itemCount === 1 ? 'item' : 'items'} for a good break</h3><div className="compact-items">{PRODUCTS.filter((product) => cart[product.id]).map((product) => <div key={product.id}><span>{product.name} <small>× {cart[product.id]}</small></span><strong>{money(product.price * cart[product.id])}</strong></div>)}</div><div className="payment-total"><span>Total due</span><strong>{money(total)}</strong></div><button className="text-button" onClick={() => setStep('menu')}>Edit your order <span aria-hidden="true">↗</span></button></aside>
          </section>
        )}

        {step === 'success' && sale && (
          <section className="success-layout">
            <div className="success-card flow-card">
              <span className="success-check" aria-hidden="true"><span>✓</span></span>
              <p className="panel-overline">PAYMENT SUCCESSFUL</p>
              <h2>Salamat, your order is in!</h2>
              <p className="success-copy">Your Timpla favourites are getting ready. Head to the café counter when you’re ready to pick up.</p>
              <div className="success-reference"><span>TRANSACTION REFERENCE</span><strong>{sale.reference}</strong><small>{receiptDate(sale.issuedAt)}</small></div>
              <div className={`saved-status status-${syncStatus}`}>{syncStatus === 'synced' ? <><span>✓</span> Saved to Timpla records</> : syncStatus === 'pending' ? <><span>↻</span> Receipt saved here · cloud sync pending</> : syncStatus === 'local-error' ? <><span>!</span> Receipt is shown here but device storage was unavailable</> : <><span>✓</span> Demo receipt saved on this device</>}</div>
              {syncStatus === 'pending' && <button className="sync-retry" onClick={() => void retryCloudSync()}>Try cloud sync again</button>}
              <div className="success-actions"><button className="button button-primary button-wide" onClick={() => setStep('receipt')}>View receipt <span aria-hidden="true">→</span></button><button className="button button-secondary button-wide" onClick={requestNewTransaction}>Start new transaction <span aria-hidden="true">↺</span></button></div>
            </div>
            <aside className="success-total-card" aria-label="Payment confirmation details">
              <span className="success-total-flower" aria-hidden="true">✿</span>
              <p className="panel-overline">YOU’RE ALL SET</p>
              <span className="success-total-label">Order total</span>
              <strong className="success-total-amount">{money(sale.total)}</strong>
              <span className="success-total-label">Amount paid</span>
              <strong className="success-method">{money(sale.amountPaid)}</strong>
              <span className="success-total-label">Change</span>
              <strong className="success-method">{money(sale.change)}</strong>
              <div className="success-total-rule" />
              <span className="success-method-label">Paid with</span>
              <strong className="success-method">{sale.paymentMethod}</strong>
              <p>Thanks for making us part of your campus day.</p>
            </aside>
          </section>
        )}

        {step === 'receipt' && sale && (
          <section className="receipt-screen">
            <div className="receipt-screen-copy"><p className="panel-overline">A LITTLE THANK-YOU</p><h2>Keep this for your records.</h2><p>Your digital receipt is ready. You can print it or simply show it at pickup.</p><div className="receipt-screen-actions"><button className="button button-secondary" onClick={() => window.print()}>Print receipt <span aria-hidden="true">⎙</span></button><button className="button button-primary" onClick={requestNewTransaction}>New transaction <span aria-hidden="true">↺</span></button></div></div>
            <Receipt sale={sale} />
          </section>
        )}
      </main>

      <footer className="site-footer"><span>Made with <span className="footer-heart">♥</span> for campus breaks</span><span>TIMPLA CAMPUS CAFÉ <i>·</i> IT415 PRACTICAL</span></footer>
      {confirmation && (
        <ConfirmationDialog
          title={confirmation.kind === 'remove-item' ? `Remove ${confirmation.product.name}?` : 'Start a new transaction?'}
          message={confirmation.kind === 'remove-item'
            ? `This removes ${cart[confirmation.product.id] ?? 0} ${cart[confirmation.product.id] === 1 ? 'unit' : 'units'} of ${confirmation.product.name} from your order.`
            : sale
              ? 'This clears the receipt from this screen and starts a new order. Your completed sale remains saved.'
              : 'This clears your current order and starts over at the menu.'}
          cancelLabel={confirmation.kind === 'remove-item' ? 'Keep item' : 'Keep this order'}
          confirmLabel={confirmation.kind === 'remove-item' ? 'Remove item' : 'Start new transaction'}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirmPendingAction}
        />
      )}
      {processing && paymentMethod && <PaymentProcessingOverlay method={paymentMethod} total={total} />}
      {toast && <div className="toast-message" role="status"><span>✓</span>{toast}</div>}
    </div>
  )
}

export default App
