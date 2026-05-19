import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/common/Logo'
import { Bus, AlertTriangle, Users, Activity } from 'lucide-react'

export default function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background">
      {/* Header temporal */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo />
          <p className="text-sm text-muted-foreground">Dashboard en construccion - Sprint 1</p>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">Bienvenido a ADN LYNX AI</p>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title={t('dashboard.busesActivos')}
            value="0"
            subtitle="de 0 buses"
            icon={Bus}
            trend="neutral"
          />
          <KPICard
            title={t('dashboard.novedadesHoy')}
            value="0"
            subtitle="ultimas 24h"
            icon={AlertTriangle}
            trend="neutral"
          />
          <KPICard
            title={t('dashboard.pasajerosHoy')}
            value="0"
            subtitle="conteo acumulado"
            icon={Users}
            trend="neutral"
          />
          <KPICard
            title={t('dashboard.alertasCriticas')}
            value="0"
            subtitle="requieren atencion"
            icon={Activity}
            trend="neutral"
          />
        </div>

        {/* Placeholder content */}
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            El dashboard completo se implementara en Sprint 6.
            <br />
            Por ahora, el Sprint 1 se enfoca en la configuracion base del proyecto.
          </p>
        </div>
      </main>
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  trend: 'up' | 'down' | 'neutral'
}

function KPICard({ title, value, subtitle, icon: Icon }: KPICardProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mt-2">
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}
