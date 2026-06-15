// src/components/layout/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, LogOut, User, ChevronDown, Key } from 'lucide-react'
import toast from 'react-hot-toast'

interface HeaderProps {
  onMenuClick: () => void
  onLogout: () => void
}

export default function Header({ onMenuClick, onLogout }: HeaderProps) {
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserName(profile.full_name)
        setUserRole(profile.role)
      }
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 4) {
      toast.error('Password must be at least 4 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('Password changed successfully!')
      setShowPasswordModal(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    }
  }

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      '/pos': 'Point of Sale',
      '/pos/new-order': 'New Order',
      '/pos/void-order': 'Void Orders',
      '/clock': 'Time Clock',
      '/inventory': 'Inventory Management',
      '/reports/sales': 'Sales Reports',
      '/reports/attendance': 'Attendance Reports',
      '/staff/management': 'Staff Management',
      '/staff/payroll': 'Payroll',
      '/products': 'Product Listing',
    }
    return titles[pathname] || 'Dashboard'
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-brand-border">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-brand-background rounded-xl">
              <Menu className="w-5 h-5 text-brand-text" />
            </button>
            <h2 className="text-lg font-semibold text-brand-text hidden sm:block">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 p-2 hover:bg-brand-background rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-primary" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-brand-text">{userName}</p>
                  <p className="text-xs text-brand-text-secondary capitalize">{userRole}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-brand-text-secondary hidden sm:block" />
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-medium border border-brand-border z-20 py-2">
                    <div className="px-4 py-2 border-b border-brand-border sm:hidden">
                      <p className="text-sm font-medium text-brand-text">{userName}</p>
                      <p className="text-xs text-brand-text-secondary capitalize">{userRole}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowDropdown(false)
                        setShowPasswordModal(true)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brand-text hover:bg-brand-background transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      Change Password
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false)
                        onLogout()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="modal-content relative bg-white rounded-2xl shadow-medium max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-brand-text mb-6">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="Min 4 characters"
                  minLength={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword('') }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleChangePassword} className="btn-primary flex-1">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}