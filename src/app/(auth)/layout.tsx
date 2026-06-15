// src/app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-brand-background">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent" />
      <div className="relative">
        {children}
      </div>
    </div>
  )
}