'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface VoiceStatusBarProps {
  isListening: boolean
  interimText: string
  hint?: string
  aiSpeaking?: boolean
  busy?: boolean
}

const BARS = 28

export default function VoiceStatusBar({
  isListening,
  interimText,
  hint,
  aiSpeaking,
  busy,
}: VoiceStatusBarProps) {
  const showInterim = interimText.length > 0
  const status: 'speaking' | 'thinking' | 'listening' | 'idle' = aiSpeaking
    ? 'speaking'
    : busy
    ? 'thinking'
    : isListening
    ? 'listening'
    : 'idle'

  const colorMap = {
    speaking: 'var(--accent-purple)',
    thinking: 'var(--accent-blue)',
    listening: 'var(--accent-mint)',
    idle: 'var(--text-quaternary)',
  }
  const color = colorMap[status]

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[min(94%,920px)] z-30">
      <motion.div
        className="glass-strong rounded-[28px] px-7 py-4"
        animate={{
          boxShadow: status !== 'idle'
            ? `var(--glass-shadow), 0 0 0 1px ${color}40, 0 0 30px ${color}30`
            : 'var(--glass-shadow)',
        }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-5">
          {/* 左侧波形（更精致） */}
          <div className="flex-shrink-0 flex items-center gap-[2px] h-10 w-24">
            {Array.from({ length: BARS }).map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-full"
                style={{ background: color }}
                animate={
                  status === 'idle'
                    ? { height: '4px', opacity: 0.25 }
                    : {
                        height: [
                          `${4 + (i % 5) * 2}px`,
                          `${12 + ((i * 11) % 22)}px`,
                          `${4 + (i % 4) * 2}px`,
                        ],
                        opacity: [0.5, 1, 0.5],
                      }
                }
                transition={{
                  duration: 0.45 + (i % 5) * 0.06,
                  repeat: Infinity,
                  delay: i * 0.022,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* 中间文字 */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {showInterim ? (
                <motion.div
                  key="interim"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1"
                    style={{ color: 'var(--accent-mint)' }}
                  >
                    您正在说...
                  </div>
                  <div className="text-[var(--text-primary)] text-base font-medium truncate">
                    {interimText}
                  </div>
                </motion.div>
              ) : status === 'speaking' ? (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1"
                    style={{ color: 'var(--accent-purple)' }}
                  >
                    AI 正在播报中
                  </div>
                  <div className="text-[var(--text-secondary)] text-sm">麦克风暂时关闭，避免回响</div>
                </motion.div>
              ) : status === 'thinking' ? (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1"
                    style={{ color: 'var(--accent-blue)' }}
                  >
                    AI 正在思考
                  </div>
                  <div className="text-[var(--text-secondary)] text-sm">为您智能规划中...</div>
                </motion.div>
              ) : status === 'listening' ? (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1"
                    style={{ color: 'var(--accent-mint)' }}
                  >
                    正在聆听 · 请直接说话
                  </div>
                  <div className="text-[var(--text-tertiary)] text-sm truncate font-light">
                    {hint ? `💡 ${hint}` : '随时说出您的想法，我都在听'}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-[var(--text-tertiary)] text-sm">语音聆听已暂停</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 右侧麦克风指示 */}
          <div
            className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: status !== 'idle' ? `${color}20` : 'rgba(0,0,0,0.04)',
              boxShadow: status !== 'idle' ? `0 0 12px ${color}50` : 'none',
              transition: 'all 0.4s ease',
            }}
          >
            <svg className="w-5 h-5" fill={color} viewBox="0 0 24 24">
              <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
              <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.92V20H8a1 1 0 100 2h8a1 1 0 100-2h-3v-2.08A7 7 0 0019 11z" />
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
