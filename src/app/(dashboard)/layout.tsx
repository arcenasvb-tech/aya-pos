// src/app/(dashboard)/layout.tsx
'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-brand-background">
      {/* Sidebar for desktop */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className="lg:pl-72">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />
        
        <main className="py-6 px-3 sm:px-4 lg:px-8 pb-20 lg:pb-8">
  <div className="max-w-7xl mx-auto">
    {children}
  </div>
</main>
      </div>

      {/* Mobile navigation */}
      <MobileNav onLogout={handleLogout} />
    </div>
  )
}