import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck, UserCog, Mail, KeyRound } from 'lucide-react'

const Dashboard = () => {
    const { user, isAdmin } = useAuth()

    const statCards = [
        { label: 'Authentication Status', value: '✓ Authenticated', sub: 'Active session', icon: ShieldCheck, iconClass: 'from-emerald-100 to-teal-100 text-emerald-600', valueClass: 'text-emerald-600' },
        { label: 'Role', value: user?.role || 'Unknown', sub: 'Current role', icon: UserCog, iconClass: 'from-rose-100 to-pink-100 text-rose-500', valueClass: 'gradient-text capitalize' },
        { label: 'Email', value: user?.email || 'N/A', sub: 'Registered email', icon: Mail, iconClass: 'from-pink-100 to-rose-100 text-pink-600', valueClass: 'text-pink-600' },
        { label: 'Access Level', value: isAdmin() ? 'Admin' : 'User', sub: 'Permission level', icon: KeyRound, iconClass: 'from-pink-100 to-rose-100 text-pink-700', valueClass: 'gradient-text' },
    ]

    const quickLinks = [
        { to: '/orders', icon: '📦', title: 'Orders', desc: 'Manage all orders', tile: 'from-rose-100 to-pink-100' },
        { to: '/products', icon: '🛍️', title: 'Products', desc: 'Manage products', tile: 'from-emerald-100 to-teal-100' },
        { to: '/pincodes', icon: '📍', title: 'Pincodes', desc: 'Manage pincodes', tile: 'from-pink-100 to-pink-100' },
        { to: '/queries', icon: '❓', title: 'Queries', desc: 'Manage user queries', tile: 'from-amber-100 to-orange-100' },
        { to: '/tracking', icon: '📦', title: 'Tracking', desc: 'Manage order tracking', tile: 'from-pink-100 to-pink-100' },
    ]

    return (
        <div className="min-h-screen page-bg">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Welcome Section */}
                <div className="mb-8 md:mb-12">
                    <span className="section-badge">✨ Dashboard</span>
                    <h1 className="section-title mt-4 mb-2">
                        Welcome, {user?.name || user?.email || 'User'}! <span className="inline-block">👋</span>
                    </h1>
                    <p className="text-slate-600 text-sm md:text-base">
                        Manage your dashboard and access all admin features
                    </p>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                    {statCards.map((c, i) => (
                        <div key={i} className="card card-hover !p-5">
                            <div className="flex items-center gap-4">
                                <div className={`bg-gradient-to-br ${c.iconClass} rounded-xl w-10 h-10 flex items-center justify-center shrink-0`}>
                                    <c.icon size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-slate-500 text-xs font-semibold">{c.label}</p>
                                    <p className={`text-lg font-bold mt-0.5 truncate ${c.valueClass}`}>{c.value}</p>
                                    <p className="text-slate-400 text-[11px] mt-0.5">{c.sub}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Links */}
                {isAdmin() && (
                    <div className="card !p-6 md:!p-8 mb-8">
                        <span className="section-badge">⚡ Quick Access</span>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-3 mb-6 md:mb-8">Admin <span className="gradient-text-animated">Panel</span></h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {quickLinks.map((l, i) => (
                                <Link
                                    key={i}
                                    to={l.to}
                                    className="card card-hover !p-6 flex flex-col items-center justify-center text-center cursor-pointer group"
                                >
                                    <div className={`bg-gradient-to-br ${l.tile} rounded-2xl w-14 h-14 flex items-center justify-center text-2xl mb-3 md:mb-4 transition-transform duration-300 group-hover:scale-110`}>
                                        {l.icon}
                                    </div>
                                    <h3 className="text-lg md:text-xl font-semibold text-slate-900 text-center">{l.title}</h3>
                                    <p className="text-xs md:text-sm text-slate-500 mt-2 text-center">{l.desc}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {!isAdmin() && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 md:p-6 rounded-xl">
                        <h2 className="text-lg font-semibold text-amber-800">Limited Access</h2>
                        <p className="text-amber-700 mt-2 text-sm md:text-base">
                            Your current role ({user?.role}) doesn't have access to admin features. 
                            Contact an administrator for elevated permissions.
                        </p>
                    </div>
                )}

                {/* User Info Section */}
                <div className="mt-8 md:mt-12 card !p-6 md:!p-8">
                    <span className="section-badge">👤 Account</span>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-3 mb-4 md:mb-6">Account <span className="gradient-text">Information</span></h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="bg-gradient-to-br from-slate-50 to-pink-50/50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs md:text-sm text-slate-600 font-semibold mb-1">Email</p>
                            <p className="font-semibold text-slate-800 text-sm md:text-base break-all">{user?.email}</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-pink-50/50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs md:text-sm text-slate-600 font-semibold mb-1">Role</p>
                            <p className="font-semibold text-slate-800 text-sm md:text-base capitalize">{user?.role}</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-rose-50/50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs md:text-sm text-slate-600 font-semibold mb-1">ID</p>
                            <p className="font-semibold text-slate-800 text-sm md:text-base break-all">{user?._id}</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-emerald-50/50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs md:text-sm text-slate-600 font-semibold mb-1">Access Level</p>
                            <p className="font-semibold text-slate-800 text-sm md:text-base">{isAdmin() ? 'Admin' : 'Standard User'}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Dashboard
