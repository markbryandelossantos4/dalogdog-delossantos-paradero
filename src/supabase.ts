import { createClient } from '@supabase/supabase-js'
import type { SaleRecord } from './pos'
import type { RemoteSalesSink } from './sales'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && publishableKey)
const client = isSupabaseConfigured ? createClient(url, publishableKey) : null

export const remoteSalesSink: RemoteSalesSink | null = client
  ? {
      async upsert(sale: SaleRecord) {
        const { error } = await client.from('kiosk_transactions').insert({
          reference: sale.reference,
          issued_at: sale.issuedAt,
          payment_method: sale.paymentMethod,
          total: sale.total,
          amount_paid: sale.amountPaid,
          change_due: sale.change,
          items: sale.items,
        })
        if (error) throw error
      },
    }
  : null
