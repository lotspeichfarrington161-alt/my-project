'use client'

import { AIService, TravelParams, FullItinerary, IntentResult, QueryAnswer, DayItinerary } from '@/types'

const MODEL = process.env.NEXT_PUBLIC_LLM_MODEL ?? 'Qwen/Qwen2.5-72B-Instruct'
const FAST_MODEL = process.env.NEXT_PUBLIC_LLM_FAST_MODEL ?? 'Qwen/Qwen2.5-7B-Instruct'

// ────────────────────────────────────────────────────────────────────────────
// Robotaxi 上下文铁律（所有 prompt 共享，已精简）
// ────────────────────────────────────────────────────────────────────────────
const ROBOTAXI_CONTEXT = `场景：你是滴滴 Robotaxi 上的 AI 旅行助手，乘客坐在我们无人车里。
铁律：所有交通仅用「Robotaxi 接送」。严禁出现：飞机、高铁、火车、自驾、地铁、公交、出租、网约车。跨城用"Robotaxi 城际专车"，市内用"Robotaxi 5 分钟内到达"。`

// ────────────────────────────────────────────────────────────────────────────
// Prompt 1: 意图分类
// ────────────────────────────────────────────────────────────────────────────
const SYSTEM_INTENT = `判断用户意图，输出 JSON。
意图：plan(规划) | adjust(调整) | confirm(确认) | restart(重来) | query(问询) | unclear
{ "intent":"...", "confidence":0.9, "missingFields":["city"|"days"] }
missingFields 仅 plan 缺信息时填。直接输出 JSON。`

// ────────────────────────────────────────────────────────────────────────────
// Prompt 2: 骨架快速生成（用 7B 模型，1-2 秒返回）
// ────────────────────────────────────────────────────────────────────────────
const SYSTEM_SKELETON = `你是 Robotaxi 旅行助手，快速生成行程骨架。
${ROBOTAXI_CONTEXT}

输出严格 JSON：
{
  "destination":"云南",
  "days":5,
  "totalBudget":3000,
  "personalizedFor":"适合带老人/亲子/情侣等",
  "highlights":["丽江古城","玉龙雪山","大理古城","洱海"],
  "dayPlans":[
    {"day":1,"city":"昆明","theme":"抵达春城 · 滇池晚霞","imageQuery":"Kunming Dianchi Lake China"},
    {"day":2,"city":"大理","theme":"古城风情 · 洱海骑行","imageQuery":"Dali Erhai Lake China"}
  ]
}

要求：
- imageQuery 用英文（Unsplash 搜索关键词）
- theme 12 字内，城市名 + 主题
- 直接输出 JSON 不解释`

// ────────────────────────────────────────────────────────────────────────────
// Prompt 3: 完整行程生成（精简版，去掉冗余字段）
// ────────────────────────────────────────────────────────────────────────────
const SYSTEM_GENERATE = `你是滴滴 Robotaxi 上的金牌导游 AI。生成完整结构化行程 JSON。
${ROBOTAXI_CONTEXT}

【风格】每天的 guideNarration 是导游开场白（1-2 句）。每个景点的 whyVisit 1 句话讲清亮点。

【输出 JSON】
{
  "destination":"云南",
  "days":5,
  "totalBudget":3000,
  "personalizedFor":"适合年轻情侣",
  "highlights":["丽江古城","玉龙雪山","大理古城"],
  "culturalNotes":"云南是 26 个民族的家园（一句话）",
  "packingList":["薄羽绒","防晒霜","氧气瓶","身份证"],
  "budgetBreakdown":{"accommodation":1050,"food":750,"tickets":600,"robotaxi":450,"other":150},
  "routePlan":[
    {"from":"昆明","to":"大理","robotaxi":"Robotaxi 城际专车","distance":"约 280 公里","duration":"约 4 小时"}
  ],
  "tips":["3-10月最佳","云南火锅必尝"],
  "dayPlans":[
    {
      "day":1,"city":"昆明","theme":"抵达春城 · 滇池晚霞",
      "guideNarration":"欢迎来到春城昆明！傍晚带您看滇池海鸥，绝对难忘。",
      "weather":{"type":"partly","high":24,"low":14,"description":"晴间多云","suggestion":"带件薄外套"},
      "crossCityTransfer":null,
      "accommodation":{"area":"翠湖周边","recommendation":"幽静老昆明味道","priceRange":"¥350-600"},
      "estimatedCost":600,
      "imageQuery":"Kunming Dianchi Lake China",
      "activities":[
        {"time":"下午","title":"滇池泛舟","duration":"约3小时","type":"scenic","whyVisit":"高原明珠，云南最大淡水湖","ticketPrice":120,"needReservation":false},
        {"time":"傍晚","title":"海埂大坝看海鸥","duration":"约1.5小时","type":"scenic","whyVisit":"冬季西伯利亚红嘴鸥来此过冬","ticketPrice":0},
        {"time":"晚上","title":"南屏街品过桥米线","duration":"约1.5小时","type":"food","whyVisit":"百年老店建新园，地道云南味","ticketPrice":0}
      ]
    }
  ]
}

【字段规则】
- activity.type 严格枚举：scenic | food | culture | outdoor | shopping | accommodation
- 如当天跨城（如 Day2 从昆明到大理），crossCityTransfer 填具体；否则填 null
- weather.type 枚举：sunny | cloudy | rainy | partly | snowy
- 单日预算 economy≈300 / moderate≈600 / luxury≈1200
- description 字段已删除，不要输出
- robotaxiInfo 字段已删除，不要输出
- 直接输出 JSON 不解释`

