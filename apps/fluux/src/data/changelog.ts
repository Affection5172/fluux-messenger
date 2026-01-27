/**
 * Changelog data for the app.
 * Update this file before each release with new features and fixes.
 */

export interface ChangelogEntry {
  version: string
  date: string
  sections: {
    type: 'added' | 'changed' | 'fixed' | 'removed'
    items: string[]
  }[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '0.11.0',
    date: '2026-01-26',
    sections: [
      {
        type: 'added',
        items: [
          'Room MAM detection: rooms supporting message archives skip MUC history (faster joins)',
          'Loading indicator while fetching message history',
          'Priority shown in contact profile connected devices',
        ],
      },
      {
        type: 'changed',
        items: [
          'Message toolbar locks when emoji picker or menu is open',
          'Event-based SDK infrastructure to make the app more reactive',
        ],
      },
      {
        type: 'fixed',
        items: [
          'Tooltips hide immediately when their trigger menu opens',
        ],
      },
    ],
  },
  {
    version: '0.0.1',
    date: '2025-12-19',
    sections: [
      {
        type: 'added',
        items: [
          'First commit: Initial XMPP web client with React SDK',
        ],
      },
    ],
  },
]
