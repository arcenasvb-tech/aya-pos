// src/lib/utils/bluetoothPrinter.ts

// ESC/POS Commands for 58mm thermal printer
const ESC = '\x1B'
const GS = '\x1D'

function encode(str: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

function generateReceiptBytes(order: any, items: any[], breakdown: any): Uint8Array {
  const now = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
  const chunks: Uint8Array[] = []

  // Initialize printer
  chunks.push(encode(ESC + '@')) // Reset

  // Header
  chunks.push(encode(ESC + 'a' + '\x01')) // Center align
  chunks.push(encode(ESC + '!' + '\x11')) // Double height
  chunks.push(encode('AYA Studios\n'))
  chunks.push(encode(ESC + '!' + '\x00')) // Normal
  chunks.push(encode('coffee & prints\n'))
  chunks.push(encode('------------------------------\n'))
  
  // Order info
  chunks.push(encode(ESC + 'a' + '\x00')) // Left align
  chunks.push(encode(`Order #: ${order.id?.slice(0, 8) || 'N/A'}\n`))
  chunks.push(encode(`Date: ${now}\n`))
  chunks.push(encode(`Payment: ${order.payment_method?.toUpperCase() || 'N/A'}\n`))
  if (order.customer_name) {
    chunks.push(encode(`Customer: ${order.customer_name}\n`))
  }
  chunks.push(encode('------------------------------\n'))

  // Items
  items.forEach((item: any) => {
    const lineTotal = item.price * item.quantity
    chunks.push(encode(`${item.quantity}x ${item.productName}`))
    if (item.variantName) {
      chunks.push(encode(` (${item.variantName})`))
    }
    chunks.push(encode(`\n`))
    
    // Addons
    if (item.addons?.length > 0) {
      item.addons.forEach((addon: any) => {
        chunks.push(encode(`   + ${addon.name}\n`))
      })
    }
    
    // Price
    chunks.push(encode(ESC + 'a' + '\x02')) // Right align
    chunks.push(encode(`₱${lineTotal.toFixed(2)}\n`))
    chunks.push(encode(ESC + 'a' + '\x00')) // Left align
  })

  chunks.push(encode('------------------------------\n'))

  // Totals
  chunks.push(encode(ESC + '!' + '\x08')) // Bold
  chunks.push(encode(`TOTAL: ₱${breakdown.totalAmountDue.toFixed(2)}\n`))
  chunks.push(encode(ESC + '!' + '\x00')) // Normal

  if (breakdown.totalDiscounts > 0) {
    chunks.push(encode(`Discount: -₱${breakdown.totalDiscounts.toFixed(2)}\n`))
    chunks.push(encode(`VAT-Exempt Sales: ₱${breakdown.vatExemptSales.toFixed(2)}\n`))
  }

  chunks.push(encode('------------------------------\n'))
  chunks.push(encode(ESC + 'a' + '\x01')) // Center
  chunks.push(encode('Thank you! ☕\n'))
  chunks.push(encode('AYA Studios\n\n\n\n')) // Feed for tear

  // Cut paper
  chunks.push(encode(GS + 'V\x41\x00')) // Full cut

  // Concatenate all chunks
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  chunks.forEach(chunk => {
    result.set(chunk, offset)
    offset += chunk.length
  })

  return result
}

export async function printReceiptBluetooth(
  order: any,
  items: any[],
  breakdown: any
): Promise<boolean> {
  try {
    // @ts-ignore - Web Bluetooth API
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] // Standard serial service
    })

    const server = await device.gatt?.connect()
    if (!server) throw new Error('Failed to connect')

    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')

    const receiptBytes = generateReceiptBytes(order, items, breakdown)
    
    // Send in chunks (some printers have buffer limits)
    const CHUNK_SIZE = 512
    for (let i = 0; i < receiptBytes.length; i += CHUNK_SIZE) {
      const chunk = receiptBytes.slice(i, i + CHUNK_SIZE)
      await characteristic.writeValueWithoutResponse(chunk)
      await new Promise(resolve => setTimeout(resolve, 50)) // Small delay between chunks
    }

    device.gatt?.disconnect()
    return true
  } catch (error) {
    console.error('Bluetooth print error:', error)
    throw error
  }
}

export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
}