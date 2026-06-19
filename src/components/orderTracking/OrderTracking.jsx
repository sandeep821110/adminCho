import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const API = '/api/tracking/admin'

const STATUS_LABELS = {
  order_placed: 'Placed', order_confirmed: 'Confirmed', processing: 'Processing',
  packed: 'Packed', shipped: 'Shipped', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned',
}

const STATUS_FLOW = ['order_placed', 'order_confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered']

const VALID_TRANSITIONS = {
  order_placed: ['order_confirmed', 'cancelled'],
  order_confirmed: ['processing', 'packed', 'shipped', 'cancelled'],
  processing: ['packed', 'shipped', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  returned: [],
}

const DELIVERY_ATTEMPT_STATUS = ['successful', 'failed', 'rescheduled']

const statusBadge = (s) => {
  const map = {
    order_placed: 'bg-blue-100 text-blue-800', order_confirmed: 'bg-indigo-100 text-indigo-800',
    processing: 'bg-yellow-100 text-yellow-800', packed: 'bg-purple-100 text-purple-800',
    shipped: 'bg-orange-100 text-orange-800', out_for_delivery: 'bg-pink-100 text-pink-800',
    delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800',
    returned: 'bg-gray-100 text-gray-800',
  }
  return map[s] || 'bg-gray-100 text-gray-800'
}

const OrderTracking = () => {
  const { token, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [trackings, setTrackings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selected, setSelected] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createOrderInput, setCreateOrderInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusDescription, setStatusDescription] = useState('')
  const [statusLocation, setStatusLocation] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [attemptForm, setAttemptForm] = useState({ status: 'failed', reason: '', nextAttemptDate: '' })
  const [addingAttempt, setAddingAttempt] = useState(false)
  const [detailsForm, setDetailsForm] = useState({ carrierName: '', carrierPhone: '', estimatedDeliveryDate: '', deliveryInstructions: '' })
  const [updatingDetails, setUpdatingDetails] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (!isAdmin()) { navigate('/'); return }
    fetchTrackings()
  }, [isAdmin, navigate])

  const headers = { Authorization: `Bearer ${token}` }

  const fetchTrackings = async () => {
    try {
      setLoading(true); setError('')
      const params = statusFilter ? { status: statusFilter } : {}
      const res = await axios.get(`${API}/all`, { headers, params })
      const data = res.data?.data || []
      setTrackings(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch trackings')
      setTrackings([])
    } finally {
      setLoading(false)
    }
  }

  const createTracking = async () => {
    const input = createOrderInput.trim()
    if (!input) { setError('Order ID or Number is required'); return }
    try {
      setCreating(true); setError(''); setSuccess('')

      const isObjectId = /^[a-fA-F0-9]{24}$/.test(input)

      let orderRes
      if (isObjectId) {
        orderRes = await axios.get(`/api/admin/orders/${input}`, { headers })
      } else {
        orderRes = await axios.get(`/api/admin/orders/by-number/${encodeURIComponent(input)}`, { headers })
      }

      const order = orderRes.data?.data || orderRes.data?.order || orderRes.data

      const body = {
        orderId: order._id || order.id,
        orderNumber: order.orderNumber,
        orderData: order
      }

      await axios.post(API, body, { headers })
      setSuccess('Tracking created successfully')
      setShowCreateModal(false); setCreateOrderInput('')
      fetchTrackings()
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to create tracking')
    } finally {
      setCreating(false)
    }
  }

  const updateStatus = async () => {
    if (!newStatus || !selected) return
    try {
      setUpdatingStatus(true); setError('')
      const body = { status: newStatus }
      if (statusDescription.trim()) body.description = statusDescription.trim()
      if (statusLocation.trim()) body.location = statusLocation.trim()
      const res = await axios.put(`${API}/${selected.trackingNumber}/status`, body, { headers })
      setSelected(res.data?.data || res.data)
      setNewStatus(''); setStatusDescription(''); setStatusLocation('')
      fetchTrackings()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const addDeliveryAttempt = async () => {
    if (!selected) return
    try {
      setAddingAttempt(true); setError('')
      const body = { status: attemptForm.status }
      if (attemptForm.reason) body.reason = attemptForm.reason
      if (attemptForm.nextAttemptDate) body.nextAttemptDate = attemptForm.nextAttemptDate
      const res = await axios.put(`${API}/${selected.trackingNumber}/attempt`, body, { headers })
      setSelected(res.data?.data || res.data)
      setAttemptForm({ status: 'failed', reason: '', nextAttemptDate: '' })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add delivery attempt')
    } finally {
      setAddingAttempt(false)
    }
  }

  const updateDetails = async () => {
    if (!selected) return
    try {
      setUpdatingDetails(true); setError('')
      const body = {}
      if (detailsForm.carrierName || detailsForm.carrierPhone) {
        body.carrier = {}
        if (detailsForm.carrierName) body.carrier.name = detailsForm.carrierName
        if (detailsForm.carrierPhone) body.carrier.contactNumber = detailsForm.carrierPhone
      }
      if (detailsForm.estimatedDeliveryDate) body.estimatedDeliveryDate = detailsForm.estimatedDeliveryDate
      if (detailsForm.deliveryInstructions) body.deliveryInstructions = detailsForm.deliveryInstructions
      const res = await axios.put(`${API}/${selected.trackingNumber}/details`, body, { headers })
      setSelected(res.data?.data || res.data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update details')
    } finally {
      setUpdatingDetails(false)
    }
  }

  const deleteTracking = async (trackingNumber) => {
    if (!window.confirm('Delete this tracking record?')) return
    try {
      setLoading(true); setError(''); setSuccess('')
      await axios.delete(`${API}/${trackingNumber}`, { headers })
      setSuccess('Tracking deleted')
      setSelected(null)
      fetchTrackings()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  const openDetails = (t) => {
    setSelected(t)
    setNewStatus('')
    const s = t.orderSnapshots?.[0]
    setDetailsForm({
      carrierName: t.carrier?.name || '',
      carrierPhone: t.carrier?.contactNumber || '',
      estimatedDeliveryDate: t.estimatedDeliveryDate ? t.estimatedDeliveryDate.slice(0, 10) : '',
      deliveryInstructions: t.deliveryInstructions || '',
    })
  }

  const nextAllowedStatuses = (current) => VALID_TRANSITIONS[current] || []

  const countByStatus = (status) => trackings.filter(t => t.status === status).length

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Order Tracking</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">+ Create Tracking</button>
            <button onClick={fetchTrackings} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition">{loading ? 'Loading...' : 'Refresh'}</button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>}

        {/* Stats */}
        {trackings.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-6">
            {STATUS_FLOW.concat(['cancelled', 'returned']).map(s => (
              <div key={s} className={`${statusBadge(s)} rounded-lg p-2 text-center`}>
                <p className="text-lg font-bold">{countByStatus(s)}</p>
                <p className="text-xs truncate">{STATUS_LABELS[s]}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="mb-4 flex gap-2 items-center">
          <label className="text-sm font-semibold text-gray-700">Filter by status:</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setTimeout(fetchTrackings, 0) }} className="px-3 py-1 border border-gray-300 rounded text-sm">
            <option value="">All</option>
            {STATUS_FLOW.concat(['cancelled', 'returned']).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading && trackings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin border-4 border-blue-200 border-t-blue-600 rounded-full h-12 w-12 mb-4"></div>
            <p className="text-gray-600">Loading tracking data...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && trackings.length === 0 && !error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded text-center">
            <p className="text-yellow-800 font-semibold">No tracking records found</p>
          </div>
        )}

        {/* Table */}
        {!loading && trackings.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Tracking #</th>
                  <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Order #</th>
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Created</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trackings.map(t => {
                  const snap = t.orderSnapshots?.[0]
                  return (
                    <tr key={t._id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3"><span className="font-mono font-semibold text-blue-600">{t.trackingNumber}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="font-semibold">{snap?.orderNumber || 'N/A'}</span></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><span>{snap?.user?.name || t.user?.name || 'N/A'}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded ${statusBadge(t.status)}`}>{STATUS_LABELS[t.status] || t.status}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-500">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openDetails(t)} className="px-3 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition mr-1">View</button>
                        <button onClick={() => deleteTracking(t.trackingNumber)} className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition">Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Create Tracking</h2>
              <p className="text-sm text-gray-600 mb-4">Enter Order ID (24 hex chars) or Order Number (e.g. ORD...).</p>
              <input type="text" value={createOrderInput} onChange={e => setCreateOrderInput(e.target.value)} placeholder="Order ID or Order Number" className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-semibold">Cancel</button>
                <button onClick={createTracking} disabled={creating} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded font-semibold">{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full my-8">
              <div className="bg-blue-600 text-white p-6 rounded-t-lg flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Tracking Details</h2>
                  <p className="text-blue-100 text-sm mt-1 font-mono">{selected.trackingNumber}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-2xl hover:text-gray-200 transition">&times;</button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                {/* Current Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-700">Current Status</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded ${statusBadge(selected.status)}`}>{STATUS_LABELS[selected.status] || selected.status}</span>
                  </div>
                  {selected.currentLocation && <p className="text-sm text-gray-600">Location: {selected.currentLocation}</p>}
                  {selected.isActive === false && <p className="text-sm text-red-600 font-semibold mt-1">Inactive</p>}
                </div>

                {/* Update Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Update Status</h3>
                  <div className="flex gap-2 mb-2">
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={updatingStatus}>
                      <option value="">Select next status</option>
                      {nextAllowedStatuses(selected.status).map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    <button onClick={updateStatus} disabled={!newStatus || updatingStatus} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-sm font-semibold">{updatingStatus ? '...' : 'Update'}</button>
                  </div>
                  <input type="text" value={statusLocation} onChange={e => setStatusLocation(e.target.value)} placeholder="Location (optional)" className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <textarea value={statusDescription} onChange={e => setStatusDescription(e.target.value)} placeholder="Description (optional)" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
                </div>

                {/* Status Timeline */}
                {selected.trackingHistory?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Timeline</h3>
                    <div className="space-y-0">
                      {[...selected.trackingHistory].reverse().map((h, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-gray-300'} ring-2 ring-white`}></div>
                            {i < selected.trackingHistory.length - 1 && <div className="w-0.5 h-full min-h-[2rem] bg-gray-200"></div>}
                          </div>
                          <div className={`pb-4 ${i === 0 ? '' : 'pt-1'}`}>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${statusBadge(h.status)}`}>{STATUS_LABELS[h.status] || h.status}</span>
                              <span className="text-xs text-gray-500">{h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}</span>
                            </div>
                            {h.location && <p className="text-xs text-gray-600 mt-0.5">{h.location}</p>}
                            {h.description && <p className="text-xs text-gray-500 mt-0.5">{h.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Info */}
                {selected.orderSnapshots?.[0] && (
                  <>
                    <div className="border-t" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Order Info</h3>
                      <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-gray-500">Order:</span> <span className="font-semibold">{selected.orderSnapshots[0].orderNumber}</span></div>
                        <div><span className="text-gray-500">Total:</span> <span className="font-semibold text-green-600">₹{selected.orderSnapshots[0].orderProducts?.totals?.grandTotal || 0}</span></div>
                        <div><span className="text-gray-500">Items:</span> <span className="font-semibold">{selected.orderSnapshots[0].orderProducts?.products?.length || 0}</span></div>
                        <div><span className="text-gray-500">Created:</span> <span className="font-semibold">{selected.orderSnapshots[0].createdAt ? new Date(selected.orderSnapshots[0].createdAt).toLocaleDateString() : 'N/A'}</span></div>
                      </div>
                    </div>
                  </>
                )}

                {/* Customer Info */}
                {selected.shippingAddressSnapshot && (
                  <>
                    <div className="border-t" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Shipping Address</h3>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                        <p className="font-semibold">{selected.shippingAddressSnapshot.fullName}</p>
                        <p>{selected.shippingAddressSnapshot.addressLine1}{selected.shippingAddressSnapshot.addressLine2 ? `, ${selected.shippingAddressSnapshot.addressLine2}` : ''}</p>
                        <p>{[selected.shippingAddressSnapshot.city, selected.shippingAddressSnapshot.state, selected.shippingAddressSnapshot.postalCode].filter(Boolean).join(', ')}</p>
                        <p className="text-blue-600 font-semibold">Phone: {selected.shippingAddressSnapshot.phoneNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Delivery Attempts */}
                {selected.deliveryAttempts?.length > 0 && (
                  <>
                    <div className="border-t" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Delivery Attempts</h3>
                      <div className="space-y-2">
                        {selected.deliveryAttempts.map((a, i) => (
                          <div key={i} className="bg-gray-50 p-3 rounded-lg border text-sm flex justify-between items-center">
                            <div>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${a.status === 'successful' ? 'bg-green-100 text-green-800' : a.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{a.status}</span>
                              {a.reason && <span className="ml-2 text-gray-600">{a.reason}</span>}
                              {a.nextAttemptDate && <span className="ml-2 text-xs text-gray-500">Next: {new Date(a.nextAttemptDate).toLocaleDateString()}</span>}
                            </div>
                            <span className="text-xs text-gray-500">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Add Delivery Attempt */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Add Delivery Attempt</h3>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <select value={attemptForm.status} onChange={e => setAttemptForm(p => ({ ...p, status: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded text-sm">
                      {DELIVERY_ATTEMPT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="date" value={attemptForm.nextAttemptDate} onChange={e => setAttemptForm(p => ({ ...p, nextAttemptDate: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded text-sm" />
                  </div>
                  <input type="text" value={attemptForm.reason} onChange={e => setAttemptForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason (optional)" className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2" />
                  <button onClick={addDeliveryAttempt} disabled={addingAttempt} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded text-sm font-semibold">{addingAttempt ? 'Adding...' : 'Add Attempt'}</button>
                </div>

                {/* Carrier Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Carrier Details</h3>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input type="text" value={detailsForm.carrierName} onChange={e => setDetailsForm(p => ({ ...p, carrierName: e.target.value }))} placeholder="Carrier name" className="px-3 py-2 border border-gray-300 rounded text-sm" />
                    <input type="text" value={detailsForm.carrierPhone} onChange={e => setDetailsForm(p => ({ ...p, carrierPhone: e.target.value }))} placeholder="Carrier phone" className="px-3 py-2 border border-gray-300 rounded text-sm" />
                  </div>
                  <input type="date" value={detailsForm.estimatedDeliveryDate} onChange={e => setDetailsForm(p => ({ ...p, estimatedDeliveryDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2" />
                  <textarea value={detailsForm.deliveryInstructions} onChange={e => setDetailsForm(p => ({ ...p, deliveryInstructions: e.target.value }))} placeholder="Delivery instructions" className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2" rows={2} />
                  <button onClick={updateDetails} disabled={updatingDetails} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded text-sm font-semibold">{updatingDetails ? 'Saving...' : 'Save Details'}</button>
                </div>

                {/* Items */}
                {selected.orderSnapshots?.[0]?.orderProducts?.products?.length > 0 && (
                  <>
                    <div className="border-t" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Items</h3>
                      <div className="space-y-2">
                        {selected.orderSnapshots[0].orderProducts.products.map((p, i) => (
                          <div key={i} className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center text-sm">
                            <div><p className="font-semibold">{p.name || 'Product'}</p><p className="text-gray-500">Qty: {p.qty}{p.variant ? ` | ${p.variant}` : ''}</p></div>
                            <p className="font-bold text-blue-600">₹{p.price}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Modal Footer */}
              <div className="bg-gray-100 p-6 rounded-b-lg flex flex-wrap gap-3">
                <button onClick={() => setSelected(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition">Close</button>
                <button onClick={() => { deleteTracking(selected.trackingNumber) }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderTracking
