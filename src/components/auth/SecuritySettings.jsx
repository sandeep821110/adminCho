import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

const SecuritySettings = () => {
    const { changePassword, listSessions, revokeSession, revokeAllSessions, logout, user } = useAuth()

    const [activeTab, setActiveTab] = useState('password')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [sessions, setSessions] = useState([])
    const [sessionsLoading, setSessionsLoading] = useState(false)
    const [revokeConfirm, setRevokeConfirm] = useState(null)

    const fetchSessions = useCallback(async () => {
        setSessionsLoading(true)
        try {
            const data = await listSessions()
            setSessions(data || [])
        } catch {
            setMessage({ type: 'error', text: 'Failed to load sessions' })
        } finally {
            setSessionsLoading(false)
        }
    }, [listSessions])

    useEffect(() => {
        if (activeTab === 'sessions') fetchSessions()
    }, [activeTab, fetchSessions])

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
            return
        }
        setLoading(true)
        setMessage({ type: '', text: '' })
        try {
            await changePassword(currentPassword, newPassword)
            setMessage({ type: 'success', text: 'Password changed! Logging out for security...' })
            setCurrentPassword('')
            setNewPassword('')
            setTimeout(() => logout(), 3000)
        } catch (err) {
            setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to change password' })
        } finally {
            setLoading(false)
        }
    }

    const handleRevokeSession = async (jti) => {
        try {
            await revokeSession(jti)
            setSessions(prev => prev.filter(s => s.jti !== jti))
            setRevokeConfirm(null)
        } catch {
            setMessage({ type: 'error', text: 'Failed to revoke session' })
        }
    }

    const handleRevokeAll = async () => {
        try {
            await revokeAllSessions()
            setSessions(prev => prev.filter(s => s.isCurrent))
        } catch {
            setMessage({ type: 'error', text: 'Failed to revoke sessions' })
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('password')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'password' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Change Password
                </button>
                <button
                    onClick={() => setActiveTab('sessions')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'sessions' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Active Sessions
                </button>
            </div>

            {message.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            )}

            {activeTab === 'sessions' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-600">You have {sessions.length} active session{sessions.length !== 1 ? 's' : ''}</p>
                        {sessions.length > 1 && (
                            <button onClick={handleRevokeAll} className="text-sm text-red-600 hover:underline font-medium">Revoke All Others</button>
                        )}
                    </div>

                    {sessionsLoading ? (
                        <div className="text-center py-8 text-gray-400">Loading sessions...</div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No active sessions found</div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map(session => (
                                <div key={session.jti} className={`p-4 rounded-xl border ${session.isCurrent ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {session.device || session.userAgent || 'Unknown Device'}
                                                {session.isCurrent && <span className="ml-2 text-xs text-blue-600">(Current)</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {session.ip || 'Unknown IP'} · {session.expiresIn ? `${Math.round(session.expiresIn / 60)}m left` : 'No expiry'}
                                            </p>
                                        </div>
                                        {!session.isCurrent && (
                                            revokeConfirm === session.jti ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleRevokeSession(session.jti)} className="text-xs bg-red-500 text-white px-3 py-1 rounded font-bold hover:bg-red-600">Confirm</button>
                                                    <button onClick={() => setRevokeConfirm(null)} className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded font-bold hover:bg-gray-400">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setRevokeConfirm(session.jti)} className="text-xs text-red-500 hover:underline font-medium">Revoke</button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-gray-500">{user?.email || ''} · Role: {user?.role || 'user'}</p>
                    </div>
                    <button onClick={() => logout()} className="text-sm text-red-600 hover:underline font-medium">Logout</button>
                </div>
            </div>
        </div>
    )
}

export default SecuritySettings
