// src/components/pos/PaymentModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cartStore'
import { calculateLineBreakdown, calculateOrderBreakdown } from '@/lib/utils/seniorPwd'
import {
  X,
  CreditCard,
  Smartphone,
  Banknote,
  QrCode,
  Printer,
  Receipt,
  User,
  BadgeCheck,
  Camera,
  Trash2,
} from 'lucide-react'
import CameraCapture from '@/components/clock/CameraCapture'

interface PaymentModalProps {
  onClose: () => void
  onComplete: (details: PaymentDetails) => void
  total: number
}

interface PaymentDetails {
  paymentMethod: string
  processedBy: string
  customerName?: string
  isSeniorPwd: boolean
  seniorPwdIdNumber?: string
  paymentReferenceNumber?: string
  paymentProofFile?: File
  printReceipt: boolean
  printWindow?: Window | null
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
  const [isSeniorPwd, setIsSeniorPwd] = useState(false)
  const [seniorPwdIdNumber, setSeniorPwdIdNumber] = useState('')
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState('')
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
  const [paymentProofPreview, setPaymentProofPreview] = useState('')
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [printReceipt, setPrintReceipt] = useState(true)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStaff, setLoadingStaff] = useState(true)
  const items = useCartStore((state) => state.items)
  const toggleSeniorPwd = useCartStore((state) => state.toggleSeniorPwd)
  const setAllSeniorPwdEligibility = useCartStore((state) => state.setAllSeniorPwdEligibility)
  const supabase = createClient()

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error

      if (data && data.length > 0) {
        setStaff(data)
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

  const orderBreakdown = calculateOrderBreakdown(items)
  const amountDue = orderBreakdown.totalAmountDue || total
  const discountAmount = orderBreakdown.totalDiscounts
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!processedBy) {
      return
    }

    const cashReceivedNumber = paymentMethod === 'cash'
      ? Number(cashReceived || 0)
      : amountDue

    if (paymentMethod === 'cash' && cashReceivedNumber < amountDue) {
      return
    }

    const printWindow = printReceipt
      ? window.open('', '_blank', 'width=350,height=650')
      : null

    setLoading(true)
    await onComplete({
      paymentMethod,
      processedBy,
      customerName: customerName || undefined,
      isSeniorPwd,
      seniorPwdIdNumber: seniorPwdIdNumber || undefined,
      paymentReferenceNumber: paymentReferenceNumber || undefined,
      paymentProofFile: paymentProofFile || undefined,
      printReceipt,
      printWindow,
    })
    setLoading(false)
  }

  const addCashShortcut = (value: number) => {
    setCashReceived((prev) => {
      const current = Number(prev || 0)
      return (current + value).toFixed(2)
    })
  }

  const handleCameraCapture = async (imageBlob: Blob | null) => {
    setShowCameraModal(false)

    if (!imageBlob) {
      return
    }

    const file = new File([imageBlob], `payment-proof-${Date.now()}.jpg`, {
      type: imageBlob.type || 'image/jpeg'
    })

    setPaymentProofFile(file)
    setPaymentProofPreview(URL.createObjectURL(file))
  }

  const removePaymentProof = () => {
    setPaymentProofFile(null)
    setPaymentProofPreview('')
  }

  const cashReceivedNumber = paymentMethod === 'cash'
    ? Number(cashReceived || 0)
    : 0
  const changeAmount = paymentMethod === 'cash'
    ? Math.max(cashReceivedNumber - amountDue, 0)
    : 0
  const isCashShort = paymentMethod === 'cash' && cashReceivedNumber > 0 && cashReceivedNumber < amountDue

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="modal-overlay absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <form onSubmit={handleSubmit} className="relative w-full max-w-6xl max-h-[96vh] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-brand-border px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Checkout</p>
            <h2 className="text-xl font-semibold text-brand-text">Complete Order</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-brand-background">
            <X className="w-5 h-5 text-brand-text-secondary" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.95fr]">
            <section className="space-y-4">
              <div className="rounded-2xl bg-brand-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">Order Summary</p>
                    <h3 className="mt-1 text-lg font-semibold text-brand-text">{itemCount} item{itemCount !== 1 ? 's' : ''}</h3>
                  </div>
                  <div className="rounded-2xl bg-brand-primary/10 px-4 py-3 text-right">
                    <p className="text-xs text-brand-text-secondary">Amount Due</p>
                    <p className="text-2xl font-bold text-brand-primary">₱{amountDue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1 sm:max-h-[460px]">
                {items.map((item) => {
                  const lineBreakdown = calculateLineBreakdown(item)
                  const addonTotal = (item.addons || []).reduce((sum, addon) => sum + addon.price, 0)

                  return (
                    <div key={item.id} className="rounded-2xl border border-brand-border bg-brand-background p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-brand-text">{item.productName}</h4>
                          {item.variantName && (
                            <p className="text-sm text-brand-text-secondary">{item.variantName}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-brand-text">₱{lineBreakdown.lineFinalAmount.toFixed(2)}</span>
                      </div>

                      <label className="mt-3 flex items-center gap-2 text-sm text-brand-text-secondary">
                        <input
                          type="checkbox"
                          checked={!!item.isSeniorPwdEligible}
                          onChange={() => toggleSeniorPwd(item.id)}
                          className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                        />
                        Apply Senior / PWD discount to this item
                      </label>

                      {item.addons.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.addons.map((addon) => (
                            <div key={addon.id} className="flex items-center justify-between text-xs text-brand-text-secondary">
                              <span>+ {addon.name}</span>
                              <span>₱{addon.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-brand-text-secondary">{item.quantity} × ₱{(item.price + addonTotal).toFixed(2)}</span>
                        {item.isSeniorPwdEligible && (
                          <span className="rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700">Senior/PWD</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-2xl border border-brand-border bg-white p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-secondary">Gross Sales</span>
                    <span className="font-medium">₱{orderBreakdown.grossAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-secondary">VAT Amount</span>
                    <span className="font-medium">₱{orderBreakdown.vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-secondary">VAT-Exempt Sales</span>
                    <span className="font-medium">₱{orderBreakdown.vatExemptSales.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-700">
                    <span className="font-medium">Discount Applied</span>
                    <span className="font-semibold">-₱{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-brand-border pt-2">
                    <span className="font-semibold text-brand-text">Total Due</span>
                    <span className="text-base font-bold text-brand-primary">₱{amountDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-2xl bg-brand-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">Payment</p>
                    <h3 className="mt-1 text-base font-semibold text-brand-text">Choose payment method</h3>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 text-right">
                    <p className="text-[10px] text-brand-text-secondary">Due now</p>
                    <p className="font-semibold text-brand-text">₱{amountDue.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-left transition-all ${
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

              {paymentMethod === 'cash' && (
                <div className="rounded-2xl border border-brand-border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-brand-text">Cash Received</label>
                    <button
                      type="button"
                      onClick={() => setCashReceived(amountDue.toFixed(2))}
                      className="text-xs font-semibold text-brand-primary"
                    >
                      Exact Amount
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="input-field mt-2"
                    placeholder="0.00"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[50, 100, 500, 1000].map((shortcut) => (
                      <button
                        key={shortcut}
                        type="button"
                        onClick={() => addCashShortcut(shortcut)}
                        className="rounded-xl border border-brand-border bg-brand-background px-3 py-2 text-xs font-semibold text-brand-text-secondary hover:bg-brand-primary/5"
                      >
                        +₱{shortcut}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCashReceived('')}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-background px-3 py-2 text-sm">
                    <span className="text-brand-text-secondary">Change</span>
                    <span className={`font-semibold ${changeAmount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      ₱{changeAmount.toFixed(2)}
                    </span>
                  </div>
                  {isCashShort && (
                    <p className="mt-2 text-xs text-red-500">Amount received is less than the total due.</p>
                  )}
                </div>
              )}

              {paymentMethod !== 'cash' && (
                <div className="rounded-2xl border border-brand-border bg-white p-4 space-y-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Reference Number <span className="text-brand-text-muted">(optional)</span></label>
                    <input
                      type="text"
                      value={paymentReferenceNumber}
                      onChange={(e) => setPaymentReferenceNumber(e.target.value)}
                      className="input-field"
                      placeholder="Ref number / transaction ID"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Payment Proof <span className="text-brand-text-muted">(camera)</span></label>
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-primary/40 bg-brand-primary/5 px-4 py-3 text-sm font-medium text-brand-primary"
                    >
                      <Camera className="w-4 h-4" />
                      Take Photo of Reference
                    </button>
                    {paymentProofPreview && (
                      <div className="mt-3 space-y-2">
                        <img src={paymentProofPreview} alt="Payment proof preview" className="h-32 w-full rounded-xl object-cover" />
                        <button
                          type="button"
                          onClick={removePaymentProof}
                          className="flex items-center gap-1 text-sm font-medium text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-brand-border bg-white p-4 space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-text">Processed By</label>
                  {loadingStaff ? (
                    <div className="input-field flex items-center gap-2 text-brand-text-muted">
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-brand-primary/20 border-t-brand-primary" />
                      Loading staff...
                    </div>
                  ) : staff.length === 0 ? (
                    <div className="input-field bg-yellow-50 text-brand-text-muted border-yellow-200">⚠️ No staff profiles found.</div>
                  ) : (
                    <select value={processedBy} onChange={(e) => setProcessedBy(e.target.value)} className="input-field" required>
                      <option value="">Select staff</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>{s.full_name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-text">Customer Name <span className="text-brand-text-muted">(optional)</span></label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input-field" placeholder="Walk-in customer" />
                </div>
              </div>

              <div className="rounded-2xl border border-brand-border bg-brand-background p-4">
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = !isSeniorPwd
                    setIsSeniorPwd(nextValue)
                    setAllSeniorPwdEligibility(nextValue)
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium ${
                    isSeniorPwd ? 'bg-amber-50 text-amber-800' : 'bg-white text-brand-text-secondary'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4" />
                    Senior / PWD Discount
                  </span>
                  <span>{isSeniorPwd ? 'Enabled' : 'Disabled'}</span>
                </button>
                {isSeniorPwd && (
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-medium text-brand-text-secondary">Senior/PWD ID Number <span className="text-brand-text-muted">(optional)</span></label>
                    <input type="text" value={seniorPwdIdNumber} onChange={(e) => setSeniorPwdIdNumber(e.target.value)} className="input-field" placeholder="Optional ID number" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-brand-background p-4">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-brand-text-secondary" />
                  <span className="text-sm font-medium text-brand-text">Print Receipt</span>
                </div>
                <button type="button" onClick={() => setPrintReceipt(!printReceipt)} className={`relative h-6 w-12 rounded-full transition-colors ${printReceipt ? 'bg-brand-primary' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${printReceipt ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading || !processedBy || staff.length === 0 || (paymentMethod === 'cash' && cashReceivedNumber < amountDue)} className="btn-primary flex-1">
                  {loading ? 'Processing...' : 'Complete Order'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </form>
      {showCameraModal && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCameraModal(false)}
          allowSkip={true}
        />
      )}
    </div>
  )
}