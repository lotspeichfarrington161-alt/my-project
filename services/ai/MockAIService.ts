import { AIService, TravelParams, FullItinerary, DayItinerary, Activity, IntentResult } from '@/types'
import citiesData from '@/data/cities.json'

// 中文数字 → 阿拉伯数字（支持 一/二/两/三...十/十一...二十/三十...）
function chineseNumToInt(s: string): number | null {
  const single: Record<string, number> = {
    '〇': 0, '零': 0, '一': 1, '壹': 1, '二': 2, '两': 2, '俩': 2, '贰': 2,
    '三': 3, '叁': 3, '四': 4, '肆': 4, '五': 5, '伍': 5, '六': 6, '陆': 6,
    '七': 7, '柒': 7, '八': 8, '捌': 8, '九': 9, '玖': 9, '十': 10, '拾': 10,
  }
  if (single[s] !== undefined) return single[s]
  // 十X (11-19)
  if (s.length === 2 && (s[0] === '十' || s[0] === '拾')) {
    const n = single[s[1]]
    return n !== undefined ? 10 + n : null
  }
  // X十 (20, 30, ...)
  if (s.length === 2 && (s[1] === '十' || s[1] === '拾')) {
    const n = single[s[0]]
    return n !== undefined ? n * 10 : null
  }
  // X十Y (21-99)
  if (s.length === 3 && (s[1] === '十' || s[1] === '拾')) {
    const tens = single[s[0]]
    const ones = single[s[2]]
    if (tens !== undefined && ones !== undefined) return tens * 10 + ones
  }
  return null
}

// 从用户输入中提取天数（支持中英文数字、特殊词）
function extractDays(input: string): number | null {
  // —— 优先：通用 X天 / X日（X 是中文或阿拉伯数字），最精确
  const match = input.match(/([0-9]+|[一壹二两俩贰三叁四肆五伍六陆七柒八捌九玖十拾]{1,3})\s*[天日]/)
  if (match) {
    const numStr = match[1]
    if (/^[0-9]+$/.test(numStr)) {
      const n = parseInt(numStr, 10)
      if (n > 0 && n <= 60) return n
    } else {
      const n = chineseNumToInt(numStr)
      if (n !== null && n > 0 && n <= 60) return n
    }
  }

  // —— 兜底：特殊说法
  if (/(一|1)\s*个?\s*礼拜|(一|1)\s*周/.test(input)) return 7
  if (/(两|二|2)\s*周/.test(input)) return 14
  if (/(三|3)\s*周/.test(input)) return 21
  if (/(一|1)\s*个?\s*月/.test(input)) return 30
  if (/周末|双休/.test(input)) return 2
  if (/小长假/.test(input)) return 3
  if (/国庆假期|国庆长假|十一假期|十一长假/.test(input)) return 7

  return null
}

export class MockAIService implements AIService {

  async detectIntent(userInput: string, hasItinerary: boolean): Promise<IntentResult> {
    await delay(150)
    const input = userInput.trim()

    if (/重新|换一个|重来|取消|从头/.test(input)) {
      return { intent: 'restart', confidence: 0.95 }
    }

    if (hasItinerary) {
      if (/确认|确定|就这个|可以了|没问题|好的|发送|保存|发到手机/.test(input)) {
        return { intent: 'confirm', confidence: 0.9 }
      }
      if (/改|调整|换|加|减|多一些|少一些|不要|去掉|增加|删除|替换|更|想要/.test(input)) {
        return { intent: 'adjust', confidence: 0.85 }
      }
    }

    const hasCity = this.extractCity(input) !== null
    const hasDays = extractDays(input) !== null
    const hasPlanKeyword = /规划|计划|想去|去玩|旅游|旅行|出游|帮我|安排/.test(input)

    if (hasCity || hasDays || hasPlanKeyword) {
      const missing: Array<'city' | 'days'> = []
      if (!hasCity) missing.push('city')
      if (!hasDays) missing.push('days')
      return {
        intent: 'plan',
        confidence: hasCity && hasDays ? 0.95 : 0.6,
        missingFields: missing.length > 0 ? missing : undefined,
      }
    }

    return { intent: 'unclear', confidence: 0.3 }
  }

