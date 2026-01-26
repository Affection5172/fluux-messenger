import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRoom, type Room } from '@fluux/sdk'
import { X, UserPlus, Send, Loader2 } from 'lucide-react'
import { ContactSelector } from './ContactSelector'

interface InviteToRoomModalProps {
  isOpen: boolean
  onClose: () => void
  room: Room
}

/**
 * Modal for inviting contacts to a MUC room.
 * Uses XEP-0045 mediated invitations.
 */
export function InviteToRoomModal({ isOpen, onClose, room }: InviteToRoomModalProps) {
  const { t } = useTranslation()
  const { inviteMultipleToRoom } = useRoom()
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedContacts([])
      setReason('')
      setError(null)
      setIsInviting(false)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Get list of JIDs already in the room (occupants)
  const occupantJids = Array.from(room.occupants.values())
    .map(o => o.jid)
    .filter((jid): jid is string => !!jid)

  const handleInvite = async () => {
    if (selectedContacts.length === 0) return

    setIsInviting(true)
    setError(null)

    try {
      await inviteMultipleToRoom(room.jid, selectedContacts, reason || undefined)
      onClose()
    } catch (err) {
      console.error('Failed to send invitations:', err)
      setError(t('rooms.inviteError'))
    } finally {
      setIsInviting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="bg-fluux-sidebar rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fluux-hover">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-fluux-brand" />
            <h2 className="text-lg font-semibold text-fluux-text">
              {t('rooms.inviteToRoom')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-fluux-hover text-fluux-muted hover:text-fluux-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Room info */}
          <div className="text-sm text-fluux-muted">
            {t('rooms.invitingTo', { room: room.name || room.jid })}
          </div>

          {/* Contact selector */}
          <div>
            <label className="block text-sm text-fluux-muted mb-1">
              {t('rooms.selectContacts')}
            </label>
            <ContactSelector
              selectedContacts={selectedContacts}
              onSelectionChange={setSelectedContacts}
              placeholder={t('rooms.searchContactsToInvite')}
              excludeJids={occupantJids}
              disabled={isInviting}
            />
          </div>

          {/* Optional reason */}
          <div>
            <label className="block text-sm text-fluux-muted mb-1">
              {t('rooms.inviteReason')}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('rooms.inviteReasonPlaceholder')}
              disabled={isInviting}
              className="w-full px-3 py-2 bg-fluux-bg text-fluux-text rounded
                         border border-transparent focus:border-fluux-brand
                         placeholder:text-fluux-muted disabled:opacity-50"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-fluux-red bg-fluux-red/10 px-3 py-2 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-fluux-hover">
          <button
            onClick={onClose}
            disabled={isInviting}
            className="px-4 py-2 text-sm text-fluux-muted hover:text-fluux-text
                       hover:bg-fluux-hover rounded transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleInvite}
            disabled={selectedContacts.length === 0 || isInviting}
            className="px-4 py-2 text-sm bg-fluux-brand text-white rounded
                       hover:bg-fluux-brand-hover transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {isInviting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('rooms.sending')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t('rooms.sendInvitations', { count: selectedContacts.length })}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
