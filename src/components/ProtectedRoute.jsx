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
            <div className="flex items-center justify-center min-h-screen page-bg">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin border-4 border-pink-200 border-t-pink-600 rounded-full h-12 w-12"></div>
                    <div className="text-xl font-semibold gradient-text">Loading...</div>
                </div>
            </div>
        )
    }

    if (adminOnly && !isAdmin()) {
        debugError('ProtectedRoute', 'Admin Only Access Denied', new Error('User is not admin'), { path: location.pathname })
        return (
            <div className="flex items-center justify-center min-h-screen page-bg">
                <div className="text-center card !p-10 max-w-md mx-4">
                    <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center text-3xl">🚫</div>
                    <h1 className="text-2xl font-bold text-rose-600 mb-3">Access Denied</h1>
                    <p className="text-slate-600 mb-6">You don't have admin privileges to access this page.</p>
                    <a href="/" className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">Go back to home</a>
                </div>
            </div>
        )
    }

    if (requiredRole && !hasRole(requiredRole) && !isAdmin()) {
        debugError('ProtectedRoute', 'Role Check Failed', new Error(`Required role: ${requiredRole}`), { path: location.pathname })
        return (
            <div className="flex items-center justify-center min-h-screen page-bg">
                <div className="text-center card !p-10 max-w-md mx-4">
                    <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center text-3xl">🚫</div>
                    <h1 className="text-2xl font-bold text-rose-600 mb-3">Access Denied</h1>
                    <p className="text-slate-600 mb-6">You don't have the required role ({requiredRole}) to access this page.</p>
                    <a href="/" className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">Go back to home</a>
                </div>
            </div>
        )
    }

    debugInfo('ProtectedRoute', 'Access Granted', { path: location.pathname })

    return children
}

export default ProtectedRoute
