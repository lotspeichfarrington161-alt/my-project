'use client'

import { motion } from 'framer-motion'
import { VoiceState } from '@/types'

interface VoiceWaveProps {
  state: VoiceState
}

const BAR_COUNT = 12

export default function VoiceWave({ state }: VoiceWaveProps) {
  const isActive = state === 'listening' || state === 'speaking'
  const isThinking = state === 'thinking'

  return (
    <div className="flex items-center justify-center gap-1 h-10">
      {isThinking ? (
        // 思考状态：3个跳动圆点
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-400"
              animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </div>
      ) : (
        // 波形状态
        <div className="flex items-center gap-0.5">
          {Array.from({ length: BAR_COUNT }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-1 rounded-full ${state === 'listening' ? 'bg-emerald-400' : state === 'speaking' ? 'bg-blue-400' : 'bg-white/20'}`}
              animate={
                isActive
                  ? {
                      height: [
                        `${8 + Math.random() * 8}px`,
                        `${20 + Math.random() * 20}px`,
                        `${8 + Math.random() * 8}px`,
                      ],
                      opacity: [0.6, 1, 0.6],
                    }
                  : { height: '4px', opacity: 0.2 }
              }
              transition={
                isActive
                  ? {
                      duration: 0.4 + Math.random() * 0.3,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: 'easeInOut',
                    }
                  : { duration: 0.3 }
              }
              style={{ height: '4px' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
