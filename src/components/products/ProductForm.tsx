// src/components/products/ProductForm.tsx
// Replace the entire file with this updated version:

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ImagePlus, X, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProductFormProps {
  product?: any
  onSave: () => void
  onCancel: () => void
}

export default function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || '',
    image_url: product?.image_url || '',
    has_variants: product?.has_variants ?? true,
    is_active: product?.is_active ?? true,
    is_available: product?.is_available ?? true,
    sort_order: product?.sort_order || 0,
  })

  const [existingVariantIds, setExistingVariantIds] = useState<string[]>(
    product?.variants?.map((v: any) => v.id) || []
  )
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([])
  const [existingAddonIds, setExistingAddonIds] = useState<string[]>(
    product?.addons?.map((a: any) => a.id) || []
  )
  const [deletedAddonIds, setDeletedAddonIds] = useState<string[]>([])

  const [variants, setVariants] = useState<any[]>(
    product?.variants && product.variants.length > 0
      ? product.variants.map((v: any) => ({
          id: v.id,
          name: v.name || '',
          size: v.size || '',
          temperature: v.temperature || '',
          price: v.price || 0,
          image_url: v.image_url || '',
          is_active: v.is_active ?? true,
        }))
      : [{ id: null, name: '', size: '', temperature: '', price: 0, image_url: '', is_active: true }]
  )

  const [addons, setAddons] = useState<any[]>(
    product?.addons && product.addons.length > 0
      ? product.addons.map((a: any) => ({
          id: a.id,
          name: a.name || '',
          price: a.price || 0,
          is_active: a.is_active ?? true,
        }))
      : []
  )

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null)

  // Track variant image files for upload
  const [variantImageFiles, setVariantImageFiles] = useState<Record<number, File>>({})
  const [variantImagePreviews, setVariantImagePreviews] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchCategories()
    // Initialize variant previews from existing data
    if (product?.variants) {
      const previews: Record<number, string> = {}
      product.variants.forEach((v: any, i: number) => {
        if (v.image_url) previews[i] = v.image_url
      })
      setVariantImagePreviews(previews)
    }
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    setCategories(data || [])
  }

  const uploadImage = async (file: File, bucket: string): Promise<string | null> => {
    try {
      const fileName = `${bucket}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)
      
      return publicUrl
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message)
      return null
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData({ ...formData, image_url: '' })
  }

  // Variant image handling
  const handleVariantImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVariantImageFiles(prev => ({ ...prev, [index]: file }))
      setVariantImagePreviews(prev => ({ ...prev, [index]: URL.createObjectURL(file) }))
    }
  }

  const handleRemoveVariantImage = (index: number) => {
    const updatedFiles = { ...variantImageFiles }
    delete updatedFiles[index]
    setVariantImageFiles(updatedFiles)
    
    const updatedPreviews = { ...variantImagePreviews }
    delete updatedPreviews[index]
    setVariantImagePreviews(updatedPreviews)
    
    // Clear image_url from variant
    handleVariantChange(index, 'image_url', '')
  }

  const handleAddVariant = () => {
    setVariants([...variants, { id: null, name: '', size: '', temperature: '', price: 0, image_url: '', is_active: true }])
  }

  const handleRemoveVariant = (index: number) => {
    const variant = variants[index]
    if (variant.id) {
      setDeletedVariantIds(prev => [...prev, variant.id])
    }
    // Clean up any image previews
    handleRemoveVariantImage(index)
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleVariantChange = (index: number, field: string, value: any) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    
    if (field === 'size' || field === 'temperature') {
      const size = field === 'size' ? value : updated[index].size
      const temp = field === 'temperature' ? value : updated[index].temperature
      if (size && temp) {
        updated[index].name = `${temp} ${size}`
      }
    }
    
    setVariants(updated)
  }

  const handleAddAddon = () => {
    setAddons([...addons, { id: null, name: '', price: 0, is_active: true }])
  }

  const handleRemoveAddon = (index: number) => {
    const addon = addons[index]
    if (addon.id) {
      setDeletedAddonIds(prev => [...prev, addon.id])
    }
    setAddons(addons.filter((_, i) => i !== index))
  }

  const handleAddonChange = (index: number, field: string, value: any) => {
    const updated = [...addons]
    updated[index] = { ...updated[index], [field]: field === 'price' ? parseFloat(value) || 0 : value }
    setAddons(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload main product image
      let imageUrl = formData.image_url
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile, 'product')
        if (uploadedUrl) imageUrl = uploadedUrl
      } else if (!imagePreview && formData.image_url) {
        imageUrl = ''
      }

      const productData = { ...formData, image_url: imageUrl }
      let productId = product?.id

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single()
        if (error) throw error
        productId = data.id
      }

      // Handle variants
      if (product) {
        // Deactivate removed variants
        if (deletedVariantIds.length > 0) {
          await supabase
            .from('product_variants')
            .update({ is_active: false })
            .in('id', deletedVariantIds)
        }

        // Update existing variants (not deleted)
        const existingVariants = variants.filter(v => v.id && !deletedVariantIds.includes(v.id))
        for (let i = 0; i < variants.length; i++) {
          const variant = variants[i]
          if (!variant.id || deletedVariantIds.includes(variant.id)) continue
          
          // Upload variant image if new file
          let variantImageUrl = variant.image_url
          if (variantImageFiles[i]) {
            const uploadedUrl = await uploadImage(variantImageFiles[i], 'variant')
            if (uploadedUrl) variantImageUrl = uploadedUrl
          }

          const { error } = await supabase
            .from('product_variants')
            .update({
              name: variant.name,
              size: variant.size || null,
              temperature: variant.temperature || null,
              price: variant.price,
              image_url: variantImageUrl || null,
              is_active: true,
            })
            .eq('id', variant.id)
          
          if (error) throw error
        }
      }

      // Insert new variants
      if (formData.has_variants) {
        for (let i = 0; i < variants.length; i++) {
          const variant = variants[i]
          if (variant.id || !variant.name || variant.price <= 0) continue
          
          // Upload variant image for new variants
          let variantImageUrl = ''
          if (variantImageFiles[i]) {
            const uploadedUrl = await uploadImage(variantImageFiles[i], 'variant')
            if (uploadedUrl) variantImageUrl = uploadedUrl
          }

          await supabase.from('product_variants').insert({
            product_id: productId,
            name: variant.name,
            size: variant.size || null,
            temperature: variant.temperature || null,
            price: variant.price,
            image_url: variantImageUrl || null,
            is_active: true,
          })
        }
      }

      // Handle add-ons (same as before)
      if (product) {
        if (deletedAddonIds.length > 0) {
          await supabase
            .from('product_addons')
            .update({ is_active: false })
            .in('id', deletedAddonIds)
        }

        const existingAddons = addons.filter(a => a.id && !deletedAddonIds.includes(a.id))
        for (const addon of existingAddons) {
          await supabase
            .from('product_addons')
            .update({
              name: addon.name,
              price: addon.price,
              is_active: true,
            })
            .eq('id', addon.id)
        }
      }

      const newAddons = addons.filter(a => !a.id && a.name && a.price > 0)
      if (newAddons.length > 0) {
        await supabase.from('product_addons').insert(
          newAddons.map(a => ({
            product_id: productId,
            name: a.name,
            price: a.price,
            is_active: true,
          }))
        )
      }

      toast.success(product ? 'Product updated!' : 'Product created!')
      onSave()
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Main Product Image */}
      <div>
        <label className="block text-sm font-medium text-brand-text mb-2">Main Product Image</label>
        {imagePreview ? (
          <div className="relative h-40 bg-brand-background rounded-xl overflow-hidden">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-40 bg-brand-background rounded-xl border-2 border-dashed border-brand-border cursor-pointer hover:border-brand-primary transition-colors">
            <ImagePlus className="w-8 h-8 text-brand-text-muted mb-2" />
            <span className="text-sm text-brand-text-secondary">Default product image</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-brand-text mb-1">Name *</label>
          <input
            type="text" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field" required placeholder="e.g., Americano"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-brand-text mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field" rows={2} placeholder="Brief description..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1">Category</label>
          <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="input-field">
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1">Sort Order</label>
          <input
            type="number" value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            className="input-field"
          />
        </div>
        <div className="col-span-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.has_variants} onChange={(e) => setFormData({ ...formData, has_variants: e.target.checked })}
              className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary" />
            <span className="text-sm">Has variants</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary" />
            <span className="text-sm">Active on POS</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.is_available} onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary" />
            <span className="text-sm">Available</span>
          </label>
        </div>
      </div>

      {/* Variants with Images */}
      {formData.has_variants && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-brand-text">Variants</h4>
            <button type="button" onClick={handleAddVariant} className="text-brand-primary text-sm font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Variant
            </button>
          </div>
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div key={index} className="bg-brand-background p-4 rounded-xl space-y-3">
                <div className="flex gap-3">
                  {/* Variant Image */}
                  <div className="flex-shrink-0">
                    {variantImagePreviews[index] ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                        <img src={variantImagePreviews[index]} alt={variant.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-20 h-20 bg-white rounded-lg border border-dashed border-brand-border cursor-pointer hover:border-brand-primary transition-colors">
                        <Upload className="w-4 h-4 text-brand-text-muted mb-1" />
                        <span className="text-[9px] text-brand-text-muted text-center leading-tight">Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleVariantImageChange(index, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Variant Fields */}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text" placeholder="Size (Tall)"
                        value={variant.size}
                        onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                        className="input-field flex-1 bg-white text-sm"
                      />
                      <input
                        type="text" placeholder="Temp (Iced)"
                        value={variant.temperature}
                        onChange={(e) => handleVariantChange(index, 'temperature', e.target.value)}
                        className="input-field flex-1 bg-white text-sm"
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number" placeholder="Price"
                        value={variant.price || ''}
                        onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)}
                        className="input-field w-32 bg-white text-sm" step="0.01" min="0"
                      />
                      {variant.name && (
                        <span className="text-xs text-brand-text-secondary truncate">{variant.name}</span>
                      )}
                      <button
                        type="button" onClick={() => handleRemoveVariant(index)}
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add-ons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-brand-text">Add-ons</h4>
          <button type="button" onClick={handleAddAddon} className="text-brand-primary text-sm font-medium flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Add-on
          </button>
        </div>
        <div className="space-y-2">
          {addons.map((addon, index) => (
            <div key={index} className="flex gap-2 items-center bg-brand-background p-3 rounded-xl">
              <input type="text" placeholder="Name" value={addon.name}
                onChange={(e) => handleAddonChange(index, 'name', e.target.value)} className="input-field flex-1 bg-white" />
              <input type="number" placeholder="Price" value={addon.price || ''}
                onChange={(e) => handleAddonChange(index, 'price', e.target.value)} className="input-field w-28 bg-white" step="0.01" />
              <button type="button" onClick={() => handleRemoveAddon(index)}
                className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-brand-border">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  )
}