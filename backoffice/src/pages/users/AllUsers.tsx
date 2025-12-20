import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Plus, Download, Search, Eye, Edit, Trash2, Mail, UserCheck, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  RowSelectionState,
} from '@tanstack/react-table'

interface User {
  id: string
  email: string
  name?: string
  created?: string
  updated?: string
  lastActive?: string
  [key: string]: any
}

export const AllUsers = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [programStatusFilter, setProgramStatusFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [showBulkActions, setShowBulkActions] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, perPage, statusFilter, searchQuery],
    queryFn: () => adminCollectionHelpers.getList('users', page, perPage, {
      filter: searchQuery ? `email ~ "${searchQuery}" || name ~ "${searchQuery}"` : undefined,
      sort: '-created',
    }),
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return adminCollectionHelpers.delete('users', userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const users = (data?.data && 'items' in data.data ? (data.data as any).items : []) || []
  const totalPages = (data?.data && 'totalPages' in data.data ? (data.data as any).totalPages : 1) || 1
  const totalItems = (data?.data && 'totalItems' in data.data ? (data.data as any).totalItems : 0) || 0

  const selectedUsers = useMemo(() => {
    return Object.keys(rowSelection)
      .filter(key => rowSelection[key])
      .map(key => users[parseInt(key)])
      .filter(Boolean)
  }, [rowSelection, users])

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUserMutation.mutateAsync(userId)
      } catch (error) {
        console.error('Failed to delete user:', error)
        alert('Failed to delete user. Please try again.')
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
      try {
        await Promise.all(selectedUsers.map(user => deleteUserMutation.mutateAsync(user.id)))
        setRowSelection({})
        setShowBulkActions(false)
      } catch (error) {
        console.error('Failed to delete users:', error)
        alert('Failed to delete some users. Please try again.')
      }
    }
  }

  const handleExportCSV = () => {
    // Generate CSV
    const headers = ['Name', 'Email', 'User ID', 'Registered', 'Last Active', 'Status']
    const rows = users.map((user: User) => [
      user.name || '',
      user.email,
      user.id,
      user.created ? new Date(user.created).toLocaleDateString() : '',
      user.lastActive ? new Date(user.lastActive).toLocaleDateString() : '',
      'Active',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="rounded border-neutral-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-neutral-300"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-primary"
          >
            Name
            <span className="text-xs">
              {column.getIsSorted() === 'asc' ? '↑' : column.getIsSorted() === 'desc' ? '↓' : '↕'}
            </span>
          </button>
        ),
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium text-neutral-dark">{user.name || 'No name'}</p>
                <p className="text-sm text-neutral-500">{user.email}</p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'id',
        header: 'User ID',
        cell: ({ row }) => (
          <code className="text-xs bg-neutral-100 px-2 py-1 rounded font-mono cursor-pointer hover:bg-neutral-200"
            onClick={() => {
              navigator.clipboard.writeText(row.original.id)
            }}
            title="Click to copy">
            {row.original.id.slice(0, 8)}...
          </code>
        ),
      },
      {
        accessorKey: 'created',
        header: 'Registered',
        cell: ({ row }) => {
          const date = row.original.created
          return date ? new Date(date).toLocaleDateString() : '-'
        },
      },
      {
        accessorKey: 'lastActive',
        header: 'Last Active',
        cell: ({ row }) => {
          const date = row.original.lastActive
          if (!date) return <span className="text-neutral-400">Never</span>
          const lastActive = new Date(date)
          const now = new Date()
          const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays === 0) return <span className="text-success">Today</span>
          if (diffDays === 1) return <span className="text-success">Yesterday</span>
          if (diffDays < 7) return <span>{diffDays} days ago</span>
          return <span className="text-neutral-500">{new Date(date).toLocaleDateString()}</span>
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const user = row.original
          const lastActive = user.lastActive ? new Date(user.lastActive) : null
          const isActive = lastActive && (new Date().getTime() - lastActive.getTime()) < 7 * 24 * 60 * 60 * 1000
          
          return (
            <span className={`px-2 py-1 text-xs rounded ${
              isActive ? 'bg-success/10 text-success' : 'bg-neutral-200 text-neutral-600'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/users/${user.id}`)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="View Profile"
              >
                <Eye className="w-4 h-4 text-secondary" />
              </button>
              <button
                onClick={() => navigate(`/users/${user.id}`)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Edit User"
              >
                <Edit className="w-4 h-4 text-primary" />
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Delete User"
                disabled={deleteUserMutation.isPending}
              >
                <Trash2 className="w-4 h-4 text-danger" />
              </button>
            </div>
          )
        },
      },
    ],
    [navigate, deleteUserMutation]
  )

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
  })

  useEffect(() => {
    if (selectedUsers.length > 0) {
      setShowBulkActions(true)
    } else {
      setShowBulkActions(false)
    }
  }, [selectedUsers.length])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-dark">All Users</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => navigate('/users/add')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Send Notification
            </button>
            <button className="btn-secondary text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Activate
            </button>
            <button className="btn-secondary text-sm flex items-center gap-2">
              <UserX className="w-4 h-4" />
              Deactivate
            </button>
            <button 
              onClick={handleBulkDelete}
              className="btn-danger text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button 
              onClick={() => setRowSelection({})}
              className="text-sm text-neutral-600 hover:text-neutral-800"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
          <select
            value={programStatusFilter}
            onChange={(e) => {
              setProgramStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Programs</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={languageFilter}
            onChange={(e) => {
              setLanguageFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="hi">Hindi</option>
          </select>
          <button 
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
              setProgramStatusFilter('all')
              setLanguageFilter('all')
              setPage(1)
            }}
            className="text-sm text-neutral-600 hover:text-neutral-800"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-500 mb-4">No users found</p>
            <button
              onClick={() => navigate('/users/add')}
              className="btn-primary"
            >
              Add First User
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-neutral-50 transition-colors ${
                        row.getIsSelected() ? 'bg-primary/5' : ''
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
          <p className="text-sm text-neutral-500">
                  Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, totalItems)} of {totalItems} users
                </p>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value))
                    setPage(1)
                  }}
                  className="px-3 py-1 border border-neutral-200 rounded-lg text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
                  className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {page} of {totalPages}
            </span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const newPage = Math.max(1, Math.min(totalPages, Number(e.target.value)))
                    setPage(newPage)
                  }}
                  className="w-16 px-2 py-1 border border-neutral-200 rounded-lg text-sm text-center"
                />
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
                  className="px-3 py-1 border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              Next
            </button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}
