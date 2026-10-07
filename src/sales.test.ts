import { describe, expect, it } from 'vitest'

const loadSales = async () => (await import('./sales')) as Record<string, any>

const sale = {
  reference: 'TMP-261007-A1B2C3D4',
  issuedAt: '2026-10-07T09:00:00.000Z',
  paymentMethod: 'Cash',
  total: 140,
  amountPaid: 200,
  change: 60,
  items: [{ productId: 'ube-latte', name: 'Ube Cloud Latte', quantity: 1, unitPrice: 140, subtotal: 140 }],
}

class MemoryStorage {
  private data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

describe('local-first completed sales', () => {
  it('provides a sales store factory', async () => {
    const mod = await loadSales()
    expect(mod.createSalesStore).toBeTypeOf('function')
  })

  it('keeps demo sales on the device when no cloud sink is configured', async () => {
    const { createSalesStore } = await loadSales()
    const storage = new MemoryStorage()
    const store = createSalesStore(storage, null)
    const saved = await store.save(sale)
    expect(saved.syncStatus).toBe('local')
    expect(store.list()).toMatchObject([{ reference: sale.reference, total: 140, syncStatus: 'local' }])
  })

  it('marks a sale synced after the cloud save succeeds', async () => {
    const { createSalesStore } = await loadSales()
    let savedReference = ''
    const remote = { async upsert(record: typeof sale) { savedReference = record.reference } }
    const store = createSalesStore(new MemoryStorage(), remote)
    const saved = await store.save(sale)
    expect(savedReference).toBe(sale.reference)
    expect(saved.syncStatus).toBe('synced')
  })

  it('retains cloud failures locally and retries pending sales', async () => {
    const { createSalesStore } = await loadSales()
    const storage = new MemoryStorage()
    let shouldFail = true
    const remote = { async upsert() { if (shouldFail) throw new Error('offline') } }
    const store = createSalesStore(storage, remote)
    const queued = await store.save(sale)
    expect(queued.syncStatus).toBe('pending')
    shouldFail = false
    await store.retryPending()
    expect(store.list()).toMatchObject([{ reference: sale.reference, syncStatus: 'synced' }])
  })

  it('reconciles a retry when the transaction was already inserted after a lost response', async () => {
    const { createSalesStore } = await loadSales()
    const storage = new MemoryStorage()
    let calls = 0
    const remote = {
      async upsert() {
        calls += 1
        if (calls === 1) throw new Error('response lost after server insert')
        throw { code: '23505' }
      },
    }
    const store = createSalesStore(storage, remote)
    expect((await store.save(sale)).syncStatus).toBe('pending')
    await store.retryPending()
    expect(store.list()).toMatchObject([{ reference: sale.reference, syncStatus: 'synced' }])
  })
})
