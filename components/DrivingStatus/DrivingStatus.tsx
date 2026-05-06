'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface DrivingStatusProps {
  currentLocation?: string  // 当前位置（如"朝阳门"）
  nextStop?: string          // 下一站（如"丽江古城"）
  etaMinutes?: number        // 距离下一站时间
}

/**
 * 车载驾驶状态卡：当前位置 + 下一程倒计时
 * 强化"乘客在 Robotaxi 上"的产品语境
 */
export default function DrivingStatus({
  currentLocation = '城市道路',
  nextStop = '目的地',
  etaMinutes = 12,
}: DrivingStatusProps) {
  const [displayMinutes, setDisplayMinutes] = useState(etaMinutes)

  // 模拟倒计时（每 30s 减 1 分钟）
  useEffect(() => {
    setDisplayMinutes(etaMinutes)
    const id = setInterval(() => {
      setDisplayMinutes(prev => Math.max(1, prev - 1))
    }, 30000)
    return () => clearInterval(id)
  }, [etaMinutes])

  return (
    <div className="glass rounded-[20px] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[var(--text-tertiary)] text-[10px] font-semibold tracking-[0.2em] uppercase">Driving</div>
          <div className="text-[var(--text-primary)] text-sm font-semibold mt-0.5">行驶状态</div>
        </div>
        <motion.div
          className="w-2 h-2 rounded-full bg-[var(--accent-mint)]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ boxShadow: '0 0 8px var(--accent-mint)' }}
        />
      </div>

      {/* 当前位置 */}
      <div className="mb-3">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] mt-1.5 flex-shrink-0"
            style={{ boxShadow: '0 0 6px var(--accent-blue)' }} />
          <div>
            <div className="text-[var(--text-tertiary)] text-[9px] uppercase tracking-wider">Current</div>
            <div className="text-[var(--text-primary)] text-sm font-semibold">{currentLocation}</div>
          </div>
        </div>
      </div>

      {/* 虚线连接 */}
      <div className="ml-1 my-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-0.5 h-1.5 my-0.5 bg-[var(--text-quaternary)] opacity-50" />
        ))}
      </div>

      {/* 下一站 */}
      <div className="mb-3">
        <div className="flex items-start gap-2">
          <svg className="w-2.5 h-2.5 text-[var(--accent-peach)] mt-1.5 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor"
            style={{ filter: 'drop-shadow(0 0 4px var(--accent-peach))' }}>
            <path d="M6 0L7.5 4.5H12L8.25 7L9.75 11.5L6 9L2.25 11.5L3.75 7L0 4.5H4.5L6 0z" />
          </svg>
          <div className="flex-1">
            <div className="text-[var(--text-tertiary)] text-[9px] uppercase tracking-wider">Next Stop</div>
            <div className="text-[var(--text-primary)] text-sm font-semibold">{nextStop}</div>
          </div>
        </div>
      </div>

      {/* ETA 倒计时（大字号） */}
      <div className="bg-[var(--accent-blue)]/8 rounded-2xl px-3 py-2.5 flex items-center justify-between"
        style={{ background: 'rgba(0, 122, 255, 0.06)' }}>
        <div className="text-[var(--text-secondary)] text-xs">预计到达</div>
        <div className="flex items-baseline gap-0.5">
          <motion.span
            key={displayMinutes}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[var(--accent-blue)] text-2xl font-bold tabular-nums leading-none"
          >
            {displayMinutes}
          </motion.span>
          <span className="text-[var(--accent-blue)] text-xs font-medium">min</span>
        </div>
      </div>
    </div>
  )
}
