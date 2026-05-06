'use client'

import { motion } from 'framer-motion'
import { FullItinerary } from '@/types'

interface RouteMapProps {
  itinerary: FullItinerary
}

export default function RouteMap({ itinerary }: RouteMapProps) {
  const { dayPlans, destination, routePlan } = itinerary

  // 城市节点：从 dayPlans 提取唯一城市，按出现顺序
  const cities = Array.from(
    new Set(dayPlans.map(d => d.city))
  )

  // 节点位置（横向铺开 + 上下错落）
  const width = 320
  const height = 130
  const nodes = cities.map((city, i) => ({
    name: city,
    x: 30 + i * ((width - 60) / Math.max(cities.length - 1, 1)),
    y: 65 + Math.sin(i * 1.3) * 22,
  }))

  // 贝塞尔曲线连接
  const pathD = nodes.reduce((acc, node, i) => {
    if (i === 0) return `M ${node.x} ${node.y}`
    const prev = nodes[i - 1]
    const cpX = (prev.x + node.x) / 2
    return `${acc} Q ${cpX} ${prev.y - 22}, ${node.x} ${node.y}`
  }, '')

  // 总距离（来自 AI 返回的 routePlan）
  const totalDistance = routePlan?.length
    ? routePlan.reduce((sum, r) => {
        const km = parseInt(r.distance?.match(/(\d+)/)?.[1] ?? '0', 10)
        return sum + km
      }, 0)
    : cities.length * 200  // fallback 估算

  return (
    <div className="glass rounded-[20px] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[var(--text-tertiary)] text-[10px] font-semibold tracking-[0.2em] uppercase">Route</div>
          <div className="text-[var(--text-primary)] text-sm font-semibold mt-0.5">{destination} 路线</div>
        </div>
        <div className="text-right">
          <div className="text-[var(--accent-blue)] text-xs font-bold tabular-nums">
            约 {totalDistance} 公里
          </div>
          <div className="text-[var(--text-tertiary)] text-[9px]">{cities.length} 站 · Robotaxi 全程</div>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id="route-light-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5DA6E0" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#007AFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#AF52DE" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id="node-light-glow">
            <stop offset="0%" stopColor="#007AFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#007AFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 背景虚线 */}
        {[0, 1, 2].map(i => (
          <line
            key={i}
            x1="0" x2={width}
            y1={(i + 1) * 35} y2={(i + 1) * 35}
            stroke="rgba(0, 0, 0, 0.04)"
            strokeDasharray="3 4"
          />
        ))}

        {/* 路线虚影 */}
        <motion.path
          d={pathD}
          stroke="url(#route-light-gradient)"
          strokeWidth="8"
          fill="none"
          opacity="0.25"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        {/* 路线主线 */}
        <motion.path
          d={pathD}
          stroke="url(#route-light-gradient)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />

        {/* 移动 Robotaxi 小车 */}
        <motion.g
          initial={{ offsetDistance: '0%' }}
          animate={{ offsetDistance: '100%' }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ offsetPath: `path("${pathD}")` }}
        >
          <circle r="6" fill="#007AFF" opacity="0.3" />
          <circle r="3" fill="#007AFF" />
          <text x="0" y="-9" textAnchor="middle" fontSize="9" fill="#007AFF">🚗</text>
        </motion.g>

        {/* 城市节点 */}
        {nodes.map((node, i) => (
          <motion.g
            key={node.name}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
          >
            <circle cx={node.x} cy={node.y} r="14" fill="url(#node-light-glow)" />
            <circle cx={node.x} cy={node.y} r="5" fill="white" stroke="#007AFF" strokeWidth="2" />
            <circle cx={node.x} cy={node.y} r="2" fill="#007AFF" />
            <text
              x={node.x}
              y={node.y + 22}
              textAnchor="middle"
              fill="#1D1D1F"
              fontSize="10"
              fontWeight="600"
            >
              {node.name.length > 4 ? node.name.slice(0, 3) + '…' : node.name}
            </text>
          </motion.g>
        ))}
      </svg>

      {/* 路线段详情（仅显示前 2 段） */}
      {routePlan && routePlan.length > 0 && (
        <div className="mt-2 space-y-1">
          {routePlan.slice(0, 2).map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
              <span className="text-[var(--text-tertiary)]">{seg.from}</span>
              <span className="text-[var(--accent-blue)]">→</span>
              <span className="text-[var(--text-tertiary)]">{seg.to}</span>
              <span className="text-[var(--text-quaternary)]">·</span>
              <span className="font-medium tabular-nums">{seg.duration}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
