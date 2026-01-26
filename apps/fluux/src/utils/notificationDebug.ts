/**
 * Debug logging utility for notification and badge system.
 *
 * Enable via console: localStorage.setItem('DEBUG_NOTIFICATIONS', 'true')
 * Or call: window.__enableNotificationDebug?.()
 *
 * This logs events for:
 * - Desktop notifications
 * - Dock/taskbar badge updates
 * - Sidebar badge counts
 * - Rail icon badge updates
 * - Window focus changes
 * - Message arrivals
 */

type NotificationEventType =
  | 'desktop-notification'
  | 'dock-badge'
  | 'sidebar-badge'
  | 'rail-badge'
  | 'focus-change'
  | 'message-received'
  | 'unread-update'
  | 'active-conv-change'

interface NotificationDebugEvent {
  timestamp: Date
  type: NotificationEventType
  data: Record<string, unknown>
}

// Keep last 100 events for debugging
const eventLog: NotificationDebugEvent[] = []
const MAX_EVENTS = 100

function isDebugEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem('DEBUG_NOTIFICATIONS') === 'true'
}

function formatTime(): string {
  const now = new Date()
  return now.toISOString().split('T')[1].slice(0, 12) // HH:mm:ss.SSS
}

export function logNotificationEvent(
  type: NotificationEventType,
  data: Record<string, unknown>
): void {
  const event: NotificationDebugEvent = {
    timestamp: new Date(),
    type,
    data,
  }

  // Always store in log
  eventLog.push(event)
  if (eventLog.length > MAX_EVENTS) {
    eventLog.shift()
  }

  // Only console.log if debug is enabled
  if (isDebugEnabled()) {
    const prefix = `[${formatTime()}] [NOTIF]`
    const typeLabel = type.toUpperCase().padEnd(18)
    console.log(`${prefix} ${typeLabel}`, data)
  }
}

// Convenience functions for specific event types
export const notificationDebug = {
  desktopNotification: (data: { title: string; body: string; conversationId?: string; roomJid?: string }) => {
    logNotificationEvent('desktop-notification', data)
  },

  dockBadge: (data: { count: number; reason?: string; breakdown?: Record<string, number> }) => {
    logNotificationEvent('dock-badge', data)
  },

  sidebarBadge: (data: { conversationId: string; unreadCount: number; mentionsCount?: number }) => {
    logNotificationEvent('sidebar-badge', data)
  },

  railBadge: (data: { view: string; count: number; hasUnread: boolean }) => {
    logNotificationEvent('rail-badge', data)
  },

  focusChange: (data: { hasFocus: boolean; activeConversationId?: string | null; activeRoomJid?: string | null }) => {
    logNotificationEvent('focus-change', data)
  },

  messageReceived: (data: {
    conversationId?: string
    roomJid?: string
    isOutgoing: boolean
    isActive: boolean
    hasFocus: boolean
  }) => {
    logNotificationEvent('message-received', data)
  },

  unreadUpdate: (data: {
    conversationId?: string
    roomJid?: string
    unreadCount: number
    mentionsCount?: number
    reason: string
  }) => {
    logNotificationEvent('unread-update', data)
  },

  activeConvChange: (data: { from: string | null; to: string | null; hasFocus: boolean }) => {
    logNotificationEvent('active-conv-change', data)
  },
}

// Export event log for debugging
export function getNotificationEventLog(): NotificationDebugEvent[] {
  return [...eventLog]
}

// Clear event log
export function clearNotificationEventLog(): void {
  eventLog.length = 0
}

// Register global helpers for console access
if (typeof window !== 'undefined') {
   
  const win = window as any
  win.__enableNotificationDebug = () => {
    localStorage.setItem('DEBUG_NOTIFICATIONS', 'true')
    console.log('[NOTIF] Debug enabled. Refresh page to see all events.')
  }
  win.__disableNotificationDebug = () => {
    localStorage.removeItem('DEBUG_NOTIFICATIONS')
    console.log('[NOTIF] Debug disabled.')
  }
  win.__getNotificationLog = getNotificationEventLog
  win.__clearNotificationLog = clearNotificationEventLog
}
