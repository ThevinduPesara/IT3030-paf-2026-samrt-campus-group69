import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import OAuthCallback from './pages/OAuthCallback'

import Resources from './pages/Resources'
import Bookings from './pages/Bookings'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster position="top-right" toastOptions={{ style: { background: '#1f2a40', color: '#fff' } }} />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/oauth2/callback" element={<OAuthCallback />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Navigate to="/resources" replace />} />
                            <Route path="/resources" element={<Resources />} />
                            <Route path="/bookings" element={<Bookings />} />
                            <Route path="/tickets" element={<Tickets />} />
                            <Route path="/tickets/:id" element={<TicketDetail />} />

                            <Route element={<ProtectedRoute requireAdmin={true} />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/users" element={<Users />} />
                            </Route>
                        </Route>
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}
