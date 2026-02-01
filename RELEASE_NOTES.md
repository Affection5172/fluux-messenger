## What's New in v0.11.2

### Added

- Keyboard shortcut improvements (Cmd+K in composer, better macOS Alt shortcuts)
- Debian packaging and aarch64 Linux support
- Developer documentation (DEVELOPMENT.md)

### Changed

- Command palette selection is now more visually distinct
- Reply quote text size increased for better readability
- Thumbnail resolution increased from 256px to 512px
- Fonts embedded locally (removed Google Fonts dependency)

### Fixed

- Connection stability: fixed reconnection loops and race conditions
- MAM loading race conditions in both chats and rooms
- Wake-from-sleep detection when app stays in background (macOS)
- Scroll-to-original message with special characters in IDs
- Message view alignment when clicking notification to open conversation
- German and Polish translation diacritics
- Reaction tooltip now shows localized "you" with proper nickname

---
[Full Changelog](https://github.com/processone/fluux-messenger/blob/main/CHANGELOG.md)
