import { useState, useEffect } from 'react'

/** Maximum bytes to fetch for text preview */
const MAX_PREVIEW_BYTES = 1024

/** Maximum lines to display in preview */
const MAX_PREVIEW_LINES = 15

interface TextPreviewState {
  content: string | null
  isLoading: boolean
  error: string | null
  isTruncated: boolean
}

/**
 * Hook to fetch and display a text file preview.
 * Uses HTTP Range request to fetch only the first ~1KB.
 */
export function useTextPreview(url: string | undefined, enabled: boolean = true): TextPreviewState {
  const [state, setState] = useState<TextPreviewState>({
    content: null,
    isLoading: false,
    error: null,
    isTruncated: false,
  })

  useEffect(() => {
    if (!url || !enabled) {
      setState({ content: null, isLoading: false, error: null, isTruncated: false })
      return
    }

    let cancelled = false

    const fetchPreview = async () => {
      setState(s => ({ ...s, isLoading: true, error: null }))

      try {
        // Try Range request first for efficiency
        const response = await fetch(url, {
          headers: {
            'Range': `bytes=0-${MAX_PREVIEW_BYTES - 1}`,
          },
        })

        if (cancelled) return

        // Check if we got a successful response
        if (!response.ok && response.status !== 206) {
          throw new Error(`Failed to fetch: ${response.status}`)
        }

        const text = await response.text()
        if (cancelled) return

        // Check if content was truncated (either by Range or by line limit)
        const contentRange = response.headers.get('Content-Range')
        const wasRangeTruncated = response.status === 206 && contentRange !== null

        // Split into lines and limit
        const lines = text.split('\n')
        const displayLines = lines.slice(0, MAX_PREVIEW_LINES)
        const wasLineTruncated = lines.length > MAX_PREVIEW_LINES

        setState({
          content: displayLines.join('\n'),
          isLoading: false,
          error: null,
          isTruncated: wasRangeTruncated || wasLineTruncated,
        })
      } catch (err) {
        if (cancelled) return
        setState({
          content: null,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load preview',
          isTruncated: false,
        })
      }
    }

    fetchPreview()

    return () => {
      cancelled = true
    }
  }, [url, enabled])

  return state
}
