/**
 * Service discovery type definitions (XEP-0030).
 *
 * @packageDocumentation
 * @module Types/Discovery
 */

/**
 * Server identity from service discovery.
 *
 * @category Discovery
 */
export interface ServerIdentity {
  /** Identity category (e.g., 'server', 'conference', 'pubsub') */
  category: string
  /** Identity type within category */
  type: string
  /** Human-readable name */
  name?: string
}

/**
 * Server information from service discovery (XEP-0030).
 *
 * Contains identities and supported features discovered from the server.
 *
 * @category Discovery
 */
export interface ServerInfo {
  /** Server domain */
  domain: string
  /** Server identities */
  identities: ServerIdentity[]
  /** Supported feature namespaces */
  features: string[]
}
