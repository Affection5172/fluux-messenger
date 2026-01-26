/**
 * Word list for generating human-readable Quick Chat room slugs.
 * Used to create memorable room names like "sunny-river-a1b2"
 */

const ADJECTIVES = [
  'sunny', 'quick', 'bright', 'swift', 'calm', 'bold', 'cool', 'warm',
  'happy', 'fresh', 'light', 'clear', 'soft', 'sharp', 'smart', 'kind',
  'quiet', 'wild', 'free', 'wise', 'deep', 'fair', 'keen', 'pure',
  'brave', 'true', 'live', 'open', 'blue', 'green', 'red', 'gold'
]

const NOUNS = [
  'river', 'forest', 'cloud', 'meadow', 'stream', 'peak', 'wave', 'path',
  'star', 'moon', 'sun', 'tree', 'lake', 'wind', 'sky', 'field',
  'hill', 'stone', 'leaf', 'rain', 'snow', 'fire', 'earth', 'sea',
  'bird', 'wolf', 'bear', 'fox', 'hawk', 'owl', 'deer', 'lion'
]

/**
 * Generate a random slug for Quick Chat room names.
 * Format: {adjective}-{noun}-{4-char-suffix}
 * Example: "sunny-river-a1b2"
 */
export function generateQuickChatSlug(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${adj}-${noun}-${suffix}`
}
