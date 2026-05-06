'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import CabinLayout from '@/components/Layout/CabinLayout'
import AvatarFace from '@/components/AvatarFace/AvatarFace'
import ConversationBubble from '@/components/ConversationBubble/ConversationBubble'
import { ItineraryList } from '@/components/ItineraryCard/ItineraryCard'
import VoiceStatusBar from '@/components/VoiceStatusBar/VoiceStatusBar'
import PermissionGate from '@/components/PermissionGate/PermissionGate'
import CinematicTransition, { LightSweep } from '@/components/CinematicTransition/CinematicTransition'
import WeatherStrip from '@/components/WeatherStrip/WeatherStrip'
import BudgetChart from '@/components/BudgetChart/BudgetChart'
import RouteMap from '@/components/RouteMap/RouteMap'
import DrivingStatus from '@/components/DrivingStatus/DrivingStatus'
import { useConversation } from '@/hooks/useConversation'
import { useSoundEffects } from '@/hooks/useSoundEffects'

function ShareSuccess({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="relative w-32 h-32 flex items-center justify-center"
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(52, 199, 89, 0.4) 0%, transparent 70%)',
            filter: 'blur(16px)',
          }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #34C759 0%, #5BE393 100%)',
            boxShadow: '0 16px 40px rgba(52, 199, 89, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)',
          }}
        >
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </motion.div>

      <div className="text-center">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[var(--text-primary)] text-3xl font-bold mb-3"
        >
          行程已发送到您的手机
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-[var(--text-secondary)] text-[15px] font-light"
        >
          请查看短信或滴滴 App 中的行程详情
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-full px-6 py-2.5 text-[var(--text-tertiary)] text-sm cursor-pointer"
        onClick={onRestart}
      >
        说&ldquo;重新开始&rdquo;可规划新行程
      </motion.div>
    </div>
  )
}

const STAGE_LABEL: Record<string, string> = {
  permission: '等待授权',
  greeting: '初始化',
  listening: '正在聆听',
  thinking: '为您思考',
  clarifying: '需要更多信息',
  showing: '行程方案',
  adjusting: '调整中',
  shared: '已发送',
}

