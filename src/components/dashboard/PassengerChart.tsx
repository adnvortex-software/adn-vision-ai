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
  entradas: number
  salidas: number
}

interface PassengerChartProps {
  data: PassengerData[]
  className?: string
  title?: string
  description?: string
}

export function PassengerChart({ data, className, title, description }: PassengerChartProps) {
  const { t } = useTranslation()
  const totalEntradas = data.reduce((sum, d) => sum + d.entradas, 0)
  const totalSalidas = data.reduce((sum, d) => sum + d.salidas, 0)

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              {title ?? t('dashboard.passengerCount')}
            </CardTitle>
            <CardDescription>{description ?? t('dashboard.entriesAndExits')}</CardDescription>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {totalEntradas.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">{t('dashboard.entries')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-600">
                {totalSalidas.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">{t('dashboard.exits')}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
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
                dataKey="entradas"
                name={t('dashboard.entries')}
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorEntradas)"
              />
              <Area
                type="monotone"
                dataKey="salidas"
                name={t('dashboard.exits')}
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#colorSalidas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
