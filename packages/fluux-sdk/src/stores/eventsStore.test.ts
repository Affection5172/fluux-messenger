import { describe, it, expect, beforeEach } from 'vitest'
import { eventsStore } from './eventsStore'

describe('eventsStore', () => {
  beforeEach(() => {
    eventsStore.getState().reset()
  })

  describe('subscription requests', () => {
    it('should add a subscription request', () => {
      eventsStore.getState().addSubscriptionRequest('user@example.com')

      const requests = eventsStore.getState().subscriptionRequests
      expect(requests).toHaveLength(1)
      expect(requests[0].from).toBe('user@example.com')
      expect(requests[0].id).toBeDefined()
      expect(requests[0].timestamp).toBeInstanceOf(Date)
    })

    it('should not add duplicate subscription requests', () => {
      eventsStore.getState().addSubscriptionRequest('user@example.com')
      eventsStore.getState().addSubscriptionRequest('user@example.com')

      expect(eventsStore.getState().subscriptionRequests).toHaveLength(1)
    })

    it('should remove a subscription request', () => {
      eventsStore.getState().addSubscriptionRequest('user1@example.com')
      eventsStore.getState().addSubscriptionRequest('user2@example.com')

      eventsStore.getState().removeSubscriptionRequest('user1@example.com')

      const requests = eventsStore.getState().subscriptionRequests
      expect(requests).toHaveLength(1)
      expect(requests[0].from).toBe('user2@example.com')
    })
  })

  describe('stranger messages', () => {
    it('should add a stranger message', () => {
      eventsStore.getState().addStrangerMessage('stranger@example.com', 'Hello!')

      const messages = eventsStore.getState().strangerMessages
      expect(messages).toHaveLength(1)
      expect(messages[0].from).toBe('stranger@example.com')
      expect(messages[0].body).toBe('Hello!')
      expect(messages[0].id).toBeDefined()
      expect(messages[0].timestamp).toBeInstanceOf(Date)
    })

    it('should allow multiple messages from same stranger', () => {
      eventsStore.getState().addStrangerMessage('stranger@example.com', 'Hello!')
      eventsStore.getState().addStrangerMessage('stranger@example.com', 'Are you there?')

      expect(eventsStore.getState().strangerMessages).toHaveLength(2)
    })

    it('should remove all messages from a stranger', () => {
      eventsStore.getState().addStrangerMessage('stranger1@example.com', 'Hello!')
      eventsStore.getState().addStrangerMessage('stranger1@example.com', 'Again!')
      eventsStore.getState().addStrangerMessage('stranger2@example.com', 'Hi!')

      eventsStore.getState().removeStrangerMessages('stranger1@example.com')

      const messages = eventsStore.getState().strangerMessages
      expect(messages).toHaveLength(1)
      expect(messages[0].from).toBe('stranger2@example.com')
    })
  })

  describe('system notifications', () => {
    it('should add a system notification', () => {
      eventsStore.getState().addSystemNotification(
        'resource-conflict',
        'Session Replaced',
        'Another client connected'
      )

      const notifications = eventsStore.getState().systemNotifications
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('resource-conflict')
      expect(notifications[0].title).toBe('Session Replaced')
      expect(notifications[0].message).toBe('Another client connected')
      expect(notifications[0].id).toBeDefined()
      expect(notifications[0].timestamp).toBeInstanceOf(Date)
    })

    it('should add multiple system notifications', () => {
      eventsStore.getState().addSystemNotification('resource-conflict', 'Title 1', 'Message 1')
      eventsStore.getState().addSystemNotification('auth-error', 'Title 2', 'Message 2')

      expect(eventsStore.getState().systemNotifications).toHaveLength(2)
    })

    it('should remove a specific system notification by id', () => {
      eventsStore.getState().addSystemNotification('resource-conflict', 'Title 1', 'Message 1')
      eventsStore.getState().addSystemNotification('auth-error', 'Title 2', 'Message 2')

      const notifications = eventsStore.getState().systemNotifications
      const firstId = notifications[0].id

      eventsStore.getState().removeSystemNotification(firstId)

      const remaining = eventsStore.getState().systemNotifications
      expect(remaining).toHaveLength(1)
      expect(remaining[0].type).toBe('auth-error')
    })

    it('should clear all system notifications', () => {
      eventsStore.getState().addSystemNotification('resource-conflict', 'Title 1', 'Message 1')
      eventsStore.getState().addSystemNotification('auth-error', 'Title 2', 'Message 2')

      eventsStore.getState().clearSystemNotifications()

      expect(eventsStore.getState().systemNotifications).toHaveLength(0)
    })
  })

  describe('MUC invitations', () => {
    it('should add a MUC invitation', () => {
      eventsStore.getState().addMucInvitation(
        'room@conference.example.com',
        'alice@example.com',
        'Join our room!',
        undefined,
        true,
        false
      )

      const invitations = eventsStore.getState().mucInvitations
      expect(invitations).toHaveLength(1)
      expect(invitations[0].roomJid).toBe('room@conference.example.com')
      expect(invitations[0].from).toBe('alice@example.com')
      expect(invitations[0].reason).toBe('Join our room!')
      expect(invitations[0].password).toBeUndefined()
      expect(invitations[0].isDirect).toBe(true)
      expect(invitations[0].isQuickChat).toBe(false)
      expect(invitations[0].id).toBeDefined()
      expect(invitations[0].timestamp).toBeInstanceOf(Date)
    })

    it('should add invitation with password', () => {
      eventsStore.getState().addMucInvitation(
        'room@conference.example.com',
        'alice@example.com',
        undefined,
        'secret123',
        false,
        false
      )

      const invitations = eventsStore.getState().mucInvitations
      expect(invitations).toHaveLength(1)
      expect(invitations[0].password).toBe('secret123')
      expect(invitations[0].isDirect).toBe(false)
      expect(invitations[0].isQuickChat).toBe(false)
    })

    it('should add quick chat invitation with isQuickChat flag', () => {
      eventsStore.getState().addMucInvitation(
        'quickchat-user-happy-fox-a1b2@conference.example.com',
        'alice@example.com',
        'Join quick chat: deploy issue',
        undefined,
        false,
        true // isQuickChat
      )

      const invitations = eventsStore.getState().mucInvitations
      expect(invitations).toHaveLength(1)
      expect(invitations[0].isQuickChat).toBe(true)
    })

    it('should not add duplicate invitations for same room', () => {
      eventsStore.getState().addMucInvitation(
        'room@conference.example.com',
        'alice@example.com'
      )
      eventsStore.getState().addMucInvitation(
        'room@conference.example.com',
        'bob@example.com'
      )

      expect(eventsStore.getState().mucInvitations).toHaveLength(1)
      // First invitation should be kept
      expect(eventsStore.getState().mucInvitations[0].from).toBe('alice@example.com')
    })

    it('should allow invitations for different rooms', () => {
      eventsStore.getState().addMucInvitation(
        'room1@conference.example.com',
        'alice@example.com'
      )
      eventsStore.getState().addMucInvitation(
        'room2@conference.example.com',
        'alice@example.com'
      )

      expect(eventsStore.getState().mucInvitations).toHaveLength(2)
    })

    it('should remove a MUC invitation by room JID', () => {
      eventsStore.getState().addMucInvitation(
        'room1@conference.example.com',
        'alice@example.com'
      )
      eventsStore.getState().addMucInvitation(
        'room2@conference.example.com',
        'bob@example.com'
      )

      eventsStore.getState().removeMucInvitation('room1@conference.example.com')

      const invitations = eventsStore.getState().mucInvitations
      expect(invitations).toHaveLength(1)
      expect(invitations[0].roomJid).toBe('room2@conference.example.com')
    })
  })

  describe('reset', () => {
    it('should reset all state', () => {
      eventsStore.getState().addSubscriptionRequest('user@example.com')
      eventsStore.getState().addStrangerMessage('stranger@example.com', 'Hello!')
      eventsStore.getState().addMucInvitation('room@conference.example.com', 'alice@example.com')
      eventsStore.getState().addSystemNotification('resource-conflict', 'Title', 'Message')

      eventsStore.getState().reset()

      const state = eventsStore.getState()
      expect(state.subscriptionRequests).toHaveLength(0)
      expect(state.strangerMessages).toHaveLength(0)
      expect(state.mucInvitations).toHaveLength(0)
      expect(state.systemNotifications).toHaveLength(0)
    })
  })
})
