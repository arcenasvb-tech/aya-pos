// src/components/pos/OrderSummary.tsx
import { useCartStore } from '@/lib/store/cartStore'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { Receipt } from 'lucide-react'

export default function OrderSummary() {
  const { items, getSubtotal, getItemCount } = useCartStore()

  if (items.length === 0) return null

  return (
    <div className="bg-brand-background rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Receipt className="w-5 h-5 text-brand-primary" />
        <h3 className="font-semibold text-brand-text">Order Summary</h3>
      </div>
      
      <div className="space-y-2 mb-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-brand-text-secondary">
              {item.quantity}x {item.productName}
              {item.variantName && ` (${item.variantName})`}
            </span>
            <span className="font-medium">
              {formatCurrency((item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      
      <div className="border-t border-brand-border pt-3">
        <div className="flex justify-between items-center">
          <span className="text-brand-text-secondary">Total ({getItemCount()} items)</span>
          <span className="text-lg font-bold text-brand-text">
            {formatCurrency(getSubtotal())}
          </span>
        </div>
      </div>
    </div>
  )
}