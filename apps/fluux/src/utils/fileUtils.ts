/**
 * Common MIME type mappings for file extensions.
 * Used when determining the content type of dropped/uploaded files.
 */
export const MIME_TYPES: Record<string, string> = {
  // Images
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  // Video
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  // Documents
  'pdf': 'application/pdf',
  'txt': 'text/plain',
  'zip': 'application/zip',
  'json': 'application/json',
}

/**
 * Get the MIME type for a file based on its extension.
 * @param filename - The filename or path to check
 * @returns The MIME type, or 'application/octet-stream' for unknown types
 */
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return MIME_TYPES[ext] || 'application/octet-stream'
}

/**
 * Extract the filename from a file path.
 * Handles both Unix (/) and Windows (\) path separators.
 * @param path - The file path
 * @returns The filename
 */
export function getFilename(path: string): string {
  // Handle both Unix and Windows path separators
  // First try Unix-style path
  let filename = path.split('/').pop() || ''
  // If the result still has backslashes, it's a Windows path
  if (filename.includes('\\')) {
    filename = filename.split('\\').pop() || ''
  }
  return filename || 'file'
}
