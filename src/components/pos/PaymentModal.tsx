// src/components/pos/PaymentModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, CreditCard, Smartphone, Banknote, QrCode, Printer } from 'lucide-react'

interface PaymentModalProps {
  onClose: () => void
  onComplete: (details: PaymentDetails) => void
  total: number
}

interface PaymentDetails {
  paymentMethod: string
  processedBy: string
  customerName?: string
  printReceipt: boolean
}

interface StaffMember {
  id: string
  full_name: string
}

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: Banknote, color: 'text-green-600' },
  { id: 'gcash', name: 'GCash', icon: Smartphone, color: 'text-blue-600' },
  { id: 'qrph', name: 'QR PH', icon: QrCode, color: 'text-purple-600' },
  { id: 'bank', name: 'Bank Transfer', icon: CreditCard, color: 'text-indigo-600' },
  { id: 'other', name: 'Other', icon: CreditCard, color: 'text-gray-600' },
]

export default function PaymentModal({ onClose, onComplete, total }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [processedBy, setProcessedBy] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [printReceipt, setPrintReceipt] = useState(true)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStaff, setLoadingStaff] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      // Get all active staff and owner profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      
      if (data && data.length > 0) {
        setStaff(data)
        // Auto-select the first staff member if none selected
        if (!processedBy) {
          setProcessedBy(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoadingStaff(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!processedBy) {
      return
    }
    setLoading(true)
    await onComplete({
      paymentMethod,
      processedBy,
      customerName: customerName || undefined,
      printReceipt,
    })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="modal-content relative bg-white rounded-2xl shadow-medium max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-brand-text">Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-brand-background rounded-xl">
            <X className="w-5 h-5 text-brand-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Total Display */}
          <div className="bg-brand-primary/5 rounded-2xl p-6 text-center">
            <p className="text-sm text-brand-text-secondary mb-2">Total Amount</p>
            <p className="text-4xl font-bold text-brand-primary">₱{total.toFixed(2)}</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === method.id
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-brand-border hover:border-brand-primary/30'
                  }`}
                >
                  <method.icon className={`w-5 h-5 ${method.color}`} />
                  <span className="text-sm font-medium">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Processed By - FIXED */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-2">
              Processed By <span className="text-red-400">*</span>
            </label>
            {loadingStaff ? (
              <div className="input-field flex items-center gap-2 text-brand-text-muted">
                <div className="w-4 h-4 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
                Loading staff...
              </div>
            ) : staff.length === 0 ? (
              <div className="input-field text-brand-text-muted bg-yellow-50 border-yellow-200">
                ⚠️ No staff profiles found. Please create staff profiles in Supabase.
              </div>
            ) : (
              <select
                value={processedBy}
                onChange={(e) => setProcessedBy(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select staff who processed this order</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Customer Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-2">
              Customer Name <span className="text-brand-text-muted">(optional)</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-field"
              placeholder="Walk-in customer"
            />
          </div>

          {/* Print Receipt Toggle */}
          <div className="flex items-center justify-between p-4 bg-brand-background rounded-xl">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-brand-text-secondary" />
              <span className="text-sm font-medium">Print Receipt</span>
            </div>
            <button
              type="button"
              onClick={() => setPrintReceipt(!printReceipt)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                printReceipt ? 'bg-brand-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform shadow ${
                  printReceipt ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !processedBy || staff.length === 0}
              className="btn-primary flex-1"
            >
              {loading ? 'Processing...' : 'Complete Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}