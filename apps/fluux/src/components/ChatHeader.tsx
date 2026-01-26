/**
 * Header component for 1:1 chat conversations.
 *
 * Displays contact avatar, name, and presence status.
 * Also supports group chat mode with a hash icon.
 */
import { useTranslation } from 'react-i18next'
import type { Contact } from '@fluux/sdk'
import { Avatar } from './Avatar'
import { useWindowDrag } from '@/hooks'
import { getTranslatedStatusText } from '@/utils/statusText'
import { ArrowLeft, Hash } from 'lucide-react'

export interface ChatHeaderProps {
  name: string
  type: 'chat' | 'groupchat'
  contact?: Contact
  jid: string
  onBack?: () => void
}

export function ChatHeader({
  name,
  type,
  contact,
  jid,
  onBack
}: ChatHeaderProps) {
  const { t } = useTranslation()
  const isGroupChat = type === 'groupchat'
  const { titleBarClass, dragRegionProps } = useWindowDrag()

  return (
    <header className={`h-14 ${titleBarClass} px-4 flex items-center border-b border-fluux-bg shadow-sm gap-3`} {...dragRegionProps}>
      {/* Back button - mobile only */}
      {onBack && (
        <button
          onClick={onBack}
          className="p-1 -ml-1 rounded hover:bg-fluux-hover md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5 text-fluux-muted" />
        </button>
      )}

      {/* Avatar / Icon */}
      {isGroupChat ? (
        <div className="w-9 h-9 bg-fluux-bg rounded-full flex items-center justify-center flex-shrink-0">
          <Hash className="w-5 h-5 text-fluux-muted" />
        </div>
      ) : (
        <Avatar
          identifier={jid}
          name={name}
          avatarUrl={contact?.avatar}
          size="header"
          presence={contact?.presence ?? 'offline'}
          presenceBorderColor="border-fluux-bg"
        />
      )}

      {/* Name and status */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-fluux-text truncate leading-tight">{name}</h2>
        {!isGroupChat && (
          <p className="text-xs text-fluux-muted truncate">
            {contact ? getTranslatedStatusText(contact, t) : jid}
          </p>
        )}
      </div>
    </header>
  )
}
