// src/app/(dashboard)/reports/attendance/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatTime } from '@/lib/utils/dateUtils'
import { Clock, Users, Calendar, AlertCircle, CheckCircle, Download, Edit2, Trash2, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AttendanceReportsPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const [selectedStaff, setSelectedStaff] = useState('all')
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchStaff()
    fetchEntries()
  }, [dateRange, selectedStaff])

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name')
    setStaff(data || [])
  }

  const fetchEntries = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          staff:staff_id(full_name)
        `)
        .gte('clock_in', dateRange.start)
        .lte('clock_in', dateRange.end + 'T23:59:59')
        .order('clock_in', { ascending: false })

      if (selectedStaff !== 'all') {
        query = query.eq('staff_id', selectedStaff)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Calculate overtime for each entry
      const processedData = (data || []).map(entry => ({
        ...entry,
        regular_hours: entry.regular_hours || (entry.hours_worked ? Math.min(entry.hours_worked, 8) : 0),
        overtime_hours: entry.overtime_hours || (entry.hours_worked ? Math.max(0, entry.hours_worked - 8) : 0),
      }))
      
      setEntries(processedData)
    } catch (error) {
      console.error('Error fetching entries:', error)
      toast.error('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (entry: any) => {
    setEditingEntry({
      ...entry,
      clock_in_time: entry.clock_in ? new Date(entry.clock_in).toISOString().slice(0, 16) : '',
      clock_out_time: entry.clock_out ? new Date(entry.clock_out).toISOString().slice(0, 16) : '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingEntry) return
    
    try {
      const clockIn = new Date(editingEntry.clock_in_time).toISOString()
      const clockOut = new Date(editingEntry.clock_out_time).toISOString()
      
      // Calculate hours
      const diffMs = new Date(clockOut).getTime() - new Date(clockIn).getTime()
      const totalHours = diffMs / (1000 * 60 * 60)
      const regularHours = Math.min(totalHours, 8)
      const overtimeHours = Math.max(0, totalHours - 8)

      const { error } = await supabase
        .from('time_entries')
        .update({
          clock_in: clockIn,
          clock_out: clockOut,
          hours_worked: Math.round(totalHours * 100) / 100,
          regular_hours: Math.round(regularHours * 100) / 100,
          overtime_hours: Math.round(overtimeHours * 100) / 100,
          status: 'completed'
        })
        .eq('id', editingEntry.id)

      if (error) throw error
      toast.success('Entry updated!')
      setEditingEntry(null)
      fetchEntries()
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry? This cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Entry deleted')
      fetchEntries()
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message)
    }
  }

  const totalHours = entries.reduce((sum, e) => sum + (e.hours_worked || 0), 0)
  const totalRegularHours = entries.reduce((sum, e) => sum + (e.regular_hours || 0), 0)
  const totalOvertimeHours = entries.reduce((sum, e) => sum + (e.overtime_hours || 0), 0)
  const presentStaff = new Set(entries.map(e => e.staff_id)).size

  const handleExport = () => {
    const csv = [
      'Staff,Date,Clock In,Clock Out,Regular Hours,Overtime Hours,Total Hours,Status',
      ...entries.map(e => 
        `${e.staff?.full_name},${formatDate(e.clock_in)},${formatTime(e.clock_in)},${e.clock_out ? formatTime(e.clock_out) : 'Active'},${(e.regular_hours || 0).toFixed(1)},${(e.overtime_hours || 0).toFixed(1)},${(e.hours_worked || 0).toFixed(1)},${e.status}`
      ),
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${dateRange.start}-to-${dateRange.end}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatToAMPM = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })
  }

  const formatHours = (hours: number | null) => {
    if (!hours) return '0.0h'
    return `${hours.toFixed(1)}h`
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">Attendance Reports</h1>
          <p className="text-brand-text-secondary">Track staff attendance, hours, and overtime</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-text-secondary" />
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="input-field w-44" />
          <span className="text-brand-text-secondary">to</span>
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="input-field w-44" />
        </div>
        <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="input-field w-full sm:w-48">
          <option value="all">All Staff</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-brand-text-secondary mb-1">Total Hours</p>
          <p className="text-xl font-bold text-brand-text">{formatHours(totalHours)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-brand-text-secondary mb-1">Regular Hours</p>
          <p className="text-xl font-bold text-blue-600">{formatHours(totalRegularHours)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-brand-text-secondary mb-1">Overtime</p>
          <p className="text-xl font-bold text-amber-600">{formatHours(totalOvertimeHours)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-brand-text-secondary mb-1">Staff Present</p>
          <p className="text-xl font-bold text-green-600">{presentStaff}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-brand-text-secondary mb-1">Entries</p>
          <p className="text-xl font-bold text-brand-text">{entries.length}</p>
        </div>
      </div>

      {/* Entries Table */}
      {loading ? (
        <div className="text-center py-16"><div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto" /></div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-16">
          <Clock className="w-16 h-16 text-brand-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-brand-text mb-2">No records</h3>
          <p className="text-brand-text-secondary">No attendance entries for this period</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border bg-brand-background/50">
                  <th className="text-left p-4 text-xs font-semibold text-brand-text-secondary uppercase">Staff</th>
                  <th className="text-left p-4 text-xs font-semibold text-brand-text-secondary uppercase">Date</th>
                  <th className="text-left p-4 text-xs font-semibold text-brand-text-secondary uppercase">Clock In</th>
                  <th className="text-left p-4 text-xs font-semibold text-brand-text-secondary uppercase">Clock Out</th>
                  <th className="text-center p-4 text-xs font-semibold text-brand-text-secondary uppercase">Regular</th>
                  <th className="text-center p-4 text-xs font-semibold text-brand-text-secondary uppercase">Overtime</th>
                  <th className="text-center p-4 text-xs font-semibold text-brand-text-secondary uppercase">Status</th>
                  <th className="text-right p-4 text-xs font-semibold text-brand-text-secondary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-brand-border/50 hover:bg-brand-background/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center text-xs font-bold text-brand-primary">
                          {entry.staff?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="font-medium text-brand-text text-sm">{entry.staff?.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-brand-text-secondary">{formatDate(entry.clock_in, 'MMM dd, yyyy')}</td>
                    <td className="p-4 text-sm font-medium">{formatToAMPM(entry.clock_in)}</td>
                    <td className="p-4 text-sm font-medium">
                      {entry.clock_out ? formatToAMPM(entry.clock_out) : (
                        <span className="text-green-600 font-medium">Active</span>
                      )}
                    </td>
                    <td className="p-4 text-center text-sm font-medium text-blue-600">{formatHours(entry.regular_hours)}</td>
                    <td className="p-4 text-center text-sm font-medium">
                      {(entry.overtime_hours || 0) > 0 ? (
                        <span className="text-amber-600 font-semibold">{formatHours(entry.overtime_hours)}</span>
                      ) : (
                        <span className="text-brand-text-muted">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`badge text-xs ${entry.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-brand-background text-brand-text-secondary'}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(entry)} className="p-2 hover:bg-brand-background rounded-lg text-brand-text-secondary hover:text-brand-primary">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(entry.id)} className="p-2 hover:bg-red-50 rounded-lg text-brand-text-secondary hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setEditingEntry(null)} />
          <div className="modal-content relative bg-white rounded-2xl shadow-medium max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-brand-text mb-4">Edit Time Entry</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Staff</label>
                <input type="text" value={editingEntry.staff?.full_name || ''} disabled className="input-field bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Clock In</label>
                <input
                  type="datetime-local"
                  value={editingEntry.clock_in_time}
                  onChange={(e) => setEditingEntry({ ...editingEntry, clock_in_time: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Clock Out</label>
                <input
                  type="datetime-local"
                  value={editingEntry.clock_out_time}
                  onChange={(e) => setEditingEntry({ ...editingEntry, clock_out_time: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingEntry(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSaveEdit} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}