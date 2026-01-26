# SDK Hook Subscription Patterns

This document explains how to properly use SDK hooks to avoid render loops during message loading.

## The Problem

The SDK provides high-level hooks like `useChat()` and `useRoom()` that bundle together:
- **State that changes frequently** (e.g., `activeMessages` during MAM history loading)
- **Stable function references** (e.g., `setActiveConversation`, `sendMessage`)

When a component uses these hooks but only needs the stable functions, it will still re-render whenever messages change because React sees the hook's return value as different.

### Example of the Problem

```tsx
// BAD: This component re-renders 200+ times/sec during MAM loading
function NavigationButton() {
  const { setActiveConversation } = useChat()  // Subscribes to ALL state including messages

  return <button onClick={() => setActiveConversation('foo')}>Navigate</button>
}
```

## The Solution

For components that only need stable actions (setters), use direct store subscriptions:

```tsx
// GOOD: This component only re-renders when setActiveConversation changes (never)
function NavigationButton() {
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)

  return <button onClick={() => setActiveConversation('foo')}>Navigate</button>
}
```

## Decision Tree

When importing from `@fluux/sdk`, ask yourself:

1. **Does this component display messages?**
   - YES → Use `useChat()` or `useRoom()` - you need `activeMessages`
   - NO → Continue to #2

2. **Does this component need conversation/room lists?**
   - YES → Use `useChat()` or `useRoom()` - you need `conversations`/`rooms`
   - NO → Continue to #3

3. **Does this component only need actions (setters)?**
   - YES → Use direct store subscriptions:
     - `useChatStore((s) => s.setActiveConversation)`
     - `useRoomStore((s) => s.setActiveRoom)`
   - NO → Use the full hooks

## Components Using Each Pattern

### Full Hooks (Need message/conversation state)
- `ChatView` - displays messages
- `RoomView` - displays messages
- `ConversationList` - displays conversation list
- `Sidebar` - displays conversation/room counts

### Direct Store Subscriptions (Only need setters)
- `ChatLayout` - only needs `setActiveConversation`, `setActiveRoom`
- `useViewNavigation` - only needs setters for navigation
- `BrowseRoomsModal` - only needs `setActiveConversation` to clear state
- `CreateQuickChatModal` - only needs `setActiveConversation` to clear state
- `EventsView` - only needs setters for navigation
- `RoomsList` - only needs `setActiveConversation` to clear state

## Store Subscription Syntax

```tsx
import { useChatStore, useRoomStore } from '@fluux/sdk'

// Subscribe to a single value (stable function)
const setActiveConversation = useChatStore((s) => s.setActiveConversation)

// Subscribe to a primitive value (re-renders only when this value changes)
const activeConversationId = useChatStore((s) => s.activeConversationId)

// Subscribe to a count instead of the full object (avoids re-renders on content changes)
const conversationCount = useChatStore((s) => s.conversations?.size ?? 0)
```

## Testing Components with Store Subscriptions

When a component uses `useChatStore((s) => s.field)` directly, mocks need to handle the callable pattern:

```tsx
vi.mock('@fluux/sdk', () => ({
  // Make useChatStore callable AND have getState
  useChatStore: Object.assign(
    (selector: (state: any) => any) => selector({
      setActiveConversation: mockSetActiveConversation,
      activeConversationId: null,
      // ... other fields
    }),
    { getState: () => ({ ... }) }
  ),
}))
```

## Architectural Improvement (Future)

Consider splitting the SDK hooks:
- `useChatState()` - subscribes to state, returns memoized arrays/objects
- `useChatActions()` - returns stable function references only

This would make the API clearer and prevent accidental render loops.
