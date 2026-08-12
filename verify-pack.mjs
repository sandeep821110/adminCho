import { downloadInvoice } from './src/utils/downloadInvoice.js'

const makeItems = (n) =>
  Array.from({ length: n }, (_, i) => ({
    name: `Product Item ${i + 1}`,
    size: i % 2 ? 'M' : 'L',
    quantity: 1 + (i % 3),
    price: 199 + i * 37,
  }))

const mkOrder = (n) => ({
  _id: `order_${n}`,
  orderNumber: `CMTEST000${n}`,
  createdAt: '2026-08-11T08:14:02.105Z',
  paymentMethod: 'razorpay',
  paymentStatus: 'PAID',
  orderStatus: 'PACKED',
  items: makeItems(n),
  itemsPrice: makeItems(n).reduce((s, it) => s + it.price * it.quantity, 0),
  shippingPrice: 0,
  platformFee: 10,
  couponDiscount: 100,
  walletDiscount: 10,
  freeDeliveryUsed: true,
  totalAmount: 1787,
  amount: 1787,
  shippingAddress: {
    fullName: 'Sandeep Kumar',
    addressLine1: '12, MG Road',
    addressLine2: 'Near City Mall',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452001',
    phoneNumber: '9876543210',
    email: 'sandeep@example.com',
  },
})

downloadInvoice(mkOrder(1))
downloadInvoice(mkOrder(6))
downloadInvoice(mkOrder(14))
downloadInvoice(mkOrder(20))
console.log('ALL GENERATED')
