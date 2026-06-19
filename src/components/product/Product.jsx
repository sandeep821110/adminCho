import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2 } from 'lucide-react'
import { debugInfo, debugSuccess, debugError, debugAPI, debugAPIResponse, debugMount, debugEffect } from '../../utils/debug'

const Product = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [editingProductId, setEditingProductId] = useState(null)
    const formRef = useRef(null)
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
        sizeQuantity: [{ size: '', quantity: '' }],
        pincodes: '',
        pincodeDiscounts: {}
    })
    const [calculatedPrice, setCalculatedPrice] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState(null)
    const [searchLoading, setSearchLoading] = useState(false)
    const searchDebounce = useRef(null)
    const { token, isAdmin } = useAuth()
    const navigate = useNavigate()

    debugMount('Product')

    // Only admin can access
    useEffect(() => {
        debugEffect('Product', 'Admin Access Check')
        if (!isAdmin()) {
            debugError('Product', 'Access Denied', new Error('Not Admin'))
            navigate('/')
        }
    }, [isAdmin, navigate])

    const handleSearch = useCallback(async (q) => {
      const trimmed = q.trim()
      if (!trimmed) {
        setSearchResults(null)
        return
      }
      setSearchLoading(true)
      try {
        const { data } = await axios.get(`/api/search?q=${encodeURIComponent(trimmed)}&limit=50`)
        if (data.success) {
          setSearchResults(data.data)
        }
      } catch {
        setSearchResults(null)
      } finally {
        setSearchLoading(false)
      }
    }, [])

    const handleSearchChange = (value) => {
      setSearchQuery(value)
      if (searchDebounce.current) clearTimeout(searchDebounce.current)
      if (value.trim().length >= 2) {
        searchDebounce.current = setTimeout(() => handleSearch(value), 300)
      } else {
        setSearchResults(null)
      }
    }

    const clearSearch = () => {
      setSearchQuery('')
      setSearchResults(null)
      if (searchDebounce.current) clearTimeout(searchDebounce.current)
    }

    const createProduct = async (productData) => {
        try {
            // Validate required fields
            if (!productData.productCode?.trim()) {
                setError('Product Code is required')
                return
            }
            if (!productData.name?.trim()) {
                setError('Product Name is required')
                return
            }
            if (!productData.price || productData.price <= 0) {
                setError('Valid Price is required')
                return
            }
            if (!productData.category?.trim()) {
                setError('Category is required')
                return
            }

            debugInfo('Product', 'Creating Product', productData)
            setLoading(true)
            setError('')
            setSuccess('')
            
            const endpoint = '/api/products'
            debugAPI('POST', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            // Prepare FormData for file upload
            const formDataToSend = new FormData()
            formDataToSend.append('productCode', productData.productCode)
            formDataToSend.append('name', productData.name)
            formDataToSend.append('price', productData.price)
            formDataToSend.append('description', productData.description)
            formDataToSend.append('category', productData.category)
            formDataToSend.append('subCategory', productData.subCategory)
            formDataToSend.append('brand', productData.brand)
            formDataToSend.append('rating', productData.rating)
            formDataToSend.append('bestseller', productData.bestSeller)
            formDataToSend.append('discount', productData.discount)
            formDataToSend.append('sizeQuantity', JSON.stringify(productData.sizeQuantity.filter(sq => sq.size && sq.quantity)))
            formDataToSend.append('pincodes', JSON.stringify(productData.pincodes.split(',').map(p => p.trim()).filter(p => p)))
            
            // Add images
            productData.images.forEach((image) => {
                if (image instanceof File) {
                    formDataToSend.append('images', image)
                }
            })
            
            const res = await axios.post(
                endpoint,
                formDataToSend,
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
            )
            
            debugAPIResponse('POST', endpoint, res.status, res.data)
            debugSuccess('Product', 'Created Successfully', res.data)
            
            setSuccess('Product created successfully!')
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
                sizeQuantity: [{ size: '', quantity: '' }],
                pincodes: '',
                pincodeDiscounts: {}
            })
            setCalculatedPrice(null)
            fetchProducts()
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to create product'
            debugError('Product', 'Create Failed', err, { data: productData })
            setError(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const fetchProducts = async () => {
        try {
            debugInfo('Product', 'Fetching All Products')
            setLoading(true)
            setError('')
            setSuccess('')
            
            const endpoint = '/api/products'
            debugAPI('GET', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            let productsData = []
            if (Array.isArray(res.data)) {
                productsData = res.data
            } else if (res.data?.products && Array.isArray(res.data.products)) {
                productsData = res.data.products
            } else if (res.data?.data && Array.isArray(res.data.data)) {
                productsData = res.data.data
            }
            
            setProducts(productsData)
            debugAPIResponse('GET', endpoint, res.status, { count: productsData.length })
            debugSuccess('Product', `Fetched ${productsData.length} Products`)
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to fetch products'
            debugError('Product', 'Fetch Failed', err)
            setError(errorMsg)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const fetchProductById = async (productId) => {
        try {
            debugInfo('Product', 'Fetching Product By ID', { productId })
            setLoading(true)
            setError('')
            
            const endpoint = `/api/products/${productId}?_t=${Date.now()}`
            debugAPI('GET', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }
            })
            
            debugAPIResponse('GET', endpoint, res.status, res.data)
            debugSuccess('Product', 'Fetched Product', res.data)
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to fetch product'
            debugError('Product', 'Fetch By ID Failed', err, { productId })
            setError(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const deleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            debugInfo('Product', 'Delete Cancelled', { productId })
            return
        }
        
        try {
            debugInfo('Product', 'Deleting Product', { productId })
            setLoading(true)
            setError('')
            setSuccess('')

            const endpoint = `/api/products/${productId}`
            debugAPI('DELETE', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            const res = await axios.delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            debugAPIResponse('DELETE', endpoint, res.status, res.data)
            debugSuccess('Product', 'Deleted Successfully', { productId })
            
            setProducts(prev => prev.filter(p => p._id !== productId))
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to delete product'
            debugError('Product', 'Delete Failed', err, { productId })
            setError(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const updateProduct = async (productData) => {
        try {
            // Validate required fields
            if (!productData.name?.trim()) {
                setError('Product Name is required')
                return
            }
            if (!productData.price || productData.price <= 0) {
                setError('Valid Price is required')
                return
            }
            if (!productData.category?.trim()) {
                setError('Category is required')
                return
            }

            debugInfo('Product', 'Updating Product', { productId: editingProductId, data: productData })
            setLoading(true)
            setError('')
            setSuccess('')
            
            const endpoint = `/api/products/${editingProductId}`
            debugAPI('PUT', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            // Prepare FormData for file upload
            const formDataToSend = new FormData()
            formDataToSend.append('name', productData.name)
            formDataToSend.append('price', productData.price)
            formDataToSend.append('description', productData.description)
            formDataToSend.append('category', productData.category)
            formDataToSend.append('subCategory', productData.subCategory)
            formDataToSend.append('productCode', productData.productCode)
            formDataToSend.append('brand', productData.brand)
            formDataToSend.append('rating', productData.rating)
            formDataToSend.append('bestseller', productData.bestSeller)
            formDataToSend.append('discount', productData.discount)
            formDataToSend.append('sizeQuantity', JSON.stringify(productData.sizeQuantity.filter(sq => sq.size && sq.quantity)))
            formDataToSend.append('pincodes', JSON.stringify(productData.pincodes.split(',').map(p => p.trim()).filter(p => p)))
            
            // Preserve existing image URLs and add new files
            const existingImages = (productData.images || []).filter(img => typeof img === 'string')
            if (existingImages.length > 0) {
                formDataToSend.append('images', JSON.stringify(existingImages))
            }
            if (productData.images && productData.images.length > 0) {
                productData.images.forEach((image) => {
                    if (image instanceof File) {
                        formDataToSend.append('images', image)
                    }
                })
            }
            
            const res = await axios.put(
                endpoint,
                formDataToSend,
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
            )
            
            debugAPIResponse('PUT', endpoint, res.status, res.data)
            debugSuccess('Product', 'Updated Successfully', res.data)
            
            setSuccess('Product updated successfully!')
            clearForm()
            fetchProducts()
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to update product'
            debugError('Product', 'Update Failed', err, { data: productData })
            setError(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const loadProductForEdit = async (productId) => {
        try {
            debugInfo('Product', 'Loading Product for Edit', { productId })
            setLoading(true)
            setError('')
            setSuccess('')

            const endpoint = `/api/products/${productId}?_t=${Date.now()}`
            debugAPI('GET', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }
            })
            
            debugAPIResponse('GET', endpoint, res.status, res.data)
            debugSuccess('Product', 'Product Loaded for Edit', res.data)
            
            const product = res.data?.data || res.data
            const sizes = product.size || product.sizeQuantity || []
            const pincodesArr = product.pincodes || []
            if (product.price && product.discount) {
                const p = parseFloat(product.price) || 0;
                const d = parseFloat(product.discount) || 0;
                setCalculatedPrice(Math.round(p - (p * d) / 100));
            }
            setFormData({
                productCode: product.productCode || '',
                name: product.name || '',
                price: product.price ?? '',
                description: product.description || '',
                category: product.category || '',
                subCategory: product.subCategory || '',
                brand: product.brand || '',
                rating: product.rating ?? 5,
                bestSeller: product.bestSeller ?? product.bestseller ?? false,
                discount: product.discount ?? 0,
                images: product.images || [],
                sizeQuantity: sizes.length > 0 ? sizes : [{ size: '', quantity: '' }],
                pincodes: pincodesArr.join(', '),
                pincodeDiscounts: {}
            })
            setEditingProductId(productId)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            const errorMsg = err?.response?.data?.message || 'Failed to load product'
            debugError('Product', 'Load for Edit Failed', err, { productId })
            setError(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const clearForm = () => {
        debugInfo('Product', 'Clearing Form')
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
            sizeQuantity: [{ size: '', quantity: '' }],
            pincodes: '',
            pincodeDiscounts: {}
        })
        setEditingProductId(null)
        setCalculatedPrice(null)
    }

    useEffect(() => {
        debugEffect('Product', 'Initial Load')
        // Only fetch on mount, token/isAdmin are handled separately
        if (token) {
            fetchProducts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Clear success message after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 3000)
            return () => clearTimeout(timer)
        }
    }, [success])

    const openCreateForm = () => {
        debugInfo('Product', 'Opening Create Product Form')
        clearForm()
        setError('')
        setSuccess('')
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Product Management</h1>
                    <button
                        onClick={() => {
                            setSuccess('')
                            setError('')
                            fetchProducts()
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

                {/* Create/Update Product Form */}
                <div ref={formRef} className="bg-white rounded-lg shadow p-4 md:p-6 mb-6 md:mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-xl md:text-2xl font-semibold">
                            {editingProductId ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        {editingProductId && (
                            <button
                                type="button"
                                onClick={clearForm}
                                className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        if (editingProductId) {
                            updateProduct(formData)
                        } else {
                            createProduct(formData)
                        }
                    }} className="space-y-6">
                        
                        {/* Row 1: Product Code & Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Code *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., PROD001"
                                    value={formData.productCode}
                                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
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
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Row 2: Price, Rating & Discount */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={(e) => {
                                        const p = parseFloat(e.target.value) || 0;
                                        setFormData({ ...formData, price: p });
                                        if (formData.discount > 0) {
                                            const d = parseFloat(formData.discount) || 0;
                                            setCalculatedPrice(Math.round(p - (p * d) / 100));
                                        }
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
                                <select
                                    value={formData.rating}
                                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                >
                                    <option value={1}>1 Star</option>
                                    <option value={2}>2 Stars</option>
                                    <option value={3}>3 Stars</option>
                                    <option value={4}>4 Stars</option>
                                    <option value={5}>5 Stars</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={formData.discount}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setFormData({ ...formData, discount: val });
                                        if (formData.price) {
                                            const p = parseFloat(formData.price) || 0;
                                            const discounted = p - (p * val) / 100;
                                            setCalculatedPrice(Math.round(discounted));
                                        }
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                    min="0"
                                    max="100"
                                    step="0.5"
                                />
                                {calculatedPrice !== null && formData.discount > 0 && (
                                    <p className="mt-1 text-sm text-green-600 font-semibold">
                                        After discount: ₹{calculatedPrice}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Category, SubCategory & Brand */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Electronics"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Laptops"
                                    value={formData.subCategory}
                                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Dell"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                placeholder="Product description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                                rows="4"
                            />
                        </div>

                        {/* Best Seller */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="bestSeller"
                                checked={formData.bestSeller}
                                onChange={(e) => setFormData({ ...formData, bestSeller: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300"
                                disabled={loading}
                            />
                            <label htmlFor="bestSeller" className="ml-2 text-sm text-gray-700">Mark as Best Seller</label>
                        </div>

                        {/* Images Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                            
                            {/* Existing image previews */}
                            {formData.images.filter(img => typeof img === 'string').length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-3">
                                    {formData.images.map((img, index) => (
                                        typeof img === 'string' && (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={img}
                                                    alt={`Product ${index + 1}`}
                                                    className="w-24 h-24 object-cover rounded-lg border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) })}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                                                    title="Remove image"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}

                            {/* New file previews */}
                            {formData.images.filter(img => img instanceof File).length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-3">
                                    {formData.images.map((file, index) => (
                                        file instanceof File && (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={file.name}
                                                    className="w-24 h-24 object-cover rounded-lg border"
                                                />
                                                <p className="text-xs text-gray-500 truncate w-24 mt-1">{file.name}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) })}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                                                    title="Remove file"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}

                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                    const newFiles = Array.from(e.target.files || [])
                                    if (newFiles.length > 0) {
                                        setFormData({ ...formData, images: [...formData.images, ...newFiles] })
                                    }
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {formData.images.filter(img => typeof img === 'string').length > 0
                                    ? `${formData.images.filter(img => typeof img === 'string').length} existing image(s)`
                                    : ''}
                                {formData.images.filter(img => typeof img === 'string').length > 0 && formData.images.filter(img => img instanceof File).length > 0 ? ' + ' : ''}
                                {formData.images.filter(img => img instanceof File).length > 0
                                    ? `${formData.images.filter(img => img instanceof File).length} new file(s) selected`
                                    : ''}
                            </p>
                        </div>

                        {/* Size & Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Size & Quantity</label>
                            {formData.sizeQuantity.map((item, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Size (e.g., M, L, XL)"
                                        value={item.size}
                                        onChange={(e) => {
                                            const newSQ = [...formData.sizeQuantity]
                                            newSQ[index].size = e.target.value
                                            setFormData({ ...formData, sizeQuantity: newSQ })
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={loading}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Quantity"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const newSQ = [...formData.sizeQuantity]
                                            newSQ[index].quantity = parseInt(e.target.value)
                                            setFormData({ ...formData, sizeQuantity: newSQ })
                                        }}
                                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newSQ = formData.sizeQuantity.filter((_, i) => i !== index)
                                            setFormData({ ...formData, sizeQuantity: newSQ.length > 0 ? newSQ : [{ size: '', quantity: '' }] })
                                        }}
                                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50"
                                        disabled={loading || formData.sizeQuantity.length === 1}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, sizeQuantity: [...formData.sizeQuantity, { size: '', quantity: '' }] })}
                                className="mt-2 px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
                                disabled={loading}
                            >
                                + Add Size
                            </button>
                        </div>

                        {/* Pincode Management */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Serviceable Pincodes
                                <span className="text-gray-400 font-normal ml-1">(comma-separated, leave empty for all)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., 110001, 400001, 560001"
                                value={formData.pincodes}
                                onChange={(e) => setFormData({ ...formData, pincodes: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.pincodes
                                    ? `${formData.pincodes.split(',').filter(p => p.trim()).length} pincodes specified`
                                    : 'No pincode restrictions — available everywhere'}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                editingProductId ? 'Updating Product...' : 'Creating Product...'
                            ) : (
                                editingProductId ? 'Update Product' : 'Create Product'
                            )}
                        </button>
                    </form>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search products by name..."
                      className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                    {!searchLoading && searchQuery && (
                      <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Products List */}
                {(loading && !searchLoading) ? (
                    <div className="text-center text-xl text-gray-600 py-12">Loading...</div>
                ) : (
                    (() => {
                      const displayProducts = searchResults !== null ? searchResults : products;
                      if (displayProducts.length === 0) {
                        return <div className="text-center text-gray-600 py-12 text-sm md:text-base">
                          {searchQuery ? `No products found for "${searchQuery}"` : 'No products found'}
                        </div>;
                      }
                      return (
                        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm md:text-base">
                              <thead className="bg-gray-200">
                                <tr>
                                  <th className="px-3 md:px-6 py-3 text-left font-semibold">Name</th>
                                  <th className="px-3 md:px-6 py-3 text-left font-semibold hidden md:table-cell">Code</th>
                                  <th className="px-3 md:px-6 py-3 text-left font-semibold">Price</th>
                                  <th className="px-3 md:px-6 py-3 text-left font-semibold hidden lg:table-cell">Brand</th>
                                  <th className="px-3 md:px-6 py-3 text-left font-semibold hidden sm:table-cell">Category</th>
                                  <th className="px-3 md:px-6 py-3 text-left font-semibold">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayProducts.map((product) => (
                                  <tr key={product._id || product.productId} className="border-t hover:bg-gray-50">
                                    <td className="px-3 md:px-6 py-4 text-xs md:text-sm font-medium">{product.name}</td>
                                    <td className="px-3 md:px-6 py-4 hidden md:table-cell text-xs md:text-sm">{product.productCode || '-'}</td>
                                    <td className="px-3 md:px-6 py-4 text-xs md:text-sm font-semibold text-green-600">₹{product.price}</td>
                                    <td className="px-3 md:px-6 py-4 hidden lg:table-cell text-xs md:text-sm">{product.brand || '-'}</td>
                                    <td className="px-3 md:px-6 py-4 hidden sm:table-cell text-xs md:text-sm">{product.category}</td>
                                    <td className="px-3 md:px-6 py-4">
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                          onClick={() => fetchProductById(product._id)}
                                          className="text-xs md:text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 border border-blue-300 rounded transition"
                                        >
                                          View
                                        </button>
                                        <button
                                          onClick={() => loadProductForEdit(product._id)}
                                          className="text-xs md:text-sm px-3 py-1 text-amber-600 hover:bg-amber-50 border border-amber-300 rounded transition"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => deleteProduct(product._id)}
                                          disabled={loading}
                                          className="text-xs md:text-sm px-3 py-1 text-red-600 hover:bg-red-50 border border-red-300 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {loading ? 'Deleting...' : 'Delete'}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                )}
            </div>

            {/* Floating Plus Button to Add Product */}
            <button
                onClick={openCreateForm}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-3xl font-bold z-50 hover:scale-110 active:scale-95"
                title="Add New Product"
                aria-label="Add new product"
            >
                +
            </button>
        </div>
    )
}

export default Product