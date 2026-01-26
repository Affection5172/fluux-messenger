/**
 * XEP-0428 Fallback Indication Utilities
 *
 * Shared utilities for processing fallback text in XMPP messages.
 * Used by both live message handling (MessageHandler) and MAM queries (XMPPClient).
 */

import type { Element } from '@xmpp/client'
import { NS_FALLBACK, NS_FALLBACK_LEGACY, NS_REPLY } from '../core/namespaces'

export interface FallbackProcessingResult {
  processedBody: string
  fallbackBody?: string // For replies - extracted fallback text when original not found
}

export interface FallbackProcessingOptions {
  /** Valid 'for' attribute values to process (e.g., NS_REPLY, NS_OOB, NS_CORRECTION) */
  validTargets: string[]
  /** How to clean whitespace after stripping fallback text */
  trimMode?: 'full' | 'leading-newlines'
}

/**
 * Get fallback element, checking both standard and legacy namespaces.
 * XEP-0428 uses urn:xmpp:fallback:0, but some clients use the older urn:xmpp:feature-fallback:0
 */
export function getFallbackElement(stanza: Element): { element: Element; namespace: string } | null {
  // Try standard namespace first
  let fallbackEl = stanza.getChild('fallback', NS_FALLBACK)
  if (fallbackEl) {
    return { element: fallbackEl, namespace: NS_FALLBACK }
  }
  // Try legacy namespace
  fallbackEl = stanza.getChild('fallback', NS_FALLBACK_LEGACY)
  if (fallbackEl) {
    return { element: fallbackEl, namespace: NS_FALLBACK_LEGACY }
  }
  return null
}

/**
 * XEP-0428: Process fallback indication and strip fallback text from body.
 * Handles fallbacks for replies (NS_REPLY), attachments (NS_OOB), and corrections (NS_CORRECTION).
 *
 * @param messageStanza - The message stanza containing the fallback element
 * @param body - The original message body
 * @param options - Processing options (validTargets, trimMode)
 * @param replyTo - Optional ReplyInfo to populate fallbackBody for replies
 * @returns The processed body and optional fallback body for replies
 */
export function processFallback(
  messageStanza: Element,
  body: string,
  options: FallbackProcessingOptions,
  replyTo?: { id: string; to?: string }
): FallbackProcessingResult {
  const { validTargets, trimMode = 'full' } = options

  const fallbackResult = getFallbackElement(messageStanza)
  if (!fallbackResult) {
    return { processedBody: body }
  }

  const fallbackFor = fallbackResult.element.attrs.for
  if (!validTargets.includes(fallbackFor)) {
    return { processedBody: body }
  }

  // Note: <body> inside <fallback> inherits the fallback namespace
  const bodyRange = fallbackResult.element.getChild('body', fallbackResult.namespace)
  if (!bodyRange) {
    return { processedBody: body }
  }

  const start = parseInt(bodyRange.attrs.start, 10)
  const end = parseInt(bodyRange.attrs.end, 10)

  if (isNaN(start) || isNaN(end) || start < 0 || end <= start || end > body.length) {
    return { processedBody: body }
  }

  let fallbackBody: string | undefined

  // For replies, extract and save the fallback text (for when original not found)
  if (fallbackFor === NS_REPLY && replyTo) {
    const fallbackText = body.slice(start, end)
    // Parse fallback format: "> Author: message\n" - extract just the message
    const fallbackMatch = fallbackText.match(/^> [^:]+: (.+)$/m)
    fallbackBody = fallbackMatch ? fallbackMatch[1] : fallbackText.replace(/^> /, '')
  }

  // Remove the fallback portion from the body
  let processedBody = body.slice(0, start) + body.slice(end)

  // Clean up whitespace based on trim mode
  if (trimMode === 'full') {
    processedBody = processedBody.trim()
  } else {
    processedBody = processedBody.replace(/^\n+/, '')
  }

  return { processedBody, fallbackBody }
}
