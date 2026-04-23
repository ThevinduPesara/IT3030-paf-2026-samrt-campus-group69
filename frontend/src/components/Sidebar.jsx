import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'ADMIN'

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-text">Smart Campus</div>
                <div className="logo-sub">Operations Hub</div>
            </div>

            <nav className="sidebar-nav">
                {isAdmin && (
                    <>
                        <div className="nav-section">Management</div>
                        <NavLink to="/dashboard" className="nav-item">Dashboard</NavLink>
                        <NavLink to="/users" className="nav-item">Users</NavLink>
                    </>
                )}

                <div className="nav-section">Facilities</div>
                <NavLink to="/resources" className="nav-item">Catalogue</NavLink>
                <NavLink to="/bookings" className="nav-item">Bookings</NavLink>

                <div className="nav-section">Maintenance</div>
                <NavLink to="/tickets" className="nav-item">Incidents & Tickets</NavLink>
            </nav>
        </aside>
    )
}
