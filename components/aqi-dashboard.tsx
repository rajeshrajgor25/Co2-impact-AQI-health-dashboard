"use client"

import { useState, useCallback, useEffect } from "react"
import { GlassCard } from "./glass-card"
import { AQIGauge } from "./aqi-gauge"
import { InputField } from "./input-field"
import { AQICharts } from "./aqi-charts"
import { ModelComparison } from "./model-comparison"
import { HealthPrecautions } from "./health-precautions"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  years,
  models,
  getCategory,
  getHealthImpact,
  generateHistoricalData,
  simulateModelPredictions,
  type PredictionInput,
  type HistoricalData,
  type ModelResult,
} from "@/lib/aqi-utils"
import {
  Wind,
  Droplets,
  Thermometer,
  Activity,
  BarChart3,
  RotateCcw,
  Loader2,
  Cloud,
  Sparkles,
  Layers,
  Heart,
  FlaskConical,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const pollutantTooltips = {
  pm25: "Fine particulate matter (PM2.5) - tiny particles that can penetrate deep into the lungs",
  pm10: "Coarse particulate matter (PM10) - particles from dust, pollen, and mold",
  no2: "Nitrogen Dioxide - produced by vehicle emissions and power plants",
  so2: "Sulfur Dioxide - emitted from fossil fuel combustion",
  co: "Carbon Monoxide - colorless, odorless gas from incomplete combustion",
  co2: "Carbon Dioxide - greenhouse gas from burning fossil fuels, industrial processes",
  o3: "Ozone - ground-level ozone formed by chemical reactions",
}

export function AQIDashboard() {
  // Model & Selection State
  const [selectedModel, setSelectedModel] = useState("XGBoost")
  const [selectedYear, setSelectedYear] = useState("2024")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [timeRange, setTimeRange] = useState("3")

  // Dynamic State/City from CSV
  const [stateCityMap, setStateCityMap] = useState<Record<string, string[]>>({})
  const states = Object.keys(stateCityMap)
  const cities = stateCityMap[selectedState] || []

  // Live Data Toggle
  const [useLiveData, setUseLiveData] = useState(false)
 const [isLoadingLive, setIsLoadingLive] = useState(false)
 const [liveAQI, setLiveAQI] = useState<number | null>(null)

  // Input Features
  const [inputs, setInputs] = useState<PredictionInput>({
    pm25: 65,
    pm10: 120,
    no2: 45,
    so2: 15,
    co: 1.2,
    co2: 420,
    o3: 35,
    temperature: 28,
    humidity: 65,
    wind_speed: 3.5,
  })

  // Prediction State
  const [predictionResult, setPredictionResult] = useState<{
    aqi: number
    category: ReturnType<typeof getCategory>
    healthImpact: string
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)

  // Model Comparison State
  const [showModelComparison, setShowModelComparison] = useState(false)
  const [modelResults, setModelResults] = useState<ModelResult[]>([])

  // Comparison State
  const [showComparison, setShowComparison] = useState(false)
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  /* ---------- LOAD CSV LOCATIONS ---------- */
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await fetch("/api/weather?type=locations")
        const data = await res.json()

        const map = data.stateCityMap || {}
        setStateCityMap(map)

        const firstState = Object.keys(map)[0]

        if (firstState) {
          setSelectedState(firstState)
          setSelectedCity(map[firstState][0] || "")
        }
      } catch (error) {
        console.log(error)
      }
    }

    loadLocations()
  }, [])

  // Update input helper
  const updateInput = useCallback(
    (key: keyof PredictionInput, value: number) => {
      setInputs((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  /* ---------- FETCH LIVE WEATHER + AQI ---------- */
  const fetchLiveWeather = useCallback(async () => {
    if (!selectedCity) return

    setIsLoadingLive(true)

    try {
      const response = await fetch(
        `/api/weather?city=${encodeURIComponent(selectedCity)}`
      )

      if (response.ok) {
        const data = await response.json()

        setInputs((prev) => ({
          ...prev,
          temperature: data.temperature ?? prev.temperature,
          humidity: data.humidity ?? prev.humidity,
          wind_speed: data.wind_speed ?? prev.wind_speed,
          pm25: data.pm25 ?? prev.pm25,
          pm10: data.pm10 ?? prev.pm10,
          no2: data.no2 ?? prev.no2,
          so2: data.so2 ?? prev.so2,
          co: data.co ?? prev.co,
          o3: data.o3 ?? prev.o3,
        }))

        if (data.aqi !== undefined && data.aqi !== null) {
           setLiveAQI(Number(data.aqi))
       }
      }
    } catch (error) {
     console.log(error)
     setLiveAQI(null)
    }

    setIsLoadingLive(false)
  }, [selectedCity])

  /* ---------- AUTO REFRESH WHEN CITY CHANGES ---------- */
  useEffect(() => {
    if (useLiveData && selectedCity) {
      fetchLiveWeather()
    }
  }, [selectedCity, useLiveData, fetchLiveWeather])

  // Handle live data toggle
  const handleLiveToggle = useCallback(
    async (checked: boolean) => {
      setUseLiveData(checked)
      if (checked) {
        await fetchLiveWeather()
      }
    },
    [fetchLiveWeather]
  )

  // Predict AQI
  const predictAQI = useCallback(async () => {
    setIsLoading(true)

    // Simulate API call to backend
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simplified AQI calculation
    const weights = {
      pm25: 0.35,
      pm10: 0.2,
      no2: 0.12,
      so2: 0.08,
      co: 0.08,
      co2: 0.05,
      o3: 0.12,
    }

    // Calculate weighted AQI
    let baseAQI =
      inputs.pm25 * 2 * weights.pm25 +
      inputs.pm10 * weights.pm10 +
      inputs.no2 * 1.5 * weights.no2 +
      inputs.so2 * 2 * weights.so2 +
      inputs.co * 30 * weights.co +
      (inputs.co2 - 400) * 0.1 * weights.co2 +
      inputs.o3 * 1.2 * weights.o3

    // Adjust for environmental factors
    if (inputs.temperature > 35) baseAQI *= 1.1
    if (inputs.humidity < 30) baseAQI *= 1.05
    if (inputs.wind_speed > 5) baseAQI *= 0.9

    // Add model-specific variance
    const modelVariance: Record<string, number> = {
      XGBoost: 0,
      "Random Forest": 5,
      "Gradient Boost": -3,
      MLP: 8,
      SVR: -5,
      Ridge: 10,
      Hybrid: -2,
    }

    const predictedAQI = Math.round(
      Math.max(20, Math.min(500, baseAQI + (modelVariance[selectedModel] || 0)))
    )
    const category = getCategory(predictedAQI)
    const healthImpact = getHealthImpact(category)

    // Generate model comparison results
    const allModelResults = simulateModelPredictions(inputs, baseAQI)
    setModelResults(allModelResults)
    setShowModelComparison(true)

    setPredictionResult({ aqi: predictedAQI, category, healthImpact })
    setIsLoading(false)
  }, [inputs, selectedModel])

  // Compare AQI trends
  const compareAQI = useCallback(async () => {
  setIsLoadingHistory(true)
  setShowComparison(true)

  try {
    const res = await fetch(
      `/api/weather?type=history&city=${encodeURIComponent(
        selectedCity
      )}&years=${timeRange}`
    )

    const json = await res.json()

    if (json.history?.length) {
      const rows = json.history

      let filtered = rows

      if (timeRange === "1") {
        filtered = rows.slice(-1)
      } else if (timeRange === "3") {
        filtered = rows.slice(-3)
      } else {
        filtered = rows
      }

      const data = filtered.map((item: any) => ({
        date: item.date,
        aqi: item.aqi,
        category: getCategory(item.aqi),
      }))

      setHistoricalData(data)
    } else {
      setHistoricalData(
        generateHistoricalData(3, predictionResult?.aqi || 120)
      )
    }
  } catch {
    setHistoricalData(
      generateHistoricalData(3, predictionResult?.aqi || 120)
    )
  }

  setIsLoadingHistory(false)
}, [selectedCity, timeRange, predictionResult])
  // Reset form
  const resetForm = useCallback(() => {
    setInputs({
      pm25: 65,
      pm10: 120,
      no2: 45,
      so2: 15,
      co: 1.2,
      co2: 420,
      o3: 35,
      temperature: 28,
      humidity: 65,
      wind_speed: 3.5,
    })
    setPredictionResult(null)
    setShowComparison(false)
    setShowModelComparison(false)
    setHistoricalData([])
    setModelResults([])
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f1629] to-[#0a0a1a] text-foreground">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-chart-2/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-balance bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent mb-3">
            Smart AQI Prediction & Analysis System
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Live + Historical Air Quality Insights using Machine Learning
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Model & Context Selection */}
            <GlassCard className="p-6" hover>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Model & Context
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ML Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
  value={selectedState}
  onValueChange={(value) => {
    setSelectedState(value)
    setSelectedCity(stateCityMap[value]?.[0] || "")
  }}
>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </GlassCard>

            {/* Live Data Toggle */}
<GlassCard className="p-6" hover>
  <div className="mb-4">
    <p className="text-xs text-muted-foreground">Selected City Live AQI</p>
    <h3 className="text-3xl font-bold text-cyan-400">
      {liveAQI ?? "--"}
    </h3>
  </div>

  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Cloud className="h-5 w-5 text-primary" />
      <div>
        <Label className="text-base font-medium">
          Live AQI & Weather
        </Label>
        <p className="text-xs text-muted-foreground">
          Auto-fetch from OpenWeather + WAQI
        </p>
      </div>
    </div>

    <Switch
      checked={useLiveData}
      onCheckedChange={handleLiveToggle}
      disabled={isLoadingLive}
    />
  </div>

  {isLoadingLive && (
    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Fetching live data...
    </div>
  )}

  {useLiveData && !isLoadingLive && (
    <div className="grid grid-cols-3 gap-3 mt-4 text-center">
      <div className="rounded-lg bg-secondary/40 p-2">
        <p className="text-xs text-muted-foreground">Temp</p>
        <p className="font-semibold">{inputs.temperature}°C</p>
      </div>

      <div className="rounded-lg bg-secondary/40 p-2">
        <p className="text-xs text-muted-foreground">Humidity</p>
        <p className="font-semibold">{inputs.humidity}%</p>
      </div>

      <div className="rounded-lg bg-secondary/40 p-2">
        <p className="text-xs text-muted-foreground">Wind</p>
        <p className="font-semibold">{inputs.wind_speed} m/s</p>
      </div>
    </div>
  )}
</GlassCard>

            {/* Environmental Inputs */}
            <GlassCard className="p-6" hover>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-primary" />
                Environmental
              </h2>
              <div className="space-y-4">
                <InputField
                  label="Temperature"
                  value={inputs.temperature}
                  onChange={(v) => updateInput("temperature", v)}
                  unit="C"
                  tooltip="Current air temperature"
                  max={50}
                />
                <InputField
                  label="Humidity"
                  value={inputs.humidity}
                  onChange={(v) => updateInput("humidity", v)}
                  unit="%"
                  tooltip="Relative humidity percentage"
                  max={100}
                />
                <InputField
                  label="Wind Speed"
                  value={inputs.wind_speed}
                  onChange={(v) => updateInput("wind_speed", v)}
                  unit="m/s"
                  tooltip="Wind speed in meters per second"
                  max={50}
                />
              </div>
            </GlassCard>
          </motion.div>

          {/* Middle Column - Pollutants & Actions */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Pollutant Inputs */}
            <GlassCard className="p-6" hover>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wind className="h-5 w-5 text-primary" />
                Pollutant Levels
              </h2>
              <div className="space-y-4">
                <InputField
                  label="PM2.5"
                  value={inputs.pm25}
                  onChange={(v) => updateInput("pm25", v)}
                  unit="ug/m3"
                  tooltip={pollutantTooltips.pm25}
                  max={500}
                />
                <InputField
                  label="PM10"
                  value={inputs.pm10}
                  onChange={(v) => updateInput("pm10", v)}
                  unit="ug/m3"
                  tooltip={pollutantTooltips.pm10}
                  max={500}
                />
                <InputField
                  label="NO2"
                  value={inputs.no2}
                  onChange={(v) => updateInput("no2", v)}
                  unit="ppb"
                  tooltip={pollutantTooltips.no2}
                  max={200}
                />
                <InputField
                  label="SO2"
                  value={inputs.so2}
                  onChange={(v) => updateInput("so2", v)}
                  unit="ppb"
                  tooltip={pollutantTooltips.so2}
                  max={200}
                />
                <InputField
                  label="CO"
                  value={inputs.co}
                  onChange={(v) => updateInput("co", v)}
                  unit="mg/m3"
                  tooltip={pollutantTooltips.co}
                  max={50}
                />
                <InputField
                  label="CO2"
                  value={inputs.co2}
                  onChange={(v) => updateInput("co2", v)}
                  unit="ppm"
                  tooltip={pollutantTooltips.co2}
                  max={2000}
                />
                <InputField
                  label="O3"
                  value={inputs.o3}
                  onChange={(v) => updateInput("o3", v)}
                  unit="ppb"
                  tooltip={pollutantTooltips.o3}
                  max={200}
                />
              </div>
            </GlassCard>

            {/* Action Buttons */}
            <GlassCard className="p-6" hover>
              <div className="space-y-3">
                <Button
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                  onClick={predictAQI}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Predict AQI
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Time Range</Label>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Last 1 Year</SelectItem>
                        <SelectItem value="3">Last 3 Years</SelectItem>
                        <SelectItem value="12">All Available Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="secondary"
                    className="h-full mt-auto"
                    onClick={compareAQI}
                    disabled={isLoadingHistory}
                  >
                    {isLoadingHistory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Compare
                      </>
                    )}
                  </Button>
                </div>

                <Button variant="outline" className="w-full" onClick={resetForm}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset All
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Right Column - Results */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Prediction Result */}
            <GlassCard className="p-6" hover>
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                AQI Prediction Result
              </h2>

              <AnimatePresence mode="wait">
                {predictionResult ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AQIGauge value={predictionResult.aqi} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                  >
                    <Activity className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-center">
                      Enter pollutant levels and click
                      <br />
                      <span className="font-semibold text-primary">&quot;Predict AQI&quot;</span> to see results
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Model Info Card */}
            <GlassCard className="p-6" hover>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                Selected Model: {selectedModel}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedModel === "XGBoost" &&
                  "XGBoost provides the best accuracy with lowest RMSE for AQI prediction."}
                {selectedModel === "Random Forest" &&
                  "Ensemble method using multiple decision trees for robust predictions."}
                {selectedModel === "Gradient Boost" &&
                  "Sequential ensemble that builds trees to correct previous errors."}
                {selectedModel === "MLP" &&
                  "Neural network with multiple hidden layers for complex patterns."}
                {selectedModel === "SVR" &&
                  "Support Vector Regression for high-dimensional feature spaces."}
                {selectedModel === "Ridge" &&
                  "Linear regression with L2 regularization for stable predictions."}
                {selectedModel === "Hybrid" &&
                  "Ensemble of XGBoost, MLP, and Gradient Boost for best accuracy."}
              </p>
            </GlassCard>
          </motion.div>
        </div>

        {/* Health Impact & Precautions Section */}
        <AnimatePresence>
          {predictionResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8"
            >
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Heart className="h-6 w-6 text-primary" />
                  Health Impact & Precautions
                </h2>
                <HealthPrecautions 
                  category={predictionResult.category} 
                  aqi={predictionResult.aqi} 
                />
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Model Comparison Section */}
        <AnimatePresence>
          {showModelComparison && modelResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8"
            >
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Layers className="h-6 w-6 text-primary" />
                  Model Comparison & Performance
                </h2>
                <ModelComparison results={modelResults} selectedModel={selectedModel} />
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Historical Comparison Section */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8"
            >
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  Year-wise AQI Analysis - {selectedCity}
                </h2>

                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Loading yearly AQI data...</span>
                  </div>
                ) : (
                  <AQICharts data={historicalData} />
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          className="mt-12 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>
            Powered by Machine Learning models trained on CPCB AQI data with CO2 emissions.
            <br />
            Models: XGBoost, Random Forest, Gradient Boost, MLP, SVR, Ridge, Hybrid
          </p>
        </motion.footer>
      </div>
    </div>
  )
}
