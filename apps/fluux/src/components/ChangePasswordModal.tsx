import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { useConnection } from '@fluux/sdk'
import { useModalInput } from '@/hooks'
import { hasSavedCredentials, saveCredentials } from '@/utils/keychain'

interface ChangePasswordModalProps {
  onClose: () => void
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const { t } = useTranslation()
  const { changePassword, jid } = useConnection()
  const inputRef = useModalInput<HTMLInputElement>(onClose)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError(t('profile.passwordsDoNotMatch'))
      return
    }

    // Validate minimum length
    if (newPassword.length < 6) {
      setError(t('profile.passwordTooShort'))
      return
    }

    setSaving(true)
    try {
      await changePassword(newPassword)
      // Update keychain if "Remember me" was used at login
      if (jid && hasSavedCredentials()) {
        await saveCredentials(jid, newPassword, null)
      }
      onClose()
    } catch {
      setError(t('profile.failedToChangePassword'))
    } finally {
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
          <h2 className="text-lg font-semibold text-fluux-text">{t('profile.changePassword')}</h2>
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
          <div>
            <label htmlFor="new-password" className="block text-xs font-semibold text-fluux-muted uppercase mb-2">
              {t('profile.newPassword')}
            </label>
            <input
              ref={inputRef}
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-fluux-bg border border-fluux-hover rounded-lg text-fluux-text
                         placeholder:text-fluux-muted focus:outline-none focus:border-fluux-brand"
              placeholder="••••••••"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-xs font-semibold text-fluux-muted uppercase mb-2">
              {t('profile.confirmPassword')}
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-fluux-bg border border-fluux-hover rounded-lg text-fluux-text
                         placeholder:text-fluux-muted focus:outline-none focus:border-fluux-brand"
              placeholder="••••••••"
              disabled={saving}
            />
          </div>

          {error && (
            <p className="text-sm text-fluux-red">{error}</p>
          )}

          {/* Footer */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-fluux-text bg-fluux-hover hover:bg-fluux-active rounded-lg transition-colors"
              disabled={saving}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || !newPassword || !confirmPassword}
              className="flex-1 px-4 py-2 text-white bg-fluux-brand hover:bg-fluux-brand/90 rounded-lg
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
