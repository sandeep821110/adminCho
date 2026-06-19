import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ADMIN_URL = '/api/admin/orders'

const STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  PROCESSED: 'Processed',
  REJECTED: 'Rejected',
}

const REASON_LABELS = {
  DAMAGED_PRODUCT: 'Damaged Product',
  DEFECTIVE_PRODUCT: 'Defective Product',
  WRONG_ITEM: 'Wrong Item Delivered',
  WRONG_SIZE: 'Wrong Size Delivered',
  ITEM_NOT_AS_DESCRIBED: 'Item Not as Described',
  DUPLICATE_ORDER: 'Duplicate Order',
  CUSTOMER_REQUEST: 'Customer Request',
  OUT_OF_STOCK: 'Out of Stock',
  OTHER: 'Other',
}

const RefundList = () => {
  const [refunds, setRefunds] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { token, isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdmin()) { navigate('/'); return }
    fetchRefunds()
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, navigate])

  const headers = { Authorization: `Bearer ${token}` }

  const fetchRefunds = async () => {
    try {
      setLoading(true)
      setError('')
      const url = statusFilter
        ? `${ADMIN_URL}/refunds/list?status=${statusFilter}`
        : `${ADMIN_URL}/refunds/list`
      const res = await axios.get(url, { headers })
      setRefunds(res.data?.data || [])
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to fetch refunds'
      setError(msg)
      setRefunds([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${ADMIN_URL}/refunds/stats`, { headers })
      setStats(res.data?.data)
    } catch {
      // optional
    }
  }

  const processRefund = async (refundId, action) => {
    try {
      setLoading(true)
      setError('')
      await axios.patch(`${ADMIN_URL}/refunds/${refundId}/process`, { action }, { headers })
      fetchRefunds()
      fetchStats()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to process refund'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status) => {
    const map = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PROCESSED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Refunds Management</h1>
          <button
            onClick={() => { fetchRefunds(); fetchStats() }}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <p className="text-xs text-gray-500 font-semibold uppercase">Total Refunds</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <p className="text-xs text-gray-500 font-semibold uppercase">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-xs text-gray-500 font-semibold uppercase">Processed</p>
              <p className="text-2xl font-bold text-green-600">
                {(stats.byStatus || []).find((s) => s._id === 'PROCESSED')?.count || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <p className="text-xs text-gray-500 font-semibold uppercase">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {(stats.byStatus || []).find((s) => s._id === 'REJECTED')?.count || 0}
              </p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-4 flex gap-2">
          {['', 'PENDING', 'APPROVED', 'PROCESSED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s ? STATUS_LABELS[s] : 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading && refunds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin border-4 border-blue-200 border-t-blue-600 rounded-full h-12 w-12 mb-4"></div>
            <p className="text-gray-600">Loading refunds...</p>
          </div>
        ) : refunds.length === 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded text-center">
            <p className="text-yellow-800 font-semibold">No refunds found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Order</th>
                  <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Reason</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-blue-600">{refund.orderNumber || '#' + refund.orderId?._id?.slice(-6)}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-semibold text-green-600">₹{refund.amount || 0}</td>
                    <td className="px-4 py-3 hidden sm:table-cell max-w-[200px]">
                      <p className="font-medium">{REASON_LABELS[refund.reason] || refund.reason}</p>
                      {refund.reasonText && (
                        <p className="text-xs text-gray-500 truncate">{refund.reasonText}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColor(refund.status)}`}>
                        {STATUS_LABELS[refund.status] || refund.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                      {new Date(refund.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {refund.status === 'PENDING' && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => processRefund(refund._id, 'APPROVED')}
                            className="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => processRefund(refund._id, 'PROCESSED')}
                            className="px-2 py-1 text-xs text-green-600 border border-green-300 rounded hover:bg-green-50 transition"
                          >
                            Process
                          </button>
                          <button
                            onClick={() => processRefund(refund._id, 'REJECTED')}
                            className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {refund.status === 'APPROVED' && (
                        <button
                          onClick={() => processRefund(refund._id, 'PROCESSED')}
                          className="px-2 py-1 text-xs text-green-600 border border-green-300 rounded hover:bg-green-50 transition"
                        >
                          Process
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default RefundList
