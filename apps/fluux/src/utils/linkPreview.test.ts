import { describe, it, expect } from 'vitest'
import { extractFirstUrl, isImageUrl } from './linkPreview'

describe('extractFirstUrl', () => {
  it('extracts https URL from text', () => {
    expect(extractFirstUrl('Check out https://example.com')).toBe('https://example.com')
  })

  it('extracts http URL from text', () => {
    expect(extractFirstUrl('Visit http://example.com for more')).toBe('http://example.com')
  })

  it('extracts first URL when multiple URLs present', () => {
    expect(extractFirstUrl('First https://first.com then https://second.com')).toBe('https://first.com')
  })

  it('extracts URL with path', () => {
    expect(extractFirstUrl('See https://example.com/path/to/page')).toBe('https://example.com/path/to/page')
  })

  it('extracts URL with query parameters', () => {
    expect(extractFirstUrl('Link: https://example.com/search?q=test&page=1')).toBe('https://example.com/search?q=test&page=1')
  })

  it('extracts URL with port number', () => {
    expect(extractFirstUrl('Dev server at http://localhost:3000/app')).toBe('http://localhost:3000/app')
  })

  it('extracts URL with fragment', () => {
    expect(extractFirstUrl('Jump to https://example.com/page#section')).toBe('https://example.com/page#section')
  })

  it('extracts URL at start of text', () => {
    expect(extractFirstUrl('https://example.com is great')).toBe('https://example.com')
  })

  it('extracts URL at end of text', () => {
    expect(extractFirstUrl('Check this out: https://example.com')).toBe('https://example.com')
  })

  it('extracts URL that is the entire text', () => {
    expect(extractFirstUrl('https://example.com/full/path')).toBe('https://example.com/full/path')
  })

  it('returns null for text without URL', () => {
    expect(extractFirstUrl('No links here, just plain text')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractFirstUrl('')).toBeNull()
  })

  it('does not match incomplete URLs', () => {
    expect(extractFirstUrl('Not a link: example.com')).toBeNull()
  })

  it('does not match ftp or other protocols', () => {
    expect(extractFirstUrl('FTP link: ftp://files.example.com')).toBeNull()
  })

  it('stops at whitespace', () => {
    expect(extractFirstUrl('Link https://example.com and more text')).toBe('https://example.com')
  })

  it('stops at angle brackets (common in chat)', () => {
    expect(extractFirstUrl('Check <https://example.com>')).toBe('https://example.com')
  })

  it('handles URL with encoded characters', () => {
    expect(extractFirstUrl('https://example.com/path%20with%20spaces')).toBe('https://example.com/path%20with%20spaces')
  })

  it('handles complex real-world URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'
    expect(extractFirstUrl(`Watch this: ${url}`)).toBe(url)
  })
})

describe('isImageUrl', () => {
  describe('returns true for image URLs', () => {
    it('detects .jpg extension', () => {
      expect(isImageUrl('https://example.com/image.jpg')).toBe(true)
    })

    it('detects .jpeg extension', () => {
      expect(isImageUrl('https://example.com/photo.jpeg')).toBe(true)
    })

    it('detects .png extension', () => {
      expect(isImageUrl('https://example.com/graphic.png')).toBe(true)
    })

    it('detects .gif extension', () => {
      expect(isImageUrl('https://example.com/animation.gif')).toBe(true)
    })

    it('detects .webp extension', () => {
      expect(isImageUrl('https://example.com/modern.webp')).toBe(true)
    })

    it('detects .bmp extension', () => {
      expect(isImageUrl('https://example.com/bitmap.bmp')).toBe(true)
    })

    it('detects .svg extension', () => {
      expect(isImageUrl('https://example.com/vector.svg')).toBe(true)
    })

    it('is case insensitive', () => {
      expect(isImageUrl('https://example.com/IMAGE.JPG')).toBe(true)
      expect(isImageUrl('https://example.com/Photo.PNG')).toBe(true)
    })

    it('detects image extension in path', () => {
      expect(isImageUrl('https://cdn.example.com/uploads/2024/photo.jpg?size=large')).toBe(true)
    })

    it('detects image extension with query params', () => {
      expect(isImageUrl('https://example.com/image.png?width=800&height=600')).toBe(true)
    })
  })

  describe('returns false for non-image URLs', () => {
    it('rejects regular webpage', () => {
      expect(isImageUrl('https://example.com')).toBe(false)
    })

    it('rejects HTML page', () => {
      expect(isImageUrl('https://example.com/page.html')).toBe(false)
    })

    it('rejects PDF', () => {
      expect(isImageUrl('https://example.com/document.pdf')).toBe(false)
    })

    it('rejects video file', () => {
      expect(isImageUrl('https://example.com/video.mp4')).toBe(false)
    })

    it('rejects path that contains image-like text but no extension', () => {
      expect(isImageUrl('https://example.com/images/gallery')).toBe(false)
    })

    it('rejects URL with jpg in domain but not as extension', () => {
      // This is a limitation - we check for extension anywhere in URL
      // but for most practical cases this is fine
      expect(isImageUrl('https://jpghost.com/page')).toBe(false)
    })
  })
})
