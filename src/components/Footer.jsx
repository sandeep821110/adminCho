import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-slate-950 text-slate-300">
            <div className="bg-gradient-to-r from-rose-500 via-pink-700 to-pink-600 h-1"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📊</span>
                            <h3 className="text-xl font-bold text-white">Admin <span className="gradient-text-animated">Hub</span></h3>
                        </div>
                        <p className="text-slate-400 text-sm">
                            A modern admin dashboard for managing orders, products, and more.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="text-slate-400 hover:text-rose-400 transition">
                                <span className="sr-only">Facebook</span>
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8.29 20v-7.21H5.5V9.25h2.79V7.44c0-2.77 1.69-4.29 4.16-4.29 1.18 0 2.2.09 2.49.13v2.89h-1.71c-1.34 0-1.6.64-1.6 1.57v2.05h3.2l-.41 3.54h-2.79V20H8.29z" />
                                </svg>
                            </a>
                            <a href="#" className="text-slate-400 hover:text-pink-500 transition">
                                <span className="sr-only">Twitter</span>
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7s1.1 5.5-7 9.5" />
                                </svg>
                            </a>
                            <a href="#" className="text-slate-400 hover:text-pink-500 transition">
                                <span className="sr-only">LinkedIn</span>
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                                    <circle cx="4" cy="4" r="2" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-slate-400 hover:text-rose-400 transition">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/orders" className="text-slate-400 hover:text-rose-400 transition">
                                    Orders
                                </Link>
                            </li>
                            <li>
                                <Link to="/products" className="text-slate-400 hover:text-rose-400 transition">
                                    Products
                                </Link>
                            </li>
                            <li>
                                <Link to="/pincodes" className="text-slate-400 hover:text-rose-400 transition">
                                    Pincodes
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Support</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-slate-400 hover:text-rose-400 transition">
                                    Help Center
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-rose-400 transition">
                                    Documentation
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-rose-400 transition">
                                    Report Issue
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-rose-400 transition">
                                    Contact Us
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-slate-400 hover:text-rose-400 transition">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-rose-400 transition">
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-rose-400 transition">
                                    Cookie Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-rose-400 transition">
                                    Security
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Newsletter Section (Mobile Responsive) */}
                <div className="bg-gradient-to-br from-rose-950/80 via-slate-900 to-pink-950/80 border border-white/10 rounded-2xl p-6 mb-8 shadow-xl shadow-pink-950/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-2">Subscribe to Updates</h4>
                            <p className="text-slate-400 text-sm">
                                Get the latest updates and news delivered to your inbox.
                            </p>
                        </div>
                        <form className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/80 text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition"
                            />
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 via-pink-600 to-pink-700 hover:bg-right bg-[length:200%_auto] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/30 whitespace-nowrap"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10"></div>

                {/* Bottom Footer */}
                <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-400 text-sm text-center md:text-left">
                        &copy; {currentYear} Admin Hub. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-slate-400">
                        <a href="#" className="hover:text-rose-400 transition">
                            Privacy
                        </a>
                        <a href="#" className="hover:text-rose-400 transition">
                            Terms
                        </a>
                        <a href="#" className="hover:text-rose-400 transition">
                            Cookies
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
