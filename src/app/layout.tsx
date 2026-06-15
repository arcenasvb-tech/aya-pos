// src/app/layout.tsx
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'AYA Studios | POS System',
  description: 'Minimalistic coffee shop POS system',
  manifest: '/manifest.json',
  themeColor: '#F2542D',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FFFFFF',
              color: '#2D2B28',
              borderRadius: '1rem',
              border: '1px solid #E7E0D5',
              boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#65A30D',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#DC2626',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </body>
    </html>
  )
}