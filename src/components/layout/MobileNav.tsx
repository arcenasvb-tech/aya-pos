// src/components/layout/MobileNav.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ShoppingCart, Clock, Package, BarChart3, Users, Menu, X } from 'lucide-react'

export default function MobileNav() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string>('staff')
  const [menuOpen, setMenuOpen] = useState(false)
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
      
      if (profile) setUserRole(profile.role)
    }
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // Main 4 items always visible
  const mainItems = [
    { name: 'POS', href: '/pos/new-order', icon: ShoppingCart },
    { name: 'Clock', href: '/clock', icon: Clock },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'More', href: '#more', icon: Menu, isAction: true },
  ]

  // Items in the More menu
  const moreItems = [
    { name: 'Inventory', href: '/inventory', icon: Package, roles: ['owner'] },
    { name: 'Sales', href: '/reports/sales', icon: BarChart3, roles: ['owner'] },
    { name: 'Attendance', href: '/reports/attendance', icon: Clock, roles: ['owner'] },
    { name: 'Staff', href: '/staff/management', icon: Users, roles: ['owner'] },
    { name: 'Payroll', href: '/staff/payroll', icon: BarChart3, roles: ['owner'] },
    { name: 'Void Orders', href: '/pos/void-order', icon: X, roles: ['staff', 'owner'] },
  ]

  const visibleMoreItems = moreItems.filter(item => item.roles.includes(userRole))

  return (
    <>
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border lg:hidden">
        <div className="flex items-center justify-around h-14 px-1">
          {mainItems.map((item) => {
            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  onClick={() => setMenuOpen(true)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0 ${
                    visibleMoreItems.some(i => isActive(i.href)) ? 'text-brand-primary' : 'text-brand-text-muted'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </button>
              )
            }
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0 ${
                  isActive(item.href) ? 'text-brand-primary' : 'text-brand-text-muted'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* More Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-16 left-0 right-0 bg-white rounded-t-3xl p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-brand-text">More Options</h3>
              <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-brand-background rounded-xl">
                <X className="w-5 h-5 text-brand-text-secondary" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {visibleMoreItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${
                    isActive(item.href) 
                      ? 'bg-brand-primary/10 text-brand-primary' 
                      : 'bg-brand-background text-brand-text-secondary hover:bg-brand-background-dark'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-medium text-center leading-tight">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}