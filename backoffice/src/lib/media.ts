import { pb } from './pocketbase'

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other'

export interface MediaRecord {
  id: string
  filename: string
  type: MediaType
  file?: string
  url?: string
  size?: number
  folder?: string
  collectionId?: string
  collectionName?: string
}

/** Same-origin proxy URL — works on admin + landing domains. */
export function getMediaFileUrl(record: MediaRecord, filename?: string): string {
  if (record.url?.trim()) return record.url.trim()
  const name = filename || record.file
  if (!name) return ''

  const filesApi = pb.files as { getURL?: (r: unknown, f: string) => string; getUrl: (r: unknown, f: string) => string }
  const getURL = (filesApi.getURL ?? filesApi.getUrl).bind(pb.files)
  const raw = getURL(record, name)

  // Normalize absolute PB host URLs to /api/pocketbase proxy path
  const filesPath = raw.match(/(\/api\/files\/.+)$/)?.[1]
  if (filesPath) return `/api/pocketbase${filesPath}`
  return raw
}

export function mediaTypeFromFile(file: File): MediaType {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.includes('pdf') || file.type.includes('document')) return 'document'
  return 'other'
}

export async function uploadMediaFile(file: File, folder?: string): Promise<string> {
  if (file.size > 100 * 1024 * 1024) {
    throw new Error('File is too large (max 100 MB)')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('filename', file.name)
  formData.append('type', mediaTypeFromFile(file))
  formData.append('size', String(file.size))
  if (folder) formData.append('folder', folder)

  let record: MediaRecord
  try {
    record = (await pb.collection('media').create(formData)) as unknown as MediaRecord
  } catch (error: unknown) {
    const err = error as {
      message?: string
      status?: number
      response?: { data?: Record<string, unknown>; message?: string }
      originalError?: { message?: string }
    }
    const status = err.status
    if (status === 413 || /entity too large|413/i.test(err.message || '') || /entity too large/i.test(err.originalError?.message || '')) {
      throw new Error('File is too large for the server upload limit. Try a smaller image (under ~1 MB until the server is redeployed with a higher limit).')
    }
    const data = err?.response?.data
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      const parts = Object.entries(data).map(([key, val]) => {
        if (val && typeof val === 'object' && 'message' in val) {
          return `${key}: ${(val as { message: string }).message}`
        }
        return `${key}: ${String(val)}`
      })
      throw new Error(parts.join('; ') || err.message || 'Upload failed')
    }
    const msg = err.response?.message || err.message || 'Upload failed'
    if (/something went wrong/i.test(msg)) {
      throw new Error(
        'Upload failed — the server rejected the request (often the file is too large). Try a smaller image under 1 MB, or redeploy so nginx allows larger uploads.'
      )
    }
    throw new Error(msg)
  }

  const url = getMediaFileUrl(record)
  if (!url) throw new Error('Upload succeeded but file URL could not be resolved')
  return url
}
