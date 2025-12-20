import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Plus, Edit, Trash2, Copy, Eye, Mail, Bell, MessageSquare, FileText, ToggleLeft, ToggleRight } from 'lucide-react'

interface Template {
  id: string
  name: string
  type: 'email' | 'push' | 'sms'
  trigger_event: string
  language: string
  is_active: boolean
  subject?: string
  content?: string
  [key: string]: any
}

const templateTypes = [
  { value: 'welcome_email', label: 'Welcome Email', event: 'user_registered' },
  { value: 'email_verification', label: 'Email Verification', event: 'email_verification' },
  { value: 'password_reset', label: 'Password Reset', event: 'password_reset' },
  { value: 'daily_reminder', label: 'Daily Reminder', event: 'daily_reminder' },
  { value: 'session_completed', label: 'Session Completed', event: 'session_completed' },
  { value: 'achievement_unlocked', label: 'Achievement Unlocked', event: 'achievement_unlocked' },
  { value: 'support_ticket_response', label: 'Support Ticket Response', event: 'support_ticket_response' },
  { value: 'craving_support', label: 'Craving Support', event: 'craving_logged' },
  { value: 'inactivity_nudge', label: 'Inactivity Nudge', event: 'user_inactive' },
  { value: 'program_completion', label: 'Program Completion', event: 'program_completed' },
]

export const NotificationTemplates = () => {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')

  // Note: Templates would be in a 'notification_templates' collection
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['notification_templates', typeFilter, languageFilter],
    queryFn: async () => {
      try {
        return await adminCollectionHelpers.getFullList('notification_templates', {
          filter: buildFilter(),
          sort: 'trigger_event',
        })
      } catch (error: any) {
        // If collection doesn't exist, return empty
        return { data: [] }
      }
    },
  })

  const buildFilter = () => {
    const filters: string[] = []
    if (typeFilter !== 'all') {
      filters.push(`type = "${typeFilter}"`)
    }
    if (languageFilter !== 'all') {
      filters.push(`language = "${languageFilter}"`)
    }
    return filters.length > 0 ? filters.join(' && ') : undefined
  }

  const templates = templatesData?.data || []

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return adminCollectionHelpers.update('notification_templates', id, { is_active: isActive })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminCollectionHelpers.delete('notification_templates', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] })
    },
  })

  const handleToggleActive = async (template: Template) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: template.id,
        isActive: !template.is_active,
      })
    } catch (error) {
      console.error('Failed to toggle template status:', error)
      alert('Failed to update template status')
    }
  }

  const handleDelete = async (template: Template) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(template.id)
      } catch (error) {
        console.error('Failed to delete template:', error)
        alert('Failed to delete template')
      }
    }
  }

  const handleDuplicate = async (template: Template) => {
    try {
      const { id, created, updated, ...templateData } = template
      await adminCollectionHelpers.create('notification_templates', {
        ...templateData,
        name: `${template.name} (Copy)`,
        is_active: false,
      })
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] })
    } catch (error) {
      console.error('Failed to duplicate template:', error)
      alert('Failed to duplicate template')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail
      case 'push':
        return Bell
      case 'sms':
        return MessageSquare
      default:
        return FileText
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">Notification Templates</h1>
          <p className="text-neutral-500 mt-1">Manage email, push, and SMS notification templates</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex items-center gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="push">Push</option>
            <option value="sms">SMS</option>
          </select>
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
        </div>
      </div>

      {/* Templates Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <Mail className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No notification templates found</p>
          <p className="text-sm text-neutral-400 mb-4">
            {templatesData === undefined
              ? 'Notification templates collection may need to be created in PocketBase'
              : 'Create your first template to get started'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Template Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Trigger Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Language</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Last Modified</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {(templates as any as Template[]).map((template: Template) => {
                const Icon = getTypeIcon(template.type)
                return (
                  <tr key={template.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 font-medium">{template.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-secondary" />
                        <span className="capitalize">{template.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {template.trigger_event?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{template.language?.toUpperCase() || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(template)}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {template.is_active ? (
                          <ToggleRight className="w-5 h-5 text-success" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-neutral-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {template.updated ? new Date(template.updated).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingTemplate(template)}
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(template)}
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4 text-secondary" />
                        </button>
                        <button
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4 text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDelete(template)}
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
      )}

      {/* Create/Edit Template Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTemplate(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingTemplate(null)
            queryClient.invalidateQueries({ queryKey: ['notification_templates'] })
          }}
        />
      )}
    </div>
  )
}

interface TemplateModalProps {
  template?: Template | null
  onClose: () => void
  onSuccess: () => void
}

const TemplateModal: React.FC<TemplateModalProps> = ({ template, onClose, onSuccess }) => {
  // const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'email',
    trigger_event: template?.trigger_event || 'user_registered',
    language: template?.language || 'en',
    is_active: template?.is_active !== undefined ? template.is_active : true,
    subject: template?.subject || '',
    content: template?.content || '',
    from_name: template?.from_name || 'Quit Hero',
    from_email: template?.from_email || 'noreply@quithero.com',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminCollectionHelpers.create('notification_templates', data)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminCollectionHelpers.update('notification_templates', template!.id, data)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Template name is required')
      return
    }

    setIsSubmitting(true)
    try {
      if (template) {
        await updateMutation.mutateAsync(formData)
      } else {
        await createMutation.mutateAsync(formData)
      }
      onSuccess()
    } catch (error: any) {
      console.error('Failed to save template:', error)
      alert(error?.error || 'Failed to save template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableVariables = [
    '{{user.name}}',
    '{{user.email}}',
    '{{days_smoke_free}}',
    '{{program.title}}',
    '{{achievement.title}}',
    '{{session.day_number}}',
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">{template ? 'Edit Template' : 'Create New Template'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Template Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Event Trigger</label>
              <select
                value={formData.trigger_event}
                onChange={(e) => setFormData({ ...formData, trigger_event: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {templateTypes.map((type) => (
                  <option key={type.value} value={type.event}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
              <div className="flex items-center gap-4">
                {['email', 'push', 'sms'].map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={type}
                      checked={formData.type === type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="text-primary"
                    />
                    <span className="text-sm capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>
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
          </div>

          {formData.type === 'email' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Subject Line <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  placeholder="e.g., Welcome to Quit Hero, {{user.name}}!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email Body</label>
                <div className="mb-2">
                  <p className="text-xs text-neutral-500 mb-1">Available variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableVariables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            content: (formData.content || '') + variable,
                          })
                        }}
                        className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 rounded"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  placeholder="Enter email body HTML or plain text..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">From Name</label>
                  <input
                    type="text"
                    value={formData.from_name}
                    onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">From Email</label>
                  <input
                    type="email"
                    value={formData.from_email}
                    onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </>
          )}

          {formData.type === 'push' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Title <span className="text-danger">*</span>
                  <span className="text-xs text-neutral-500 ml-2">(max 50 chars)</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  maxLength={50}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Body <span className="text-danger">*</span>
                  <span className="text-xs text-neutral-500 ml-2">(max 150 chars)</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  maxLength={150}
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </>
          )}

          {formData.type === 'sms' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Message <span className="text-danger">*</span>
                <span className="text-xs text-neutral-500 ml-2">(max 160 chars)</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                maxLength={160}
                rows={4}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-neutral-300"
            />
            <label htmlFor="is_active" className="text-sm text-neutral-700">
              Active (template will be used for notifications)
            </label>
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
            <button className="btn-secondary">
              Preview
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
