// src/app/(dashboard)/pos/void-order/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { AlertTriangle, FileImage, Search, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
  id: string
  order_number: number
  customer_name?: string
  payment_method: string
  payment_reference_number?: string
  payment_reference_image_url?: string
  subtotal: number
  discount: number
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

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showVoidModal, setShowVoidModal] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'voided'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
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
        .in('status', ['completed', 'voided'])
        .order('created_at', { ascending: false })
        .limit(80)

      if (error) throw error
      setOrders((data || []) as Order[])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load order history')
    } finally {
      setLoading(false)
    }
  }

  const handleVoidOrder = async () => {
    if (!selectedOrder || !voidReason.trim()) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'voided',
          void_reason: voidReason,
          voided_by: (await supabase.auth.getUser()).data.user?.id,
          voided_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id)

      if (error) throw error

      toast.success(`Order #${selectedOrder.order_number} has been voided`)
      setSelectedOrder(null)
      setShowVoidModal(false)
      setVoidReason('')
      fetchOrders()
    } catch (error: any) {
      toast.error('Failed to void order')
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter

      const search = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !search ||
        order.order_number.toString().includes(search) ||
        order.customer_name?.toLowerCase().includes(search) ||
        order.payment_reference_number?.toLowerCase().includes(search)

      return matchesStatus && matchesSearch
    })
  }, [orders, searchTerm, statusFilter])

  const summary = useMemo(() => {
    const completedOrders = orders.filter((order) => order.status === 'completed')
    const totalSales = completedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    const averageOrder = completedOrders.length
      ? totalSales / completedOrders.length
      : 0

    return {
      totalSales,
      completedCount: completedOrders.length,
      voidedCount: orders.filter((order) => order.status === 'voided').length,
      averageOrder,
    }
  }, [orders])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text mb-1">Order History</h1>
          <p className="text-brand-text-secondary">Review recent transactions and payment details</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="card">
          <p className="text-sm text-brand-text-secondary">Completed Sales</p>
          <h3 className="mt-1 text-2xl font-bold text-brand-text">₱{summary.totalSales.toFixed(2)}</h3>
        </div>
        <div className="card">
          <p className="text-sm text-brand-text-secondary">Orders</p>
          <h3 className="mt-1 text-2xl font-bold text-brand-text">{summary.completedCount}</h3>
        </div>
        <div className="card">
          <p className="text-sm text-brand-text-secondary">Average Order</p>
          <h3 className="mt-1 text-2xl font-bold text-brand-text">₱{summary.averageOrder.toFixed(2)}</h3>
        </div>
        <div className="card">
          <p className="text-sm text-brand-text-secondary">Voided</p>
          <h3 className="mt-1 text-2xl font-bold text-brand-text">{summary.voidedCount}</h3>
        </div>
      </div>

      <div className="card p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Search by order, customer, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'completed', 'voided'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-2 rounded-xl text-sm font-medium ${
                  statusFilter === filter
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-background text-brand-text-secondary'
                }`}
              >
                {filter === 'all' ? 'All' : filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 card">
            <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 card">
            <XCircle className="w-12 h-12 text-brand-text-muted mx-auto mb-4" />
            <p className="text-brand-text-secondary">No orders match your search</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="card w-full text-left hover:border-brand-primary/40 transition-all"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-brand-text">Order #{order.order_number}</span>
                    <span className={`badge ${order.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {order.status}
                    </span>
                    <span className="text-sm text-brand-text-secondary">
                      {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-brand-text-secondary">
                    {order.customer_name || 'Walk-in Customer'} · {order.payment_method}
                  </p>
                  <div className="mt-2 space-y-1">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <p key={idx} className="text-sm text-brand-text-secondary">
                        {item.quantity}x {item.product?.name}
                        {item.variant?.name ? ` · ${item.variant.name}` : ''}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-xl font-bold text-brand-text">₱{order.total.toFixed(2)}</p>
                  <p className="text-sm text-brand-text-secondary">by {order.staff?.full_name}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="modal-content relative bg-white rounded-2xl shadow-medium max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-brand-text">Order #{selectedOrder.order_number}</h3>
                <p className="text-sm text-brand-text-secondary">
                  {format(new Date(selectedOrder.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="btn-ghost">Close</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mb-4">
              <div className="card p-3">
                <p className="text-sm text-brand-text-secondary">Customer</p>
                <p className="font-medium text-brand-text">{selectedOrder.customer_name || 'Walk-in'}</p>
              </div>
              <div className="card p-3">
                <p className="text-sm text-brand-text-secondary">Payment</p>
                <p className="font-medium text-brand-text capitalize">{selectedOrder.payment_method}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-brand-background px-3 py-2">
                  <span className="text-sm text-brand-text-secondary">
                    {item.quantity}x {item.product?.name}
                    {item.variant?.name ? ` · ${item.variant.name}` : ''}
                  </span>
                  <span className="font-medium text-brand-text">₱{item.total_price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-brand-border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Subtotal</span>
                <span>₱{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Discount</span>
                <span>-₱{selectedOrder.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>₱{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {selectedOrder.payment_reference_number && (
              <div className="mt-4 rounded-2xl bg-brand-background p-4">
                <p className="text-sm text-brand-text-secondary">Reference</p>
                <p className="font-medium text-brand-text">{selectedOrder.payment_reference_number}</p>
              </div>
            )}

            {selectedOrder.payment_reference_image_url && (
              <div className="mt-4 rounded-2xl border border-brand-border p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-brand-text mb-2">
                  <FileImage className="w-4 h-4" />
                  Payment Proof
                </div>
                <img src={selectedOrder.payment_reference_image_url} alt="Payment proof" className="max-h-72 w-full rounded-xl object-cover" />
              </div>
            )}

            {selectedOrder.status !== 'voided' && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowVoidModal(true)}
                  className="btn-secondary text-red-600 border-red-200"
                >
                  Void Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showVoidModal && selectedOrder && selectedOrder.status !== 'voided' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowVoidModal(false)} />
          <div className="modal-content relative bg-white rounded-2xl shadow-medium max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-2">Void Order #{selectedOrder.order_number}</h3>
              <p className="text-brand-text-secondary">Please provide a reason before voiding this transaction.</p>
            </div>

            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason for voiding this order..."
              className="input-field mb-4"
              rows={3}
            />

            <div className="flex gap-3">
              <button onClick={() => setShowVoidModal(false)} className="btn-secondary flex-1">Cancel</button>
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