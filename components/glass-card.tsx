"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card backdrop-blur-xl shadow-xl",
        hover && "transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10 hover:shadow-2xl",
        className
      )}
    >
      {children}
    </div>
  )
}
