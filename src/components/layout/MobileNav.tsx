// src/components/layout/MobileNav.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ShoppingCart, Clock, Package, BarChart3, Users, DollarSign, Menu, X } from 'lucide-react'

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

  const mainItems = [
    { name: 'POS', href: '/pos/new-order', icon: ShoppingCart },
    { name: 'Clock', href: '/clock', icon: Clock },
    { name: 'Products', href: '/products', icon: Package },
  ]

  const moreItems = [
    { name: 'Inventory', href: '/inventory', icon: Package, roles: ['owner'] },
    { name: 'Sales', href: '/reports/sales', icon: BarChart3, roles: ['owner'] },
    { name: 'Attendance', href: '/reports/attendance', icon: Clock, roles: ['owner'] },
    { name: 'Staff', href: '/staff/management', icon: Users, roles: ['owner'] },
    { name: 'Payroll', href: '/staff/payroll', icon: DollarSign, roles: ['owner'] },
  ]

  const visibleMoreItems = moreItems.filter(item => item.roles.includes(userRole))

  return (
    <>
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border lg:hidden">
        <div className="flex items-center justify-around h-14 px-1">
          {mainItems.map((item) => (
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
          ))}
          
          {/* More button */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0 ${
              visibleMoreItems.some(i => isActive(i.href)) ? 'text-brand-primary' : 'text-brand-text-muted'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-16 left-0 right-0 bg-white rounded-t-3xl p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-brand-text">Menu</h3>
              <button onClick={() => setMenuOpen(false)} className="p-1">
                <X className="w-5 h-5 text-brand-text-secondary" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {visibleMoreItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                    isActive(item.href) ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-background text-brand-text-secondary'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-medium text-center">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}