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
            'PLACED': 'bg-yellow-100 text-yellow-800',
            'CONFIRMED': 'bg-blue-100 text-blue-800',
            'SHIPPED': 'bg-purple-100 text-purple-800',
            'DELIVERED': 'bg-green-100 text-green-800',
            'CANCELLED': 'bg-red-100 text-red-800',
            'FAILED': 'bg-red-100 text-red-800',
            'PENDING': 'bg-gray-100 text-gray-800',
            'PAID': 'bg-green-100 text-green-800',
        }
        return map[status] || 'bg-gray-100 text-gray-800'
    }

    const paymentColor = (status) => {
        const map = {
            'PAID': 'bg-green-100 text-green-800',
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'FAILED': 'bg-red-100 text-red-800',
            'REFUNDED': 'bg-purple-100 text-purple-800',
        }
        return map[(status || '').toUpperCase()] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Orders Management</h1>
                    <button
                        onClick={() => { fetchAllOrders(); fetchOrderStats() }}
                        disabled={loading}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Total Orders</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.totalOrders || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Revenue</p>
                            <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Shipped</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.shippedOrders || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Delivered</p>
                            <p className="text-2xl font-bold text-green-600">{stats.deliveredOrders || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Cancelled</p>
                            <p className="text-2xl font-bold text-red-600">{stats.cancelledOrders || 0}</p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin border-4 border-blue-200 border-t-blue-600 rounded-full h-12 w-12 mb-4"></div>
                        <p className="text-gray-600">Loading orders...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && orders.length === 0 && !error && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded text-center">
                        <p className="text-yellow-800 font-semibold">No orders found</p>
                        <p className="text-yellow-700 text-sm mt-2">Orders will appear here once you have data in the database</p>
                    </div>
                )}

                {/* Orders Table */}
                {!loading && orders.length > 0 && (
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Order</th>
                                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Customer</th>
                                    <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Payment</th>
                                    <th className="px-4 py-3 text-left font-semibold">Total</th>
                                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order._id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-blue-600">{order.orderNumber || '#' + order._id?.slice(-6)}</p>
                                            <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <p className="font-medium">{order.userId?.name || order.customerName || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">{order.userId?.email || order.email || ''}</p>
                                            <p className="text-xs text-gray-400 font-mono">ID: {order.userId?._id || order.userId || 'N/A'}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColor(order.orderStatus || order.status)}`}>
                                                {displayStatus(order.orderStatus || order.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${paymentColor(order.paymentStatus)}`}>
                                                {displayStatus(order.paymentStatus)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-green-600">₹{order.totalAmount || 0}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openOrderDetails(order)}
                                                    className="px-3 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition"
                                                >
                                                    View
                                                </button>
                                                {(order.orderStatus || '').toUpperCase() !== 'CANCELLED' && (order.orderStatus || '').toUpperCase() !== 'DELIVERED' && (
                                                    <button
                                                        onClick={() => { openOrderDetails(order); setTimeout(() => setShowCancelModal(true), 300) }}
                                                        className="px-3 py-1 text-xs text-orange-600 border border-orange-300 rounded hover:bg-orange-50 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteOrder(order._id)}
                                                    className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition"
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
                )}

                {/* Order Details Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8">
                            <div className="bg-blue-600 text-white p-6 rounded-t-lg flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Order Details</h2>
                                    <p className="text-blue-100 text-sm mt-1">{selectedOrder.orderNumber || '#' + selectedOrder._id?.slice(-6)}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="text-2xl hover:text-gray-200 transition">&times;</button>
                            </div>

                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                                {/* Tracking Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-700 mb-2">Tracking</h3>
                                    {trackingInfo ? (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">Tracking Number</p>
                                                <p className="font-mono font-bold text-green-600">{trackingInfo.trackingNumber}</p>
                                                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded ${
                                                    trackingInfo.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    trackingInfo.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>{trackingInfo.status?.replace(/_/g, ' ')}</span>
                                            </div>
                                            <button
                                                onClick={() => navigate('/tracking')}
                                                className="px-3 py-2 text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
                                            >
                                                View Full Tracking
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">No tracking record found for this order.</p>
                                    )}
                                </div>

                                {/* Rider Assignment */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h3 className="font-semibold text-gray-700 mb-2">Rider Assignment</h3>
                                  {selectedOrder.assignedRider ? (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <p className="text-sm text-gray-500">Assigned Rider</p>
                                          <p className="font-semibold text-green-600">
                                            {selectedOrder.assignedRider?.name || 'Rider assigned'}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                            {selectedOrder.assignedRider?.email} | {selectedOrder.assignedRider?.phone}
                                          </p>
                                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 capitalize">
                                            {selectedOrder.riderStatus || 'assigned'}
                                          </span>
                                        </div>
                                      </div>
                                      {selectedOrder.assignedRider?.currentLat && selectedOrder.assignedRider?.currentLng && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                          <p className="text-xs text-gray-500 mb-1">Live Location</p>
                                          <div className="flex items-center gap-3 text-xs">
                                            <a
                                              href={`https://www.google.com/maps?q=${selectedOrder.assignedRider.currentLat},${selectedOrder.assignedRider.currentLng}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-indigo-600 hover:underline font-medium"
                                            >
                                              <MapPin size={14} />
                                              View on Map
                                            </a>
                                            {selectedOrder.assignedRider.lastLocationUpdate && (
                                              <span className="text-gray-400">
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
                                        <p className="text-gray-500 text-sm">Order Number</p>
                                        <p className="font-bold text-blue-600">{selectedOrder.orderNumber || '#' + selectedOrder._id?.slice(-6)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">Date</p>
                                        <p className="font-bold">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">Status</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${statusColor(selectedOrder.orderStatus || selectedOrder.status)}`}>
                                                {displayStatus(selectedOrder.orderStatus || selectedOrder.status)}
                                            </span>
                                            <select
                                                value={selectedOrder._statusDraft ?? selectedOrder.orderStatus ?? selectedOrder.status ?? ''}
                                                onChange={(e) => setSelectedOrder({ ...selectedOrder, _statusDraft: e.target.value })}
                                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-semibold transition"
                                            >
                                                {statusUpdating ? '...' : 'Update'}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">Payment</p>
                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${paymentColor(selectedOrder.paymentStatus)}`}>
                                            {selectedOrder.paymentStatus || 'Unpaid'}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t" />

                                {/* Customer Info */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Customer</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm">
                                        <p><span className="text-gray-500">Customer ID:</span> <span className="font-mono font-semibold">{selectedOrder.userId?._id || selectedOrder.userId || 'N/A'}</span></p>
                                        <p><span className="text-gray-500">Name:</span> <span className="font-semibold">{selectedOrder.userId?.name || selectedOrder.customerName || 'N/A'}</span></p>
                                        <p><span className="text-gray-500">Email:</span> <span className="font-semibold">{selectedOrder.userId?.email || selectedOrder.email || 'N/A'}</span></p>
                                        <p><span className="text-gray-500">Phone:</span> <span className="font-semibold">{selectedOrder.userId?.phone || selectedOrder.phone || 'N/A'}</span></p>
                                    </div>
                                </div>

                                <div className="border-t" />

                                {/* Shipping */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Shipping Address</h3>
                                    {selectedOrder.shippingAddressId && (
                                        <p className="text-xs text-gray-400 font-mono mb-1">Address ID: {selectedOrder.shippingAddressId}</p>
                                    )}
                                    <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                                        <p className="font-semibold">{selectedOrder.shippingAddress?.name || selectedOrder.deliveryAddress?.name || 'N/A'}</p>
                                        <p>{selectedOrder.shippingAddress?.address || selectedOrder.deliveryAddress?.address || ''}</p>
                                        <p>{[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.state, selectedOrder.shippingAddress?.pincode].filter(Boolean).join(', ') || [selectedOrder.deliveryAddress?.city, selectedOrder.deliveryAddress?.state, selectedOrder.deliveryAddress?.pincode].filter(Boolean).join(', ')}</p>
                                        <p className="text-blue-600 font-semibold">Phone: {selectedOrder.shippingAddress?.phone || selectedOrder.deliveryAddress?.phone || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Billing (if different) */}
                                {selectedOrder.billingAddress && JSON.stringify(selectedOrder.billingAddress) !== JSON.stringify(selectedOrder.shippingAddress) && (
                                    <>
                                        <div className="border-t" />
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 mb-2">Billing Address</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                                                <p className="font-semibold">{selectedOrder.billingAddress?.name || 'N/A'}</p>
                                                <p>{selectedOrder.billingAddress?.address || ''}</p>
                                                <p>{[selectedOrder.billingAddress?.city, selectedOrder.billingAddress?.state, selectedOrder.billingAddress?.pincode].filter(Boolean).join(', ')}</p>
                                                <p className="text-blue-600 font-semibold">Phone: {selectedOrder.billingAddress?.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="border-t" />

                                {/* Items */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Items</h3>
                                    <div className="space-y-2">
                                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                            selectedOrder.items.map((item, i) => (
                                                <div key={item._id || i} className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold">{item.name || 'Product'}</p>
                                                        <p className="text-sm text-gray-500">Qty: {item.quantity}{item.size ? ` | Size: ${item.size}` : ''}</p>
                                                    </div>
                                                    <p className="font-bold text-blue-600">₹{item.price}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm">No items</p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t" />

                                {/* Summary */}
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{selectedOrder.subtotal || selectedOrder.totalAmount || 0}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-semibold">FREE</span></div>
                                    {selectedOrder.tax && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="font-semibold">₹{selectedOrder.tax}</span></div>}
                                    {selectedOrder.discount && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-semibold">-₹{selectedOrder.discount}</span></div>}
                                    <div className="flex justify-between text-lg font-bold text-blue-600 bg-gray-100 p-3 rounded mt-2">
                                        <span>Total</span><span>₹{selectedOrder.totalAmount || 0}</span>
                                    </div>
                                </div>

                                <div className="border-t" />

                                {/* Payment Method */}
                                {selectedOrder.paymentMethod && (
                                    <div>
                                        <p className="text-gray-500 text-sm">Payment Method</p>
                                        <p className="font-bold">{selectedOrder.paymentMethod}</p>
                                    </div>
                                )}

                            </div>

                            {/* Modal Footer */}
                            <div className="bg-gray-100 p-6 rounded-b-lg flex flex-wrap gap-3">
                                <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition">Close</button>
                                {(selectedOrder.orderStatus || '').toUpperCase() !== 'CANCELLED' && (selectedOrder.orderStatus || '').toUpperCase() !== 'DELIVERED' && (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                                {((selectedOrder.orderStatus || '').toUpperCase() === 'DELIVERED' || (selectedOrder.orderStatus || '').toUpperCase() === 'CANCELLED') && (selectedOrder.paymentStatus || '').toUpperCase() !== 'REFUNDED' && (
                                    <button
                                        onClick={() => setShowRefundModal(true)}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
                                    >
                                        Process Refund
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteOrder(selectedOrder._id)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => downloadInvoice(selectedOrder)}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
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
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
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
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Cancel Order</h2>
                            <p className="text-sm text-gray-500 mb-4">Order: {selectedOrder?.orderNumber || '#' + selectedOrder?._id?.slice(-6)}</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Cancel Reason *</label>
                                    <select
                                        value={cancelData.reason}
                                        onChange={(e) => setCancelData({ ...cancelData, reason: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">Select a reason...</option>
                                        {CANCEL_REASONS.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Details (optional)</label>
                                    <textarea
                                        value={cancelData.reasonText}
                                        onChange={(e) => setCancelData({ ...cancelData, reasonText: e.target.value })}
                                        placeholder="Additional details..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { setShowCancelModal(false); setCancelData({ reason: '', reasonText: '' }) }}
                                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={!cancelData.reason || cancelling}
                                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg font-semibold transition"
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
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Request Refund</h2>
                            <p className="text-sm text-gray-500 mb-2">
                                Order: {selectedOrder?.orderNumber || '#' + selectedOrder?._id?.slice(-6)} | Amount: ₹{selectedOrder?.totalAmount || 0}
                            </p>
                            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 mb-4">
                                This will cancel the order and create a PENDING refund request. An admin must approve and process the refund from the Refunds page. Refunds are processed within 2 business days after approval.
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Refund Reason *</label>
                                    <select
                                        value={refundData.reason}
                                        onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Select a reason...</option>
                                        {REFUND_REASONS.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Details (optional)</label>
                                    <textarea
                                        value={refundData.reasonText}
                                        onChange={(e) => setRefundData({ ...refundData, reasonText: e.target.value })}
                                        placeholder="Additional details..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        rows="2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Notes</label>
                                    <textarea
                                        value={refundData.notes}
                                        onChange={(e) => setRefundData({ ...refundData, notes: e.target.value })}
                                        placeholder="Internal notes..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        rows="2"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { setShowRefundModal(false); setRefundData({ reason: '', reasonText: '', notes: '' }) }}
                                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestRefund}
                                    disabled={!refundData.reason || refunding}
                                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
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
                <p className="text-sm text-gray-400">Loading riders...</p>
            ) : riders.length === 0 ? (
                <p className="text-sm text-amber-600">No approved riders available. Approve riders first.</p>
            ) : (
                <div className="flex gap-2">
                    <select
                        value={selectedRider}
                        onChange={(e) => setSelectedRider(e.target.value)}
                        className="flex-1 text-xs border border-gray-300 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
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
