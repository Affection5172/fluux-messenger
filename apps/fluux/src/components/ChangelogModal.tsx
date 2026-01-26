import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Sparkles } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { changelog } from '@/data/changelog'

interface ChangelogModalProps {
  onClose: () => void
}

export function ChangelogModal({ onClose }: ChangelogModalProps) {
  const { t } = useTranslation()
  const modalRef = useRef<HTMLDivElement>(null)

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

  const getSectionTitle = (type: 'added' | 'changed' | 'fixed' | 'removed') => {
    switch (type) {
      case 'added': return t('changelog.added')
      case 'changed': return t('changelog.changed')
      case 'fixed': return t('changelog.fixed')
      case 'removed': return t('changelog.removed')
    }
  }

  const getSectionColor = (type: 'added' | 'changed' | 'fixed' | 'removed') => {
    switch (type) {
      case 'added': return 'text-green-500'
      case 'changed': return 'text-blue-500'
      case 'fixed': return 'text-amber-500'
      case 'removed': return 'text-red-500'
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-fluux-sidebar rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fluux-hover flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-fluux-brand" />
            <h2 className="text-lg font-semibold text-fluux-text">{t('changelog.title')}</h2>
          </div>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-6 select-text">
          {changelog.map((entry) => (
            <div key={entry.version} className="space-y-3">
              {/* Version header */}
              <div className="flex items-baseline gap-3">
                <h3 className="text-lg font-bold text-fluux-text">v{entry.version}</h3>
                <span className="text-sm text-fluux-muted">{entry.date}</span>
              </div>

              {/* Sections */}
              {entry.sections.map((section) => (
                <div key={section.type} className="space-y-1">
                  <h4 className={`text-sm font-semibold uppercase ${getSectionColor(section.type)}`}>
                    {getSectionTitle(section.type)}
                  </h4>
                  <ul className="space-y-1 text-sm text-fluux-text">
                    {section.items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-fluux-muted mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
