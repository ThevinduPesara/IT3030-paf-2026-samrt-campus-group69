import React, { useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8081/oauth2/authorization/google'
    }

    const handleDevLogin = async (email, role) => {
        setLoading(true)
        try {
            const { data } = await api.post('/auth/dev-login', { email, role })
            login(data.token) // This will trigger the auth context to fetch user profile
            toast.success(`Logged in as ${role}`)
        } catch (e) {
            toast.error('Dev login failed')
        }
        setLoading(false)
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">🏫</div>
                <h1 className="login-title">Smart Campus</h1>
                <p className="login-subtitle">Operations & Maintenance Hub</p>

                <button onClick={handleGoogleLogin} className="google-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                </button>

                <p className="text-muted mt-3 text-sm">
                    Please use your university email to log in.
                </p>

                <div className="mt-8 pt-6 border-t border-[var(--border)]">
                    <p className="text-xs font-bold text-[var(--accent-blue)] uppercase tracking-widest mb-4">Development Bypass</p>
                    <div className="grid grid-2 gap-2">
                        <button 
                            onClick={() => handleDevLogin('thevindupesara@gmail.com', 'ADMIN')} 
                            className="btn btn-secondary btn-sm"
                            disabled={loading}
                        >
                            Login as Admin
                        </button>
                        <button 
                            onClick={() => handleDevLogin('student@smartcampus.edu', 'USER')} 
                            className="btn btn-secondary btn-sm"
                            disabled={loading}
                        >
                            Login as Student
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
