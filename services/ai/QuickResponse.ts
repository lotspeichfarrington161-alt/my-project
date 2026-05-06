/**
 * QuickResponse —— 本地零延迟意图推断 + 过渡话生成
 *
 * 核心思路：用户说话后，立刻（无需 LLM 调用）分析输入并生成一句过渡话，
 * 让 AI 在 0.5 秒内开口，掩盖后台 LLM 的 5-10 秒延迟。
 *
 * 这是纯本地 JS 处理，不依赖任何网络请求。
 */

export type QuickIntent = 'plan' | 'adjust' | 'confirm' | 'restart' | 'query' | 'unclear'

export interface QuickAnalysis {
  intent: QuickIntent
  city?: string
  days?: number
  acknowledgment: string  // 立刻播报的过渡话
}

// ——————————————————————————————————————
// 本地知识：常见城市/省份名（仅为加速过渡话，正式数据由 LLM 提供）
// ——————————————————————————————————————
const KNOWN_DESTINATIONS = [
  '北京', '上海', '广州', '深圳', '成都', '重庆', '杭州', '南京', '苏州',
  '西安', '武汉', '长沙', '郑州', '青岛', '大连', '厦门', '福州', '昆明',
  '贵阳', '南宁', '海口', '三亚', '兰州', '西宁', '银川', '乌鲁木齐',
  '拉萨', '哈尔滨', '长春', '沈阳', '天津', '济南',
  '云南', '贵州', '四川', '海南', '新疆', '西藏', '青海', '内蒙古',
  '广西', '广东', '湖南', '湖北', '河南', '河北', '山东', '山西', '江苏',
  '浙江', '福建', '安徽', '江西', '陕西', '甘肃', '黑龙江', '吉林', '辽宁',
  '丽江', '大理', '西双版纳', '香格里拉', '九寨沟', '稻城', '张家界',
  '桂林', '阳朔', '黄山', '泰山', '华山', '峨眉山', '武当山', '武夷山',
  '婺源', '凤凰', '乌镇', '周庄', '同里', '平遥', '丽江古城', '阳朔',
  '青岛', '北海', '舟山', '厦门鼓浪屿', '敦煌', '茶卡盐湖', '青海湖',
]

// 中文数字转阿拉伯
const CHINESE_NUM: Record<string, number> = {
  '一':1,'二':2,'两':2,'俩':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,
}

function chToInt(s: string): number | null {
  if (CHINESE_NUM[s] !== undefined) return CHINESE_NUM[s]
  if (s.length === 2 && s[0] === '十') return 10 + (CHINESE_NUM[s[1]] ?? 0)
  if (s.length === 2 && s[1] === '十') return (CHINESE_NUM[s[0]] ?? 0) * 10
  if (s.length === 3 && s[1] === '十') {
    return (CHINESE_NUM[s[0]] ?? 0) * 10 + (CHINESE_NUM[s[2]] ?? 0)
  }
  return null
}

function extractDays(input: string): number | null {
  const m = input.match(/([0-9]+|[一二两三四五六七八九十]{1,3})\s*[天日]/)
  if (!m) {
    if (/(一|1)\s*个?\s*礼拜|(一|1)\s*周/.test(input)) return 7
    if (/(两|二|2)\s*周/.test(input)) return 14
    if (/周末|双休/.test(input)) return 2
    if (/小长假/.test(input)) return 3
    return null
  }
  const num = m[1]
  if (/^\d+$/.test(num)) {
    const n = parseInt(num, 10)
    return n > 0 && n <= 60 ? n : null
  }
  return chToInt(num)
}

function extractCity(input: string): string | null {
  for (const city of KNOWN_DESTINATIONS) {
    if (input.includes(city)) return city
  }
  // 兜底：「去 XX」「XX 旅游」「规划 XX」
  const patterns = [/去([一-龥]{2,4})[玩游]/, /([一-龥]{2,4})旅[行游]/, /规划([一-龥]{2,4})/]
  for (const p of patterns) {
    const m = input.match(p)
    if (m && m[1].length >= 2) return m[1]
  }
  return null
}

// ——————————————————————————————————————
// 主函数：分析用户输入 + 生成过渡话
// ——————————————————————————————————————
export function analyzeUserInput(input: string, hasItinerary: boolean): QuickAnalysis {
  const text = input.trim()

  // 1. restart：最高优先级
  if (/重新|换一个|重来|取消|从头|算了/.test(text)) {
    return {
      intent: 'restart',
      acknowledgment: '没问题，我们重新开始。请问您想去哪里？',
    }
  }

  // 2. 已有行程时优先 confirm/adjust
  if (hasItinerary) {
    if (/确认|确定|就这个|可以了|没问题|发送|发到手机|好的就这个|保存/.test(text)) {
      return {
        intent: 'confirm',
        acknowledgment: '好的，正在为您发送到手机，祝您旅途愉快！',
      }
    }
    if (/改|调整|换|加|减|多|少|不要|去掉|增加|删除|替换|更喜欢|想要/.test(text)) {
      return {
        intent: 'adjust',
        acknowledgment: '好的，我马上为您调整...',
      }
    }
  }

  // 3. 规划意图
  const city = extractCity(text)
  const days = extractDays(text)
  const hasPlanKeyword = /规划|计划|想去|去玩|旅游|旅行|出游|帮我|安排/.test(text)

  if (city || days || hasPlanKeyword) {
    if (city && days) {
      return {
        intent: 'plan',
        city,
        days,
        acknowledgment: `好的，${city}是个好地方，我这就为您规划${days}天的行程，请稍等...`,
      }
    }
    if (city && !days) {
      return {
        intent: 'plan',
        city,
        acknowledgment: `好的，${city}是个好选择！请问您计划玩几天？`,
      }
    }
    if (!city && days) {
      return {
        intent: 'plan',
        days,
        acknowledgment: `好的，${days}天的行程。请问您想去哪个城市？`,
      }
    }
    return {
      intent: 'plan',
      acknowledgment: '好的，请告诉我您想去哪里，计划玩几天？',
    }
  }

  // 4. query：知识问询（介绍景点、天气、文化等）—— 让 LLM 自由回答
  if (/介绍|讲讲|说说|怎么样|好不好|值得|推荐|有什么|什么样|哪些|哪里|为什么/.test(text)) {
    return {
      intent: 'query',
      acknowledgment: '让我为您讲讲...',
    }
  }
  if (/天气|温度|冷热|下雨|穿什么|带什么/.test(text)) {
    return {
      intent: 'query',
      acknowledgment: '好的，我看看...',
    }
  }
  if (/吃什么|餐厅|美食|小吃|特产/.test(text)) {
    return {
      intent: 'query',
      acknowledgment: '说到吃的，我可有得说了...',
    }
  }

  // 5. 无法判断
  return {
    intent: 'unclear',
    acknowledgment: '',
  }
}
