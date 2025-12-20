import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Plus, Eye, EyeOff, Copy, Key, Globe } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  created: string
  last_used?: string
  expires_at?: string
  status: 'active' | 'revoked'
  [key: string]: any
}

interface Webhook {
  id: string
  url: string
  events: string[]
  status: 'active' | 'inactive'
  secret?: string
  [key: string]: any
}

export const ApiKeys = () => {
  const queryClient = useQueryClient()
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())

  // Note: API keys and webhooks would be in 'api_keys' and 'webhooks' collections
  const { data: apiKeysData, isLoading: keysLoading } = useQuery({
    queryKey: ['api_keys'],
    queryFn: async () => {
      try {
        return await adminCollectionHelpers.getFullList('api_keys', {
          sort: '-created',
        })
      } catch {
        return { data: [] }
      }
    },
  })

  const { data: webhooksData, isLoading: webhooksLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      try {
        return await adminCollectionHelpers.getFullList('webhooks', {
          sort: '-created',
        })
      } catch {
        return { data: [] }
      }
    },
  })

  const apiKeys = apiKeysData?.data || []
  const webhooks = webhooksData?.data || []

  const toggleReveal = (keyId: string) => {
    const newRevealed = new Set(revealedKeys)
    if (newRevealed.has(keyId)) {
      newRevealed.delete(keyId)
    } else {
      newRevealed.add(keyId)
    }
    setRevealedKeys(newRevealed)
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    alert('API key copied to clipboard!')
  }

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminCollectionHelpers.delete('api_keys', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] })
    },
  })

  const revokeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminCollectionHelpers.update('api_keys', id, { status: 'revoked' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] })
    },
  })

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminCollectionHelpers.delete('webhooks', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-dark">API Keys & Webhooks</h1>

      {/* API Keys Section */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">API Keys</h2>
            <p className="text-sm text-neutral-500 mt-1">Manage API keys for external integrations</p>
          </div>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        </div>

        {keysLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 mb-4">No API keys created yet</p>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="btn-primary"
            >
              Create First API Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Key Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Last Used</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {(apiKeys as any as ApiKey[]).map((apiKey: ApiKey) => {
                  const isRevealed = revealedKeys.has(apiKey.id)
                  const maskedKey = apiKey.key ? `${apiKey.key.slice(0, 8)}...${apiKey.key.slice(-4)}` : 'N/A'
                  return (
                    <tr key={apiKey.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 font-medium">{apiKey.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-neutral-100 px-2 py-1 rounded font-mono">
                            {isRevealed ? apiKey.key : maskedKey}
                          </code>
                          <button
                            onClick={() => toggleReveal(apiKey.id)}
                            className="p-1 hover:bg-neutral-100 rounded"
                            title={isRevealed ? 'Hide' : 'Reveal'}
                          >
                            {isRevealed ? (
                              <EyeOff className="w-4 h-4 text-neutral-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-neutral-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyKey(apiKey.key)}
                            className="p-1 hover:bg-neutral-100 rounded"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4 text-neutral-400" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">
                        {apiKey.created ? new Date(apiKey.created).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">
                        {apiKey.last_used ? new Date(apiKey.last_used).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          apiKey.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                          {apiKey.status === 'active' ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {apiKey.status === 'active' && (
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to revoke this API key?')) {
                                  revokeKeyMutation.mutate(apiKey.id)
                                }
                              }}
                              className="text-xs text-warning hover:underline"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this API key?')) {
                                deleteKeyMutation.mutate(apiKey.id)
                              }
                            }}
                            className="text-xs text-danger hover:underline"
                          >
                            Delete
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
      </div>

      {/* Webhooks Section */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Webhooks</h2>
            <p className="text-sm text-neutral-500 mt-1">Configure webhooks for real-time event notifications</p>
          </div>
          <button
            onClick={() => setShowWebhookModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Webhook
          </button>
        </div>

        {webhooksLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8">
            <Globe className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 mb-4">No webhooks configured</p>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="btn-primary"
            >
              Add First Webhook
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {(webhooks as any as Webhook[]).map((webhook: Webhook) => (
              <div key={webhook.id} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-sm bg-neutral-100 px-2 py-1 rounded font-mono">
                        {webhook.url}
                      </code>
                      <span className={`px-2 py-1 text-xs rounded ${
                        webhook.status === 'active' ? 'bg-success/10 text-success' : 'bg-neutral-200 text-neutral-600'
                      }`}>
                        {webhook.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events?.map((event: string) => (
                        <span key={event} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                          {event.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary text-sm">Test</button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this webhook?')) {
                          deleteWebhookMutation.mutate(webhook.id)
                        }
                      }}
                      className="btn-danger text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showApiKeyModal && (
        <CreateApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onSuccess={(newKey) => {
            setShowApiKeyModal(false)
            queryClient.invalidateQueries({ queryKey: ['api_keys'] })
            alert(`API Key created! Make sure to copy it: ${newKey.key}`)
          }}
        />
      )}

      {/* Create Webhook Modal */}
      {showWebhookModal && (
        <CreateWebhookModal
          onClose={() => setShowWebhookModal(false)}
          onSuccess={() => {
            setShowWebhookModal(false)
            queryClient.invalidateQueries({ queryKey: ['webhooks'] })
          }}
        />
      )}
    </div>
  )
}

interface CreateApiKeyModalProps {
  onClose: () => void
  onSuccess: (key: ApiKey) => void
}

const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[],
    expires_at: '',
  })
  const [generatedKey, setGeneratedKey] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const permissionOptions = [
    'users.read', 'users.write',
    'programs.read', 'programs.write',
    'sessions.read', 'sessions.write',
    'analytics.read',
  ]

  const generateKey = () => {
    // Generate a random API key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = 'qh_'
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return key
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Key name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const newKey = generateKey()
      // In a real implementation, save to PocketBase
      const apiKey: ApiKey = {
        id: Date.now().toString(),
        name: formData.name,
        key: newKey,
        permissions: formData.permissions,
        created: new Date().toISOString(),
        status: 'active',
        expires_at: formData.expires_at || undefined,
      }
      setGeneratedKey(newKey)
      onSuccess(apiKey)
    } catch (error: any) {
      console.error('Failed to create API key:', error)
      alert('Failed to create API key')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create API Key</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Key Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              placeholder="e.g., Production API Key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Permissions</label>
            <div className="space-y-2 border border-neutral-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              {permissionOptions.map((perm) => (
                <label key={perm} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(perm)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, permissions: [...formData.permissions, perm] })
                      } else {
                        setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm) })
                      }
                    }}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-sm text-neutral-700">{perm}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {generatedKey && (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm font-medium text-warning mb-2">⚠️ Save this key now - you won't be able to view it again!</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded font-mono text-sm">
                  {generatedKey}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyKey(generatedKey)}
                  className="btn-secondary text-sm"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              {generatedKey ? 'Close' : 'Cancel'}
            </button>
            {!generatedKey && (
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Generating...' : 'Generate Key'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

interface CreateWebhookModalProps {
  onClose: () => void
  onSuccess: () => void
}

const CreateWebhookModal: React.FC<CreateWebhookModalProps> = ({ onClose, onSuccess }) => {
  // const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
    secret: '',
    status: 'active' as 'active' | 'inactive',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const eventOptions = [
    'user_registered',
    'user_completed_program',
    'achievement_unlocked',
    'support_ticket_created',
    'session_completed',
    'craving_logged',
  ]

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminCollectionHelpers.create('webhooks', data)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.url.trim()) {
      alert('Webhook URL is required')
      return
    }
    if (formData.events.length === 0) {
      alert('Select at least one event')
      return
    }

    setIsSubmitting(true)
    try {
      await createMutation.mutateAsync(formData)
      onSuccess()
    } catch (error: any) {
      console.error('Failed to create webhook:', error)
      alert(error?.error || 'Failed to create webhook')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add Webhook</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Webhook URL <span className="text-danger">*</span>
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              placeholder="https://example.com/webhook"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Events <span className="text-danger">*</span>
            </label>
            <div className="space-y-2 border border-neutral-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              {eventOptions.map((event) => (
                <label key={event} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, events: [...formData.events, event] })
                      } else {
                        setFormData({ ...formData, events: formData.events.filter(e => e !== event) })
                      }
                    }}
                    className="rounded border-neutral-300"
                  />
                  <span className="text-sm text-neutral-700 capitalize">
                    {event.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Secret (for signature verification)</label>
            <input
              type="password"
              value={formData.secret}
              onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              placeholder="Enter secret key..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="webhook_active"
              checked={formData.status === 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
              className="rounded border-neutral-300"
            />
            <label htmlFor="webhook_active" className="text-sm text-neutral-700">
              Active
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
            <button className="btn-secondary" type="button">
              Test Webhook
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Webhook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Helper function for copying
const handleCopyKey = (key: string) => {
  navigator.clipboard.writeText(key)
  alert('Copied to clipboard!')
}
