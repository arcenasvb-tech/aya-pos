// src/app/(dashboard)/inventory/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Package, Search, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import toast from 'react-hot-toast'

interface InventoryItem {
  id: string
  name: string
  sku: string | null
  category: string | null
  unit: string
  current_quantity: number
  minimum_quantity: number
  cost_per_unit: number | null
  supplier: string | null
  is_active: boolean
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'pieces',
    current_quantity: 0,
    minimum_quantity: 0,
    cost_per_unit: 0,
    supplier: '',
  })

  useEffect(() => {
    fetchInventory()
  }, [])

 const fetchInventory = async () => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name')

    if (error) throw error
    setItems(data || [])
  } catch (error) {
    console.error('Error fetching inventory:', error)
  } finally {
    setLoading(false)
  }
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('inventory_items')
          .update(formData)
          .eq('id', editingItem.id)
        if (error) throw error
        toast.success('Item updated successfully')
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert(formData)
        if (error) throw error
        toast.success('Item added successfully')
      }
      
      setShowForm(false)
      setEditingItem(null)
      resetForm()
      fetchInventory()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save item')
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      sku: item.sku || '',
      category: item.category || '',
      unit: item.unit,
      current_quantity: item.current_quantity,
      minimum_quantity: item.minimum_quantity,
      cost_per_unit: item.cost_per_unit || 0,
      supplier: item.supplier || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Item deleted')
      fetchInventory()
    } catch (error: any) {
      toast.error('Failed to delete item')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      unit: 'pieces',
      current_quantity: 0,
      minimum_quantity: 0,
      cost_per_unit: 0,
      supplier: '',
    })
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">Inventory Management</h1>
          <p className="text-brand-text-secondary">Track your stock levels and costs</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingItem(null)
            setShowForm(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-12"
        />
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="text-left p-4 text-sm font-medium text-brand-text-secondary">Item</th>
                <th className="text-left p-4 text-sm font-medium text-brand-text-secondary">SKU</th>
                <th className="text-left p-4 text-sm font-medium text-brand-text-secondary">Category</th>
                <th className="text-right p-4 text-sm font-medium text-brand-text-secondary">Quantity</th>
                <th className="text-right p-4 text-sm font-medium text-brand-text-secondary">Cost/Unit</th>
                <th className="text-right p-4 text-sm font-medium text-brand-text-secondary">Total Cost</th>
                <th className="text-right p-4 text-sm font-medium text-brand-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Package className="w-12 h-12 text-brand-text-muted mx-auto mb-3" />
                    <p className="text-brand-text-secondary">No items found</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-brand-border/50 hover:bg-brand-background/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.current_quantity <= item.minimum_quantity && (
                          <AlertTriangle className="w-5 h-5 text-brand-warning flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-brand-text">{item.name}</p>
                          <p className="text-xs text-brand-text-secondary">{item.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-brand-text-secondary">
                      {item.sku || '-'}
                    </td>
                    <td className="p-4">
                      {item.category && (
                        <span className="badge bg-brand-background text-brand-text-secondary text-xs">
                          {item.category}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-medium ${
                        item.current_quantity <= item.minimum_quantity
                          ? 'text-red-600'
                          : 'text-brand-text'
                      }`}>
                        {item.current_quantity}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm">
                      {item.cost_per_unit ? formatCurrency(item.cost_per_unit) : '-'}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {item.cost_per_unit
                        ? formatCurrency(item.cost_per_unit * item.current_quantity)
                        : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-brand-background rounded-lg text-brand-text-secondary hover:text-brand-primary"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-brand-text-secondary hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="modal-content relative bg-white rounded-2xl shadow-medium max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold text-brand-text mb-6">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-brand-text mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Beans, Cups, Milk"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input-field"
                  >
                    <option value="pieces">Pieces</option>
                    <option value="kg">Kilograms</option>
                    <option value="g">Grams</option>
                    <option value="L">Liters</option>
                    <option value="ml">Milliliters</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Current Quantity</label>
                  <input
                    type="number"
                    value={formData.current_quantity}
                    onChange={(e) => setFormData({ ...formData, current_quantity: parseFloat(e.target.value) })}
                    className="input-field"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Minimum Quantity</label>
                  <input
                    type="number"
                    value={formData.minimum_quantity}
                    onChange={(e) => setFormData({ ...formData, minimum_quantity: parseFloat(e.target.value) })}
                    className="input-field"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Cost per Unit (₱)</label>
                  <input
                    type="number"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) })}
                    className="input-field"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}