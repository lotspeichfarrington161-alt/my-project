// ────────────────────────────────────────
// 用户旅行需求参数
// ────────────────────────────────────────
export interface TravelParams {
  city: string
  days: number
  budget?: 'economy' | 'moderate' | 'luxury'
  preferences?: string[]
  departureCity?: string
  travelers?: number
  withElderly?: boolean      // 是否带老人
  withKids?: boolean         // 是否带孩子
}

// ────────────────────────────────────────
// 单个活动（已扩展）
// ────────────────────────────────────────
export interface Activity {
  time: string                // "上午" | "下午" | "晚上"
  title: string
  description: string
  duration: string            // "约2小时"
  type: 'scenic' | 'food' | 'culture' | 'outdoor' | 'shopping' | 'accommodation'
  // —— 新增 ——
  whyVisit?: string           // 为什么值得去（导游讲解）
  ticketPrice?: number        // 门票价格（无则免费）
  needReservation?: boolean   // 是否需要提前预约
  robotaxiInfo?: string       // 如"Robotaxi 5 分钟内到达"
}

// ────────────────────────────────────────
// 单日行程（已扩展）
// ────────────────────────────────────────
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'partly' | 'snowy'

export interface DayWeather {
  type: WeatherType
  high: number
  low: number
  description: string         // 如"晴间多云"
  suggestion: string          // 如"适合户外，记得防晒"
}

export interface DayItinerary {
  day: number
  date?: string
  city: string
  theme: string               // "抵达 & 初探古城"
  activities: Activity[]
  estimatedCost: number
  imageQuery: string
  imageUrl?: string
  // —— 新增 ——
  weather?: DayWeather
  guideNarration?: string     // 当天的导游开场词
  crossCityTransfer?: {        // 跨城 Robotaxi 接送（无跨城则 null）
    from: string
    to: string
    duration: string          // 如"约 4 小时"
    distance: string          // 如"约 280 公里"
  } | null
  accommodation?: {
    area: string              // 推荐住宿区域
    recommendation: string    // 简介
    priceRange?: string       // "¥500-800"
  }
}

// ────────────────────────────────────────
// 完整行程（已扩展）
// ────────────────────────────────────────
export interface RouteSegment {
  from: string                // 城市/地点
  to: string
  robotaxi: string            // 如"Robotaxi 城际专车"
  distance: string            // 如"约 280 公里"
  duration: string            // 如"约 4 小时"
}

export interface FullItinerary {
  id: string
  destination: string
  days: number
  totalBudget: number
  highlights: string[]
  dayPlans: DayItinerary[]
  tips: string[]
  // —— 新增 ——
  routePlan?: RouteSegment[]    // 完整路线段（含 Robotaxi 接送信息）
  packingList?: string[]        // 行李清单（精简 3-5 项）
  culturalNotes?: string        // 当地文化背景介绍（导游级）
  personalizedFor?: string      // 个性化标签（"适合带老人"、"亲子友好"）
  budgetBreakdown?: {           // 预算分配
    accommodation: number       // 住宿
    food: number                // 餐饮
    tickets: number             // 门票
    robotaxi: number            // Robotaxi 费用
    other: number               // 其他
  }
}

// ────────────────────────────────────────
// 对话消息
// ────────────────────────────────────────
export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// ────────────────────────────────────────
// 阶段状态
// ────────────────────────────────────────
export type FrameId =
  | 'idle'
  | 'confirm'
  | 'generate'
  | 'adjust'
  | 'finalize'
  | 'share'

export type VoiceState = 'idle' | 'listening' | 'recognizing' | 'thinking' | 'speaking'

// ────────────────────────────────────────
// 用户意图（新增 query）
// ────────────────────────────────────────
export type Intent = 'plan' | 'adjust' | 'confirm' | 'restart' | 'query' | 'unclear'

export interface IntentResult {
  intent: Intent
  confidence: number
  missingFields?: Array<'city' | 'days'>
}

// ────────────────────────────────────────
// 知识查询结果（query 通道返回）
// ────────────────────────────────────────
export interface QueryAnswer {
  text: string                  // AI 文字答复
  type?: 'attraction' | 'food' | 'weather' | 'culture' | 'general'
  highlights?: string[]         // 关键信息
}

// ────────────────────────────────────────
// AI 服务接口
// ────────────────────────────────────────
export interface AIService {
  detectIntent(userInput: string, hasItinerary: boolean): Promise<IntentResult>
  extractTravelParams(userInput: string): Promise<TravelParams>
  generateItinerary(params: TravelParams): Promise<FullItinerary>
  adjustItinerary(feedback: string, current: FullItinerary): Promise<FullItinerary>
  /** 万能问询：景点介绍、天气、文化、推荐等 */
  answerQuery?(question: string, currentItinerary?: FullItinerary | null): Promise<QueryAnswer>
}

// ────────────────────────────────────────
// 城市数据库（保留兜底用）
// ────────────────────────────────────────
export interface CityData {
  name: string
  province: string
  keywords: string[]
  attractions: string[]
  foods: string[]
  accommodationAreas: string[]
  bestSeason: string
  avgDailyBudget: {
    economy: number
    moderate: number
    luxury: number
  }
  dayThemes: string[]
}
