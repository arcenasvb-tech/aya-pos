// src/app/(dashboard)/pos/void-order/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { XCircle, Search, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
  id: string
  order_number: number
  customer_name?: string
  payment_method: string
  total: number
  status: string
  created_at: string
  staff: { full_name: string }
  items: Array<{
    quantity: number
    product: { name: string }
    variant?: { name: string }
    total_price: number
  }>
}

export default function VoidOrderPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [voidingOrder, setVoidingOrder] = useState<Order | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchRecentOrders()
  }, [])

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          staff:staff_id(full_name),
          items:order_items(
            quantity,
            total_price,
            product:product_id(name),
            variant:variant_id(name)
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleVoidOrder = async () => {
    if (!voidingOrder || !voidReason.trim()) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'voided',
          void_reason: voidReason,
          voided_by: (await supabase.auth.getUser()).data.user?.id,
          voided_at: new Date().toISOString(),
        })
        .eq('id', voidingOrder.id)

      if (error) throw error

      toast.success(`Order #${voidingOrder.order_number} voided successfully`)
      setVoidingOrder(null)
      setVoidReason('')
      fetchRecentOrders()
    } catch (error: any) {
      toast.error('Failed to void order')
    }
  }

  const filteredOrders = orders.filter(order => 
    order.order_number.toString().includes(searchTerm) ||
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-text mb-2">Void Orders</h1>
        <p className="text-brand-text-secondary">View and void recent transactions</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
        <input
          type="text"
          placeholder="Search by order number or customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-12"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 card">
            <XCircle className="w-12 h-12 text-brand-text-muted mx-auto mb-4" />
            <p className="text-brand-text-secondary">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-brand-text">
                      Order #{order.order_number}
                    </h3>
                    <span className="badge bg-green-50 text-green-700">
                      {order.status}
                    </span>
                    <span className="text-sm text-brand-text-secondary">
                      {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-brand-text-secondary">
                          {item.quantity}x {item.product?.name}
                          {item.variant?.name && ` - ${item.variant.name}`}
                        </span>
                        <span className="font-medium">₱{item.total_price?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-brand-text-secondary">
                      Payment: <span className="font-medium capitalize">{order.payment_method}</span>
                    </span>
                    {order.customer_name && (
                      <span className="text-brand-text-secondary">
                        Customer: <span className="font-medium">{order.customer_name}</span>
                      </span>
                    )}
                    <span className="text-brand-text-secondary">
                      Staff: <span className="font-medium">{order.staff?.full_name}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right ml-6">
                  <p className="text-2xl font-bold text-brand-text mb-3">
                    ₱{order.total?.toFixed(2)}
                  </p>
                  <button
                    onClick={() => setVoidingOrder(order)}
                    className="btn-secondary text-red-600 hover:bg-red-50 border-red-200"
                  >
                    Void Order
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Void Confirmation Modal */}
      {voidingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setVoidingOrder(null)} />
          
          <div className="modal-content relative bg-white rounded-2xl shadow-medium max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-2">
                Void Order #{voidingOrder.order_number}
              </h3>
              <p className="text-brand-text-secondary">
                This action cannot be undone. Please provide a reason for voiding this order.
              </p>
            </div>

            <div className="mb-4 p-4 bg-brand-background rounded-xl">
              <p className="text-sm text-brand-text-secondary mb-2">
                <span className="font-medium">Total Amount:</span> ₱{voidingOrder.total?.toFixed(2)}
              </p>
              <p className="text-sm text-brand-text-secondary">
                <span className="font-medium">Payment Method:</span> {voidingOrder.payment_method}
              </p>
            </div>

            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason for voiding this order..."
              className="input-field mb-4"
              rows={3}
              required
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setVoidingOrder(null)
                  setVoidReason('')
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleVoidOrder}
                disabled={!voidReason.trim()}
                className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-all duration-200 disabled:opacity-50"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}