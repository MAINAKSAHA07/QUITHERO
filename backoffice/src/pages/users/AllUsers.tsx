import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers, recentSort } from '../../lib/pocketbase'
import { deleteUserAndRelated } from '../../lib/deleteUser'
import { getUserLastActive, isUserActiveWithinDays, daysSinceLastActive } from '../../lib/userActivity'
import { fetchActivityByUser } from '../../lib/fetchActivityByUser'
import {
  isSegmentId,
  SEGMENT_IDS,
  SEGMENT_LABELS,
  segmentNeedsActivity,
  userMatchesSegment,
  type SegmentId,
} from '../../lib/userSegments'
import { Plus, Download, Search, Eye, Edit, Trash2, Bell, UserCheck, UserX, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { sendUserPushNotification } from '../../lib/sendPush'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  RowSelectionState,
} from '@tanstack/react-table'

function escapeFilterValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

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
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const segmentParam = searchParams.get('segment')
  const segmentFilter: SegmentId | null = isSegmentId(segmentParam) ? segmentParam : null

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [notifyTitle, setNotifyTitle] = useState('A note from smono')
  const [notifyBody, setNotifyBody] = useState('Open the app to continue your quit journey.')
  const [notifyBusy, setNotifyBusy] = useState(false)
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null)

  // Client filters need the full user set (pagination alone can't filter correctly)
  const needsClientFilter =
    Boolean(segmentFilter) || statusFilter === 'active' || statusFilter === 'inactive'
  const useFullList = needsClientFilter

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users', useFullList ? 'full' : 'page', page, perPage, searchQuery, segmentFilter],
    queryFn: async (): Promise<{
      success: boolean
      data: User[]
      totalItems: number
      totalPages: number
      error?: string
    }> => {
      const filter = searchQuery
        ? `email ~ "${escapeFilterValue(searchQuery)}" || name ~ "${escapeFilterValue(searchQuery)}"`
        : undefined
      const opts = {
        filter,
        sort: recentSort('users'),
        fields: 'id,email,name,created,updated,lastActive',
      }
      if (useFullList) {
        const result = await adminCollectionHelpers.getFullList('users', opts)
        if (!result.success) {
          return { success: false, data: [], totalItems: 0, totalPages: 1, error: result.error }
        }
        const items = result.data as User[]
        return { success: true, data: items, totalItems: items.length, totalPages: 1 }
      }
      const result = await adminCollectionHelpers.getList('users', page, perPage, opts)
      if (!result.success) {
        return {
          success: false,
          data: [],
          totalItems: 0,
          totalPages: 1,
          error: result.error,
        }
      }
      return {
        success: true,
        data: result.data.items as User[],
        totalItems: result.data.totalItems,
        totalPages: result.data.totalPages,
      }
    },
  })

  const needsEngagement =
    segmentFilter === 'high-risk' || segmentFilter === 'star-performers'

  const { data: sessionsData, isFetched: sessionsFetched } = useQuery({
    queryKey: ['sessions', 'segment-filter'],
    queryFn: () => adminCollectionHelpers.getFullList('user_sessions'),
    enabled: needsEngagement,
  })

  const { data: cravingsData, isFetched: cravingsFetched } = useQuery({
    queryKey: ['cravings', 'segment-filter'],
    queryFn: () => adminCollectionHelpers.getFullList('cravings'),
    enabled: needsEngagement,
  })

  const {
    data: activityByUser = new Map<string, number>(),
    isFetched: activityFetched,
    isLoading: activityLoading,
  } = useQuery({
    queryKey: ['activity-by-user'],
    queryFn: fetchActivityByUser,
    staleTime: 60_000,
    // Maps don't survive RQ structural sharing reliably
    structuralSharing: false,
  })

  const activityReady = (() => {
    const needs =
      (segmentFilter != null && segmentNeedsActivity(segmentFilter)) ||
      statusFilter === 'active' ||
      statusFilter === 'inactive'
    return !needs || (activityFetched && !activityLoading)
  })()

  const engagementReady =
    !needsEngagement || (sessionsFetched && cravingsFetched)

  const filtersReady = activityReady && engagementReady

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await deleteUserAndRelated(userId)
      if (!result.success) throw new Error(result.error || 'Failed to delete user')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const usersRaw: User[] = data?.data ?? []

  const filteredUsers = useMemo(() => {
    if (!filtersReady) return []
    let list = usersRaw

    if (segmentFilter) {
      const sessions = (sessionsData?.data || []) as { user?: string; status?: string }[]
      const cravings = (cravingsData?.data || []) as { user?: string; type?: string }[]
      list = list.filter((user) =>
        userMatchesSegment(user, segmentFilter, {
          activityByUser,
          sessions,
          cravings,
        })
      )
    } else if (statusFilter === 'active' || statusFilter === 'inactive') {
      list = list.filter((user) => {
        const isActive = isUserActiveWithinDays(user, activityByUser, 7)
        return statusFilter === 'active' ? isActive : !isActive
      })
    }

    return list
  }, [
    usersRaw,
    segmentFilter,
    statusFilter,
    activityByUser,
    sessionsData?.data,
    cravingsData?.data,
    filtersReady,
  ])

  const totalItems = useFullList ? filteredUsers.length : data?.totalItems ?? 0
  const totalPages = useFullList
    ? Math.max(1, Math.ceil(filteredUsers.length / perPage))
    : Math.max(1, data?.totalPages ?? 1)

  const users = useMemo(() => {
    if (!useFullList) return filteredUsers
    const start = (page - 1) * perPage
    return filteredUsers.slice(start, start + perPage)
  }, [filteredUsers, useFullList, page, perPage])

  const fetchError =
    data?.success === false ? data.error : isError ? (error as Error)?.message : null

  const setSegmentInUrl = (next: SegmentId | '') => {
    const params = new URLSearchParams(searchParams)
    if (next) params.set('segment', next)
    else params.delete('segment')
    setSearchParams(params, { replace: true })
  }

  useEffect(() => {
    setPage(1)
    setRowSelection({})
  }, [segmentFilter, searchQuery, statusFilter])

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
      } catch (error: any) {
        console.error('Failed to delete user:', error)
        alert(error?.message || 'Failed to delete user. Please try again.')
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

  const handleBulkNotify = async () => {
    if (selectedUsers.length === 0) return
    if (!notifyTitle.trim() || !notifyBody.trim()) {
      setNotifyMsg('Title and body are required')
      return
    }
    setNotifyBusy(true)
    setNotifyMsg(null)
    let ok = 0
    let failed = 0
    const errors: string[] = []
    for (const user of selectedUsers) {
      const result = await sendUserPushNotification({
        userId: user.id,
        title: notifyTitle.trim(),
        body: notifyBody.trim(),
        url: '/home',
        tag: 'admin-broadcast',
      })
      if (result.ok) ok += 1
      else {
        failed += 1
        if (errors.length < 3) errors.push(`${user.email || user.id}: ${result.error}`)
      }
    }
    setNotifyBusy(false)
    setNotifyMsg(
      `Sent to ${ok} user${ok === 1 ? '' : 's'}${failed ? `, ${failed} failed` : ''}${
        errors.length ? ` — ${errors.join('; ')}` : ''
      }`
    )
    if (failed === 0) {
      setTimeout(() => {
        setShowNotifyModal(false)
        setNotifyMsg(null)
      }, 1200)
    }
  }

  const handleExportCSV = () => {
    // Generate CSV
    const headers = ['Name', 'Email', 'User ID', 'Registered', 'Last Active', 'Status']
    const rows = (useFullList ? filteredUsers : users).map((user: User) => {
      const isActive = isUserActiveWithinDays(user, activityByUser, 7)
      const last = getUserLastActive(user, activityByUser.get(user.id))
      return [
        user.name || '',
        user.email,
        user.id,
        user.created ? new Date(user.created).toLocaleDateString() : '',
        last ? last.toLocaleDateString() : 'Never',
        isActive ? 'Active' : 'Inactive',
      ]
    })

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
          <button
            type="button"
            className="text-xs bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded font-mono text-neutral-700 max-w-[9rem] truncate"
            onClick={() => navigator.clipboard.writeText(row.original.id)}
            title={`Click to copy ${row.original.id}`}
          >
            {row.original.id}
          </button>
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
          const last = getUserLastActive(row.original, activityByUser.get(row.original.id))
          if (!last) return <span className="text-neutral-400">Never</span>
          const diffDays = daysSinceLastActive(row.original, activityByUser)
          if (diffDays === 0) return <span className="text-success">Today</span>
          if (diffDays === 1) return <span className="text-success">Yesterday</span>
          if (diffDays != null && diffDays < 7) return <span>{diffDays} days ago</span>
          return <span className="text-neutral-500">{last.toLocaleDateString()}</span>
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const user = row.original
          const isActive = isUserActiveWithinDays(user, activityByUser, 7)
          
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
                onClick={() => navigate(`/users/${user.id}?edit=1`)}
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
    [navigate, deleteUserMutation, activityByUser]
  )

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    manualPagination: true,
    pageCount: totalPages,
  })

  useEffect(() => {
    if (selectedUsers.length > 0) {
      setShowBulkActions(true)
    } else {
      setShowBulkActions(false)
    }
  }, [selectedUsers.length])

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-dark tracking-tight">Users</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {segmentFilter
              ? `${totalItems} in ${SEGMENT_LABELS[segmentFilter]} · page ${page} of ${totalPages}`
              : `${totalItems} total · page ${page} of ${totalPages}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => navigate('/users/add')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-lg px-4 py-3 text-sm">
          Could not load users: {fetchError}. Sign out and sign in again if this persists.
        </div>
      )}

      {segmentFilter && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm text-neutral-700">
            Showing <span className="font-semibold">{SEGMENT_LABELS[segmentFilter]}</span>
            <span className="text-neutral-500"> ({totalItems})</span>
          </p>
          <button
            type="button"
            onClick={() => setSegmentInUrl('')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <X className="w-4 h-4" />
            Clear segment
          </button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNotifyMsg(null)
                setShowNotifyModal(true)
              }}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
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
      <div className="bg-white rounded-xl border border-neutral-200 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[min(100%,240px)] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={segmentFilter || ''}
            onChange={(e) => {
              const value = e.target.value
              setSegmentInUrl(isSegmentId(value) ? value : '')
              if (value) setStatusFilter('all')
            }}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All segments</option>
            {SEGMENT_IDS.map((id) => (
              <option key={id} value={id}>
                {SEGMENT_LABELS[id]}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              if (e.target.value !== 'all') setSegmentInUrl('')
              setPage(1)
            }}
            disabled={Boolean(segmentFilter)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="all">All Status</option>
            <option value="active">Active (7d)</option>
            <option value="inactive">Inactive (7d+)</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
              setSegmentInUrl('')
              setPage(1)
            }}
            className="text-sm text-neutral-600 hover:text-neutral-800"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {isLoading || (needsClientFilter && !filtersReady) ? (
          <div className="p-8 space-y-3" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-neutral-100 animate-pulse" />
            ))}
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

      {showNotifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => !notifyBusy && setShowNotifyModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Send push notification</h2>
            <p className="text-sm text-neutral-500">
              Sends to {selectedUsers.length} selected user{selectedUsers.length === 1 ? '' : 's'} who
              have push enabled.
            </p>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
              <input
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                maxLength={50}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Body</label>
              <textarea
                value={notifyBody}
                onChange={(e) => setNotifyBody(e.target.value)}
                maxLength={150}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {notifyMsg && (
              <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2">{notifyMsg}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={notifyBusy}
                onClick={() => setShowNotifyModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={notifyBusy}
                onClick={handleBulkNotify}
              >
                {notifyBusy ? 'Sending…' : 'Send push'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
