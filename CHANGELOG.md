# Changelog

All notable changes to Fluux Messenger are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.2] - 2026-01-31

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

## [0.11.1] - 2026-01-28

### Added

- Background refresh of conversation previews after connect
- Windows system tray with hide-to-tray on close
- Native save dialog for console log export on desktop

### Changed

- Verifying connection status indicator when waking from sleep
- Quick Chat room history is now transient (XEP-0334 noStore hint)
- Linux Flatpak distribution (replaces AppImage)

### Fixed

- XEP-0446 File Metadata for image dimensions (prevents layout shift)
- Room avatar caching restored for bookmarked rooms
- Various cosmetic and mobile UX improvements

## [0.11.0] - 2026-01-26

### Added

- Room MAM detection: rooms supporting message archives skip MUC history (faster joins)
- Loading indicator while fetching message history
- Priority shown in contact profile connected devices

### Changed

- Message toolbar locks when emoji picker or menu is open
- Event-based SDK infrastructure to make the app more reactive

### Fixed

- Tooltips hide immediately when their trigger menu opens

## [0.0.1] - 2025-12-19

### Added

- First commit: Initial XMPP web client with React SDK

