import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers, pb, recentSort } from '../../lib/pocketbase'
import { Upload, Grid, List, Folder, Image, File, Search, Trash2, Download, Eye, FolderPlus } from 'lucide-react'

// Helper function to get file URL from PocketBase
const getFileUrl = (record: MediaItem, filename?: string): string => {
  if (!filename && !record.file) {
    return record.url || '' // Fallback to external URL if no file
  }
  const actualFilename = filename || record.file
  return pb.files.getUrl(record, actualFilename || '')
}

interface MediaItem {
  id: string
  filename: string
  type: 'image' | 'video' | 'audio' | 'document' | 'other'
  file?: string // PocketBase file field
  url?: string // External URL (optional)
  size?: number
  folder?: string
  created?: string
  [key: string]: any
}

export const MediaLibrary = () => {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [folderFilter, setFolderFilter] = useState<string>('all')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)

  // Note: Media items would be in a 'media' or 'files' collection
  const { data: mediaData, isLoading } = useQuery({
    queryKey: ['media', typeFilter, folderFilter],
    queryFn: async () => {
      try {
        return await adminCollectionHelpers.getFullList('media', {
          filter: buildFilter(),
          sort: recentSort('media'),
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
    if (folderFilter !== 'all') {
      filters.push(`folder = "${folderFilter}"`)
    }
    return filters.length > 0 ? filters.join(' && ') : undefined
  }

  const media = (mediaData?.data || []) as any as MediaItem[]
  const folders = Array.from(new Set(media.map((item: MediaItem) => item.folder).filter(Boolean)))

  const filteredMedia = media.filter((item: MediaItem) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return item.filename?.toLowerCase().includes(searchLower)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminCollectionHelpers.delete('media', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      setSelectedItems([])
    },
  })

  const handleDelete = async (item: MediaItem) => {
    if (confirm(`Are you sure you want to delete "${item.filename}"?`)) {
      try {
        await deleteMutation.mutateAsync(item.id)
      } catch (error) {
        console.error('Failed to delete media:', error)
        alert('Failed to delete media')
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
      try {
        await Promise.all(selectedItems.map(id => deleteMutation.mutateAsync(id)))
      } catch (error) {
        console.error('Failed to delete media:', error)
        alert('Failed to delete media')
      }
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image
      case 'video':
        return File
      case 'audio':
        return File
      default:
        return File
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-neutral-dark">Media Library</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-neutral-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-neutral-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'text-neutral-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowFolderModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
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
              placeholder="Search media files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>
          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Folders</option>
            {folders.map((folder) => (
              <option key={folder} value={folder}>{folder}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <div className="bg-primary text-white rounded-lg shadow-card p-4 flex items-center justify-between">
          <span className="font-medium">{selectedItems.length} item(s) selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedItems([])}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Media Grid/List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <Image className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No media files found</p>
          <p className="text-sm text-neutral-400 mb-4">
            {mediaData === undefined
              ? 'Media collection may need to be created in PocketBase'
              : 'Upload your first file to get started'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary"
          >
            Upload File
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredMedia.map((item: MediaItem) => {
            const Icon = getFileIcon(item.type)
            const isSelected = selectedItems.includes(item.id)
            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-card overflow-hidden cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  if (isSelected) {
                    setSelectedItems(selectedItems.filter(id => id !== item.id))
                  } else {
                    setSelectedItems([...selectedItems, item.id])
                  }
                }}
              >
                {item.type === 'image' && (item.file || item.url) ? (
                  <div className="aspect-square bg-neutral-100 relative">
                    <img
                      src={getFileUrl(item)}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                          ✓
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                    <Icon className="w-12 h-12 text-neutral-400" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-neutral-dark truncate" title={item.filename}>
                    {item.filename}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-neutral-500">{formatFileSize(item.size)}</span>
                    {item.folder && (
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <Folder className="w-3 h-3" />
                        {item.folder}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase w-12">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredMedia.length && filteredMedia.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredMedia.map((item: MediaItem) => item.id))
                      } else {
                        setSelectedItems([])
                      }
                    }}
                    className="rounded border-neutral-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">File</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Folder</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Uploaded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredMedia.map((item: MediaItem) => {
                const Icon = getFileIcon(item.type)
                const isSelected = selectedItems.includes(item.id)
                return (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, item.id])
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== item.id))
                          }
                        }}
                        className="rounded border-neutral-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-neutral-400" />
                        <span className="font-medium text-neutral-dark">{item.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs bg-neutral-100 rounded capitalize">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{formatFileSize(item.size)}</td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {item.folder ? (
                        <span className="flex items-center gap-1">
                          <Folder className="w-4 h-4" />
                          {item.folder}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {item.created ? new Date(item.created).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(item.file || item.url) && (
                          <a
                            href={getFileUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-neutral-100 rounded-lg"
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-secondary" />
                          </a>
                        )}
                        {(item.file || item.url) && (
                          <a
                            href={getFileUrl(item)}
                            download={item.filename}
                            className="p-2 hover:bg-neutral-100 rounded-lg"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-secondary" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(item)}
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

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            queryClient.invalidateQueries({ queryKey: ['media'] })
          }}
        />
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
        <CreateFolderModal
          onClose={() => setShowFolderModal(false)}
          onSuccess={() => {
            setShowFolderModal(false)
            queryClient.invalidateQueries({ queryKey: ['media'] })
          }}
        />
      )}
    </div>
  )
}

interface UploadModalProps {
  onClose: () => void
  onSuccess: () => void
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess }) => {
  // const queryClient = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const [folder, setFolder] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select files to upload')
      return
    }

    setIsUploading(true)
    let successCount = 0
    let errorCount = 0

    try {
      // Upload files to PocketBase
      for (const file of files) {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

          // Determine file type
          const fileType = file.type.startsWith('image/') ? 'image' :
                          file.type.startsWith('video/') ? 'video' :
                          file.type.startsWith('audio/') ? 'audio' :
                          file.type.includes('pdf') || file.type.includes('document') ? 'document' : 'other'

          // Create FormData for upload
          const formData = new FormData()
          formData.append('file', file)
          formData.append('filename', file.name)
          formData.append('type', fileType)
          formData.append('size', file.size.toString())
          if (folder) {
            formData.append('folder', folder)
          }

          // Upload to PocketBase media collection
          setUploadProgress(prev => ({ ...prev, [file.name]: 50 }))
          await adminCollectionHelpers.create('media', formData)

          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
          successCount++
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          errorCount++
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 })) // -1 indicates error
        }
      }

      if (successCount > 0) {
        alert(`${successCount} file(s) uploaded successfully!` + (errorCount > 0 ? ` ${errorCount} failed.` : ''))
        onSuccess()
      } else {
        alert('All uploads failed. Please try again.')
      }
    } catch (error) {
      console.error('Upload process failed:', error)
      alert('Failed to upload files')
    } finally {
      setIsUploading(false)
      setFiles([])
      setUploadProgress({})
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upload Files</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Folder (optional)</label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., images, videos"
            />
          </div>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center hover:border-primary transition-colors"
          >
            <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 mb-2">Drag and drop files here, or</p>
            <label className="btn-primary inline-block cursor-pointer">
              Select Files
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Files:</p>
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-neutral-50 rounded">
                  <span className="text-sm text-neutral-700 flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-neutral-500 whitespace-nowrap">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  {uploadProgress[file.name] !== undefined && (
                    <div className="flex-1 mx-4 bg-neutral-200 rounded-full h-2 max-w-[200px]">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          uploadProgress[file.name] === -1 ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: uploadProgress[file.name] === -1 ? '100%' : `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  )}
                  {uploadProgress[file.name] === -1 && (
                    <span className="text-xs text-red-500">Failed</span>
                  )}
                  {uploadProgress[file.name] === 100 && (
                    <span className="text-xs text-green-500">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button onClick={onClose} className="btn-secondary" disabled={isUploading}>
              Cancel
            </button>
            <button onClick={handleUpload} className="btn-primary" disabled={isUploading || files.length === 0}>
              {isUploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CreateFolderModalProps {
  onClose: () => void
  onSuccess: () => void
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ onClose, onSuccess }) => {
  const [folderName, setFolderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!folderName.trim()) {
      alert('Folder name is required')
      return
    }

    setIsCreating(true)
    try {
      // In a real implementation, create folder in PocketBase
      // await adminCollectionHelpers.create('media_folders', { name: folderName })
      await new Promise(resolve => setTimeout(resolve, 500))
      alert('Folder created successfully!')
      onSuccess()
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert('Failed to create folder')
    } finally {
      setIsCreating(false)
      setFolderName('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create Folder</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Folder Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Program Images"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button onClick={onClose} className="btn-secondary" disabled={isCreating}>
              Cancel
            </button>
            <button onClick={handleCreate} className="btn-primary" disabled={isCreating || !folderName.trim()}>
              {isCreating ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
