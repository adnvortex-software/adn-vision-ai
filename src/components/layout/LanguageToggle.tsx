import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'es', label: 'Espanol', flag: '🇨🇴' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
] as const

export function LanguageToggle() {
  const { i18n } = useTranslation()
  // Normalizar el idioma a solo el codigo base (es, en)
  const currentLang = i18n.language.split('-')[0] ?? 'es'

  const handleLanguageChange = (langCode: string) => {
    void i18n.changeLanguage(langCode)
  }

  const currentLanguage = LANGUAGES.find((l) => l.code === currentLang) ?? LANGUAGES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title={currentLanguage.label}>
          <span className="text-base">{currentLanguage.flag}</span>
          <span className="sr-only">Cambiar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => {
              handleLanguageChange(lang.code)
            }}
            className={currentLang === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
