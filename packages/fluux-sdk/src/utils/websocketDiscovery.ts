/**
 * XEP-0156: Discovering Alternative XMPP Connection Methods
 *
 * Discovers WebSocket endpoints for XMPP servers using the host-meta
 * well-known location (RFC 6415).
 *
 * @see https://xmpp.org/extensions/xep-0156.html
 * @module utils/websocketDiscovery
 */

/**
 * Relation type for WebSocket connections per XEP-0156.
 */
const REL_WEBSOCKET = 'urn:xmpp:alt-connections:websocket'

/**
 * Relation type for BOSH connections per XEP-0156.
 * Included for completeness, though we primarily use WebSocket.
 */
const REL_BOSH = 'urn:xmpp:alt-connections:xbosh'

/**
 * Host-meta link structure (JRD format).
 */
interface HostMetaLink {
  rel: string
  href: string
}

/**
 * Host-meta JSON response structure (JRD format).
 */
interface HostMetaJson {
  links?: HostMetaLink[]
}

/**
 * Discovery result containing found endpoints.
 */
export interface DiscoveryResult {
  /** WebSocket endpoint URL (wss://...) */
  websocket?: string
  /** BOSH endpoint URL (https://...) - included for completeness */
  bosh?: string
}

/**
 * Discover XMPP connection endpoints for a domain using XEP-0156.
 *
 * Attempts to fetch the host-meta file from the domain's well-known
 * location and extracts alternative connection URLs.
 *
 * @param domain - The XMPP domain to discover endpoints for (e.g., 'jabber.org')
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Discovery result with found endpoints, or empty object if discovery fails
 *
 * @example
 * ```typescript
 * const result = await discoverXmppEndpoints('jabber.org')
 * if (result.websocket) {
 *   console.log('WebSocket URL:', result.websocket)
 * }
 * ```
 */
export async function discoverXmppEndpoints(
  domain: string,
  timeout: number = 5000
): Promise<DiscoveryResult> {
  const result: DiscoveryResult = {}

  // Try JSON format first (easier to parse, more common in modern deployments)
  try {
    const jsonResult = await fetchHostMetaJson(domain, timeout)
    if (jsonResult.websocket) result.websocket = jsonResult.websocket
    if (jsonResult.bosh) result.bosh = jsonResult.bosh
    if (result.websocket) return result
  } catch {
    // JSON fetch failed, try XML
  }

  // Fall back to XML format
  try {
    const xmlResult = await fetchHostMetaXml(domain, timeout)
    if (xmlResult.websocket) result.websocket = xmlResult.websocket
    if (xmlResult.bosh) result.bosh = xmlResult.bosh
  } catch {
    // XML fetch also failed
  }

  return result
}

/**
 * Convenience function to discover just the WebSocket endpoint.
 *
 * @param domain - The XMPP domain to discover
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns WebSocket URL or null if not found
 *
 * @example
 * ```typescript
 * const wsUrl = await discoverWebSocket('jabber.org')
 * // wsUrl = 'wss://jabber.org:5443/ws' or null
 * ```
 */
export async function discoverWebSocket(
  domain: string,
  timeout: number = 5000
): Promise<string | null> {
  const result = await discoverXmppEndpoints(domain, timeout)
  return result.websocket ?? null
}

/**
 * Fetch and parse host-meta.json (JRD format).
 */
async function fetchHostMetaJson(
  domain: string,
  timeout: number
): Promise<DiscoveryResult> {
  const url = `https://${domain}/.well-known/host-meta.json`
  const response = await fetchWithTimeout(url, timeout)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data: HostMetaJson = await response.json()
  return extractEndpointsFromLinks(data.links)
}

/**
 * Fetch and parse host-meta (XRD/XML format).
 */
async function fetchHostMetaXml(
  domain: string,
  timeout: number
): Promise<DiscoveryResult> {
  const url = `https://${domain}/.well-known/host-meta`
  const response = await fetchWithTimeout(url, timeout)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const text = await response.text()
  return parseHostMetaXml(text)
}

/**
 * Fetch with timeout support.
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json, application/xrd+xml, application/xml',
      },
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Extract endpoints from JRD links array.
 */
function extractEndpointsFromLinks(links?: HostMetaLink[]): DiscoveryResult {
  const result: DiscoveryResult = {}

  if (!links || !Array.isArray(links)) {
    return result
  }

  for (const link of links) {
    if (!link.rel || !link.href) continue

    // Validate URL starts with secure protocol (per XEP-0156 security requirements)
    if (!isSecureUrl(link.href)) continue

    if (link.rel === REL_WEBSOCKET && !result.websocket) {
      result.websocket = link.href
    } else if (link.rel === REL_BOSH && !result.bosh) {
      result.bosh = link.href
    }
  }

  return result
}

/**
 * Parse XRD/XML format host-meta.
 *
 * Expected format:
 * ```xml
 * <?xml version="1.0" encoding="utf-8"?>
 * <XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
 *   <Link rel="urn:xmpp:alt-connections:websocket" href="wss://example.com/ws" />
 *   <Link rel="urn:xmpp:alt-connections:xbosh" href="https://example.com/http-bind" />
 * </XRD>
 * ```
 */
function parseHostMetaXml(xmlText: string): DiscoveryResult {
  const result: DiscoveryResult = {}

  // Simple regex-based parsing (avoids DOMParser dependency for SSR/tests)
  // Match <Link rel="..." href="..." /> elements
  const linkRegex = /<Link[^>]+rel=["']([^"']+)["'][^>]+href=["']([^"']+)["'][^>]*\/?>/gi
  const linkRegexAlt = /<Link[^>]+href=["']([^"']+)["'][^>]+rel=["']([^"']+)["'][^>]*\/?>/gi

  let match: RegExpExecArray | null

  // Try rel before href
  while ((match = linkRegex.exec(xmlText)) !== null) {
    const rel = match[1]
    const href = match[2]

    if (!isSecureUrl(href)) continue

    if (rel === REL_WEBSOCKET && !result.websocket) {
      result.websocket = href
    } else if (rel === REL_BOSH && !result.bosh) {
      result.bosh = href
    }
  }

  // Try href before rel (attribute order may vary)
  while ((match = linkRegexAlt.exec(xmlText)) !== null) {
    const href = match[1]
    const rel = match[2]

    if (!isSecureUrl(href)) continue

    if (rel === REL_WEBSOCKET && !result.websocket) {
      result.websocket = href
    } else if (rel === REL_BOSH && !result.bosh) {
      result.bosh = href
    }
  }

  return result
}

/**
 * Check if URL uses a secure protocol (required by XEP-0156).
 */
function isSecureUrl(url: string): boolean {
  return url.startsWith('wss://') || url.startsWith('https://')
}
