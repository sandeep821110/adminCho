import React from 'react'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
            <div className="text-center">
                <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-4">404</h1>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 md:mb-6">Page Not Found</h2>
                <p className="text-gray-600 mb-6 md:mb-8 text-base md:text-lg px-4">The page you're looking for doesn't exist.</p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-sm md:text-base"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition text-sm md:text-base"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    )
}

export default NotFound
