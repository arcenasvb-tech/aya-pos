// src/app/(dashboard)/staff/management/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Users, Search, Phone, Calendar, Clock, UserX, UserCheck, Camera, DollarSign, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

interface StaffMember {
  id: string
  username: string | null
  full_name: string
  role: string
  phone: string | null
  address: string | null
  avatar_url: string | null
  hourly_rate: number | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
}

interface DeductionSettings {
  sss_enabled: boolean; sss_amount: number; sss_is_percentage: boolean
  pagibig_enabled: boolean; pagibig_amount: number; pagibig_is_percentage: boolean
  philhealth_enabled: boolean; philhealth_amount: number; philhealth_is_percentage: boolean
  tin_enabled: boolean; tin_amount: number; tin_is_percentage: boolean
  other_deductions_enabled: boolean; other_deductions_label: string
  other_deductions_amount: number; other_deductions_is_percentage: boolean
}

const defaultDeductions: DeductionSettings = {
  sss_enabled: false, sss_amount: 0, sss_is_percentage: false,
  pagibig_enabled: false, pagibig_amount: 0, pagibig_is_percentage: false,
  philhealth_enabled: false, philhealth_amount: 0, philhealth_is_percentage: false,
  tin_enabled: false, tin_amount: 0, tin_is_percentage: false,
  other_deductions_enabled: false, other_deductions_label: '', other_deductions_amount: 0, other_deductions_is_percentage: false,
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [showDeductions, setShowDeductions] = useState<string | null>(null)
  const [deductionSettings, setDeductionSettings] = useState<DeductionSettings>(defaultDeductions)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    username: '', password: '', full_name: '', role: 'staff',
    phone: '', address: '', hourly_rate: 0, start_date: '', end_date: '',
  })

  useEffect(() => { fetchStaff() }, [])

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name')
      if (error) throw error
      setStaff(data || [])
    } catch (error) { console.error('Error fetching staff:', error) }
    finally { setLoading(false) }
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileName = `avatar-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const { error } = await supabase.storage.from('staff-avatars').upload(fileName, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('staff-avatars').getPublicUrl(fileName)
      return publicUrl
    } catch { toast.error('Failed to upload avatar'); return null }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let avatarUrl = editingStaff?.avatar_url || null
      if (avatarFile) { const u = await uploadAvatar(avatarFile); if (u) avatarUrl = u }

      if (editingStaff) {
        await supabase.from('profiles').update({
          username: formData.username.toLowerCase(), full_name: formData.full_name,
          role: formData.role, phone: formData.phone || null, address: formData.address || null,
          hourly_rate: formData.hourly_rate || null, start_date: formData.start_date || null,
          end_date: formData.end_date || null, avatar_url: avatarUrl,
        }).eq('id', editingStaff.id)
        if (formData.password) {
          await supabase.auth.admin.updateUserById(editingStaff.id, { password: formData.password })
        }
        toast.success('Staff updated!')
      } else {
        const email = `${formData.username.toLowerCase()}@aya.local`
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: formData.password })
        if (authError) throw authError
        if (authData.user) {
          await supabase.from('profiles').insert({
            id: authData.user.id, username: formData.username.toLowerCase(),
            full_name: formData.full_name, role: formData.role,
            phone: formData.phone || null, address: formData.address || null,
            hourly_rate: formData.hourly_rate || null, start_date: formData.start_date || null,
            end_date: formData.end_date || null, avatar_url: avatarUrl, is_active: true,
          })
          toast.success('Staff created!')
        }
      }
      setShowForm(false); setEditingStaff(null); setAvatarFile(null); setAvatarPreview(null); resetForm(); fetchStaff()
    } catch (error: any) { toast.error(error.message || 'Failed to save') }
  }

  const handleDelete = async (member: StaffMember) => {
    if (!confirm(`Remove ${member.full_name}? They will be deactivated.`)) return
    try {
      await supabase.from('profiles').update({ is_active: false, end_date: new Date().toISOString().split('T')[0] }).eq('id', member.id)
      toast.success('Staff deactivated'); fetchStaff()
    } catch (error: any) { toast.error('Failed: ' + error.message) }
  }

  const handleReactivate = async (member: StaffMember) => {
    try {
      await supabase.from('profiles').update({ is_active: true, end_date: null }).eq('id', member.id)
      toast.success('Reactivated!'); fetchStaff()
    } catch (error: any) { toast.error('Failed') }
  }

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member)
    setFormData({
      username: member.username || '', password: '', full_name: member.full_name,
      role: member.role, phone: member.phone || '', address: member.address || '',
      hourly_rate: member.hourly_rate || 0, start_date: member.start_date || '', end_date: member.end_date || '',
    })
    setAvatarPreview(member.avatar_url); setShowForm(true)
  }

  const handleDeductionSettings = async (staffId: string) => {
    setShowDeductions(staffId)
    const { data } = await supabase.from('deduction_settings').select('*').eq('staff_id', staffId).single()
    setDeductionSettings(data || defaultDeductions)
  }

  const handleSaveDeductions = async () => {
    if (!showDeductions) return
    try {
      const { data: existing } = await supabase.from('deduction_settings').select('id').eq('staff_id', showDeductions).single()
      if (existing) await supabase.from('deduction_settings').update(deductionSettings).eq('staff_id', showDeductions)
      else await supabase.from('deduction_settings').insert({ ...deductionSettings, staff_id: showDeductions })
      toast.success('Deduction settings saved!'); setShowDeductions(null)
    } catch (error: any) { toast.error('Failed: ' + error.message) }
  }

  const resetForm = () => setFormData({ username: '', password: '', full_name: '', role: 'staff', phone: '', address: '', hourly_rate: 0, start_date: '', end_date: '' })

  const filteredStaff = staff.filter(m => {
    const match = m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || m.username?.toLowerCase().includes(searchTerm.toLowerCase()) || m.role.toLowerCase().includes(searchTerm.toLowerCase())
    return showInactive ? match : match && m.is_active
  })

  const activeCount = staff.filter(s => s.is_active).length
  const inactiveCount = staff.filter(s => !s.is_active).length

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div><h1 className="text-2xl font-bold text-brand-text mb-2">Staff Management</h1><p className="text-brand-text-secondary">Manage team members, deductions, and profiles</p></div>
        <button onClick={() => { resetForm(); setEditingStaff(null); setAvatarPreview(null); setShowForm(true) }} className="btn-primary flex items-center gap-2 whitespace-nowrap"><Plus className="w-5 h-5" /> Add Staff</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4"><p className="text-sm text-brand-text-secondary">Total</p><p className="text-2xl font-bold text-brand-text">{staff.length}</p></div>
        <div className="card p-4"><p className="text-sm text-brand-text-secondary">Active</p><p className="text-2xl font-bold text-green-600">{activeCount}</p></div>
        <div className="card p-4"><p className="text-sm text-brand-text-secondary">Inactive</p><p className="text-2xl font-bold text-red-600">{inactiveCount}</p></div>
        <div className="card p-4"><p className="text-sm text-brand-text-secondary">Owners</p><p className="text-2xl font-bold text-brand-primary">{staff.filter(s => s.role === 'owner' && s.is_active).length}</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" /><input type="text" placeholder="Search by name, username, or role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-12" /></div>
        <button onClick={() => setShowInactive(!showInactive)} className={`btn-secondary text-sm flex items-center gap-2 whitespace-nowrap ${showInactive ? 'border-brand-primary text-brand-primary' : ''}`}><UserX className="w-4 h-4" />{showInactive ? 'Hide Inactive' : `Show Inactive (${inactiveCount})`}</button>
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto" /></div>
      ) : filteredStaff.length === 0 ? (
        <div className="card text-center py-16"><Users className="w-16 h-16 text-brand-text-muted mx-auto mb-4" /><h3 className="text-lg font-semibold text-brand-text mb-2">No staff found</h3><p className="text-brand-text-secondary">{searchTerm ? 'Try adjusting your search' : 'Add your first team member'}</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <div key={member.id} className={`card overflow-hidden ${!member.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand-background flex items-center justify-center flex-shrink-0">
                  {member.avatar_url ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-brand-text-muted">{member.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</span>}
                </div>
                <div>
                  <h3 className="font-semibold text-brand-text">{member.full_name}</h3>
                  <div className="flex items-center gap-2">
                    {member.username && <span className="text-xs text-brand-text-muted font-mono">@{member.username}</span>}
                    <span className={`badge text-xs ${member.role === 'owner' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-blue-50 text-blue-700'}`}>{member.role}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {member.phone && <div className="flex items-center gap-2 text-sm text-brand-text-secondary"><Phone className="w-4 h-4" /><span>{member.phone}</span></div>}
                {member.start_date && <div className="flex items-center gap-2 text-sm text-brand-text-secondary"><Calendar className="w-4 h-4" /><span>Started: {new Date(member.start_date).toLocaleDateString()}</span></div>}
                {member.hourly_rate ? <div className="flex items-center gap-2 text-sm text-brand-text-secondary"><Clock className="w-4 h-4" /><span>₱{member.hourly_rate.toFixed(2)}/hr</span></div> : null}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                {member.is_active ? (
                  <button onClick={() => handleDelete(member)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"><UserX className="w-3.5 h-3.5" /> Deactivate</button>
                ) : (
                  <button onClick={() => handleReactivate(member)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"><UserCheck className="w-3.5 h-3.5" /> Reactivate</button>
                )}
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDeductionSettings(member.id)} className="p-2 hover:bg-amber-50 rounded-lg text-brand-text-secondary hover:text-amber-600" title="Deductions"><DollarSign className="w-4 h-4" /></button>
                  <button onClick={() => handleEdit(member)} className="p-2 hover:bg-brand-background rounded-lg text-brand-text-secondary hover:text-brand-primary" title="Edit"><Edit2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="modal-content relative bg-white rounded-2xl shadow-medium max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold text-brand-text mb-6">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-brand-background flex items-center justify-center">
                    {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-brand-text-muted" />}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center cursor-pointer hover:bg-brand-primary-hover">
                    <Upload className="w-4 h-4 text-white" />
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)) } }} className="hidden" />
                  </label>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-brand-text mb-1">Username *</label><input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="input-field font-mono" required placeholder="e.g., joemarie" /></div>
              <div><label className="block text-sm font-medium text-brand-text mb-1">{editingStaff ? 'New Password (leave blank)' : 'Password *'}</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" required={!editingStaff} minLength={4} /></div>
              <div><label className="block text-sm font-medium text-brand-text mb-1">Full Name *</label><input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="input-field" required /></div>
              <div><label className="block text-sm font-medium text-brand-text mb-1">Role</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="input-field"><option value="staff">Staff</option><option value="owner">Owner</option></select></div>
              <div><label className="block text-sm font-medium text-brand-text mb-1">Phone</label><input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-brand-text mb-1">Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-brand-text mb-1">Hourly Rate (₱)</label><input type="number" value={formData.hourly_rate || ''} onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })} className="input-field" step="0.01" min="0" /></div>
                <div><label className="block text-sm font-medium text-brand-text mb-1">Start Date</label><input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="input-field" /></div>
              </div>
              <div><label className="block text-sm font-medium text-brand-text mb-1">End Date</label><input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="input-field" /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">{editingStaff ? 'Update' : 'Create'} Staff</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Deduction Settings Modal */}
      {showDeductions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowDeductions(null)} />
          <div className="modal-content relative bg-white rounded-2xl shadow-medium max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold text-brand-text mb-6 flex items-center gap-2"><DollarSign className="w-5 h-5 text-amber-600" /> Deduction Settings</h3>
            <div className="space-y-4">
              {['SSS', 'Pag-IBIG', 'PhilHealth', 'Withholding Tax'].map((label, i) => {
                const keys = ['sss', 'pagibig', 'philhealth', 'tin'] as const
                const k = keys[i]
                return (
                  <div key={k} className="bg-brand-background rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-brand-text">{label}</h4>
                      <button type="button" onClick={() => setDeductionSettings({ ...deductionSettings, [`${k}_enabled`]: !deductionSettings[`${k}_enabled`] })} className={`relative w-12 h-6 rounded-full transition-colors ${deductionSettings[`${k}_enabled`] ? 'bg-brand-primary' : 'bg-gray-300'}`}><div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${deductionSettings[`${k}_enabled`] ? 'translate-x-6' : 'translate-x-0.5'}`} /></button>
                    </div>
                    {deductionSettings[`${k}_enabled`] && (
                      <div className="flex gap-2">
                        <input type="number" value={deductionSettings[`${k}_amount`]} onChange={(e) => setDeductionSettings({ ...deductionSettings, [`${k}_amount`]: parseFloat(e.target.value) || 0 })} className="input-field flex-1 bg-white" placeholder="Amount" step="0.01" />
                        <select value={deductionSettings[`${k}_is_percentage`] ? 'percent' : 'fixed'} onChange={(e) => setDeductionSettings({ ...deductionSettings, [`${k}_is_percentage`]: e.target.value === 'percent' })} className="input-field w-32 bg-white"><option value="fixed">₱ Fixed</option><option value="percent">% of Gross</option></select>
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Other Deductions */}
              <div className="bg-brand-background rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-brand-text">Other Deductions</h4>
                  <button type="button" onClick={() => setDeductionSettings({ ...deductionSettings, other_deductions_enabled: !deductionSettings.other_deductions_enabled })} className={`relative w-12 h-6 rounded-full transition-colors ${deductionSettings.other_deductions_enabled ? 'bg-brand-primary' : 'bg-gray-300'}`}><div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${deductionSettings.other_deductions_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} /></button>
                </div>
                {deductionSettings.other_deductions_enabled && (
                  <div className="space-y-2">
                    <input type="text" value={deductionSettings.other_deductions_label} onChange={(e) => setDeductionSettings({ ...deductionSettings, other_deductions_label: e.target.value })} className="input-field bg-white" placeholder="Label (e.g., Loan Payment)" />
                    <div className="flex gap-2">
                      <input type="number" value={deductionSettings.other_deductions_amount} onChange={(e) => setDeductionSettings({ ...deductionSettings, other_deductions_amount: parseFloat(e.target.value) || 0 })} className="input-field flex-1 bg-white" placeholder="Amount" step="0.01" />
                      <select value={deductionSettings.other_deductions_is_percentage ? 'percent' : 'fixed'} onChange={(e) => setDeductionSettings({ ...deductionSettings, other_deductions_is_percentage: e.target.value === 'percent' })} className="input-field w-32 bg-white"><option value="fixed">₱ Fixed</option><option value="percent">% of Gross</option></select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-brand-border"><button onClick={() => setShowDeductions(null)} className="btn-secondary flex-1">Cancel</button><button onClick={handleSaveDeductions} className="btn-primary flex-1">Save Settings</button></div>
          </div>
        </div>
      )}
    </div>
  )
}