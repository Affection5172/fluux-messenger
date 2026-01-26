/**
 * XMPP Client Name Mapping
 *
 * Maps XEP-0115 caps node URLs to friendly client names.
 * The node attribute in the <c> element typically contains a URL
 * that identifies the client software.
 */

export type ClientType = 'mobile' | 'desktop' | 'web' | 'unknown'

// Known mobile clients
const MOBILE_CLIENTS = new Set([
  'Conversations',
  'blabber.im',
  'Cheogram',
  'Monal',
  'Siskin',
  'Stork',
  'yaxim',
  'ChatSecure',
  'Fluux Mobile',
])

// Known desktop clients
const DESKTOP_CLIENTS = new Set([
  'Gajim',
  'Dino',
  'Psi',
  'Psi+',
  'Swift',
  'Pidgin',
  'Profanity',
  'mcabber',
  'Poezio',
  'Adium',
  'Miranda NG',
  'Tkabber',
  'BeagleIM',
  'Slidge',
  'Slidge WhatsApp',
  'Fluux Desktop',
])

// Known web clients
const WEB_CLIENTS = new Set([
  'Converse.js',
  'Movim',
  'Fluux',
  'Fluux Web',
  'Strophe.js',
  'xmpp.js',
])

// Known client nodes mapped to display names
const CLIENT_NODES: Record<string, string> = {
  // Mobile clients
  'https://conversations.im': 'Conversations',
  'http://conversations.im': 'Conversations',
  'https://blabber.im': 'blabber.im',
  'https://cheogram.com': 'Cheogram',
  'https://monal-im.org': 'Monal',
  'https://monal.im': 'Monal',
  'http://monal.im': 'Monal',
  'https://siskin.im': 'Siskin',
  'http://siskin.im': 'Siskin',
  'https://beagle.im': 'BeagleIM',
  'http://beagle.im': 'BeagleIM',
  'https://stork.im': 'Stork',
  'http://stork.im': 'Stork',
  'https://yaxim.org': 'yaxim',
  'http://yaxim.org': 'yaxim',
  'https://github.com/nicoco/slidge-whatsapp': 'Slidge WhatsApp',

  // Desktop clients
  'https://gajim.org': 'Gajim',
  'http://gajim.org': 'Gajim',
  'https://dino.im': 'Dino',
  'http://dino.im': 'Dino',
  'https://psi-im.org': 'Psi',
  'http://psi-im.org': 'Psi',
  'https://psi-plus.com': 'Psi+',
  'http://psi-plus.com': 'Psi+',
  'https://swift.im': 'Swift',
  'http://swift.im': 'Swift',
  'https://pidgin.im': 'Pidgin',
  'http://pidgin.im': 'Pidgin',
  'https://profanity-im.github.io': 'Profanity',
  'http://profanity-im.github.io': 'Profanity',
  'https://mcabber.com': 'mcabber',
  'http://mcabber.com': 'mcabber',
  'https://poezio.eu': 'Poezio',
  'http://poezio.eu': 'Poezio',
  'https://github.com/nicoco/slidge': 'Slidge',

  // Web clients
  'https://conversejs.org': 'Converse.js',
  'http://conversejs.org': 'Converse.js',
  'https://movim.eu': 'Movim',
  'http://movim.eu': 'Movim',
  'https://fluux.io/web': 'Fluux Web',
  'https://fluux.io/desktop': 'Fluux Desktop',
  'https://fluux.io/mobile': 'Fluux Mobile',

  // Libraries (sometimes used directly)
  'https://github.com/strophe/strophejs': 'Strophe.js',
  'http://strophe.im/strophejs': 'Strophe.js',
  'https://github.com/xmppjs/xmpp.js': 'xmpp.js',
  'https://igniterealtime.org/projects/smack': 'Smack',
  'http://www.igniterealtime.org/projects/smack': 'Smack',

  // Other clients
  'https://adium.im': 'Adium',
  'http://adium.im': 'Adium',
  'https://www.miranda-ng.org': 'Miranda NG',
  'http://www.miranda-ng.org': 'Miranda NG',
  'https://tkabber.jabber.ru': 'Tkabber',
  'http://tkabber.jabber.ru': 'Tkabber',
}

/**
 * Get the friendly client name from a caps node URL.
 * Returns the node URL itself if no mapping is found,
 * or undefined if the node is empty/undefined.
 */
export function getClientName(node: string | undefined): string | undefined {
  if (!node) return undefined

  // Try exact match first
  if (CLIENT_NODES[node]) {
    return CLIENT_NODES[node]
  }

  // Try without trailing slash
  const withoutSlash = node.replace(/\/$/, '')
  if (CLIENT_NODES[withoutSlash]) {
    return CLIENT_NODES[withoutSlash]
  }

  // Try to extract a readable name from the URL
  try {
    const url = new URL(node)
    // Use hostname without www. or common TLDs for a fallback name
    let name = url.hostname.replace(/^www\./, '')
    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1)
    return name
  } catch {
    // Not a valid URL, return as-is if it looks reasonable
    if (node.length < 50 && !node.includes(' ')) {
      return node
    }
    return undefined
  }
}

/**
 * Get the client type (mobile, desktop, web) from a client name.
 * Used to display appropriate icons in the UI.
 */
export function getClientType(clientName: string | undefined): ClientType {
  if (!clientName) return 'unknown'

  if (MOBILE_CLIENTS.has(clientName)) return 'mobile'
  if (DESKTOP_CLIENTS.has(clientName)) return 'desktop'
  if (WEB_CLIENTS.has(clientName)) return 'web'

  return 'unknown'
}
