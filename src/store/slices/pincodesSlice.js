import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = '/api/pincodes'

export const fetchPincodes = createAsyncThunk(
    'pincodes/fetchPincodes',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return res.data
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to fetch pincodes')
        }
    }
)

export const createPincode = createAsyncThunk(
    'pincodes/createPincode',
    async (pincodeData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.post(API_URL, pincodeData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return res.data
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to create pincode')
        }
    }
)

export const deletePincode = createAsyncThunk(
    'pincodes/deletePincode',
    async (pincode, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token')
            await axios.delete(`${API_URL}/${pincode}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return pincode
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to delete pincode')
        }
    }
)

const initialState = {
    pincodes: [],
    isLoading: false,
    error: null,
    success: null
}

const pincodesSlice = createSlice({
    name: 'pincodes',
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
        // Fetch Pincodes
        builder
            .addCase(fetchPincodes.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchPincodes.fulfilled, (state, action) => {
                state.isLoading = false
                state.pincodes = action.payload
            })
            .addCase(fetchPincodes.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })

        // Create Pincode
        builder
            .addCase(createPincode.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(createPincode.fulfilled, (state, action) => {
                state.isLoading = false
                state.pincodes.push(action.payload)
                state.success = 'Pincode created successfully!'
            })
            .addCase(createPincode.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })

        // Delete Pincode
        builder
            .addCase(deletePincode.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deletePincode.fulfilled, (state, action) => {
                state.isLoading = false
                state.pincodes = state.pincodes.filter(p => p.pincode !== action.payload)
                state.success = 'Pincode deleted successfully!'
            })
            .addCase(deletePincode.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload
            })
    }
})

export const { clearError, clearSuccess } = pincodesSlice.actions
export default pincodesSlice.reducer
