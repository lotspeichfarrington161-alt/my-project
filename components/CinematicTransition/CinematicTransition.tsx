'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface CinematicTransitionProps {
  transitionKey: string  // 切换 key 触发动画
  children: ReactNode
  variant?: 'curtain' | 'zoom' | 'blur' | 'iris'
}

/**
 * 电影级帧切换组件
 * - curtain：幕布拉开（行程出现专用）
 * - zoom：相机推近 + 模糊渐清
 * - blur：模糊淡入淡出
 * - iris：光圈缩放（圆形扩散/收缩）
 */
export default function CinematicTransition({
  transitionKey,
  children,
  variant = 'blur',
}: CinematicTransitionProps) {
  const ease1 = [0.22, 1, 0.36, 1] as const
  const ease2 = [0.4, 0, 0.2, 1] as const

  const variants = {
    curtain: {
      initial: { opacity: 0, clipPath: 'inset(50% 0 50% 0)' },
      animate: { opacity: 1, clipPath: 'inset(0% 0 0% 0)' },
      exit: { opacity: 0, clipPath: 'inset(50% 0 50% 0)' },
      transition: { duration: 0.7, ease: ease1 },
    },
    zoom: {
      initial: { opacity: 0, scale: 1.1, filter: 'blur(20px)' },
      animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
      transition: { duration: 0.6, ease: ease2 },
    },
    blur: {
      initial: { opacity: 0, filter: 'blur(12px)', y: 12 },
      animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
      exit: { opacity: 0, filter: 'blur(8px)', y: -12 },
      transition: { duration: 0.45, ease: ease2 },
    },
    iris: {
      initial: { opacity: 0, clipPath: 'circle(0% at 50% 50%)' },
      animate: { opacity: 1, clipPath: 'circle(75% at 50% 50%)' },
      exit: { opacity: 0, clipPath: 'circle(0% at 50% 50%)' },
      transition: { duration: 0.7, ease: ease1 },
    },
  } as const

  const v = variants[variant]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={v.initial}
        animate={v.animate}
        exit={v.exit}
        transition={v.transition}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * 黑场闪过效果（用作大变化时的"咔嚓"瞬间）
 */
export function FlashOverlay({ trigger }: { trigger: number }) {
  return (
    <AnimatePresence>
      <motion.div
        key={trigger}
        className="absolute inset-0 bg-white pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.4, times: [0, 0.2, 1] }}
      />
    </AnimatePresence>
  )
}

/**
 * 光线扫过效果（用于行程生成完成时）
 */
export function LightSweep({ trigger }: { trigger: boolean }) {
  if (!trigger) return null
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-40 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute -inset-y-[200%] w-1/3 bg-gradient-to-b from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%', rotate: 12 }}
        animate={{ x: '300%' }}
        transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] as const }}
        style={{ filter: 'blur(8px)' }}
      />
    </motion.div>
  )
}
