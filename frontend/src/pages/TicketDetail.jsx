import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function TicketDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [ticket, setTicket] = useState(null)
    const [loading, setLoading] = useState(true)
    const [commentContent, setCommentContent] = useState('')
    const [assignTechId, setAssignTechId] = useState('')
    const [technicians, setTechnicians] = useState([])

    const isAgent = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN'
    const isAdmin = user?.role === 'ADMIN'

    useEffect(() => {
        loadTicket()
        if (isAdmin) loadTechnicians()
    }, [])

    const loadTicket = async () => {
        try {
            const { data } = await api.get(`/tickets/${id}`)
            setTicket(data)
        } catch {
            toast.error('Failed to load ticket')
            navigate('/tickets')
        }
        setLoading(false)
    }

    const loadTechnicians = async () => {
        try {
            const { data } = await api.get('/admin/users')
            setTechnicians(data.filter(u => u.role === 'TECHNICIAN'))
        } catch { }
    }

    const handleStatusChange = async (newStatus, note = '') => {
        try {
            if (newStatus === 'REJECTED' && !note) {
                note = prompt('Please provide a rejection reason:')
                if (!note) return
            }
            if (newStatus === 'RESOLVED' && !note) {
                note = prompt('Resolution details:')
                if (!note) return
            }
            await api.patch(`/tickets/${id}/status`, { status: newStatus, note })
            toast.success('Status updated')
            loadTicket()
        } catch { toast.error('Failed to update status') }
    }

    const handleAssign = async () => {
        if (!assignTechId) return
        try {
            await api.patch(`/tickets/${id}/assign`, { technicianId: assignTechId })
            toast.success('Ticket assigned')
            loadTicket()
        } catch { toast.error('Failed to assign ticket') }
    }

    const addComment = async (e) => {
        e.preventDefault()
        if (!commentContent.trim()) return
        try {
            await api.post(`/tickets/${id}/comments`, { content: commentContent })
            setCommentContent('')
            loadTicket()
        } catch { toast.error('Failed to add comment') }
    }

    if (loading) return <div className="spinner m-10"></div>
    if (!ticket) return null

    return (
        <div className="flex gap-4 flex-col lg:flex-row">
            {/* Main Ticket Info */}
            <div className="flex-1 card py-4">
                <div className="flex justify-between border-b border-[var(--border)] pb-4 mb-4">
                    <div>
                        <h1 className="text-xl font-bold">#{ticket.id} - {ticket.category}</h1>
                        <p className="text-secondary text-sm mt-1">Reported by: {ticket.reportedBy.name}</p>
                    </div>
                    <div className="text-right">
                        <span className={`badge badge-${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'green' : ticket.status === 'REJECTED' ? 'red' : 'blue'} mb-1`}>{ticket.status}</span>
                        <div className={`text-xs priority-${ticket.priority.toLowerCase()} font-bold uppercase`}>{ticket.priority} Priority</div>
                    </div>
                </div>

                <div className="mb-6 whitespace-pre-wrap">{ticket.description}</div>

                {ticket.attachments?.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Evidence / Attachments</h3>
                        <div className="flex gap-2 flex-wrap">
                            {ticket.attachments.map(att => (
                                <a key={att.id} href={att.filePath} target="_blank" rel="noreferrer" className="block max-w-[200px] border border-[var(--border)] rounded-md overflow-hidden hover:border-[var(--accent-blue)] transition">
                                    <img src={att.filePath} alt="Evidence" className="w-full h-auto object-cover" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Resolution/Rejection Note if any */}
                {ticket.resolutionNote && (
                    <div className="p-3 bg-[var(--accent-green-light)] border border-green-500/30 rounded-md mb-4 text-green-100">
                        <strong>Resolution:</strong> {ticket.resolutionNote}
                    </div>
                )}
                {ticket.rejectionReason && (
                    <div className="p-3 bg-[var(--accent-red-light)] border border-red-500/30 rounded-md mb-4 text-red-100">
                        <strong>Rejection Reason:</strong> {ticket.rejectionReason}
                    </div>
                )}

                <hr className="divider" />

                <h3 className="font-semibold mb-4 border-b border-[var(--border)] pb-2">Comments</h3>
                <div className="flex flex-col gap-4 mb-6">
                    {ticket.comments.map(c => (
                        <div key={c.id} className={`flex gap-3 ${c.author.id === user?.id ? 'flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] text-xs flex items-center justify-center font-bold">
                                {c.author.name.charAt(0)}
                            </div>
                            <div className={`p-3 rounded-lg max-w-[80%] ${c.author.id === user?.id ? 'bg-[var(--accent-blue-light)]' : 'bg-[var(--bg-input)]'}`}>
                                <div className="flex justify-between items-center gap-4 mb-1">
                                    <span className="text-xs font-semibold">{c.author.name}</span>
                                    <span className="text-[0.65rem] text-muted">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                                </div>
                                <div className="text-sm whitespace-pre-wrap">{c.content}</div>
                            </div>
                        </div>
                    ))}
                    {ticket.comments.length === 0 && <p className="text-muted text-sm text-center">No comments yet.</p>}
                </div>

                {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
                    <form onSubmit={addComment} className="flex gap-2">
                        <input className="form-control" value={commentContent} onChange={e => setCommentContent(e.target.value)} placeholder="Type a comment..." required />
                        <button className="btn btn-primary" type="submit">Send</button>
                    </form>
                )}
            </div>

            {/* Sidebar Info/Actions */}
            <div className="w-full lg:w-72 flex flex-col gap-4">
                <div className="card">
                    <h3 className="font-semibold border-b border-[var(--border)] pb-2 mb-3">Details</h3>
                    <div className="text-sm flex flex-col gap-2 text-secondary">
                        <div><strong className="text-primary">Resource:</strong> {ticket.resource?.name || 'N/A'}</div>
                        <div><strong className="text-primary">Contact:</strong> {ticket.contactDetails || 'N/A'}</div>
                        <div><strong className="text-primary">Created:</strong> {new Date(ticket.createdAt).toLocaleDateString()}</div>
                        <div><strong className="text-primary">Assignee:</strong> {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}</div>
                    </div>
                </div>

                {isAgent && (
                    <div className="card">
                        <h3 className="font-semibold border-b border-[var(--border)] pb-2 mb-3">Agent Actions</h3>

                        {isAdmin && ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
                            <div className="mb-4">
                                <label className="text-xs text-secondary mb-1 block">Assign to Technician</label>
                                <div className="flex gap-1">
                                    <select className="form-control text-sm" value={assignTechId} onChange={e => setAssignTechId(e.target.value)}>
                                        <option value="">Select Tech...</option>
                                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <button className="btn btn-secondary btn-sm" onClick={handleAssign}>Assign</button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            {ticket.status === 'OPEN' && (
                                <>
                                    <button className="btn btn-primary btn-sm justify-center" onClick={() => handleStatusChange('IN_PROGRESS')}>Start Progress</button>
                                    <button className="btn btn-danger btn-sm justify-center" onClick={() => handleStatusChange('REJECTED')}>Reject</button>
                                </>
                            )}
                            {ticket.status === 'IN_PROGRESS' && (
                                <button className="btn btn-success btn-sm justify-center" onClick={() => handleStatusChange('RESOLVED')}>Mark Resolved</button>
                            )}
                            {ticket.status === 'RESOLVED' && isAdmin && (
                                <button className="btn btn-secondary btn-sm justify-center" onClick={() => handleStatusChange('CLOSED')}>Close Ticket</button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
