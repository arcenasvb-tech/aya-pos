// src/app/(dashboard)/reports/sales/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate, formatDateTime } from '@/lib/utils/dateUtils'
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Calendar, Download, Coffee } from 'lucide-react'
import toast from 'react-hot-toast'

interface OrderItem {
  quantity: number
  total_price: number
  product: { name: string } | null
  variant: { name: string } | null
}

interface Order {
  id: string
  order_number: string
  customer_name: string | null
  payment_method: string
  subtotal: number
  total: number
  status: string
  created_at: string
  staff: { full_name: string } | null
  processed_by_profile: { full_name: string } | null
  items: OrderItem[]
}

export default function SalesReportsPage() {
  const [salesData, setSalesData] = useState<any>({
    totalSales: 0,
    totalOrders: 0,
    averageOrder: 0,
    topProducts: [],
    dailySales: [],
    paymentMethods: {},
    allOrders: [],
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const supabase = createClient()

  useEffect(() => {
    fetchSalesData()
  }, [dateRange])

  const fetchSalesData = async () => {
    setLoading(true)
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          staff:staff_id(full_name),
          processed_by_profile:processed_by(full_name),
          items:order_items(
            quantity,
            total_price,
            product:product_id(name),
            variant:variant_id(name)
          )
        `)
        .eq('status', 'completed')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (error) throw error

      const completedOrders = (orders || []) as Order[]
      
      // Calculate totals
      const totalSales = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      const totalOrders = completedOrders.length
      const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0

      // Top products
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
      completedOrders.forEach(order => {
        order.items?.forEach((item: OrderItem) => {
          const name = item.product?.name || 'Unknown'
          if (!productSales[name]) {
            productSales[name] = { name, quantity: 0, revenue: 0 }
          }
          productSales[name].quantity += item.quantity || 0
          productSales[name].revenue += item.total_price || 0
        })
      })

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      // Daily sales
      const dailyMap: Record<string, { date: string; sales: number; orders: number }> = {}
      completedOrders.forEach(order => {
        const date = order.created_at.split('T')[0]
        if (!dailyMap[date]) {
          dailyMap[date] = { date, sales: 0, orders: 0 }
        }
        dailyMap[date].sales += order.total || 0
        dailyMap[date].orders += 1
      })

      const dailySales = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

      // Payment method breakdown
      const paymentMethods: Record<string, number> = {}
      completedOrders.forEach(order => {
        const method = order.payment_method || 'unknown'
        paymentMethods[method] = (paymentMethods[method] || 0) + (order.total || 0)
      })

      setSalesData({
        totalSales,
        totalOrders,
        averageOrder,
        topProducts,
        dailySales,
        paymentMethods,
        allOrders: completedOrders,
      })
    } catch (error) {
      console.error('Error fetching sales:', error)
      toast.error('Failed to load sales data')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const orders = salesData.allOrders as Order[]
    
    if (orders.length === 0) {
      toast.error('No data to export')
      return
    }

    const csvRows = [
      // Header row
      ['Date & Time', 'Order #', 'Processed By', 'Items', 'Quantity', 'Total Amount', 'Payment Method', 'Customer'].join(','),
    ]

    orders.forEach(order => {
      const dateTime = formatDateTime(order.created_at)
      const orderNumber = order.order_number || 'N/A'
      const processedBy = order.processed_by_profile?.full_name || order.staff?.full_name || 'N/A'
      const paymentMethod = (order.payment_method || 'N/A').toUpperCase()
      const customer = order.customer_name || 'Walk-in'
      const total = order.total?.toFixed(2) || '0.00'

      if (order.items && order.items.length > 0) {
        // One row per item
        order.items.forEach((item: OrderItem) => {
          const itemName = item.product?.name || 'Unknown'
          const variantName = item.variant?.name ? ` (${item.variant.name})` : ''
          const itemTotal = item.total_price?.toFixed(2) || '0.00'
          
          csvRows.push([
            `"${dateTime}"`,
            `"${orderNumber}"`,
            `"${processedBy}"`,
            `"${itemName}${variantName}"`,
            item.quantity || 1,
            `"₱${itemTotal}"`,
            `"${paymentMethod}"`,
            `"${customer}"`,
          ].join(','))
        })
      } else {
        // No items (shouldn't happen, but handle gracefully)
        csvRows.push([
          `"${dateTime}"`,
          `"${orderNumber}"`,
          `"${processedBy}"`,
          '"No items"',
          0,
          `"₱${total}"`,
          `"${paymentMethod}"`,
          `"${customer}"`,
        ].join(','))
      }
    })

    // Add summary row
    csvRows.push('')
    csvRows.push(['', '', '', '', '', '', '', ''].join(','))
    csvRows.push([
      '"SUMMARY"',
      '',
      '',
      `"Total Orders: ${salesData.totalOrders}"`,
      '',
      `"Total Sales: ₱${salesData.totalSales.toFixed(2)}"`,
      `"Avg Order: ₱${salesData.averageOrder.toFixed(2)}"`,
      '',
    ].join(','))

    const csvContent = csvRows.join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AYA-Sales-Report-${dateRange.start}-to-${dateRange.end}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Report exported!')
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">Sales Reports</h1>
          <p className="text-brand-text-secondary">Track revenue, orders, and performance</p>
        </div>
        <button onClick={handleExportCSV} className="btn-primary flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Date Range */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-text-secondary" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="input-field w-44"
          />
          <span className="text-brand-text-secondary">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="input-field w-44"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-brand-text-secondary">Total Sales</span>
          </div>
          <p className="text-2xl font-bold text-brand-text">
            {loading ? '-' : formatCurrency(salesData.totalSales)}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-brand-text-secondary">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-brand-text">
            {loading ? '-' : salesData.totalOrders}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
            </div>
            <span className="text-sm text-brand-text-secondary">Avg. Order</span>
          </div>
          <p className="text-2xl font-bold text-brand-text">
            {loading ? '-' : formatCurrency(salesData.averageOrder)}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-brand-text-secondary">Methods</span>
          </div>
          <p className="text-2xl font-bold text-brand-text">
            {loading ? '-' : Object.keys(salesData.paymentMethods || {}).length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="card">
            <h3 className="text-lg font-semibold text-brand-text mb-4">Top Products</h3>
            {salesData.topProducts.length === 0 ? (
              <p className="text-brand-text-secondary text-center py-8">No sales data</p>
            ) : (
              <div className="space-y-3">
                {salesData.topProducts.map((product: any, index: number) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-brand-text-muted w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-brand-text text-sm">{product.name}</p>
                        <p className="text-xs text-brand-text-secondary">{product.quantity} sold</p>
                      </div>
                    </div>
                    <span className="font-semibold text-brand-text">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="card">
            <h3 className="text-lg font-semibold text-brand-text mb-4">Recent Orders</h3>
            {salesData.allOrders.length === 0 ? (
              <p className="text-brand-text-secondary text-center py-8">No orders</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {salesData.allOrders.slice(0, 15).map((order: Order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-brand-background rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-brand-primary">
                          {order.order_number || 'N/A'}
                        </span>
                        <span className={`badge text-[10px] capitalize ${
                          order.payment_method === 'cash' ? 'bg-green-50 text-green-700' :
                          order.payment_method === 'gcash' ? 'bg-blue-50 text-blue-700' :
                          'bg-brand-background text-brand-text-secondary'
                        }`}>
                          {order.payment_method}
                        </span>
                      </div>
                      <p className="text-sm text-brand-text-secondary mt-1">
                        {order.items?.length || 0} item(s) • {order.processed_by_profile?.full_name || order.staff?.full_name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-brand-text">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-xs text-brand-text-muted">
                        {formatDate(order.created_at, 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Methods */}
          {salesData.paymentMethods && Object.keys(salesData.paymentMethods).length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-brand-text mb-4">By Payment Method</h3>
              <div className="space-y-3">
                {Object.entries(salesData.paymentMethods).map(([method, amount]: [string, any]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-brand-text capitalize">{method}</span>
                    <span className="font-semibold text-brand-text">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}