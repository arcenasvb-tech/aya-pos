// src/components/pos/OrderSummary.tsx
import { useCartStore } from '@/lib/store/cartStore'
import { calculateOrderBreakdown } from '@/lib/utils/seniorPwd'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { Receipt } from 'lucide-react'

export default function OrderSummary() {
  const { items, getItemCount } = useCartStore()

  if (items.length === 0) return null

  const breakdown = calculateOrderBreakdown(items)

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
              {formatCurrency(
                (item.price + (item.addons || []).reduce((sum, addon) => sum + addon.price, 0)) * item.quantity
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-brand-border pt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-brand-text-secondary">[Vatable Sales]</span>
          <span>{formatCurrency(breakdown.vatableSales)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-text-secondary">[VAT Amount (12%)]</span>
          <span>{formatCurrency(breakdown.vatAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-text-secondary">[VAT-Exempt Sales]</span>
          <span>{formatCurrency(breakdown.vatExemptSales)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-text-secondary">[Senior/PWD Discount]</span>
          <span>-{formatCurrency(breakdown.totalDiscounts)}</span>
        </div>
        <div className="flex justify-between items-center border-t border-brand-border pt-2">
          <span className="font-semibold text-brand-text">[Total Amount Due]</span>
          <span className="text-base font-bold text-brand-text">
            {formatCurrency(breakdown.totalAmountDue)}
          </span>
        </div>
        <div className="text-xs text-brand-text-secondary">
          {getItemCount()} items • {breakdown.hasSeniorPwdDiscount ? 'With Senior/PWD discount' : 'No discount'}
        </div>
      </div>
    </div>
  )
}