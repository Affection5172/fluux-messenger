import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Trash2, Power, Key } from 'lucide-react'
import type { AdminUser } from '@fluux/sdk'
import { Tooltip } from './Tooltip'

interface AdminUserViewProps {
  user: AdminUser
  onBack: () => void
  onDeleteUser: (jid: string) => void
  onEndSessions: (jid: string) => void
  onChangePassword: (jid: string) => void
  isExecuting: boolean
}

export function AdminUserView({
  user,
  onBack,
  onDeleteUser,
  onEndSessions,
  onChangePassword,
  isExecuting,
}: AdminUserViewProps) {
  const { t } = useTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEndSessionsConfirm, setShowEndSessionsConfirm] = useState(false)

  const handleDelete = useCallback(() => {
    onDeleteUser(user.jid)
    setShowDeleteConfirm(false)
  }, [user.jid, onDeleteUser])

  const handleEndSessions = useCallback(() => {
    onEndSessions(user.jid)
    setShowEndSessionsConfirm(false)
  }, [user.jid, onEndSessions])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <Tooltip content={t('common.close')} position="right">
          <button
            onClick={onBack}
            className="p-1.5 text-fluux-muted hover:text-fluux-text hover:bg-fluux-hover
                       rounded-lg transition-colors"
            aria-label={t('common.close')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Tooltip>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-fluux-text truncate">{user.jid}</h2>
          <p className="text-sm text-fluux-muted">{t('admin.userView.manageUser')}</p>
        </div>
      </div>

      {/* Actions section */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="bg-fluux-bg rounded-lg p-4">
          <h3 className="text-sm font-medium text-fluux-muted mb-3">
            {t('admin.userView.actions')}
          </h3>

          <div className="space-y-2">
            {/* Change Password */}
            <button
              onClick={() => onChangePassword(user.jid)}
              disabled={isExecuting}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                         bg-fluux-hover hover:bg-fluux-sidebar text-fluux-text
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Key className="w-4 h-4 text-fluux-muted" />
              <span className="text-sm">{t('admin.users.changePassword')}</span>
            </button>

            {/* End Sessions */}
            <button
              onClick={() => setShowEndSessionsConfirm(true)}
              disabled={isExecuting}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                         bg-fluux-hover hover:bg-fluux-sidebar text-fluux-text
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Power className="w-4 h-4 text-fluux-muted" />
              <span className="text-sm">{t('admin.users.endSessions')}</span>
            </button>

            {/* Delete User */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isExecuting}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                         bg-red-500/10 hover:bg-red-500/20 text-red-500
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">{t('admin.users.delete')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-fluux-sidebar rounded-lg p-4 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-fluux-text mb-2">
              {t('admin.userView.confirmDelete')}
            </h3>
            <p className="text-sm text-fluux-muted mb-4">
              {t('admin.userView.confirmDeleteMessage', { jid: user.jid })}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-fluux-text bg-fluux-hover hover:bg-fluux-sidebar
                           rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600
                           rounded-lg transition-colors"
              >
                {t('admin.users.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Sessions Confirmation Dialog */}
      {showEndSessionsConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-fluux-sidebar rounded-lg p-4 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-fluux-text mb-2">
              {t('admin.userView.confirmEndSessions')}
            </h3>
            <p className="text-sm text-fluux-muted mb-4">
              {t('admin.userView.confirmEndSessionsMessage', { jid: user.jid })}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowEndSessionsConfirm(false)}
                className="px-4 py-2 text-sm text-fluux-text bg-fluux-hover hover:bg-fluux-sidebar
                           rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleEndSessions}
                className="px-4 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600
                           rounded-lg transition-colors"
              >
                {t('admin.users.endSessions')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
