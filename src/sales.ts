import type { SaleRecord } from './pos'

export const SALE_STORAGE_KEY = 'timpla.sales.v1'

export type SyncStatus = 'local' | 'pending' | 'synced' | 'local-error'
export type StoredSale = SaleRecord & { syncStatus: SyncStatus }

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type RemoteSalesSink = {
  upsert(record: SaleRecord): Promise<void>
}

function isDuplicateReferenceError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
}

export function createSalesStore(storage: StorageLike | null, remote: RemoteSalesSink | null) {
  function list(): StoredSale[] {
    if (!storage) return []
    try {
      const value: unknown = JSON.parse(storage.getItem(SALE_STORAGE_KEY) ?? '[]')
      return Array.isArray(value) ? value as StoredSale[] : []
    } catch {
      return []
    }
  }

  function write(sales: StoredSale[]): boolean {
    if (!storage) return false
    try {
      storage.setItem(SALE_STORAGE_KEY, JSON.stringify(sales))
      return true
    } catch {
      return false
    }
  }

  async function save(record: SaleRecord): Promise<StoredSale> {
    const entry: StoredSale = { ...record, syncStatus: remote ? 'pending' : 'local' }
    const entries = [...list(), entry]
    if (!write(entries)) return { ...entry, syncStatus: 'local-error' }
    if (!remote) return entry

    try {
      await remote.upsert(record)
      const synced = { ...entry, syncStatus: 'synced' as const }
      write(entries.map((sale) => sale.reference === record.reference ? synced : sale))
      return synced
    } catch (error) {
      // A previous request may have reached Postgres even if its response was lost.
      if (isDuplicateReferenceError(error)) {
        const synced = { ...entry, syncStatus: 'synced' as const }
        write(entries.map((sale) => sale.reference === record.reference ? synced : sale))
        return synced
      }
      return entry
    }
  }

  async function retryPending(): Promise<void> {
    if (!remote) return
    const entries = list()
    for (const sale of entries) {
      if (sale.syncStatus !== 'pending') continue
      const { syncStatus: _syncStatus, ...record } = sale
      try {
        await remote.upsert(record)
        sale.syncStatus = 'synced'
      } catch (error) {
        if (isDuplicateReferenceError(error)) {
          sale.syncStatus = 'synced'
          continue
        }
        // Keep the receipt queued locally for the next retry.
      }
    }
    write(entries)
  }

  return { list, save, retryPending }
}
