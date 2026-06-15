// src/components/pos/Cart.tsx
'use client'

import { useCartStore } from '@/lib/store/cartStore'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function Cart() {
  const {
    items,
    removeItem,
    updateQuantity,
    updateNotes,
    addAddon,
    removeAddon,
  } = useCartStore()
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesInput, setNotesInput] = useState('')

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-brand-background rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShoppingCart className="w-8 h-8 text-brand-text-muted" />
        </div>
        <p className="text-brand-text-secondary text-sm">Your cart is empty</p>
        <p className="text-brand-text-muted text-xs mt-1">Tap on products to add them</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="bg-brand-background rounded-xl p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-medium text-brand-text text-sm">
                {item.productName}
              </h4>
              {item.variantName && (
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  {item.variantName}
                </p>
              )}
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="p-1 hover:bg-red-50 rounded-lg text-brand-text-muted hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Add-ons */}
          {item.addons.length > 0 && (
            <div className="mb-2">
              {item.addons.map((addon) => (
                <div key={addon.id} className="flex items-center justify-between text-xs text-brand-text-secondary ml-2">
                  <span>+ {addon.name}</span>
                  <div className="flex items-center gap-2">
                    <span>₱{addon.price.toFixed(2)}</span>
                    <button
                      onClick={() => removeAddon(item.id, addon.id)}
                      className="text-red-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {editingNotes === item.id ? (
            <div className="mb-2">
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                onBlur={() => {
                  updateNotes(item.id, notesInput)
                  setEditingNotes(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateNotes(item.id, notesInput)
                    setEditingNotes(null)
                  }
                }}
                placeholder="Add notes..."
                className="w-full text-xs px-2 py-1 rounded-lg border border-brand-border bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                autoFocus
              />
            </div>
          ) : item.notes ? (
            <button
              onClick={() => {
                setEditingNotes(item.id)
                setNotesInput(item.notes || '')
              }}
              className="text-xs text-brand-text-secondary italic mb-2 hover:text-brand-primary"
            >
              Note: {item.notes}
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingNotes(item.id)
                setNotesInput('')
              }}
              className="text-xs text-brand-text-muted mb-2 hover:text-brand-primary"
            >
              + Add note
            </button>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 rounded-lg bg-white border border-brand-border flex items-center justify-center hover:bg-brand-background transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-medium min-w-[20px] text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-lg bg-white border border-brand-border flex items-center justify-center hover:bg-brand-background transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span className="text-sm font-semibold text-brand-text">
              ₱{((item.price + item.addons.reduce((sum, a) => sum + a.price, 0)) * item.quantity).toFixed(2)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Need to import these at the top
import { ShoppingCart, X } from 'lucide-react'