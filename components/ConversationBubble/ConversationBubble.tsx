'use client'

import { motion } from 'framer-motion'
import { ConversationMessage } from '@/types'

interface ConversationBubbleProps {
  message: ConversationMessage
  index: number
}

export default function ConversationBubble({ message, index }: ConversationBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, x: isUser ? 12 : -12 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[78%] px-8 py-5 text-[15px] leading-[1.75] ${
          isUser
            ? 'rounded-[24px] rounded-br-lg text-white'
            : 'glass rounded-[24px] rounded-bl-lg text-[var(--text-primary)]'
        }`}
        style={
          isUser
            ? {
                background: 'linear-gradient(135deg, var(--accent-blue) 0%, #4DA8FF 100%)',
                boxShadow: '0 8px 24px rgba(0, 122, 255, 0.25)',
              }
            : undefined
        }
      >
        {!isUser && (
          <div className="text-[10px] text-[var(--accent-blue)] font-semibold mb-2.5 tracking-[0.15em] uppercase">
            AI 旅行助手
          </div>
        )}
        <span className={isUser ? 'font-medium' : 'font-normal'}>{message.content}</span>
      </div>
    </motion.div>
  )
}
