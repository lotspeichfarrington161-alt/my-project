'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ConversationMessage, FullItinerary, TravelParams, VoiceState } from '@/types'
import { createAIService } from '@/services/ai/AIService'
import { analyzeUserInput } from '@/services/ai/QuickResponse'
import { useTTS } from './useTTS'
import { useAlwaysOnVoice } from './useVoiceInput'

export type Stage =
  | 'permission'
  | 'greeting'
  | 'listening'
  | 'thinking'
  | 'clarifying'
  | 'showing'
  | 'adjusting'
  | 'shared'

interface PartialParams {
  city?: string
  days?: number
  budget?: TravelParams['budget']
  preferences?: string[]
  departureCity?: string
  travelers?: number
  withElderly?: boolean
  withKids?: boolean
}

const GREETING = '您好，欢迎乘坐滴滴 Robotaxi，我是您的专属旅行助手。请告诉我您想去哪里、计划玩几天，是几个人？有没有带老人或孩子？我来为您量身定制行程。'

// 简短行程讲解（仅 30-40 字，省 TTS 时间）
function buildShortNarration(itinerary: FullItinerary): string {
  const { destination, days, totalBudget, dayPlans } = itinerary
  const day1 = dayPlans[0]?.activities[0]?.title ?? dayPlans[0]?.theme ?? '抵达'
  return `已经为您规划好${destination}${days}天的行程，预算约${totalBudget.toLocaleString()}元。第一天先带您${day1}。完整行程请看屏幕。需要调整随时说，满意就说"确认"。`
}

