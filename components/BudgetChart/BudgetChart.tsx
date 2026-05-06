'use client'

import { motion } from 'framer-motion'
import { FullItinerary } from '@/types'

interface BudgetChartProps {
  itinerary: FullItinerary
}

interface BreakdownItem {
  label: string
  value: number
  color: string
  icon: string
}

function buildBreakdown(itinerary: FullItinerary): BreakdownItem[] {
  const total = itinerary.totalBudget
  const bb = itinerary.budgetBreakdown

  // 优先使用 AI 返回的，否则按比例估算
  return [
    { label: '住宿', value: bb?.accommodation ?? Math.round(total * 0.35), color: '#5DA6E0', icon: '🏨' },
    { label: '餐饮', value: bb?.food ?? Math.round(total * 0.25), color: '#34C759', icon: '🍜' },
    { label: '门票', value: bb?.tickets ?? Math.round(total * 0.20), color: '#AF52DE', icon: '🎫' },
    { label: 'Robotaxi', value: bb?.robotaxi ?? Math.round(total * 0.15), color: '#FF9F8C', icon: '🚗' },
    { label: '其他', value: bb?.other ?? Math.round(total * 0.05), color: '#FFCC02', icon: '✨' },
  ]
}

export default function BudgetChart({ itinerary }: BudgetChartProps) {
  const breakdown = buildBreakdown(itinerary)
  const total = breakdown.reduce((s, b) => s + b.value, 0)

  const size = 96
  const stroke = 12
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius

  let cumulative = 0
  const segments = breakdown.map(b => {
    const portion = b.value / total
    const length = portion * circ
    const seg = { ...b, length, offset: cumulative, portion }
    cumulative += length
    return seg
  })

  return (
    <div className="glass rounded-[20px] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[var(--text-tertiary)] text-[10px] font-semibold tracking-[0.2em] uppercase">Budget</div>
          <div className="text-[var(--text-primary)] text-sm font-semibold mt-0.5">预算分配</div>
        </div>
        <svg className="w-4 h-4 text-[var(--accent-mint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 8h6m-5 4h4m-7 4h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>

      <div className="flex items-center gap-3">
        {/* 环形图 */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(0, 0, 0, 0.05)"
              strokeWidth={stroke}
            />
            {segments.map((seg, i) => (
              <motion.circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${seg.length - 2} ${circ}`}
                strokeDashoffset={-seg.offset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.08 }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[var(--accent-mint)] text-sm font-bold tabular-nums leading-none">
              ¥{(total / 1000).toFixed(1)}k
            </div>
            <div className="text-[var(--text-tertiary)] text-[9px] mt-1">总预算</div>
          </div>
        </div>

        {/* 图例 */}
        <div className="flex-1 grid grid-cols-1 gap-1">
          {breakdown.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
              <span className="text-[10px] text-[var(--text-secondary)] flex-1">{b.label}</span>
              <span className="text-[10px] text-[var(--text-primary)] font-semibold tabular-nums">¥{b.value}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
