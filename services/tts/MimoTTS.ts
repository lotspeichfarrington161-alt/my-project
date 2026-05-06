'use client'

import { TTSProvider, SpeakOptions } from './TTSProvider'

/**
 * MiMo-V2.5-TTS 接入实现（Web Audio API 版本）
 *
 * 通过 Next.js API Route (`/api/tts`) 中转调用，保护 API Key。
 *
 * 关键技术点：
 * - 使用 Web Audio API（AudioContext）而非 HTMLAudio，绕过 autoplay 策略限制
 * - unlock() 通过 AudioContext.resume() 解锁，比 Audio 元素更可靠
 * - 无需复用单一元素，每次都通过 AudioBufferSourceNode 播放
 */
export class MimoTTS implements TTSProvider {
  readonly name = 'mimo'
  private audioCtx: AudioContext | null = null
  private currentSource: AudioBufferSourceNode | null = null
  private currentAbort: AbortController | null = null

  get isSupported(): boolean {
    if (typeof window === 'undefined') return false
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    return !!Ctx
  }

  /** 必须在用户首次手势同步回调中调用一次 */
  unlock(): void {
    if (!this.isSupported) return
    this.ensureContext()
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume().catch(err => {
        console.warn('[MimoTTS] AudioContext.resume failed:', err)
      })
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.audioCtx) return this.audioCtx
    if (typeof window === 'undefined') return null
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    try {
      this.audioCtx = new Ctx()
      return this.audioCtx
    } catch (e) {
      console.warn('[MimoTTS] AudioContext init failed:', e)
      return null
    }
  }

  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    if (!this.isSupported || !text.trim()) return

    this.stop()

    const ctx = this.ensureContext()
    if (!ctx) return

    // 如果上下文挂起（autoplay 限制），尝试恢复
    if (ctx.state === 'suspended') {
      try { await ctx.resume() } catch {}
    }

    const abort = new AbortController()
    this.currentAbort = abort

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: options.voice,
          format: 'wav',
        }),
        signal: abort.signal,
      })

      if (!res.ok) {
        const errMsg = await res.text().catch(() => 'TTS 请求失败')
        throw new Error(`Mimo TTS error (${res.status}): ${errMsg}`)
      }

      const arrayBuffer = await res.arrayBuffer()

      // 解码音频
      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        // 兼容 Safari 的 callback 风格
        try {
          const ret = ctx.decodeAudioData(
            arrayBuffer.slice(0),
            (buf) => resolve(buf),
            (err) => reject(err ?? new Error('decode_failed'))
          )
          // 现代浏览器返回 Promise
          if (ret && typeof (ret as Promise<AudioBuffer>).then === 'function') {
            ;(ret as Promise<AudioBuffer>).then(resolve).catch(reject)
          }
        } catch (e) {
          reject(e)
        }
      })

      if (abort.signal.aborted) return

      // 用 BufferSource 播放 + 音量控制
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer

      const gainNode = ctx.createGain()
      gainNode.gain.value = options.volume ?? 1
      source.connect(gainNode)
      gainNode.connect(ctx.destination)

      this.currentSource = source

      await new Promise<void>((resolve) => {
        source.onended = () => {
          if (this.currentSource === source) this.currentSource = null
          options.onEnd?.()
          resolve()
        }
        try {
          source.start(0)
          options.onStart?.()
        } catch (e) {
          options.onError?.(e as Error)
          resolve()
        }
      })
    } catch (e) {
      const err = e as Error
      if (err.name !== 'AbortError') {
        options.onError?.(err)
      }
    } finally {
      this.currentAbort = null
    }
  }

  stop(): void {
    if (this.currentAbort) {
      try { this.currentAbort.abort() } catch {}
      this.currentAbort = null
    }
    if (this.currentSource) {
      try {
        this.currentSource.onended = null
        this.currentSource.stop()
      } catch {}
      this.currentSource = null
    }
  }
}
