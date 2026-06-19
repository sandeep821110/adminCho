import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = '/api/orders'

export const fetchOrders = createAsyncThunk(
    'orders/fetchOrders',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return res.data
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to fetch orders')
        }
    }
)

export const fetchOrderById = createAsyncThunk(
    'orders/fetchOrderById',
    async (orderId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get(`${API_URL}/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return res.data
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to fetch order')
        }
    }
)

export const createOrder = createAsyncThunk(
    'orders/createOrder',
    async (orderData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.post(API_URL, orderData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return res.data
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to create order')
        }
    }
)

export const updateOrderStatus = createAsyncThunk(
    'orders/updateOrderStatus',
    async ({ orderId, status }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.put(`${API_URL}/${orderId}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return res.data
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to update order')
        }
    }
)

export const deleteOrder = createAsyncThunk(
    'orders/deleteOrder',
    async (orderId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            await axios.delete(`${API_URL}/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return orderId
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to delete order')
        }
    }
)

const initialState = {
    orders: [],
    currentOrder: null,
    isLoading: false,
    error: null,
    success: null
}

const ordersSlice = createSlice({
    name: 'orders',
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
        // Fetch Orders
        builder
            .addCase(fetchOrders.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.isLoading = false
                state.orders = action.payload
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })

        // Fetch Order By ID
        builder
            .addCase(fetchOrderById.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchOrderById.fulfilled, (state, action) => {
                state.isLoading = false
                state.currentOrder = action.payload
            })
            .addCase(fetchOrderById.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })

        // Create Order
        builder
            .addCase(createOrder.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.isLoading = false
                state.orders.push(action.payload)
                state.success = 'Order created successfully!'
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })

        // Update Order Status
        builder
            .addCase(updateOrderStatus.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                state.isLoading = false
                const index = state.orders.findIndex(o => o._id === action.payload._id)
                if (index !== -1) {
                    state.orders[index] = action.payload
                }
                state.currentOrder = action.payload
                state.success = 'Order updated successfully!'
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })

        // Delete Order
        builder
            .addCase(deleteOrder.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deleteOrder.fulfilled, (state, action) => {
                state.isLoading = false
                state.orders = state.orders.filter(o => o._id !== action.payload)
                state.success = 'Order deleted successfully!'
            })
            .addCase(deleteOrder.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })
    }
})

export const { clearError, clearSuccess } = ordersSlice.actions
export default ordersSlice.reducer
