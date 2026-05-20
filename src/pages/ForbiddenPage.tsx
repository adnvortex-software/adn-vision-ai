import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Home, ShieldX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-6xl font-bold text-muted-foreground/20">403</h1>
        <h2 className="mt-4 text-2xl font-semibold">{t('errors.forbidden')}</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          No tienes permisos para acceder a esta pagina. Contacta al administrador si crees que esto
          es un error.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={() => {
              navigate(-1)
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver atras
          </Button>
          <Button
            onClick={() => {
              navigate('/')
            }}
          >
            <Home className="mr-2 h-4 w-4" />
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
