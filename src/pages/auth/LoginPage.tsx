import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/common/Logo'

export default function LoginPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="mx-auto w-full max-w-md space-y-8 rounded-xl bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" />
          <p className="text-sm text-muted-foreground">{t('app.tagline')}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              placeholder="********"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-input" />
              {t('auth.rememberMe')}
            </label>
            <a href="#" className="text-sm text-primary hover:underline">
              {t('auth.forgotPassword')}
            </a>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('auth.login')}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Plataforma de monitoreo inteligente de flotas
        </p>
      </div>
    </div>
  )
}