// ────────────────────────────────────────────────────────────────────────────
// Prompt 4: 行程调整
// ────────────────────────────────────────────────────────────────────────────
const SYSTEM_ADJUST = `根据用户反馈调整现有行程。
${ROBOTAXI_CONTEXT}

规则：
1. destination/days 不变
2. "加户外"→ 加徒步/骑行；"加美食"→ 加 type=food
3. "带老人"→ 删高强度、降节奏；"带孩子"→ 加亲子互动
4. theme/guideNarration 同步更新
5. estimatedCost / budgetBreakdown 重算
6. 直接输出完整 JSON 不解释`

// ────────────────────────────────────────────────────────────────────────────
// Prompt 5: 万能问询
// ────────────────────────────────────────────────────────────────────────────
const SYSTEM_QUERY = `你是滴滴 Robotaxi 上的金牌导游。回答用户旅行问题。
${ROBOTAXI_CONTEXT}

风格：生动、有典故、60-100 字一段（车上听 TTS）。
- 不确定的数字坦诚说"参考价位"
- 涉及交通只说 Robotaxi
输出 JSON：{ "text":"答复正文", "type":"attraction|food|weather|culture|general", "highlights":["关键词"] }`

// ────────────────────────────────────────────────────────────────────────────
// 工具函数
// ────────────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callLLM(
  messages: ChatMessage[],
  options: { temperature?: number; jsonMode?: boolean; maxTokens?: number; model?: string } = {}
): Promise<string> {
  const body: Record<string, unknown> = {
    model: options.model ?? MODEL,
    messages,
    temperature: options.temperature ?? 0.6,
    max_tokens: options.maxTokens ?? 4096,
    stream: false,
  }
  if (options.jsonMode) body.response_format = { type: 'json_object' }

  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown')
    throw new Error(`LLM call failed: ${res.status} ${text}`)
  }
  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM 响应中无内容')
  return content
}

function safeJSON<T>(text: string): T {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  }
  return JSON.parse(cleaned) as T
}

