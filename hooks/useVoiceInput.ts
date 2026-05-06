'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: {
    [index: number]: {
      [index: number]: { transcript: string; confidence: number }
      isFinal: boolean
      length: number
    }
    length: number
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognitionInstance }
    webkitSpeechRecognition?: { new (): SpeechRecognitionInstance }
  }
}

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

interface UseAlwaysOnVoiceOptions {
  onFinal?: (text: string) => void
  lang?: string
}

const RESTART_DELAY = 250
const WATCHDOG_INTERVAL = 1500  // 每 1.5 秒检查一次状态

/**
 * 常开式语音聆听：
 * - 启动后持续监听，无需点击
 * - 多重保险：onend 自动重启 + watchdog 周期检查
 * - pause/resume 用于 AI 说话期间避免麦克风回环
 */
export function useAlwaysOnVoice({ onFinal, lang = 'zh-CN' }: UseAlwaysOnVoiceOptions = {}) {
  const [permission, setPermission] = useState<PermissionState>('idle')
  const [isListening, setIsListening] = useState(false)
  const [interim, setInterim] = useState('')

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const onFinalRef = useRef(onFinal)
  onFinalRef.current = onFinal

  // 关键状态全部用 ref，避免闭包陈旧
  const isPausedRef = useRef(false)
  const shouldRunRef = useRef(false)
  const isListeningRef = useRef(false)

  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 防御性 start：先 abort 一下避免 InvalidStateError
  const safeStart = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    if (isListeningRef.current) return  // 已经在听了
    if (!shouldRunRef.current || isPausedRef.current) return
    try {
      rec.start()
    } catch (e) {
      const err = e as Error & { name?: string }
      // InvalidStateError：识别器还没完全停下来，等下一次 watchdog 重试
      if (err.name !== 'InvalidStateError') {
        console.warn('[Voice] start failed:', err.message)
      }
    }
  }, [])

  // 初始化 SpeechRecognition 实例
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) {
      setPermission('unsupported')
      return
    }
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = lang
    rec.maxAlternatives = 1

    rec.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) finalText += text
        else interimText += text
      }
      if (interimText) setInterim(interimText)
      if (finalText.trim()) {
        setInterim('')
        onFinalRef.current?.(finalText.trim())
      }
    }

    rec.onstart = () => {
      isListeningRef.current = true
      setIsListening(true)
      setPermission('granted')
    }

    rec.onend = () => {
      isListeningRef.current = false
      setIsListening(false)
      setInterim('')
      // 自动重启（双重判断 + 时延）
      if (shouldRunRef.current && !isPausedRef.current) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
        restartTimerRef.current = setTimeout(() => {
          // 触发时再次检查（避免在 delay 期间状态变化）
          if (shouldRunRef.current && !isPausedRef.current && !isListeningRef.current) {
            safeStart()
          }
        }, RESTART_DELAY)
      }
    }

    rec.onerror = (e) => {
      const err = e as Event & { error?: string }
      const code = err.error
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setPermission('denied')
        shouldRunRef.current = false
      }
      // 其他错误（no-speech / aborted / audio-capture / network）让 onend 触发重启
    }

    recognitionRef.current = rec

    // Watchdog：每隔 1.5 秒检查一次状态，确保该听的时候一定在听
    watchdogRef.current = setInterval(() => {
      if (shouldRunRef.current && !isPausedRef.current && !isListeningRef.current) {
        safeStart()
      }
    }, WATCHDOG_INTERVAL)

    return () => {
      shouldRunRef.current = false
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      if (watchdogRef.current) clearInterval(watchdogRef.current)
      try { rec.abort() } catch {}
    }
  }, [lang, safeStart])

  // 启动持续聘听（首次会触发权限请求）
  const start = useCallback(async () => {
    if (!recognitionRef.current || permission === 'unsupported') return
    setPermission('requesting')
    shouldRunRef.current = true
    isPausedRef.current = false
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(t => t.stop())
      }
      safeStart()
    } catch (e) {
      const err = e as Error & { name?: string }
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermission('denied')
      }
    }
  }, [permission, safeStart])

  // 暂停聘听（AI 说话时调用）
  const pause = useCallback(() => {
    isPausedRef.current = true
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    if (recognitionRef.current && isListeningRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
  }, [])

  // 恢复聘听
  const resume = useCallback(() => {
    isPausedRef.current = false
    // 立即试一次，watchdog 会兜底
    safeStart()
  }, [safeStart])

  // 完全停止
  const stop = useCallback(() => {
    shouldRunRef.current = false
    isPausedRef.current = false
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }
  }, [])

  return {
    permission,
    isListening,
    interim,
    start,
    pause,
    resume,
    stop,
  }
}
