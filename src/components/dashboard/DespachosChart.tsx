import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DespachoData {
  fecha: string
  completados: number
  pendientes: number
  cancelados: number
}

interface DespachosChartProps {
  data: DespachoData[]
  className?: string
  title?: string
  description?: string
}

export function DespachosChart({ data, className, title, description }: DespachosChartProps) {
  const { t } = useTranslation()
  const totalCompletados = data.reduce((sum, d) => sum + d.completados, 0)
  const totalPendientes = data.reduce((sum, d) => sum + d.pendientes, 0)

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-violet-600" />
              {title ?? t('dashboard.dailyDispatches')}
            </CardTitle>
            <CardDescription>{description ?? t('dashboard.operationStatus')}</CardDescription>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{totalCompletados}</div>
              <div className="text-xs text-muted-foreground">{t('common.completed')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{totalPendientes}</div>
              <div className="text-xs text-muted-foreground">{t('common.pending')}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Bar
                dataKey="completados"
                name={t('common.completed')}
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="pendientes"
                name={t('common.pending')}
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="cancelados"
                name={t('common.cancelled')}
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
