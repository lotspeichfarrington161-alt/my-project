'use client'

import { TTSProvider, SpeakOptions } from './TTSProvider'

// 浏览器原生 SpeechSynthesis（兜底实现，免费但音质一般）
export class BrowserTTS implements TTSProvider {
  readonly name = 'browser'

  get isSupported(): boolean {
    return typeof window !== 'undefined' && !!window.speechSynthesis
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    if (!this.isSupported) return null
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) return null
    const preferred = ['Tingting', 'Mei-Jia', 'Sin-ji', 'Yu-shu', 'Microsoft Xiaoxiao']
    for (const name of preferred) {
      const found = voices.find(v => v.name.includes(name))
      if (found) return found
    }
    return voices.find(v => v.lang.startsWith('zh')) ?? voices[0]
  }

  speak(text: string, options: SpeakOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isSupported || !text.trim()) return resolve()
      try {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'zh-CN'
        u.rate = options.rate ?? 1.05
        u.pitch = options.pitch ?? 1
        u.volume = options.volume ?? 1
        const voice = this.pickVoice()
        if (voice) u.voice = voice

        u.onstart = () => options.onStart?.()
        u.onend = () => { options.onEnd?.(); resolve() }
        u.onerror = (e) => {
          const err = new Error((e as SpeechSynthesisErrorEvent).error ?? 'tts_error')
          options.onError?.(err)
          resolve()
        }
        window.speechSynthesis.speak(u)
      } catch (e) {
        options.onError?.(e as Error)
        resolve()
      }
    })
  }

  stop(): void {
    if (this.isSupported) {
      try { window.speechSynthesis.cancel() } catch {}
    }
  }
}