// ────────────────────────────────────────────────────────────────────────────
// 实现
// ────────────────────────────────────────────────────────────────────────────
export class SiliconFlowAIService implements AIService {
  // 预热连接（页面初始化时调用）
  static async preheat(): Promise<void> {
    try {
      await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: FAST_MODEL,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5,
        }),
      })
    } catch {}
  }

  async detectIntent(userInput: string, hasItinerary: boolean): Promise<IntentResult> {
    try {
      const content = await callLLM(
        [
          { role: 'system', content: SYSTEM_INTENT },
          { role: 'user', content: `用户输入: "${userInput}"\n已有行程: ${hasItinerary ? '是' : '否'}` },
        ],
        { temperature: 0.2, jsonMode: true, maxTokens: 100, model: FAST_MODEL }
      )
      const parsed = safeJSON<IntentResult>(content)
      return {
        intent: parsed.intent ?? 'unclear',
        confidence: parsed.confidence ?? 0.5,
        missingFields: parsed.missingFields,
      }
    } catch (e) {
      console.error('[SiliconFlow] detectIntent failed:', e)
      return { intent: 'unclear', confidence: 0.3 }
    }
  }

  // extractTravelParams 现在仅在备用流程使用，主流程合并到 generateItinerary
  async extractTravelParams(userInput: string): Promise<TravelParams> {
    try {
      const content = await callLLM(
        [
          {
            role: 'system',
            content: `提取旅行参数 JSON。字段：city, days(1-30), budget(economy|moderate|luxury), preferences[], departureCity, travelers, withElderly, withKids。无法确定就省略。`,
          },
          { role: 'user', content: userInput },
        ],
        { temperature: 0.2, jsonMode: true, maxTokens: 200, model: FAST_MODEL }
      )
      const parsed = safeJSON<Partial<TravelParams>>(content)
      return {
        city: parsed.city ?? '云南',
        days: parsed.days ?? 5,
        budget: parsed.budget,
        preferences: parsed.preferences,
        departureCity: parsed.departureCity,
        travelers: parsed.travelers,
        withElderly: parsed.withElderly,
        withKids: parsed.withKids,
      }
    } catch (e) {
      console.error('[SiliconFlow] extractTravelParams failed:', e)
      return { city: '云南', days: 5 }
    }
  }

  /**
   * 骨架快速生成：用 7B 模型 1-2 秒返回基础结构
   * UI 立刻显示骨架卡，避免用户干等
   */
  async generateSkeleton(rawText: string, knownCity?: string, knownDays?: number): Promise<FullItinerary> {
    const userMsg = `用户输入："${rawText}"${knownCity ? `\n目的地: ${knownCity}` : ''}${knownDays ? `\n天数: ${knownDays}` : ''}\n请快速生成骨架。`

    const content = await callLLM(
      [
        { role: 'system', content: SYSTEM_SKELETON },
        { role: 'user', content: userMsg },
      ],
      { temperature: 0.4, jsonMode: true, maxTokens: 800, model: FAST_MODEL }
    )
    const parsed = safeJSON<Partial<FullItinerary>>(content)
    return {
      id: `skeleton-${Date.now()}`,
      destination: parsed.destination ?? knownCity ?? '云南',
      days: parsed.days ?? knownDays ?? 5,
      totalBudget: parsed.totalBudget ?? 3000,
      highlights: parsed.highlights ?? [],
      personalizedFor: parsed.personalizedFor,
      dayPlans: (parsed.dayPlans ?? []).map(d => ({
        ...d,
        activities: d.activities ?? [],
        estimatedCost: d.estimatedCost ?? 0,
      } as DayItinerary)),
      tips: parsed.tips ?? [],
    }
  }

  /**
   * 完整行程生成（接受原始文本，内部提取参数 + 生成详情）
   * 不再需要预先调用 extractTravelParams
   */
  async generateItinerary(params: TravelParams): Promise<FullItinerary> {
    const userMsg = `生成行程：
目的地: ${params.city}
天数: ${params.days}
预算: ${params.budget ?? 'moderate'}
偏好: ${params.preferences?.join('、') ?? '不限'}
出发: ${params.departureCity ?? '本地'}
人数: ${params.travelers ?? '不限'}
带老人: ${params.withElderly ? '是' : '否'}
带孩子: ${params.withKids ? '是' : '否'}

按 system 中 JSON 格式完整输出。`

    const content = await callLLM(
      [
        { role: 'system', content: SYSTEM_GENERATE },
        { role: 'user', content: userMsg },
      ],
      { temperature: 0.7, jsonMode: true, maxTokens: 5000 }
    )
    const parsed = safeJSON<FullItinerary>(content)
    if (!parsed.id) parsed.id = `itinerary-${Date.now()}`
    return parsed
  }

  async adjustItinerary(feedback: string, current: FullItinerary): Promise<FullItinerary> {
    const userMsg = `当前行程：
${JSON.stringify(current)}

用户反馈：${feedback}

输出调整后的完整 JSON。`

    const content = await callLLM(
      [
        { role: 'system', content: SYSTEM_ADJUST },
        { role: 'user', content: userMsg },
      ],
      { temperature: 0.6, jsonMode: true, maxTokens: 5000 }
    )
    const parsed = safeJSON<FullItinerary>(content)
    if (!parsed.id) parsed.id = current.id
    return parsed
  }

  async answerQuery(question: string, currentItinerary?: FullItinerary | null): Promise<QueryAnswer> {
    const ctx = currentItinerary
      ? `\n【当前行程上下文】目的地:${currentItinerary.destination} 天数:${currentItinerary.days}`
      : ''
    try {
      const content = await callLLM(
        [
          { role: 'system', content: SYSTEM_QUERY },
          { role: 'user', content: `用户问: ${question}${ctx}` },
        ],
        { temperature: 0.7, jsonMode: true, maxTokens: 500, model: FAST_MODEL }
      )
      const parsed = safeJSON<QueryAnswer>(content)
      return {
        text: parsed.text ?? '抱歉，这个问题我还需要查证。',
        type: parsed.type ?? 'general',
        highlights: parsed.highlights,
      }
    } catch (e) {
      console.error('[SiliconFlow] answerQuery failed:', e)
      return { text: '抱歉，刚才网络有点波动，您再问一次？', type: 'general' }
    }
  }
}
