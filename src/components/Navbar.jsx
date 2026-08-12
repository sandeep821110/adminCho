import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Orders', path: '/orders', icon: '📦' },
  { label: 'Products', path: '/products', icon: '🏷️' },
  { label: 'Carousel', path: '/carousel', icon: '🎠' },
  { label: 'Pincodes', path: '/pincodes', icon: '📍' },
  { label: 'Queries', path: '/queries', icon: '💬' },
  { label: 'Tracking', path: '/tracking', icon: '🚚' },
  { label: 'Riders', path: '/riders', icon: '🏍️' },
  { label: 'Rider Tracking', path: '/rider-tracking', icon: '🛰️' },
  { label: 'Assign Orders', path: '/rider-assign', icon: '📋' },
  { label: 'Coupons', path: '/coupons', icon: '🎫' },
  { label: 'Payments', path: '/payments', icon: '💳' },
  { label: 'Refunds', path: '/refunds', icon: '↩️' },
  { label: 'Security', path: '/security', icon: '🔒' },
]

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  const isActive = (path) => location.pathname === path

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="shrink-0 bg-gradient-to-r from-rose-500 via-pink-700 to-pink-600 h-1" />
      <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <span className="text-xl font-bold text-white">Admin <span className="gradient-text-animated">Hub</span></span>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white">
          <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          if (item.path !== '/' && item.path !== '/security' && !isAdmin()) return null
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-pink-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {isAuthenticated && (
        <div className="shrink-0 border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-pink-500/30">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || user?.email || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-medium transition"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-rose-500 via-pink-600 to-pink-700 z-40 flex items-center px-4 shadow-lg">
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-white hover:bg-white/10 transition mr-3">
          <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="text-xl">📊</span>
          <span className="font-bold">Admin Hub</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-slate-950 z-30 shadow-2xl shadow-slate-900/40">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      <aside className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-slate-950 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>
    </>
  )
}

export default Navbar
