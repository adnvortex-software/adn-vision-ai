import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlotaData {
  name: string
  value: number
  color: string
}

interface FlotaDonutChartProps {
  data: FlotaData[]
  total: number
  className?: string
  title?: string
  description?: string
}

export function FlotaDonutChart({
  data,
  total,
  className,
  title,
  description,
}: FlotaDonutChartProps) {
  const { t } = useTranslation()

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-blue-600" />
          {title ?? t('dashboard.fleetStatus')}
        </CardTitle>
        <CardDescription>{description ?? t('dashboard.vehicleDistribution')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="relative h-[180px] w-[180px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{total}</span>
              <span className="text-xs text-muted-foreground">{t('common.total')}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-1 flex-col gap-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
