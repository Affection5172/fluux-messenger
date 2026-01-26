/**
 * UI Constants
 *
 * Shared UI-related constants used across components.
 */

import type { PresenceStatus } from '@fluux/sdk'

/**
 * Tailwind CSS classes for presence status indicator colors
 */
export const PRESENCE_COLORS: Record<PresenceStatus, string> = {
  online: 'bg-fluux-green',
  away: 'bg-fluux-yellow',
  dnd: 'bg-fluux-red',
  offline: 'bg-fluux-gray',
}
