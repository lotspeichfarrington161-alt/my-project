# Robotaxi AI 旅行助手

滴滴自动驾驶 · 智能座舱 AI 旅行行程规划助手原型

## 在线体验

> 部署后填入链接

## 需求与场景分析

### 场景定义

Robotaxi 与传统网约车的座舱形态有根本性区别：
- 无驾驶员，乘客通常坐后排
- 大屏位于前方，触摸不便
- **语音是唯一自然的交互方式**
- 行程中有大量空闲时间，适合规划行程

### 功能选择理由

选择「AI 旅游行程规划助手」：乘客在车内有明确的碎片时间需求，行程规划是高频刚需，语音交互天然适合这类长对话任务。

### 功能取舍

| 保留 | 去除 |
|------|------|
| 6帧完整语音对话流程 | 手动点击跳帧（不符合真实产品） |
| 行程图片展示 | 复杂次级交互 |
| 多城市覆盖（20+城市） | 实际语音识别（超出原型范围） |
| AI 接口抽象层（可换真实 API） | — |

## 功能说明

### 6 个关键交互帧

| 帧 | 场景 | 说明 |
|----|------|------|
| 1 | 唤醒 | AI 主动问候，等待乘客说话 |
| 2 | 需求发起 | 乘客语音提出旅行需求 |
| 3 | 信息确认 | AI 确认目的地、天数、预算、偏好 |
| 4 | 方案生成 | AI 思考并生成完整行程（含图片） |
| 5 | 方案调整 | 乘客语音提出修改，AI 实时调整 |
| 6 | 保存分享 | 确认方案，发送到手机 |

### AI 接口层设计

`services/ai/AIService.ts` 定义了三个核心方法的接口：

```typescript
interface AIService {
  extractTravelParams(userInput: string): Promise<TravelParams>
  generateItinerary(params: TravelParams): Promise<FullItinerary>
  adjustItinerary(feedback: string, current: FullItinerary): Promise<FullItinerary>
}
```

当前使用 `MockAIService`（本地城市数据库 + 模板生成）。  
接入真实 AI 只需：
1. 在 `services/ai/` 新建实现文件
2. 修改 `createAIService()` 工厂函数
3. 其他所有代码零改动

## 城市覆盖

内置 20 个主要旅游目的地（精细数据）+ 任意城市兜底生成：

云南、三亚、成都、杭州、西安、北京、上海、桂林、张家界、新疆、西藏、黄山、厦门、青海、重庆、苏州、武汉、南京、乌镇、敦煌

## 技术架构

```
Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion
│
├── app/
│   ├── page.tsx              # 主页面，6帧状态机
│   └── api/unsplash/         # 图片服务（API Key 安全存服务端）
│
├── components/
│   ├── Layout/CabinLayout    # 车载底层布局（横屏 16:9）
│   ├── AIAvatar/             # AI 形象 + 脉冲动效
│   ├── VoiceWave/            # 语音波形动画
│   ├── ConversationBubble/   # 对话气泡
│   └── ItineraryCard/        # 行程卡片（含 Unsplash 图片）
│
├── services/ai/
│   ├── AIService.ts          # 接口定义 + 工厂函数
│   ├── MockAIService.ts      # 当前实现
│   └── ClaudeService.ts      # 预留接口（待实现）
│
├── hooks/useFrameState.ts    # 6帧状态机（useRef 避免 stale closure）
├── data/cities.json          # 城市数据库
└── types/index.ts            # 全局类型定义
```

## 本地启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问
open http://localhost:3000
```

**推荐使用 1280×720 或更大的横屏分辨率**（模拟车载大屏）

## 环境变量

`.env.local` 文件中配置：

```env
# Unsplash API（免费申请：https://unsplash.com/developers）
# 不配置时自动使用备用图片，不影响功能
UNSPLASH_ACCESS_KEY=你的key

# AI Provider（mock | claude，默认 mock）
NEXT_PUBLIC_AI_PROVIDER=mock

# 接入 Claude 后启用
# CLAUDE_API_KEY=你的key
```

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入仓库
3. 在 Vercel 项目设置中配置环境变量 `UNSPLASH_ACCESS_KEY`
4. 自动构建部署完成

---

滴滴自动驾驶 · 智能座舱产品团队面试作品
