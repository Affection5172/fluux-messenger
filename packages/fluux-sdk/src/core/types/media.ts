/**
 * Media and link preview type definitions.
 *
 * @packageDocumentation
 * @module Types/Media
 */

/**
 * Link preview metadata (Open Graph Protocol).
 *
 * Used for rich URL previews attached to messages via XEP-0422 Message Fastening.
 *
 * @category Chat
 */
export interface LinkPreview {
  /** The URL being previewed (og:url) */
  url: string
  /** Page title (og:title) */
  title?: string
  /** Page description (og:description) */
  description?: string
  /** Preview image URL (og:image) */
  image?: string
  /** Site name (og:site_name) */
  siteName?: string
}
