'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { VoiceState } from '@/types'
import AvatarFace from '../AvatarFace/AvatarFace'

interface AIAvatarProps {
  voiceState: VoiceState
  currentText?: string
}

const STATE_LABELS: Record<VoiceState, { label: string; sub: string; color: string }> = {
  idle:        { label: '请说出您的需求', sub: 'Ready to listen',     color: 'var(--accent-blue)' },
  listening:   { label: '正在聆听...',    sub: 'Listening',           color: 'var(--accent-mint)' },
  recognizing: { label: '识别中...',      sub: 'Recognizing',         color: 'var(--accent-yellow)' },
  thinking:    { label: '为您规划中',      sub: 'Thinking',            color: 'var(--accent-blue)' },
  speaking:    { label: 'AI 回复中',      sub: 'Speaking',            color: 'var(--accent-purple)' },
}

export default function AIAvatar({ voiceState, currentText }: AIAvatarProps) {
  const meta = STATE_LABELS[voiceState]

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Siri 风格光球 */}
      <AvatarFace state={voiceState} size={200} />

      {/* AI 名称 */}
      <div className="text-center">
        <div className="text-[var(--text-primary)] font-semibold text-xl tracking-wide">
          旅行助手
        </div>
        <div className="text-[var(--text-tertiary)] text-xs mt-1 tracking-[0.2em] uppercase font-medium">
          MIMO Travel AI
        </div>
      </div>

      {/* 状态指示（玻璃胶囊） */}
      <AnimatePresence mode="wait">
        <motion.div
          key={voiceState}
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="glass px-5 py-2 rounded-full flex items-center gap-2"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
          />
          <span className="text-[var(--text-primary)] text-sm font-medium">{meta.label}</span>
        </motion.div>
      </AnimatePresence>

      {/* 实时识别字幕 */}
      <AnimatePresence>
        {currentText && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[var(--text-secondary)] text-sm text-center max-w-[200px] leading-relaxed font-light"
          >
            「{currentText}」
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
