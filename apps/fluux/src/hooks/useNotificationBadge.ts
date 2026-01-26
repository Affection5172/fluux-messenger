import { useEffect, useRef, useState } from 'react'
import { chatStore, useEvents } from '@fluux/sdk'
import { useChatStore, useRoomStore } from '@fluux/sdk/react'
import { notificationDebug } from '@/utils/notificationDebug'

// Check if running in Tauri (v2 uses __TAURI_INTERNALS__)
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

// Set Tauri dock/taskbar badge
async function setTauriBadge(count: number): Promise<void> {
  if (!isTauri()) return

  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const window = getCurrentWindow()
    // Pass undefined to clear badge, number to set it
    await window.setBadgeCount(count > 0 ? count : undefined)
  } catch {
    // Badge API may not be available on all platforms
  }
}

// Browser favicon badge implementation
class FaviconBadge {
  private originalFavicon: string | null = null
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private faviconLink: HTMLLinkElement | null = null
  private faviconImage: HTMLImageElement | null = null
  private isReady = false

  constructor() {
    if (typeof document === 'undefined') return

    this.canvas = document.createElement('canvas')
    this.canvas.width = 32
    this.canvas.height = 32
    this.ctx = this.canvas.getContext('2d')

    // Find or create favicon link
    this.faviconLink = document.querySelector('link[rel="icon"]')
    if (!this.faviconLink) {
      this.faviconLink = document.createElement('link')
      this.faviconLink.rel = 'icon'
      document.head.appendChild(this.faviconLink)
    }

    // Store original favicon
    this.originalFavicon = this.faviconLink.href || '/favicon.png'

    // Load the original favicon image
    this.faviconImage = new Image()
    this.faviconImage.crossOrigin = 'anonymous'
    this.faviconImage.onload = () => {
      this.isReady = true
    }
    this.faviconImage.src = this.originalFavicon
  }

  setBadge(count: number): void {
    if (!this.ctx || !this.canvas || !this.faviconLink) return

    // Clear canvas
    this.ctx.clearRect(0, 0, 32, 32)

    // Draw original favicon if loaded
    if (this.isReady && this.faviconImage) {
      this.ctx.drawImage(this.faviconImage, 0, 0, 32, 32)
    } else {
      // Fallback: draw a simple icon
      this.ctx.fillStyle = '#5865F2'
      this.ctx.fillRect(0, 0, 32, 32)
    }

    // Draw badge if count > 0
    if (count > 0) {
      // Red circle
      this.ctx.beginPath()
      this.ctx.arc(24, 8, 8, 0, 2 * Math.PI)
      this.ctx.fillStyle = '#ED4245'
      this.ctx.fill()

      // Badge text
      if (count < 100) {
        this.ctx.fillStyle = '#FFFFFF'
        this.ctx.font = 'bold 10px sans-serif'
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(count.toString(), 24, 9)
      }
    }

    // Update favicon
    this.faviconLink.href = this.canvas.toDataURL('image/png')
  }

  reset(): void {
    if (this.faviconLink && this.originalFavicon) {
      this.faviconLink.href = this.originalFavicon
    }
  }
}

/**
 * Hook to manage notification badges for unread messages and inbox events.
 * - In Tauri: Sets the dock/taskbar badge count
 * - In Browser: Updates the favicon with a notification indicator
 *
 * The badge calculation is self-contained in a single effect to avoid race conditions
 * between multiple effects and state updates. This ensures the badge is always accurate
 * even when the app is backgrounded.
 *
 * IMPORTANT: This hook uses direct store subscriptions to avoid render loops.
 * Subscribing to conversations array causes re-renders during MAM loading when
 * lastMessage updates frequently. We only subscribe to the specific values needed.
 */
