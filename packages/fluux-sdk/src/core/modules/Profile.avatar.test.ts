/**
 * XMPPClient Own Avatar Tests
 *
 * Tests for own avatar fetching via XEP-0084 (User Avatar):
 * - fetchOwnAvatar() - retrieve own avatar from PEP (metadata + data)
 * - Proper two-step process: fetch metadata first to get hash, then fetch data
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { XMPPClient } from '../XMPPClient'
import {
  createMockXmppClient,
  createMockStores,
  createMockElement,
  type MockXmppClient,
  type MockStoreBindings,
} from '../test-utils'

let mockXmppClientInstance: MockXmppClient

// Use vi.hoisted to create the mock factory at hoist time
const { mockClientFactory, mockXmlFn } = vi.hoisted(() => {
  let clientInstance: MockXmppClient | null = null
  return {
    mockClientFactory: Object.assign(
      vi.fn(() => clientInstance),
      {
        _setInstance: (instance: MockXmppClient | null) => { clientInstance = instance },
      }
    ),
    mockXmlFn: vi.fn((name: string, attrs?: Record<string, string>, ...children: unknown[]) => ({
      name,
      attrs: attrs || {},
      children,
      toString: () => `<${name}/>`,
    })),
  }
})

// Mock @xmpp/client module
vi.mock('@xmpp/client', () => ({
  client: mockClientFactory,
  xml: mockXmlFn,
}))

// Mock @xmpp/debug
vi.mock('@xmpp/debug', () => ({
  default: vi.fn(),
}))

// Mock avatar cache
vi.mock('../../utils/avatarCache', () => ({
  getCachedAvatar: vi.fn().mockResolvedValue(null),
  cacheAvatar: vi.fn().mockResolvedValue('blob:cached-url'),
  saveAvatarHash: vi.fn().mockResolvedValue(undefined),
  getAvatarHash: vi.fn().mockResolvedValue(null),
}))

describe('XMPPClient Own Avatar', () => {
  let xmppClient: XMPPClient
  let mockStores: MockStoreBindings
  let emitSDKSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockXmppClientInstance = createMockXmppClient()
    mockClientFactory.mockClear()
    mockClientFactory._setInstance(mockXmppClientInstance)

    mockStores = createMockStores()
    xmppClient = new XMPPClient({ debug: false })
    xmppClient.bindStores(mockStores)
    emitSDKSpy = vi.spyOn(xmppClient, 'emitSDK')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('fetchOwnAvatar', () => {
    beforeEach(async () => {
      // Connect the client first
      const connectPromise = xmppClient.connect({
        jid: 'user@example.com',
        password: 'secret',
        server: 'example.com',
        skipDiscovery: true,
      })
      mockXmppClientInstance._emit('online', { jid: { toString: () => 'user@example.com/resource' } })
      await connectPromise
    })

    it('should first fetch metadata to get hash, then fetch data', async () => {
      // Clear any calls from connection setup
      mockXmppClientInstance.iqCaller.request.mockClear()

      // Mock metadata response
      const metadataResponse = createMockElement('iq', { type: 'result' }, [
        {
          name: 'pubsub',
          attrs: { xmlns: 'http://jabber.org/protocol/pubsub' },
          children: [
            {
              name: 'items',
              attrs: { node: 'urn:xmpp:avatar:metadata' },
              children: [
                {
                  name: 'item',
                  attrs: { id: 'abc123hash' },
                  children: [
                    {
                      name: 'metadata',
                      attrs: { xmlns: 'urn:xmpp:avatar:metadata' },
                      children: [
                        {
                          name: 'info',
                          attrs: { id: 'abc123hash', type: 'image/png', bytes: '1024' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])

      // Mock data response
      const dataResponse = createMockElement('iq', { type: 'result' }, [
        {
          name: 'pubsub',
          attrs: { xmlns: 'http://jabber.org/protocol/pubsub' },
          children: [
            {
              name: 'items',
              attrs: { node: 'urn:xmpp:avatar:data' },
              children: [
                {
                  name: 'item',
                  attrs: { id: 'abc123hash' },
                  children: [
                    {
                      name: 'data',
                      attrs: { xmlns: 'urn:xmpp:avatar:data' },
                      text: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])

      mockXmppClientInstance.iqCaller.request
        .mockResolvedValueOnce(metadataResponse)
        .mockResolvedValueOnce(dataResponse)

      await xmppClient.profile.fetchOwnAvatar()

      // Should have made 2 IQ requests: metadata then data
      expect(mockXmppClientInstance.iqCaller.request).toHaveBeenCalledTimes(2)

      // First call should query metadata node
      const firstCall = mockXmppClientInstance.iqCaller.request.mock.calls[0][0]
      expect(firstCall.attrs.type).toBe('get')
      const firstPubsub = firstCall.children.find((c: { name: string }) => c.name === 'pubsub')
      const firstItems = firstPubsub?.children?.find((c: { name: string }) => c.name === 'items')
      expect(firstItems?.attrs?.node).toBe('urn:xmpp:avatar:metadata')

      // Second call should query data node with the hash from metadata
      const secondCall = mockXmppClientInstance.iqCaller.request.mock.calls[1][0]
      expect(secondCall.attrs.type).toBe('get')
      const secondPubsub = secondCall.children.find((c: { name: string }) => c.name === 'pubsub')
      const secondItems = secondPubsub?.children?.find((c: { name: string }) => c.name === 'items')
      expect(secondItems?.attrs?.node).toBe('urn:xmpp:avatar:data')
      const item = secondItems?.children?.find((c: { name: string }) => c.name === 'item')
      expect(item?.attrs?.id).toBe('abc123hash')

      // Should update store with cached URL
      expect(emitSDKSpy).toHaveBeenCalledWith('connection:own-avatar', { avatar: 'blob:cached-url', hash: 'abc123hash' })
    })

    it('should not fetch data if metadata has no avatar (empty)', async () => {
      // Clear any calls from connection setup
      mockXmppClientInstance.iqCaller.request.mockClear()

      // Mock empty metadata response (no avatar set)
      const emptyMetadataResponse = createMockElement('iq', { type: 'result' }, [
        {
          name: 'pubsub',
          attrs: { xmlns: 'http://jabber.org/protocol/pubsub' },
          children: [
            {
              name: 'items',
              attrs: { node: 'urn:xmpp:avatar:metadata' },
              children: [
                {
                  name: 'item',
                  children: [
                    {
                      name: 'metadata',
                      attrs: { xmlns: 'urn:xmpp:avatar:metadata' },
                      // No info child means no avatar
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])

      mockXmppClientInstance.iqCaller.request.mockResolvedValue(emptyMetadataResponse)

      await xmppClient.profile.fetchOwnAvatar()

      // Should only make 1 request (metadata), not follow up with data request
      expect(mockXmppClientInstance.iqCaller.request).toHaveBeenCalledTimes(1)
      expect(emitSDKSpy).not.toHaveBeenCalledWith('connection:own-avatar', expect.anything())
    })

    it('should handle metadata fetch error gracefully', async () => {
      // Clear any calls from connection setup
      mockXmppClientInstance.iqCaller.request.mockClear()

      mockXmppClientInstance.iqCaller.request.mockRejectedValue(
        new Error('item-not-found')
      )

      // Should not throw
      await expect(xmppClient.profile.fetchOwnAvatar()).resolves.not.toThrow()

      // Should not update store
      expect(emitSDKSpy).not.toHaveBeenCalledWith('connection:own-avatar', expect.anything())
    })

    it('should use cached avatar if available', async () => {
      // Clear any calls from connection setup
      mockXmppClientInstance.iqCaller.request.mockClear()

      // Mock cache hit
      const { getCachedAvatar } = await import('../../utils/avatarCache')
      vi.mocked(getCachedAvatar).mockResolvedValueOnce('blob:cached-existing')

      // Mock metadata response
      const metadataResponse = createMockElement('iq', { type: 'result' }, [
        {
          name: 'pubsub',
          attrs: { xmlns: 'http://jabber.org/protocol/pubsub' },
          children: [
            {
              name: 'items',
              attrs: { node: 'urn:xmpp:avatar:metadata' },
              children: [
                {
                  name: 'item',
                  attrs: { id: 'abc123hash' },
                  children: [
                    {
                      name: 'metadata',
                      attrs: { xmlns: 'urn:xmpp:avatar:metadata' },
                      children: [
                        {
                          name: 'info',
                          attrs: { id: 'abc123hash', type: 'image/png', bytes: '1024' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])

      mockXmppClientInstance.iqCaller.request.mockResolvedValue(metadataResponse)

      await xmppClient.profile.fetchOwnAvatar()

      // Should only make 1 request (metadata), skip data fetch because of cache
      expect(mockXmppClientInstance.iqCaller.request).toHaveBeenCalledTimes(1)
      expect(emitSDKSpy).toHaveBeenCalledWith('connection:own-avatar', { avatar: 'blob:cached-existing', hash: 'abc123hash' })
    })
  })

  describe('fetchContactAvatarMetadata', () => {
    beforeEach(async () => {
      // Connect the client first
      const connectPromise = xmppClient.connect({
        jid: 'user@example.com',
        password: 'secret',
        server: 'example.com',
        skipDiscovery: true,
      })
      mockXmppClientInstance._emit('online', { jid: { toString: () => 'user@example.com/resource' } })
      await connectPromise
    })

    it('should fetch contact avatar metadata from XEP-0084 PEP', async () => {
      // Clear any calls from connection setup
      mockXmppClientInstance.iqCaller.request.mockClear()

      // Mock metadata response
      const metadataResponse = createMockElement('iq', { type: 'result' }, [
        {
          name: 'pubsub',
          attrs: { xmlns: 'http://jabber.org/protocol/pubsub' },
          children: [
            {
              name: 'items',
              attrs: { node: 'urn:xmpp:avatar:metadata' },
              children: [
                {
                  name: 'item',
                  attrs: { id: 'contact-avatar-hash' },
                  children: [
                    {
                      name: 'metadata',
                      attrs: { xmlns: 'urn:xmpp:avatar:metadata' },
                      children: [
                        {
                          name: 'info',
                          attrs: { id: 'contact-avatar-hash', type: 'image/png', bytes: '2048' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])

      // Mock the follow-up avatar data fetch (triggered by avatarMetadataUpdate event)
      mockXmppClientInstance.iqCaller.request
        .mockResolvedValueOnce(metadataResponse) // First: metadata query
        .mockRejectedValue(new Error('not found')) // Subsequent: data fetch fails (ok for test)

      const result = await xmppClient.profile.fetchContactAvatarMetadata('contact@example.com')

      // Should return the hash
      expect(result).toBe('contact-avatar-hash')

      // First call should be the metadata query to contact's JID
      expect(mockXmppClientInstance.iqCaller.request).toHaveBeenCalled()
      const call = mockXmppClientInstance.iqCaller.request.mock.calls[0][0]
      expect(call.attrs.to).toBe('contact@example.com')
      expect(call.attrs.type).toBe('get')
    })

    it('should fallback to vCard when contact has no XEP-0084 avatar', async () => {
      // Clear any calls from connection setup
      mockXmppClientInstance.iqCaller.request.mockClear()

      // Mock empty metadata response (no XEP-0084 avatar)
      const emptyMetadataResponse = createMockElement('iq', { type: 'result' }, [
        {
          name: 'pubsub',
          attrs: { xmlns: 'http://jabber.org/protocol/pubsub' },
          children: [
            {
              name: 'items',
              attrs: { node: 'urn:xmpp:avatar:metadata' },
              children: [
                {
                  name: 'item',
                  children: [
                    {
                      name: 'metadata',
                      attrs: { xmlns: 'urn:xmpp:avatar:metadata' },
                      // No info child means no avatar
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])

      // Mock vCard response with avatar
      const vcardResponse = createMockElement('iq', { type: 'result' }, [
        {
          name: 'vCard',
          attrs: { xmlns: 'vcard-temp' },
          children: [
            {
              name: 'PHOTO',
              children: [
                { name: 'TYPE', text: 'image/jpeg' },
                { name: 'BINVAL', text: 'base64avatardata' },
              ],
            },
          ],
        },
      ])

      mockXmppClientInstance.iqCaller.request
        .mockResolvedValueOnce(emptyMetadataResponse) // First: XEP-0084 metadata
        .mockResolvedValueOnce(vcardResponse) // Second: vCard fallback

      const result = await xmppClient.profile.fetchContactAvatarMetadata('contact@example.com')

      expect(result).toBeNull() // No XEP-0084 hash returned

      // Should have made 2 requests: XEP-0084 metadata + vCard
      expect(mockXmppClientInstance.iqCaller.request).toHaveBeenCalledTimes(2)

      // Second call should be vCard query
      const vcardCall = mockXmppClientInstance.iqCaller.request.mock.calls[1][0]
      expect(vcardCall.attrs.to).toBe('contact@example.com')
      const vcard = vcardCall.children.find((c: { name: string }) => c.name === 'vCard')
      expect(vcard?.attrs?.xmlns).toBe('vcard-temp')
    })

    it('should fallback to vCard when XEP-0084 returns error (item-not-found)', async () => {
      // Clear any calls from connection setup
      mockXmppClientInstance.iqCaller.request.mockClear()

      // Mock vCard response with avatar
      const vcardResponse = createMockElement('iq', { type: 'result' }, [
        {
          name: 'vCard',
          attrs: { xmlns: 'vcard-temp' },
          children: [
            {
              name: 'PHOTO',
              children: [
                { name: 'TYPE', text: 'image/png' },
                { name: 'BINVAL', text: 'anotherbase64data' },
              ],
            },
          ],
        },
      ])

      mockXmppClientInstance.iqCaller.request
        .mockRejectedValueOnce(new Error('item-not-found')) // First: XEP-0084 fails
        .mockResolvedValueOnce(vcardResponse) // Second: vCard fallback

      const result = await xmppClient.profile.fetchContactAvatarMetadata('contact@example.com')

      expect(result).toBeNull() // No XEP-0084 hash returned

      // Should have made 2 requests: XEP-0084 metadata (failed) + vCard
      expect(mockXmppClientInstance.iqCaller.request).toHaveBeenCalledTimes(2)

      // Second call should be vCard query
      const vcardCall = mockXmppClientInstance.iqCaller.request.mock.calls[1][0]
      const vcard = vcardCall.children.find((c: { name: string }) => c.name === 'vCard')
      expect(vcard?.attrs?.xmlns).toBe('vcard-temp')
    })

    it('should NOT fetch vCard when XEP-0084 succeeds', async () => {
      // Clear any calls from connection setup
      mockXmppClientInstance.iqCaller.request.mockClear()

      // Mock successful metadata response
      const metadataResponse = createMockElement('iq', { type: 'result' }, [
        {
          name: 'pubsub',
          attrs: { xmlns: 'http://jabber.org/protocol/pubsub' },
          children: [
            {
              name: 'items',
              attrs: { node: 'urn:xmpp:avatar:metadata' },
              children: [
                {
                  name: 'item',
                  attrs: { id: 'xep0084-hash' },
                  children: [
                    {
                      name: 'metadata',
                      attrs: { xmlns: 'urn:xmpp:avatar:metadata' },
                      children: [
                        {
                          name: 'info',
                          attrs: { id: 'xep0084-hash', type: 'image/png', bytes: '1024' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])

      // Mock the follow-up avatar data fetch (triggered by avatarMetadataUpdate event)
      const dataResponse = createMockElement('iq', { type: 'result' }, [
        {
          name: 'pubsub',
          attrs: { xmlns: 'http://jabber.org/protocol/pubsub' },
          children: [
            {
              name: 'items',
              attrs: { node: 'urn:xmpp:avatar:data' },
              children: [
                {
                  name: 'item',
                  attrs: { id: 'xep0084-hash' },
                  children: [
                    {
                      name: 'data',
                      attrs: { xmlns: 'urn:xmpp:avatar:data' },
                      text: 'iVBORw0KGgo=', // base64 PNG data
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])

      mockXmppClientInstance.iqCaller.request
        .mockResolvedValueOnce(metadataResponse) // 1st: XEP-0084 metadata
        .mockResolvedValueOnce(dataResponse) // 2nd: XEP-0084 data (from avatarMetadataUpdate event)

      const result = await xmppClient.profile.fetchContactAvatarMetadata('contact@example.com')

      expect(result).toBe('xep0084-hash')

      // Wait for async operations from the event listener to complete
      await vi.runAllTimersAsync()

      // Should have made 2 requests: XEP-0084 metadata + XEP-0084 data (from event)
      // No vCard query should be made when XEP-0084 succeeds
      const calls = mockXmppClientInstance.iqCaller.request.mock.calls
      expect(calls.length).toBeGreaterThanOrEqual(1)

      // Verify no vCard query was made (vCard uses 'vcard-temp' namespace)
      const hasVcardCall = calls.some((call: any[]) => {
        const iq = call[0]
        return iq.children?.some((child: { name: string; attrs?: { xmlns?: string } }) =>
          child.name === 'vCard' && child.attrs?.xmlns === 'vcard-temp'
        )
      })
      expect(hasVcardCall).toBe(false)
    })

    it('should emit avatarMetadataUpdate event when avatar found', async () => {
      // Clear any calls from connection setup
      mockXmppClientInstance.iqCaller.request.mockClear()

      // Mock metadata response
      const metadataResponse = createMockElement('iq', { type: 'result' }, [
        {
          name: 'pubsub',
          attrs: { xmlns: 'http://jabber.org/protocol/pubsub' },
          children: [
            {
              name: 'items',
              attrs: { node: 'urn:xmpp:avatar:metadata' },
              children: [
                {
                  name: 'item',
                  attrs: { id: 'contact-avatar-hash' },
                  children: [
                    {
                      name: 'metadata',
                      attrs: { xmlns: 'urn:xmpp:avatar:metadata' },
                      children: [
                        {
                          name: 'info',
                          attrs: { id: 'contact-avatar-hash', type: 'image/png', bytes: '2048' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])

      // Mock subsequent fetchAvatarData to prevent unhandled promise
      mockXmppClientInstance.iqCaller.request
        .mockResolvedValueOnce(metadataResponse)
        .mockRejectedValue(new Error('not found'))

      // Track emitted events
      const emittedEvents: Array<{ jid: string; hash: string | null }> = []
      xmppClient.on('avatarMetadataUpdate', (jid, hash) => {
        emittedEvents.push({ jid, hash })
      })

      await xmppClient.profile.fetchContactAvatarMetadata('contact@example.com')

      // Should emit event with the hash
      expect(emittedEvents).toContainEqual({
        jid: 'contact@example.com',
        hash: 'contact-avatar-hash',
      })
    })
  })
})
