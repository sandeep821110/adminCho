import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isTokenExpired } from '../utils/tokenUtils'
import { debugInfo, debugRoute, debugError } from '../utils/debug'

const ProtectedRoute = ({ children, requiredRole = null, adminOnly = false }) => {
    const { isAuthenticated, isAdmin, hasRole, loading, token } = useAuth()
    const location = useLocation()

    debugInfo('ProtectedRoute', 'Checking Access', {
        path: location.pathname,
        isAuthenticated,
        isAdmin: isAdmin(),
        requiredRole,
        adminOnly,
        loading
    })

    if (!isAuthenticated || isTokenExpired(token)) {
        debugRoute(location.pathname, '/login', isTokenExpired(token) ? 'Token expired' : 'Not authenticated')
        return <Navigate to="/login" state={{ from: location.pathname, expired: isTokenExpired(token) }} replace />
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-2xl font-semibold text-blue-600">Loading...</div>
            </div>
        )
    }

    if (adminOnly && !isAdmin()) {
        debugError('ProtectedRoute', 'Admin Only Access Denied', new Error('User is not admin'), { path: location.pathname })
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-red-100 to-orange-100">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-gray-700 mb-6">You don't have admin privileges to access this page.</p>
                    <a href="/" className="text-blue-600 hover:underline font-semibold">Go back to home</a>
                </div>
            </div>
        )
    }

    if (requiredRole && !hasRole(requiredRole) && !isAdmin()) {
        debugError('ProtectedRoute', 'Role Check Failed', new Error(`Required role: ${requiredRole}`), { path: location.pathname })
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-red-100 to-orange-100">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-gray-700 mb-6">You don't have the required role ({requiredRole}) to access this page.</p>
                    <a href="/" className="text-blue-600 hover:underline font-semibold">Go back to home</a>
                </div>
            </div>
        )
    }

    debugInfo('ProtectedRoute', 'Access Granted', { path: location.pathname })

    return children
}

export default ProtectedRoute
