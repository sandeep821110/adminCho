import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ADMIN_URL = '/api/admin/orders'

const PAYMENT_STATUS_LABELS = {
  PAID: 'Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
}

const PaymentList = () => {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [totals, setTotals] = useState({ count: 0, totalAmount: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const { token, isAdmin } = useAuth()
  const navigate = useNavigate()
  const limit = 20

  useEffect(() => {
    if (!isAdmin()) { navigate('/'); return }
    fetchPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, navigate, statusFilter, page])

  const headers = { Authorization: `Bearer ${token}` }

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({ limit, skip: page * limit })
      if (statusFilter) params.append('paymentStatus', statusFilter)
      const res = await axios.get(`${ADMIN_URL}/payments?${params}`, { headers })
      setOrders(res.data?.data || [])
      setStats(res.data?.stats || {})
      setTotals(res.data?.totals || { count: 0, totalAmount: 0 })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to fetch payments'
      setError(msg)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status) => {
    const map = {
      PAID: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-pink-100 text-pink-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  const totalPages = Math.ceil((totals?.count || 0) / limit)

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Online Payments</h1>
          <button
            onClick={() => { setPage(0); fetchPayments() }}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-lg font-semibold transition"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
        )}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-rose-500">
              <p className="text-xs text-gray-500 font-semibold uppercase">Total Online</p>
              <p className="text-2xl font-bold text-rose-500">{totals?.count || 0}</p>
              <p className="text-sm text-gray-600">₹{totals?.totalAmount || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-xs text-gray-500 font-semibold uppercase">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats?.paid?.count || 0}</p>
              <p className="text-sm text-gray-600">₹{stats?.paid?.amount || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <p className="text-xs text-gray-500 font-semibold uppercase">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats?.pending?.count || 0}</p>
              <p className="text-sm text-gray-600">₹{stats?.pending?.amount || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <p className="text-xs text-gray-500 font-semibold uppercase">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats?.failed?.count || 0}</p>
              <p className="text-sm text-gray-600">₹{stats?.failed?.amount || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-pink-500">
              <p className="text-xs text-gray-500 font-semibold uppercase">Refunded</p>
              <p className="text-2xl font-bold text-pink-600">{stats?.refunded?.count || 0}</p>
              <p className="text-sm text-gray-600">₹{stats?.refunded?.amount || 0}</p>
            </div>
          </div>
        )}

        <div className="mb-4 flex gap-2 flex-wrap">
          {['', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0) }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === s
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s ? PAYMENT_STATUS_LABELS[s] : 'All'}
            </button>
          ))}
        </div>

        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin border-4 border-rose-200 border-t-rose-500 rounded-full h-12 w-12 mb-4"></div>
            <p className="text-gray-600">Loading payments...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded text-center">
            <p className="text-yellow-800 font-semibold">No online payments found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Order</th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Method</th>
                    <th className="px-4 py-3 text-left font-semibold">Payment Status</th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Order Status</th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-rose-500">{order.orderNumber || order.orderId}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="font-medium text-gray-700">{order.shippingAddress?.fullName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.shippingAddress?.phoneNumber || ''}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">₹{order.totalAmount || 0}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs font-medium text-gray-600">
                          {order.paymentMethod || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColor(order.paymentStatus)}`}>
                          {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-gray-600">{order.orderStatus}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-sm font-medium rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-sm font-medium rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentList
