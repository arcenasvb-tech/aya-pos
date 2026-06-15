// src/components/layout/MobileNav.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Clock, Package, BarChart3, Users } from 'lucide-react'

interface MobileNavProps {
  onLogout: () => void
}

export default function MobileNav({ onLogout }: MobileNavProps) {
  const pathname = usePathname()

  const navItems = [
    { name: 'POS', href: '/pos/new-order', icon: ShoppingCart },
    { name: 'Clock', href: '/clock', icon: Clock },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Reports', href: '/reports/sales', icon: BarChart3 },
    { name: 'Staff', href: '/staff/management', icon: Users },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors ${
              isActive(item.href)
                ? 'text-brand-primary'
                : 'text-brand-text-muted hover:text-brand-text-secondary'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}