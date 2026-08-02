import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Mail,
  Bell,
  MessageSquare,
  FileText,
  Code2,
  Send,
} from 'lucide-react'
import { looksLikeHtml, templatePreviewSrcDoc } from '../../lib/templatePreview'
import { loadAppSettings, saveAppSettings } from '../../lib/appSettings'

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
  { value: 'purchase_success', label: 'Purchase Confirmation', event: 'purchase_success' },
  { value: 'segment_reminder', label: 'Segment Reminder', event: 'segment_reminder' },
  { value: 'promotion', label: 'Promotion', event: 'promotion' },
  { value: 'blog_published', label: 'Blog Published', event: 'blog_published' },
  { value: 'program_completion', label: 'Program Completion', event: 'program_completed' },
  { value: 'custom_html', label: 'Custom (HTML)', event: 'custom' },
]

const TEMPLATE_WRITE_FIELDS = [
  'name',
  'type',
  'trigger_event',
  'language',
  'is_active',
  'subject',
  'content',
  'from_name',
  'from_email',
] as const

function pickTemplateFields(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const key of TEMPLATE_WRITE_FIELDS) {
    if (input[key] !== undefined) out[key] = input[key]
  }
  return out
}

function assertPbOk<T extends { success: boolean; error?: string }>(result: T, fallback: string) {
  if (!result.success) throw new Error(result.error || fallback)
  return result
}

