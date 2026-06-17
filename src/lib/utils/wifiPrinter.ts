// src/lib/utils/wifiPrinter.ts

const ESC = '\x1B'
const GS = '\x1D'

function encode(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

function generateReceiptBytes(order: any, items: any[], breakdown: any): Uint8Array {
  const now = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
  const chunks: Uint8Array[] = []

  // Initialize
  chunks.push(encode(ESC + '@'))
  
  // Header - Center aligned, double height
  chunks.push(encode(ESC + 'a' + '\x01'))
  chunks.push(encode(ESC + '!' + '\x11'))
  chunks.push(encode('AYA Studios\n'))
  chunks.push(encode(ESC + '!' + '\x00'))
  chunks.push(encode('coffee & prints\n'))
  chunks.push(encode('-'.repeat(32) + '\n'))
  
  // Order info - Left aligned
  chunks.push(encode(ESC + 'a' + '\x00'))
  chunks.push(encode(`Order #: ${order.id?.slice(0, 8) || 'N/A'}\n`))
  chunks.push(encode(`Date: ${now}\n`))
  chunks.push(encode(`Payment: ${order.payment_method?.toUpperCase() || 'N/A'}\n`))
  if (order.processed_by_name) {
    chunks.push(encode(`Staff: ${order.processed_by_name}\n`))
  }
  chunks.push(encode('-'.repeat(32) + '\n'))

  // Items
  items.forEach((item: any) => {
    chunks.push(encode(`${item.quantity}x ${item.productName}`))
    if (item.variantName) chunks.push(encode(` (${item.variantName})`))
    chunks.push(encode('\n'))
    
    if (item.addons?.length > 0) {
      item.addons.forEach((addon: any) => {
        chunks.push(encode(`   + ${addon.name}\n`))
      })
    }
    
    const lineTotal = item.price * item.quantity
    chunks.push(encode(ESC + 'a' + '\x02'))
    chunks.push(encode(`₱${lineTotal.toFixed(2)}\n`))
    chunks.push(encode(ESC + 'a' + '\x00'))
  })

  chunks.push(encode('-'.repeat(32) + '\n'))

  // Totals
  chunks.push(encode(ESC + '!' + '\x08'))
  chunks.push(encode(`TOTAL: ₱${breakdown.totalAmountDue.toFixed(2)}\n`))
  chunks.push(encode(ESC + '!' + '\x00'))

  if (breakdown.totalDiscounts > 0) {
    chunks.push(encode(`VAT-Exempt: ₱${breakdown.vatExemptSales.toFixed(2)}\n`))
    chunks.push(encode(`Discount: -₱${breakdown.totalDiscounts.toFixed(2)}\n`))
  }

  chunks.push(encode('-'.repeat(32) + '\n'))
  chunks.push(encode(ESC + 'a' + '\x01'))
  chunks.push(encode('Thank you! ☕\n'))
  chunks.push(encode('AYA Studios coffee & prints\n'))
  chunks.push(encode('\n\n\n\n'))

  // Cut paper
  chunks.push(encode(GS + 'V\x41\x00'))

  // Combine
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  chunks.forEach(chunk => {
    result.set(chunk, offset)
    offset += chunk.length
  })
  return result
}

// Store printer IP in localStorage
export function savePrinterIP(ip: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('thermal_printer_ip', ip)
  }
}

export function getPrinterIP(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('thermal_printer_ip')
  }
  return null
}

// Print via TCP (port 9100) - most common for thermal printers
async function printViaTCP(ip: string, port: number, data: Uint8Array): Promise<void> {
  // We need to use a proxy/relay since browsers can't do raw TCP
  // For now, we'll use a simple HTTP endpoint that the printer might support
  const url = `http://${ip}:${port}/`
  
  try {
    await fetch(url, {
      method: 'POST',
      body: data,
      headers: { 'Content-Type': 'application/octet-stream' }
    })
  } catch (error) {
    // If direct HTTP fails, try common printer endpoints
    const endpoints = [
      `http://${ip}/cgi-bin/print`,
      `http://${ip}/print`,
      `http://${ip}:9100/`,
    ]
    
    for (const endpoint of endpoints) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/octet-stream' }
        })
        return // Success
      } catch {
        continue
      }
    }
    throw new Error('Could not connect to printer. Check IP address and ensure printer is on the same network.')
  }
}

export async function printReceiptWiFi(
  order: any,
  items: any[],
  breakdown: any
): Promise<boolean> {
  const printerIP = getPrinterIP()
  
  if (!printerIP) {
    throw new Error('Printer not configured. Please set printer IP in Settings.')
  }

  const receiptBytes = generateReceiptBytes(order, items, breakdown)
  
  try {
    // Try common printer ports
    const ports = [9100, 80, 8080]
    
    for (const port of ports) {
      try {
        await printViaTCP(printerIP, port, receiptBytes)
        return true
      } catch {
        continue
      }
    }
    
    throw new Error('Could not connect to printer on any port.')
  } catch (error: any) {
    console.error('WiFi print error:', error)
    throw error
  }
}