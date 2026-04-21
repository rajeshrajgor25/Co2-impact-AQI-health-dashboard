"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { GlassCard } from "./glass-card"
import type { HistoricalData } from "@/lib/aqi-utils"
import { groupByMonth, calculateStats, getCategoryColor, getCategory } from "@/lib/aqi-utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface AQIChartsProps {
  data: HistoricalData[]
}

export function AQICharts({ data }: AQIChartsProps) {
  const monthlyData = groupByMonth(data)
  const stats = calculateStats(data)

  // Calculate trend
  const recentAvg = data.slice(-30).reduce((a, b) => a + b.aqi, 0) / Math.min(30, data.length)
  const olderAvg = data.slice(0, 30).reduce((a, b) => a + b.aqi, 0) / Math.min(30, data.length)
  const trend = recentAvg - olderAvg

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4" hover>
          <div className="text-sm text-muted-foreground mb-1">Average AQI</div>
          <div className="text-3xl font-bold" style={{ color: getCategoryColor(getCategory(stats.avg)) }}>
            {stats.avg}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{getCategory(stats.avg)}</div>
        </GlassCard>

        <GlassCard className="p-4" hover>
          <div className="text-sm text-muted-foreground mb-1">Maximum AQI</div>
          <div className="text-3xl font-bold" style={{ color: getCategoryColor(getCategory(stats.max)) }}>
            {stats.max}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{getCategory(stats.max)}</div>
        </GlassCard>

        <GlassCard className="p-4" hover>
          <div className="text-sm text-muted-foreground mb-1">Minimum AQI</div>
          <div className="text-3xl font-bold" style={{ color: getCategoryColor(getCategory(stats.min)) }}>
            {stats.min}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{getCategory(stats.min)}</div>
        </GlassCard>
      </div>

      {/* Trend Indicator */}
      <GlassCard className="p-4" hover>
        <div className="flex items-center gap-3">
          {trend > 10 ? (
            <TrendingUp className="h-6 w-6 text-red-500" />
          ) : trend < -10 ? (
            <TrendingDown className="h-6 w-6 text-green-500" />
          ) : (
            <Minus className="h-6 w-6 text-yellow-500" />
          )}
          <div>
            <div className="font-medium">
              {trend > 10 ? "AQI Increasing" : trend < -10 ? "AQI Improving" : "AQI Stable"}
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.abs(Math.round(trend))} point {trend > 0 ? "increase" : "decrease"} compared to earlier period
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Line Chart - AQI over Time */}
      <GlassCard className="p-6" hover>
        <h3 className="text-lg font-semibold mb-4">AQI Trend Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.slice(-90)}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
              tickFormatter={(value) => value.slice(5)}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
              domain={[0, 500]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(20, 20, 35, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number) => [value, "AQI"]}
            />
            <Line
              type="monotone"
              dataKey="aqi"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: "#22d3ee" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Bar Chart - Monthly Averages */}
      <GlassCard className="p-6" hover>
        <h3 className="text-lg font-semibold mb-4">Monthly Average AQI</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="month"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
              tickFormatter={(value) => value.slice(5)}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
              domain={[0, 400]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(20, 20, 35, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number) => [value, "Avg AQI"]}
            />
            <Bar
              dataKey="avgAqi"
              fill="#22d3ee"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  )
}