export function useConversation() {
  const [stage, setStage] = useState<Stage>('permission')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [itinerary, setItinerary] = useState<FullItinerary | null>(null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')
  const [muted, setMuted] = useState(false)

  const aiService = useRef(createAIService())
  const itineraryRef = useRef<FullItinerary | null>(null)
  const partialParams = useRef<PartialParams>({})
  const mutedRef = useRef(muted)
  mutedRef.current = muted
  const startedRef = useRef(false)

  const tts = useTTS({ rate: 1.05 })

  const handleUserInputRef = useRef<((text: string) => Promise<void>) | null>(null)

  const voice = useAlwaysOnVoice({
    onFinal: (text) => {
      handleUserInputRef.current?.(text)
    },
  })

  const addMessage = (role: ConversationMessage['role'], content: string) => {
    setMessages(prev => [...prev, { role, content, timestamp: Date.now() + Math.random() }])
  }

  // AI 回复：暂停聆听 → 显示文字 → TTS 播报 → 恢复聆听
  // 长文本自动走 speakStream，第一句立刻出声，体验更流畅
  const reply = useCallback(async (text: string) => {
    voice.pause()
    addMessage('assistant', text)
    setVoiceState('speaking')
    if (!mutedRef.current && tts.isSupported) {
      // 超过 40 字 = 多句，用流式（第一句立刻出声）；短句直接 speak
      if (text.length > 40 && tts.speakStream) {
        await tts.speakStream(text)
      } else {
        await tts.speak(text)
      }
    } else {
      await sleep(Math.max(800, text.length * 80))
    }
    setVoiceState('idle')
    voice.resume()
  }, [tts, voice])

  // ─────────────────────────────────────────
  // 主入口：用户说话后调用
  //
  // 性能优化核心思路：
  // 1. 本地正则瞬间分析意图（0ms）
  // 2. 立刻 TTS 播报过渡话（用户 0.5s 内听到 AI 开口）
  // 3. 同时后台并行调用 LLM 处理详细任务
  // 4. LLM 结果回来后 UI 渲染 + 详细 TTS 讲解
  // ─────────────────────────────────────────
  const handleUserInput = useCallback(async (rawText: string) => {
    const text = rawText.trim()
    if (!text || busy) return

    tts.stop()
    voice.pause()

    setBusy(true)
    setHint('')
    addMessage('user', text)
    setVoiceState('thinking')
    setStage('thinking')

    try {
      const ai = aiService.current
      const hasItinerary = !!itineraryRef.current

      // ============ 0ms 本地分析 ============
      const quick = analyzeUserInput(text, hasItinerary)

      // ============ RESTART ============
      if (quick.intent === 'restart') {
        itineraryRef.current = null
        partialParams.current = {}
        setItinerary(null)
        await reply(quick.acknowledgment)
        setStage('listening')
        setHint('比如"我想去三亚玩4天"')
        return
      }

      // ============ CONFIRM ============
      if (quick.intent === 'confirm' && hasItinerary) {
        await reply(quick.acknowledgment)
        await sleep(400)
        setStage('shared')
        return
      }

      // ============ ADJUST（并行：TTS 过渡话 + LLM 调整） ============
      if (quick.intent === 'adjust' && hasItinerary && itineraryRef.current) {
        setStage('adjusting')

        const ttsPromise = reply(quick.acknowledgment)
        const llmPromise = ai.adjustItinerary(text, itineraryRef.current)

        const [, adjusted] = await Promise.all([ttsPromise, llmPromise])
        itineraryRef.current = adjusted
        setItinerary(adjusted)

        await reply('已经调整好啦。您看这个版本，满意的话说"确认"，还想改可以继续告诉我。')
        setStage('showing')
        setHint('试试说"再加一些美食体验"或"就这个方案"')
        return
      }

      // ============ PLAN（两阶段：骨架先出 + 详情填充） ============
      if (quick.intent === 'plan') {
        const mergedCity = quick.city ?? partialParams.current.city
        const mergedDays = quick.days ?? partialParams.current.days
        partialParams.current = { ...partialParams.current, city: mergedCity, days: mergedDays }

        if (!mergedCity || !mergedDays) {
          const ack = quick.acknowledgment ||
            (!mergedCity
              ? `好的，${mergedDays}天的行程。请问您想去哪个城市？`
              : `${mergedCity}是个好选择！请问您计划玩几天？`)
          await reply(ack)
          setStage('clarifying')
          setHint(!mergedCity ? '比如"想去成都"' : '比如"5天"')
          return
        }

        // ✨ 加长版过渡话（填补 LLM 等待时间，让用户不觉得 AI 沉默）
        const ackText = `好的，${mergedCity}是个让人去了就不想走的地方，我这就为您规划${mergedDays}天的行程。我会综合考虑天气、路线和您的偏好，请稍等。`

        // 阶段 1（并行）：过渡话 TTS + 7B 骨架快速生成
        const ttsAckPromise = reply(ackText)
        const skeletonPromise = (async () => {
          try {
            return await (ai as { generateSkeleton?: (text: string, city?: string, days?: number) => Promise<FullItinerary> })
              .generateSkeleton?.(text, mergedCity, mergedDays)
          } catch {
            return null
          }
        })()

        // 阶段 2（同时）：72B 完整生成（合并参数 + 生成详情，跳过 extract）
        const fullParams: TravelParams = {
          city: mergedCity,
          days: mergedDays,
          budget: partialParams.current.budget,
          preferences: partialParams.current.preferences,
          departureCity: partialParams.current.departureCity,
          travelers: partialParams.current.travelers,
          withElderly: partialParams.current.withElderly,
          withKids: partialParams.current.withKids,
        }
        const fullPromise = ai.generateItinerary(fullParams)

        // 骨架先到（约 2-3s），UI 立刻渲染骨架卡
        const skeleton = await skeletonPromise
        if (skeleton) {
          itineraryRef.current = skeleton
          setItinerary(skeleton)
          setStage('showing')
        }

        // 等待过渡话 TTS 播完
        await ttsAckPromise

        // 等完整版生成完毕，替换骨架
        const full = await fullPromise
        itineraryRef.current = full
        setItinerary(full)

        // ✨ 简短 narration（不再读完整长篇大论）
        const narration = buildShortNarration(full)
        await reply(narration)
        setStage('showing')
        setHint('试试说"加一些户外活动"或"确认发送"')
        return
      }

      // ============ QUERY：万能问询通道（让 AI 自由回答任何旅行话题） ============
      if (quick.intent === 'query' && ai.answerQuery) {
        // 先播本地过渡话（如"让我为您讲讲..."）
        const ttsPromise = quick.acknowledgment ? reply(quick.acknowledgment) : Promise.resolve()
        // 同时后台调用 LLM 生成详细回答
        const queryPromise = ai.answerQuery(text, itineraryRef.current)
        const [, queryResult] = await Promise.all([ttsPromise, queryPromise])
        await reply(queryResult.text)
        setStage(itineraryRef.current ? 'showing' : 'listening')
        setHint(itineraryRef.current ? '继续问或说"确认"' : '试试问"梵净山好玩吗"')
        return
      }

      // ============ UNCLEAR：兜底走 LLM 二次判定 ============
      const intent = await ai.detectIntent(text, hasItinerary)

      if (intent.intent === 'restart') {
        itineraryRef.current = null
        partialParams.current = {}
        setItinerary(null)
        await reply('没问题，我们重新开始。请告诉我您想去哪里？')
        setStage('listening')
        return
      }

      if (intent.intent === 'query' && ai.answerQuery) {
        const queryResult = await ai.answerQuery(text, itineraryRef.current)
        await reply(queryResult.text)
        setStage(itineraryRef.current ? 'showing' : 'listening')
        return
      }

      if (intent.intent === 'plan') {
        const extra = await ai.extractTravelParams(text)
        const merged: PartialParams = { ...partialParams.current }
        if (extra.city) merged.city = extra.city
        if (extra.days) merged.days = extra.days
        if (extra.budget) merged.budget = extra.budget
        if (extra.preferences?.length) merged.preferences = extra.preferences
        if (extra.departureCity) merged.departureCity = extra.departureCity
        partialParams.current = merged

        if (!merged.city || !merged.days) {
          const q = !merged.city && !merged.days
            ? '好的，请问您想去哪个城市？计划玩几天？'
            : !merged.city
              ? `好的，${merged.days}天的行程。请问您想去哪个城市？`
              : `${merged.city}是个好选择！请问计划玩几天？`
          await reply(q)
          setStage('clarifying')
          return
        }

        const fullParams: TravelParams = {
          city: merged.city,
          days: merged.days,
          budget: merged.budget,
          preferences: merged.preferences,
          departureCity: merged.departureCity,
        }
        await reply(`好的，${fullParams.city}是个好地方，我这就为您规划${fullParams.days}天的行程...`)
        const result = await ai.generateItinerary(fullParams)
        itineraryRef.current = result
        setItinerary(result)
        await reply(buildShortNarration(result))
        setStage('showing')
        return
      }

      await reply('抱歉，我没太听清楚。您可以告诉我想去的城市和天数，比如"帮我规划重庆3天"。')
      setStage('listening')
    } finally {
      setBusy(false)
    }
  }, [busy, reply, tts, voice])

  handleUserInputRef.current = handleUserInput

  // 启动入口：用户点击「开始语音对话」时调用
  // ⚠️ 第一行 tts.unlock() 必须在用户手势同步执行栈内调用，
  //    用于解锁浏览器自动播放策略，否则 MiMo TTS 音频会被拒绝播放
  const startConversation = useCallback(async () => {
    if (startedRef.current) return
    startedRef.current = true

    // ① 同步解锁音频上下文（必须在用户点击事件的同步代码中）
    tts.unlock()

    // ② 后台预热 LLM 连接（不阻塞主流程，但首次调用会更快）
    void import('@/services/ai/SiliconFlowAIService')
      .then(m => m.SiliconFlowAIService.preheat())
      .catch(() => {})

    // ③ 异步请求麦克风
    await voice.start()

    setStage('greeting')
    setVoiceState('speaking')
    addMessage('assistant', GREETING)

    voice.pause()
    if (!mutedRef.current && tts.isSupported) {
      await tts.speak(GREETING)
    } else {
      await sleep(1500)
    }
    setVoiceState('idle')
    setStage('listening')
    setHint('您可以直接说话，例如"帮我规划云南5天"')
    voice.resume()
  }, [voice, tts])

  const restart = useCallback(async () => {
    tts.stop()
    voice.pause()
    itineraryRef.current = null
    partialParams.current = {}
    setItinerary(null)
    setMessages([])
    setBusy(false)
    setStage('greeting')
    setVoiceState('speaking')

    await sleep(300)
    addMessage('assistant', GREETING)
    if (!mutedRef.current && tts.isSupported) {
      await tts.speak(GREETING)
    } else {
      await sleep(1200)
    }
    setVoiceState('idle')
    setStage('listening')
    setHint('您可以直接说话')
    voice.resume()
  }, [tts, voice])

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      if (!prev) tts.stop()
      return !prev
    })
  }, [tts])

  useEffect(() => {
    if (voice.permission === 'denied' || voice.permission === 'unsupported') {
      setStage('permission')
    }
  }, [voice.permission])

  return {
    stage,
    voiceState,
    messages,
    itinerary,
    busy,
    hint,
    muted,
    micPermission: voice.permission,
    isListening: voice.isListening,
    interimText: voice.interim,
    isTTSSupported: tts.isSupported,
    isTTSSpeaking: tts.isSpeaking,
    startConversation,
    restart,
    toggleMute,
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
