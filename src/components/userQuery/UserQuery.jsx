import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { debugInfo, debugSuccess, debugWarn, debugError, debugAPI, debugAPIResponse, debugMount, debugEffect } from '../../utils/debug'

const UserQuery = () => {
    const [queries, setQueries] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedQuery, setSelectedQuery] = useState(null)
    const [editingQuery, setEditingQuery] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [filterStatus, setFilterStatus] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [stats, setStats] = useState(null)
    const { token, isAdmin } = useAuth()
    const navigate = useNavigate()

    debugMount('UserQuery')

    useEffect(() => {
        debugEffect('UserQuery', 'Admin Access Check')
        if (!isAdmin()) {
            debugError('UserQuery', 'Access Denied', new Error('Not Admin'))
            navigate('/')
        }
    }, [isAdmin, navigate])

    const fetchUserAllQueries = async () => {
        try {
            debugInfo('UserQuery', 'Fetching All Queries')
            setLoading(true)
            setError('')
            
            const endpoint = '/api/queries/admin/all'
            debugAPI('GET', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            })

            debugAPIResponse('GET', endpoint, response.status, { count: response.data?.length || 0 })

            let queriesData = []
            
            if (Array.isArray(response.data)) {
                debugSuccess('UserQuery', 'Direct array format', { count: response.data.length })
                queriesData = response.data
            } else if (response.data?.queries && Array.isArray(response.data.queries)) {
                debugSuccess('UserQuery', 'Using response.queries format', { count: response.data.queries.length })
                queriesData = response.data.queries
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                debugSuccess('UserQuery', 'Using response.data format', { count: response.data.data.length })
                queriesData = response.data.data
            } else {
                debugWarn('UserQuery', 'Unexpected data format', response.data)
                setError('Unexpected data format from server')
                return
            }

            debugSuccess('UserQuery', `Loaded ${queriesData.length} Queries`)
            setQueries(queriesData)

        } catch (err) {
            debugError('UserQuery', 'Fetch Failed', err, { endpoint: '/api/queries/admin/all' })
            
            const errorMsg = err?.response?.data?.message || 
                           err?.message || 
                           'Failed to fetch queries'
            
            setError(errorMsg)
            setQueries([])
        } finally {
            setLoading(false)
        }
    }

    const updateQueryStatus = async (queryId, status) => {
        try {
            debugInfo('UserQuery', 'Updating Query Status', { queryId, status })
            setLoading(true)
            
            const endpoint = `/api/queries/admin/status/${queryId}`
            debugAPI('PUT', endpoint, { status, headers: { Authorization: 'Bearer [token]' } })
            
            const response = await axios.put(endpoint, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            debugAPIResponse('PUT', endpoint, response.status, response.data)
            debugSuccess('UserQuery', 'Query Status Updated Successfully', { queryId, status })
            
            alert('Query status updated successfully!')
            fetchUserAllQueries()
        } catch (err) {
            debugError('UserQuery', 'Status Update Failed', err, { queryId, status })
            const errorMsg = err?.response?.data?.message || 'Failed to update query status'
            setError(errorMsg)
            alert('Error: ' + errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const deleteQuery = async (queryId) => {
        if (!window.confirm('Are you sure you want to delete this query? This action cannot be undone.')) {
            debugInfo('UserQuery', 'Delete Cancelled', { queryId })
            return
        }

        try {
            debugInfo('UserQuery', 'Deleting Query', { queryId })
            setLoading(true)
            
            const endpoint = `/api/queries/admin/delete/${queryId}`
            debugAPI('DELETE', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            const response = await axios.delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            debugAPIResponse('DELETE', endpoint, response.status, response.data)
            debugSuccess('UserQuery', 'Query Deleted Successfully', { queryId })
            
            alert('Query deleted successfully!')
            fetchUserAllQueries()
        } catch (err) {
            debugError('UserQuery', 'Delete Failed', err, { queryId })
            const errorMsg = err?.response?.data?.message || 'Failed to delete query'
            setError(errorMsg)
            alert('Error: ' + errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const fetchQueryStatistics = async () => {
        try {
            debugInfo('UserQuery', 'Fetching Statistics')
            const endpoint = '/api/queries/admin/statistics'
            debugAPI('GET', endpoint, { headers: { Authorization: 'Bearer [token]' } })

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            })

            debugAPIResponse('GET', endpoint, response.status, response.data)
            setStats(response.data?.data || response.data)
        } catch (err) {
            debugError('UserQuery', 'Statistics Fetch Failed', err)
        }
    }

    const updateQuery = async (queryId, updateData) => {
        try {
            debugInfo('UserQuery', 'Updating Query', { queryId, updateData })
            setLoading(true)
            setError('')

            const endpoint = `/api/queries/admin/update/${queryId}`
            debugAPI('PUT', endpoint, { updateData, headers: { Authorization: 'Bearer [token]' } })

            const response = await axios.put(endpoint, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            debugAPIResponse('PUT', endpoint, response.status, response.data)
            debugSuccess('UserQuery', 'Query Updated Successfully', { queryId })

            alert('Query updated successfully!')
            setEditingQuery(null)
            setEditForm({})
            fetchUserAllQueries()
        } catch (err) {
            debugError('UserQuery', 'Update Failed', err, { queryId, updateData })
            const errorMsg = err?.response?.data?.message || 'Failed to update query'
            setError(errorMsg)
            alert('Error: ' + errorMsg)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        debugEffect('UserQuery', 'Initial Load')
        fetchUserAllQueries()
        fetchQueryStatistics()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Filter queries based on search and status
    const filteredQueries = queries.filter(query => {
        const matchesSearch = query.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            query.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            query.message?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'all' || query.status === filterStatus
        return matchesSearch && matchesStatus
    })

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700',
        resolved: 'bg-green-100 text-green-700',
        in_progress: 'bg-blue-100 text-blue-700',
        closed: 'bg-gray-100 text-gray-700'
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold">❓ User Queries Management</h1>
                    <button
                        onClick={fetchUserAllQueries}
                        disabled={loading}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
                    >
                        {loading ? 'Loading...' : '🔄 Refresh Queries'}
                    </button>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                            <p className="text-xs text-gray-600 font-semibold">Total</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.totalQueries || stats.total || queries.length}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                            <p className="text-xs text-gray-600 font-semibold">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                            <p className="text-xs text-gray-600 font-semibold">In Progress</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.in_progress || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                            <p className="text-xs text-gray-600 font-semibold">Resolved</p>
                            <p className="text-2xl font-bold text-green-600">{stats.resolved || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
                            <p className="text-xs text-gray-600 font-semibold">Closed</p>
                            <p className="text-2xl font-bold text-gray-600">{stats.closed || 0}</p>
                        </div>
                    </div>
                )}

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search Queries</label>
                        <input
                            type="text"
                            placeholder="Search by name, email, or message..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter Status */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">📊 Filter by Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Queries</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    {/* Results Count */}
                    <div className="md:col-span-2 text-sm text-gray-600 font-semibold">
                        📈 Showing {filteredQueries.length} of {queries.length} queries
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded mb-6">
                        <p className="font-semibold">❌ Error Loading Queries</p>
                        <p className="text-sm mt-1">{error}</p>
                        <div className="mt-3 space-y-1 text-xs text-red-700">
                            <p>💡 <strong>Troubleshooting:</strong></p>
                            <ul className="list-disc list-inside ml-2">
                                <li>Check backend is running on http://localhost:9010</li>
                                <li>Verify endpoint: /api/queries/admin/all</li>
                                <li>Check authentication token is valid</li>
                                <li>Open browser console (F12) for detailed logs</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin border-4 border-blue-200 border-t-blue-600 rounded-full h-12 w-12 mb-4"></div>
                        <p className="text-gray-600 text-center">Loading queries...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredQueries.length === 0 && !error && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded text-center">
                        <p className="text-yellow-800 font-semibold">📭 No queries found</p>
                        <p className="text-yellow-700 text-sm mt-2">
                            {queries.length === 0 
                                ? 'Queries will appear here once users submit them'
                                : 'No queries match your search or filter criteria'}
                        </p>
                    </div>
                )}

                {/* Queries Grid */}
                {!loading && filteredQueries.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

                        {filteredQueries.map((query) => (
                            <div key={query._id} className="bg-white p-4 md:p-5 rounded-2xl shadow hover:shadow-lg transition">

                                {/* Query Header */}
                                <div className="flex justify-between items-start gap-2 mb-3">
                                    <div className="flex-1">
                                        <h2 className="font-bold text-sm md:text-lg truncate">
                                            {query.name || 'Anonymous User'}
                                        </h2>
                                        <p className="text-xs text-gray-500 truncate">
                                            {query.email || 'No email'}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {new Date(query.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Status Badge */}
                                <div className="mb-3">
                                    <span className={`px-3 py-1 text-xs rounded-full font-semibold ${statusColors[query.status] || 'bg-gray-100 text-gray-700'}`}>
                                        {query.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                                    </span>
                                </div>

                                {/* Message Preview */}
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs md:text-sm text-gray-700 line-clamp-3">
                                        {query.message || 'No message provided'}
                                    </p>
                                </div>

                                {/* Subject */}
                                {query.subject && (
                                    <div className="mb-3 pb-3 border-b border-gray-200">
                                        <p className="text-xs text-gray-600">
                                            <strong>Subject:</strong> {query.subject}
                                        </p>
                                    </div>
                                )}

                                {/* Query Metadata */}
                                <div className="text-xs text-gray-600 mb-4 space-y-1">
                                    {query.phone && <p><strong>📞 Phone:</strong> {query.phone}</p>}
                                    {query.category && <p><strong>📁 Category:</strong> {query.category}</p>}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <button
                                        className="flex-1 text-xs md:text-sm px-3 py-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded transition border border-blue-600"
                                        onClick={() => {
                                            debugInfo('UserQuery', 'Opening Query Details', { queryId: query._id })
                                            setSelectedQuery(query)
                                        }}
                                    >
                                        👁️ View
                                    </button>

                                    <button
                                        className="flex-1 text-xs md:text-sm px-3 py-2 text-amber-600 hover:text-white hover:bg-amber-600 rounded transition border border-amber-600"
                                        onClick={() => {
                                            debugInfo('UserQuery', 'Opening Edit Form', { queryId: query._id })
                                            setEditingQuery(query)
                                            setEditForm({
                                                name: query.name || '',
                                                email: query.email || '',
                                                phone: query.phone || '',
                                                subject: query.subject || '',
                                                message: query.message || '',
                                                category: query.category || '',
                                                priority: query.priority || '',
                                                assignedTo: query.assignedTo || ''
                                            })
                                        }}
                                    >
                                        ✏️ Edit
                                    </button>

                                    <button
                                        className="flex-1 text-xs md:text-sm px-3 py-2 text-green-600 hover:text-white hover:bg-green-600 rounded transition border border-green-600"
                                        onClick={() => updateQueryStatus(query._id, 'resolved')}
                                    >
                                        ✓ Resolve
                                    </button>

                                    <button
                                        className="flex-1 text-xs md:text-sm px-3 py-2 text-red-600 hover:text-white hover:bg-red-600 rounded transition border border-red-600"
                                        onClick={() => deleteQuery(query._id)}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>

                            </div>
                        ))}

                    </div>
                )}

                {/* Query Details Modal */}
                {selectedQuery && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8">
                            
                            {/* Modal Header */}
                            <div className="bg-blue-600 text-white p-6 rounded-t-lg flex justify-between items-center">
                                <h2 className="text-xl md:text-2xl font-bold">Query Details</h2>
                                <button
                                    onClick={() => setSelectedQuery(null)}
                                    className="text-2xl hover:text-gray-200 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">

                                {/* Header Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-600 text-sm">Name</p>
                                        <p className="text-lg font-bold text-blue-600">{selectedQuery.name || 'Anonymous'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm">Date</p>
                                        <p className="text-lg font-bold">{new Date(selectedQuery.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm">Status</p>
                                        <p className={`text-lg font-bold ${statusColors[selectedQuery.status]?.split(' ')[0]}`}>
                                            {selectedQuery.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm">Priority</p>
                                        <p className="text-lg font-bold text-orange-600">{selectedQuery.priority || 'Normal'}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4"></div>

                                {/* Contact Information */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">📧 Contact Information</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Email:</span>
                                            <span className="font-semibold break-all">{selectedQuery.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phone:</span>
                                            <span className="font-semibold">{selectedQuery.phone || 'N/A'}</span>
                                        </div>
                                        {selectedQuery.category && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Category:</span>
                                                <span className="font-semibold">{selectedQuery.category}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t pt-4"></div>

                                {/* Subject */}
                                {selectedQuery.subject && (
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-3">📝 Subject</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="font-semibold text-gray-700">{selectedQuery.subject}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Full Message */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">💬 Message</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-700 whitespace-pre-wrap">{selectedQuery.message || 'No message provided'}</p>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                {selectedQuery.assignedTo && (
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-3">👤 Assigned To</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="font-semibold text-gray-700">{selectedQuery.assignedTo}</p>
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Modal Footer with Actions */}
                            <div className="bg-gray-100 p-6 rounded-b-lg flex flex-col sm:flex-row gap-3 justify-end">
                                <button
                                    onClick={() => setSelectedQuery(null)}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        updateQueryStatus(selectedQuery._id, 'resolved')
                                        setSelectedQuery(null)
                                    }}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                                >
                                    ✓ Mark as Resolved
                                </button>
                                <button
                                    onClick={() => {
                                        deleteQuery(selectedQuery._id)
                                        setSelectedQuery(null)
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                                >
                                    🗑️ Delete Query
                                </button>
                            </div>

                        </div>
                    </div>
                )}

                {/* Edit Query Modal */}
                {editingQuery && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8">
                            <div className="bg-amber-600 text-white p-6 rounded-t-lg flex justify-between items-center">
                                <h2 className="text-xl md:text-2xl font-bold">✏️ Edit Query</h2>
                                <button
                                    onClick={() => { setEditingQuery(null); setEditForm({}) }}
                                    className="text-2xl hover:text-gray-200 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text" value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email" value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="text" value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <input
                                            type="text" value={editForm.category}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                        <select
                                            value={editForm.priority}
                                            onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="">None</option>
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                                        <input
                                            type="text" value={editForm.assignedTo}
                                            onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <input
                                        type="text" value={editForm.subject}
                                        onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea
                                        rows="4" value={editForm.message}
                                        onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-100 p-6 rounded-b-lg flex flex-col sm:flex-row gap-3 justify-end">
                                <button
                                    onClick={() => { setEditingQuery(null); setEditForm({}) }}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => updateQuery(editingQuery._id, editForm)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
                                >
                                    {loading ? 'Saving...' : '💾 Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default UserQuery
