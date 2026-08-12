import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { downloadInvoice } from '../../utils/downloadInvoice'
import { MapPin } from 'lucide-react'

const CANCEL_REASONS = [
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
  { value: 'CUSTOMER_REQUEST', label: 'Customer Requested' },
  { value: 'DUPLICATE_ORDER', label: 'Duplicate Order' },
  { value: 'WRONG_ITEM', label: 'Wrong Item Ordered' },
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue' },
  { value: 'FRAUD_SUSPECTED', label: 'Fraud Suspected' },
  { value: 'OTHER', label: 'Other' },
]

const REFUND_REASONS = [
  { value: 'DAMAGED_PRODUCT', label: 'Damaged Product' },
  { value: 'DEFECTIVE_PRODUCT', label: 'Defective Product' },
  { value: 'WRONG_ITEM', label: 'Wrong Item Delivered' },
  { value: 'WRONG_SIZE', label: 'Wrong Size Delivered' },
  { value: 'ITEM_NOT_AS_DESCRIBED', label: 'Item Not as Described' },
  { value: 'DUPLICATE_ORDER', label: 'Duplicate Order' },
  { value: 'CUSTOMER_REQUEST', label: 'Customer Request' },
  { value: 'OTHER', label: 'Other' },
]

const READ_URL = '/api/orders'
const ADMIN_URL = '/api/admin/orders'

const STATUS_LABELS = {
  PLACED: 'Placed', CONFIRMED: 'Confirmed', SHIPPED: 'Shipped',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled', PENDING: 'Pending', FAILED: 'Failed', PAID: 'Paid',
}
const displayStatus = (s) => STATUS_LABELS[s] || s || 'Unknown'

