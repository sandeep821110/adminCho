import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { clearAllAuthData } from '../../utils/tokenUtils'
import { debugInfo } from '../../utils/debug'

const API_URL = '/api/auth'

export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async () => {
        localStorage.removeItem('token')
        return null
    }
)

export const listSessions = createAsyncThunk(
    'auth/listSessions',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${API_URL}/sessions`)
            return { sessions: res.data.sessions || [], count: res.data.count || 0 }
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to fetch sessions')
        }
    }
)

export const revokeSession = createAsyncThunk(
    'auth/revokeSession',
    async (jti, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/sessions/${jti}`)
            return { jti }
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to revoke session')
        }
    }
)

export const revokeAllSessions = createAsyncThunk(
    'auth/revokeAllSessions',
    async (_, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_URL}/sessions`)
            return { message: 'All other sessions revoked' }
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to revoke sessions')
        }
    }
)

export const changePassword = createAsyncThunk(
    'auth/changePassword',
    async ({ currentPassword, newPassword }, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${API_URL}/change-password`, { currentPassword, newPassword })
            return res.data
        } catch (err) {
            return rejectWithValue(err?.response?.data?.message || 'Failed to change password')
        }
    }
)

const initialState = {
    user: null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('token'),
    sessions: [],
    sessionsCount: 0,
    sessionsLoading: false,
    passwordChangeSuccess: false,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => { state.error = null },
        setUser: (state, action) => {
            state.user = action.payload
            state.isAuthenticated = true
        },
        handleTokenExpired: (state) => {
            debugInfo('authSlice', 'Token Expired - Clearing all data')
            clearAllAuthData()
            state.user = null
            state.token = null
            state.isAuthenticated = false
            state.error = 'Token expired. Please login again'
        },
        clearAllAuthDataAction: (state) => {
            debugInfo('authSlice', 'Clearing all auth data')
            clearAllAuthData()
            state.user = null
            state.token = null
            state.isAuthenticated = false
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null; state.token = null; state.isAuthenticated = false
            })
        builder
            .addCase(listSessions.pending, (state) => {
                state.sessionsLoading = true; state.error = null
            })
            .addCase(listSessions.fulfilled, (state, action) => {
                state.sessionsLoading = false
                state.sessions = action.payload.sessions
                state.sessionsCount = action.payload.count
            })
            .addCase(listSessions.rejected, (state, action) => {
                state.sessionsLoading = false; state.error = action.payload
            })
        builder
            .addCase(revokeSession.fulfilled, (state, action) => {
                state.sessions = state.sessions.filter(s => s.jti !== action.payload.jti)
                state.sessionsCount = Math.max(0, state.sessionsCount - 1)
            })
        builder
            .addCase(revokeAllSessions.fulfilled, (state) => {
                state.sessions = state.sessions.filter(s => s.isCurrent)
                state.sessionsCount = state.sessions.filter(s => s.isCurrent).length
            })
        builder
            .addCase(changePassword.pending, (state) => {
                state.isLoading = true; state.error = null; state.passwordChangeSuccess = false
            })
            .addCase(changePassword.fulfilled, (state) => {
                state.isLoading = false; state.passwordChangeSuccess = true; state.error = null
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.isLoading = false; state.error = action.payload; state.passwordChangeSuccess = false
            })
    }
})

export const { clearError, setUser, handleTokenExpired, clearAllAuthDataAction } = authSlice.actions
export default authSlice.reducer
