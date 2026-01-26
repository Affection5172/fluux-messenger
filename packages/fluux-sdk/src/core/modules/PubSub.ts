/**
 * PubSub Module (XEP-0060)
 *
 * Handles incoming PubSub events from message stanzas. PubSub is a publish-subscribe
 * mechanism used by many XMPP extensions including:
 *
 * - XEP-0084: User Avatar (avatar metadata notifications)
 * - XEP-0172: User Nickname (nickname updates)
 * - XEP-0118: User Tune
 * - XEP-0108: User Activity
 * - And many more...
 *
 * This module processes incoming PubSub event notifications and dispatches them
 * to the appropriate handlers (e.g., Profile for avatar/nickname updates).
 *
 * @example
 * ```typescript
 * // PubSub events are handled automatically when receiving messages
 * // The module will trigger avatar fetches and roster updates as needed
 * ```
 *
 * @category Modules
 */
import type { Element } from '@xmpp/client'
import { BaseModule } from './BaseModule'
import { getBareJid } from '../jid'
import { NS_PUBSUB, NS_NICK } from '../namespaces'

/**
 * PubSub module for handling XEP-0060 PubSub events.
 *
 * Processes incoming PubSub event messages and dispatches to appropriate handlers.
 *
 * @category Modules
 */
export class PubSub extends BaseModule {
  /**
   * Handle incoming stanzas - specifically message stanzas containing PubSub events.
   */
  handle(stanza: Element): boolean | void {
    if (stanza.is('message')) {
      const pubsubEvent = stanza.getChild('event', NS_PUBSUB + '#event')
      if (pubsubEvent) {
        const from = stanza.attrs.from
        if (from) {
          this.handlePubSubEvent(from, pubsubEvent)
        }
        return true
      }
    }
    return false
  }

  /**
   * Handle a PubSub event element.
   *
   * This method can be called directly for synthetic events (e.g., from
   * vcard-temp:x:update presence which is translated to a PubSub-like event
   * for consistent avatar handling).
   *
   * @param from - The JID the event is from
   * @param event - The PubSub event element
   */
  handlePubSubEvent(from: string, event: Element): void {
    const items = event.getChild('items')
    if (!items) return

    const node = items.attrs.node
    const bareFrom = getBareJid(from)

    // XEP-0084: User Avatar (Metadata)
    if (node === 'urn:xmpp:avatar:metadata') {
      this.handleAvatarMetadata(bareFrom, items)
    }

    // XEP-0172: User Nickname
    if (node === NS_NICK) {
      this.handleNicknameUpdate(bareFrom, items)
    }

    // Additional PubSub nodes can be handled here in the future:
    // - urn:xmpp:tune (XEP-0118: User Tune)
    // - http://jabber.org/protocol/activity (XEP-0108: User Activity)
    // - http://jabber.org/protocol/mood (XEP-0107: User Mood)
    // - http://jabber.org/protocol/geoloc (XEP-0080: User Location)
  }

  /**
   * Handle XEP-0084 User Avatar metadata notification.
   * Triggers avatar data fetch when new avatar is published.
   */
  private handleAvatarMetadata(bareFrom: string, items: Element): void {
    const item = items.getChild('item')
    const metadata = item?.getChild('metadata', 'urn:xmpp:avatar:metadata')
    const info = metadata?.getChild('info')

    if (info) {
      const hash = info.attrs.id
      if (hash) {
        // Emit event for Profile module to fetch avatar data
        this.deps.emit('avatarMetadataUpdate', bareFrom, hash)
      }
    } else if (item && !metadata) {
      // Avatar removed - empty item means avatar was deleted
      this.deps.emit('avatarMetadataUpdate', bareFrom, null)
    }
  }

  /**
   * Handle XEP-0172 User Nickname update.
   * Updates the contact's name in the roster.
   */
  private handleNicknameUpdate(bareFrom: string, items: Element): void {
    const item = items.getChild('item')
    const nick = item?.getChild('nick', NS_NICK)?.text()

    if (nick) {
      // SDK event only - binding calls store.updateContact
      this.deps.emitSDK('roster:contact-updated', { jid: bareFrom, updates: { name: nick } })
    }
  }
}
