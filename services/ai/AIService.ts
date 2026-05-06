import { AIService } from '@/types'

/**
 * 工厂函数：根据环境变量 NEXT_PUBLIC_AI_PROVIDER 切换实现
 *  - mock         → MockAIService（本地模板，零成本）
 *  - siliconflow  → SiliconFlowAIService（DeepSeek-V3 等）
 *  - claude       → ClaudeAIService（预留）
 */
export function createAIService(): AIService {
  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER ?? 'mock'

  switch (provider) {
    case 'siliconflow':
    case 'deepseek': {
      const { SiliconFlowAIService } = require('./SiliconFlowAIService')
      return new SiliconFlowAIService()
    }
    case 'mock':
    default: {
      const { MockAIService } = require('./MockAIService')
      return new MockAIService()
    }
  }
}
