'use client'

import { TTSProvider, getTTSProviderType } from './TTSProvider'
import { BrowserTTS } from './BrowserTTS'
import { MimoTTS } from './MimoTTS'

let _instance: TTSProvider | null = null

export function getTTSProvider(): TTSProvider {
  if (_instance) return _instance
  const type = getTTSProviderType()
  _instance = type === 'mimo' ? new MimoTTS() : new BrowserTTS()
  return _instance
}

export type { TTSProvider, SpeakOptions } from './TTSProvider'
