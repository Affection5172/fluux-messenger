import { describe, it, expect } from 'vitest'
import { getMimeType, getFilename, MIME_TYPES } from './fileUtils'

describe('getMimeType', () => {
  it('should return correct MIME types for images', () => {
    expect(getMimeType('photo.jpg')).toBe('image/jpeg')
    expect(getMimeType('photo.jpeg')).toBe('image/jpeg')
    expect(getMimeType('image.png')).toBe('image/png')
    expect(getMimeType('animation.gif')).toBe('image/gif')
    expect(getMimeType('photo.webp')).toBe('image/webp')
    expect(getMimeType('icon.svg')).toBe('image/svg+xml')
  })

  it('should return correct MIME types for video', () => {
    expect(getMimeType('video.mp4')).toBe('video/mp4')
    expect(getMimeType('clip.webm')).toBe('video/webm')
    expect(getMimeType('recording.mov')).toBe('video/quicktime')
  })

  it('should return correct MIME types for audio', () => {
    expect(getMimeType('song.mp3')).toBe('audio/mpeg')
    expect(getMimeType('sound.wav')).toBe('audio/wav')
    expect(getMimeType('audio.ogg')).toBe('audio/ogg')
  })

  it('should return correct MIME types for documents', () => {
    expect(getMimeType('document.pdf')).toBe('application/pdf')
    expect(getMimeType('readme.txt')).toBe('text/plain')
    expect(getMimeType('archive.zip')).toBe('application/zip')
    expect(getMimeType('config.json')).toBe('application/json')
  })

  it('should handle uppercase extensions', () => {
    expect(getMimeType('PHOTO.JPG')).toBe('image/jpeg')
    expect(getMimeType('video.MP4')).toBe('video/mp4')
    expect(getMimeType('DOC.PDF')).toBe('application/pdf')
  })

  it('should return octet-stream for unknown extensions', () => {
    expect(getMimeType('file.xyz')).toBe('application/octet-stream')
    expect(getMimeType('unknown.abc')).toBe('application/octet-stream')
    expect(getMimeType('noextension')).toBe('application/octet-stream')
  })

  it('should handle filenames with multiple dots', () => {
    expect(getMimeType('my.photo.jpg')).toBe('image/jpeg')
    expect(getMimeType('file.name.with.dots.png')).toBe('image/png')
  })

  it('should handle paths with directories', () => {
    expect(getMimeType('/path/to/file.jpg')).toBe('image/jpeg')
    expect(getMimeType('C:\\Users\\file.pdf')).toBe('application/pdf')
  })
})

describe('getFilename', () => {
  it('should extract filename from Unix paths', () => {
    expect(getFilename('/Users/john/Documents/photo.jpg')).toBe('photo.jpg')
    expect(getFilename('/tmp/test.txt')).toBe('test.txt')
    expect(getFilename('/file.png')).toBe('file.png')
  })

  it('should extract filename from Windows paths', () => {
    expect(getFilename('C:\\Users\\john\\photo.jpg')).toBe('photo.jpg')
    expect(getFilename('D:\\Documents\\test.pdf')).toBe('test.pdf')
  })

  it('should handle filename without path', () => {
    expect(getFilename('photo.jpg')).toBe('photo.jpg')
    expect(getFilename('file.txt')).toBe('file.txt')
  })

  it('should return "file" for empty input', () => {
    expect(getFilename('')).toBe('file')
  })
})

describe('MIME_TYPES', () => {
  it('should have all expected entries', () => {
    // Images
    expect(MIME_TYPES['jpg']).toBeDefined()
    expect(MIME_TYPES['jpeg']).toBeDefined()
    expect(MIME_TYPES['png']).toBeDefined()
    expect(MIME_TYPES['gif']).toBeDefined()
    expect(MIME_TYPES['webp']).toBeDefined()
    expect(MIME_TYPES['svg']).toBeDefined()

    // Video
    expect(MIME_TYPES['mp4']).toBeDefined()
    expect(MIME_TYPES['webm']).toBeDefined()
    expect(MIME_TYPES['mov']).toBeDefined()

    // Audio
    expect(MIME_TYPES['mp3']).toBeDefined()
    expect(MIME_TYPES['wav']).toBeDefined()
    expect(MIME_TYPES['ogg']).toBeDefined()

    // Documents
    expect(MIME_TYPES['pdf']).toBeDefined()
    expect(MIME_TYPES['txt']).toBeDefined()
    expect(MIME_TYPES['zip']).toBeDefined()
    expect(MIME_TYPES['json']).toBeDefined()
  })
})
