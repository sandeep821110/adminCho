import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

const SecuritySettings = () => {
    const { listSessions, revokeSession, revokeAllSessions, logout, user } = useAuth()

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
        fetchSessions()
    }, [fetchSessions])

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
        <div className="p-4 sm:p-6 md:p-8">
            <div className="max-w-2xl mx-auto space-y-4">
                <div>
                    <span className="section-badge">🔒 Security</span>
                    <h2 className="section-title mt-3">Security <span className="gradient-text-animated">Settings</span></h2>
                </div>
                <div className="card !p-6">
                {message.text && (
                    <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {message.text}
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-slate-600">You have <span className="font-semibold text-pink-600">{sessions.length}</span> active session{sessions.length !== 1 ? 's' : ''}</p>
                        {sessions.length > 1 && (
                            <button onClick={handleRevokeAll} className="text-sm text-rose-600 hover:underline font-medium">Revoke All Others</button>
                        )}
                    </div>

                    {sessionsLoading ? (
                        <div className="text-center py-8 text-slate-400">Loading sessions...</div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">No active sessions found</div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map(session => (
                                <div key={session.jti} className={`p-4 rounded-xl border transition-all duration-300 ${session.isCurrent ? 'border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                {session.device || session.userAgent || 'Unknown Device'}
                                                {session.isCurrent && <span className="ml-2 text-xs font-semibold text-pink-600">(Current)</span>}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {session.ip || 'Unknown IP'} · {session.expiresIn ? `${Math.round(session.expiresIn / 60)}m left` : 'No expiry'}
                                            </p>
                                        </div>
                                        {!session.isCurrent && (
                                            revokeConfirm === session.jti ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleRevokeSession(session.jti)} className="text-xs bg-rose-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-rose-700 transition">Confirm</button>
                                                    <button onClick={() => setRevokeConfirm(null)} className="text-xs bg-slate-300 text-slate-700 px-3 py-1 rounded-lg font-bold hover:bg-slate-400 transition">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setRevokeConfirm(session.jti)} className="text-xs text-rose-600 hover:underline font-medium">Revoke</button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-900">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-slate-500">{user?.email || ''} · Role: {user?.role || 'user'}</p>
                        </div>
                        <button onClick={() => logout()} className="text-sm text-rose-600 hover:underline font-medium">Logout</button>
                    </div>
                </div>
                </div>
            </div>
        </div>
    )
}

export default SecuritySettings
