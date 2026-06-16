// src/components/layout/MobileNav.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ShoppingCart, Clock, Package, BarChart3, Users, DollarSign, ClipboardList } from 'lucide-react'

export default function MobileNav() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string>('staff')
  const supabase = createClient()

  useEffect(() => {
    fetchUserRole()
  }, [pathname]) // Re-fetch on every navigation

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

  const allItems = [
    { name: 'POS', href: '/pos/new-order', icon: ShoppingCart, roles: ['staff', 'owner'] },
    { name: 'Clock', href: '/clock', icon: Clock, roles: ['staff', 'owner'] },
    { name: 'Products', href: '/products', icon: ClipboardList, roles: ['owner'] },
    { name: 'Inventory', href: '/inventory', icon: Package, roles: ['owner'] },
    { name: 'Sales', href: '/reports/sales', icon: BarChart3, roles: ['owner'] },
    { name: 'Staff', href: '/staff/management', icon: Users, roles: ['owner'] },
    { name: 'Payroll', href: '/staff/payroll', icon: DollarSign, roles: ['owner'] },
  ]

  const visibleItems = allItems.filter(item => item.roles.includes(userRole))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border lg:hidden">
      <div className="flex items-center h-14 px-2 overflow-x-auto gap-1 scrollbar-hide">
        {visibleItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors flex-shrink-0 min-w-[56px] ${
              isActive(item.href)
                ? 'text-brand-primary'
                : 'text-brand-text-muted hover:text-brand-text-secondary'
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-[10px] font-medium whitespace-nowrap">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}