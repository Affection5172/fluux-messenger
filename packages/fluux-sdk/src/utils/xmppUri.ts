/**
 * XMPP URI Parser (RFC 5122)
 *
 * Parses XMPP URIs in the format:
 *   xmpp:[//authority/]path[?query]
 *
 * Examples:
 *   xmpp:romeo@montague.net
 *   xmpp:romeo@montague.net?message
 *   xmpp:romeo@montague.net?message;body=Hello
 *   xmpp:coven@chat.shakespeare.lit?join
 *   xmpp:coven@chat.shakespeare.lit?join;password=secret
 */

/**
 * Parsed XMPP URI components
 */
export interface XmppUri {
  /** The JID (user@domain or user@domain/resource) */
  jid: string
  /** The action to perform (message, join, subscribe, etc.) */
  action?: string
  /** Action parameters */
  params: Record<string, string>
}

/**
 * Parse an XMPP URI string into its components.
 * Returns null if the URI is invalid.
 *
 * @param uri - The XMPP URI to parse (e.g., "xmpp:user@example.com?message")
 * @returns Parsed URI components or null if invalid
 *
 * @example
 * ```typescript
 * const result = parseXmppUri('xmpp:romeo@montague.net?message;body=Hello')
 * // { jid: 'romeo@montague.net', action: 'message', params: { body: 'Hello' } }
 * ```
 */
export function parseXmppUri(uri: string): XmppUri | null {
  // Ensure it starts with xmpp:
  if (!uri.startsWith('xmpp:')) {
    return null
  }

  // Remove the scheme
  let remaining = uri.slice(5)

  // Handle authority (//authority/) - rarely used but supported
  if (remaining.startsWith('//')) {
    const authEnd = remaining.indexOf('/', 2)
    if (authEnd !== -1) {
      remaining = remaining.slice(authEnd + 1)
    } else {
      // Invalid: authority without path
      return null
    }
  }

  // Split path and query
  const queryStart = remaining.indexOf('?')
  let jid: string
  let queryString: string | undefined

  if (queryStart !== -1) {
    jid = remaining.slice(0, queryStart)
    queryString = remaining.slice(queryStart + 1)
  } else {
    jid = remaining
  }

  // Decode the JID
  jid = decodeURIComponent(jid)

  // Validate JID has at least user@domain format
  if (!jid.includes('@')) {
    return null
  }

  // Parse query string
  let action: string | undefined
  const params: Record<string, string> = {}

  if (queryString) {
    // RFC 5122 uses semicolons as parameter separators
    const parts = queryString.split(';')

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === 0) {
        // First part is the action (e.g., "message", "join")
        if (part.includes('=')) {
          // No action, just parameters
          const [key, value] = part.split('=', 2)
          params[decodeURIComponent(key)] = decodeURIComponent(value || '')
        } else {
          action = decodeURIComponent(part)
        }
      } else {
        // Subsequent parts are parameters
        const eqIndex = part.indexOf('=')
        if (eqIndex !== -1) {
          const key = decodeURIComponent(part.slice(0, eqIndex))
          const value = decodeURIComponent(part.slice(eqIndex + 1))
          params[key] = value
        } else {
          // Boolean parameter (presence means true)
          params[decodeURIComponent(part)] = ''
        }
      }
    }
  }

  return { jid, action, params }
}

/**
 * Determine if a JID looks like a MUC room JID.
 * This is a heuristic based on common MUC service naming conventions.
 *
 * @param jid - The JID to check
 * @returns true if the JID appears to be a MUC room
 *
 * @example
 * ```typescript
 * isMucJid('room@conference.example.org') // true
 * isMucJid('user@example.org') // false
 * ```
 */
export function isMucJid(jid: string): boolean {
  const domain = jid.split('@')[1]?.split('/')[0] || ''
  const domainLower = domain.toLowerCase()

  // Common MUC service prefixes
  return (
    domainLower.startsWith('conference.') ||
    domainLower.startsWith('muc.') ||
    domainLower.startsWith('chat.') ||
    domainLower.startsWith('rooms.') ||
    domainLower.startsWith('groupchat.')
  )
}
