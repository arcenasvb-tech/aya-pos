// src/lib/store/cartStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartAddon {
  id: string
  name: string
  price: number
}

interface CartItem {
  id: string
  productId: string
  productName: string
  variantId?: string
  variantName?: string
  price: number
  quantity: number
  addons: CartAddon[]
  notes?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  toggleAddon: (itemId: string, addon: CartAddon) => void
  updateNotes: (id: string, notes: string) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const id = Math.random().toString(36).substring(7)
        set((state) => ({
          items: [...state.items, { ...item, id, addons: item.addons || [] }]
        }))
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        }))
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          )
        }))
      },
      
      toggleAddon: (itemId, addon) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId) return item
            const hasAddon = item.addons.some(a => a.id === addon.id)
            return {
              ...item,
              addons: hasAddon
                ? item.addons.filter(a => a.id !== addon.id)
                : [...item.addons, addon]
            }
          })
        }))
      },
      
      updateNotes: (id, notes) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, notes } : item
          )
        }))
      },
      
      clearCart: () => set({ items: [] }),
      
      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const itemTotal = item.price * item.quantity
          const addonTotal = item.addons.reduce((sum, a) => sum + a.price, 0) * item.quantity
          return total + itemTotal + addonTotal
        }, 0)
      },
      
      getTotal: () => {
        return get().getSubtotal()
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      }
    }),
    {
      name: 'cart-storage',
    }
  )
)