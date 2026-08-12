import axios from 'axios'
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isTokenExpired } from '../../utils/tokenUtils'

const OTP_LENGTH = 6

const Login = () => {
    const [email, setEmail] = useState('')
    const [showOtpBox, setShowOtpBox] = useState(false)
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [devOtp, setDevOtp] = useState('')
    const [tokenExpiredMessage, setTokenExpiredMessage] = useState('')
    const inputsRef = useRef([])
    const navigate = useNavigate()
    const location = useLocation()
    const { login, isAuthenticated, token } = useAuth()

    if (isAuthenticated && token && !isTokenExpired(token)) {
        return <Navigate to="/" replace />
    }

    useEffect(() => {
        if (location.state?.expired) {
            setTokenExpiredMessage('Your session has expired. Please login again.')
        }
    }, [location.state])

    const sendOtp = async () => {
        if (!email) return setError('Enter your email')
        setError('')
        setDevOtp('')
        try {
            const res = await axios.post('/api/auth/send-otp', { email })
            const otpForTesting = res.data?.otp_for_testing
            if (otpForTesting) {
                setDevOtp(otpForTesting)
            }
            setShowOtpBox(true)
        } catch (err) {
            setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to send OTP')
        }
    }

    const resendOtp = async () => {
        try {
            const res = await axios.post('/api/auth/resend-otp', { email })
            const otpForTesting = res.data?.otp_for_testing
            if (otpForTesting) setDevOtp(otpForTesting)
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to resend OTP')
        }
    }

    const handleChange = (value, index) => {
        if (!/^[0-9]?$/.test(value)) return
        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)
        if (value && index < OTP_LENGTH - 1) inputsRef.current[index + 1].focus()
        if (newOtp.every(d => d !== '')) verifyOtp(newOtp.join(''))
    }

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) inputsRef.current[index - 1].focus()
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, OTP_LENGTH)
        if (!pasted) return
        const newOtp = [...otp]
        pasted.split('').forEach((char, i) => { newOtp[i] = char })
        setOtp(newOtp)
        const next = Math.min(pasted.length, OTP_LENGTH - 1)
        if (inputsRef.current[next]) inputsRef.current[next].focus()
        if (newOtp.every(d => d !== '')) verifyOtp(newOtp.join(''))
    }

    const findValue = (data, ...keys) => {
        for (const key of keys) {
            const val = data[key] || data.data?.[key]
            if (val != null) return val
        }
        return null
    }

    const fetchTokenFromRefresh = async () => {
        try {
            const res = await axios.post(
                '/api/auth/refresh-token',
                {},
                { withCredentials: true, _skipAuth: true }
            )
            return res.data.accessToken || res.data.token || res.data.jwt || res.data.data?.accessToken || res.data.data?.token || null
        } catch {
            return null
        }
    }

    const verifyOtp = async (finalOtp = null) => {
        if (!finalOtp) finalOtp = otp.join('')
        if (finalOtp.length !== OTP_LENGTH) {
            return setError('Enter complete OTP')
        }
        setLoading(true)
        setError('')
        try {
            const res = await axios.post('/api/auth/verify-otp', { email, otp: finalOtp }, { withCredentials: true })
            const data = res.data

            let accessToken = findValue(data, 'accessToken', 'token', 'jwt')
            const user = data.user || data.data?.user
            const userId = user?._id || user?.id || user?.userId || data._id || data.id || data.userId

            localStorage.setItem('otp_verify_response', JSON.stringify(res.data))
            if (email) localStorage.setItem('email', email)
            if (userId) localStorage.setItem('userId', userId)

            if (!accessToken) {
                accessToken = await fetchTokenFromRefresh()
            }

            if (accessToken && user) {
                login(user, accessToken)
                const dest = location.state?.from || '/'
                navigate(dest)
            } else {
                setError('Access token or user data not received from server.')
            }
        } catch (err) {
            setError(err?.response?.data?.error || err?.response?.data?.message || 'OTP verification failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-500 via-pink-600 to-pink-700 px-4 py-8">
            <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl shadow-2xl ring-1 ring-white/40">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/30">📊</div>
                    <h2 className="text-2xl md:text-3xl font-extrabold gradient-text">Admin Sign In</h2>
                </div>

                {tokenExpiredMessage && (
                    <div className="text-sm text-amber-700 mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center font-medium">
                        {tokenExpiredMessage}
                    </div>
                )}

                {error && <div className="text-sm text-rose-700 mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">{error}</div>}

                {devOtp && (
                    <div className="text-sm text-emerald-700 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center font-mono font-bold text-lg tracking-widest">
                        Dev OTP: {devOtp}
                    </div>
                )}

                {!showOtpBox ? (
                    <>
                        <label className="label">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your admin email" className="input mb-4" />
                        <button onClick={sendOtp} className="w-full btn-gradient py-3">Send OTP</button>
                        <p className="text-xs text-slate-500 mt-4 text-center">First time? Use <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-500">POST /api/auth/setup-admin</code> to create admin</p>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-slate-600 mb-4 text-center">Enter OTP sent to <strong>{email}</strong></p>
                        <div className="flex justify-between mt-4 mb-6 gap-1 md:gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    ref={el => (inputsRef.current[index] = el)}
                                    onChange={e => handleChange(e.target.value, index)}
                                    onKeyDown={e => handleKeyDown(e, index)}
                                    onPaste={handlePaste}
                                    className="w-10 h-10 md:w-12 md:h-12 border-2 border-slate-200 text-center text-base md:text-lg rounded-xl focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition shadow-sm focus:outline-none"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>
                        <button onClick={verifyOtp} disabled={loading} className="w-full btn-gradient py-3 mb-2">{loading ? 'Verifying...' : 'Verify OTP'}</button>
                        <button onClick={resendOtp} className="w-full text-pink-600 text-xs md:text-sm underline hover:text-pink-800 font-semibold">Resend OTP</button>
                    </>
                )}
            </div>
        </div>
    )
}

export default Login