const GetallOrder = () => {
    const [orders, setOrders] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [trackingInfo, setTrackingInfo] = useState(null)
    const { token, isAdmin } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isAdmin()) {
            navigate('/')
            return
        }
        fetchAllOrders()
        fetchOrderStats()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, navigate])

    const headers = { Authorization: `Bearer ${token}` }

    const fetchOrderStats = async () => {
        try {
            const res = await axios.get(`${ADMIN_URL}/stats`, { headers })
            const data = res.data?.data || res.data?.stats || res.data
            if (data) {
                const s = {
                    totalOrders: data.totalOrders || 0,
                    totalRevenue: data.totalRevenue || 0,
                    pendingOrders: data.placedorders || data.pendingorders || 0,
                    cancelledOrders: data.cancelledorders || 0,
                    shippedOrders: data.shippedorders || 0,
                    deliveredOrders: data.deliveredorders || 0,
                }
                setStats(s)
            }
        } catch { /* stats are optional */ }
    }

    const fetchAllOrders = async () => {
        try {
            setLoading(true)
            setError('')

            const res = await axios.get(READ_URL, { headers })

            let ordersData = []
            if (Array.isArray(res.data)) {
                ordersData = res.data
            } else if (res.data?.orders && Array.isArray(res.data.orders)) {
                ordersData = res.data.orders
            } else if (res.data?.data && Array.isArray(res.data.data)) {
                ordersData = res.data.data
            }

            setOrders(ordersData)
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to fetch orders'
            setError(msg)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const fetchOrderById = async (orderId) => {
        try {
            setLoading(true)
            setError('')
            const res = await axios.get(`${READ_URL}/${orderId}`, { headers })
            const data = res.data?.data || res.data?.order || res.data
            setSelectedOrder(data)
            return data
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to fetch order details'
            setError(msg)
            return null
        } finally {
            setLoading(false)
        }
    }

    const [statusUpdating, setStatusUpdating] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelData, setCancelData] = useState({ reason: '', reasonText: '' })
    const [cancelling, setCancelling] = useState(false)
    const [showRefundModal, setShowRefundModal] = useState(false)
    const [refundData, setRefundData] = useState({ reason: '', reasonText: '', notes: '' })
    const [refunding, setRefunding] = useState(false)

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setStatusUpdating(true)
            setError('')
            const res = await axios.put(`${ADMIN_URL}/${orderId}`, { status: newStatus }, { headers })
            const updated = res.data?.data || res.data?.order || res.data
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...updated, orderStatus: newStatus } : o))
            setSelectedOrder(prev => prev ? { ...prev, ...updated, orderStatus: newStatus } : prev)
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to update order status'
            setError(msg)
        } finally {
            setStatusUpdating(false)
        }
    }

    const handleCancelOrder = async () => {
        if (!cancelData.reason) return
        try {
            setCancelling(true)
            setError('')
            const res = await axios.patch(`${ADMIN_URL}/${selectedOrder._id}/cancel`, cancelData, { headers })
            const updated = res.data?.data || res.data?.order || res.data
            setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, ...updated, orderStatus: 'CANCELLED' } : o))
            setSelectedOrder(prev => prev ? { ...prev, ...updated, orderStatus: 'CANCELLED' } : prev)
            setShowCancelModal(false)
            setCancelData({ reason: '', reasonText: '' })
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to cancel order'
            setError(msg)
        } finally {
            setCancelling(false)
        }
    }

    const handleRequestRefund = async () => {
        if (!refundData.reason) return
        try {
            setRefunding(true)
            setError('')
            const cancelRes = await axios.patch(`${ADMIN_URL}/${selectedOrder._id}/cancel`, {
                reason: refundData.reason,
                reasonText: refundData.reasonText,
            }, { headers })
            const updatedOrder = cancelRes.data?.data || cancelRes.data?.order || cancelRes.data
            setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, ...updatedOrder, orderStatus: 'CANCELLED' } : o))
            setSelectedOrder(prev => prev ? { ...prev, ...updatedOrder, orderStatus: 'CANCELLED' } : prev)
            setShowRefundModal(false)
            setRefundData({ reason: '', reasonText: '', notes: '' })
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to request refund'
            setError(msg)
        } finally {
            setRefunding(false)
        }
    }

    const deleteOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return
        try {
            setLoading(true)
            setError('')
            await axios.delete(`${ADMIN_URL}/${orderId}`, { headers })
            setOrders(prev => prev.filter(o => o._id !== orderId))
            setSelectedOrder(null)
            setTrackingInfo(null)
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to delete order'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const openOrderDetails = async (order) => {
        const full = await fetchOrderById(order._id)
        if (full) {
            (async () => {
                try {
                    const res = await axios.get(`/api/tracking/by-order/${encodeURIComponent(order.orderNumber || order._id)}`, { headers })
                    setTrackingInfo(res.data?.data || null)
                } catch {
                    setTrackingInfo(null)
                }
            })()
        }
    }

    const statusColor = (status) => {
        const map = {
            'PLACED': 'bg-rose-50 text-rose-500',
            'CONFIRMED': 'bg-pink-50 text-pink-600',
            'SHIPPED': 'bg-pink-50 text-pink-700',
            'DELIVERED': 'bg-emerald-50 text-emerald-600',
            'CANCELLED': 'bg-rose-50 text-rose-600',
            'FAILED': 'bg-rose-50 text-rose-600',
            'PENDING': 'bg-amber-50 text-amber-600',
            'PAID': 'bg-emerald-50 text-emerald-600',
        }
        return map[status] || 'bg-slate-50 text-slate-600'
    }

    const paymentColor = (status) => {
        const map = {
            'PAID': 'bg-emerald-50 text-emerald-600',
            'PENDING': 'bg-amber-50 text-amber-600',
            'FAILED': 'bg-rose-50 text-rose-600',
            'REFUNDED': 'bg-rose-50 text-rose-500',
        }
        return map[(status || '').toUpperCase()] || 'bg-slate-50 text-slate-600'
    }

    return (
        <div className="min-h-screen page-bg p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <span className="section-badge">📦 Orders</span>
                        <h1 className="section-title mt-3">Orders <span className="gradient-text-animated">Management</span></h1>
                    </div>
                    <button
                        onClick={() => { fetchAllOrders(); fetchOrderStats() }}
                        disabled={loading}
                        className="w-full sm:w-auto btn-gradient"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">{error}</div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                        <div className="card card-hover !p-5">
                            <p className="text-xs text-slate-500 font-semibold uppercase">Total Orders</p>
                            <p className="text-2xl font-bold gradient-text mt-1">{stats.totalOrders || 0}</p>
                        </div>
                        <div className="card card-hover !p-5">
                            <p className="text-xs text-slate-500 font-semibold uppercase">Revenue</p>
                            <p className="text-2xl font-bold gradient-text mt-1">₹{stats.totalRevenue || 0}</p>
                        </div>
                        <div className="card card-hover !p-5">
                            <p className="text-xs text-slate-500 font-semibold uppercase">Pending</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingOrders || 0}</p>
                        </div>
                        <div className="card card-hover !p-5">
                            <p className="text-xs text-slate-500 font-semibold uppercase">Shipped</p>
                            <p className="text-2xl font-bold text-pink-700 mt-1">{stats.shippedOrders || 0}</p>
                        </div>
                        <div className="card card-hover !p-5">
                            <p className="text-xs text-slate-500 font-semibold uppercase">Delivered</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.deliveredOrders || 0}</p>
                        </div>
                        <div className="card card-hover !p-5">
                            <p className="text-xs text-slate-500 font-semibold uppercase">Cancelled</p>
                            <p className="text-2xl font-bold text-rose-600 mt-1">{stats.cancelledOrders || 0}</p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin border-4 border-pink-200 border-t-pink-600 rounded-full h-12 w-12 mb-4"></div>
                        <p className="text-slate-600">Loading orders...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && orders.length === 0 && !error && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-xl text-center">
                        <p className="text-amber-800 font-semibold">No orders found</p>
                        <p className="text-amber-700 text-sm mt-2">Orders will appear here once you have data in the database</p>
                    </div>
                )}

                {/* Orders Table */}
                {!loading && orders.length > 0 && (
                    <div className="card !overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left">Order</th>
                                    <th className="px-4 py-3 text-left hidden md:table-cell">Customer</th>
                                    <th className="px-4 py-3 text-left hidden sm:table-cell">Status</th>
                                    <th className="px-4 py-3 text-left hidden sm:table-cell">Payment</th>
                                    <th className="px-4 py-3 text-left">Total</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order._id} className="border-t border-slate-100 hover:bg-rose-50/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-pink-600">{order.orderNumber || '#' + order._id?.slice(-6)}</p>
                                            <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <p className="font-medium">{order.userId?.name || order.customerName || 'N/A'}</p>
                                            <p className="text-xs text-slate-500">{order.userId?.email || order.email || ''}</p>
                                            <p className="text-xs text-slate-400 font-mono">ID: {order.userId?._id || order.userId || 'N/A'}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`chip ${statusColor(order.orderStatus || order.status)}`}>
                                                {displayStatus(order.orderStatus || order.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`chip ${paymentColor(order.paymentStatus)}`}>
                                                {displayStatus(order.paymentStatus)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-emerald-600">₹{order.totalAmount || 0}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openOrderDetails(order)}
                                                    className="px-3 py-1 text-xs font-semibold text-pink-600 border border-pink-200 rounded-lg hover:bg-pink-50 transition"
                                                >
                                                    View
                                                </button>
                                                {(order.orderStatus || '').toUpperCase() !== 'CANCELLED' && (order.orderStatus || '').toUpperCase() !== 'DELIVERED' && (
                                                    <button
                                                        onClick={() => { openOrderDetails(order); setTimeout(() => setShowCancelModal(true), 300) }}
                                                        className="px-3 py-1 text-xs font-semibold text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => downloadInvoice(order)}
                                                    className="px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition"
                                                >
                                                    Invoice
                                                </button>
                                                <button
                                                    onClick={() => deleteOrder(order._id)}
                                                    className="px-3 py-1 text-xs font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                )}

                {/* Order Details Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-100 max-w-2xl w-full my-8">
                            <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Order Details</h2>
                                    <p className="text-pink-100 text-sm mt-1">{selectedOrder.orderNumber || '#' + selectedOrder._id?.slice(-6)}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 transition text-xl leading-none">&times;</button>
                            </div>

                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                                {/* Tracking Info */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <h3 className="font-semibold text-slate-700 mb-2">Tracking</h3>
                                    {trackingInfo ? (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-slate-500">Tracking Number</p>
                                                <p className="font-mono font-bold text-green-600">{trackingInfo.trackingNumber}</p>
                                                <span className={`chip mt-1 ${trackingInfo.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : trackingInfo.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-pink-50 text-pink-600'}`}>{trackingInfo.status?.replace(/_/g, ' ')}</span>
                                            </div>
                                            <button
                                                onClick={() => navigate('/tracking')}
                                                className="px-3 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
                                            >
                                                View Full Tracking
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400">No tracking record found for this order.</p>
                                    )}
                                </div>

                                {/* Rider Assignment */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <h3 className="font-semibold text-slate-700 mb-2">Rider Assignment</h3>
                                  {selectedOrder.assignedRider ? (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <p className="text-sm text-slate-500">Assigned Rider</p>
                                          <p className="font-semibold text-green-600">
                                            {selectedOrder.assignedRider?.name || 'Rider assigned'}
                                          </p>
                                          <p className="text-xs text-slate-400">
                                            {selectedOrder.assignedRider?.email} | {selectedOrder.assignedRider?.phone}
                                          </p>
                                          <span className="chip mt-1 bg-pink-50 text-pink-600 capitalize">
                                            {selectedOrder.riderStatus || 'assigned'}
                                          </span>
                                        </div>
                                      </div>
                                      {selectedOrder.assignedRider?.currentLat && selectedOrder.assignedRider?.currentLng && (
                                        <div className="mt-2 pt-2 border-t border-slate-200">
                                          <p className="text-xs text-slate-500 mb-1">Live Location</p>
                                          <div className="flex items-center gap-3 text-xs">
                                            <a
                                              href={`https://www.google.com/maps?q=${selectedOrder.assignedRider.currentLat},${selectedOrder.assignedRider.currentLng}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-pink-600 hover:underline font-medium"
                                            >
                                              <MapPin size={14} />
                                              View on Map
                                            </a>
                                            {selectedOrder.assignedRider.lastLocationUpdate && (
                                              <span className="text-slate-400">
                                                Updated {new Date(selectedOrder.assignedRider.lastLocationUpdate).toLocaleTimeString()}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <AssignOrderForm
                                      orderId={selectedOrder._id}
                                      onAssigned={(updated) => {
                                        setSelectedOrder({ ...selectedOrder, ...updated });
                                        setOrders(prev => prev.map(o => o._id === updated._id ? { ...o, ...updated } : o));
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Order Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-slate-500 text-sm">Order Number</p>
                                        <p className="font-bold text-pink-600">{selectedOrder.orderNumber || '#' + selectedOrder._id?.slice(-6)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-sm">Date</p>
                                        <p className="font-bold">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-sm">Status</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`chip ${statusColor(selectedOrder.orderStatus || selectedOrder.status)}`}>
                                                {displayStatus(selectedOrder.orderStatus || selectedOrder.status)}
                                            </span>
                                            <select
                                                value={selectedOrder._statusDraft ?? selectedOrder.orderStatus ?? selectedOrder.status ?? ''}
                                                onChange={(e) => setSelectedOrder({ ...selectedOrder, _statusDraft: e.target.value })}
                                                className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition"
                                                disabled={statusUpdating}
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="PLACED">Placed</option>
                                                <option value="CONFIRMED">Confirmed</option>
                                                <option value="PAID">Paid</option>
                                                <option value="SHIPPED">Shipped</option>
                                                <option value="DELIVERED">Delivered</option>
                                                <option value="CANCELLED">Cancelled</option>
                                                <option value="FAILED">Failed</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const newStatus = selectedOrder._statusDraft || selectedOrder.orderStatus || selectedOrder.status
                                                    if (newStatus && newStatus !== (selectedOrder.orderStatus || selectedOrder.status)) {
                                                        updateOrderStatus(selectedOrder._id, newStatus)
                                                    }
                                                }}
                                                disabled={statusUpdating || !selectedOrder._statusDraft || selectedOrder._statusDraft === (selectedOrder.orderStatus || selectedOrder.status)}
                                                className="text-xs px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:shadow-md shadow-pink-500/25 disabled:opacity-50 text-white rounded-lg font-semibold transition"
                                            >
                                                {statusUpdating ? '...' : 'Update'}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-sm">Payment</p>
                                        <span className={`chip ${paymentColor(selectedOrder.paymentStatus)}`}>
                                            {selectedOrder.paymentStatus || 'Unpaid'}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t" />

                                {/* Customer Info */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Customer</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1 text-sm">
                                        <p><span className="text-slate-500">Customer ID:</span> <span className="font-mono font-semibold">{selectedOrder.userId?._id || selectedOrder.userId || 'N/A'}</span></p>
                                        <p><span className="text-slate-500">Name:</span> <span className="font-semibold">{selectedOrder.userId?.name || selectedOrder.customerName || 'N/A'}</span></p>
                                        <p><span className="text-slate-500">Email:</span> <span className="font-semibold">{selectedOrder.userId?.email || selectedOrder.email || 'N/A'}</span></p>
                                        <p><span className="text-slate-500">Phone:</span> <span className="font-semibold">{selectedOrder.userId?.phone || selectedOrder.phone || 'N/A'}</span></p>
                                    </div>
                                </div>

                                <div className="border-t" />

                                {/* Shipping */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Shipping Address</h3>
                                    {selectedOrder.shippingAddressId && (
                                        <p className="text-xs text-slate-400 font-mono mb-1">Address ID: {selectedOrder.shippingAddressId}</p>
                                    )}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-1">
                                        <p className="font-semibold">{selectedOrder.shippingAddress?.name || selectedOrder.deliveryAddress?.name || 'N/A'}</p>
                                        <p>{selectedOrder.shippingAddress?.address || selectedOrder.deliveryAddress?.address || ''}</p>
                                        <p>{[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.state, selectedOrder.shippingAddress?.pincode].filter(Boolean).join(', ') || [selectedOrder.deliveryAddress?.city, selectedOrder.deliveryAddress?.state, selectedOrder.deliveryAddress?.pincode].filter(Boolean).join(', ')}</p>
                                        <p className="text-pink-600 font-semibold">Phone: {selectedOrder.shippingAddress?.phone || selectedOrder.deliveryAddress?.phone || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Billing (if different) */}
                                {selectedOrder.billingAddress && JSON.stringify(selectedOrder.billingAddress) !== JSON.stringify(selectedOrder.shippingAddress) && (
                                    <>
                                        <div className="border-t" />
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-2">Billing Address</h3>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-1">
                                                <p className="font-semibold">{selectedOrder.billingAddress?.name || 'N/A'}</p>
                                                <p>{selectedOrder.billingAddress?.address || ''}</p>
                                                <p>{[selectedOrder.billingAddress?.city, selectedOrder.billingAddress?.state, selectedOrder.billingAddress?.pincode].filter(Boolean).join(', ')}</p>
                                                <p className="text-pink-600 font-semibold">Phone: {selectedOrder.billingAddress?.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="border-t" />

                                {/* Items */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Items</h3>
                                    <div className="space-y-2">
                                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                            selectedOrder.items.map((item, i) => (
                                                <div key={item._id || i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold">{item.name || 'Product'}</p>
                                                        <p className="text-sm text-slate-500">Qty: {item.quantity}{item.size ? ` | Size: ${item.size}` : ''}</p>
                                                    </div>
                                                    <p className="font-bold text-pink-600">₹{item.price}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 text-sm">No items</p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t" />

                                {/* Summary */}
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold">₹{selectedOrder.subtotal || selectedOrder.totalAmount || 0}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span className="font-semibold">FREE</span></div>
                                    {selectedOrder.tax && <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="font-semibold">₹{selectedOrder.tax}</span></div>}
                                    {selectedOrder.discount && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-semibold">-₹{selectedOrder.discount}</span></div>}
                                    <div className="flex justify-between text-lg font-bold text-pink-600 bg-gradient-to-br from-slate-50 to-pink-50 p-3 rounded-xl mt-2">
                                        <span>Total</span><span>₹{selectedOrder.totalAmount || 0}</span>
                                    </div>
                                </div>

                                <div className="border-t" />

                                {/* Payment Method */}
                                {selectedOrder.paymentMethod && (
                                    <div>
                                        <p className="text-slate-500 text-sm">Payment Method</p>
                                        <p className="font-bold">{selectedOrder.paymentMethod}</p>
                                    </div>
                                )}

                            </div>

                            {/* Modal Footer */}
                            <div className="bg-slate-50 p-6 rounded-b-2xl border-t border-slate-100 flex flex-wrap gap-3">
                                <button onClick={() => setSelectedOrder(null)} className="btn-dark">Close</button>
                                {(selectedOrder.orderStatus || '').toUpperCase() !== 'CANCELLED' && (selectedOrder.orderStatus || '').toUpperCase() !== 'DELIVERED' && (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-md transition"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                                {((selectedOrder.orderStatus || '').toUpperCase() === 'DELIVERED' || (selectedOrder.orderStatus || '').toUpperCase() === 'CANCELLED') && (selectedOrder.paymentStatus || '').toUpperCase() !== 'REFUNDED' && (
                                    <button
                                        onClick={() => setShowRefundModal(true)}
                                        className="btn-gradient"
                                    >
                                        Process Refund
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteOrder(selectedOrder._id)}
                                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-md transition"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => downloadInvoice(selectedOrder)}
                                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md transition"
                                >
                                    Download Invoice
                                </button>
                                <button
                                    onClick={() => {
                                        const blob = new Blob([JSON.stringify(selectedOrder, null, 2)], { type: 'application/json' })
                                        const url = URL.createObjectURL(blob)
                                        const a = document.createElement('a')
                                        a.href = url
                                        a.download = `order-${selectedOrder.orderNumber || selectedOrder._id}.json`
                                        a.click()
                                    }}
                                    className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-semibold shadow-md transition"
                                >
                                    JSON
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancel Reason Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Cancel Order</h2>
                            <p className="text-sm text-slate-500 mb-4">Order: {selectedOrder?.orderNumber || '#' + selectedOrder?._id?.slice(-6)}</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cancel Reason *</label>
                                    <select
                                        value={cancelData.reason}
                                        onChange={(e) => setCancelData({ ...cancelData, reason: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition"
                                    >
                                        <option value="">Select a reason...</option>
                                        {CANCEL_REASONS.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Details (optional)</label>
                                    <textarea
                                        value={cancelData.reasonText}
                                        onChange={(e) => setCancelData({ ...cancelData, reasonText: e.target.value })}
                                        placeholder="Additional details..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { setShowCancelModal(false); setCancelData({ reason: '', reasonText: '' }) }}
                                    className="btn-dark flex-1 justify-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={!cancelData.reason || cancelling}
                                    className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-md transition"
                                >
                                    {cancelling ? 'Processing...' : 'Confirm Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Refund Reason Modal */}
                {showRefundModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Request Refund</h2>
                            <p className="text-sm text-slate-500 mb-2">
                                Order: {selectedOrder?.orderNumber || '#' + selectedOrder?._id?.slice(-6)} | Amount: ₹{selectedOrder?.totalAmount || 0}
                            </p>
                            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">
                                This will cancel the order and create a PENDING refund request. An admin must approve and process the refund from the Refunds page. Refunds are processed within 2 business days after approval.
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Refund Reason *</label>
                                    <select
                                        value={refundData.reason}
                                        onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition"
                                    >
                                        <option value="">Select a reason...</option>
                                        {REFUND_REASONS.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Details (optional)</label>
                                    <textarea
                                        value={refundData.reasonText}
                                        onChange={(e) => setRefundData({ ...refundData, reasonText: e.target.value })}
                                        placeholder="Additional details..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition"
                                        rows="2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Admin Notes</label>
                                    <textarea
                                        value={refundData.notes}
                                        onChange={(e) => setRefundData({ ...refundData, notes: e.target.value })}
                                        placeholder="Internal notes..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition"
                                        rows="2"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { setShowRefundModal(false); setRefundData({ reason: '', reasonText: '', notes: '' }) }}
                                    className="btn-dark flex-1 justify-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestRefund}
                                    disabled={!refundData.reason || refunding}
                                    className="btn-gradient flex-1 justify-center"
                                >
                                    {refunding ? 'Submitting...' : 'Request Refund'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const AssignOrderForm = ({ orderId, onAssigned }) => {
    const [riders, setRiders] = useState([]);
    const [selectedRider, setSelectedRider] = useState('');
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAvailableRiders();
    }, []);

    const fetchAvailableRiders = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/riders/admin/list', {
                params: { status: 'approved' },
            });
            setRiders(res.data.riders || []);
        } catch {
            setError('Failed to load riders');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedRider) return;
        setAssigning(true);
        setError('');
        try {
            const res = await axios.post('/api/riders/admin/assign-order', {
                orderId,
                riderId: selectedRider,
            });
            if (onAssigned) onAssigned(res.data.order);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign order');
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div>
            {loading ? (
                <p className="text-sm text-slate-400">Loading riders...</p>
            ) : riders.length === 0 ? (
                <p className="text-sm text-amber-600">No approved riders available. Approve riders first.</p>
            ) : (
                <div className="flex gap-2">
                    <select
                        value={selectedRider}
                        onChange={(e) => setSelectedRider(e.target.value)}
                        className="flex-1 text-xs rounded-lg border border-slate-200 bg-white px-2 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition"
                    >
                        <option value="">Select a rider...</option>
                        {riders.map((r) => (
                            <option key={r._id} value={r._id}>
                                {r.name} - {r.phone} ({r.totalDeliveries || 0} deliveries)
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedRider || assigning}
                        className="px-3 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
                    >
                        {assigning ? '...' : 'Assign'}
                    </button>
                </div>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export default GetallOrder
