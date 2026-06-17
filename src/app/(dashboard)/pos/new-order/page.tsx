// src/app/(dashboard)/pos/new-order/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cartStore'
import ProductGrid from '@/components/pos/ProductGrid'
import Cart from '@/components/pos/Cart'
import PaymentModal from '@/components/pos/PaymentModal'
import OrderSummary from '@/components/pos/OrderSummary'
import { calculateOrderBreakdown, calculateLineBreakdown } from '@/lib/utils/seniorPwd'
import { ShoppingCart, X } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { name: 'All', slug: 'all' },
  { name: 'Espresso', slug: 'espresso' },
  { name: 'Non-Coffee', slug: 'non-coffee' },
  { name: 'Frappe', slug: 'frappe' },
  { name: 'Refreshers', slug: 'refreshers' },
  { name: 'Beverages', slug: 'beverages' },
  { name: 'Pizza', slug: 'pizza' },
]

export default function NewOrderPage() {
  const [products, setProducts] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const supabase = createClient()

  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const getItemCount = useCartStore((state) => state.getItemCount)

  useEffect(() => {
    setIsMounted(true)
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug),
          variants:product_variants(*),
          addons:product_addons(*)
        `)
        .eq('is_active', true)
        .eq('is_available', true)
        .order('sort_order')

      if (error) throw error

      const filteredData = (data || []).map((product: any) => ({
        ...product,
        variants: (product.variants || []).filter((v: any) => v.is_active !== false),
        addons: (product.addons || []).filter((a: any) => a.is_active !== false),
      }))

      setProducts(filteredData)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: any, variant: any, selectedAddons: any[]) => {
    addItem({
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      variantName: variant.name,
      price: variant.price,
      quantity: 1,
      addons: selectedAddons || [],
      isSeniorPwdEligible: false,
    })
    toast.success(`${product.name} added`)
  }

  const printReceipt = (
    order: any,
    orderItems: any[],
    breakdown: ReturnType<typeof calculateOrderBreakdown>,
    printWindow?: Window | null
  ) => {
    const receiptWindow = printWindow && !printWindow.closed
      ? printWindow
      : window.open('', '_blank', 'width=350,height=650')

    if (!receiptWindow) {
      console.warn('Unable to open receipt window')
      return
    }

    const now = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${order.id || 'N/A'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; width: 78mm; padding: 10px; color: #111; }
          .header { text-align: center; margin-bottom: 10px; }
          .header h2 { font-size: 18px; margin-bottom: 4px; }
          .header p { font-size: 10px; color: #555; }
          .divider { border-top: 1px dashed #333; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 4px 0; font-size: 11px; }
          .item span:first-child { flex: 1; padding-right: 4px; }
          .addon { font-size: 10px; margin-left: 10px; color: #555; }
          .summary { display: flex; justify-content: space-between; margin: 3px 0; font-size: 10px; }
          .total { display: flex; justify-content: space-between; font-weight: 700; margin-top: 10px; font-size: 13px; }
          .footer { text-align: center; margin-top: 12px; font-size: 10px; color: #555; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>AYA Studios</h2>
          <p>coffee & prints</p>
          <p>Order #${order.id || 'N/A'}</p>
          <p>${now}</p>
        </div>
        <div class="divider"></div>
        ${orderItems.map((item: any) => {
          const lineBreakdown = calculateLineBreakdown(item)
          return `
            <div class="item">
              <span>${item.quantity}x ${item.productName}${item.variantName ? ` (${item.variantName})` : ''}</span>
              <span>₱${lineBreakdown.lineFinalAmount.toFixed(2)}</span>
            </div>
            ${(item.addons || []).map((addon: any) => `
              <div class="addon">+ ${addon.name} ₱${addon.price.toFixed(2)}</div>
            `).join('')}
            ${item.isSeniorPwdEligible ? `<div class="addon">Senior/PWD discount applied</div>` : ''}
          `
        }).join('')}
        <div class="divider"></div>
        <div class="summary"><span>Vatable Sales</span><span>₱${breakdown.vatableSales.toFixed(2)}</span></div>
        <div class="summary"><span>VAT Amount</span><span>₱${breakdown.vatAmount.toFixed(2)}</span></div>
        <div class="summary"><span>VAT-Exempt Sales</span><span>₱${breakdown.vatExemptSales.toFixed(2)}</span></div>
        <div class="summary"><span>Senior/PWD Discount</span><span>-₱${breakdown.totalDiscounts.toFixed(2)}</span></div>
        <div class="total">
          <span>Total Amount Due</span>
          <span>₱${breakdown.totalAmountDue.toFixed(2)}</span>
        </div>
        <div class="divider"></div>
        <div class="footer">
          <p>Payment: ${order.payment_method?.toUpperCase() || 'N/A'}</p>
          <p>Processed by: ${order.processed_by_name || 'Staff'}</p>
          <p>Thank you!</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `

    receiptWindow.document.open()
    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
    receiptWindow.focus()
  }

  const handleCompleteOrder = async (paymentDetails: any) => {
    let receiptWindow = paymentDetails.printWindow

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const breakdown = calculateOrderBreakdown(items)
      let paymentProofUrl: string | null = null

      if (paymentDetails.paymentProofFile) {
        const file = paymentDetails.paymentProofFile
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`

        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (!uploadError && uploadData?.path) {
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(uploadData.path)

            paymentProofUrl = publicUrl
          }
        } catch (storageError) {
          console.warn('Payment proof upload skipped:', storageError)
        }
      }

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          staff_id: user?.id,
          processed_by: paymentDetails.processedBy,
          customer_name: paymentDetails.customerName || null,
          payment_method: paymentDetails.paymentMethod,
          subtotal: breakdown.grossAmount,
          discount: breakdown.totalDiscounts,
          total: breakdown.totalAmountDue,
          status: 'completed'
        })
        .select('*, processed_by_profile:processed_by(full_name)')
        .single()

      if (error) throw error

      const orderItems = items.map((item) => {
        const lineBreakdown = calculateLineBreakdown(item)

        return {
          order_id: order.id,
          product_id: item.productId,
          variant_id: item.variantId || null,
          quantity: item.quantity,
          unit_price: lineBreakdown.lineFinalAmount / item.quantity,
          total_price: lineBreakdown.lineFinalAmount,
          notes: item.notes || null,
        }
      })

      const { data: insertedItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select()

      if (itemsError) throw itemsError

      if (insertedItems) {
        const addonInserts: any[] = []
        insertedItems.forEach((insertedItem: any, index: number) => {
          const cartItem = items[index]
          if (cartItem?.addons?.length > 0) {
            cartItem.addons.forEach((addon: any) => {
              addonInserts.push({
                order_item_id: insertedItem.id,
                addon_id: addon.id,
                name: addon.name,
                price: addon.price,
              })
            })
          }
        })
        if (addonInserts.length > 0) {
          await supabase.from('order_item_addons').insert(addonInserts)
        }
      }

      if (paymentDetails.printReceipt) {
        const orderWithName = {
          ...order,
          processed_by_name: order.processed_by_profile?.full_name || 'Staff',
        }
        printReceipt(orderWithName, items, breakdown, receiptWindow)
      }

      toast.success('Order completed!')
      clearCart()
      setShowPayment(false)
      setMobileCartOpen(false)
    } catch (error: any) {
      if (receiptWindow && !receiptWindow.closed) {
        receiptWindow.close()
      }
      toast.error('Failed: ' + error.message)
    }
  }

  const itemCount = isMounted ? getItemCount() : 0
  const subtotal = isMounted ? calculateOrderBreakdown(items).totalAmountDue : 0

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100dvh-8rem)]">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 flex-shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                selectedCategory === cat.slug
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-brand-text-secondary border border-brand-border'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : (
            <ProductGrid
              products={products}
              onAddToCart={handleAddToCart}
              selectedCategory={selectedCategory === 'all' ? null : selectedCategory}
            />
          )}
        </div>
      </div>

      {/* Desktop/Tablet Cart Sidebar */}
      <div className="hidden md:flex md:w-72 flex-shrink-0">
        <div className="card flex-1 flex flex-col w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-brand-text">Order</h3>
            {itemCount > 0 && (
              <span className="badge bg-brand-primary/10 text-brand-primary text-xs">{itemCount} items</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <Cart />
          </div>
          {items.length > 0 && (
            <div className="border-t border-brand-border pt-3 mt-3 space-y-3">
              <OrderSummary />
              <div className="flex justify-between mb-3">
                <span className="text-brand-text-secondary">Total</span>
                <span className="text-lg font-bold">₱{subtotal.toFixed(2)}</span>
              </div>
              <button onClick={() => setShowPayment(true)} className="btn-primary w-full py-2.5 text-sm">Checkout</button>
              <button onClick={clearCart} className="btn-ghost w-full text-red-500 text-xs mt-1">Clear</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Cart Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 z-30">
        <button
          onClick={() => setMobileCartOpen(true)}
          className="w-full bg-brand-text text-white py-3 px-4 rounded-2xl flex items-center justify-between shadow-lg"
        >
          <span className="flex items-center gap-2 font-medium">
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 ? `${itemCount} items` : 'Cart is empty'}
          </span>
          {itemCount > 0 && <span className="font-bold">₱{subtotal.toFixed(2)}</span>}
        </button>
      </div>

      {/* Mobile Cart Slide-up */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">Your Order</h3>
              <button onClick={() => setMobileCartOpen(false)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4"><Cart /></div>
            {items.length > 0 && (
              <div className="border-t p-4 space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span><span>₱{subtotal.toFixed(2)}</span>
                </div>
                <button onClick={() => { setMobileCartOpen(false); setShowPayment(true); }} className="btn-primary w-full py-3">Proceed to Payment</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} onComplete={handleCompleteOrder} total={subtotal} />
      )}
    </div>
  )
}
