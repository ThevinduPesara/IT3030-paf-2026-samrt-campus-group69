import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Bookings() {
    const { user } = useAuth()
    const [params] = useSearchParams()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const isAdmin = user?.role === 'ADMIN'

    // Booking Form Modal
    const [isModalOpen, setIsModalOpen] = useState(params.get('resourceId') !== null)
    const [resources, setResources] = useState([])
    const [formData, setFormData] = useState({
        resourceId: params.get('resourceId') || '',
        date: '', startTime: '', endTime: '', purpose: '', expectedAttendees: ''
    })

    // Review Modal (Admin)
    const [reviewing, setReviewing] = useState(null)
    const [adminNote, setAdminNote] = useState('')


    useEffect(() => {
        loadBookings()
        if (isModalOpen) loadResources()
    }, [])

    const loadBookings = async () => {
        try {
            const { data } = await api.get('/bookings')
            setBookings(data)
        } catch { toast.error('Failed to load bookings') }
        setLoading(false)
    }

    const loadResources = async () => {
        try {
            const { data } = await api.get('/resources?status=ACTIVE')
            setResources(data)
            if (!formData.resourceId && data.length > 0) {
                setFormData(f => ({ ...f, resourceId: data[0].id }))
            }
        } catch { }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            await api.post('/bookings', formData)
            toast.success('Booking requested successfully!')
            setIsModalOpen(false)
            loadBookings()
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to create booking')
        }
    }

    const updateStatus = async (id, status, note = null) => {
        try {
            await api.patch(`/bookings/${id}/status`, { status, adminNote: note })
            toast.success(`Booking ${status.toLowerCase()}`)
            setReviewing(null)
            loadBookings()
        } catch (e) { toast.error('Failed to update status') }
    }

    const openReview = (b) => {
        setReviewing(b)
        setAdminNote(b.adminNote || '')
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED': return 'badge-green'
            case 'PENDING': return 'badge-yellow'
            case 'REJECTED': return 'badge-red'
            case 'CANCELLED': return 'badge-gray'
            default: return 'badge-gray'
        }
    }

    return (
        <div>
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">{isAdmin ? 'All Bookings' : 'My Bookings'}</h1>
                    <p className="page-subtitle">Manage reservations</p>
                </div>
                {!isAdmin && (
                    <button className="btn btn-primary" onClick={() => { setIsModalOpen(true); loadResources(); }}>
                        + Request Booking
                    </button>
                )}
            </div>
        </div>
    )

}