// src/components/pos/ProductGrid.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Minus, Coffee } from 'lucide-react'

interface ProductVariant {
  id: string
  name: string
  size?: string
  temperature?: string
  price: number
  image_url?: string
  is_active?: boolean
}

interface ProductAddon {
  id: string
  name: string
  price: number
  is_active?: boolean
}

interface Product {
  id: string
  name: string
  description?: string
  image_url?: string
  category: {
    name: string
    slug: string
  }
  variants: ProductVariant[]
  addons?: ProductAddon[]
}

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product, variant: ProductVariant, selectedAddons: ProductAddon[]) => void
  selectedCategory: string | null
}

export default function ProductGrid({ products, onAddToCart, selectedCategory }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedTemperature, setSelectedTemperature] = useState<string | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category?.slug === selectedCategory)
    : products

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setSelectedSize(null)
    setSelectedTemperature(null)
    setSelectedAddons([])
    setQuantity(1)
    
    const sizes = Array.from(new Set(product.variants?.map(v => v.size).filter(Boolean) as string[]))
    const temps = Array.from(new Set(product.variants?.map(v => v.temperature).filter(Boolean) as string[]))
    
    if (sizes.length === 1) setSelectedSize(sizes[0])
    if (temps.length === 1) setSelectedTemperature(temps[0])
  }

  const getSizes = (): string[] => {
    if (!selectedProduct) return []
    return Array.from(new Set(selectedProduct.variants?.map(v => v.size).filter(Boolean) as string[]))
  }

  const getTemperatures = (): string[] => {
    if (!selectedProduct) return []
    return Array.from(new Set(selectedProduct.variants?.map(v => v.temperature).filter(Boolean) as string[]))
  }

  const selectedVariant = ((): ProductVariant | null => {
    if (!selectedProduct) return null
    
    const variants = selectedProduct.variants || []
    if (variants.length === 0) return null
    
    if (getSizes().length > 0 && getTemperatures().length > 0) {
      return variants.find(v => v.size === selectedSize && v.temperature === selectedTemperature) || null
    }
    
    if (getSizes().length > 0) {
      return variants.find(v => v.size === selectedSize) || null
    }
    
    if (getTemperatures().length > 0) {
      return variants.find(v => v.temperature === selectedTemperature) || null
    }
    
    return variants[0]
  })()

  const getTotalPrice = (): number => {
    if (!selectedVariant) return 0
    const addonTotal = selectedProduct?.addons
      ?.filter(a => selectedAddons.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0) || 0
    return (selectedVariant.price + addonTotal) * quantity
  }

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedVariant) return
    const addons = selectedProduct.addons?.filter(a => selectedAddons.includes(a.id)) || []
    for (let i = 0; i < quantity; i++) {
      onAddToCart(selectedProduct, selectedVariant, addons)
    }
    setSelectedProduct(null)
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => handleProductClick(product)}
            className="group relative bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-medium transition-all duration-300 text-left flex flex-col active:scale-[0.98]"
          >
            <div className="relative aspect-[4/5] bg-gradient-to-br from-brand-background via-brand-background-dark to-brand-background overflow-hidden">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                      <Coffee className="w-8 h-8 text-white/40" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
              
              {product.variants && product.variants.length > 0 && (
                <div className="absolute top-3 right-3">
                  <div className="bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5">
                    <span className="text-xs font-bold text-white">
                      ₱{Math.min(...product.variants.map(v => v.price))}
                      {product.variants.length > 1 && (
                        <span className="text-white/60 font-normal">+</span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {product.category && (
                <div className="absolute top-3 left-3">
                  <span className="bg-white/80 backdrop-blur-sm text-[10px] font-medium text-brand-text-secondary rounded-full px-2.5 py-1">
                    {product.category.name}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-brand-text leading-tight group-hover:text-brand-primary transition-colors line-clamp-2">
                {product.name}
              </h3>
              
              {product.addons && product.addons.length > 0 && (
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-brand-primary" />
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <Coffee className="w-16 h-16 text-brand-text-muted/20 mx-auto mb-4" />
          <p className="text-brand-text-secondary">No products in this category</p>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="p-6">
              <div className="flex gap-5 mb-6">
                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-brand-background flex-shrink-0 shadow-sm">
                  {(selectedVariant?.image_url || selectedProduct.image_url) ? (
                    <img 
                      src={selectedVariant?.image_url || selectedProduct.image_url} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-background to-brand-background-dark">
                      <Coffee className="w-10 h-10 text-brand-text-muted/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-brand-text mb-1 leading-tight">{selectedProduct.name}</h3>
                  {selectedProduct.description && (
                    <p className="text-sm text-brand-text-secondary mb-2">{selectedProduct.description}</p>
                  )}
                  {selectedVariant && (
                    <p className="text-2xl font-bold text-brand-primary">₱{selectedVariant.price.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {getSizes().length > 0 && (
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Size</label>
                  <div className="flex gap-2">
                    {getSizes().map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          selectedSize === size
                            ? 'bg-brand-text text-white shadow-lg shadow-brand-text/20'
                            : 'bg-brand-background text-brand-text-secondary hover:bg-brand-background-dark'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {getTemperatures().length > 0 && (
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Temperature</label>
                  <div className="flex gap-2">
                    {getTemperatures().map((temp) => (
                      <button
                        key={temp}
                        onClick={() => setSelectedTemperature(temp === selectedTemperature ? null : temp)}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          selectedTemperature === temp
                            ? temp === 'Iced'
                              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                              : 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                            : 'bg-brand-background text-brand-text-secondary hover:bg-brand-background-dark'
                        }`}
                      >
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {getSizes().length === 0 && getTemperatures().length === 0 && selectedVariant && (
                <div className="mb-5">
                  <div className="bg-brand-background rounded-2xl p-5 text-center">
                    <p className="text-sm font-medium text-brand-text-secondary mb-1">{selectedVariant.name}</p>
                    <p className="text-3xl font-bold text-brand-text">₱{selectedVariant.price.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {selectedProduct.addons && selectedProduct.addons.length > 0 && (
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Add-ons</label>
                  <div className="space-y-2">
                    {selectedProduct.addons.map((addon) => (
                      <button
                        key={addon.id}
                        onClick={() => {
                          setSelectedAddons(prev =>
                            prev.includes(addon.id)
                              ? prev.filter(id => id !== addon.id)
                              : [...prev, addon.id]
                          )
                        }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${
                          selectedAddons.includes(addon.id)
                            ? 'bg-brand-primary/5 border-2 border-brand-primary shadow-sm'
                            : 'bg-brand-background border-2 border-transparent hover:border-brand-border'
                        }`}
                      >
                        <span className="text-sm font-medium text-brand-text">{addon.name}</span>
                        <span className={`text-sm font-semibold ${selectedAddons.includes(addon.id) ? 'text-brand-primary' : 'text-brand-text-secondary'}`}>
                          +₱{addon.price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-6">
                <div className="flex items-center bg-brand-background rounded-2xl shadow-sm">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center text-brand-text-secondary hover:text-brand-text transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-brand-text text-base">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center text-brand-text-secondary hover:text-brand-text transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant}
                  className="flex-1 bg-brand-text hover:bg-gray-800 disabled:bg-gray-300 text-white py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-brand-text/10"
                >
                  Add to Cart • ₱{getTotalPrice().toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}