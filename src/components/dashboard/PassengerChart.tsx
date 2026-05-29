import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

// Colors for multiple client lines
const CLIENT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
]

interface ClientLine {
  key: string
  name: string
  color: string
}

interface PassengerChartProps {
  data: Record<string, unknown>[]
  clients?: ClientLine[]
  totalPassengers?: number
  className?: string
  title?: string
  description?: string
}

export function PassengerChart({
  data,
  clients,
  totalPassengers,
  className,
  title,
  description,
}: PassengerChartProps) {
  const { t } = useTranslation()

  // Single client mode: just one line called "promedio"
  const isSingleClient = !clients || clients.length === 0
  const linesToRender: ClientLine[] = isSingleClient
    ? [{ key: 'promedio', name: t('dashboard.totalPassengers'), color: '#3b82f6' }]
    : clients

  // Calculate total from data
  const calculatedTotal =
    totalPassengers ??
    data.reduce((sum, d) => {
      if (isSingleClient) {
        const promedio = d.promedio as number | undefined
        return sum + (promedio ?? 0)
      }
      return (
        sum +
        linesToRender.reduce((lineSum, line) => {
          const value = d[line.key] as number | undefined
          return lineSum + (value ?? 0)
        }, 0)
      )
    }, 0)

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              {title ?? t('dashboard.passengerCount')}
            </CardTitle>
            <CardDescription>{description ?? t('dashboard.dailyAverage')}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(calculatedTotal).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">{t('dashboard.totalPassengers')}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                formatter={(value: number) => [Math.round(value), '']}
              />
              {!isSingleClient && <Legend />}
              {linesToRender.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export { CLIENT_COLORS }
