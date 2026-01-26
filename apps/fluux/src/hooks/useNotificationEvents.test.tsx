/**
 * Test that useNotificationEvents is properly re-exported from the SDK.
 * The comprehensive notification logic tests are in the SDK package.
 */
import { describe, it, expect } from 'vitest'
import * as exports from './useNotificationEvents'
import * as sdkExports from '@fluux/sdk'

describe('useNotificationEvents re-export', () => {
  it('should re-export useNotificationEvents from SDK', () => {
    expect(exports.useNotificationEvents).toBe(sdkExports.useNotificationEvents)
  })

  it('should re-export NotificationEventHandlers type', () => {
    // Type-level test - if this compiles, the type is exported correctly
    const handlers: exports.NotificationEventHandlers = {
      onConversationMessage: () => {},
      onRoomMessage: () => {},
    }
    expect(handlers).toBeDefined()
  })
})
