import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-muted-foreground/20">404</h1>
        <h2 className="mt-4 text-2xl font-semibold">{t('errors.notFound')}</h2>
        <p className="mt-2 text-muted-foreground">La pagina que buscas no existe o fue movida.</p>
        <button
          onClick={() => {
            navigate('/')
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
