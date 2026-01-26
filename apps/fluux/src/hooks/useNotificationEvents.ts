/**
 * Notification events hook - re-exports the SDK version.
 *
 * The SDK provides the core notification logic that determines when to fire
 * notification callbacks (skip outgoing, skip delayed, check window visibility, etc.)
 *
 * This re-export allows app-level code to import from '@/hooks' consistently
 * while the actual logic lives in the SDK.
 */
export { useNotificationEvents } from '@fluux/sdk'
export type { NotificationEventHandlers } from '@fluux/sdk'
