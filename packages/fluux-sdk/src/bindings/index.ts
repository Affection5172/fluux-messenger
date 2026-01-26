/**
 * Store bindings - wire SDK events to Zustand stores.
 *
 * This module provides the binding layer between the SDK's typed event
 * system and the Zustand stores used by React applications.
 *
 * @packageDocumentation
 * @module Bindings
 */

export { createStoreBindings } from './storeBindings'
export type { StoreRefs, UnsubscribeBindings } from './storeBindings'
