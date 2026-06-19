import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { debugInfo, debugSuccess, debugError, debugAPI, debugAPIResponse, debugMount, debugUnmount, debugEffect } from '../../utils/debug'

const Pincode = () => {
    const [pincodes, setPincodes] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [pincode, setPincode] = useState('')
    const { token, isAdmin } = useAuth()
    const navigate = useNavigate()

    // Component Mount/Unmount
    useEffect(() => {
        debugMount('Pincode')
        return () => debugUnmount('Pincode')
    }, [])

    // Only admin can access
    useEffect(() => {
        debugEffect('Pincode', 'Admin Access Check')
        if (!isAdmin()) {
            debugError('Pincode', 'Access Denied - Not Admin', new Error('User is not admin'))
            navigate('/')
        }
    }, [isAdmin, navigate])

    const createPincode = async (e) => {
        e.preventDefault()
        
        if (!pincode.trim()) {
            setError('Pincode is required')
            return
        }

        try {
            debugInfo('Pincode', 'Creating', { pincode })
            setLoading(true)
            setError('')
            setSuccess('')
            
            const endpoint = '/api/pincodes'
            debugAPI('POST', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            const res = await axios.post(
                endpoint,
                { pincode: pincode.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            debugAPIResponse('POST', endpoint, res.status, res.data)
            debugSuccess('Pincode', 'Created Successfully', res.data)
            
            setSuccess('Pincode created successfully!')
            setPincode('')
            fetchPincodes()
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to create pincode'
            debugError('Pincode', 'Create Failed', err, { endpoint: '/api/pincodes' })
            setError(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const fetchPincodes = async () => {
        try {
            debugInfo('Pincode', 'Fetching All Pincodes')
            setLoading(true)
            setError('')
            setSuccess('')
            
            const endpoint = '/api/pincodes'
            debugAPI('GET', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            debugAPIResponse('GET', endpoint, res.status, { count: res.data.length })
            debugSuccess('Pincode', `Fetched ${res.data.length} Pincodes`, res.data)
            
            setPincodes(res.data)
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to fetch pincodes'
            debugError('Pincode', 'Fetch Failed', err, { endpoint: '/api/pincodes' })
            setError(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const deletePincode = async (pincodeValue) => {
        if (!window.confirm(`Are you sure you want to delete pincode: ${pincodeValue}?`)) {
            return
        }

        try {
            debugInfo('Pincode', 'Deleting', { pincode: pincodeValue })
            setLoading(true)
            setError('')
            setSuccess('')
            
            const endpoint = `/api/pincodes/${pincodeValue}`
            debugAPI('DELETE', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            const res = await axios.delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            debugAPIResponse('DELETE', endpoint, res.status, res.data)
            debugSuccess('Pincode', 'Deleted Successfully', { pincode: pincodeValue })
            
            setSuccess('Pincode deleted successfully!')
            fetchPincodes()
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to delete pincode'
            debugError('Pincode', 'Delete Failed', err, { pincode: pincodeValue })
            setError(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        debugEffect('Pincode', 'Initial Load')
        fetchPincodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Clear success message after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 3000)
            return () => clearTimeout(timer)
        }
    }, [success])

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Pincode Management</h1>
                    <button
                        onClick={() => {
                            setSuccess('')
                            setError('')
                            fetchPincodes()
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                    >
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm md:text-base">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded text-sm md:text-base">
                        {success}
                    </div>
                )}

                {/* Create Pincode Form */}
                <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-semibold mb-4">Add New Pincode</h2>
                    <form onSubmit={createPincode} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                            <input
                                type="text"
                                placeholder="Enter pincode"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !pincode.trim()}
                            className="w-full sm:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Adding...' : 'Add Pincode'}
                        </button>
                    </form>
                </div>

                {/* Pincodes List */}
                {loading ? (
                    <div className="text-center text-xl text-gray-600 py-12">Loading...</div>
                ) : pincodes.length === 0 ? (
                    <div className="text-center text-gray-600 py-12 text-sm md:text-base">No pincodes found</div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm md:text-base">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="px-3 md:px-6 py-3 text-left font-semibold">Pincode</th>
                                        <th className="px-3 md:px-6 py-3 text-left font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pincodes.map((item) => (
                                        <tr key={item._id} className="border-t hover:bg-gray-50">
                                            <td className="px-3 md:px-6 py-4 text-xs md:text-sm font-medium">{item.pincode}</td>
                                            <td className="px-3 md:px-6 py-4">
                                                <button
                                                    onClick={() => deletePincode(item.pincode)}
                                                    className="text-xs md:text-sm px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-300 rounded transition"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}



export default Pincode
