// src/app/(dashboard)/products/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProductForm from '@/components/products/ProductForm'
import { Plus, Edit2, Trash2, Package, Search, ImagePlus, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // In src/app/(dashboard)/products/page.tsx
// Update the fetchProducts function:

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
      .order('sort_order')

    if (error) throw error
    
    // Filter variants and addons to only show active ones
    const filteredData = (data || []).map(product => ({
      ...product,
      variants: (product.variants || []).filter((v: any) => v.is_active !== false),
      addons: (product.addons || []).filter((a: any) => a.is_active !== false),
    }))
    
    setProducts(filteredData)
  } catch (error) {
    console.error('Error fetching products:', error)
    toast.error('Failed to load products')
  } finally {
    setLoading(false)
  }
}

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error: any) {
      toast.error('Failed to delete product: ' + error.message)
    }
  }

  const handleToggleAvailability = async (product: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id)
      
      if (error) throw error
      toast.success(`Product ${product.is_available ? 'marked unavailable' : 'marked available'}`)
      fetchProducts()
    } catch (error: any) {
      toast.error('Failed to update product')
    }
  }

  const handleImageUpload = async (file: File, productId: string) => {
    try {
      const fileName = `product-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)
      
      // Update product with new image URL
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId)

      if (updateError) throw updateError

      toast.success('Image uploaded successfully!')
      fetchProducts()
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message)
    }
  }

  const handleRemoveImage = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ image_url: null })
        .eq('id', productId)

      if (error) throw error
      toast.success('Image removed')
      fetchProducts()
    } catch (error: any) {
      toast.error('Failed to remove image')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
      product.category?.slug === selectedCategory

    return matchesSearch && matchesCategory
  })

  const groupedProducts = filteredProducts.reduce((acc: any, product) => {
    const categoryName = product.category?.name || 'Uncategorized'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(product)
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">Product Listing</h1>
          <p className="text-brand-text-secondary">Manage your menu items, pricing, and availability</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null)
            setShowForm(true)
          }}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field w-full sm:w-48"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Product Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-sm text-brand-text-secondary">Total Products</p>
          <p className="text-2xl font-bold text-brand-text">{products.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-brand-text-secondary">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {products.filter(p => p.is_active).length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-brand-text-secondary">Available</p>
          <p className="text-2xl font-bold text-blue-600">
            {products.filter(p => p.is_available).length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-brand-text-secondary">Categories</p>
          <p className="text-2xl font-bold text-brand-primary">{categories.length}</p>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-text-secondary">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card text-center py-16">
          <Package className="w-16 h-16 text-brand-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-brand-text mb-2">No products found</h3>
          <p className="text-brand-text-secondary mb-6">
            {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first product'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                setEditingProduct(null)
                setShowForm(true)
              }}
              className="btn-primary"
            >
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([categoryName, categoryProducts]: [string, any]) => (
            <div key={categoryName}>
              <h3 className="text-lg font-semibold text-brand-text mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-primary rounded-full" />
                {categoryName}
                <span className="text-sm text-brand-text-secondary font-normal">
                  ({categoryProducts.length} items)
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryProducts.map((product: any) => (
                  <div key={product.id} className="card overflow-hidden group">
                    {/* Product Image */}
                    <div className="relative h-48 bg-brand-background-dark">
                      {product.image_url ? (
                        <>
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveImage(product.id)
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-brand-background-dark/80 transition-colors">
                          <Package className="w-10 h-10 text-brand-text-muted mb-2" />
                          <span className="text-xs text-brand-text-muted font-medium mb-2">No image</span>
                          <span className="text-[10px] text-brand-primary font-medium bg-brand-primary/10 px-2 py-1 rounded-lg">
                            Click to upload
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              e.stopPropagation()
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(file, product.id)
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-brand-text mb-1">
                            {product.name}
                          </h4>
                          {product.description && (
                            <p className="text-xs text-brand-text-secondary line-clamp-2 mb-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => {
                              setEditingProduct(product)
                              setShowForm(true)
                            }}
                            className="p-2 hover:bg-brand-background rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4 text-brand-text-secondary hover:text-brand-primary" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4 text-brand-text-secondary hover:text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`badge text-xs ${
                          product.is_active 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleToggleAvailability(product)}
                          className={`badge text-xs cursor-pointer transition-colors ${
                            product.is_available 
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                              : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                          }`}
                          title="Click to toggle"
                        >
                          {product.is_available ? 'Available' : 'Unavailable'}
                        </button>
                        {product.has_variants && (
                          <span className="badge bg-purple-50 text-purple-700 text-xs">
                            Has Variants
                          </span>
                        )}
                      </div>

                      {/* Variants & Pricing */}
                      {product.variants && product.variants.length > 0 && (
                        <div className="bg-brand-background rounded-xl p-3 mb-3">
                          <p className="text-xs font-medium text-brand-text-secondary mb-2">
                            Variants ({product.variants.length})
                          </p>
                          <div className="space-y-1.5">
                            {product.variants.slice(0, 3).map((v: any) => (
                              <div key={v.id} className="flex justify-between items-center text-xs">
                                <span className="text-brand-text-secondary">
                                  {v.name}
                                  {v.temperature && ` (${v.temperature})`}
                                </span>
                                <span className="font-medium text-brand-text">
                                  ₱{v.price.toFixed(2)}
                                </span>
                              </div>
                            ))}
                            {product.variants.length > 3 && (
                              <p className="text-xs text-brand-text-muted text-center">
                                +{product.variants.length - 3} more variants
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Add-ons */}
                      {product.addons && product.addons.length > 0 && (
                        <div className="bg-amber-50 rounded-xl p-3">
                          <p className="text-xs font-medium text-amber-700 mb-2">
                            Add-ons ({product.addons.length})
                          </p>
                          <div className="space-y-1">
                            {product.addons.map((a: any) => (
                              <div key={a.id} className="flex justify-between items-center text-xs">
                                <span className="text-amber-800">{a.name}</span>
                                <span className="font-medium text-amber-700">
                                  +₱{a.price.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No variants/products without price */}
                      {(!product.variants || product.variants.length === 0) && (
                        <p className="text-xs text-yellow-600 bg-yellow-50 rounded-lg p-2">
                          ⚠️ No variants/pricing set
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm" 
            onClick={() => {
              setShowForm(false)
              setEditingProduct(null)
            }} 
          />
          <div className="modal-content relative bg-white rounded-2xl shadow-medium max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-brand-text">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingProduct(null)
                }}
                className="p-2 hover:bg-brand-background rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-brand-text-secondary" />
              </button>
            </div>
            <ProductForm
              product={editingProduct}
              onSave={() => {
                setShowForm(false)
                setEditingProduct(null)
                fetchProducts()
              }}
              onCancel={() => {
                setShowForm(false)
                setEditingProduct(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}