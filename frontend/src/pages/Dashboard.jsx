import React, { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Link } from 'react-router-dom'

export default function Dashboard() {
    const [stats, setStats] = useState(null)

    useEffect(() => {
        api.get('/admin/dashboard').then(res => setStats(res.data)).catch(console.error)
    }, [])

    if (!stats) return <div className="spinner m-10"></div>

    const maxBookings = Math.max(...(stats.peakHours?.map(h => h.count) || [1]), 1)
    const maxUsage = Math.max(...(stats.topResources?.map(r => r.count) || [1]), 1)

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Admin Dashboard</h1>
                <p className="page-subtitle">Platform usage & analytics overview</p>
            </div>

            <div className="grid grid-4">
                <div className="stat-card">
                    <div className="stat-icon mb-2">🏢</div>
                    <div className="stat-value">{stats.totalResources}</div>
                    <div className="stat-label">Total Resources</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon mb-2">⏳</div>
                    <div className="stat-value">{stats.pendingBookings}</div>
                    <div className="stat-label">Pending Bookings</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon mb-2">✅</div>
                    <div className="stat-value">{stats.approvedBookings}</div>
                    <div className="stat-label">Approved Bookings</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon mb-2">🔧</div>
                    <div className="stat-value">{stats.openTickets}</div>
                    <div className="stat-label">Open Tickets</div>
                </div>
            </div>

            <div className="analytics-grid">
                <div className="card">
                    <h3 className="card-title mb-6">Top Facilities & Equipment</h3>
                    <div className="resource-usage-list">
                        {stats.topResources?.length > 0 ? stats.topResources.map((res, i) => (
                            <div key={i} className="usage-item">
                                <div className="usage-info">
                                    <span>{res.name}</span>
                                    <span className="font-semibold">{res.count} bookings</span>
                                </div>
                                <div className="progress-bg">
                                    <div className="progress-fill" style={{ width: `${(res.count / maxUsage) * 100}%` }}></div>
                                </div>
                            </div>
                        )) : <p className="text-muted text-sm text-center py-10">No booking data yet</p>}
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-title mb-2">Peak Booking Hours</h3>
                    <p className="text-secondary text-xs mb-4">Distribution of booking start times</p>
                    <div className="peak-hours-chart">
                        {stats.peakHours?.map((h, i) => (
                            <div key={i} className="hour-bar-wrapper">
                                <div 
                                    className="hour-bar" 
                                    data-count={h.count}
                                    style={{ height: `${(h.count / maxBookings) * 100}%` }}
                                ></div>
                                <span className="hour-label">{h.hour}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-2">
                <div className="card">
                    <h3 className="card-title border-b border-[var(--border)] pb-3 mb-3">System Shortcuts</h3>
                    <div className="flex flex-col gap-2">
                        <Link to="/resources" className="btn btn-secondary w-full justify-between">Manage Resources <span>→</span></Link>
                        <Link to="/bookings" className="btn btn-secondary w-full justify-between">Review Bookings <span className="badge badge-yellow">{stats.pendingBookings}</span></Link>
                        <Link to="/tickets" className="btn btn-secondary w-full justify-between">Assign Tickets <span className="badge badge-red">{stats.openTickets}</span></Link>
                        <Link to="/users" className="btn btn-secondary w-full justify-between">User Management <span>👥</span></Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
