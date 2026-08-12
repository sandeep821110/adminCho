import React from 'react'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-pink-50 px-4">
            <div className="text-center">
                <h1 className="text-7xl md:text-8xl font-extrabold gradient-text mb-4">404</h1>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 md:mb-6">Page Not Found</h2>
                <p className="text-slate-600 mb-6 md:mb-8 text-base md:text-lg px-4">The page you're looking for doesn't exist.</p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 btn-gradient text-sm md:text-base"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 btn-dark text-sm md:text-base"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    )
}

export default NotFound
