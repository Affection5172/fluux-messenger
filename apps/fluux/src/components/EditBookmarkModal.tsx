import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { type Room } from '@fluux/sdk'
import { useModalInput } from '@/hooks'

interface EditBookmarkModalProps {
  room: Room
  onSave: (options: { name: string; nick: string; autojoin?: boolean }) => Promise<void>
  onClose: () => void
}

export function EditBookmarkModal({
  room,
  onSave,
  onClose
}: EditBookmarkModalProps) {
  const { t } = useTranslation()
  const [nickname, setNickname] = useState(room.nickname)
  const [autojoin, setAutojoin] = useState(room.autojoin)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useModalInput<HTMLInputElement>(onClose)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedNickname = nickname.trim()
    if (!trimmedNickname) {
      setError(t('rooms.pleaseEnterNickname'))
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: room.name,
        nick: trimmedNickname,
        autojoin,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rooms.failedToSaveBookmark'))
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-fluux-sidebar rounded-lg shadow-xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fluux-hover">
          <h2 className="text-lg font-semibold text-fluux-text">{t('rooms.editBookmarkTitle')}</h2>
          <Tooltip content={t('common.close')}>
            <button
              onClick={onClose}
              className="p-1 text-fluux-muted hover:text-fluux-text rounded hover:bg-fluux-hover"
            >
              <X className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Room name (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-fluux-muted uppercase mb-2">
              {t('rooms.room')}
            </label>
            <p className="text-fluux-text truncate">{room.name}</p>
            <p className="text-xs text-fluux-muted truncate">{room.jid}</p>
          </div>

          {/* Nickname */}
          <div>
            <label htmlFor="bookmark-nickname" className="block text-xs font-semibold text-fluux-muted uppercase mb-2">
              {t('rooms.nickname')}
            </label>
            <input
              ref={inputRef}
              id="bookmark-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('rooms.nicknamePlaceholder')}
              disabled={saving}
              className="w-full px-3 py-2 bg-fluux-bg text-fluux-text rounded
                         border border-transparent focus:border-fluux-brand
                         placeholder:text-fluux-muted disabled:opacity-50"
            />
          </div>

          {/* Autojoin toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-fluux-text">
                {t('rooms.autoJoinLabel')}
              </label>
              <p className="text-xs text-fluux-muted">
                {t('rooms.autoJoinDescription')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutojoin(!autojoin)}
              disabled={saving}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autojoin ? 'bg-fluux-green' : 'bg-fluux-bg'
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  autojoin ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {error && (
            <p className="text-sm text-fluux-red">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-fluux-text bg-fluux-bg rounded hover:bg-fluux-hover transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || !nickname.trim()}
              className="flex-1 px-4 py-2 text-white bg-fluux-brand rounded hover:bg-fluux-brand/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
