import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const PAGE = { w: 210, h: 297 }
const M = 14
const CW = PAGE.w - M * 2

const C = {
  brand1: '#f43f5e',
  brand2: '#db2777',
  dark: '#0f172a',
  gray: '#64748b',
  light: '#f8fafc',
  soft: '#ffe4e6',
  white: '#ffffff',
  line: '#e2e8f0',
  green: '#059669',
  amber: '#d97706',
  rose: '#be123c',
}

const formatDate = (d) => {
  if (!d) return '—'
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return '—'
  return x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const clean = (v) => (v == null ? '' : String(v))

const normalizeAddress = (raw = {}, opts = {}) => {
  const has = (k) => raw[k] != null && String(raw[k]).trim() !== ''
  const fullName = raw.fullName || raw.name || raw.contactName || raw.shippingName || opts.fallbackName || 'Customer'
  const phone = raw.phoneNumber || raw.phone || raw.mobile || raw.contact
  const email = raw.email || opts.fallbackEmail || ''
  const line1 = raw.addressLine1 || raw.address || raw.line1 || raw.street || ''
  const line2 = raw.addressLine2 || raw.line2 || ''
  const city = raw.city || ''
  const state = raw.state || ''
  const pin = raw.pincode || raw.postalCode || raw.zip || ''
  const country = raw.country || 'India'
  const parts = []
  if (city) parts.push(city)
  if (state) parts.push(state)
  if (pin) parts.push(pin)
  const cityLine = parts.join(', ') + (city || state || pin ? ` - ${country}` : '')
  const address = [fullName, [line1, line2].filter(has).join(', '), cityLine].filter(Boolean)
  if (phone) address.push(`Phone: ${phone}`)
  if (email) address.push(`Email: ${email}`)
  return { fullName, address, phone, email, has }
}

const pickAddress = (order) => {
  const raw = order.shippingAddress || order.deliveryAddress || order.billingAddress || order.shippingAddressSnapshot || {}
  return normalizeAddress(raw, {
    fallbackEmail: order.email || order.userId?.email || '',
    fallbackName: order.customerName || order.userId?.name,
  })
}

const numberToWords = (num) => {
  const n = Math.round(Number(num) || 0)
  if (n === 0) return 'Zero'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const two = (x) => (x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : ''))
  const three = (x) => (x < 100 ? two(x) : ones[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + two(x % 100) : ''))
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const rest = n % 1000
  const parts = []
  if (crore) parts.push(three(crore) + ' Crore')
  if (lakh) parts.push(two(lakh) + ' Lakh')
  if (thousand) parts.push(two(thousand) + ' Thousand')
  if (rest) parts.push(three(rest))
  return parts.join(' ')
}

const paymentLabel = (order) => {
  const method = clean(order.paymentMethod).toUpperCase()
  const status = clean(order.paymentStatus).toUpperCase()
  const labels = { COD: 'Cash on Delivery', RAZORPAY: 'Razorpay (Online)', PAYU: 'PayU (Online)', UPI: 'UPI', CARD: 'Card' }
  const base = labels[method] || (method ? method.replace(/_/g, ' ') : '—')
  const extra = status === 'PAID' ? ' · Paid' : status === 'PENDING' ? ' · Pending' : status === 'FAILED' ? ' · Failed' : status === 'REFUNDED' ? ' · Refunded' : ''
  return base + extra
}

const seedFrom = (s) => {
  let v = 0
  for (const ch of clean(s)) v = (v * 31 + ch.charCodeAt(0)) >>> 0
  return v
}

const drawBarcode = (doc, x, y, w, h, seed) => {
  let s = seedFrom(seed)
  let bx = x
  let i = 0
  while (bx + 0.4 <= x + w && i < 80) {
    const thick = ((s >> (i % 29)) & 1) === 1
    const bw = thick ? 0.9 : 0.4
    if (bx + bw <= x + w) doc.rect(bx, y, bw, h, 'F')
    bx += bw + 0.4
    i += 1
  }
}

