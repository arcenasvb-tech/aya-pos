// src/app/(dashboard)/pos/new-order/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cartStore'
import ProductGrid from '@/components/pos/ProductGrid'
import Cart from '@/components/pos/Cart'
import PaymentModal from '@/components/pos/PaymentModal'
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
  const getSubtotal = useCartStore((state) => state.getSubtotal)
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
    })
    toast.success(`${product.name} added`)
  }

  const handleCompleteOrder = async (paymentDetails: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          staff_id: user?.id,
          processed_by: paymentDetails.processedBy,
          customer_name: paymentDetails.customerName || null,
          payment_method: paymentDetails.paymentMethod,
          subtotal: getSubtotal(),
          total: getSubtotal(),
          status: 'completed'
        })
        .select()
        .single()

      if (error) throw error

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        notes: item.notes || null,
      }))

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

      toast.success('Order completed!')
      clearCart()
      setShowPayment(false)
      setMobileCartOpen(false)
    } catch (error: any) {
      toast.error('Failed: ' + error.message)
    }
  }

  const itemCount = isMounted ? getItemCount() : 0
  const subtotal = isMounted ? getSubtotal() : 0

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100dvh-8rem)]">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Category Tabs */}
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

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
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

      {/* Desktop Cart - visible on lg screens and up */}
      <div className="hidden lg:flex lg:w-80 flex-shrink-0">
        <div className="card flex-1 flex flex-col w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-brand-text">Order</h3>
            {itemCount > 0 && (
              <span className="badge bg-brand-primary/10 text-brand-primary text-xs">
                {itemCount} items
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <Cart />
          </div>
          {items.length > 0 && (
            <div className="border-t border-brand-border pt-3 mt-3">
              <div className="flex justify-between mb-3">
                <span className="text-brand-text-secondary">Total</span>
                <span className="text-lg font-bold">₱{subtotal.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setShowPayment(true)}
                className="btn-primary w-full py-2.5 text-sm"
              >
                Checkout
              </button>
              <button
                onClick={clearCart}
                className="btn-ghost w-full text-red-500 text-xs mt-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Cart Bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-3 z-30">
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
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">Your Order</h3>
              <button onClick={() => setMobileCartOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Cart />
            </div>
            {items.length > 0 && (
              <div className="border-t p-4 space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => { setMobileCartOpen(false); setShowPayment(true); }}
                  className="btn-primary w-full py-3"
                >
                  Proceed to Payment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onComplete={handleCompleteOrder}
          total={subtotal}
        />
      )}
    </div>
  )
}