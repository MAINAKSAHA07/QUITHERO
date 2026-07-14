import { useId, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Upload, FolderOpen, Loader2 } from 'lucide-react'
import { adminCollectionHelpers, recentSort } from '../lib/pocketbase'
import { getMediaFileUrl, uploadMediaFile, type MediaRecord, type MediaType } from '../lib/media'

const ACCEPT: Record<MediaType, string> = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  document: '.pdf,.doc,.docx',
  other: '*/*',
}

interface MediaUrlFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  mediaType: MediaType
  required?: boolean
  placeholder?: string
  hint?: string
  folder?: string
}

export function MediaUrlField({
  label,
  value,
  onChange,
  mediaType,
  required,
  placeholder,
  hint,
  folder,
}: MediaUrlFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadId = useId()
  const [uploading, setUploading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadError('')
    try {
      const url = await uploadMediaFile(file, folder)
      onChange(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setUploadError(message)
      alert(message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor={`${uploadId}-url`}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>

      {mediaType === 'image' && (
        <div className="mb-3">
          {value ? (
            <div className="relative inline-block">
              <img
                src={value}
                alt="Preview"
                className="rounded-lg max-h-40 object-cover border border-neutral-200"
              />
              <button
                type="button"
                className="absolute top-2 right-2 text-xs bg-white/90 border border-neutral-200 rounded px-2 py-1 hover:bg-white"
                onClick={() => onChange('')}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center">
              <input
                ref={inputRef}
                id={uploadId}
                type="file"
                accept={ACCEPT[mediaType]}
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUpload(file)
                }}
              />
              <label
                htmlFor={uploadId}
                className="cursor-pointer flex flex-col items-center gap-2 text-neutral-600"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                ) : (
                  <Upload className="w-8 h-8 text-neutral-400" />
                )}
                <span className="text-sm font-medium">
                  {uploading ? 'Uploading…' : 'Click to upload cover image'}
                </span>
                <span className="text-xs text-neutral-500">PNG, JPG, GIF, WebP</span>
              </label>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          id={`${uploadId}-url`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={placeholder}
          required={required}
        />
        {mediaType !== 'image' && (
          <>
            <button
              type="button"
              className="btn-secondary shrink-0 inline-flex items-center gap-1.5 px-3 py-2"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="hidden sm:inline">{uploading ? 'Uploading…' : 'Upload'}</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT[mediaType]}
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleUpload(file)
              }}
            />
          </>
        )}
        <button
          type="button"
          className="btn-secondary shrink-0 inline-flex items-center gap-1.5 px-3 py-2"
          onClick={() => setShowPicker(true)}
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Library</span>
        </button>
      </div>
      {hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
      {uploadError && <p className="text-xs text-danger mt-1">{uploadError}</p>}
      {showPicker && (
        <MediaPickerModal
          mediaType={mediaType}
          onSelect={(url) => {
            onChange(url)
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

function MediaPickerModal({
  mediaType,
  onSelect,
  onClose,
}: {
  mediaType: MediaType
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['media', 'picker', mediaType],
    queryFn: () =>
      adminCollectionHelpers.getFullList('media', {
        filter: `type = "${mediaType}"`,
        sort: recentSort('media'),
      }),
  })

  const items = (data?.success ? data.data : []) as unknown as MediaRecord[]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="font-semibold">Choose from Media Library</h3>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <p className="text-neutral-500 text-center py-8">Loading…</p>
          ) : isError || (data && !data.success) ? (
            <p className="text-danger text-center py-8">
              {(data && !data.success && data.error) || (error as Error)?.message || 'Could not load media library'}
            </p>
          ) : items.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">
              No {mediaType} files yet. Upload one first via the Upload button above.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => {
                const url = getMediaFileUrl(item)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(url)}
                    className="border border-neutral-200 rounded-lg p-2 hover:border-primary hover:ring-2 hover:ring-primary/20 text-left transition-all"
                  >
                    {mediaType === 'image' && url ? (
                      <img src={url} alt="" className="w-full aspect-square object-cover rounded mb-2" />
                    ) : (
                      <div className="w-full aspect-square bg-neutral-100 rounded mb-2 flex items-center justify-center text-xs text-neutral-500 px-2 text-center break-all">
                        {item.filename}
                      </div>
                    )}
                    <p className="text-xs text-neutral-700 truncate">{item.filename}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
