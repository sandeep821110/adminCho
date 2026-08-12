import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { debugInfo, debugSuccess, debugError, debugAPI, debugAPIResponse } from '../../utils/debug'

const Coupon = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    expiresAt: '',
    isActive: true,
  })
  const { token, isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (!isAdmin()) navigate('/') }, [])

  const fetchCoupons = async () => {
    try {
      setLoading(true); setError(''); setSuccess('')
      const res = await axios.get('/api/coupons', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = Array.isArray(res.data) ? res.data : res.data?.data || []
      setCoupons(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch coupons')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.code?.trim() || !formData.discountValue) {
      setError('Code and discount value are required'); return
    }
    try {
      setLoading(true); setError(''); setSuccess('')
      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : 0,
        expiresAt: formData.expiresAt || null,
        isActive: formData.isActive,
      }

      await axios.post('/api/coupons', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess('Coupon created successfully!')
      setFormData({
        code: '', description: '', discountType: 'percentage', discountValue: '',
        minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '', isActive: true,
      })
      fetchCoupons()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create coupon')
    } finally { setLoading(false) }
  }

  const deleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return
    try {
      setLoading(true); setError(''); setSuccess('')
      await axios.delete(`/api/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess('Coupon deleted!')
      setCoupons(prev => prev.filter(c => c._id !== id))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete coupon')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (success) setTimeout(() => setSuccess(''), 3000) }, [success])

  const isExpired = (date) => date && new Date(date) < new Date()
  const isExhausted = (coupon) => coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit
  const statusBadge = (coupon) => {
    if (!coupon.isActive) return <span className="px-2 py-0.5 text-xs font-bold bg-gray-200 text-gray-600 rounded">Inactive</span>
    if (isExpired(coupon.expiresAt)) return <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded">Expired</span>
    if (isExhausted(coupon)) return <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-600 rounded">Exhausted</span>
    return <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-600 rounded">Active</span>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Coupon Management</h1>
          <button onClick={() => { setError(''); setSuccess(''); fetchCoupons() }}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-semibold transition">
            Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>}

        {/* Create Form */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Add New Coupon</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                <input type="text" placeholder="e.g., SAVE20"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 uppercase"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select value={formData.discountType}
                  onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                <input type="number" placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  min="0" step="0.01" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₹)</label>
                <input type="number" placeholder="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹) — for % type</label>
                <input type="number" placeholder="Unlimited"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                <input type="number" placeholder="0 = unlimited"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" placeholder="e.g., Summer Sale"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>

        {/* Table */}
        {loading && !coupons.length ? (
          <div className="text-center text-xl text-gray-600 py-12">Loading...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center text-gray-600 py-12">No coupons found</div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full text-sm md:text-base">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left font-semibold">Code</th>
                  <th className="px-3 md:px-6 py-3 text-left font-semibold">Discount</th>
                  <th className="px-3 md:px-6 py-3 text-left font-semibold hidden md:table-cell">Min Order</th>
                  <th className="px-3 md:px-6 py-3 text-left font-semibold hidden sm:table-cell">Used</th>
                  <th className="px-3 md:px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-3 md:px-6 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c._id} className="border-t hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-4 text-xs md:text-sm font-bold">{c.code}</td>
                    <td className="px-3 md:px-6 py-4 text-xs md:text-sm">
                      {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                      {c.maxDiscount && ` (max ₹${c.maxDiscount})`}
                    </td>
                    <td className="px-3 md:px-6 py-4 hidden md:table-cell text-xs md:text-sm">
                      {c.minOrderAmount ? `₹${c.minOrderAmount}` : '—'}
                    </td>
                    <td className="px-3 md:px-6 py-4 hidden sm:table-cell text-xs md:text-sm">
                      {c.usedCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}
                    </td>
                    <td className="px-3 md:px-6 py-4">{statusBadge(c)}</td>
                    <td className="px-3 md:px-6 py-4">
                      <button onClick={() => deleteCoupon(c._id)}
                        className="text-xs md:text-sm px-3 py-1 text-red-600 hover:bg-red-50 border border-red-300 rounded">
                        Delete
                      </button>
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

export default Coupon
