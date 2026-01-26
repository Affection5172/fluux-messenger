/**
 * Shared wake coordination to prevent multiple hooks from handling wake simultaneously.
 *
 * When the system wakes from sleep, multiple events can fire at once:
 * - Time-gap detection (setInterval catching up)
 * - Visibility change (document becoming visible)
 * - OS notifications (system-did-wake in Tauri)
 *
 * Without coordination, each hook (useWakeDetector, useAutoAway, etc.) would
 * process these independently, causing cascading state updates and potential
 * render storms that freeze the UI.
 *
 * This module provides a shared guard that only allows one wake handler
 * to run at a time across all hooks.
 */

import { startWakeGracePeriod } from './renderLoopDetector'

let isHandlingWake = false
let lastWakeTime = 0

/**
 * Global heartbeat timestamp for time-gap detection.
 * This is shared across all component instances to prevent multiple
 * wake detections when components re-render rapidly.
 */
let globalLastHeartbeat = Date.now()

/**
 * Minimum time between wake handling (ms).
 * Prevents rapid-fire wake events from causing multiple handling cycles.
 */
const WAKE_DEBOUNCE_MS = 2000

/**
 * Minimum time gap that indicates system sleep (ms).
 */
const SLEEP_THRESHOLD_MS = 30_000

/**
 * Try to acquire the wake handling lock.
 * Returns true if this caller should handle wake, false if another handler is already active.
 *
 * @param source - Identifier for debugging (e.g., 'useWakeDetector:time-gap')
 */
export function tryAcquireWakeLock(source: string): boolean {
  const now = Date.now()

  // Already handling wake
  if (isHandlingWake) {
    console.log(`[WakeCoordinator] ${source} skipped - another handler is active`)
    return false
  }

  // Too soon after last wake handling
  if (now - lastWakeTime < WAKE_DEBOUNCE_MS) {
    console.log(`[WakeCoordinator] ${source} skipped - debounce (${now - lastWakeTime}ms since last)`)
    return false
  }

  isHandlingWake = true
  lastWakeTime = now
  console.log(`[WakeCoordinator] ${source} acquired lock`)

  // Start grace period for render loop detector to suppress expected warnings
  startWakeGracePeriod()

  return true
}

/**
 * Release the wake handling lock.
 * Should be called when wake handling is complete (including after async operations).
 */
export function releaseWakeLock(): void {
  isHandlingWake = false
  console.log('[WakeCoordinator] Lock released')
}

/**
 * Check if wake handling is currently in progress.
 */
export function isWakeHandlingActive(): boolean {
  return isHandlingWake
}

/**
 * Check for time-gap based wake detection using global heartbeat.
 * Returns the gap in seconds if a wake was detected, or null otherwise.
 *
 * This uses a global timestamp to prevent multiple component instances
 * from detecting the same sleep gap when they re-render rapidly.
 *
 * @param source - Identifier for debugging
 */
export function checkTimeGapWake(source: string): number | null {
  const now = Date.now()
  const elapsed = now - globalLastHeartbeat
  globalLastHeartbeat = now

  if (elapsed >= SLEEP_THRESHOLD_MS) {
    // Significant time gap detected - system likely woke from sleep
    // But still need to acquire the lock to handle it
    if (tryAcquireWakeLock(source)) {
      return Math.round(elapsed / 1000)
    }
    // Lock not acquired (already being handled or debounced)
    return null
  }

  return null
}

/**
 * Update the global heartbeat timestamp.
 * Call this on each heartbeat interval to track the expected time.
 */
export function updateHeartbeat(): void {
  globalLastHeartbeat = Date.now()
}

/**
 * Reset the coordinator state. Useful for testing.
 */
export function resetWakeCoordinator(): void {
  isHandlingWake = false
  lastWakeTime = 0
  globalLastHeartbeat = Date.now()
}
