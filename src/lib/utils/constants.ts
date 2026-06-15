// src/lib/utils/constants.ts
export const TIMEZONE = 'Asia/Manila'

export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: 'Banknote' },
  { id: 'gcash', name: 'GCash', icon: 'Smartphone' },
  { id: 'qrph', name: 'QR PH', icon: 'QrCode' },
  { id: 'bank', name: 'Bank Transfer', icon: 'CreditCard' },
  { id: 'other', name: 'Other', icon: 'CreditCard' },
] as const

export const PAY_FREQUENCIES = [
  { id: 'weekly', name: 'Weekly' },
  { id: 'biweekly', name: 'Bi-weekly' },
  { id: 'bimonthly', name: 'Bi-monthly' },
  { id: 'monthly', name: 'Monthly' },
] as const

export const ORDER_STATUSES = {
  completed: { label: 'Completed', color: 'bg-green-50 text-green-700' },
  voided: { label: 'Voided', color: 'bg-red-50 text-red-700' },
  refunded: { label: 'Refunded', color: 'bg-yellow-50 text-yellow-700' },
} as const

export const STAFF_ROLES = [
  { id: 'staff', name: 'Staff' },
  { id: 'owner', name: 'Owner' },
] as const