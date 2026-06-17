// src/components/layout/Sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Coffee,
  ShoppingCart,
  XCircle,
  Clock,
  Package,
  BarChart3,
  Users,
  DollarSign,
  ClipboardList,
  X,
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
  onLogout: () => void
}

const navigation = [
  {
    section: 'POS',
    items: [
      { name: 'New Order', href: '/pos/new-order', icon: ShoppingCart, roles: ['staff', 'owner'] },
      { name: 'Order History', href: '/pos/void-order', icon: XCircle, roles: ['staff', 'owner'] },
    ],
  },
  {
    section: 'Time',
    items: [
      { name: 'Clock In/Out', href: '/clock', icon: Clock, roles: ['staff', 'owner'] },
    ],
  },
  {
    section: 'Management',
    items: [
      { name: 'Inventory', href: '/inventory', icon: Package, roles: ['owner'] },
      { name: 'Products', href: '/products', icon: ClipboardList, roles: ['owner'] },
      { name: 'Staff', href: '/staff/management', icon: Users, roles: ['owner'] },
      { name: 'Payroll', href: '/staff/payroll', icon: DollarSign, roles: ['owner'] },
    ],
  },
  {
    section: 'Reports',
    items: [
      { name: 'Sales', href: '/reports/sales', icon: BarChart3, roles: ['staff', 'owner'] },
      { name: 'Attendance', href: '/reports/attendance', icon: ClipboardList, roles: ['owner'] },
    ],
  },
]

export default function Sidebar({ open, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('staff')
  const supabase = createClient()

  useEffect(() => {
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserRole(profile.role)
      }
    }
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const filteredNavigation = navigation.map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes(userRole))
  })).filter(section => section.items.length > 0)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-brand-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Clickable to home */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-brand-border">
            <Link href="/pos" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-brand-background flex items-center justify-center group-hover:shadow-soft transition-all duration-300">
                <img 
                  src="/logo.png" 
                  alt="AYA Studios" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if no logo image
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = '<div class="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></div>'
                  }}
                />
              </div>
              <div className="leading-tight">
                <h1 className="text-base font-bold text-brand-text">AYA Studios</h1>
                <p className="text-xs text-brand-text-secondary">coffee & prints</p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-brand-background rounded-xl"
            >
              <X className="w-5 h-5 text-brand-text-secondary" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3">
            {filteredNavigation.map((section) => (
              <div key={section.section} className="mb-6">
                <h3 className="px-3 mb-2 text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
                  {section.section}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive(item.href)
                          ? 'bg-brand-primary/10 text-brand-primary shadow-sm'
                          : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-background'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-brand-border">
            <p className="text-xs text-brand-text-muted text-center">v1.0</p>
          </div>
        </div>
      </aside>
    </>
  )
}