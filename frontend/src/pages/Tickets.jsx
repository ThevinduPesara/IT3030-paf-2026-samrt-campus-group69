import React, { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Tickets() {
    const { user } = useAuth()
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const isAgent = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN'

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [ticketForm, setTicketForm] = useState({ category: '', description: '', priority: 'LOW', contactDetails: '' })
    const [files, setFiles] = useState([])

    useEffect(() => { loadTickets() }, [])

    const loadTickets = async () => {
        try {
            const { data } = await api.get('/tickets')
            setTickets(data)
        } catch { toast.error('Failed to load tickets') }
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (files.length > 3) { toast.error('Max 3 images allowed'); return }

        const formData = new FormData()
        formData.append('category', ticketForm.category)
        formData.append('description', ticketForm.description)
        formData.append('priority', ticketForm.priority)
        formData.append('contactDetails', ticketForm.contactDetails)
        files.forEach(file => formData.append('files', file))

        try {
            await api.post('/tickets', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            toast.success('Ticket submitted successfully')
            setIsModalOpen(false)
            loadTickets()
        } catch (err) { toast.error('Ticket creation failed') }
    }

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files))
    }

    const changeStatus = async (id, status) => {
        try {
            await api.patch(`/tickets/${id}/status`, { status, note: '' })
            toast.success(`Ticket marked as ${status}`)
            loadTickets()
        } catch { toast.error('Failed to update status') }
    }

    return (
        <div>
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">{isAgent ? 'Support Tickets' : 'My Issues'}</h1>
                    <p className="page-subtitle">Report and track incidents</p>
                </div>
                {!isAgent && (
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Report Issue</button>
                )}
            </div>

            <div className="grid grid-auto">
                {loading ? <div className="spinner mt-4"></div> : tickets.length === 0 ? (
                    <div className="empty-state w-full col-span-full">No tickets found.</div>
                ) : tickets.map(t => (
                    <div key={t.id} className="card">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`badge badge-${t.status === 'RESOLVED' ? 'green' : t.status === 'OPEN' ? 'blue' : 'yellow'}`}>{t.status}</span>
                            <span className={`text-xs priority-${t.priority.toLowerCase()} font-bold`}>{t.priority}</span>
                        </div>
                        <h3 className="card-title mt-1">#{t.id} - {t.category}</h3>
                        <p className="text-muted text-sm my-2 line-clamp-2">{t.description}</p>
                        <div className="text-xs text-muted">Reported by: {t.reportedBy.name}</div>

                        <div className="mt-4 pt-3 border-t border-[var(--border)] flex gap-2">
                            <button className="btn btn-secondary btn-sm flex-1" onClick={() => window.location.href = `/tickets/${t.id}`}>View Details</button>
                            {isAgent && t.status === 'OPEN' && (
                                <button className="btn btn-primary btn-sm" onClick={() => changeStatus(t.id, 'IN_PROGRESS')}>Start</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Report New Issue</h2>
                            <button className="btn-ghost" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <input required className="form-control" value={ticketForm.category} onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })} placeholder="E.g. Broken Projector" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea required className="form-control" value={ticketForm.description} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} placeholder="Detailed description of the issue..."></textarea>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select className="form-control" value={ticketForm.priority} onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Image Evidence (Max 3)</label>
                                <input type="file" multiple accept="image/*" className="form-control" onChange={handleFileChange} />
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