export function useNotificationBadge(): void {
  // NOTE: Use direct store subscriptions instead of useChat()/useRoom() hooks.
  // Those hooks subscribe to conversations/rooms arrays which change during MAM loading,
  // causing unnecessary re-renders. We only need specific derived values here.
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const { pendingCount: eventsPendingCount } = useEvents()
  const roomsWithUnreadCount = useRoomStore((s) => s.roomsWithUnreadCount())

  // Subscribe to the last message ID of the active conversation.
  // This triggers re-render when a new message arrives in the active conversation,
  // without subscribing to the full conversations array.
  const activeConvLastMessageId = useChatStore((s) => {
    const activeId = s.activeConversationId
    if (!activeId) return null
    const conv = s.conversations.get(activeId)
    return conv?.lastMessage?.id ?? null
  })

  // Also track conversations with unread count - this is needed to show badge
  // when messages arrive in non-active conversations
  const conversationsWithUnread = useChatStore((s) => {
    let count = 0
    for (const conv of s.conversations.values()) {
      if (conv.unreadCount > 0) count++
    }
    return count
  })
  const faviconBadgeRef = useRef<FaviconBadge | null>(null)
  // Track the last message ID that was "seen" (visible with window focused)
  const lastSeenMessageIdRef = useRef<string | null>(null)
  // Track the conversation ID when we last updated lastSeenMessageIdRef
  const lastSeenConversationIdRef = useRef<string | null>(null)
  // Track window focus state to trigger badge recalculation when focus changes
  // This is necessary because refs don't trigger re-renders, but we need to
  // recalculate the badge when the user focuses the window after seeing messages
  const [windowFocused, setWindowFocused] = useState(() =>
    typeof document !== 'undefined' ? document.hasFocus() : true
  )

  // Initialize favicon badge handler (browser only)
  useEffect(() => {
    if (!isTauri() && typeof document !== 'undefined') {
      faviconBadgeRef.current = new FaviconBadge()
    }

    return () => {
      faviconBadgeRef.current?.reset()
    }
  }, [])

  // Handle focus events to update what messages have been "seen" and trigger badge recalculation
  // NOTE: Uses getState() to read current conversation data without subscribing to changes
  useEffect(() => {
    const handleFocus = () => {
      // Use getState() to get current data without creating a subscription
      const conversations = Array.from(chatStore.getState().conversations.values())
      const currentActiveId = chatStore.getState().activeConversationId
      const activeConv = conversations.find(c => c.id === currentActiveId)
      if (activeConv?.lastMessage) {
        lastSeenMessageIdRef.current = activeConv.lastMessage.id
        lastSeenConversationIdRef.current = currentActiveId
      }
      // Update focus state to trigger badge recalculation
      // This is critical: without this, the badge effect won't re-run when focus changes
      setWindowFocused(true)
      notificationDebug.focusChange({
        hasFocus: true,
        activeConversationId: currentActiveId,
      })
    }

    const handleBlur = () => {
      setWindowFocused(false)
      notificationDebug.focusChange({
        hasFocus: false,
        activeConversationId: chatStore.getState().activeConversationId,
      })
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, []) // No dependencies - event handlers use getState()

  // Update badge when unread count changes or focus state changes
  // This effect is self-contained - it computes everything needed for the badge
  // in a single pass, avoiding race conditions between multiple effects
  //
  // NOTE: We subscribe to specific derived values (conversationsWithUnread, activeConvLastMessageId)
  // rather than the full conversations array to minimize re-renders during MAM loading.
  useEffect(() => {
    // Use the pre-computed count from subscription
    const conversationsUnreadCount = conversationsWithUnread

    // Check if active conversation has unseen messages while window is not focused
    // This is computed directly here instead of relying on a separate state variable
    // to avoid race conditions between effects
    let activeConvUnseenCount = 0
    // Read active conversation details using getState() - the effect re-runs when
    // activeConvLastMessageId changes, so we'll detect new messages
    const activeConv = activeConversationId
      ? chatStore.getState().conversations.get(activeConversationId)
      : undefined

    if (activeConv?.lastMessage && !activeConv.lastMessage.isOutgoing) {
      const lastMessageId = activeConv.lastMessage.id

      if (windowFocused) {
        // Window is focused - update what we've "seen"
        lastSeenMessageIdRef.current = lastMessageId
        lastSeenConversationIdRef.current = activeConversationId
        notificationDebug.unreadUpdate({
          conversationId: activeConversationId ?? undefined,
          unreadCount: 0,
          reason: 'window-focused-mark-seen',
        })
      } else {
        // Window is not focused - check if there's a new unseen message
        // Also check if we're still on the same conversation (if user switched
        // conversations while backgrounded, we need to reset the seen tracking)
        const isSameConversation = lastSeenConversationIdRef.current === activeConversationId
        const hasNewMessage = lastMessageId !== lastSeenMessageIdRef.current

        if (!isSameConversation) {
          // Switched to a different conversation while backgrounded
          // Any message here is "new" relative to what we saw
          activeConvUnseenCount = 1
          notificationDebug.unreadUpdate({
            conversationId: activeConversationId ?? undefined,
            unreadCount: 1,
            reason: 'switched-conversation-while-unfocused',
          })
        } else if (hasNewMessage) {
          // Same conversation, but there's a new message we haven't seen
          activeConvUnseenCount = 1
          notificationDebug.unreadUpdate({
            conversationId: activeConversationId ?? undefined,
            unreadCount: 1,
            reason: 'active-conv-new-message-unfocused',
          })
        }
      }
    }

    let totalCount = conversationsUnreadCount + activeConvUnseenCount

    // Add events pending count (subscription requests, stranger messages)
    totalCount += eventsPendingCount

    // Add rooms with unread activity (mentions or notifyAll messages)
    totalCount += roomsWithUnreadCount

    notificationDebug.dockBadge({
      count: totalCount,
      reason: 'badge-update',
      breakdown: {
        conversationsUnread: conversationsUnreadCount,
        activeConvUnseen: activeConvUnseenCount,
        eventsPending: eventsPendingCount,
        roomsUnread: roomsWithUnreadCount,
      },
    })

    if (isTauri()) {
      setTauriBadge(totalCount)
    } else if (faviconBadgeRef.current) {
      faviconBadgeRef.current.setBadge(totalCount)
    }
  }, [activeConversationId, activeConvLastMessageId, conversationsWithUnread, eventsPendingCount, roomsWithUnreadCount, windowFocused])
}
