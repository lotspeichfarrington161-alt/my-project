'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { VoiceState } from '@/types'

interface AvatarFaceProps {
  state: VoiceState
  size?: number
}

// visionOS 配色：每个状态对应一组光晕色
const ORB_COLORS: Record<VoiceState, { primary: string; secondary: string; accent: string }> = {
  idle:        { primary: '#A5C7FF', secondary: '#FFC4E1', accent: '#FFE4B5' },
  listening:   { primary: '#A8E6CF', secondary: '#88E2D8', accent: '#7FE0A8' },
  recognizing: { primary: '#FFD4A3', secondary: '#FFE082', accent: '#FFCC80' },
  thinking:    { primary: '#A5C7FF', secondary: '#C4B5FD', accent: '#9DB8FF' },
  speaking:    { primary: '#FFB5D8', secondary: '#C4B5FD', accent: '#FFD4FF' },
}

const STATE_LABEL_HINT: Record<VoiceState, string> = {
  idle: '✨',
  listening: '🎧',
  recognizing: '✍️',
  thinking: '💭',
  speaking: '💬',
}

export default function AvatarFace({ state, size = 200 }: AvatarFaceProps) {
  const c = ORB_COLORS[state]
  const isActive = state === 'speaking'
  const isThinking = state === 'thinking'
  const isListening = state === 'listening' || state === 'recognizing'

  // 12 个粒子环绕光球
  const particles = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i),
    []
  )

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* 外圈柔和光晕（呼吸式） */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${c.primary}40 0%, ${c.secondary}30 40%, transparent 70%)`,
          filter: 'blur(30px)',
        }}
        animate={{
          scale: isActive ? [1, 1.15, 1] : isThinking ? [1, 1.08, 1] : [1, 1.04, 1],
        }}
        transition={{
          duration: isActive ? 1.5 : isThinking ? 2.5 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 旋转的彩虹光环 */}
      <motion.div
        className="absolute"
        style={{ inset: '8%' }}
        animate={{ rotate: 360 }}
        transition={{ duration: isActive ? 6 : isThinking ? 8 : 18, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id={`rainbow-${state}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c.primary} />
              <stop offset="33%" stopColor={c.secondary} />
              <stop offset="66%" stopColor={c.accent} />
              <stop offset="100%" stopColor={c.primary} />
            </linearGradient>
            <filter id="orb-blur">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {/* 内圈光环 */}
          <circle
            cx="100" cy="100" r="78"
            fill="none"
            stroke={`url(#rainbow-${state})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="120 80"
            opacity="0.7"
            filter="url(#orb-blur)"
          />
        </svg>
      </motion.div>

      {/* 主光球（Siri 风格液态渐变） */}
      <motion.div
        className="absolute rounded-full overflow-hidden"
        style={{
          inset: '18%',
          background: `
            radial-gradient(circle at 30% 30%, ${c.accent} 0%, ${c.primary} 30%, ${c.secondary} 70%, ${c.primary} 100%),
            linear-gradient(135deg, ${c.primary}, ${c.secondary})
          `,
          backgroundBlendMode: 'screen, normal',
          boxShadow: `
            inset 0 0 40px rgba(255, 255, 255, 0.6),
            inset -10px -10px 30px ${c.secondary}80,
            0 20px 60px ${c.primary}40,
            0 0 80px ${c.primary}30
          `,
        }}
        animate={isActive ? { scale: [1, 1.05, 0.98, 1] } : { scale: [1, 1.015, 1] }}
        transition={{
          duration: isActive ? 0.6 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* 球面液态流动效果 */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, ${c.primary}, ${c.secondary}, ${c.accent}, ${c.primary})`,
            mixBlendMode: 'overlay',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: isActive ? 4 : 12, repeat: Infinity, ease: 'linear' }}
        />

        {/* 高光 */}
        <div
          className="absolute rounded-full"
          style={{
            top: '15%',
            left: '20%',
            width: '40%',
            height: '30%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, transparent 70%)',
          }}
        />

        {/* 中心 emoji 提示（极淡，几乎看不见，只在静默时显示） */}
        {state === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-30">
            {STATE_LABEL_HINT[state]}
          </div>
        )}
      </motion.div>

      {/* 环绕粒子（active/listening/thinking 时） */}
      {(isActive || isListening || isThinking) &&
        particles.map(i => {
          const angle = (i / particles.length) * Math.PI * 2
          const radius = size * 0.48
          const x = Math.cos(angle) * radius + size / 2
          const y = Math.sin(angle) * radius + size / 2
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: x,
                top: y,
                width: 4,
                height: 4,
                background: c.primary,
                boxShadow: `0 0 10px ${c.primary}`,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.6, 1.4, 0.6],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          )
        })}
    </div>
  )
}
