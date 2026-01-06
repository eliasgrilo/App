// ═══════════════════════════════════════════════════════════════════
// METRIC CARD MODULES — Types & Styles
// ═══════════════════════════════════════════════════════════════════

import { ReactNode, MouseEvent } from 'react'

export type StatusType = 'active' | 'warning' | 'danger' | 'inactive'
export type AccentColor = 'indigo' | 'emerald' | 'violet' | 'amber' | 'orange' | 'rose'

export interface AnimatedNumberProps { value: number; formatFn?: (value: number) => string; duration?: number }
export interface StatusDotProps { status?: StatusType; pulse?: boolean }

export interface MetricCardProps {
    title: string; value: number | string; subtitle?: string; status?: StatusType; accentColor?: AccentColor
    progress?: number; progressLabel?: string; formatFn?: (value: number | string) => string
    animated?: boolean; compact?: boolean; className?: string; onClick?: (e: MouseEvent<HTMLDivElement>) => void
}

export interface MetricGridProps { children: ReactNode; cols?: number; className?: string }
export interface MetricStat { label: string; value: number | string; color?: string; valueColor?: string; formatFn?: (value: number | string) => string }
export interface MetricHeroProps { title: string; badge?: string; value: number | string; subtitle?: string; stats?: MetricStat[]; formatFn?: (value: number | string) => string; className?: string }

export interface AccentStyle { dot: string; dotGlow: string; text: string; progress: string }

export const statusColors: Record<StatusType, string> = { active: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-rose-500', inactive: 'bg-zinc-400' }
export const statusGlows: Record<StatusType, string> = { active: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]', warning: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]', danger: 'shadow-[0_0_8px_rgba(244,63,94,0.4)]', inactive: '' }

export const accentMap: Record<AccentColor, AccentStyle> = {
    indigo: { dot: 'bg-indigo-500', dotGlow: 'shadow-[0_0_8px_rgba(99,102,241,0.4)]', text: 'text-indigo-500', progress: 'bg-indigo-500/80' },
    emerald: { dot: 'bg-emerald-500', dotGlow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]', text: 'text-emerald-500', progress: 'bg-emerald-500/80' },
    violet: { dot: 'bg-violet-500', dotGlow: 'shadow-[0_0_8px_rgba(139,92,246,0.4)]', text: 'text-violet-500', progress: 'bg-violet-500/80' },
    amber: { dot: 'bg-amber-500', dotGlow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]', text: 'text-amber-500', progress: 'bg-amber-500/80' },
    orange: { dot: 'bg-orange-500', dotGlow: 'shadow-[0_0_8px_rgba(249,115,22,0.4)]', text: 'text-orange-500', progress: 'bg-orange-500/80' },
    rose: { dot: 'bg-rose-500', dotGlow: 'shadow-[0_0_8px_rgba(244,63,94,0.4)]', text: 'text-rose-500', progress: 'bg-rose-500/80' }
}
