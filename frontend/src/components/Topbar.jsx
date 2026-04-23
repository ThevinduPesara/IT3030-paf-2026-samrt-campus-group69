import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { formatDistanceToNow } from 'date-fns'

export default function Topbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [notifs, setNotifs] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showPanel, setShowPanel] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const panelRef = useRef(null)
    const settingsRef = useRef(null)

    const [prefs, setPrefs] = useState({ notifyOnBooking: true, notifyOnTicket: true, notifyOnComment: true })

    useEffect(() => {
        if (user) {
            setPrefs({
                notifyOnBooking: user.notifyOnBooking !== false,
                notifyOnTicket: user.notifyOnTicket !== false,
                notifyOnComment: user.notifyOnComment !== false
            })
        }
    }, [user])

    const togglePref = async (key) => {
        const newPrefs = { ...prefs, [key]: !prefs[key] }
        setPrefs(newPrefs)
        try {
            await api.patch('/auth/me/preferences', newPrefs)
        } catch (e) {
            setPrefs(prefs) // Revert on fail
        }
    }

    useEffect(() => {
        fetchNotifs()
        const interval = setInterval(fetchNotifs, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) setShowPanel(false)
            if (settingsRef.current && !settingsRef.current.contains(event.target)) setShowSettings(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const fetchNotifs = async () => {
        try {
            const [allRes, countRes] = await Promise.all([
                api.get('/notifications'),
                api.get('/notifications/unread-count')
            ])
            setNotifs(allRes.data.slice(0, 5))
            setUnreadCount(countRes.data.count)
        } catch (e) { console.error('Failed to fetch notifications', e) }
    }

    const handleRead = async (id, isRead) => {
        if (isRead) return
        await api.patch(`/notifications/${id}/read`)
        fetchNotifs()
    }

    const markAllRead = async () => {
        await api.patch('/notifications/read-all')
        fetchNotifs()
        setShowPanel(false)
    }

    const handleLogout = async () => {
        try { await api.post('/auth/logout') } catch (e) { }
        logout()
        navigate('/login')
    }

    return (
        <header className="topbar">
            <div className="text-secondary font-semibold">
                Welcome, {user?.name.split(' ')[0]}
            </div>

            <div className="flex items-center gap-3">
                <div className="relative" ref={panelRef}>
                    <button className="notification-bell" onClick={() => setShowPanel(!showPanel)}>
                        🔔
                        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                    </button>

                    {showPanel && (
                        <div className="notif-panel">
                            <div className="notif-header">
                                <strong>Notifications</strong>
                                {unreadCount > 0 && (
                                    <button className="btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
                                )}
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {notifs.length === 0 ? (
                                    <div className="p-4 text-center text-muted">No recent notifications</div>
                                ) : (
                                    notifs.map(n => (
                                        <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => handleRead(n.id, n.read)}>
                                            <div className="notif-title">{n.title}</div>
                                            <div className="notif-msg">{n.message}</div>
                                            <div className="notif-time">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={settingsRef}>
                    <button className="notification-bell ml-1" onClick={() => setShowSettings(!showSettings)}>
                        ⚙️
                    </button>
                    {showSettings && (
                        <div className="notif-panel settings-panel p-4">
                            <h3 className="font-bold text-sm mb-3 border-b border-[var(--border)] pb-2">Notification Preferences</h3>
                            
                            <div className="flex items-center justify-between mb-3 text-sm">
                                <span>📅 Booking Updates</span>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={prefs.notifyOnBooking} onChange={() => togglePref('notifyOnBooking')} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            
                            <div className="flex items-center justify-between mb-3 text-sm">
                                <span>🔧 Ticket Updates</span>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={prefs.notifyOnTicket} onChange={() => togglePref('notifyOnTicket')} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            
                            <div className="flex items-center justify-between mb-1 text-sm">
                                <span>💬 Ticket Comments</span>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={prefs.notifyOnComment} onChange={() => togglePref('notifyOnComment')} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4 ml-2">
                    {user?.picture ? (
                        <img src={user.picture} alt="Avatar" className="w-8 h-8 rounded-full border border-[var(--border)]" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)] text-white flex items-center justify-center font-bold">
                            {user?.name.charAt(0)}
                        </div>
                    )}
                    <div className="flex-col hidden md:flex">
                        <span className="text-sm font-semibold leading-tight">{user?.name}</span>
                        <span className="text-[0.7rem] text-muted">{user?.role}</span>
                    </div>
                    <button onClick={handleLogout} className="btn-ghost btn-sm ml-2">Logout</button>
                </div>
            </div>
        </header>
    )
}
