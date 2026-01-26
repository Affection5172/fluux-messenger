/**
 * Well-known XMPP server WebSocket URLs
 *
 * This config maps domain names to their WebSocket endpoints.
 * Used to auto-fill the WebSocket URL field when the user types a JID
 * from a known domain.
 */

export interface ServerConfig {
  websocketUrl: string
  name?: string // Optional display name
}

/**
 * Map of domain -> server configuration
 * Add entries here for known XMPP servers
 */
export const wellKnownServers: Record<string, ServerConfig> = {
  'process-one.net': {
    websocketUrl: 'wss://chat.process-one.net/xmpp',
    name: 'ProcessOne',
  },
  'jabber.fr': {
    websocketUrl: 'wss://jabber.fr/ws',
    name: 'Jabber.fr',
  },
}

/**
 * Get WebSocket URL for a domain if it's a well-known server
 */
export function getWebsocketUrlForDomain(domain: string): string | null {
  const config = wellKnownServers[domain.toLowerCase()]
  return config?.websocketUrl ?? null
}

/**
 * Extract domain from a JID
 */
export function getDomainFromJid(jid: string): string | null {
  if (!jid) return null
  const atIndex = jid.indexOf('@')
  if (atIndex === -1) return null
  const domain = jid.slice(atIndex + 1).split('/')[0]
  return domain || null
}
