import { useTranslation } from 'react-i18next'
import { formatDateHeader } from '@/utils/dateFormat'

export interface DateSeparatorProps {
  /** Date string in yyyy-MM-dd format */
  date: string
}

/**
 * Displays a horizontal line with a centered date label.
 * Used to separate messages by day in conversation views.
 */
export function DateSeparator({ date }: DateSeparatorProps) {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language.split('-')[0]

  return (
    <div className="flex items-center gap-4 h-12">
      <div className="flex-1 h-px bg-fluux-hover" />
      <span className="text-xs font-semibold text-fluux-muted whitespace-nowrap">
        {formatDateHeader(date, t, currentLang)}
      </span>
      <div className="flex-1 h-px bg-fluux-hover" />
    </div>
  )
}
