import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Edit, Shield, CheckCircle } from 'lucide-react'

interface Role {
  id: string
  name: string
  description?: string
  permissions: Record<string, boolean>
  admin_count?: number
  [key: string]: any
}

const permissionModules = {
  dashboard: ['View Dashboard'],
  users: ['View Users', 'Create Users', 'Edit Users', 'Delete Users', 'Export Users', 'View User Details', 'Send Messages to Users'],
  content: ['View Programs', 'Create Programs', 'Edit Programs', 'Delete Programs', 'Publish Content', 'View Media Library', 'Upload to Media Library'],
  support: ['View Support Tickets', 'Respond to Tickets', 'Close Tickets', 'Delete Tickets'],
  analytics: ['View Analytics', 'Export Reports', 'Create Custom Reports'],
  settings: ['View Settings', 'Edit Settings', 'Manage Admins', 'View Audit Logs'],
}

const predefinedRoles: Role[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full access to all features',
    permissions: Object.values(permissionModules).flat().reduce((acc, perm) => {
      acc[perm] = true
      return acc
    }, {} as Record<string, boolean>),
    admin_count: 0,
  },
  {
    id: 'content_manager',
    name: 'Content Manager',
    description: 'Manage programs, articles, and media',
    permissions: {
      'View Dashboard': true,
      'View Programs': true,
      'Create Programs': true,
      'Edit Programs': true,
      'Delete Programs': true,
      'Publish Content': true,
      'View Media Library': true,
      'Upload to Media Library': true,
      'View Settings': true,
    },
    admin_count: 0,
  },
  {
    id: 'support_agent',
    name: 'Support Agent',
    description: 'Manage tickets and view users',
    permissions: {
      'View Dashboard': true,
      'View Users': true,
      'View User Details': true,
      'Send Messages to Users': true,
      'View Support Tickets': true,
      'Respond to Tickets': true,
      'Close Tickets': true,
    },
    admin_count: 0,
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'View-only analytics and export reports',
    permissions: {
      'View Dashboard': true,
      'View Analytics': true,
      'Export Reports': true,
    },
    admin_count: 0,
  },
]

export const RolesPermissions = () => {
  // const queryClient = useQueryClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  // Note: Roles would be in a 'roles' collection
  // For now, we'll use predefined roles
  const [roles, setRoles] = useState<Role[]>(predefinedRoles)

  const { data: adminsData } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      try {
        return await adminCollectionHelpers.getFullList('users', {
          filter: 'role != ""',
        })
      } catch {
        return { data: [] }
      }
    },
  })

  const admins = adminsData?.data || []

  // Calculate admin count for each role
  const rolesWithCounts = roles.map(role => ({
    ...role,
    admin_count: admins.filter((a: any) => a.role === role.id).length,
  }))

  const handleSavePermissions = async (role: Role) => {
    try {
      // In a real implementation, save to PocketBase
      setRoles(roles.map(r => r.id === role.id ? role : r))
      setShowEditModal(false)
      setEditingRole(null)
      alert('Permissions updated successfully!')
    } catch (error) {
      console.error('Failed to save permissions:', error)
      alert('Failed to save permissions')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">Roles & Permissions</h1>
          <p className="text-neutral-500 mt-1">Define granular permissions for each role</p>
        </div>
      </div>

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rolesWithCounts.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-dark">{role.name}</h3>
                  <p className="text-sm text-neutral-500">{role.description}</p>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-500">Admins with this role</span>
                <span className="text-2xl font-bold text-neutral-dark">{role.admin_count || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Total Permissions</span>
                <span className="font-medium">
                  {Object.values(role.permissions).filter(Boolean).length} / {Object.values(permissionModules).flat().length}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingRole(role)
                setShowEditModal(true)
              }}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Permissions
            </button>
          </div>
        ))}
      </div>

      {/* Edit Permissions Modal */}
      {showEditModal && editingRole && (
        <EditPermissionsModal
          role={editingRole}
          onClose={() => {
            setShowEditModal(false)
            setEditingRole(null)
          }}
          onSave={(updatedRole) => {
            handleSavePermissions(updatedRole)
          }}
        />
      )}
    </div>
  )
}

interface EditPermissionsModalProps {
  role: Role
  onClose: () => void
  onSave: (role: Role) => void
}

const EditPermissionsModal: React.FC<EditPermissionsModalProps> = ({ role, onClose, onSave }) => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>(role.permissions)

  const handleTogglePermission = (permission: string) => {
    setPermissions({
      ...permissions,
      [permission]: !permissions[permission],
    })
  }

  const handleSave = () => {
    onSave({
      ...role,
      permissions,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Edit Permissions: {role.name}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-6">
          {Object.entries(permissionModules).map(([module, modulePermissions]) => (
            <div key={module} className="border-b border-neutral-200 pb-4">
              <h3 className="font-semibold text-neutral-dark mb-3 capitalize">{module}</h3>
              <div className="space-y-2">
                {modulePermissions.map((permission) => (
                  <label key={permission} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={permissions[permission] || false}
                      onChange={() => handleTogglePermission(permission)}
                      className="rounded border-neutral-300"
                    />
                    <span className="text-sm text-neutral-700">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Save Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
