/**
 * Global test setup file for Vitest.
 *
 * This file is loaded before each test file and sets up global mocks.
 */

// Mock global fetch to prevent real network calls in tests
// This prevents XEP-0156 WebSocket discovery from making actual HTTP requests
const mockFetch = () =>
  Promise.reject(new Error('Test mock: Network request not allowed'))

global.fetch = mockFetch as typeof fetch
