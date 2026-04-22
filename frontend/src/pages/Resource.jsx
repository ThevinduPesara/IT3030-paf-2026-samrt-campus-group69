import React, { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Resources() {
    const { user } = useAuth()
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState({ type: '', status: '' })
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [formData, setFormData] = useState({
        name: '', type: 'LECTURE_HALL', capacity: 0, location: '', description: '', status: 'ACTIVE'
    })

    useEffect(() => { loadResources() }, [filter])

    const loadResources = async () => {
        try {
            const { data } = await api.get('/resources', { params: filter })
            setResources(data)
        } catch (e) {
            toast.error('Failed to load resources')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editing) {
                await api.put(`/resources/${editing.id}`, formData)
                toast.success('Resource updated')
            } else {
                await api.post('/resources', formData)
                toast.success('Resource created')
            }
            setIsModalOpen(false)
            loadResources()
        } catch (e) {
            toast.error('Failed to save resource')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this resource?')) return
        try {
            await api.delete(`/resources/${id}`)
            toast.success('Resource deactivated')
            loadResources()
        } catch (e) {
            toast.error('Failed to delete resource')
        }
    }

    const openEdit = (res) => {
        setEditing(res)
        setFormData(res)
        setIsModalOpen(true)
    }

    const openCreate = () => {
        setEditing(null)
        setFormData({ name: '', type: 'LECTURE_HALL', capacity: 0, location: '', description: '', status: 'ACTIVE' })
        setIsModalOpen(true)
    }

    const handleBook = (res) => {
        window.location.href = `/bookings?resourceId=${res.id}`
    }

    return (
        <div>
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Facilities & Equipment</h1>
                    <p className="page-subtitle">Browse and book resources</p>
                </div>
                {user?.role === 'ADMIN' && (
                    <button className="btn btn-primary" onClick={openCreate}>+ Add Resource</button>
                )}
            </div>

            <div className="filter-bar">
                <select className="form-control w-auto" value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
                    <option value="">All Types</option>
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="LAB">Lab</option>
                    <option value="MEETING_ROOM">Meeting Room</option>
                    <option value="EQUIPMENT">Equipment</option>
                </select>
                <select className="form-control w-auto" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><div className="spinner"></div></div>
            ) : resources.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🏢</div>
                    <h3 className="empty-title">No resources found</h3>
                    <p>Try adjusting your filters or add a new resource.</p>
                </div>
            ) : (
                <div className="grid grid-auto">
                    {resources.map(res => (
                        <div key={res.id} className="resource-card">
                            <div className="flex justify-between items-start mb-2">
                                <div className="resource-icon">
                                    {res.type === 'EQUIPMENT' ? '💻' : res.type === 'LAB' ? '🔬' : '🏛️'}
                                </div>
                                <span className={`badge ${res.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                                    {res.status}
                                </span>
                            </div>
                            <h3 className="resource-name">{res.name}</h3>
                            <p className="text-muted text-sm mb-3">{res.description}</p>

                            <div className="resource-meta">
                                <span>📍 {res.location}</span>
                                {res.capacity > 0 && <span>👥 {res.capacity} people</span>}
                                <span>🔖 {res.type.replace('_', ' ')}</span>
                            </div>

                            <div className="mt-4 flex gap-2 pt-3 border-t border-[var(--border)]">
                                {res.status === 'ACTIVE' && (
                                    <button className="btn btn-primary flex-1 justify-center" onClick={() => handleBook(res)}>
                                        Book Now
                                    </button>
                                )}
                                {user?.role === 'ADMIN' && (
                                    <>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(res)}>Edit</button>
                                        {res.status === 'ACTIVE' && (
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(res.id)}>Del</button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editing ? 'Edit Resource' : 'Add New Resource'}</h2>
                            <button className="btn-ghost" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input required className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-2 gap-2">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-control" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="LECTURE_HALL">Lecture Hall</option>
                                        <option value="LAB">Lab</option>
                                        <option value="MEETING_ROOM">Meeting Room</option>
                                        <option value="EQUIPMENT">Equipment</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Capacity</label>
                                    <input type="number" className="form-control" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input required className="form-control" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-control" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="ACTIVE">Active</option>
                                    <option value="OUT_OF_SERVICE">Out of Service</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Resource</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
