'use client'

import { ReactNode, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// 背景仅在客户端渲染，避免随机值导致 SSR/CSR hydration mismatch
const CinematicBackground = dynamic(() => import('../Background/CinematicBackground'), {
  ssr: false,
})

interface CabinLayoutProps {
  children: ReactNode
  bgIntensity?: 'idle' | 'active' | 'peak'
}

function TopBar() {
  const [time, setTime] = useState('--:--')

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center justify-between px-10 py-4 glass border-0 border-b border-black/[0.04]">
      {/* 左侧：行程状态 */}
      <div className="flex items-center gap-7 text-sm text-[var(--text-secondary)]">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-mint)] animate-pulse" />
          <span className="font-medium">前往目的地</span>
        </span>
        <span className="text-[var(--text-tertiary)]">·</span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          <span>晴 22°C</span>
        </span>
        <span className="text-[var(--text-tertiary)]">·</span>
        <span className="font-medium text-[var(--accent-blue)]">ETA 18:45</span>
      </div>

      {/* 中间：时间（大字号） */}
      <div className="text-[var(--text-primary)] font-light text-2xl tracking-[0.15em] tabular-nums">
        {time}
      </div>

      {/* 右侧：车辆状态 */}
      <div className="flex items-center gap-5 text-sm text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1.5 8.5a13 13 0 0121 0M5 12a10 10 0 0114 0M8.5 15.5a6 6 0 017 0M12 19h.01" stroke="currentColor" fill="none" strokeLinecap="round" strokeWidth={1.5}/>
          </svg>
          <span className="text-xs">5G</span>
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-5 h-3" viewBox="0 0 20 12">
            <rect x="0.5" y="0.5" width="17" height="11" rx="2" stroke="currentColor" fill="none" strokeWidth="1"/>
            <rect x="2" y="2" width="13" height="8" rx="1" fill="var(--accent-mint)"/>
            <rect x="18" y="4" width="1.5" height="4" rx="0.5" fill="currentColor"/>
          </svg>
          <span className="text-xs tabular-nums">84%</span>
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium glass-strong text-[var(--accent-blue)]">
          DiDi Robotaxi
        </span>
      </div>
    </div>
  )
}

export default function CabinLayout({ children, bgIntensity = 'idle' }: CabinLayoutProps) {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: 'var(--bg-base)' }}
    >
      <CinematicBackground intensity={bgIntensity} />
      <div className="relative z-10 flex flex-col h-full">
        <TopBar />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
