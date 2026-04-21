export type AQICategory =
  | "Good"
  | "Satisfactory"
  | "Moderate"
  | "Poor"
  | "Very Poor"
  | "Severe"

export interface PredictionInput {
  pm25: number
  pm10: number
  no2: number
  so2: number
  co: number
  co2: number
  o3: number
  temperature: number
  humidity: number
  wind_speed: number
}

export interface PredictionResult {
  aqi: number
  category: AQICategory
  healthImpact: string
}

export interface ModelResult {
  model: string
  aqi: number
  mae: number
  rmse: number
  r2: number
}

export interface HistoricalData {
  date: string
  aqi: number
  category: AQICategory
}

/* ---------- AQI HELPERS ---------- */

export function getCategory(aqi: number): AQICategory {
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Satisfactory"
  if (aqi <= 200) return "Moderate"
  if (aqi <= 300) return "Poor"
  if (aqi <= 400) return "Very Poor"
  return "Severe"
}

export function getHealthImpact(category: AQICategory): string {
  const map: Record<AQICategory, string> = {
    Good: "Air quality is satisfactory and poses little or no risk.",
    Satisfactory:
      "Minor breathing discomfort to sensitive people including children and elderly.",
    Moderate:
      "Breathing discomfort to people with lung disease such as asthma.",
    Poor: "Breathing discomfort to most people on prolonged exposure.",
    "Very Poor":
      "Respiratory illness on prolonged exposure. More serious for heart/lung patients.",
    Severe:
      "Affects healthy people and seriously impacts existing disease patients.",
  }

  return map[category]
}

export function getPrecautions(category: AQICategory): string[] {
  const map: Record<AQICategory, string[]> = {
    Good: ["Enjoy outdoor activities", "Fresh air", "No precautions needed"],
    Satisfactory: [
      "Sensitive people avoid long exposure",
      "Stay hydrated",
      "Monitor symptoms",
    ],
    Moderate: [
      "Reduce outdoor exercise",
      "Wear mask if needed",
      "Keep medicines ready",
    ],
    Poor: ["Wear N95 mask", "Avoid jogging", "Use purifier"],
    "Very Poor": ["Stay indoors", "Close windows", "Use purifier"],
    Severe: ["Avoid outdoor activity", "Emergency caution", "Medical help if needed"],
  }

  return map[category]
}

export function getCategoryColor(category: AQICategory): string {
  const colors: Record<AQICategory, string> = {
    Good: "#22c55e",
    Satisfactory: "#84cc16",
    Moderate: "#eab308",
    Poor: "#f97316",
    "Very Poor": "#ef4444",
    Severe: "#7f1d1d",
  }

  return colors[category]
}

export function getCategoryGradient(category: AQICategory): string {
  const gradients: Record<AQICategory, string> = {
    Good: "from-green-500/20 to-green-600/10",
    Satisfactory: "from-lime-500/20 to-lime-600/10",
    Moderate: "from-yellow-500/20 to-yellow-600/10",
    Poor: "from-orange-500/20 to-orange-600/10",
    "Very Poor": "from-red-500/20 to-red-600/10",
    Severe: "from-red-900/20 to-red-950/10",
  }

  return gradients[category]
}

/* ---------- STATIC FALLBACKS ---------- */

export const states: string[] = []
export const cities: string[] = []
export const years = [
  "2015","2016","2017","2018","2019",
  "2020","2021","2022","2023","2024",
]

export const models = [
  "XGBoost",
  "Random Forest",
  "Gradient Boost",
  "MLP",
  "SVR",
  "Ridge",
  "Hybrid",
]

export const modelMetrics: Record<
  string,
  { mae: number; rmse: number; r2: number }
> = {
  XGBoost: { mae: 12.5, rmse: 18.2, r2: 0.92 },
  "Random Forest": { mae: 14.2, rmse: 20.1, r2: 0.89 },
  "Gradient Boost": { mae: 13.8, rmse: 19.5, r2: 0.9 },
  MLP: { mae: 15.1, rmse: 21.8, r2: 0.87 },
  SVR: { mae: 16.5, rmse: 23.2, r2: 0.85 },
  Ridge: { mae: 18.2, rmse: 25.1, r2: 0.82 },
  Hybrid: { mae: 11.8, rmse: 17.5, r2: 0.93 },
}

/* ---------- HISTORY ---------- */

export function generateHistoricalData(
  months: number,
  baseAQI = 140
): HistoricalData[] {
  const data: HistoricalData[] = []
  const now = new Date()

  for (let i = months * 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)

    const seasonal = Math.sin(i / 6) * 18
    const trend = (i % 10) * 2
    const noise = Math.random() * 8 - 4

    const aqi = Math.round(
      Math.max(20, Math.min(500, baseAQI + seasonal - trend + noise))
    )

    data.push({
      date: date.toISOString().split("T")[0],
      aqi,
      category: getCategory(aqi),
    })
  }

  return data
}

export function calculateStats(data: HistoricalData[]) {
  if (!data.length) return { avg: 0, max: 0, min: 0 }

  const vals = data.map((d) => d.aqi)

  return {
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    max: Math.max(...vals),
    min: Math.min(...vals),
  }
}

export function groupByMonth(data: HistoricalData[]) {
  const grouped: Record<string, number[]> = {}

  data.forEach((d) => {
    const month = d.date.substring(0, 7)
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(d.aqi)
  })

  return Object.entries(grouped).map(([month, values]) => ({
    month,
    avgAqi: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
  }))
}

/* ---------- MODEL COMPARISON ---------- */

export function simulateModelPredictions(
  inputs: PredictionInput,
  baseAQI: number
): ModelResult[] {
  const variance: Record<string, number> = {
    XGBoost: 0,
    "Random Forest": 5,
    "Gradient Boost": -3,
    MLP: 8,
    SVR: -5,
    Ridge: 10,
    Hybrid: -2,
  }

  return models.map((model) => ({
    model,
    aqi: Math.round(
      Math.max(20, Math.min(500, baseAQI + (variance[model] || 0)))
    ),
    mae: modelMetrics[model].mae,
    rmse: modelMetrics[model].rmse,
    r2: modelMetrics[model].r2,
  }))
}