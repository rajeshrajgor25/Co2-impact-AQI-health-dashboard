"use client"

import { getCategoryColor, getCategory, getHealthImpact } from "@/lib/aqi-utils"
import { motion } from "framer-motion"

interface AQIGaugeProps {
  value: number
  size?: number
}

export function AQIGauge({ value, size = 280 }: AQIGaugeProps) {
  const category = getCategory(value)
  const color = getCategoryColor(category)
  const healthImpact = getHealthImpact(category)

  // Calculate progress (0-500 AQI scale)
  const maxAQI = 500
  const progress = Math.min(value / maxAQI, 1)
  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference - progress * circumference * 0.75

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background arc */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 280 280"
          className="rotate-[135deg]"
        >
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            strokeLinecap="round"
            className="text-muted/30"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
          />
          <motion.circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke={color}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 12px ${color})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-6xl font-bold"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {value}
          </motion.span>
          <span className="text-muted-foreground text-sm mt-1">AQI</span>
        </div>
      </div>

      {/* Category badge */}
      <motion.div
        className="px-6 py-2 rounded-full font-semibold text-lg"
        style={{
          backgroundColor: `${color}20`,
          color: color,
          boxShadow: `0 0 20px ${color}30`,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        {category}
      </motion.div>

      {/* Health impact */}
      <motion.p
        className="text-muted-foreground text-center text-sm max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        {healthImpact}
      </motion.p>
    </div>
  )
}
