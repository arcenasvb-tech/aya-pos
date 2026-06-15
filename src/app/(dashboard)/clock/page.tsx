// src/app/(dashboard)/clock/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import CameraCapture from '@/components/clock/CameraCapture'
import { format, differenceInMinutes } from 'date-fns'
import { Clock, LogIn, LogOut, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClockPage() {
  const [currentEntry, setCurrentEntry] = useState<any>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraType, setCameraType] = useState<'in' | 'out'>('in')
  const [todayEntries, setTodayEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTodayEntries()
  }, [])

  const fetchTodayEntries = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('staff_id', userData.user.id)
        .gte('clock_in', today.toISOString())
        .order('clock_in', { ascending: false })

      if (error) throw error

      setTodayEntries(data || [])
      
      // Check if there's an active entry (clocked in but not out, or status is 'active')
      const active = data?.find(entry => entry.status === 'active' || !entry.clock_out)
      setCurrentEntry(active || null)
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClockIn = () => {
    setCameraType('in')
    setShowCamera(true)
  }

  const handleClockOut = () => {
    setCameraType('out')
    setShowCamera(true)
  }

  const handleCameraCapture = async (imageBlob: Blob | null) => {
    setShowCamera(false)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      let photoUrl = null
      if (imageBlob) {
        const fileName = `clock-${cameraType}-${Date.now()}.jpg`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('clock-photos')
          .upload(fileName, imageBlob)

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('clock-photos')
            .getPublicUrl(fileName)
          photoUrl = urlData.publicUrl
        }
      }

      if (cameraType === 'in') {
        // Clock In
        const { data, error } = await supabase
          .from('time_entries')
          .insert({
            staff_id: userData.user.id,
            clock_in: new Date().toISOString(),
            clock_in_photo_url: photoUrl,
            status: 'active'
          })
          .select()
          .single()

        if (error) throw error
        setCurrentEntry(data)
        toast.success('Clocked in successfully!')
        
      } else if (cameraType === 'out') {
        // Clock Out
        if (!currentEntry) {
          toast.error('No active clock-in found')
          return
        }

        const clockOutTime = new Date().toISOString()
        const clockInTime = new Date(currentEntry.clock_in)
        const hoursWorked = differenceInMinutes(new Date(clockOutTime), clockInTime) / 60

        // Update with calculated values directly
        const { data, error } = await supabase
          .from('time_entries')
          .update({
            clock_out: clockOutTime,
            clock_out_photo_url: photoUrl,
            hours_worked: Math.round(hoursWorked * 100) / 100, // Round to 2 decimal places
            status: 'completed'
          })
          .eq('id', currentEntry.id)
          .select()
          .single()

        if (error) throw error
        
        setCurrentEntry(null)
        toast.success(`Clocked out! Hours worked: ${hoursWorked.toFixed(1)}h`)
      }

      fetchTodayEntries()
    } catch (error: any) {
      console.error('Clock error:', error)
      toast.error('Failed to record time entry: ' + error.message)
    }
  }

  const getDuration = (entry: any) => {
    if (entry.hours_worked) {
      return entry.hours_worked * 60 // Convert to minutes for display
    }
    if (!entry.clock_out && entry.status === 'active') {
      return differenceInMinutes(new Date(), new Date(entry.clock_in))
    }
    if (entry.clock_out) {
      return differenceInMinutes(new Date(entry.clock_out), new Date(entry.clock_in))
    }
    return 0
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours === 0) return `${mins}m`
    return `${hours}h ${mins}m`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-brand-primary" />
        </div>
        <h1 className="text-2xl font-bold text-brand-text mb-2">Time Clock</h1>
        <p className="text-brand-text-secondary text-lg">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
        <p className="text-brand-text-muted text-sm mt-1">
          {format(new Date(), 'hh:mm:ss a')}
        </p>
      </div>

      {/* Clock Actions */}
      <div className="card mb-8">
        {currentEntry ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <p className="text-lg font-semibold text-brand-text mb-2">
              Currently Working
            </p>
            <p className="text-brand-text-secondary mb-1">
              Clocked in at {format(new Date(currentEntry.clock_in), 'hh:mm a')}
            </p>
            <p className="text-sm text-brand-text-muted mb-6">
              Duration: {formatDuration(getDuration(currentEntry))}
            </p>
            <button
              onClick={handleClockOut}
              className="btn-primary bg-red-500 hover:bg-red-600 flex items-center gap-2 mx-auto text-lg px-8 py-4"
            >
              <LogOut className="w-5 h-5" />
              Clock Out
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-background rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-brand-text-secondary" />
            </div>
            <p className="text-lg font-semibold text-brand-text mb-2">
              Ready to start your shift?
            </p>
            <p className="text-brand-text-secondary mb-6">
              Take a photo to clock in
            </p>
            <button
              onClick={handleClockIn}
              className="btn-primary flex items-center gap-2 mx-auto text-lg px-8 py-4"
            >
              <LogIn className="w-5 h-5" />
              Clock In
            </button>
          </div>
        )}
      </div>

      {/* Today's Entries */}
      <div>
        <h2 className="text-lg font-semibold text-brand-text mb-4">Today's Entries</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : todayEntries.length === 0 ? (
          <div className="card text-center py-8">
            <Clock className="w-12 h-12 text-brand-text-muted mx-auto mb-3" />
            <p className="text-brand-text-secondary">No entries for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayEntries.map((entry) => (
              <div key={entry.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    entry.status === 'active' ? 'bg-green-50' : 'bg-brand-background'
                  }`}>
                    {entry.status === 'active' ? (
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                    ) : (
                      <Clock className="w-5 h-5 text-brand-text-secondary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-brand-text">
                      {format(new Date(entry.clock_in), 'hh:mm a')}
                      {entry.clock_out && ` → ${format(new Date(entry.clock_out), 'hh:mm a')}`}
                    </p>
                    <p className="text-sm text-brand-text-secondary">
                      {entry.status === 'active' ? (
                        <span className="text-green-600 font-medium">In Progress</span>
                      ) : (
                        <span>
                          {entry.hours_worked 
                            ? `${entry.hours_worked.toFixed(1)} hours` 
                            : formatDuration(getDuration(entry))}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-xs ${
                    entry.status === 'active' 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-brand-background text-brand-text-secondary'
                  }`}>
                    {entry.status}
                  </span>
                  {entry.clock_in_photo_url && (
                    <img
                      src={entry.clock_in_photo_url}
                      alt="Clock in"
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          allowSkip={true}
        />
      )}
    </div>
  )
}