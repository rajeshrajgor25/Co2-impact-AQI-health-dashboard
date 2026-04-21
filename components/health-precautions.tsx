"use client"

import { GlassCard } from "./glass-card"
import {
  type AQICategory,
  getHealthImpact,
  getPrecautions,
  getCategoryColor,
  getCategoryGradient,
} from "@/lib/aqi-utils"

import {
  Heart,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Wind,
  Home,
  Shield, // ✅ replaced Mask
} from "lucide-react"

import { motion } from "framer-motion"

interface HealthPrecautionsProps {
  category: AQICategory
  aqi: number
}

export function HealthPrecautions({
  category,
  aqi,
}: HealthPrecautionsProps) {
  const healthImpact = getHealthImpact(category)
  const precautions = getPrecautions(category)
  const color = getCategoryColor(category)
  const gradient = getCategoryGradient(category)

  const getSeverityIcon = () => {
    switch (category) {
      case "Good":
        return <CheckCircle2 className="h-6 w-6" style={{ color }} />
      case "Satisfactory":
        return <Heart className="h-6 w-6" style={{ color }} />
      case "Moderate":
        return <AlertTriangle className="h-6 w-6" style={{ color }} />
      case "Poor":
      case "Very Poor":
        return <ShieldAlert className="h-6 w-6" style={{ color }} />
      case "Severe":
        return <Stethoscope className="h-6 w-6" style={{ color }} />
      default:
        return <Heart className="h-6 w-6" style={{ color }} />
    }
  }

  const getPrecautionIcon = (index: number) => {
    const icons = [
      <Home key="home" className="h-4 w-4" />,
      <Shield key="shield-mask" className="h-4 w-4" />, // ✅ replaced Mask
      <Wind key="wind" className="h-4 w-4" />,
      <ShieldAlert key="shield" className="h-4 w-4" />,
      <Heart key="heart" className="h-4 w-4" />,
      <Stethoscope key="stethoscope" className="h-4 w-4" />,
      <AlertTriangle key="alert" className="h-4 w-4" />,
      <CheckCircle2 key="check" className="h-4 w-4" />,
    ]

    return icons[index % icons.length]
  }

  const getAffectedGroups = () => {
    const groups = []

    if (category !== "Good") {
      groups.push({
        name: "Children",
        risk:
          category === "Satisfactory" ? "Low" : "Medium-High",
      })

      groups.push({
        name: "Elderly",
        risk:
          category === "Satisfactory" ? "Low" : "Medium-High",
      })
    }

    if (
      ["Moderate", "Poor", "Very Poor", "Severe"].includes(category)
    ) {
      groups.push({ name: "Asthma Patients", risk: "High" })
      groups.push({ name: "Heart Patients", risk: "High" })
    }

    if (
      ["Poor", "Very Poor", "Severe"].includes(category)
    ) {
      groups.push({ name: "Outdoor Workers", risk: "High" })
      groups.push({ name: "Athletes", risk: "High" })
    }

    if (
      ["Very Poor", "Severe"].includes(category)
    ) {
      groups.push({ name: "Healthy Adults", risk: "Medium" })
      groups.push({ name: "Everyone", risk: "High" })
    }

    return groups
  }

  const affectedGroups = getAffectedGroups()

  return (
    <div className="space-y-6">
      {/* Health Impact */}
      <GlassCard className={`p-6 bg-gradient-to-br ${gradient}`}>
        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: color + "20" }}
          >
            {getSeverityIcon()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">
                Health Impact Assessment
              </h3>

              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: color + "30",
                  color,
                }}
              >
                AQI {aqi} - {category}
              </span>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {healthImpact}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Two Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Precautions */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Recommended Precautions
          </h3>

          <div className="space-y-3">
            {precautions.map((precaution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30"
              >
                <div
                  className="p-1.5 rounded-md mt-0.5"
                  style={{
                    backgroundColor: color + "20",
                    color,
                  }}
                >
                  {getPrecautionIcon(index)}
                </div>

                <p className="text-sm text-foreground/90">
                  {precaution}
                </p>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Vulnerable Groups */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Vulnerable Groups
          </h3>

          {affectedGroups.length > 0 ? (
            <div className="space-y-3">
              {affectedGroups.map((group, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <span className="text-sm font-medium">
                    {group.name}
                  </span>

                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      group.risk === "High"
                        ? "bg-red-500/20 text-red-400"
                        : group.risk === "Medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : group.risk === "Medium-High"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {group.risk} Risk
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mb-3 text-green-400" />
              <p className="text-center">
                Air quality is good. No specific groups at elevated risk.
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}