export const downloadInvoice = (order) => {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    let y = 0

    const bold = (size) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(size) }
    const normal = (size) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(size) }
    const text = (t, x, yy, opts = {}) => doc.text(t, x, yy, opts)
    const wrap = (t, w) => doc.splitTextToSize(clean(t), w)
    const line = (x1, y1, x2, y2, color = C.line, w = 0.3) => {
      doc.setDrawColor(color)
      doc.setLineWidth(w)
      doc.line(x1, y1, x2, y2)
    }
    const rect = (x, yy, w, h, fill, stroke) => {
      if (fill) { doc.setFillColor(...(Array.isArray(fill) ? fill : [fill])) }
      if (stroke) doc.setDrawColor(stroke)
      doc.roundedRect(x, yy, w, h, 1.5, 1.5, fill ? 'F' : 'S')
    }
    const fit = (needed) => y + needed < PAGE.h - 24

    const addr = pickAddress(order)

    const billingRaw = order.billingAddress && typeof order.billingAddress === 'object' ? order.billingAddress : null
    const shippingRaw = order.shippingAddress || order.deliveryAddress || {}
    const showBilling = billingRaw && JSON.stringify(billingRaw) !== JSON.stringify(shippingRaw)
    const billing = showBilling ? normalizeAddress(billingRaw) : null

    const rawItems = order.items || order.products || []
    const items = rawItems.map((item) => {
      const name = item.name || item.product?.name || 'Item'
      const size = item.size ? ` (${item.size})` : ''
      const qty = Number(item.quantity || item.qty || 1)
      const price = Number(item.price || item.product?.price || 0)
      const packSize = Number(item.packSize || item.product?.packSize || item.unitsPerPack || 1) || 1
      const packs = Math.ceil(qty / packSize)
      return { name: name + size, qty, price, total: price * qty, packSize, packs }
    })

    // ================= HEADER BAND =================
    const bandH = 24
    const gradTop = C.brand1
    const gradBottom = C.brand2
    for (let i = 0; i < 12; i += 1) {
      const f = i / 11
      doc.setFillColor(
        Math.round(parseInt(gradTop.slice(1, 3), 16) + (parseInt(gradBottom.slice(1, 3), 16) - parseInt(gradTop.slice(1, 3), 16)) * f),
        Math.round(parseInt(gradTop.slice(3, 5), 16) + (parseInt(gradBottom.slice(3, 5), 16) - parseInt(gradTop.slice(3, 5), 16)) * f),
        Math.round(parseInt(gradTop.slice(5, 7), 16) + (parseInt(gradBottom.slice(5, 7), 16) - parseInt(gradTop.slice(5, 7), 16)) * f)
      )
      doc.rect(0, (bandH / 12) * i, PAGE.w, bandH / 12 + 0.5, 'F')
    }
    doc.setTextColor(C.white)
    bold(18)
    text('CHOOSEMOOD', M, 12)
    normal(8)
    text('Style That Speaks', M, 18)
    bold(15)
    text('TAX INVOICE', PAGE.w - M, 12, { align: 'right' })
    normal(8)
    text(clean(order.orderNumber || order.orderId || order._id), PAGE.w - M, 18, { align: 'right' })
    y = bandH + 5

    // ================= META GRID =================
    const metaCols = [
      { label: 'Invoice No.', value: `INV-${order.orderNumber || order.orderId || order._id}` },
      { label: 'Invoice Date', value: formatDate(order.createdAt) },
      { label: 'Payment', value: paymentLabel(order) },
      { label: 'Order No.', value: clean(order.orderNumber || order.orderId || order._id) },
    ]
    const gap = 4
    const metaW = (CW - gap * 3) / 4
    metaCols.forEach((c, i) => {
      const x = M + i * (metaW + gap)
      rect(x, y, metaW, 13, C.light, C.line)
      line(x, y + 7.5, x + metaW, y + 7.5, C.line, 0.2)
      normal(5.5)
      doc.setTextColor(C.gray)
      text(c.label.toUpperCase(), x + 3, y + 5)
      bold(6)
      doc.setTextColor(C.dark)
      const v = wrap(c.value, metaW - 6)
      v.forEach((l, j) => text(l, x + 3, y + 9 + j * 3.2))
    })
    y += 18

    // ================= SELLER / BILL TO =================
    const halfW = (CW - 5) / 2
    const drawBlock = (x, w, title, linesArr, titleFill) => {
      const wrapped = linesArr.flatMap((l) => wrap(l, w - 6))
      const h = 20 + wrapped.length * 4.2
      rect(x, y, w, h, C.white, C.line)
      doc.setFillColor(titleFill || C.brand1)
      doc.rect(x, y, w, 6.5, 'F')
      bold(6.5)
      doc.setTextColor(C.white)
      text(title, x + 3, y + 4.6)
      normal(6)
      doc.setTextColor(C.dark)
      wrapped.forEach((wl, i) => text(wl, x + 3, y + 10.5 + i * 4))
      return h
    }

    const sellerLines = [
      'CHOOSEMOOD FASHION PVT. LTD.',
      '123, Fashion Street, Ring Road',
      'Indore - 452001, Madhya Pradesh',
      'GSTIN: 23ABCDE1234F1Z5',
      'support@choosemood.in',
    ]

    const billRaw = addr.address
    const billH = drawBlock(M, halfW, 'BILL TO', billRaw, C.brand2)
    const sellerH = drawBlock(M + halfW + 5, halfW, 'SELLER', sellerLines, C.brand1)
    y += Math.max(billH, sellerH) + 4

    if (billing) {
      const bH = drawBlock(M, CW, 'BILLING ADDRESS', billing.address, C.brand2)
      y += bH + 4
    }

    // ================= STATUS CHIPS ROW =================
    const statusChip = (x, label, value, chipColor) => {
      const v = clean(value)
      normal(6)
      const labelW = 31
      const valW = Math.max(18, doc.getTextWidth(v) + 7)
      doc.setTextColor(C.gray)
      text(label, x, y + 4)
      doc.setFillColor(chipColor)
      doc.roundedRect(x + labelW + 2, y - 1, valW, 5.5, 1, 1, 'F')
      doc.setTextColor(C.white)
      bold(6)
      text(v.toUpperCase(), x + labelW + 2 + valW / 2, y + 2.9, { align: 'center' })
      return labelW + valW + 8
    }
    let cx = M
    cx += statusChip(cx, 'Order Status', order.orderStatus || order.status || 'PLACED', C.brand1)
    cx += statusChip(cx, 'Payment Status', order.paymentStatus || 'PENDING', order.paymentStatus?.toUpperCase() === 'PAID' ? C.green : C.amber)
    cx += statusChip(cx, 'Payment Method', order.paymentMethod || '—', C.dark)
    y += 10

    // ================= ITEMS TABLE =================
    y += 4
    const itemCount = items.length
    const level = itemCount > 18 ? 2 : itemCount > 12 ? 1 : itemCount > 6 ? 0 : 0
    const tFont = [7, 6.4, 5.6][level]
    const tPad = [1.2, 0.8, 0.35][level]

    const head = [['#', 'Item', 'Qty', 'Packs', 'Unit Price', 'Amount']]
    const body = items.map((it, i) => [
      i + 1,
      it.name,
      it.qty,
      it.packs,
      money(it.price),
      money(it.total),
    ])

    autoTable(doc, {
      head,
      body,
      startY: y,
      margin: { left: M, right: M },
      theme: 'grid',
      headStyles: { fillColor: [244, 63, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 6.5, halign: 'center', lineColor: [244, 63, 94] },
      bodyStyles: { fontSize: tFont, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.15, cellPadding: { top: tPad, bottom: tPad } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 9 },
        1: { halign: 'left' },
        2: { halign: 'center', cellWidth: 12 },
        3: { halign: 'center', cellWidth: 14 },
        4: { halign: 'right', cellWidth: 24 },
        5: { halign: 'right', cellWidth: 24 },
      },
    })
    y = doc.lastAutoTable.finalY + 4

    // ================= PACKING DETAILS + TOTALS (side by side) =================
    const totalItems = items.reduce((s, i) => s + i.qty, 0)
    const totalPacks = items.reduce((s, i) => s + i.packs, 0)
    const boxes = Math.max(1, Math.ceil(totalPacks / 12))

    const tW = 76
    const tX = PAGE.w - M - tW
    const packW = CW - tW - 8

    const itemsPrice = Number(order.itemsPrice != null ? order.itemsPrice : items.reduce((s, i) => s + i.total, 0))
    const shippingPrice = Number(order.shippingPrice || 0)
    const platformFee = Number(order.platformFee || 0)
    const couponDiscount = Number(order.couponDiscount || 0)
    const walletDiscount = Number(order.walletDiscount || 0)
    const freeDelivery = order.freeDeliveryUsed || shippingPrice === 0
    const totalAmount = Number(order.totalAmount || order.amount || order.grandTotal || 0)

    const rows = []
    if (itemsPrice > 0) rows.push(['Items Subtotal', money(itemsPrice)])
    rows.push(['Delivery Charges', freeDelivery ? 'FREE' : money(shippingPrice)])
    if (platformFee > 0) rows.push(['Platform Fee', money(platformFee)])
    if (couponDiscount > 0) rows.push(['Coupon Discount', { text: `- ${money(couponDiscount)}`, color: C.green }])
    if (walletDiscount > 0) rows.push(['Wallet Redeemed', { text: `- ${money(walletDiscount)}`, color: C.green }])

    autoTable(doc, {
      body: rows.map(([l, r]) => [l, { content: typeof r === 'object' ? r.text : r, styles: r && r.color ? { textColor: r.color } : {} }]),
      foot: [['Grand Total', { content: money(totalAmount), styles: { fontStyle: 'bold', textColor: [255, 255, 255], fontSize: 9 } }]],
      startY: y,
      margin: { left: tX, right: M },
      theme: 'plain',
      bodyStyles: { fontSize: 7, textColor: [100, 116, 139], cellPadding: { top: 1, bottom: 1 } },
      footStyles: { fillColor: [219, 39, 119], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, cellPadding: { top: 1.5, bottom: 1.5 } },
      columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right' } },
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    })
    const totalsEnd = doc.lastAutoTable.finalY

    // ---- PACKING DETAILS card (left of totals) ----
    const packLines = [
      `Total Items: ${totalItems}`,
      `Total Packs: ${totalPacks}`,
      `Boxes: ${boxes}`,
      `Packed On: ${formatDate(order.updatedAt || order.createdAt)}`,
    ]
    const packLineH = level === 2 ? 3.6 : 4.3
    const packCardH = Math.max(totalsEnd - y, 20 + packLines.length * packLineH + 12)
    rect(M, y, packW, packCardH, C.white, C.line)
    doc.setFillColor(C.brand2)
    doc.rect(M, y, packW, 6.5, 'F')
    bold(6.5)
    doc.setTextColor(C.white)
    text('PACKING DETAILS', M + 3, y + 4.6)
    normal(6)
    doc.setTextColor(C.dark)
    packLines.forEach((l, i) => text(l, M + 4, y + 11 + i * 4.3))
    const barcodeY = y + packCardH - 13
    const bcW = Math.min(70, packW - 8)
    doc.setFillColor(C.dark)
    drawBarcode(doc, M + 4, barcodeY, bcW, 8, order.orderNumber || order.orderId || order._id)
    normal(5)
    doc.setTextColor(C.gray)
    text(`Packed By: Admin  |  ${clean(order.orderNumber || order.orderId || order._id)}`, M + 4, barcodeY + 11)

    y = Math.max(totalsEnd, y + packCardH) + 4

    // ================= AMOUNT IN WORDS =================
    const wordsTxt = `Amount in Words: Rupees ${numberToWords(totalAmount)} Only`
    if (!fit(16)) { doc.addPage(); y = M }
    doc.setFillColor(255, 228, 230)
    const wordsLines = wrap(wordsTxt, CW)
    const wordsH = 5 + wordsLines.length * 4
    doc.roundedRect(M, y, CW, wordsH, 2, 2, 'F')
    doc.setTextColor(C.brand2)
    bold(7)
    wordsLines.forEach((l, i) => text(l, M + 4, y + 4.6 + i * 4))
    y += wordsH + 6

    // ================= SIGNATURE =================
    if (!fit(18)) { doc.addPage(); y = M }
    line(M, y, M + 55, y, C.line, 0.3)
    normal(5.5)
    doc.setTextColor(C.gray)
    text('Authorised Signatory', M, y + 4.2)
    text('CHOOSEMOOD FASHION PVT. LTD.', M, y + 8)
    y += 14

    // ================= FOOTER =================
    doc.setFillColor(C.brand1)
    doc.rect(0, PAGE.h - 3, PAGE.w, 3, 'F')
    doc.setFillColor(C.light)
    doc.rect(0, PAGE.h - 22, PAGE.w, 19, 'F')
    doc.setTextColor(C.dark)
    bold(7)
    text('CHOOSEMOOD FASHION PVT. LTD.', PAGE.w / 2, PAGE.h - 18, { align: 'center' })
    normal(6)
    doc.setTextColor(C.gray)
    text('123, Fashion Street, Ring Road, Indore - 452001, Madhya Pradesh  |  GSTIN: 23ABCDE1234F1Z5  |  support@choosemood.in', PAGE.w / 2, PAGE.h - 14, { align: 'center' })
    text('This is a computer generated invoice. For any queries regarding this invoice, contact our support team.', PAGE.w / 2, PAGE.h - 10, { align: 'center' })
    text('Thank you for shopping with CHOOSEMOOD!', PAGE.w / 2, PAGE.h - 6.2, { align: 'center' })

    doc.save(`Invoice_${order.orderNumber || order.orderId || order._id || 'order'}.pdf`)
  } catch (error) {
    console.error('[INVOICE ERROR]', error)
    alert('Could not download invoice. See console for details.')
  }
}
