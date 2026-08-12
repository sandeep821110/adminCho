import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { debugAuth, debugInfo, debugError, debugSuccess, debugMount, debugWarn } from '../utils/debug'
import { clearAllAuthData, cleanStaleAuthData, syncTokenToStorage, isTokenExpired } from '../utils/tokenUtils'
import { setAccessToken, setOnUnauthorized } from '../utils/api'

const AuthContext = createContext()

const REFRESH_URL = '/api/auth/refresh-token'

const getUserFromStorage = () => {
    try {
        const stored = localStorage.getItem('user')
        return stored ? JSON.parse(stored) : null
    } catch {
        return null
    }
}

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate()
    const [user, setUser] = useState(getUserFromStorage)
    const [token, setToken] = useState(() => localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))

    debugMount('AuthProvider')

    const handleUnauthorized = useCallback(() => {
        setUser(null)
        setToken(null)
        setAccessToken(null)
        setIsAuthenticated(false)
        clearAllAuthData()
        window.location.href = '/'
    }, [])

    useEffect(() => {
        debugInfo('AuthContext', 'Initializing auth')
        setOnUnauthorized(handleUnauthorized)
        cleanStaleAuthData()

        const tryRestoreSession = async () => {
            try {
                const res = await axios.post(
                    REFRESH_URL,
                    {},
                    { withCredentials: true, _skipAuth: true }
                )

                const newToken = res.data.accessToken || res.data.token
                if (newToken) {
                    setAccessToken(newToken)
                    setToken(newToken)
                    syncTokenToStorage(newToken)
                    setIsAuthenticated(true)

                    const userData = res.data.user || getUserFromStorage()
                    if (userData) {
                        setUser(userData)
                        localStorage.setItem('user', JSON.stringify(userData))
                    }

                    debugSuccess('AuthContext', 'Session restored via refresh token cookie')
                    debugAuth('AUTO-RESTORE', userData, 'Restored')
                }
            } catch {
                debugInfo('AuthContext', 'No valid refresh token cookie found')
            } finally {
                const storedToken = localStorage.getItem('token')
                if (storedToken && isTokenExpired(storedToken)) {
                    debugInfo('AuthContext', 'Stored token is expired - clearing session')
                    clearAllAuthData()
                    setToken(null)
                    setUser(null)
                    setIsAuthenticated(false)
                    setAccessToken(null)
                }
                setLoading(false)
            }
        }

        tryRestoreSession()
    }, [handleUnauthorized])

    const login = (userData, accessToken) => {
        debugInfo('AuthContext', 'Login', { email: userData?.email, role: userData?.role })

        setUser(userData)
        setToken(accessToken)
        setIsAuthenticated(true)
        setAccessToken(accessToken)

        localStorage.setItem('user', JSON.stringify(userData))
        syncTokenToStorage(accessToken)

        debugSuccess('AuthContext', 'Login Success', {
            email: userData?.email,
            role: userData?.role
        })
        debugAuth('LOGIN', userData, 'Successful')
    }

    const logout = async () => {
        debugInfo('AuthContext', 'Logout', { email: user?.email })

        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
        } catch (err) {
            debugError('AuthContext', 'Logout API call failed', err)
        }

        setUser(null)
        setToken(null)
        setIsAuthenticated(false)
        setAccessToken(null)
        clearAllAuthData()

        debugSuccess('AuthContext', 'Logout Complete')
        debugAuth('LOGOUT', null, 'Successful')
    }

    const handleTokenExpired = () => {
        debugInfo('AuthContext', 'Token Expired')
        setUser(null)
        setToken(null)
        setIsAuthenticated(false)
        setAccessToken(null)
        clearAllAuthData()
        window.location.href = '/'
    }

    const validateToken = (tokenToValidate = token) => {
        if (!tokenToValidate) return false
        try {
            const parts = tokenToValidate.split('.')
            if (parts.length !== 3) return false
            const decoded = JSON.parse(atob(parts[1]))
            if (Date.now() >= decoded.exp * 1000) {
                handleTokenExpired()
                return false
            }
            return true
        } catch {
            return false
        }
    }

    // Proactive token refresh when token is near expiry
    useEffect(() => {
        if (!isAuthenticated || !token) return

        const decoded = (() => {
            try {
                const parts = token.split('.')
                if (parts.length !== 3) return null
                return JSON.parse(atob(parts[1]))
            } catch {
                return null
            }
        })()

        if (!decoded?.exp) return

        const expiresIn = decoded.exp * 1000 - Date.now()
        // Refresh 2 minutes before expiry (minimum 10s)
        const refreshAt = Math.max(10000, expiresIn - 120000)

        const timer = setTimeout(() => {
            debugInfo('AuthContext', 'Proactive token refresh triggered')
            // The interceptor will attach the current token.
            // We make a lightweight call to trigger a 401 → refresh flow.
            if (navigator.onLine) {
                axios.post('/api/auth/refresh-token', {},
                    { withCredentials: true, _skipAuth: true }
                ).then((res) => {
                    const newToken = res.data.accessToken || res.data.token
                    if (newToken) {
                        setAccessToken(newToken)
                        setToken(newToken)
                        syncTokenToStorage(newToken)
                        debugSuccess('AuthContext', 'Token proactively refreshed')
                    }
                }).catch(() => {
                    debugWarn('AuthContext', 'Proactive refresh failed - interceptor will handle')
                })
            }
        }, refreshAt)

        return () => clearTimeout(timer)
    }, [isAuthenticated, token])

    const isAdmin = () => {
        if (user?.role === 'admin' || user?.role === 'Admin') {
            debugInfo('isAdmin', 'true via user.role', { role: user.role })
            return true
        }
        // Fallback: decode the JWT token for the role claim
        const t = token || localStorage.getItem('token')
        if (t) {
            try {
                const payload = JSON.parse(atob(t.split('.')[1]))
                const isAdmin = payload.role === 'admin' || payload.role === 'Admin'
                debugInfo('isAdmin', isAdmin ? 'true via JWT' : 'false', {
                    userRole: user?.role,
                    jwtRole: payload.role,
                    hasToken: !!t
                })
                return isAdmin
            } catch {
                debugWarn('isAdmin', 'Failed to decode JWT')
            }
        } else {
            debugInfo('isAdmin', 'false - no token available', { userRole: user?.role })
        }
        return false
    }

    const hasRole = (requiredRole) => {
        if (!user || !requiredRole) return false
        if (isAdmin()) return true
        return user.role === requiredRole || user.role === requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)
    }

    const listSessions = async () => {
        try {
            const res = await axios.get('/api/auth/sessions', { withCredentials: true })
            return res.data.sessions || []
        } catch (err) {
            debugError('AuthContext', 'Failed to list sessions', err)
            throw err
        }
    }

    const revokeSession = async (jti) => {
        try {
            await axios.delete(`/api/auth/sessions/${jti}`, { withCredentials: true })
            debugInfo('AuthContext', `Session ${jti} revoked`)
        } catch (err) {
            debugError('AuthContext', 'Failed to revoke session', err)
            throw err
        }
    }

    const revokeAllSessions = async () => {
        try {
            await axios.delete('/api/auth/sessions', { withCredentials: true })
            debugInfo('AuthContext', 'All other sessions revoked')
        } catch (err) {
            debugError('AuthContext', 'Failed to revoke sessions', err)
            throw err
        }
    }

    const value = {
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
        isAdmin,
        hasRole,
        validateToken,
        handleTokenExpired,
        listSessions,
        revokeSession,
        revokeAllSessions,
        isTokenExpired: (tokenToCheck) => {
            const t = tokenToCheck || token
            if (!t) return true
            try {
                const parts = t.split('.')
                if (parts.length !== 3) return true
                const decoded = JSON.parse(atob(parts[1]))
                return Date.now() >= decoded.exp * 1000
            } catch {
                return true
            }
        },
        getTokenTimeRemaining: (tokenToCheck) => {
            const t = tokenToCheck || token
            if (!t) return 0
            try {
                const parts = t.split('.')
                if (parts.length !== 3) return 0
                const decoded = JSON.parse(atob(parts[1]))
                if (!decoded.exp) return 0
                return Math.max(0, (decoded.exp * 1000 - Date.now()) / 1000)
            } catch {
                return 0
            }
        }
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
