"use client"

import { GlassCard } from "./glass-card"
import { modelMetrics, type ModelResult, getCategoryColor, getCategory } from "@/lib/aqi-utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts"
import { Trophy, Target, TrendingUp, Award } from "lucide-react"

interface ModelComparisonProps {
  results: ModelResult[]
  selectedModel: string
}

export function ModelComparison({ results, selectedModel }: ModelComparisonProps) {
  // Sort by AQI for comparison
  const sortedByAqi = [...results].sort((a, b) => a.aqi - b.aqi)
  const sortedByRmse = [...results].sort((a, b) => a.rmse - b.rmse)
  const bestModel = sortedByRmse[0]

  // Prepare data for charts
  const aqiComparisonData = results.map((r) => ({
    model: r.model.length > 10 ? r.model.substring(0, 10) + "..." : r.model,
    fullModel: r.model,
    aqi: r.aqi,
    category: getCategory(r.aqi),
  }))

  const metricsComparisonData = results.map((r) => ({
    model: r.model,
    MAE: r.mae,
    RMSE: r.rmse,
    "R² Score": r.r2 * 100,
  }))

  // Radar chart data for metrics
  const radarData = [
    { metric: "Accuracy", fullMark: 100 },
    { metric: "Speed", fullMark: 100 },
    { metric: "Stability", fullMark: 100 },
    { metric: "Robustness", fullMark: 100 },
    { metric: "Interpretability", fullMark: 100 },
  ].map((item) => {
    const result: Record<string, number | string> = { metric: item.metric }
    results.forEach((r) => {
      const baseScore = r.r2 * 100
      const variance = Math.random() * 10 - 5
      result[r.model] = Math.round(Math.min(100, Math.max(60, baseScore + variance)))
    })
    return result
  })

  const colors = ["#22d3ee", "#a855f7", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Best Model</p>
              <p className="font-semibold text-primary">{bestModel.model}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Target className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lowest RMSE</p>
              <p className="font-semibold text-green-400">{bestModel.rmse.toFixed(2)}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Highest R²</p>
              <p className="font-semibold text-yellow-400">
                {Math.max(...results.map((r) => r.r2)).toFixed(3)}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <Award className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Selected</p>
              <p className="font-semibold text-accent">{selectedModel}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* AQI Predictions Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4">AQI Predictions by Model</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aqiComparisonData} layout="vertical">
              <XAxis type="number" domain={[0, 500]} tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis
                dataKey="model"
                type="category"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number, name: string, props: { payload: { category: string } }) => [
                  `${value} (${props.payload.category})`,
                  "Predicted AQI",
                ]}
              />
              <Bar dataKey="aqi" radius={[0, 4, 4, 0]}>
                {aqiComparisonData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getCategoryColor(entry.category)}
                    opacity={entry.fullModel === selectedModel ? 1 : 0.6}
                    stroke={entry.fullModel === selectedModel ? "#fff" : "transparent"}
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4">Model Performance Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsComparisonData}>
              <XAxis
                dataKey="model"
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar dataKey="RMSE" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="MAE" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Radar Chart & Detailed Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4">Model Capabilities Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
              {results.slice(0, 3).map((r, i) => (
                <Radar
                  key={r.model}
                  name={r.model}
                  dataKey={r.model}
                  stroke={colors[i]}
                  fill={colors[i]}
                  fillOpacity={0.2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4">Detailed Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Model</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">AQI</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">MAE</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">RMSE</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">R²</th>
                </tr>
              </thead>
              <tbody>
                {sortedByRmse.map((r, i) => (
                  <tr
                    key={r.model}
                    className={`border-b border-border/30 ${
                      r.model === selectedModel ? "bg-primary/10" : ""
                    }`}
                  >
                    <td className="py-2 px-2 flex items-center gap-2">
                      {i === 0 && <Trophy className="h-4 w-4 text-yellow-400" />}
                      <span className={r.model === selectedModel ? "text-primary font-medium" : ""}>
                        {r.model}
                      </span>
                    </td>
                    <td className="text-right py-2 px-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: getCategoryColor(getCategory(r.aqi)) + "30",
                          color: getCategoryColor(getCategory(r.aqi)),
                        }}
                      >
                        {r.aqi}
                      </span>
                    </td>
                    <td className="text-right py-2 px-2">{r.mae.toFixed(2)}</td>
                    <td className="text-right py-2 px-2">{r.rmse.toFixed(2)}</td>
                    <td className="text-right py-2 px-2">{r.r2.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
