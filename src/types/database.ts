// src/types/database.ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'owner' | 'staff'
          phone: string | null
          address: string | null
          avatar_url: string | null
          hourly_rate: number | null
          start_date: string | null
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          description: string | null
          image_url: string | null
          has_variants: boolean
          is_active: boolean
          is_available: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          size: string | null
          temperature: string | null
          price: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>
      }
      product_addons: {
        Row: {
          id: string
          product_id: string
          name: string
          price: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_addons']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['product_addons']['Insert']>
      }
      orders: {
        Row: {
          id: string
          order_number: number
          staff_id: string | null
          processed_by: string | null
          customer_name: string | null
          payment_method: 'cash' | 'gcash' | 'qrph' | 'bank' | 'other'
          subtotal: number
          discount: number
          total: number
          status: 'completed' | 'voided' | 'refunded'
          void_reason: string | null
          voided_by: string | null
          voided_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          quantity: number
          unit_price: number
          total_price: number
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
      time_entries: {
        Row: {
          id: string
          staff_id: string
          clock_in: string
          clock_out: string | null
          clock_in_photo_url: string | null
          clock_out_photo_url: string | null
          hours_worked: number | null
          status: 'active' | 'completed'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['time_entries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['time_entries']['Insert']>
      }
      inventory_items: {
        Row: {
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
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['inventory_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['inventory_items']['Insert']>
      }
    }
  }
}