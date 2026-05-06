'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DayItinerary, Activity, FullItinerary } from '@/types'
import RobotaxiTransfer from '../RobotaxiTransfer/RobotaxiTransfer'

interface ItineraryCardProps {
  dayPlan: DayItinerary
  isActive: boolean
  index: number
}

const TYPE_ICONS: Record<Activity['type'], string> = {
  scenic: '🏔️',
  food: '🍜',
  culture: '🏛️',
  outdoor: '🥾',
  shopping: '🛍️',
  accommodation: '🏨',
}

const TIME_THEME: Record<string, { color: string; emoji: string }> = {
  '上午': { color: 'var(--accent-yellow)', emoji: '☀️' },
  '下午': { color: 'var(--accent-blue)', emoji: '🌤️' },
  '晚上': { color: 'var(--accent-purple)', emoji: '🌙' },
  '傍晚': { color: 'var(--accent-peach)', emoji: '🌅' },
  '下午茶': { color: 'var(--accent-mint)', emoji: '🍵' },
}

const WEATHER_EMOJI: Record<string, string> = {
  sunny: '☀️',
  partly: '⛅',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
}

function DayCard({ dayPlan, index, isActive }: { dayPlan: DayItinerary; index: number; isActive: boolean }) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/unsplash?query=${encodeURIComponent(dayPlan.imageQuery)}`)
      .then(r => r.json())
      .then(data => setImageUrl(data.url))
      .catch(() => {})
  }, [dayPlan.imageQuery])

  const weatherEmoji = dayPlan.weather ? WEATHER_EMOJI[dayPlan.weather.type] ?? '⛅' : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{
        opacity: isActive ? 1 : 0.7,
        y: 0,
        scale: isActive ? 1 : 0.94,
      }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 w-[300px] glass-strong rounded-[24px] overflow-hidden float-card"
    >
      {/* 图片区 */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[var(--bg-warm)] to-[var(--bg-cool)]">
        {imageUrl && (
          <motion.img
            src={imageUrl}
            alt={dayPlan.theme}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: imageLoaded ? 1 : 0, scale: imageLoaded ? 1 : 1.1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            onLoad={() => setImageLoaded(true)}
          />
        )}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-7 h-7 border-[2.5px] border-[var(--accent-blue)]/30 border-t-[var(--accent-blue)] rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

        {/* Day badge */}
        <div className="absolute top-3 left-3 glass-strong rounded-2xl px-3 py-1.5">
          <div className="text-[var(--text-tertiary)] text-[9px] font-semibold tracking-[0.2em] uppercase">Day</div>
          <div className="text-[var(--text-primary)] text-xl font-bold leading-none tabular-nums">{dayPlan.day}</div>
        </div>

        {/* 天气气泡 */}
        {dayPlan.weather && weatherEmoji && (
          <div className="absolute top-3 right-3 glass-strong rounded-full px-2.5 py-1 flex items-center gap-1">
            <span className="text-base">{weatherEmoji}</span>
            <span className="text-[var(--text-primary)] text-xs font-bold tabular-nums">{dayPlan.weather.high}°</span>
          </div>
        )}

        {/* 预算 pill */}
        <div className="absolute bottom-3 right-3 glass-strong rounded-full px-3 py-1">
          <span className="text-[var(--accent-mint)] text-xs font-bold tabular-nums">¥{dayPlan.estimatedCost.toLocaleString()}</span>
        </div>
      </div>

      {/* 内容区 */}
      <div className="p-4">
        {/* 主题 + 城市 */}
        <h3 className="text-[var(--text-primary)] font-semibold text-base mb-1 leading-snug">
          {dayPlan.theme}
        </h3>
        <div className="text-[var(--text-tertiary)] text-[10px] mb-3">📍 {dayPlan.city}</div>

        {/* 导游开场词 */}
        {dayPlan.guideNarration && (
          <div className="text-[var(--text-secondary)] text-[11px] leading-relaxed mb-3 italic px-2 border-l-2 border-[var(--accent-blue)]/30">
            &ldquo;{dayPlan.guideNarration}&rdquo;
          </div>
        )}

        {/* 天气建议 */}
        {dayPlan.weather?.suggestion && (
          <div className="mb-3 flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] bg-[var(--accent-blue)]/5 rounded-lg px-2 py-1.5">
            <span>💡</span>
            <span>{dayPlan.weather.suggestion}</span>
          </div>
        )}

        {/* 活动列表 */}
        <div className="space-y-3">
          {dayPlan.activities.map((activity, i) => {
            const theme = TIME_THEME[activity.time] ?? { color: 'var(--text-tertiary)', emoji: '' }
            return (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: `${theme.color}15` }}
                >
                  {TYPE_ICONS[activity.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ color: theme.color, background: `${theme.color}15` }}
                    >
                      {activity.time}
                    </span>
                    <span className="text-[var(--text-tertiary)] text-[10px]">{activity.duration}</span>
                    {activity.needReservation && (
                      <span className="text-[9px] font-bold text-[#D85046] bg-[#D85046]/10 px-1.5 py-0.5 rounded-md">
                        需预约
                      </span>
                    )}
                    {activity.ticketPrice !== undefined && activity.ticketPrice > 0 && (
                      <span className="text-[9px] text-[var(--accent-mint)] font-semibold tabular-nums">
                        ¥{activity.ticketPrice}
                      </span>
                    )}
                  </div>
                  <div className="text-[var(--text-primary)] text-sm font-medium leading-tight">
                    {activity.title}
                  </div>
                  {activity.whyVisit && (
                    <div className="text-[var(--text-tertiary)] text-[10px] mt-0.5 leading-relaxed line-clamp-2">
                      {activity.whyVisit}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 住宿 */}
        {dayPlan.accommodation && (
          <div className="mt-3 pt-3 border-t border-[var(--hairline)] flex items-start gap-2">
            <span className="text-base">🏨</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[var(--text-secondary)]">住宿</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">{dayPlan.accommodation.area}</span>
                {dayPlan.accommodation.priceRange && (
                  <span className="text-[10px] text-[var(--accent-mint)] font-semibold tabular-nums ml-auto">
                    {dayPlan.accommodation.priceRange}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-tight line-clamp-1">
                {dayPlan.accommodation.recommendation}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function ItineraryCard({ dayPlan, isActive, index }: ItineraryCardProps) {
  return <DayCard dayPlan={dayPlan} index={index} isActive={isActive} />
}

// ────────────────────────────────────────
// 行程总览（接受 FullItinerary，自动渲染天 + 跨城卡）
// ────────────────────────────────────────
interface ItineraryListProps {
  itinerary: FullItinerary
}

export function ItineraryList({ itinerary }: ItineraryListProps) {
  const { dayPlans, totalBudget, destination, highlights, personalizedFor } = itinerary
  const [activeDay, setActiveDay] = useState(0)

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 顶部总览 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between glass rounded-[20px] px-6 py-4 flex-shrink-0"
      >
        <div className="min-w-0">
          <div className="text-[var(--text-tertiary)] text-[10px] font-semibold tracking-[0.2em] uppercase mb-1">
            Your Itinerary
          </div>
          <h2 className="text-[var(--text-primary)] text-2xl font-bold leading-tight">
            {destination}
            <span className="text-[var(--text-tertiary)] text-base font-medium ml-2">· {dayPlans.length} 天</span>
          </h2>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {personalizedFor && (
              <span className="text-[var(--accent-purple)] text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(175, 82, 222, 0.1)' }}>
                {personalizedFor}
              </span>
            )}
            {highlights?.slice(0, 3).map((h, i) => (
              <span
                key={i}
                className="text-[var(--text-secondary)] text-xs px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(0, 122, 255, 0.08)' }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[var(--text-tertiary)] text-[10px] font-semibold tracking-[0.2em] uppercase mb-1">
            预计费用
          </div>
          <div className="text-[var(--accent-mint)] text-3xl font-bold tabular-nums leading-tight">
            ¥{totalBudget.toLocaleString()}
          </div>
        </div>
      </motion.div>

      {/* 日程指示条 */}
      <div className="flex items-center gap-2 px-1 flex-shrink-0">
        {dayPlans.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className="flex-1 max-w-16 h-1 rounded-full transition-all duration-500"
            style={{
              background:
                activeDay === i
                  ? 'var(--accent-blue)'
                  : i < activeDay
                  ? 'var(--accent-blue)40'
                  : 'rgba(0, 0, 0, 0.08)',
            }}
            aria-label={`Day ${i + 1}`}
          />
        ))}
        <span className="ml-3 text-[var(--text-tertiary)] text-xs font-medium tabular-nums">
          {activeDay + 1} / {dayPlans.length}
        </span>
      </div>

      {/* 卡片横向铺开 + 跨城卡片 */}
      <div className="flex-1 overflow-hidden">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide h-full items-start">
          <AnimatePresence>
            {dayPlans.map((day, i) => (
              <div key={day.day} className="flex gap-4 items-start">
                <ItineraryCard dayPlan={day} isActive={i === activeDay} index={i} />
                {/* 在两天之间插入跨城 Robotaxi 卡（如果下一天有 transfer 标记） */}
                {i < dayPlans.length - 1 && dayPlans[i + 1]?.crossCityTransfer && (
                  <RobotaxiTransfer transfer={dayPlans[i + 1].crossCityTransfer!} />
                )}
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
