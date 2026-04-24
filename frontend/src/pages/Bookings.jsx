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

            <div className="card table-wrapper p-0">
                {loading ? (
                    <div className="flex justify-center p-10"><div className="spinner"></div></div>
                ) : bookings.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📅</div>
                        <h3>No bookings yet</h3>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Resource</th>
                                <th>Requester</th>
                                <th>Date & Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(b => (
                                <tr key={b.id}>
                                    <td>
                                        <div className="font-semibold">{b.resource.name}</div>
                                        <div className="text-muted text-xs">{b.resource.type}</div>
                                    </td>
                                    <td>
                                        <div>{b.user.name}</div>
                                        <div className="text-muted text-xs">{b.user.email}</div>
                                    </td>
                                    <td>
                                        <div>{b.date}</div>
                                        <div className="text-muted text-xs">{b.startTime} - {b.endTime}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span>
                                    </td>
                                    <td>
                                        {isAdmin && b.status === 'PENDING' && (
                                            <button className="btn btn-sm btn-primary" onClick={() => openReview(b)}>Review</button>
                                        )}
                                        {(!isAdmin || b.status !== 'PENDING') && (b.status === 'PENDING' || b.status === 'APPROVED') && (
                                            <button className="btn btn-sm btn-danger ml-2" onClick={() => updateStatus(b.id, 'CANCELLED')}>Cancel</button>
                                        )}
                                        {b.adminNote && isAdmin === false && (
                                            <div className="text-xs text-muted mt-1">Note: {b.adminNote}</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Booking Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">New Booking Request</h2>
                            <button className="btn-ghost" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Resource</label>
                                <select required className="form-control" value={formData.resourceId} onChange={e => setFormData({ ...formData, resourceId: e.target.value })}>
                                    <option value="" disabled>Select a resource</option>
                                    {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input type="date" required className="form-control" min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="grid grid-2 gap-2">
                                <div className="form-group">
                                    <label className="form-label">Start Time</label>
                                    <input type="time" required className="form-control" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Time</label>
                                    <input type="time" required className="form-control" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Purpose</label>
                                <input required className="form-control" placeholder="E.g., CS101 Lecture, Project Meeting" value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Request Booking</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Review Modal */}
            {reviewing && (
                <div className="modal-overlay" onClick={() => setReviewing(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Review Booking</h2>
                            <button className="btn-ghost" onClick={() => setReviewing(null)}>✕</button>
                        </div>
                        <div className="mb-4">
                            <p><strong>Resource:</strong> {reviewing.resource.name}</p>
                            <p><strong>By:</strong> {reviewing.user.name}</p>
                            <p><strong>Time:</strong> {reviewing.date} from {reviewing.startTime} to {reviewing.endTime}</p>
                            <p><strong>Purpose:</strong> {reviewing.purpose}</p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Admin Note (Reason)</label>
                            <textarea className="form-control" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Will be visible to user..."></textarea>
                        </div>
                        <div className="flex gap-2 justify-end mt-4">
                            <button className="btn btn-danger" onClick={() => updateStatus(reviewing.id, 'REJECTED', adminNote)}>Reject</button>
                            <button className="btn btn-success" onClick={() => updateStatus(reviewing.id, 'APPROVED', adminNote)}>Approve</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
