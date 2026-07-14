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
    const err = error as { message?: string; response?: { data?: Record<string, unknown> } }
    const data = err?.response?.data
    if (data && typeof data === 'object') {
      const parts = Object.entries(data).map(([key, val]) => {
        if (val && typeof val === 'object' && 'message' in val) {
          return `${key}: ${(val as { message: string }).message}`
        }
        return `${key}: ${String(val)}`
      })
      throw new Error(parts.join('; ') || err.message || 'Upload failed')
    }
    throw new Error(err?.message || 'Upload failed')
  }

  const url = getMediaFileUrl(record)
  if (!url) throw new Error('Upload succeeded but file URL could not be resolved')
  return url
}
