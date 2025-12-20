import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Plus, Edit, Trash2, UserCheck, UserX, Shield } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface AdminUser {
  id: string
  email: string
  name?: string
  role?: string
  status?: string
  lastLogin?: string
  created?: string
  [key: string]: any
}

export const AdminUsers = () => {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)

  // Note: Admin users would typically be in a separate 'admins' collection
  // Or have a 'role' field in the users collection
  const { data: adminsData, isLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      try {
        // Try to get users with admin roles
        return await adminCollectionHelpers.getFullList('users', {
          filter: 'role != ""',
          sort: '-created',
        })
      } catch (error: any) {
        // If that fails, return empty
        return { data: [] }
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminCollectionHelpers.delete('users', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return adminCollectionHelpers.update('users', id, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] })
    },
  })

  const admins = adminsData?.data || []

  const handleDelete = async (admin: AdminUser) => {
    if (confirm(`Are you sure you want to delete admin "${admin.name || admin.email}"?`)) {
      try {
        await deleteMutation.mutateAsync(admin.id)
      } catch (error) {
        console.error('Failed to delete admin:', error)
        alert('Failed to delete admin')
      }
    }
  }

  const handleToggleStatus = async (admin: AdminUser) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: admin.id,
        status: admin.status === 'active' ? 'inactive' : 'active',
      })
    } catch (error) {
      console.error('Failed to update admin status:', error)
      alert('Failed to update admin status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">Admin Users</h1>
          <p className="text-neutral-500 mt-1">Manage admin accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Admin User
        </button>
      </div>

      {/* Admin Users Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <Shield className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No admin users found</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            Add First Admin
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {(admins as any as AdminUser[]).map((admin: AdminUser) => (
                <tr key={admin.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                        {admin.name?.[0]?.toUpperCase() || admin.email?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-dark">{admin.name || 'No name'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{admin.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded capitalize">
                      {admin.role || 'admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      admin.status === 'active' ? 'bg-success/10 text-success' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {admin.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {admin.lastLogin ? formatDistanceToNow(new Date(admin.lastLogin), { addSuffix: true }) : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingAdmin(admin)}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-primary" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                        title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {admin.status === 'active' ? (
                          <UserX className="w-4 h-4 text-warning" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-success" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(admin)}
                        className="p-2 hover:bg-neutral-100 rounded-lg"
                        title="Delete"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Admin Modal */}
      {(showAddModal || editingAdmin) && (
        <AdminUserModal
          admin={editingAdmin}
          onClose={() => {
            setShowAddModal(false)
            setEditingAdmin(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingAdmin(null)
            queryClient.invalidateQueries({ queryKey: ['admin_users'] })
          }}
        />
      )}
    </div>
  )
}

interface AdminUserModalProps {
  admin?: AdminUser | null
  onClose: () => void
  onSuccess: () => void
}

const AdminUserModal: React.FC<AdminUserModalProps> = ({ admin, onClose, onSuccess }) => {
  // const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    password: '',
    passwordConfirm: '',
    role: admin?.role || 'admin',
    status: admin?.status || 'active',
    sendWelcomeEmail: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { passwordConfirm, sendWelcomeEmail, ...userData } = data
      return adminCollectionHelpers.create('users', {
        ...userData,
        role: data.role,
        emailVisibility: true,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { password, passwordConfirm, sendWelcomeEmail, ...updateData } = data
      if (password) {
        updateData.password = password
        updateData.passwordConfirm = passwordConfirm
      }
      return adminCollectionHelpers.update('users', admin!.id, updateData)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Name and Email are required')
      return
    }
    if (!admin && !formData.password) {
      alert('Password is required for new admins')
      return
    }
    if (formData.password && formData.password !== formData.passwordConfirm) {
      alert('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      if (admin) {
        await updateMutation.mutateAsync(formData)
      } else {
        await createMutation.mutateAsync(formData)
      }
      onSuccess()
    } catch (error: any) {
      console.error('Failed to save admin:', error)
      alert(error?.error || 'Failed to save admin user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{admin ? 'Edit Admin User' : 'Add Admin User'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Name <span className="text-danger">*</span>
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
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          {!admin && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required={!admin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Confirm Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required={!admin}
                />
              </div>
            </>
          )}
          {admin && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="content_manager">Content Manager</option>
              <option value="support_agent">Support Agent</option>
              <option value="analyst">Analyst</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {!admin && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.sendWelcomeEmail}
                onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                className="rounded border-neutral-300"
              />
              <span className="text-sm text-neutral-700">Send Welcome Email</span>
            </label>
          )}
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
              {isSubmitting ? 'Saving...' : admin ? 'Update Admin' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
