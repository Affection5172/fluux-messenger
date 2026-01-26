import { useTranslation } from 'react-i18next'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useSettingsStore, type ThemeMode } from '@/stores/settingsStore'

const themeOptions: { value: ThemeMode; labelKey: string; icon: typeof Sun; descriptionKey: string }[] = [
  { value: 'dark', labelKey: 'settings.dark', icon: Moon, descriptionKey: 'settings.darkDescription' },
  { value: 'light', labelKey: 'settings.light', icon: Sun, descriptionKey: 'settings.lightDescription' },
  { value: 'system', labelKey: 'settings.system', icon: Monitor, descriptionKey: 'settings.systemDescription' },
]

export function AppearanceSettings() {
  const { t } = useTranslation()
  const themeMode = useSettingsStore((s) => s.themeMode)
  const setThemeMode = useSettingsStore((s) => s.setThemeMode)

  return (
    <section className="max-w-md">
      <h3 className="text-xs font-semibold text-fluux-muted uppercase tracking-wide mb-4">
        {t('settings.appearance')}
      </h3>

      <div className="space-y-3">
        <label className="text-sm font-medium text-fluux-text">{t('settings.mode')}</label>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((option) => {
            const Icon = option.icon
            const isSelected = themeMode === option.value
            return (
              <button
                key={option.value}
                onClick={() => setThemeMode(option.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${isSelected
                    ? 'border-fluux-brand bg-fluux-brand/10'
                    : 'border-fluux-hover bg-fluux-bg hover:border-fluux-muted'
                  }`}
              >
                <Icon className={`w-6 h-6 ${isSelected ? 'text-fluux-brand' : 'text-fluux-muted'}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-fluux-text' : 'text-fluux-muted'}`}>
                  {t(option.labelKey)}
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-fluux-muted mt-2">
          {t(themeOptions.find(o => o.value === themeMode)?.descriptionKey || '')}
        </p>
      </div>
    </section>
  )
}
