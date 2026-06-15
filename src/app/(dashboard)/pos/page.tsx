// src/app/(dashboard)/pos/page.tsx
import { redirect } from 'next/navigation'

export default function PosPage() {
  redirect('/pos/new-order')
}