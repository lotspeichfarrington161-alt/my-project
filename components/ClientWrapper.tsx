'use client'

import dynamic from 'next/dynamic'

// 整个交互应用都依赖浏览器 API（麦克风、TTS、SpeechRecognition），
// 完全禁用 SSR，保证服务端和客户端首屏一致，避免 hydration mismatch
const HomeClient = dynamic(() => import('./HomeClient'), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-950">
      <div className="text-white/30 text-sm">加载中...</div>
    </div>
  ),
})

export default function ClientWrapper() {
  return <HomeClient />
}
