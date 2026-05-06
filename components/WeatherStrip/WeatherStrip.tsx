'use client'

import { motion } from 'framer-motion'
import { DayItinerary, WeatherType } from '@/types'

interface WeatherStripProps {
  dayPlans: DayItinerary[]
  destination: string
}

function WeatherIcon({ type, size = 28 }: { type: WeatherType; size?: number }) {
  const icons: Record<WeatherType, React.ReactElement> = {
    sunny: (
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <circle cx="16" cy="16" r="6" fill="#FFB627" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <line
            key={deg}
            x1="16" y1="4" x2="16" y2="7"
            stroke="#FFB627"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${deg} 16 16)`}
          />
        ))}
      </svg>
    ),
    partly: (
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <circle cx="20" cy="12" r="5" fill="#FFB627" />
        <ellipse cx="14" cy="20" rx="8" ry="5" fill="#B8C5D6" />
      </svg>
    ),
    cloudy: (
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <ellipse cx="11" cy="18" rx="6" ry="4" fill="#9CA8B5" />
        <ellipse cx="20" cy="16" rx="8" ry="5" fill="#B8C5D6" />
      </svg>
    ),
    rainy: (
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <ellipse cx="16" cy="13" rx="9" ry="5" fill="#7A8A99" />
        {[11, 16, 21].map((x, i) => (
          <line key={i} x1={x} y1="20" x2={x - 2} y2="26" stroke="#5DA6E0" strokeWidth="2" strokeLinecap="round" />
        ))}
      </svg>
    ),
    snowy: (
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <ellipse cx="16" cy="13" rx="9" ry="5" fill="#C4D0DC" />
        {[10, 15, 20].map((x, i) => (
          <text key={i} x={x} y="26" fontSize="10" fill="#7AB7E0">❄</text>
        ))}
      </svg>
    ),
  }
  return icons[type] ?? icons.partly
}

export default function WeatherStrip({ dayPlans, destination }: WeatherStripProps) {
  // 如果 AI 没返回 weather，按出行季节推测
  const weather = dayPlans.map((day, i) => {
    const w = day.weather
    if (w) {
      return {
        day: day.day,
        type: w.type,
        high: w.high,
        low: w.low,
        desc: w.description,
        suggestion: w.suggestion,
      }
    }
    // fallback 估算
    const isSouth = /云南|三亚|桂林|厦门|海南/.test(destination)
    const isWest = /西藏|新疆|青海|敦煌/.test(destination)
    const baseHigh = isSouth ? 26 : isWest ? 18 : 22
    const baseLow = isSouth ? 16 : isWest ? 6 : 12
    const types: WeatherType[] = ['sunny', 'partly', 'cloudy', 'partly', 'sunny']
    const t = types[i % types.length]
    const descs: Record<WeatherType, string> = { sunny:'晴', partly:'多云', cloudy:'阴', rainy:'小雨', snowy:'雪' }
    return {
      day: day.day,
      type: t,
      high: baseHigh + Math.round(Math.random() * 4 - 2),
      low: baseLow + Math.round(Math.random() * 3 - 1),
      desc: descs[t],
      suggestion: '',
    }
  })

  return (
    <div className="glass rounded-[20px] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[var(--text-tertiary)] text-[10px] font-semibold tracking-[0.2em] uppercase">Weather</div>
          <div className="text-[var(--text-primary)] text-sm font-semibold mt-0.5">{destination} · 未来天气</div>
        </div>
        <svg className="w-4 h-4 text-[var(--accent-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      </div>

      <div className="flex gap-1.5">
        {weather.map((w, i) => (
          <motion.div
            key={w.day}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl"
            style={{ background: 'rgba(0, 0, 0, 0.02)' }}
          >
            <span className="text-[var(--text-tertiary)] text-[9px] font-semibold">D{w.day}</span>
            <WeatherIcon type={w.type} size={22} />
            <span className="text-[var(--text-primary)] text-[11px] font-bold tabular-nums">{w.high}°</span>
            <span className="text-[var(--text-tertiary)] text-[9px] tabular-nums">{w.low}°</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
