/**
 * Test utilities for React Router integration tests.
 *
 * Provides wrapper components and helpers for testing components that use routing.
 */
import { ReactNode } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

interface RouterWrapperProps {
  children: ReactNode
  initialEntries?: string[]
}

/**
 * Wraps children with a MemoryRouter for testing.
 * Use this when testing components that use useNavigate, useLocation, etc.
 *
 * @example
 * ```tsx
 * render(
 *   <RouterWrapper initialEntries={['/messages/user@example.com']}>
 *     <ChatLayout />
 *   </RouterWrapper>
 * )
 * ```
 */
export function RouterWrapper({ children, initialEntries = ['/'] }: RouterWrapperProps) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  )
}

/**
 * Wraps children with a MemoryRouter and a catch-all Route.
 * Use this when the component doesn't need specific route params.
 */
export function RouterWrapperWithRoutes({ children, initialEntries = ['/'] }: RouterWrapperProps) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="*" element={children} />
      </Routes>
    </MemoryRouter>
  )
}

/**
 * Creates a wrapper function for use with @testing-library/react's render.
 *
 * @example
 * ```tsx
 * const { result } = renderHook(() => useNavigate(), {
 *   wrapper: createRouterWrapper(['/messages']),
 * })
 * ```
 */
export function createRouterWrapper(initialEntries: string[] = ['/']) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    )
  }
}
