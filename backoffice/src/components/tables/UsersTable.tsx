import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table'
import { ArrowUpDown, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface User {
  id: string
  email: string
  name?: string
  created?: string
  updated?: string
  [key: string]: any
}

interface UsersTableProps {
  users: User[]
}

export const UsersTable: React.FC<UsersTableProps> = ({ users }) => {
  const navigate = useNavigate()

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-primary"
          >
            Name
            <ArrowUpDown className="w-4 h-4" />
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
          <code className="text-xs bg-neutral-100 px-2 py-1 rounded font-mono">
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
                onClick={() => navigate(`/users/${user.id}/edit`)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Edit User"
              >
                <Edit className="w-4 h-4 text-primary" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this user?')) {
                    // Handle delete
                  }
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Delete User"
              >
                <Trash2 className="w-4 h-4 text-danger" />
              </button>
            </div>
          )
        },
      },
    ],
    [navigate]
  )

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b border-neutral-200">
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
            <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="p-8 text-center text-neutral-500">
          No users found
        </div>
      )}
    </div>
  )
}




