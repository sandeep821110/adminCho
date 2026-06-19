import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useRedux'
import { 
    fetchProducts, 
    createProduct, 
    deleteProduct, 
    clearError, 
    clearSuccess 
} from '../../store/slices/productsSlice'
import { useAuth } from '../../context/AuthContext'
import { debugInfo, debugError, debugMount, debugEffect } from '../../utils/debug'

/*
 * REDUX INTEGRATED PRODUCT COMPONENT
 * This component demonstrates how to use Redux Toolkit with your application
 * 
 * Key Benefits of Redux:
 * - Centralized state management
 * - Predictable state updates with actions
 * - Easy debugging with Redux DevTools
 * - Reusable logic across components
 * - Better performance with selectors
 */

const ProductRedux = () => {
    const navigate = useNavigate()
    const { isAdmin } = useAuth()
    const { dispatch, products, isLoading, error, success } = useProducts()

    const [formData, setFormData] = useState({
        productCode: '',
        name: '',
        price: '',
        description: '',
        category: '',
        subCategory: '',
        brand: '',
        rating: 5,
        bestSeller: false,
        discount: 0,
        images: [],
        sizeQuantity: [{ size: '', quantity: '' }]
    })

    debugMount('ProductRedux')

    // Check admin access
    useEffect(() => {
        debugEffect('ProductRedux', 'Admin Access Check')
        if (!isAdmin()) {
            debugError('ProductRedux', 'Access Denied', new Error('Not Admin'))
            navigate('/')
        }
    }, [isAdmin, navigate])

    // Fetch products on mount
    useEffect(() => {
        debugEffect('ProductRedux', 'Initial Load')
        dispatch(fetchProducts())
    }, [dispatch])

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault()
        
        if (!formData.productCode?.trim()) {
            dispatch(clearError())
            dispatch(clearError()) // This is a placeholder - you'd use a setError action
            return
        }

        const formDataToSend = new FormData()
        formDataToSend.append('productCode', formData.productCode)
        formDataToSend.append('name', formData.name)
        formDataToSend.append('price', formData.price)
        formDataToSend.append('description', formData.description)
        formDataToSend.append('category', formData.category)
        formDataToSend.append('subCategory', formData.subCategory)
        formDataToSend.append('brand', formData.brand)
        formDataToSend.append('rating', formData.rating)
        formDataToSend.append('bestSeller', formData.bestSeller)
        formDataToSend.append('discount', formData.discount)
        formDataToSend.append('sizeQuantity', JSON.stringify(formData.sizeQuantity.filter(sq => sq.size && sq.quantity)))

        formData.images.forEach((image) => {
            formDataToSend.append('images', image)
        })

        debugInfo('ProductRedux', 'Creating Product', formData)
        dispatch(createProduct(formDataToSend))

        setFormData({
            productCode: '',
            name: '',
            price: '',
            description: '',
            category: '',
            subCategory: '',
            brand: '',
            rating: 5,
            bestSeller: false,
            discount: 0,
            images: [],
            sizeQuantity: [{ size: '', quantity: '' }]
        })
    }

    // Handle delete
    const handleDelete = (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return
        }
        dispatch(deleteProduct(productId))
    }

    // Clear messages after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => dispatch(clearSuccess()), 3000)
            return () => clearTimeout(timer)
        }
    }, [success, dispatch])

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => dispatch(clearError()), 3000)
            return () => clearTimeout(timer)
        }
    }, [error, dispatch])

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Product Management (Redux)</h1>
                    <button
                        onClick={() => dispatch(fetchProducts())}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                    >
                        Refresh
                    </button>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                        {success}
                    </div>
                )}

                {/* Form */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-6">Add New Product</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Code *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., PROD001"
                                    value={formData.productCode}
                                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                                <input
                                    type="text"
                                    placeholder="Product name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isLoading}
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Electronics"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
                                <select
                                    value={formData.rating}
                                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isLoading}
                                >
                                    <option value={1}>1 Star</option>
                                    <option value={2}>2 Stars</option>
                                    <option value={3}>3 Stars</option>
                                    <option value={4}>4 Stars</option>
                                    <option value={5}>5 Stars</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : 'Create Product'}
                        </button>
                    </form>
                </div>

                {/* Products List */}
                <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold">Name</th>
                                <th className="px-6 py-3 text-left font-semibold hidden md:table-cell">Code</th>
                                <th className="px-6 py-3 text-left font-semibold">Price</th>
                                <th className="px-6 py-3 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="4" className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-4 text-center">No products found</td></tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product._id} className="border-t hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{product.name}</td>
                                        <td className="px-6 py-4 hidden md:table-cell">{product.productCode}</td>
                                        <td className="px-6 py-4 text-green-600 font-semibold">₹{product.price}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDelete(product._id)}
                                                className="px-3 py-1 text-red-600 hover:bg-red-50 border border-red-300 rounded transition"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default ProductRedux
