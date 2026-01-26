/**
 * Shared draft management utilities.
 *
 * These utilities provide common draft state management logic used by both
 * chatStore and roomStore to reduce code duplication.
 */

/**
 * Set a draft for a conversation/room.
 * Empty or whitespace-only drafts are removed.
 *
 * @param drafts - Current drafts map
 * @param id - Conversation or room ID
 * @param text - Draft text to set
 * @returns New drafts map with the draft set or removed
 */
export function setDraft(
  drafts: Map<string, string>,
  id: string,
  text: string
): Map<string, string> {
  const newDrafts = new Map(drafts)
  if (text.trim()) {
    newDrafts.set(id, text)
  } else {
    newDrafts.delete(id)
  }
  return newDrafts
}

/**
 * Get a draft for a conversation/room.
 *
 * @param drafts - Current drafts map
 * @param id - Conversation or room ID
 * @returns Draft text or empty string if not found
 */
export function getDraft(
  drafts: Map<string, string>,
  id: string
): string {
  return drafts.get(id) || ''
}

/**
 * Clear a draft for a conversation/room.
 *
 * @param drafts - Current drafts map
 * @param id - Conversation or room ID
 * @returns New drafts map with the draft removed
 */
export function clearDraft(
  drafts: Map<string, string>,
  id: string
): Map<string, string> {
  const newDrafts = new Map(drafts)
  newDrafts.delete(id)
  return newDrafts
}
