import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTextPreview } from './useTextPreview'

describe('useTextPreview', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('should not fetch when url is undefined', () => {
    renderHook(() => useTextPreview(undefined))
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should not fetch when enabled is false', () => {
    renderHook(() => useTextPreview('https://example.com/file.txt', false))
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should fetch content when url is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve('Hello World'),
    })

    const { result } = renderHook(() => useTextPreview('https://example.com/file.txt'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.content).toBe('Hello World')
    expect(result.current.error).toBeNull()
    expect(result.current.isTruncated).toBe(false)
  })

  it('should send Range header for partial content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve('content'),
    })

    renderHook(() => useTextPreview('https://example.com/file.txt'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/file.txt', {
        headers: { 'Range': 'bytes=0-1023' },
      })
    })
  })

  it('should set isTruncated when response is partial (206)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 206,
      headers: new Headers({ 'Content-Range': 'bytes 0-1023/5000' }),
      text: () => Promise.resolve('partial content'),
    })

    const { result } = renderHook(() => useTextPreview('https://example.com/large.txt'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isTruncated).toBe(true)
  })

  it('should truncate to max 15 lines', async () => {
    const manyLines = Array(20).fill('line').join('\n')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve(manyLines),
    })

    const { result } = renderHook(() => useTextPreview('https://example.com/file.txt'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const lineCount = result.current.content?.split('\n').length ?? 0
    expect(lineCount).toBe(15)
    expect(result.current.isTruncated).toBe(true)
  })

  it('should set error on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers(),
      text: () => Promise.resolve('Not Found'),
    })

    const { result } = renderHook(() => useTextPreview('https://example.com/missing.txt'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.content).toBeNull()
    expect(result.current.error).toBe('Failed to fetch: 404')
  })

  it('should set error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useTextPreview('https://example.com/file.txt'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.content).toBeNull()
    expect(result.current.error).toBe('Network error')
  })

  it('should reset state when url changes to undefined', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve('content'),
    })

    const { result, rerender } = renderHook(
      ({ url }) => useTextPreview(url),
      { initialProps: { url: 'https://example.com/file.txt' as string | undefined } }
    )

    await waitFor(() => {
      expect(result.current.content).toBe('content')
    })

    rerender({ url: undefined })

    expect(result.current.content).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