export const NotificationTemplates = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createAsHtml, setCreateAsHtml] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')

  const buildFilter = () => {
    const filters: string[] = []
    if (typeFilter !== 'all') filters.push(`type = "${typeFilter}"`)
    if (languageFilter !== 'all') filters.push(`language = "${languageFilter}"`)
    return filters.length > 0 ? filters.join(' && ') : undefined
  }

  const { data: templatesData, isLoading, isError, error } = useQuery({
    queryKey: ['notification_templates', typeFilter, languageFilter],
    queryFn: async () => {
      const result = await adminCollectionHelpers.getFullList('notification_templates', {
        filter: buildFilter(),
        sort: 'trigger_event',
      })
      if (!result.success) {
        throw new Error(result.error || 'Failed to load notification templates')
      }
      return result
    },
  })

  const templates = (templatesData?.data || []) as unknown as Template[]
  const loadError = isError ? (error as Error)?.message || 'Failed to load templates' : null

  const { data: appSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['app_settings'],
    queryFn: loadAppSettings,
  })
  const emailServiceOn = appSettings?.notifications?.emailNotificationsEnabled !== false

  const emailServiceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const current = await loadAppSettings()
      await saveAppSettings({
        ...current,
        notifications: {
          ...current.notifications,
          emailNotificationsEnabled: enabled,
        },
      })
      return enabled
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_settings'] })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return assertPbOk(
        await adminCollectionHelpers.update('notification_templates', id, { is_active: isActive }),
        'Failed to update template'
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return assertPbOk(
        await adminCollectionHelpers.delete('notification_templates', id),
        'Failed to delete template'
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] })
    },
  })

  const handleToggleEmailTemplate = async (template: Template) => {
    if (template.type !== 'email') return
    try {
      await toggleActiveMutation.mutateAsync({
        id: template.id,
        isActive: !template.is_active,
      })
    } catch (err: any) {
      console.error('Failed to toggle template status:', err)
      alert(err?.message || 'Failed to update template status')
    }
  }

  const handleDelete = async (template: Template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return
    try {
      await deleteMutation.mutateAsync(template.id)
    } catch (err: any) {
      console.error('Failed to delete template:', err)
      alert(err?.message || 'Failed to delete template')
    }
  }

  const handleDuplicate = async (template: Template) => {
    try {
      assertPbOk(
        await adminCollectionHelpers.create(
          'notification_templates',
          pickTemplateFields({
            ...template,
            name: `${template.name} (Copy)`,
            is_active: false,
          })
        ),
        'Failed to duplicate template'
      )
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] })
    } catch (err: any) {
      console.error('Failed to duplicate template:', err)
      alert(err?.message || 'Failed to duplicate template')
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
          <p className="text-neutral-500 mt-1">
            Manage email templates. Activate/deactivate email only — push notifications are separate.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings/send-email')}
            className="btn-secondary flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send bulk email
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateAsHtml(true)
              setShowCreateModal(true)
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Code2 className="w-4 h-4" />
            Create from HTML
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateAsHtml(false)
              setShowCreateModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-dark">Email service</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Turns all product emails on/off. Does not affect push notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded ${
              emailServiceOn ? 'bg-success/10 text-success' : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {settingsLoading ? '…' : emailServiceOn ? 'Active' : 'Inactive'}
          </span>
          {emailServiceOn ? (
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-lg border border-danger text-danger hover:bg-danger/5 disabled:opacity-50"
              disabled={emailServiceMutation.isPending || settingsLoading}
              onClick={() => {
                if (window.confirm('Deactivate all product emails? Push notifications will keep working.')) {
                  emailServiceMutation.mutate(false)
                }
              }}
            >
              Deactivate
            </button>
          ) : (
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-lg border border-success text-success hover:bg-success/5 disabled:opacity-50"
              disabled={emailServiceMutation.isPending || settingsLoading}
              onClick={() => emailServiceMutation.mutate(true)}
            >
              Activate
            </button>
          )}
        </div>
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

      {loadError && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-lg px-4 py-3 text-sm">
          Could not load templates: {loadError}
        </div>
      )}

      {/* Templates Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : loadError ? null : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <Mail className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No notification templates found</p>
          <p className="text-sm text-neutral-400 mb-4">Create your first template to get started</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateAsHtml(true)
                setShowCreateModal(true)
              }}
              className="btn-secondary"
            >
              Create from HTML
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateAsHtml(false)
                setShowCreateModal(true)
              }}
              className="btn-primary"
            >
              Create Template
            </button>
          </div>
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
              {(templates as Template[]).map((template: Template) => {
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
                      {template.type === 'email' ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium ${
                              template.is_active ? 'text-success' : 'text-neutral-400'
                            }`}
                          >
                            {template.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleEmailTemplate(template)}
                            disabled={toggleActiveMutation.isPending || !emailServiceOn}
                            title={
                              !emailServiceOn
                                ? 'Email service is globally deactivated'
                                : template.is_active
                                  ? 'Deactivate this email template'
                                  : 'Activate this email template'
                            }
                            className={`px-2.5 py-1 text-xs rounded-lg border disabled:opacity-40 ${
                              template.is_active
                                ? 'border-danger text-danger hover:bg-danger/5'
                                : 'border-success text-success hover:bg-success/5'
                            }`}
                          >
                            {template.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          {template.type === 'push' ? 'Push (separate)' : '—'}
                        </span>
                      )}
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
                          type="button"
                          onClick={() => setPreviewTemplate(template)}
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
          forceHtmlMode={createAsHtml && !editingTemplate}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTemplate(null)
            setCreateAsHtml(false)
          }}
          onSuccess={(saved) => {
            setShowCreateModal(false)
            setEditingTemplate(null)
            setCreateAsHtml(false)
            queryClient.invalidateQueries({ queryKey: ['notification_templates'] })
            if (saved) setPreviewTemplate(saved)
          }}
        />
      )}

      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <div>
                <h2 className="text-lg font-semibold">Template preview</h2>
                <p className="text-xs text-neutral-500 mt-0.5 capitalize">
                  {previewTemplate.name} · {previewTemplate.type} ·{' '}
                  {previewTemplate.trigger_event}
                </p>
              </div>
              <button type="button" onClick={() => setPreviewTemplate(null)} className="text-neutral-500">
                ✕
              </button>
            </div>
            {previewTemplate.subject ? (
              <p className="px-6 pt-3 text-sm text-neutral-600">
                <span className="font-medium text-neutral-800">Subject:</span> {previewTemplate.subject}
              </p>
            ) : null}
            <div className="p-4 flex-1 min-h-0">
              {previewTemplate.type === 'email' || looksLikeHtml(previewTemplate.content) ? (
                <iframe
                  title="Email template preview"
                  sandbox=""
                  srcDoc={templatePreviewSrcDoc(previewTemplate.content, {
                    title: previewTemplate.name || previewTemplate.subject,
                  })}
                  className="w-full h-[min(70vh,560px)] border border-neutral-200 rounded-lg bg-[#F4FBFF]"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3 max-h-80 overflow-y-auto">
                  {previewTemplate.content || '(empty)'}
                </pre>
              )}
            </div>
            <div className="px-6 py-3 border-t border-neutral-200 flex justify-end">
              <button type="button" className="btn-primary" onClick={() => setPreviewTemplate(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface TemplateModalProps {
  template?: Template | null
  forceHtmlMode?: boolean
  onClose: () => void
  onSuccess: (saved?: Template) => void
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  template,
  forceHtmlMode = false,
  onClose,
  onSuccess,
}) => {
  const initialHtml =
    forceHtmlMode ||
    template?.trigger_event === 'custom' ||
    looksLikeHtml(template?.content)

  const [formData, setFormData] = useState({
    name: template?.name || (forceHtmlMode ? 'Custom HTML template' : ''),
    type: template?.type || 'email',
    trigger_event: template?.trigger_event || (forceHtmlMode ? 'custom' : 'user_registered'),
    language: template?.language || 'en',
    is_active: template?.is_active !== undefined ? template.is_active : true,
    subject: template?.subject || '',
    content: template?.content || '',
    from_name: template?.from_name || 'Smono',
    from_email: template?.from_email || 'support@smono.app',
  })
  const [htmlMode, setHtmlMode] = useState(initialHtml)
  const [showLivePreview, setShowLivePreview] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return assertPbOk(
        await adminCollectionHelpers.create('notification_templates', pickTemplateFields(data)),
        'Failed to create template'
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return assertPbOk(
        await adminCollectionHelpers.update(
          'notification_templates',
          template!.id,
          pickTemplateFields(data)
        ),
        'Failed to update template'
      )
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Template name is required')
      return
    }
    if (formData.type === 'email' && !formData.subject.trim()) {
      alert('Subject is required for email templates')
      return
    }
    if (!formData.content.trim()) {
      alert('Template body is required')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        trigger_event: htmlMode && formData.trigger_event === 'user_registered' && forceHtmlMode
          ? 'custom'
          : formData.trigger_event,
      }
      const result = template
        ? await updateMutation.mutateAsync(payload)
        : await createMutation.mutateAsync(payload)
      const saved = (result as { data?: Template }).data
      onSuccess(
        saved
          ? { ...formData, ...saved, id: saved.id || template?.id || '' }
          : ({ ...formData, id: template?.id || 'new' } as Template)
      )
    } catch (err: any) {
      console.error('Failed to save template:', err)
      alert(err?.message || 'Failed to save template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableVariables = [
    '{{user.name}}',
    '{{user.email}}',
    '{{quote}}',
    '{{day}}',
    '{{days_smoke_free}}',
    '{{program.title}}',
    '{{achievement.title}}',
    '{{session.day_number}}',
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">
            {template ? 'Edit Template' : htmlMode ? 'Create HTML Template' : 'Create New Template'}
          </h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <option key={type.value} value={type.event}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
              <div className="flex items-center gap-4">
                {['email', 'push', 'sms'].map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={type}
                      checked={formData.type === type}
                      onChange={(e) => {
                        const next = e.target.value as 'email' | 'push' | 'sms'
                        setFormData({ ...formData, type: next })
                        if (next !== 'email') setHtmlMode(false)
                      }}
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
                  placeholder="e.g., Welcome to Smono, {{user.name}}!"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHtmlMode(true)}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      htmlMode
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-neutral-200 text-neutral-600'
                    }`}
                  >
                    Paste HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setHtmlMode(false)}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      !htmlMode
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-neutral-200 text-neutral-600'
                    }`}
                  >
                    Plain text
                  </button>
                </div>
                <label className="flex items-center gap-2 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    checked={showLivePreview}
                    onChange={(e) => setShowLivePreview(e.target.checked)}
                    className="rounded border-neutral-300"
                  />
                  Live preview
                </label>
              </div>

              <div className={showLivePreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {htmlMode ? 'HTML code' : 'Email body'}
                  </label>
                  {!htmlMode && (
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
                  )}
                  {htmlMode && (
                    <p className="text-xs text-neutral-500 mb-2">
                      Paste a full HTML email (or a fragment). Variables like{' '}
                      <code className="bg-neutral-100 px-1 rounded">{'{{user.name}}'}</code> are kept as-is.
                    </p>
                  )}
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={htmlMode ? 18 : 12}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    placeholder={
                      htmlMode
                        ? '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello {{user.name}}</h1>\n</body>\n</html>'
                        : 'Enter email body…'
                    }
                    required
                  />
                </div>
                {showLivePreview && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      How it looks
                    </label>
                    <iframe
                      title="Live email preview"
                      sandbox=""
                      srcDoc={templatePreviewSrcDoc(formData.content, {
                        title: formData.name || formData.subject,
                      })}
                      className="w-full h-[420px] border border-neutral-200 rounded-lg bg-[#F4FBFF]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {formData.type === 'email'
                ? 'Active (this email template can send)'
                : 'Active'}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : template ? 'Update & preview' : 'Create & preview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
