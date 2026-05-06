'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface CinematicBackgroundProps {
  intensity?: 'idle' | 'active' | 'peak'
}

/**
 * visionOS 风格浅色空间背景
 * - 暖白底色 + 多层柔和光晕
 * - 极少的浮动光点（不抢戏）
 * - 状态变化时光晕颜色和位置缓慢漂移
 */
export default function CinematicBackground({ intensity = 'idle' }: CinematicBackgroundProps) {
  const orbs = useMemo(
    () => [
      // 暖色系大光晕（粉桃、暖橙）
      { color: 'rgba(255, 200, 180, 0.55)', x: '8%', y: '12%', size: 720 },
      { color: 'rgba(220, 200, 255, 0.45)', x: '78%', y: '8%', size: 820 },
      // 冷色系（薄荷、淡蓝）
      { color: 'rgba(170, 220, 255, 0.5)', x: '85%', y: '70%', size: 680 },
      { color: 'rgba(190, 230, 220, 0.45)', x: '15%', y: '78%', size: 700 },
      // 中央补光
      { color: 'rgba(255, 240, 220, 0.35)', x: '50%', y: '50%', size: 600 },
    ],
    []
  )

  // 不同强度对应光晕透明度倍数
  const intensityMul = intensity === 'peak' ? 1.4 : intensity === 'active' ? 1.15 : 1

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 底层暖白渐变（visionOS 同款） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #FAFAF8 0%, #F5F2EC 35%, #F0F2F7 70%, #FAFAF8 100%)',
        }}
      />

      {/* 大色块光晕（flowing color blobs） */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            background: orb.color,
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            transform: 'translate(-50%, -50%)',
            filter: `blur(120px)`,
            opacity: intensityMul,
            mixBlendMode: 'normal',
          }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -35, 25, 0],
            scale: [1, 1.08, 0.96, 1],
          }}
          transition={{
            duration: 24 + i * 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 2,
          }}
        />
      ))}

      {/* 极淡的网格底纹（visionOS 同款空间深度感） */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(0,0,0,0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: 0.4,
        }}
      />

      {/* 顶部和底部柔和暗化（增加聚焦感） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 25%, transparent 75%, rgba(255,255,255,0.2) 100%)',
        }}
      />
    </div>
  )
}
