'use client'

import { useRef, useCallback } from 'react'

/**
 * Web Audio API 音效系统（合成音，无需音频文件）
 *
 * - wake: 唤醒音「叮」
 * - confirm: 确认音「嘀」
 * - thinking: 思考开始音
 * - complete: 行程生成完成音「嘟噜」
 * - notify: 通知音
 */
type SoundType = 'wake' | 'confirm' | 'thinking' | 'complete' | 'notify' | 'error'

export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null)
  const enabledRef = useRef(true)

  const getContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null
    if (!ctxRef.current) {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (Ctx) ctxRef.current = new Ctx()
      } catch {
        return null
      }
    }
    return ctxRef.current
  }

  /**
   * 播放一个 ADSR 包络的正弦波音符
   */
  const playTone = useCallback((
    frequency: number,
    duration: number,
    options: { delay?: number; type?: OscillatorType; volume?: number; sweep?: number } = {}
  ) => {
    const ctx = getContext()
    if (!ctx || !enabledRef.current) return

    const start = ctx.currentTime + (options.delay ?? 0)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = options.type ?? 'sine'
    osc.frequency.setValueAtTime(frequency, start)
    if (options.sweep) {
      osc.frequency.exponentialRampToValueAtTime(frequency * options.sweep, start + duration)
    }

    const peak = options.volume ?? 0.15
    // ADSR
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(peak, start + 0.02)       // attack
    gain.gain.exponentialRampToValueAtTime(peak * 0.5, start + duration * 0.5) // decay
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration) // release

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(start)
    osc.stop(start + duration)
  }, [])

  const play = useCallback((sound: SoundType) => {
    switch (sound) {
      case 'wake':
        // 双音叮咚（高 → 高）
        playTone(880, 0.18, { type: 'sine', volume: 0.18 })
        playTone(1320, 0.22, { delay: 0.1, type: 'sine', volume: 0.16 })
        break
      case 'confirm':
        // 短暂上升音
        playTone(660, 0.12, { type: 'sine', sweep: 1.5, volume: 0.15 })
        break
      case 'thinking':
        // 低-高 短促
        playTone(440, 0.08, { type: 'sine', volume: 0.1 })
        playTone(660, 0.1, { delay: 0.06, type: 'sine', volume: 0.1 })
        break
      case 'complete':
        // 三音上行（成功）
        playTone(523, 0.12, { type: 'sine', volume: 0.14 })          // C5
        playTone(659, 0.12, { delay: 0.1, type: 'sine', volume: 0.14 })  // E5
        playTone(784, 0.18, { delay: 0.2, type: 'sine', volume: 0.16 })  // G5
        break
      case 'notify':
        playTone(880, 0.1, { type: 'sine', volume: 0.12 })
        break
      case 'error':
        // 下降音
        playTone(440, 0.18, { type: 'sine', sweep: 0.5, volume: 0.15 })
        break
    }
  }, [playTone])

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled
  }, [])

  return { play, setEnabled }
}
