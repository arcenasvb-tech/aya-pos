'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingCart,
  XCircle,
  Clock,
  Package,
  BarChart3,
  Users,
  DollarSign,
  ClipboardList,
} from 'lucide-react'

const navigation = [
  { name: 'New Order', href: '/pos/new-order', icon: ShoppingCart, roles: ['staff', 'owner'] },
  { name: 'Order History', href: '/pos/void-order', icon: XCircle, roles: ['staff', 'owner'] },
  { name: 'Clock', href: '/clock', icon: Clock, roles: ['staff', 'owner'] },
  { name: 'Inventory', href: '/inventory', icon: Package, roles: ['owner'] },
  { name: 'Products', href: '/products', icon: ClipboardList, roles: ['owner'] },
  { name: 'Staff', href: '/staff/management', icon: Users, roles: ['owner'] },
  { name: 'Payroll', href: '/staff/payroll', icon: DollarSign, roles: ['owner'] },
  { name: 'Sales', href: '/reports/sales', icon: BarChart3, roles: ['staff', 'owner'] },
  { name: 'Attendance', href: '/reports/attendance', icon: ClipboardList, roles: ['owner'] },
]

export default function MobileNav() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState('staff')
  const supabase = createClient()

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role) {
          setUserRole(profile.role)
        }
      }
    }

    fetchUserRole()
  }, [supabase])

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  )

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-brand-border bg-white shadow-top">
      <div className="grid grid-flow-col auto-cols-min gap-2 overflow-x-auto px-3 py-2">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex w-20 sm:w-24 min-w-[5rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] sm:text-xs font-medium text-center transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-brand-text-secondary hover:bg-brand-background'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
