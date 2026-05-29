import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PassengerData {
  fecha: string
  totalPasajeros: number
}

interface PassengerChartProps {
  data: PassengerData[]
  className?: string
  title?: string
  description?: string
}

export function PassengerChart({ data, className, title, description }: PassengerChartProps) {
  const { t } = useTranslation()
  const totalDelPeriodo = data.reduce((sum, d) => sum + d.totalPasajeros, 0)
  const promedioPorDia = data.length > 0 ? Math.round(totalDelPeriodo / data.length) : 0

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              {title ?? t('dashboard.passengerCount')}
            </CardTitle>
            <CardDescription>{description ?? t('dashboard.passengersPerDay')}</CardDescription>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {totalDelPeriodo.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">{t('dashboard.periodTotal')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {promedioPorDia.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">{t('dashboard.averagePerDay')}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPasajeros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="totalPasajeros"
                name={t('dashboard.totalPassengers')}
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorPasajeros)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