export default function HomeClient() {
  const {
    stage,
    voiceState,
    messages,
    itinerary,
    busy,
    hint,
    muted,
    micPermission,
    isListening,
    interimText,
    isTTSSupported,
    isTTSSpeaking,
    startConversation,
    restart,
    toggleMute,
  } = useConversation()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [bgIntensity, setBgIntensity] = useState<'idle' | 'active' | 'peak'>('idle')
  const sfx = useSoundEffects()
  const prevStageRef = useRef(stage)
  const [showLightSweep, setShowLightSweep] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (stage === 'thinking' || stage === 'adjusting') setBgIntensity('peak')
    else if (itinerary || stage === 'listening') setBgIntensity('active')
    else setBgIntensity('idle')
  }, [stage, itinerary])

  useEffect(() => {
    const prev = prevStageRef.current
    if (prev === stage) return
    prevStageRef.current = stage
    if (prev === 'greeting' && stage === 'listening') sfx.play('wake')
    if (stage === 'thinking') sfx.play('thinking')
    if (stage === 'showing' && (prev === 'thinking' || prev === 'adjusting')) {
      sfx.play('complete')
      setShowLightSweep(true)
      setTimeout(() => setShowLightSweep(false), 1500)
    }
    if (stage === 'shared') sfx.play('confirm')
  }, [stage, sfx])

  const showStatusBar = stage !== 'permission' && stage !== 'shared'
  const showPermissionGate =
    stage === 'permission' || micPermission === 'denied' || micPermission === 'unsupported'

  // 当前显示的下一站（基于行程的 Day1 第一个活动）
  const nextStop = itinerary?.dayPlans?.[0]?.activities?.[0]?.title ?? '朝阳公园'

  return (
    <CabinLayout bgIntensity={bgIntensity}>
      {itinerary ? (
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 有行程的三段式车载仪表盘
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        <div className="flex h-full gap-4 px-4 py-4">

          {/* ◀ 左栏：驾驶状态 + AI 小光球 */}
          <div className="w-[260px] flex-shrink-0 flex flex-col gap-3">
            <DrivingStatus
              currentLocation="城市道路"
              nextStop={nextStop}
              etaMinutes={12}
            />

            {/* AI 小光球 + 状态 */}
            <div className="glass rounded-[20px] p-4 flex-1 flex flex-col items-center justify-center gap-3">
              <AvatarFace state={voiceState} size={120} />
              <div className="text-[var(--text-primary)] text-sm font-semibold">旅行助手</div>
              <div className="text-[var(--text-tertiary)] text-[10px] tracking-[0.2em] uppercase">
                {STAGE_LABEL[stage]}
              </div>
              {hint && (
                <div className="text-[var(--text-secondary)] text-[11px] text-center font-light leading-relaxed mt-1">
                  💡 {hint}
                </div>
              )}

              {/* 极淡控制按钮 */}
              <div className="mt-auto flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                {isTTSSupported && (
                  <button
                    onClick={toggleMute}
                    className="text-[var(--text-tertiary)] text-[10px] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {muted ? '🔇 已静音' : '🔊 语音开'}
                  </button>
                )}
                <span className="text-[var(--text-quaternary)]">·</span>
                <button
                  onClick={restart}
                  className="text-[var(--text-tertiary)] text-[10px] hover:text-[var(--text-secondary)] transition-colors"
                >
                  ↻ 重新开始
                </button>
              </div>
            </div>
          </div>

          {/* ◆ 中栏：行程主区 */}
          <div className="flex-1 min-w-0 relative">
            <LightSweep trigger={showLightSweep} />
            <CinematicTransition
              transitionKey={stage === 'shared' ? 'shared' : 'itinerary'}
              variant={stage === 'shared' ? 'iris' : 'curtain'}
            >
              {stage === 'shared' ? (
                <ShareSuccess onRestart={restart} />
              ) : (
                <div className="flex flex-col h-full gap-3 pb-24">
                  {/* 顶部最近 1 条 AI 回复 */}
                  <div className="flex-shrink-0 max-h-20 overflow-y-auto scrollbar-hide">
                    {messages.slice(-1).map((msg, i) => (
                      <ConversationBubble key={msg.timestamp} message={msg} index={i} />
                    ))}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ItineraryList itinerary={itinerary} />
                  </div>
                </div>
              )}
            </CinematicTransition>
          </div>

          {/* ▶ 右栏：辅助信息（天气/路线/预算） */}
          {stage !== 'shared' && (
            <div className="w-[280px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto scrollbar-hide pb-24">
              <WeatherStrip dayPlans={itinerary.dayPlans} destination={itinerary.destination} />
              <RouteMap itinerary={itinerary} />
              <BudgetChart itinerary={itinerary} />

              {/* 行李清单 */}
              {itinerary.packingList && itinerary.packingList.length > 0 && (
                <div className="glass rounded-[20px] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[var(--text-tertiary)] text-[10px] font-semibold tracking-[0.2em] uppercase">Packing</div>
                      <div className="text-[var(--text-primary)] text-sm font-semibold mt-0.5">行李清单</div>
                    </div>
                    <span className="text-base">🧳</span>
                  </div>
                  <ul className="space-y-1.5">
                    {itinerary.packingList.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-[var(--text-secondary)]">
                        <span className="text-[var(--accent-blue)] mt-1 w-1 h-1 rounded-full bg-[var(--accent-blue)] flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 文化彩蛋 */}
              {itinerary.culturalNotes && (
                <div className="glass rounded-[20px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">📜</span>
                    <div className="text-[var(--text-primary)] text-sm font-semibold">文化彩蛋</div>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-light italic">
                    {itinerary.culturalNotes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 无行程时的居中欢迎布局
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        <div className="flex h-full px-8">
          {/* 左栏：驾驶状态（始终显示） */}
          <div className="w-[260px] flex-shrink-0 flex flex-col gap-3 py-6">
            <DrivingStatus
              currentLocation="朝阳门"
              nextStop="目的地未规划"
              etaMinutes={28}
            />

            {/* 极淡控制 */}
            <div className="mt-auto flex items-center justify-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
              {isTTSSupported && (
                <button
                  onClick={toggleMute}
                  className="text-[var(--text-tertiary)] text-[10px] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {muted ? '🔇 已静音' : '🔊 语音开'}
                </button>
              )}
              <span className="text-[var(--text-quaternary)]">·</span>
              <button
                onClick={restart}
                className="text-[var(--text-tertiary)] text-[10px] hover:text-[var(--text-secondary)] transition-colors"
              >
                ↻ 重新开始
              </button>
            </div>
          </div>

          {/* 中央：AI 大光球 + 对话 */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-24">
            <AvatarFace state={voiceState} size={220} />

            <div className="text-center">
              <div className="text-[var(--text-primary)] text-2xl font-semibold">旅行助手</div>
              <div className="text-[var(--text-tertiary)] text-xs mt-1 tracking-[0.25em] uppercase font-medium">
                MIMO Travel AI
              </div>
            </div>

            <div className="glass rounded-full px-5 py-2 text-[var(--text-primary)] text-sm font-medium">
              {STAGE_LABEL[stage]}
            </div>

            {/* 对话区（最多 3 条最近） */}
            <div className="w-full max-w-2xl flex-shrink-0 max-h-44 overflow-y-auto scrollbar-hide space-y-1 px-4">
              {messages.slice(-3).map((msg, i) => (
                <ConversationBubble key={msg.timestamp} message={msg} index={i} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {hint && (
              <div className="text-[var(--text-secondary)] text-xs font-light italic">
                💡 {hint}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 状态栏（底部） */}
      {showStatusBar && (
        <VoiceStatusBar
          isListening={isListening}
          interimText={interimText}
          hint={hint}
          aiSpeaking={isTTSSpeaking}
          busy={busy}
        />
      )}

      {/* 权限引导 */}
      {showPermissionGate && (
        <PermissionGate permission={micPermission} onStart={startConversation} />
      )}
    </CabinLayout>
  )
}
