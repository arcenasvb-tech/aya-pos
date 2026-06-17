export interface CartItemLike {
  quantity: number
  price: number
  addons?: Array<{ price: number }>
  isSeniorPwdEligible?: boolean
}

export interface LineBreakdown {
  lineGrossAmount: number
  lineBaseAmount: number
  lineVatAmount: number
  lineDiscountAmount: number
  lineFinalAmount: number
  taxClassification: 'VATABLE' | 'VAT_EXEMPT'
}

export interface OrderBreakdown {
  grossAmount: number
  vatableSales: number
  vatExemptSales: number
  vatAmount: number
  totalDiscounts: number
  totalAmountDue: number
  hasSeniorPwdDiscount: boolean
  lineItems: LineBreakdown[]
}

const VAT_RATE = 0.12
const SENIOR_PWD_RATE = 0.20

const roundMoney = (value: number) => Number(value.toFixed(2))

export function calculateLineBreakdown(item: CartItemLike): LineBreakdown {
  const addonTotal = (item.addons || []).reduce((sum, addon) => sum + addon.price, 0)
  const grossAmount = roundMoney((item.price + addonTotal) * item.quantity)

  if (item.isSeniorPwdEligible) {
    const baseAmount = roundMoney(grossAmount / 1.12)
    const discountAmount = roundMoney(baseAmount * SENIOR_PWD_RATE)
    const finalAmount = roundMoney(grossAmount - discountAmount)

    return {
      lineGrossAmount: grossAmount,
      lineBaseAmount: baseAmount,
      lineVatAmount: 0,
      lineDiscountAmount: discountAmount,
      lineFinalAmount: finalAmount,
      taxClassification: 'VAT_EXEMPT',
    }
  }

  const baseAmount = roundMoney(grossAmount / 1.12)
  const vatAmount = roundMoney(baseAmount * VAT_RATE)

  return {
    lineGrossAmount: grossAmount,
    lineBaseAmount: baseAmount,
    lineVatAmount: vatAmount,
    lineDiscountAmount: 0,
    lineFinalAmount: grossAmount,
    taxClassification: 'VATABLE',
  }
}

export function calculateOrderBreakdown(items: CartItemLike[]): OrderBreakdown {
  const lineItems = items.map(calculateLineBreakdown)

  const grossAmount = roundMoney(
    lineItems.reduce((sum, item) => sum + item.lineGrossAmount, 0)
  )
  const vatableSales = roundMoney(
    lineItems
      .filter((item) => item.taxClassification === 'VATABLE')
      .reduce((sum, item) => sum + item.lineBaseAmount, 0)
  )
  const vatExemptSales = roundMoney(
    lineItems
      .filter((item) => item.taxClassification === 'VAT_EXEMPT')
      .reduce((sum, item) => sum + item.lineBaseAmount, 0)
  )
  const vatAmount = roundMoney(vatableSales * VAT_RATE)
  const totalDiscounts = roundMoney(
    lineItems.reduce((sum, item) => sum + item.lineDiscountAmount, 0)
  )
  const totalAmountDue = roundMoney(
    lineItems.reduce((sum, item) => sum + item.lineFinalAmount, 0)
  )

  return {
    grossAmount,
    vatableSales,
    vatExemptSales,
    vatAmount,
    totalDiscounts,
    totalAmountDue,
    hasSeniorPwdDiscount: totalDiscounts > 0,
    lineItems,
  }
}