  async extractTravelParams(userInput: string): Promise<TravelParams> {
    await delay(600)

    const days = extractDays(userInput) ?? 5

    const city = this.extractCity(userInput) ?? '云南'

    let budget: TravelParams['budget'] = 'moderate'
    if (/经济|省钱|便宜|穷游/.test(userInput)) budget = 'economy'
    if (/豪华|奢华|高端|土豪/.test(userInput)) budget = 'luxury'

    const preferences: string[] = []
    if (/美食|吃/.test(userInput)) preferences.push('美食')
    if (/自然|户外|徒步|爬山|风光/.test(userInput)) preferences.push('户外')
    if (/文化|历史|古迹|博物/.test(userInput)) preferences.push('文化')
    if (/购物|买买买/.test(userInput)) preferences.push('购物')
    if (/亲子|带孩子|带娃/.test(userInput)) preferences.push('亲子')

    const departureMatch = userInput.match(/从(.{2,4})出发/)
    const departureCity = departureMatch ? departureMatch[1] : undefined

    return { city, days, budget, preferences, departureCity }
  }

  async generateItinerary(params: TravelParams): Promise<FullItinerary> {
    await delay(2000)

    const cityData = this.findCityData(params.city)
    const budget = params.budget ?? 'moderate'
    const dailyCost = cityData.avgDailyBudget[budget]

    const dayPlans: DayItinerary[] = []
    for (let i = 0; i < params.days; i++) {
      dayPlans.push(this.generateDay(i + 1, params, cityData))
    }

    return {
      id: `itinerary-${Date.now()}`,
      destination: params.city,
      days: params.days,
      totalBudget: dailyCost * params.days,
      highlights: cityData.attractions.slice(0, 4),
      dayPlans,
      tips: this.generateTips(cityData, params),
    }
  }

  async adjustItinerary(feedback: string, current: FullItinerary): Promise<FullItinerary> {
    await delay(1500)

    const cityData = this.findCityData(current.destination)
    const adjusted = { ...current, dayPlans: current.dayPlans.map(day => ({ ...day })) }

    if (/户外|自然|徒步|运动/.test(feedback)) {
      adjusted.dayPlans = adjusted.dayPlans.map(day => ({
        ...day,
        theme: day.theme + ' · 偏户外',
        activities: this.boostOutdoor(day.activities, cityData),
      }))
    }

    if (/美食|吃|餐厅/.test(feedback)) {
      adjusted.dayPlans = adjusted.dayPlans.map(day => ({
        ...day,
        activities: this.addFoodActivity(day.activities, cityData),
      }))
    }

    if (/减少|去掉|不想/.test(feedback)) {
      adjusted.dayPlans = adjusted.dayPlans.map(day => ({
        ...day,
        activities: day.activities.filter((_, i) => i !== 1),
      }))
    }

    return adjusted
  }

