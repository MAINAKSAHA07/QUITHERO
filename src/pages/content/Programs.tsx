import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Plus, Edit, Eye, Trash2, Copy, ToggleLeft, ToggleRight, Search, Filter, Grid, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

interface Program {
  id: string
  title: string
  description?: string
  language?: string
  duration_days?: number
  is_active?: boolean
  order?: number
  created?: string
  updated?: string
  [key: string]: any
}

export const Programs = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)

  const { data: programsData, isLoading } = useQuery({
    queryKey: ['programs', searchQuery, languageFilter, statusFilter],
    queryFn: () => adminCollectionHelpers.getFullList('programs', {
      filter: buildFilter(),
      sort: 'order',
    }),
  })

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return adminCollectionHelpers.update('programs', id, { is_active: isActive })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await adminCollectionHelpers.delete('programs', id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete program')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      queryClient.invalidateQueries({ queryKey: ['program_days'] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  const buildFilter = () => {
    const filters: string[] = []
    if (searchQuery) {
      filters.push(`title ~ "${searchQuery}" || description ~ "${searchQuery}"`)
    }
    if (languageFilter !== 'all') {
      filters.push(`language = "${languageFilter}"`)
    }
    if (statusFilter !== 'all') {
      filters.push(`is_active = ${statusFilter === 'active' ? 'true' : 'false'}`)
    }
    return filters.length > 0 ? filters.join(' && ') : undefined
  }

  const programs = programsData?.data || []
  const sessions = sessionsData?.data || []

  const getProgramStats = (programId: string) => {
    const programSessions = sessions.filter((s: any) => s.program === programId)
    
    // Count unique users enrolled (in case there are duplicate sessions)
    const uniqueUsers = new Set(programSessions.map((s: any) => s.user))
    const enrolled = uniqueUsers.size
    
    // Count completed sessions (status = 'completed')
    const completed = programSessions.filter((s: any) => s.status === 'completed').length
    
    // Count active sessions (in_progress)
    const active = programSessions.filter((s: any) => s.status === 'in_progress').length
    
    // Count not started
    const notStarted = programSessions.filter((s: any) => s.status === 'not_started').length
    
    // Calculate completion rate based on enrolled users
    const completionRate = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0
    
    return { 
      enrolled, 
      completed, 
      active,
      notStarted,
      completionRate,
      totalSessions: programSessions.length, // Total session records (may include duplicates)
    }
  }

  const handleToggleActive = async (program: Program) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: program.id,
        isActive: !program.is_active,
      })
    } catch (error) {
      console.error('Failed to toggle program status:', error)
      alert('Failed to update program status')
    }
  }

  const handleDelete = async (program: Program) => {
    const stats = getProgramStats(program.id)
    
    // Check for enrolled users
    if (stats.enrolled > 0) {
      alert(`Cannot delete program "${program.title}". ${stats.enrolled} user(s) are currently enrolled in this program. Please reassign or remove users before deleting.`)
      return
    }

    // Check for program days
    try {
      const { data: programDays } = await adminCollectionHelpers.getFullList('program_days', {
        filter: `program = "${program.id}"`,
      })
      
      if (programDays && programDays.length > 0) {
        const confirmMessage = `This program has ${programDays.length} day(s) associated with it. Deleting will also remove all program days and their steps. Are you sure you want to delete "${program.title}"? This action cannot be undone.`
        if (!confirm(confirmMessage)) {
          return
        }
      } else {
        if (!confirm(`Are you sure you want to delete "${program.title}"? This action cannot be undone.`)) {
          return
        }
      }

      // Attempt deletion
      try {
        const result = await deleteMutation.mutateAsync(program.id)
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete program')
        }
        // Success is handled by onSuccess callback
      } catch (error: any) {
        console.error('Failed to delete program:', error)
        const errorMessage = error?.error || error?.message || error?.response?.message || 'Failed to delete program'
        
        // Provide more specific error messages
        if (errorMessage.includes('superuser') || errorMessage.includes('Only superusers')) {
          alert(`Permission Error: Only superusers can delete programs. The delete permission for admin_users may not be configured correctly. Please run: node PocketBase/fix-program-permissions.js`)
        } else if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
          alert(`Cannot delete program. It may have related data that prevents deletion. Error: ${errorMessage}`)
        } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || errorMessage.includes('403')) {
          alert(`Permission Error: You do not have permission to delete programs. Please ensure your admin user has the correct permissions. Error: ${errorMessage}`)
        } else {
          alert(`Failed to delete program: ${errorMessage}`)
        }
      }
    } catch (error: any) {
      console.error('Error checking program days:', error)
      // If we can't check program days, still try to delete but warn user
      if (!confirm(`Warning: Could not verify related data. Are you sure you want to delete "${program.title}"? This action cannot be undone.`)) {
        return
      }
      
      try {
        await deleteMutation.mutateAsync(program.id)
      } catch (deleteError: any) {
        console.error('Failed to delete program:', deleteError)
        alert(`Failed to delete program: ${deleteError?.error || deleteError?.message || 'Unknown error'}`)
      }
    }
  }

  const handleDuplicate = async (program: Program) => {
    try {
      const { id, created, updated, ...programData } = program
      await adminCollectionHelpers.create('programs', {
        ...programData,
        title: `${program.title} (Copy)`,
        is_active: false,
      })
      queryClient.invalidateQueries({ queryKey: ['programs'] })
    } catch (error) {
      console.error('Failed to duplicate program:', error)
      alert('Failed to duplicate program')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-dark">Programs</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-neutral-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-primary text-white' : 'text-neutral-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded ${viewMode === 'card' ? 'bg-primary text-white' : 'text-neutral-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Program
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="hi">Hindi</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Programs List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : programs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <p className="text-neutral-500 mb-4">No programs found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create First Program
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Program Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Language</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Enrolled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Completion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {programs.map((program: Program) => {
                const stats = getProgramStats(program.id)
                return (
                  <tr key={program.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-neutral-dark">{program.title}</p>
                        {program.description && (
                          <p className="text-sm text-neutral-500 mt-1 line-clamp-1">{program.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs bg-neutral-100 rounded">
                        {program.language?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{program.duration_days || 10} days</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(program)}
                        className="flex items-center gap-2"
                        disabled={toggleActiveMutation.isPending}
                      >
                        {program.is_active ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-success" />
                            <span className="text-sm text-success">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-neutral-400" />
                            <span className="text-sm text-neutral-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{stats.enrolled}</span>
                        <span className="text-xs text-neutral-500">
                          {stats.active > 0 && `${stats.active} active`}
                          {stats.active > 0 && stats.completed > 0 && ' • '}
                          {stats.completed > 0 && `${stats.completed} completed`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-neutral-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-success h-2 rounded-full"
                            style={{ width: `${stats.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{stats.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {program.created ? formatDistanceToNow(new Date(program.created), { addSuffix: true }) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/content/programs/${program.id}/days`)}
                          className="btn-secondary text-sm flex items-center gap-2"
                          title="Manage Program Days"
                        >
                          <Eye className="w-4 h-4" />
                          Manage Days
                        </button>
                        <button
                          onClick={() => setEditingProgram(program)}
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(program)}
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4 text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDelete(program)}
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                          title="Delete"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program: Program) => {
            const stats = getProgramStats(program.id)
            return (
              <div key={program.id} className="bg-white rounded-lg shadow-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-dark mb-1">{program.title}</h3>
                    {program.description && (
                      <p className="text-sm text-neutral-500 line-clamp-2">{program.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActive(program)}
                    disabled={toggleActiveMutation.isPending}
                  >
                    {program.is_active ? (
                      <ToggleRight className="w-5 h-5 text-success" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-neutral-400" />
                    )}
                  </button>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Language</span>
                    <span className="font-medium">{program.language?.toUpperCase() || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Duration</span>
                    <span className="font-medium">{program.duration_days || 10} days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Enrolled</span>
                    <span className="font-medium">{stats.enrolled} users</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Active</span>
                    <span className="font-medium text-primary">{stats.active} users</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Completed</span>
                    <span className="font-medium text-success">{stats.completed} users</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Completion Rate</span>
                    <span className="font-medium">{stats.completionRate}%</span>
                  </div>
                  <div className="bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-success h-2 rounded-full"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-neutral-200">
                  <button
                    onClick={() => navigate(`/content/programs/${program.id}/days`)}
                    className="btn-secondary flex-1 text-sm"
                  >
                    View Days
                  </button>
                  <button
                    onClick={() => setEditingProgram(program)}
                    className="btn-primary flex-1 text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Program Modal */}
      {(showCreateModal || editingProgram) && (
        <CreateEditProgramModal
          program={editingProgram}
          onClose={() => {
            setShowCreateModal(false)
            setEditingProgram(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingProgram(null)
            queryClient.invalidateQueries({ queryKey: ['programs'] })
          }}
        />
      )}
    </div>
  )
}

// Create/Edit Program Modal Component
interface CreateEditProgramModalProps {
  program?: Program | null
  onClose: () => void
  onSuccess: () => void
}

const CreateEditProgramModal: React.FC<CreateEditProgramModalProps> = ({ program, onClose, onSuccess }) => {
  const isEditing = !!program
  const [formData, setFormData] = useState({
    title: program?.title || '',
    description: program?.description || '',
    language: program?.language || 'en',
    duration_days: program?.duration_days || 10,
    is_active: program?.is_active ?? true,
    order: program?.order || 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Ensure required defaults
      const payload = {
        description: '',
        is_active: true,
        duration_days: 10,
        order: 0,
        ...data,
      }
      // PocketBase requires language; ensure string
      if (!payload.language) payload.language = 'en'
      return adminCollectionHelpers.create('programs', payload)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!program) throw new Error('No program to update')
      return adminCollectionHelpers.update('programs', program.id, data)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Title is required')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(formData)
      } else {
        await createMutation.mutateAsync(formData)
      }
      onSuccess()
    } catch (error: any) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} program:`, error)
      alert(error?.error || `Failed to ${isEditing ? 'update' : 'create'} program`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isEditing ? 'Edit Program' : 'Create New Program'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Duration (days)</label>
              <input
                type="number"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                min={1}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-neutral-300"
              />
              <span className="text-sm text-neutral-700">Active</span>
            </label>
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Program' : 'Create Program')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
