'use client'

import { motion } from 'framer-motion'

interface PermissionGateProps {
  permission: 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
  onStart: () => void
}

export default function PermissionGate({ permission, onStart }: PermissionGateProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(250, 250, 248, 0.6)', backdropFilter: 'blur(20px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong rounded-[32px] p-12 max-w-lg w-[90%] text-center"
        style={{ boxShadow: '0 40px 100px rgba(31, 41, 55, 0.12)' }}
      >
        {/* Siri 风光球 */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(165, 199, 255, 0.5) 0%, rgba(255, 196, 225, 0.4) 50%, transparent 80%)',
              filter: 'blur(20px)',
            }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-3 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, #FFE4B5 0%, #A5C7FF 35%, #FFC4E1 70%, #C4B5FD 100%)',
              boxShadow:
                'inset 0 0 30px rgba(255,255,255,0.6), inset -8px -8px 20px rgba(196, 181, 253, 0.3), 0 20px 60px rgba(165, 199, 255, 0.4)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          >
            <div
              className="absolute rounded-full"
              style={{
                top: '15%',
                left: '20%',
                width: '40%',
                height: '30%',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, transparent 70%)',
              }}
            />
          </motion.div>
        </div>

        {permission === 'unsupported' ? (
          <>
            <h2 className="text-[var(--text-primary)] text-2xl font-bold mb-3">浏览器不支持语音识别</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              您的浏览器不支持 Web Speech API，请改用 Chrome、Edge 或 Safari 14+ 访问本应用。
            </p>
          </>
        ) : permission === 'denied' ? (
          <>
            <h2 className="text-[var(--text-primary)] text-2xl font-bold mb-3">麦克风权限被拒绝</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-7 leading-relaxed">
              请在浏览器地址栏的麦克风图标处允许权限，然后刷新页面。<br />
              Robotaxi 座舱场景下，<span className="text-[var(--accent-blue)] font-medium">语音是唯一的交互方式</span>。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 rounded-full text-white font-medium text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--accent-blue) 0%, #4DA8FF 100%)',
                boxShadow: '0 12px 30px rgba(0, 122, 255, 0.3)',
              }}
            >
              刷新重试
            </button>
          </>
        ) : (
          <>
            <h2 className="text-[var(--text-primary)] text-3xl font-bold mb-3">欢迎使用 AI 旅行助手</h2>
            <p className="text-[var(--text-secondary)] text-[15px] mb-3 leading-relaxed font-light">
              本产品模拟 Robotaxi 无人车座舱体验
            </p>
            <p className="text-[var(--text-secondary)] text-[15px] mb-8 leading-relaxed font-light">
              全程通过 <span className="text-[var(--accent-blue)] font-semibold">语音对话</span> 完成旅行规划
            </p>

            {/* 启动按钮 - 玻璃感 */}
            <button
              onClick={onStart}
              disabled={permission === 'requesting'}
              className="px-10 py-4 rounded-full text-white font-medium text-base tracking-wide transition-all disabled:opacity-60 disabled:cursor-wait"
              style={{
                background: 'linear-gradient(135deg, var(--accent-blue) 0%, #4DA8FF 50%, #AF52DE 100%)',
                boxShadow:
                  '0 12px 40px rgba(0, 122, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
              }}
            >
              {permission === 'requesting' ? '正在启动语音聆听...' : '✨ 开始语音对话'}
            </button>

            <div className="mt-8 flex items-center justify-center gap-4 text-[var(--text-tertiary)] text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
                Chrome / Edge
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
                需允许麦克风
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
                建议横屏全屏
              </span>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
