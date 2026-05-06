// TTS 服务统一接口 —— 换 Provider 只需实现这个接口

export interface SpeakOptions {
  voice?: string         // 音色ID
  rate?: number          // 语速 0.5 - 2，默认 1
  pitch?: number         // 音调
  volume?: number        // 音量
  onStart?: () => void
  onEnd?: () => void
  onError?: (e: Error) => void
}

export interface TTSProvider {
  readonly name: string
  readonly isSupported: boolean
  speak(text: string, options?: SpeakOptions): Promise<void>
  stop(): void
  /** 在用户首次手势同步回调中调用，解锁浏览器自动播放限制 */
  unlock?(): void
}

// 工厂：根据环境变量选择 TTS Provider
export type TTSProviderType = 'browser' | 'mimo'

export function getTTSProviderType(): TTSProviderType {
  if (typeof window === 'undefined') return 'browser'
  const env = process.env.NEXT_PUBLIC_TTS_PROVIDER as TTSProviderType | undefined
  return env ?? 'browser'
}
