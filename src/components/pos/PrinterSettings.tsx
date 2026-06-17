// src/components/pos/PrinterSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { savePrinterIP, getPrinterIP } from '@/lib/utils/wifiPrinter'
import { Printer, Save, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PrinterSettings() {
  const [ip, setIp] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedIP = getPrinterIP()
    if (savedIP) {
      setIp(savedIP)
      setSaved(true)
    }
  }, [])

  const handleSave = () => {
    if (!ip.trim()) return
    savePrinterIP(ip.trim())
    setSaved(true)
    toast.success('Printer IP saved!')
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Wifi className="w-5 h-5 text-brand-primary" />
        <h3 className="font-semibold text-brand-text">Thermal Printer (WiFi)</h3>
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={ip}
          onChange={(e) => { setIp(e.target.value); setSaved(false) }}
          placeholder="192.168.1.100"
          className="input-field font-mono text-sm"
        />
        <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>
      
      {saved && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          ✓ Printer configured at {ip}
        </p>
      )}
      <p className="text-xs text-brand-text-muted">
        Find printer IP in your router settings or printer's self-test page
      </p>
    </div>
  )
}