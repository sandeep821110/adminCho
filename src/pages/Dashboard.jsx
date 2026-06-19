import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
    const { user, isAdmin } = useAuth()

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Welcome Section */}
                <div className="mb-8 md:mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        Welcome, {user?.name || user?.email || 'User'}! 👋
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base">
                        Manage your dashboard and access all admin features
                    </p>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
                        <p className="text-gray-600 text-xs md:text-sm font-semibold">Authentication Status</p>
                        <p className="text-xl md:text-2xl font-bold text-green-600 mt-2">✓ Authenticated</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-purple-500 hover:shadow-lg transition">
                        <p className="text-gray-600 text-xs md:text-sm font-semibold">Role</p>
                        <p className="text-xl md:text-2xl font-bold text-purple-600 mt-2 capitalize">{user?.role || 'Unknown'}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-green-500 hover:shadow-lg transition">
                        <p className="text-gray-600 text-xs md:text-sm font-semibold">Email</p>
                        <p className="text-lg md:text-xl font-bold text-green-600 mt-2 truncate text-xs md:text-base">{user?.email || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-orange-500 hover:shadow-lg transition">
                        <p className="text-gray-600 text-xs md:text-sm font-semibold">Access Level</p>
                        <p className="text-xl md:text-2xl font-bold text-orange-600 mt-2">{isAdmin() ? 'Admin' : 'User'}</p>
                    </div>
                </div>

                {/* Navigation Links */}
                {isAdmin() && (
                    <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">Admin Panel - Quick Access</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            <Link
                                to="/orders"
                                className="flex flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg hover:shadow-lg transition cursor-pointer text-white transform hover:scale-105 duration-200"
                            >
                                <div className="text-4xl md:text-5xl mb-3 md:mb-4">📦</div>
                                <h3 className="text-lg md:text-xl font-semibold text-center">Orders</h3>
                                <p className="text-xs md:text-sm text-blue-100 mt-2 text-center">Manage all orders</p>
                            </Link>

                            <Link
                                to="/products"
                                className="flex flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg hover:shadow-lg transition cursor-pointer text-white transform hover:scale-105 duration-200"
                            >
                                <div className="text-4xl md:text-5xl mb-3 md:mb-4">🛍️</div>
                                <h3 className="text-lg md:text-xl font-semibold text-center">Products</h3>
                                <p className="text-xs md:text-sm text-green-100 mt-2 text-center">Manage products</p>
                            </Link>

                            <Link
                                to="/pincodes"
                                className="flex flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg hover:shadow-lg transition cursor-pointer text-white transform hover:scale-105 duration-200"
                            >
                                <div className="text-4xl md:text-5xl mb-3 md:mb-4">📍</div>
                                <h3 className="text-lg md:text-xl font-semibold text-center">Pincodes</h3>
                                <p className="text-xs md:text-sm text-purple-100 mt-2 text-center">Manage pincodes</p>
                            </Link>

                            <Link
                                to="/queries"
                                className="flex flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg hover:shadow-lg transition cursor-pointer text-white transform hover:scale-105 duration-200"
                            >
                                <div className="text-4xl md:text-5xl mb-3 md:mb-4">❓</div>
                                <h3 className="text-lg md:text-xl font-semibold text-center">Queries</h3>
                                <p className="text-xs md:text-sm text-orange-100 mt-2 text-center">Manage user queries</p>
                            </Link>

                            <Link
                                to="/tracking"
                                className="flex flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg hover:shadow-lg transition cursor-pointer text-white transform hover:scale-105 duration-200"
                            >
                                <div className="text-4xl md:text-5xl mb-3 md:mb-4">📦</div>
                                <h3 className="text-lg md:text-xl font-semibold text-center">Tracking</h3>
                                <p className="text-xs md:text-sm text-teal-100 mt-2 text-center">Manage order tracking</p>
                            </Link>
                        </div>
                    </div>
                )}

                {!isAdmin() && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 md:p-6 rounded">
                        <h2 className="text-lg font-semibold text-yellow-800">Limited Access</h2>
                        <p className="text-yellow-700 mt-2 text-sm md:text-base">
                            Your current role ({user?.role}) doesn't have access to admin features. 
                            Contact an administrator for elevated permissions.
                        </p>
                    </div>
                )}

                {/* User Info Section */}
                <div className="mt-8 md:mt-12 bg-white rounded-lg shadow-md p-6 md:p-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Account Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600 font-semibold mb-1">Email</p>
                            <p className="font-semibold text-gray-800 text-sm md:text-base break-all">{user?.email}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600 font-semibold mb-1">Role</p>
                            <p className="font-semibold text-gray-800 text-sm md:text-base capitalize">{user?.role}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600 font-semibold mb-1">ID</p>
                            <p className="font-semibold text-gray-800 text-sm md:text-base break-all">{user?._id}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-xs md:text-sm text-gray-600 font-semibold mb-1">Access Level</p>
                            <p className="font-semibold text-gray-800 text-sm md:text-base">{isAdmin() ? 'Admin' : 'Standard User'}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Dashboard
