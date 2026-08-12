import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { debugInfo, debugSuccess, debugError, debugAPI, debugAPIResponse, debugMount, debugEffect } from '../../utils/debug'

const CarouselSlider = () => {
    const [carouselData, setCarouselData] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [editingCarouselId, setEditingCarouselId] = useState(null)
    const formRef = useRef(null)
    const [formData, setFormData] = useState({
        title: '',
        image: '',
        imageFiles: [],
        imagePreviews: [],
        link: '',
        position: 1,
        isActive: true
    })
    const { token, isAdmin } = useAuth()
    const navigate = useNavigate()

    debugMount('CarouselSlider')

    // Only admin can access
    useEffect(() => {
        debugEffect('CarouselSlider', 'Admin Access Check')
        if (!isAdmin()) {
            debugError('CarouselSlider', 'Access Denied', new Error('Not Admin'))
            navigate('/')
        }
    }, [isAdmin, navigate])

    // Fetch all carousel data
    useEffect(() => {
        debugInfo('CarouselSlider', 'useEffect triggered', { hasToken: !!token })
        if (token) {
            fetchCarouselData()
        } else {
            debugError('CarouselSlider', 'No token available for fetching')
            setError('Authentication token not available')
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    const fetchCarouselData = async () => {
        try {
            debugInfo('CarouselSlider', 'Starting Carousel Fetch')
            console.log('🔍 Debug: fetchCarouselData called')
            console.log('🔍 Debug: Token available:', !!token)
            
            setLoading(true)
            setError('')
            setCarouselData([])
            
            const endpoint = '/api/carousel'
            
            debugInfo('CarouselSlider', 'Fetching Carousel Data', { endpoint, hasToken: !!token })
            debugAPI('GET', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            const response = await axios.get(endpoint, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            
            console.log('🔍 Debug: Response received:', response)
            console.log('🔍 Debug: Response data:', response.data)
            console.log('🔍 Debug: Response data.data:', response.data.data)
            
            debugAPIResponse('GET', endpoint, response.status, response.data)
            
            // Check if we have data - API returns { data: [...] }
            const rawData = response.data.data || response.data || []
            console.log('🔍 Debug: Raw data:', rawData)
            console.log('🔍 Debug: Raw data length:', Array.isArray(rawData) ? rawData.length : 0)
            
            // Process and normalize carousel data to match API format
            const carouselItems = (Array.isArray(rawData) ? rawData : []).map(item => {
                console.log('🔍 Debug: Original item:', item)
                console.log('🔍 Debug: Item images type:', typeof item.images)
                console.log('🔍 Debug: Item images is array:', Array.isArray(item.images))
                console.log('🔍 Debug: Item images value:', item.images)
                
                const processed = {
                    _id: item._id,
                    title: item.title || '',
                    // Map 'active' from API to 'isActive' for UI
                    isActive: item.active === true || item.active === 'true' || item.active === 1,
                    // Use images array directly from API
                    images: Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []),
                    // Use position if available, otherwise default to 1
                    position: parseInt(item.position) || 1,
                    // Include link if available
                    link: item.link || '',
                    // Keep original timestamps
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    __v: item.__v
                }
                
                console.log('🔍 Debug: Processed item:', processed)
                console.log('🔍 Debug: Active value (original):', item.active)
                console.log('🔍 Debug: Active value (processed):', processed.isActive)
                console.log('🔍 Debug: Images array length:', processed.images.length)
                console.log('🔍 Debug: Images array content:', processed.images)
                console.log('🔍 Debug: Image URLs:', processed.images.map((url, i) => `${i}: ${url}`))
                
                return processed
            })
            
            console.log('🔍 Debug: Processed carousel items count:', carouselItems.length)
            console.log('🔍 Debug: Processed carousel items:', carouselItems)
            
            debugInfo('CarouselSlider', 'Successfully processed carousel items', carouselItems.length)
            
            setCarouselData(carouselItems)
            
            if (carouselItems.length === 0) {
                debugInfo('CarouselSlider', 'No carousel items found')
                setError('No carousel items available')
            } else {
                debugSuccess('CarouselSlider', `Loaded ${carouselItems.length} carousel items`)
                setError('')
            }
            
            setLoading(false)
        } catch (err) {
            console.error('🔴 Error in fetchCarouselData:', err)
            console.error('🔴 Error response:', err.response)
            console.error('🔴 Error message:', err.message)
            console.error('🔴 Error status:', err.response?.status)
            
            debugError('CarouselSlider', 'Fetch Failed', err)
            
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch carousel data'
            console.log('🔍 Debug: Error message set to:', errorMessage)
            
            setError(errorMessage)
            setCarouselData([])
            setLoading(false)
        }
    }

    const createCarouselData = async (data) => {
        try {
            // Validate required fields
            if (!data.title?.trim()) {
                setError('Title is required')
                return
            }
            if (data.imageFiles.length === 0 && !data.image?.trim()) {
                setError('At least one image is required')
                return
            }

            debugInfo('CarouselSlider', 'Creating Carousel', data)
            setLoading(true)
            setError('')
            setSuccess('')
            
            const endpoint = '/api/carousel'
            debugAPI('POST', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            // Prepare FormData for file upload
            const formDataToSend = new FormData()
            formDataToSend.append('title', data.title)
            formDataToSend.append('link', data.link || '')
            formDataToSend.append('position', data.position || 1)
            formDataToSend.append('active', data.isActive)  // Send as 'active' to match API
            
            // Add multiple image files if selected
            if (data.imageFiles.length > 0) {
                data.imageFiles.forEach((file) => {
                    formDataToSend.append('images', file)
                })
            } else if (data.image?.trim()) {
                // Fallback to single URL image
                formDataToSend.append('image', data.image)
            }
            
            const response = await axios.post(endpoint, formDataToSend, {
                headers: { 
                    Authorization: `Bearer ${token}`
                }
            })
            
            debugAPIResponse('POST', endpoint, response.status, response.data)
            setSuccess('Carousel item created successfully!')
            setFormData({ title: '', image: '', imageFiles: [], imagePreviews: [], link: '', position: 1, isActive: true })
            if (formRef.current) formRef.current.reset()
            
            await fetchCarouselData()
        } catch (err) {
            debugError('CarouselSlider', 'Create Failed', err)
            setError(err.response?.data?.message || 'Failed to create carousel item')
        } finally {
            setLoading(false)
        }
    }

    const updateCarouselData = async (id, data) => {
        try {
            // Validate required fields
            if (!data.title?.trim()) {
                setError('Title is required')
                return
            }
            if (data.imageFiles.length === 0 && !data.image?.trim() && data.imagePreviews.length === 0) {
                setError('At least one image is required')
                return
            }

            debugInfo('CarouselSlider', 'Updating Carousel', id, data)
            setLoading(true)
            setError('')
            setSuccess('')
            
            const endpoint = `/api/carousel/${id}`
            debugAPI('PUT', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            // Prepare FormData for file upload
            const formDataToSend = new FormData()
            formDataToSend.append('title', data.title)
            formDataToSend.append('link', data.link || '')
            formDataToSend.append('position', data.position || 1)
            formDataToSend.append('active', data.isActive)  // Send as 'active' to match API

            // Send existing image URLs as JSON string so backend can preserve them
            const existingImageUrls = data.imagePreviews
                .filter(p => !p.isNew)
                .map(p => p.data)
            formDataToSend.append('existingImages', JSON.stringify(existingImageUrls))

            // Add new image files if selected
            if (data.imageFiles.length > 0) {
                data.imageFiles.forEach((file) => {
                    formDataToSend.append('images', file)
                })
            }
            
            const response = await axios.put(endpoint, formDataToSend, {
                headers: { 
                    Authorization: `Bearer ${token}`
                }
            })
            
            debugAPIResponse('PUT', endpoint, response.status, response.data)
            setSuccess('Carousel item updated successfully!')
            setEditingCarouselId(null)
            setFormData({ title: '', image: '', imageFiles: [], imagePreviews: [], link: '', position: 1, isActive: true })
            if (formRef.current) formRef.current.reset()
            
            await fetchCarouselData()
        } catch (err) {
            debugError('CarouselSlider', 'Update Failed', err)
            setError(err.response?.data?.message || 'Failed to update carousel item')
        } finally {
            setLoading(false)
        }
    }

    const deleteCarouselData = async (id) => {
        try {
            if (!window.confirm('Are you sure you want to delete this carousel item?')) return
            
            debugInfo('CarouselSlider', 'Deleting Carousel', id)
            setLoading(true)
            setError('')
            setSuccess('')
            
            const endpoint = `/api/carousel/${id}`
            debugAPI('DELETE', endpoint, { headers: { Authorization: 'Bearer [token]' } })
            
            const response = await axios.delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            debugAPIResponse('DELETE', endpoint, response.status, response.data)
            setSuccess('Carousel item deleted successfully!')
            
            await fetchCarouselData()
        } catch (err) {
            debugError('CarouselSlider', 'Delete Failed', err)
            setError(err.response?.data?.message || 'Failed to delete carousel item')
        } finally {
            setLoading(false)
        }
    }

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
        return new Promise((resolve) => {
            const img = new Image()
            const url = URL.createObjectURL(file)
            img.src = url
            img.onload = () => {
                URL.revokeObjectURL(url)
                let w = img.width, h = img.height
                if (w > maxWidth) {
                    h = Math.round(h * maxWidth / w)
                    w = maxWidth
                }
                const canvas = document.createElement('canvas')
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, w, h)
                canvas.toBlob((blob) => {
                    const compressed = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    })
                    resolve(compressed)
                }, 'image/jpeg', quality)
            }
            img.onerror = () => resolve(file)
        })
    }

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files)
        
        if (files.length > 10) {
            setError('Maximum 10 images can be selected at once')
            return
        }

        const validFiles = []
        const previews = []
        const errors = []

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                errors.push(`"${file.name}" is not a valid image file`)
                continue
            }

            const compressed = await compressImage(file)
            const sizeKB = (compressed.size / 1024).toFixed(2)

            validFiles.push(compressed)

            try {
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result)
                    reader.onerror = reject
                    reader.readAsDataURL(compressed)
                })

                previews.push({
                    data: dataUrl,
                    name: file.name,
                    size: sizeKB + ' KB',
                    isNew: true
                })
            } catch {
                errors.push(`"${file.name}" failed to load`)
            }
        }

        if (errors.length > 0) {
            setError(errors.join('; '))
        }

        setFormData(prev => ({
            ...prev,
            imageFiles: validFiles,
            imagePreviews: [
                ...prev.imagePreviews.filter(p => !p.isNew),
                ...previews
            ]
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (editingCarouselId) {
            updateCarouselData(editingCarouselId, formData)
        } else {
            createCarouselData(formData)
        }
    }

    const handleEdit = (item) => {
        setEditingCarouselId(item._id)
        
        // Handle both single image and multiple images
        let imagePreviews = []
        if (Array.isArray(item.images) && item.images.length > 0) {
            imagePreviews = item.images.map(img => ({
                data: img,
                name: img.split('/').pop() || 'image',
                isNew: false
            }))
        } else if (item.image) {
            imagePreviews = [{
                data: item.image,
                name: item.image.split('/').pop() || 'image',
                isNew: false
            }]
        }
        
        setFormData({
            ...item,
            imageFiles: [],
            imagePreviews: imagePreviews,
            image: item.image || ''
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCancel = () => {
        setEditingCarouselId(null)
        setFormData({ title: '', image: '', imageFiles: [], imagePreviews: [], link: '', position: 1, isActive: true })
        if (formRef.current) formRef.current.reset()
    }

    const removeImagePreview = (index) => {
        setFormData(prev => {
            const previewToRemove = prev.imagePreviews[index]
            return {
                ...prev,
                imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
                imageFiles: previewToRemove?.isNew
                    ? prev.imageFiles.filter((_, i) => i !== index - prev.imagePreviews.filter(p => !p.isNew).length)
                    : prev.imageFiles
            }
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Carousel Slider Management</h1>
                    <p className="text-gray-600">Manage carousel images and content</p>
                </div>

                {/* Alert Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 font-semibold">Error</p>
                        <p className="text-red-600">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700 font-semibold">Success</p>
                        <p className="text-green-600">{success}</p>
                    </div>
                )}

                {/* Debug Info Panel */}
                <div className="mb-6 p-4 bg-rose-50 border border-rose-300 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-rose-900">🔍 Debug Info</h3>
                        <button 
                            onClick={fetchCarouselData}
                            disabled={loading}
                            className="text-xs px-2 py-1 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-400 text-white rounded font-semibold"
                        >
                            Refresh Data
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="bg-white p-2 rounded border border-rose-200">
                            <p className="text-rose-500 font-semibold">Status</p>
                            <p className="text-rose-900">{loading ? '🔄 Loading...' : carouselData.length > 0 ? '✅ Loaded' : '⚠️ Empty'}</p>
                        </div>
                        <div className="bg-white p-2 rounded border border-rose-200">
                            <p className="text-rose-500 font-semibold">Items Count</p>
                            <p className="text-rose-900">{carouselData.length}</p>
                        </div>
                        <div className="bg-white p-2 rounded border border-rose-200">
                            <p className="text-rose-500 font-semibold">Token</p>
                            <p className="text-rose-900 truncate" title={token}>{token ? '✅ Available' : '❌ Missing'}</p>
                        </div>
                        <div className="bg-white p-2 rounded border border-rose-200">
                            <p className="text-rose-500 font-semibold">Error</p>
                            <p className="text-rose-900">{error ? '❌ Yes' : '✅ No'}</p>
                        </div>
                    </div>
                    {error && (
                        <div className="mt-2 p-2 bg-white rounded border border-red-300">
                            <p className="text-xs text-red-600 font-mono break-all">{error}</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingCarouselId ? 'Edit Carousel Item' : 'Add New Carousel Item'}
                            </h2>
                            
                            <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleFormChange}
                                        placeholder="Enter carousel title"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Images (Maximum 10)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.imagePreviews.length}/10 images selected
                                    </p>
                                    {formData.imagePreviews.length > 0 && (
                                        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                                            {editingCarouselId && formData.imageFiles.length > 0 && (
                                                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                                                    ⚠️ New images will replace old ones
                                                </div>
                                            )}
                                            {formData.imagePreviews.map((preview, index) => (
                                                <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden">
                                                    {preview.data ? (
                                                        <img
                                                            src={preview.data.startsWith('http') || preview.data.startsWith('data:') ? preview.data : `/api/carousel${preview.data.startsWith('/') ? '' : '/'}${preview.data}`}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-24 object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none'
                                                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                                                            }}
                                                            onLoad={(e) => {
                                                                e.target.style.display = 'block'
                                                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'none'
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className="hidden w-full h-24 bg-gray-100 border border-dashed border-gray-300 items-center justify-center rounded">
                                                        <span className="text-gray-400 text-xs">No image</span>
                                                    </div>
                                                    {preview.isNew && (
                                                        <div className="absolute top-1 left-1 bg-rose-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                                            NEW
                                                        </div>
                                                    )}
                                                    <div className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer text-sm font-bold transition"
                                                        onClick={() => removeImagePreview(index)}
                                                    >
                                                        ×
                                                    </div>
                                                    <div className="bg-gray-50 px-2 py-1 text-xs text-gray-600">
                                                        <p className="truncate">{preview.name}</p>
                                                        {preview.size && <p className="text-gray-500">{preview.size}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Link</label>
                                    <input
                                        type="text"
                                        name="link"
                                        value={formData.link}
                                        onChange={handleFormChange}
                                        placeholder="Enter carousel link"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                                    <input
                                        type="number"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleFormChange}
                                        min="1"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleFormChange}
                                        className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-2 focus:ring-rose-500"
                                        disabled={loading}
                                    />
                                    <label className="ml-2 text-sm font-semibold text-gray-700">Active</label>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                                    >
                                        {loading ? 'Processing...' : editingCarouselId ? 'Update' : 'Create'}
                                    </button>
                                    {editingCarouselId && (
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={loading}
                                            className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Carousel Items</h2>
                            
                            {loading && !carouselData.length ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-gray-500 text-center">
                                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
                                        <p className="mt-4">Loading carousel data...</p>
                                    </div>
                                </div>
                            ) : carouselData.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No carousel items found. Create one to get started!</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {carouselData.map(item => {
                                        // Get all images
                                        const images = Array.isArray(item.images) && item.images.length > 0 
                                            ? item.images 
                                            : item.image ? [item.image] : []
                                        
                                        return (
                                            <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
                                                {/* Images Gallery */}
                                                {images.length > 0 && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4 bg-gray-50 border-b border-gray-200">
                                                        {images.map((img, idx) => (
                                                            <div key={idx} className="relative group">
                                                                {img ? (
                                                                    <img
                                                                        src={img.startsWith('http') || img.startsWith('data:') ? img : `/api/carousel${img.startsWith('/') ? '' : '/'}${img}`}
                                                                        alt={`${item.title} - ${idx + 1}`}
                                                                        className="w-full h-24 object-cover rounded-lg border border-gray-300 bg-gray-100"
                                                                        loading="lazy"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none'
                                                                            e.target.nextSibling.style.display = 'flex'
                                                                        }}
                                                                        onLoad={(e) => {
                                                                            e.target.style.display = 'block'
                                                                            e.target.nextSibling.style.display = 'none'
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <div className="hidden absolute inset-0 bg-gray-200 rounded-lg border border-dashed border-gray-400 items-center justify-center">
                                                                    <span className="text-gray-500 text-xs text-center px-2">No image</span>
                                                                </div>
                                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all flex items-center justify-center pointer-events-none">
                                                                    <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100">{idx + 1}/{images.length}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {images.length === 0 && (
                                                    <div className="grid grid-cols-1 p-4 bg-gray-50 border-b border-gray-200">
                                                        <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                                            <p className="text-gray-500 text-sm">No images found</p>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Details Section */}
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                                                            <div className="flex flex-wrap gap-2 items-center">
                                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${item.isActive === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} title={`DB Value: ${item.isActive}`}>
                                                                    {item.isActive === true ? '🟢 Active' : '🔴 Inactive'}
                                                                </span>
                                                                <span className="text-sm bg-rose-100 text-rose-800 px-2 py-1 rounded-full" title={`Position from DB: ${item.position}`}>
                                                                    📍 Position: {item.position}
                                                                </span>
                                                                <span className="text-sm bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                                                                    🖼️ {images.length} Image{images.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Link Info */}
                                                    {item.link && (
                                                        <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                            <p className="text-xs text-gray-600 font-semibold">Link:</p>
                                                            <p className="text-xs text-rose-500 truncate hover:text-clip" title={item.link}>{item.link}</p>
                                                        </div>
                                                    )}

                                                    {/* Meta Info */}
                                                    <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                                            <p className="font-semibold">ID</p>
                                                            <p className="text-gray-700 truncate" title={item._id}>{item._id?.slice(0, 8)}...</p>
                                                        </div>
                                                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                                            <p className="font-semibold">Created</p>
                                                            <p className="text-gray-700">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Debug Info - Shows Database Values */}
                                                    <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200 text-xs">
                                                        <p className="font-bold text-yellow-900 mb-2">📊 API Data Mapping & Image URLs:</p>
                                                        <ul className="space-y-2 text-yellow-800">
                                                            <li><strong>API Field:</strong> active → <strong>UI Field:</strong> isActive = <span className="font-mono font-semibold">{JSON.stringify(item.isActive)}</span></li>
                                                            <li><strong>position:</strong> <span className="font-mono font-semibold">{JSON.stringify(item.position)}</span> (Type: {typeof item.position})</li>
                                                            <li><strong>images:</strong> <span className="font-mono font-semibold">{Array.isArray(item.images) ? `${item.images.length} ImageKit URLs` : 'Not Array'}</span></li>
                                                            {Array.isArray(item.images) && item.images.length > 0 && (
                                                                <li className="mt-2 p-2 bg-white rounded border border-yellow-300">
                                                                    <strong>🖼️ ImageKit URLs:</strong>
                                                                    <div className="mt-1 space-y-1">
                                                                        {item.images.map((url, i) => (
                                                                            <div key={i} className="truncate text-yellow-700 border-b border-yellow-200 pb-1">
                                                                                <strong>{i + 1}:</strong> <span className="font-mono text-xs text-rose-600 cursor-pointer hover:text-rose-900" title={url} onClick={() => {
                                                                                    window.open(url, '_blank')
                                                                                }}>
                                                                                    {url.slice(0, 50)}...
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </li>
                                                            )}
                                                            <li><strong>createdAt:</strong> {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}</li>
                                                        </ul>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            disabled={loading}
                                                            className="flex-1 bg-rose-500 hover:bg-rose-500 disabled:bg-gray-400 text-white font-bold py-2 px-3 rounded-lg transition duration-200 text-sm"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteCarouselData(item._id)}
                                                            disabled={loading}
                                                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2 px-3 rounded-lg transition duration-200 text-sm"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CarouselSlider
