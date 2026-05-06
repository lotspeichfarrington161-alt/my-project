'use client'

import { motion } from 'framer-motion'
import { DayItinerary } from '@/types'

interface RobotaxiTransferProps {
  transfer: NonNullable<DayItinerary['crossCityTransfer']>
}

/**
 * 跨城 Robotaxi 接送卡片，显示在两个 DayCard 之间
 */
export default function RobotaxiTransfer({ transfer }: RobotaxiTransferProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 self-center w-44 glass-strong rounded-[20px] p-4 relative"
      style={{
        background: 'linear-gradient(135deg, rgba(165, 199, 255, 0.4) 0%, rgba(255, 255, 255, 0.6) 100%)',
        border: '1px solid rgba(0, 122, 255, 0.15)',
      }}
    >
      {/* 顶部箭头指示 */}
      <div className="flex items-center justify-center gap-1 mb-3">
        <span className="text-[var(--text-tertiary)] text-[10px] font-semibold tracking-[0.15em]">CROSS-CITY</span>
      </div>

      {/* Robotaxi 图标 + 移动动画 */}
      <div className="relative h-12 mb-3">
        <div className="absolute inset-y-0 inset-x-2 flex items-center">
          <div className="flex-1 h-0.5 bg-[var(--accent-blue)]/30 rounded-full" />
        </div>
        <motion.div
          className="absolute inset-y-0 flex items-center"
          animate={{ left: ['10%', '70%', '10%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-base"
            style={{
              background: 'linear-gradient(135deg, var(--accent-blue) 0%, #4DA8FF 100%)',
              boxShadow: '0 8px 20px rgba(0, 122, 255, 0.3)',
            }}
          >
            🚗
          </div>
        </motion.div>
      </div>

      {/* 起点 → 终点 */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-center flex-1">
          <div className="text-[var(--text-tertiary)] text-[9px] mb-0.5">FROM</div>
          <div className="text-[var(--text-primary)] text-xs font-bold">{transfer.from}</div>
        </div>
        <svg className="w-4 h-4 text-[var(--accent-blue)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <div className="text-center flex-1">
          <div className="text-[var(--text-tertiary)] text-[9px] mb-0.5">TO</div>
          <div className="text-[var(--text-primary)] text-xs font-bold">{transfer.to}</div>
        </div>
      </div>

      {/* 距离 + 时长 */}
      <div className="flex items-center justify-around pt-2 border-t border-[var(--hairline)]">
        <div className="text-center">
          <div className="text-[var(--accent-blue)] text-xs font-bold tabular-nums">{transfer.distance}</div>
          <div className="text-[var(--text-tertiary)] text-[9px]">距离</div>
        </div>
        <div className="text-center">
          <div className="text-[var(--accent-blue)] text-xs font-bold tabular-nums">{transfer.duration}</div>
          <div className="text-[var(--text-tertiary)] text-[9px]">车程</div>
        </div>
      </div>

      {/* 底部说明 */}
      <div className="mt-2 text-center text-[var(--text-tertiary)] text-[9px]">
        Robotaxi 城际专车
      </div>
    </motion.div>
  )
}
