import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NovedadData {
  tipo: string
  cantidad: number
  color?: string
}

interface NovedadesChartProps {
  data: NovedadData[]
  className?: string
  title?: string
  description?: string
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f97316', // orange
  '#ec4899', // pink
]

export function NovedadesChart({ data, className, title, description }: NovedadesChartProps) {
  const { t } = useTranslation()
  const total = data.reduce((sum, d) => sum + d.cantidad, 0)

  // Sort by cantidad descending and take top 8
  const sortedData = [...data].sort((a, b) => b.cantidad - a.cantidad).slice(0, 8)

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              {title ?? t('dashboard.noveltiesByType')}
            </CardTitle>
            <CardDescription>{description ?? t('dashboard.eventsDetected')}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">{t('common.total')}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                className="stroke-muted"
              />
              <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="tipo"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [value, t('novedades.eventos')]}
              />
              <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.tipo}`}
                    fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