  private extractCity(input: string): string | null {
    // 内置城市优先匹配
    const allCities = citiesData.cities.map(c => c.name)
    for (const city of allCities) {
      if (input.includes(city)) return city
    }
    // 别名扩展
    const aliases: Record<string, string> = {
      '昆明': '云南', '大理': '云南', '丽江': '云南', '香格里拉': '云南',
      '海南': '三亚', '三亚湾': '三亚',
      '九寨沟': '成都', '稻城': '成都',
      '吐鲁番': '新疆', '喀纳斯': '新疆',
      '拉萨': '西藏', '日喀则': '西藏',
      '深圳': '深圳', '广州': '广州', '香港': '香港', '澳门': '澳门',
      '青岛': '青岛', '大连': '大连',
    }
    for (const [alias, city] of Object.entries(aliases)) {
      if (input.includes(alias)) return city
    }
    // 通过模式匹配兜底（任意城市名）
    const patterns = [
      /去([一-龥]{2,4})[玩旅游游][^a-zA-Z]/,
      /([一-龥]{2,4})旅游/,
      /规划([一-龥]{2,4})/,
      /([一-龥]{2,4})的行程/,
      /到([一-龥]{2,4})去/,
    ]
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match && match[1].length >= 2) return match[1]
    }
    return null
  }

  private findCityData(cityName: string) {
    const found = citiesData.cities.find(c =>
      c.name === cityName || cityName.includes(c.name) || c.name.includes(cityName)
    )
    if (found) return found

    // 没找到时用兜底数据，动态生成
    return {
      name: cityName,
      province: '',
      keywords: [`${cityName} China travel scenic`],
      attractions: [`${cityName}地标`, `${cityName}古城`, `${cityName}公园`, `${cityName}博物馆`],
      foods: [`${cityName}特色菜`, `${cityName}小吃`, '当地名菜'],
      accommodationAreas: [`${cityName}市中心`],
      bestSeason: '全年均可',
      avgDailyBudget: citiesData.fallback.avgDailyBudget,
      dayThemes: citiesData.fallback.dayThemes,
    }
  }

  private generateDay(
    dayNum: number,
    params: TravelParams,
    cityData: ReturnType<typeof this.findCityData>
  ): DayItinerary {
    const themeIndex = Math.min(dayNum - 1, cityData.dayThemes.length - 1)
    const theme = cityData.dayThemes[themeIndex]
    const budget = params.budget ?? 'moderate'
    const dailyCost = cityData.avgDailyBudget[budget]

    const attractionIndex = (dayNum - 1) * 2
    const mainAttraction = cityData.attractions[attractionIndex % cityData.attractions.length]
    const subAttraction = cityData.attractions[(attractionIndex + 1) % cityData.attractions.length]
    const food = cityData.foods[(dayNum - 1) % cityData.foods.length]

    const activities: Activity[] = [
      {
        time: '上午',
        title: mainAttraction,
        description: `探索${mainAttraction}，感受当地独特风情`,
        duration: '约3小时',
        type: 'scenic',
      },
      {
        time: '下午',
        title: subAttraction,
        description: `游览${subAttraction}，深度体验${params.city}文化`,
        duration: '约2.5小时',
        type: 'culture',
      },
      {
        time: '晚上',
        title: `品尝${food}`,
        description: `前往当地推荐餐厅，品尝正宗${food}`,
        duration: '约1.5小时',
        type: 'food',
      },
    ]

    return {
      day: dayNum,
      city: params.city,
      theme,
      activities,
      estimatedCost: dailyCost,
      imageQuery: cityData.keywords[Math.min(dayNum - 1, cityData.keywords.length - 1)],
    }
  }

  private boostOutdoor(activities: Activity[], cityData: ReturnType<typeof this.findCityData>): Activity[] {
    return activities.map(act => {
      if (act.type === 'culture') {
        return {
          ...act,
          title: `${cityData.attractions.find(a => a.includes('山') || a.includes('湖') || a.includes('湿地')) ?? act.title}`,
          type: 'outdoor' as const,
          description: '户外探索，亲近自然',
        }
      }
      return act
    })
  }

  private addFoodActivity(activities: Activity[], cityData: ReturnType<typeof this.findCityData>): Activity[] {
    const hasFood = activities.some(a => a.type === 'food')
    if (hasFood) return activities
    return [
      ...activities,
      {
        time: '下午茶',
        title: `${cityData.foods[Math.floor(Math.random() * cityData.foods.length)]}体验`,
        description: '品尝当地特色美食',
        duration: '约1小时',
        type: 'food' as const,
      },
    ]
  }

  private generateTips(cityData: ReturnType<typeof this.findCityData>, params: TravelParams): string[] {
    return [
      `最佳出行季节：${cityData.bestSeason}`,
      `建议提前预订${params.days >= 5 ? '火车票和' : ''}酒店`,
      `当地特色美食推荐：${cityData.foods.slice(0, 2).join('、')}`,
      '出行前请确认景区开放时间和门票预约要求',
    ]
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
