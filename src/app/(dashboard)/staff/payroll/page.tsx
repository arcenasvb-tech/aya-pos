// src/app/(dashboard)/staff/payroll/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/dateUtils'
import { Plus, Calculator, DollarSign, Users, Clock, Download, ChevronDown, ChevronRight, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface PayrollPeriod {
  id: string
  start_date: string
  end_date: string
  pay_frequency: string
  status: string
  total_amount: number | null
  created_at: string
  entries?: PayrollEntry[]
}

interface PayrollEntry {
  id: string
  staff_id: string
  staff_name: string
  total_hours: number
  regular_hours: number
  overtime_hours: number
  hourly_rate: number
  gross_pay: number
  deductions: number
  deduction_breakdown: {
    sss: number
    pagibig: number
    philhealth: number
    tin: number
    other: number
    other_label: string
  }
  net_pay: number
}

const PAY_FREQUENCIES = [
  { id: 'weekly', name: 'Weekly' },
  { id: 'biweekly', name: 'Bi-weekly' },
  { id: 'bimonthly', name: 'Bi-monthly' },
  { id: 'monthly', name: 'Monthly' },
]

export default function PayrollPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    pay_frequency: 'biweekly',
  })

  useEffect(() => {
    fetchPeriods()
    fetchStaff()
  }, [])

  const fetchPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select(`
          *,
          entries:payroll_entries(
            *,
            staff:staff_id(full_name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPeriods(data?.map(period => ({
        ...period,
        entries: period.entries?.map((entry: any) => ({
          ...entry,
          staff_name: entry.staff?.full_name || 'Unknown',
          regular_hours: entry.total_hours > 8 ? 8 : entry.total_hours,
          overtime_hours: entry.total_hours > 8 ? entry.total_hours - 8 : 0,
        }))
      })) || [])
    } catch (error) {
      console.error('Error fetching periods:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, hourly_rate')
      .eq('is_active', true)
      .order('full_name')
    setStaff(data || [])
  }

  const calculateDeductions = async (staffId: string, grossPay: number): Promise<{ total: number; breakdown: any }> => {
    try {
      const { data: settings } = await supabase
        .from('deduction_settings')
        .select('*')
        .eq('staff_id', staffId)
        .single()

      if (!settings) return { total: 0, breakdown: { sss: 0, pagibig: 0, philhealth: 0, tin: 0, other: 0, other_label: '' } }

      const breakdown = {
        sss: 0,
        pagibig: 0,
        philhealth: 0,
        tin: 0,
        other: 0,
        other_label: '',
      }

      if (settings.sss_enabled) {
        breakdown.sss = settings.sss_is_percentage ? grossPay * (settings.sss_amount / 100) : settings.sss_amount
      }
      if (settings.pagibig_enabled) {
        breakdown.pagibig = settings.pagibig_is_percentage ? grossPay * (settings.pagibig_amount / 100) : settings.pagibig_amount
      }
      if (settings.philhealth_enabled) {
        breakdown.philhealth = settings.philhealth_is_percentage ? grossPay * (settings.philhealth_amount / 100) : settings.philhealth_amount
      }
      if (settings.tin_enabled) {
        breakdown.tin = settings.tin_is_percentage ? grossPay * (settings.tin_amount / 100) : settings.tin_amount
      }
      if (settings.other_deductions_enabled) {
        breakdown.other = settings.other_deductions_is_percentage ? grossPay * (settings.other_deductions_amount / 100) : settings.other_deductions_amount
        breakdown.other_label = settings.other_deductions_label || 'Other'
      }

      const total = Object.values(breakdown).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)
      return { total, breakdown }
    } catch {
      return { total: 0, breakdown: { sss: 0, pagibig: 0, philhealth: 0, tin: 0, other: 0, other_label: '' } }
    }
  }

  const calculatePayroll = async (periodId: string, startDate: string, endDate: string) => {
    try {
      const entries: any[] = []

      for (const member of staff) {
        const { data: timeEntries } = await supabase
          .from('time_entries')
          .select('hours_worked, regular_hours, overtime_hours')
          .eq('staff_id', member.id)
          .gte('clock_in', startDate)
          .lte('clock_out', endDate)
          .eq('status', 'completed')

        const totalHours = timeEntries?.reduce((sum, entry) => sum + (entry.hours_worked || 0), 0) || 0
        const overtimeHours = timeEntries?.reduce((sum, entry) => sum + (entry.overtime_hours || 0), 0) || 0
        
        if (totalHours > 0 && member.hourly_rate) {
          // Calculate overtime pay (1.5x for hours over 8)
          const regularHours = totalHours - overtimeHours
          const grossPay = (regularHours * member.hourly_rate) + (overtimeHours * member.hourly_rate * 1.5)
          
          // Calculate deductions
          const { total: deductions, breakdown } = await calculateDeductions(member.id, grossPay)
          const netPay = grossPay - deductions

          entries.push({
            payroll_period_id: periodId,
            staff_id: member.id,
            total_hours: Math.round(totalHours * 100) / 100,
            regular_hours: Math.round(regularHours * 100) / 100,
            overtime_hours: Math.round(overtimeHours * 100) / 100,
            hourly_rate: member.hourly_rate,
            gross_pay: Math.round(grossPay * 100) / 100,
            deductions: Math.round(deductions * 100) / 100,
            deduction_breakdown: breakdown,
            net_pay: Math.round(netPay * 100) / 100,
          })
        }
      }

      if (entries.length > 0) {
        // Delete existing entries first
        await supabase.from('payroll_entries').delete().eq('payroll_period_id', periodId)
        
        // Insert new entries
        const { error } = await supabase.from('payroll_entries').insert(entries)
        if (error) throw error

        const totalAmount = entries.reduce((sum, e) => sum + e.net_pay, 0)
        await supabase
          .from('payroll_periods')
          .update({ total_amount: Math.round(totalAmount * 100) / 100, status: 'processed' })
          .eq('id', periodId)
      }

      toast.success('Payroll calculated with deductions!')
      fetchPeriods()
    } catch (error: any) {
      toast.error('Failed to calculate: ' + error.message)
    }
  }

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .insert(formData)
        .select()
        .single()

      if (error) throw error

      toast.success('Payroll period created!')
      setShowForm(false)
      setFormData({ start_date: '', end_date: '', pay_frequency: 'biweekly' })
      fetchPeriods()

      if (data) {
        await calculatePayroll(data.id, data.start_date, data.end_date)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create period')
    }
  }

  const handleDeletePeriod = async (periodId: string) => {
    if (!confirm('Are you sure you want to delete this payroll period? All entries will be permanently removed.')) return
    
    try {
      // Delete entries first
      await supabase.from('payroll_entries').delete().eq('payroll_period_id', periodId)
      // Delete period
      const { error } = await supabase.from('payroll_periods').delete().eq('id', periodId)
      if (error) throw error
      
      toast.success('Payroll period deleted')
      setExpandedPeriod(null)
      fetchPeriods()
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message)
    }
  }

  const handleStatusChange = async (periodId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('payroll_periods')
        .update({ status })
        .eq('id', periodId)
      if (error) throw error
      toast.success(`Period marked as ${status}`)
      fetchPeriods()
    } catch (error: any) {
      toast.error('Failed to update')
    }
  }

  const handleExport = (period: PayrollPeriod) => {
    const csv = [
      'Staff,Regular Hours,OT Hours,Hourly Rate,Gross Pay,SSS,Pag-IBIG,PhilHealth,Tax,Other Deductions,Net Pay',
      ...(period.entries || []).map(e => 
        `${e.staff_name},${(e.regular_hours || 0).toFixed(1)},${(e.overtime_hours || 0).toFixed(1)},${e.hourly_rate.toFixed(2)},${e.gross_pay.toFixed(2)},${e.deduction_breakdown?.sss?.toFixed(2) || '0.00'},${e.deduction_breakdown?.pagibig?.toFixed(2) || '0.00'},${e.deduction_breakdown?.philhealth?.toFixed(2) || '0.00'},${e.deduction_breakdown?.tin?.toFixed(2) || '0.00'},${e.deduction_breakdown?.other?.toFixed(2) || '0.00'},${e.net_pay.toFixed(2)}`
      ),
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-${period.start_date}-to-${period.end_date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">Payroll</h1>
          <p className="text-brand-text-secondary">Manage pay periods, deductions, and staff salaries</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-5 h-5" /> New Pay Period
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm text-brand-text-secondary mb-1"><DollarSign className="w-4 h-4" />Total Payroll</div>
          <p className="text-2xl font-bold text-brand-text">{formatCurrency(periods.reduce((sum, p) => sum + (p.total_amount || 0), 0))}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm text-brand-text-secondary mb-1"><Users className="w-4 h-4" />Staff</div>
          <p className="text-2xl font-bold text-brand-text">{staff.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm text-brand-text-secondary mb-1"><Clock className="w-4 h-4" />Pending</div>
          <p className="text-2xl font-bold text-yellow-600">{periods.filter(p => p.status === 'pending' || p.status === 'processed').length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm text-brand-text-secondary mb-1"><Calculator className="w-4 h-4" />Paid</div>
          <p className="text-2xl font-bold text-green-600">{periods.filter(p => p.status === 'paid').length}</p>
        </div>
      </div>

      {/* Payroll Periods */}
      {loading ? (
        <div className="text-center py-16"><div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto" /></div>
      ) : periods.length === 0 ? (
        <div className="card text-center py-16">
          <DollarSign className="w-16 h-16 text-brand-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-brand-text mb-2">No payroll periods</h3>
          <p className="text-brand-text-secondary">Create your first pay period</p>
        </div>
      ) : (
        <div className="space-y-4">
          {periods.map((period) => (
            <div key={period.id} className="card">
              {/* Period Header */}
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedPeriod(expandedPeriod === period.id ? null : period.id)}>
                <div className="flex items-center gap-4">
                  {expandedPeriod === period.id ? <ChevronDown className="w-5 h-5 text-brand-text-secondary" /> : <ChevronRight className="w-5 h-5 text-brand-text-secondary" />}
                  <div>
                    <h3 className="font-semibold text-brand-text">{formatDate(period.start_date, 'MMM dd')} - {formatDate(period.end_date, 'MMM dd, yyyy')}</h3>
                    <span className="text-sm text-brand-text-secondary capitalize">{period.pay_frequency} • {period.entries?.length || 0} staff</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-brand-text">{period.total_amount ? formatCurrency(period.total_amount) : '-'}</span>
                  <span className={`badge text-xs ${period.status === 'paid' ? 'bg-green-50 text-green-700' : period.status === 'processed' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'}`}>{period.status}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedPeriod === period.id && (
                <div className="mt-6 pt-6 border-t border-brand-border">
                  {period.entries && period.entries.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-brand-border bg-brand-background/50">
                              <th className="text-left p-3 text-xs font-semibold text-brand-text-secondary uppercase">Staff</th>
                              <th className="text-center p-3 text-xs font-semibold text-brand-text-secondary uppercase">Reg Hrs</th>
                              <th className="text-center p-3 text-xs font-semibold text-brand-text-secondary uppercase">OT Hrs</th>
                              <th className="text-right p-3 text-xs font-semibold text-brand-text-secondary uppercase">Rate</th>
                              <th className="text-right p-3 text-xs font-semibold text-brand-text-secondary uppercase">Gross</th>
                              <th className="text-right p-3 text-xs font-semibold text-brand-text-secondary uppercase">Deductions</th>
                              <th className="text-right p-3 text-xs font-semibold text-brand-text-secondary uppercase">Net Pay</th>
                            </tr>
                          </thead>
                          <tbody>
                            {period.entries.map((entry) => (
                              <tr key={entry.id} className="border-b border-brand-border/50 hover:bg-brand-background/30">
                                <td className="p-3 font-medium text-brand-text">{entry.staff_name}</td>
                                <td className="p-3 text-center text-brand-text-secondary">{(entry.regular_hours || 0).toFixed(1)}h</td>
                                <td className="p-3 text-center">
                                  {(entry.overtime_hours || 0) > 0 ? (
                                    <span className="text-amber-600 font-medium">{(entry.overtime_hours || 0).toFixed(1)}h</span>
                                  ) : <span className="text-brand-text-muted">-</span>}
                                </td>
                                <td className="p-3 text-right text-brand-text-secondary">{formatCurrency(entry.hourly_rate)}</td>
                                <td className="p-3 text-right font-medium">{formatCurrency(entry.gross_pay)}</td>
                                <td className="p-3 text-right text-red-500 font-medium">-{formatCurrency(entry.deductions)}</td>
                                <td className="p-3 text-right font-bold text-brand-text">{formatCurrency(entry.net_pay)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Deduction Breakdown Summary */}
                      <div className="mt-4 p-4 bg-brand-background rounded-xl">
                        <h4 className="text-sm font-semibold text-brand-text mb-3">Deduction Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                          {period.entries.map((entry) => (
                            <div key={entry.id} className="space-y-1">
                              <p className="font-medium text-brand-text truncate">{entry.staff_name}</p>
                              {entry.deduction_breakdown?.sss > 0 && <p className="text-brand-text-secondary">SSS: ₱{entry.deduction_breakdown.sss.toFixed(2)}</p>}
                              {entry.deduction_breakdown?.pagibig > 0 && <p className="text-brand-text-secondary">Pag-IBIG: ₱{entry.deduction_breakdown.pagibig.toFixed(2)}</p>}
                              {entry.deduction_breakdown?.philhealth > 0 && <p className="text-brand-text-secondary">PhilHealth: ₱{entry.deduction_breakdown.philhealth.toFixed(2)}</p>}
                              {entry.deduction_breakdown?.tin > 0 && <p className="text-brand-text-secondary">Tax: ₱{entry.deduction_breakdown.tin.toFixed(2)}</p>}
                              {entry.deduction_breakdown?.other > 0 && <p className="text-brand-text-secondary">{entry.deduction_breakdown.other_label}: ₱{entry.deduction_breakdown.other.toFixed(2)}</p>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-brand-border">
                        <button onClick={() => calculatePayroll(period.id, period.start_date, period.end_date)} className="btn-secondary text-sm flex items-center gap-2">
                          <Calculator className="w-4 h-4" /> Recalculate
                        </button>
                        {period.status !== 'paid' && (
                          <button onClick={() => handleStatusChange(period.id, 'paid')} className="btn-primary text-sm flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Mark as Paid
                          </button>
                        )}
                        <button onClick={() => handleExport(period)} className="btn-ghost text-sm flex items-center gap-2">
                          <Download className="w-4 h-4" /> Export
                        </button>
                        <button onClick={() => handleDeletePeriod(period.id)} className="btn-ghost text-sm flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-brand-text-secondary mb-4">No entries calculated yet</p>
                      <button onClick={() => calculatePayroll(period.id, period.start_date, period.end_date)} className="btn-primary">Calculate Payroll</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Period Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="modal-content relative bg-white rounded-2xl shadow-medium max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-brand-text">New Pay Period</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-brand-background rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreatePeriod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Pay Frequency</label>
                <select value={formData.pay_frequency} onChange={(e) => setFormData({ ...formData, pay_frequency: e.target.value })} className="input-field">
                  {PAY_FREQUENCIES.map((freq) => (<option key={freq.id} value={freq.id}>{freq.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Start Date</label>
                <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">End Date</label>
                <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="input-field" required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create & Calculate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}