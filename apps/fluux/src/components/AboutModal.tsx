import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Github, Copy, Check } from 'lucide-react'
import { Tooltip } from './Tooltip'

interface AboutModalProps {
  onClose: () => void
}

export function AboutModal({ onClose }: AboutModalProps) {
  const { t } = useTranslation()
  const modalRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const copyVersionInfo = async () => {
    const info = `Fluux Messenger ${__APP_VERSION__}\nCommit: ${__GIT_COMMIT__}`
    try {
      await navigator.clipboard.writeText(info)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Close when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-fluux-sidebar rounded-lg shadow-xl border border-fluux-hover w-80 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fluux-hover">
          <h2 className="text-lg font-semibold text-fluux-text">{t('about.title')}</h2>
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
        <div className="p-6 text-center">
          <img
            src="/logo.png"
            alt="Fluux Messenger"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h3 className="text-xl font-bold text-fluux-text mb-1">Fluux Messenger</h3>
          <p className="text-fluux-muted text-sm mb-1">
            {t('about.version', { version: __APP_VERSION__ })}
          </p>
          <p className="text-fluux-brand text-xs font-medium mb-2">
            {t('about.edition')}
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <p className="text-fluux-muted text-xs font-mono">
              {__GIT_COMMIT__}
            </p>
            <Tooltip content={copied ? t('common.copied') : t('about.copyVersionInfo')}>
              <button
                onClick={copyVersionInfo}
                className="p-1 text-fluux-muted hover:text-fluux-text rounded hover:bg-fluux-hover"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </Tooltip>
          </div>
          <p className="text-fluux-text text-sm mb-4">
            {t('about.description')}
          </p>
          <a
            href="https://github.com/processone/fluux-messenger"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-fluux-muted text-xs hover:text-fluux-brand mb-4"
          >
            <Github className="w-3.5 h-3.5" />
            {t('about.viewOnGithub')}
          </a>
          <p className="text-fluux-muted text-xs mb-3">
            {t('about.madeBy')}{' '}
            <a
              href="https://www.process-one.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fluux-brand hover:underline"
            >
              ProcessOne
            </a>
          </p>
          <p className="text-fluux-muted text-xs">
            {t('about.commercialLicense')}{' '}
            <a
              href="https://www.process-one.net/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fluux-brand hover:underline"
            >
              {t('about.contactUs')}
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}
