import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = '/api/products'

export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return res.data
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to fetch products')
        }
    }
)

export const fetchProductById = createAsyncThunk(
    'products/fetchProductById',
    async (productId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get(`${API_URL}/${productId}?_t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }
            })
            return res.data
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to fetch product')
        }
    }
)

export const createProduct = createAsyncThunk(
    'products/createProduct',
    async (formData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.post(API_URL, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })
            return res.data
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to create product')
        }
    }
)

export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async ({ productId, formData }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.put(`${API_URL}/${productId}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })
            return res.data
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to update product')
        }
    }
)

export const deleteProduct = createAsyncThunk(
    'products/deleteProduct',
    async (productId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            await axios.delete(`${API_URL}/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return productId
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to delete product')
        }
    }
)

const initialState = {
    products: [],
    currentProduct: null,
    isLoading: false,
    error: null,
    success: null
}

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        },
        clearSuccess: (state) => {
            state.success = null
        }
    },
    extraReducers: (builder) => {
        // Fetch Products
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.isLoading = false
                state.products = action.payload
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })

        // Fetch Product By ID
        builder
            .addCase(fetchProductById.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchProductById.fulfilled, (state, action) => {
                state.isLoading = false
                state.currentProduct = action.payload
            })
            .addCase(fetchProductById.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })

        // Create Product
        builder
            .addCase(createProduct.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.isLoading = false
                state.products.push(action.payload)
                state.success = 'Product created successfully!'
            })
            .addCase(createProduct.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })

        // Update Product
        builder
            .addCase(updateProduct.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.isLoading = false
                const index = state.products.findIndex(p => p._id === action.payload._id)
                if (index !== -1) {
                    state.products[index] = action.payload
                }
                state.currentProduct = action.payload
                state.success = 'Product updated successfully!'
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })

        // Delete Product
        builder
            .addCase(deleteProduct.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.isLoading = false
                state.products = state.products.filter(p => p._id !== action.payload)
                state.success = 'Product deleted successfully!'
            })
            .addCase(deleteProduct.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })
    }
})

export const { clearError, clearSuccess } = productsSlice.actions
export default productsSlice.reducer
