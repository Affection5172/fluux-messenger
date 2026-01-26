import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { discoverWebSocket, discoverXmppEndpoints } from './websocketDiscovery'

describe('websocketDiscovery', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
  })

  describe('discoverXmppEndpoints', () => {
    it('should discover WebSocket endpoint from JSON host-meta', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          links: [
            { rel: 'urn:xmpp:alt-connections:websocket', href: 'wss://example.com/ws' },
          ],
        }),
      })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBe('wss://example.com/ws')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/.well-known/host-meta.json',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    })

    it('should discover both WebSocket and BOSH endpoints', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          links: [
            { rel: 'urn:xmpp:alt-connections:websocket', href: 'wss://example.com/ws' },
            { rel: 'urn:xmpp:alt-connections:xbosh', href: 'https://example.com/http-bind' },
          ],
        }),
      })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBe('wss://example.com/ws')
      expect(result.bosh).toBe('https://example.com/http-bind')
    })

    it('should fall back to XML host-meta when JSON fails', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('JSON not found'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`
            <?xml version="1.0" encoding="utf-8"?>
            <XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
              <Link rel="urn:xmpp:alt-connections:websocket" href="wss://example.com/ws" />
            </XRD>
          `),
        })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBe('wss://example.com/ws')
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should parse XML with href before rel attribute order', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('JSON not found'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`
            <XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
              <Link href="wss://example.com/ws" rel="urn:xmpp:alt-connections:websocket" />
            </XRD>
          `),
        })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBe('wss://example.com/ws')
    })

    it('should return empty result when both JSON and XML fail', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('JSON not found'))
        .mockRejectedValueOnce(new Error('XML not found'))

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBeUndefined()
      expect(result.bosh).toBeUndefined()
    })

    it('should return empty result for HTTP 404', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({ ok: false, status: 404 })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBeUndefined()
    })

    it('should ignore insecure ws:// URLs', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          links: [
            { rel: 'urn:xmpp:alt-connections:websocket', href: 'ws://example.com/ws' },
          ],
        }),
      })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBeUndefined()
    })

    it('should ignore insecure http:// BOSH URLs', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          links: [
            { rel: 'urn:xmpp:alt-connections:xbosh', href: 'http://example.com/http-bind' },
          ],
        }),
      })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.bosh).toBeUndefined()
    })

    it('should handle empty links array', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ links: [] }),
      })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBeUndefined()
    })

    it('should handle missing links property', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBeUndefined()
    })

    it('should use first matching link when multiple exist', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          links: [
            { rel: 'urn:xmpp:alt-connections:websocket', href: 'wss://first.example.com/ws' },
            { rel: 'urn:xmpp:alt-connections:websocket', href: 'wss://second.example.com/ws' },
          ],
        }),
      })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBe('wss://first.example.com/ws')
    })

    it('should skip links without rel attribute', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          links: [
            { href: 'wss://example.com/ws' }, // Missing rel
            { rel: 'urn:xmpp:alt-connections:websocket', href: 'wss://correct.example.com/ws' },
          ],
        }),
      })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBe('wss://correct.example.com/ws')
    })

    it('should skip links without href attribute', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          links: [
            { rel: 'urn:xmpp:alt-connections:websocket' }, // Missing href
          ],
        }),
      })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBeUndefined()
    })
  })

  describe('discoverWebSocket', () => {
    it('should return WebSocket URL directly', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          links: [
            { rel: 'urn:xmpp:alt-connections:websocket', href: 'wss://example.com/xmpp' },
          ],
        }),
      })

      const wsUrl = await discoverWebSocket('example.com')

      expect(wsUrl).toBe('wss://example.com/xmpp')
    })

    it('should return null when no WebSocket found', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          links: [
            { rel: 'urn:xmpp:alt-connections:xbosh', href: 'https://example.com/http-bind' },
          ],
        }),
      })

      const wsUrl = await discoverWebSocket('example.com')

      expect(wsUrl).toBeNull()
    })

    it('should return null on network error', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      const wsUrl = await discoverWebSocket('example.com')

      expect(wsUrl).toBeNull()
    })
  })

  describe('XML parsing edge cases', () => {
    it('should handle self-closing Link tags', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('JSON not found'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(
            '<XRD><Link rel="urn:xmpp:alt-connections:websocket" href="wss://example.com/ws"/></XRD>'
          ),
        })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBe('wss://example.com/ws')
    })

    it('should handle Link tags with extra attributes', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('JSON not found'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(
            '<XRD><Link type="text/html" rel="urn:xmpp:alt-connections:websocket" href="wss://example.com/ws" title="WebSocket" /></XRD>'
          ),
        })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBe('wss://example.com/ws')
    })

    it('should handle single quotes in XML attributes', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('JSON not found'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(
            "<XRD><Link rel='urn:xmpp:alt-connections:websocket' href='wss://example.com/ws' /></XRD>"
          ),
        })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBe('wss://example.com/ws')
    })

    it('should handle XML with newlines and whitespace', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('JSON not found'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`
            <?xml version="1.0"?>
            <XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
              <Link
                rel="urn:xmpp:alt-connections:websocket"
                href="wss://example.com/ws"
              />
              <Link
                rel="urn:xmpp:alt-connections:xbosh"
                href="https://example.com/http-bind"
              />
            </XRD>
          `),
        })

      const result = await discoverXmppEndpoints('example.com')

      expect(result.websocket).toBe('wss://example.com/ws')
      expect(result.bosh).toBe('https://example.com/http-bind')
    })
  })
})
