import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

type CsvRow = Record<string, string>

/* ---------- PARSE CSV / TSV ---------- */
function parseCSV(text: string): CsvRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")

  if (!lines.length) return []

  const delimiter = lines[0].includes("\t") ? "\t" : ","

  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.trim().replace(/^"|"$/g, ""))

  return lines.slice(1).map((line) => {
    const values = line.split(delimiter)
    const row: CsvRow = {}

    headers.forEach((header, i) => {
      row[header] = (values[i] || "").trim().replace(/^"|"$/g, "")
    })

    return row
  })
}

/* ---------- LOAD DATASET ---------- */
function loadCSV(): CsvRow[] {
  try {
    const filePath = path.join(process.cwd(), "merged_AQI_CO2.csv")

    if (!fs.existsSync(filePath)) {
      console.log("CSV file not found:", filePath)
      return []
    }

    const raw = fs.readFileSync(filePath, "utf-8")
    return parseCSV(raw)
  } catch (error) {
    console.log("CSV read error:", error)
    return []
  }
}

/* ---------- STATE / CITY ---------- */
function getLocations(rows: CsvRow[]) {
  const stateMap: Record<string, string[]> = {}

  rows.forEach((row) => {
    const state = (row["State_UnionTerritory"] || "").trim()
    const city = (row["City_District"] || "").trim()

    if (!state || !city) return

    if (!stateMap[state]) stateMap[state] = []

    if (!stateMap[state].includes(city)) {
      stateMap[state].push(city)
    }
  })

  Object.keys(stateMap).forEach((state) => {
    stateMap[state].sort()
  })

  return stateMap
}

/* ---------- YEAR-WISE HISTORY ---------- */
function getHistoricalAQI(rows: CsvRow[], city: string) {
  const filtered = rows
    .filter(
      (r) =>
        (r["City_District"] || "").trim().toLowerCase() ===
        city.toLowerCase()
    )
    .map((r) => ({
      year: Number(r["Year"]) || 0,
      aqi: Number(r["AQI"]) || 100,
    }))
    .filter((r) => r.year > 0)
    .sort((a, b) => a.year - b.year)

  return filtered.map((item) => ({
    date: `${item.year}-01-01`,
    aqi: item.aqi,
  }))
}

/* ---------- YEAR LABEL DATA ---------- */
function getYearlyAverage(rows: CsvRow[], city: string) {
  return rows
    .filter(
      (r) =>
        (r["City_District"] || "").trim().toLowerCase() ===
        city.toLowerCase()
    )
    .map((r) => ({
      label: r["Year"] || "Unknown",
      aqi: Number(r["AQI"]) || 0,
    }))
    .sort((a, b) => Number(a.label) - Number(b.label))
}

/* ---------- API ---------- */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get("type") || "weather"
  const city = searchParams.get("city") || "Delhi"

  const rows = loadCSV()

  /* ---------- LOCATIONS ---------- */
  if (type === "locations") {
    return NextResponse.json({
      stateCityMap: getLocations(rows),
    })
  }

  /* ---------- HISTORY ---------- */
  if (type === "history") {
    return NextResponse.json({
      history: getHistoricalAQI(rows, city),
      yearly: getYearlyAverage(rows, city),
    })
  }

  /* ---------- LIVE WEATHER + AQI ---------- */
  const weatherKey = process.env.OPENWEATHER_API_KEY
  const waqiKey = process.env.WAQI_API_KEY

  let result: any = {
    temperature: 30,
    humidity: 60,
    wind_speed: 3,
    aqi: 100,
    pm25: 50,
    pm10: 90,
    no2: 30,
    so2: 10,
    co: 1,
    o3: 20,
  }

  try {
    /* ---------- OPEN WEATHER ---------- */
    if (weatherKey) {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          city
        )},IN&appid=${weatherKey}&units=metric`,
        { cache: "no-store" }
      )

      if (res.ok) {
        const data = await res.json()

        result.temperature = Math.round(data.main.temp * 10) / 10
        result.humidity = data.main.humidity
        result.wind_speed = Math.round(data.wind.speed * 10) / 10
      }
    }

    /* ---------- WAQI ---------- */
    if (waqiKey) {
      const res = await fetch(
        `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${waqiKey}`,
        { cache: "no-store" }
      )

      if (res.ok) {
        const json = await res.json()

        if (json.status === "ok") {
          const d = json.data

          result.aqi = d.aqi || result.aqi
          result.pm25 = d.iaqi?.pm25?.v || result.pm25
          result.pm10 = d.iaqi?.pm10?.v || result.pm10
          result.no2 = d.iaqi?.no2?.v || result.no2
          result.so2 = d.iaqi?.so2?.v || result.so2
          result.co = d.iaqi?.co?.v || result.co
          result.o3 = d.iaqi?.o3?.v || result.o3
        }
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.log("API error:", error)
    return NextResponse.json(result)
  }
}