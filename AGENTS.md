# AGENTS.md

你是这个仓库的主力工程 Agent。你的任务是把 **Public Pricing Memory** 从空仓库或半成品持续推进成一个真正可运行、可部署、可维护、前端精致好看的公开产品。

仓库信息：

- GitHub 仓库：`https://github.com/Darastas/Public-Pricing-Memory.git`
- GitHub 账号：`Darastas`
- 不要在代码、文档、提交记录、配置文件或日志中写入任何密码、Token、Cookie 或密钥。
- 如果需要 GitHub 认证，使用本机已登录的 `gh auth login`、Git Credential Manager，或通过环境变量提供的 `GITHUB_TOKEN`/PAT。

## 产品目标

构建 **Public Pricing Memory**：一个公开网站，长期追踪 SaaS、API、AI 工具和开发者产品的价格页面变化，保存历史快照，检测价格、套餐、免费额度、功能门槛和使用限制的变化，并以公开时间线的方式展示。

核心价值不是“AI 总结网页”，而是：

- 长期价格记忆
- 可复现的定期抓取
- 历史快照
- 结构化价格记录
- 可搜索的产品页面
- 可比较的价格变化
- 公开透明的变更时间线

这应该是一个会随着时间积累数据价值的产品，而不是一次性 Demo。

## 最终验收标准

不要停在脚手架、Mock 页面或半成品。持续推进，直到满足以下条件：

- 本地可以运行。
- 构建可以通过。
- 有真实数据库 schema。
- 可以 seed 一批初始产品。
- 可以手动触发抓取。
- 可以定期抓取价格页面。
- 可以保存快照。
- 可以检测页面变化。
- 可以生成价格/套餐相关变更事件。
- 可以在前端搜索产品。
- 每个产品有公开详情页。
- 产品页有历史快照、变化时间线和对比入口。
- 前端界面必须好看、精致、现代、信息密度合理。
- README 写清楚本地运行、环境变量、数据库、抓取、部署。
- 关键逻辑有测试。
- 每一轮阶段性工作完成后提交一次 commit，commit message 必须使用中文。

## 技术栈

优先使用：

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma 或 Drizzle ORM
- Playwright，用于必要时抓取动态页面或截图
- Cheerio 或类似 HTML 解析工具
- Vitest
- 可选：BullMQ + Redis
- 可选：Vercel Cron、GitHub Actions Cron 或 Cloudflare Workers Cron

如果已有项目选择了其他合理技术栈，可以沿用，但必须保持清晰架构、类型安全和可部署性。

## 前端品质要求

前端不能只是能用，必须有产品感。

整体气质：

- 像一个公开档案馆、价格观察站、市场记忆系统。
- 安静、清晰、可信、专业。
- 信息密度高，但不能乱。
- 有时间线、表格、diff、状态徽标、趋势视图。
- 第一屏就是实际产品，不做空洞营销页。

必须做到：

- 首页有清晰搜索、近期价格变化、追踪产品列表、提交新 URL 入口。
- 产品页要漂亮，重点展示当前状态、变化时间线、历史快照和套餐信息。
- 对比页要有清晰的文本 diff、价格变化摘要、套餐变化摘要。
- loading、empty、error、rate limit、抓取失败状态都要设计好。
- 移动端不能崩，文字和控件不能重叠。
- 控件紧凑，按钮和图标使用合理。
- 用颜色表达变化严重程度：低、中、高。
- 数据表格要易读，时间线要有节奏。

禁止：

- 不要做大而空的营销 hero。
- 不要把真正工具藏在首屏下面。
- 不要做通用 AI Chat 风格。
- 不要只用蓝紫渐变撑视觉。
- 不要卡片套卡片。
- 不要让页面像管理后台模板。
- 不要用一堆解释文字代替界面设计。

## 产品页面

### 首页 `/`

必须包含：

- 产品搜索框
- 最近价格变化列表
- 正在追踪的产品列表
- 近期抓取成功/失败状态
- 提交新产品 URL 的表单
- 简短说明，但不要喧宾夺主

### 产品页 `/products/[slug]`

必须包含：

- 产品名
- 官网 URL
- 价格页 URL
- 最新抓取时间
- 最新抓取状态
- 当前检测到的套餐
- 当前价格/计费周期/免费层信息
- 变化时间线
- 历史快照列表
- 进入快照对比的入口
- 原始规范化文本查看入口，保证透明度

### 对比页 `/products/[slug]/compare?from=...&to=...`

必须包含：

- 两个快照的时间
- 规范化文本 diff
- 检测到的价格变化
- 检测到的套餐变化
- 检测到的免费额度/使用限制变化
- 变更严重程度

### 管理页 `/admin`

用于本地和受保护的管理操作：

- 产品列表
- 新增产品
- 手动触发抓取
- 查看抓取日志
- 查看失败原因
- 重新跑某个快照的提取逻辑

管理写操作必须使用 `ADMIN_TOKEN` 或等价机制保护。没有配置 Token 时，生产环境不得开放危险操作。

## 数据模型

至少实现以下实体。

### Product

- `id`
- `slug`
- `name`
- `websiteUrl`
- `pricingUrl`
- `category`
- `status`: `active`、`paused`、`failed`
- `createdAt`
- `updatedAt`

### Snapshot

- `id`
- `productId`
- `fetchedAt`
- `sourceUrl`
- `httpStatus`
- `contentHash`
- `rawHtmlStorageKey` 或 `rawHtml`
- `normalizedText`
- `screenshotStorageKey`，可选
- `extractionStatus`
- `errorMessage`，可选

### PricingPlan

- `id`
- `snapshotId`
- `productId`
- `name`
- `priceAmount`，可为空
- `priceCurrency`，可为空
- `billingPeriod`，可为空
- `rawPriceText`
- `features`，JSON
- `limits`，JSON
- `isFreeTier`
- `metadata`，JSON

### ChangeEvent

- `id`
- `productId`
- `previousSnapshotId`
- `currentSnapshotId`
- `detectedAt`
- `changeType`
- `severity`
- `title`
- `summary`
- `details`，JSON

`changeType` 至少支持：

- `price_increase`
- `price_decrease`
- `plan_added`
- `plan_removed`
- `plan_renamed`
- `free_tier_changed`
- `feature_gate_changed`
- `usage_limit_changed`
- `copy_changed`
- `page_unreachable`
- `structure_changed`

### CrawlJob

- `id`
- `productId`
- `status`: `queued`、`running`、`succeeded`、`failed`
- `startedAt`
- `finishedAt`
- `errorMessage`
- `logs`，JSON

可以根据实际实现扩展字段，但不能丢掉这些核心概念。

## 抓取系统

实现一个可长期运行的 crawler。

必须支持：

1. 抓取价格 URL。
2. 处理超时。
3. 记录 HTTP 状态码。
4. 记录错误信息。
5. 提取可见文本。
6. 尽量去除 script、style、导航、页脚等噪音。
7. 保留价格相关表格、卡片、列表。
8. 生成稳定 `contentHash`。
9. 与上一个快照比较。
10. 未变化时记录轻量结果。
11. 变化时保存完整快照并生成变更事件。
12. 尽可能提取套餐、价格、免费额度、功能限制。

核心抓取、提取和 diff 必须是确定性逻辑。LLM 只能作为后续可选摘要层，不能成为核心依赖。

## 价格提取策略

第一版可以使用启发式，但要模块化、可测试、可解释。

至少检测：

- 货币符号：`$`、`€`、`£`、`¥`
- 价格单位：`/month`、`/mo`、`/year`、`/yr`、`per month`、`per year`
- 常见套餐名：`Free`、`Pro`、`Team`、`Enterprise`、`Business`、`Plus`、`Scale`、`Hobby`
- 免费层相关词：`free`、`trial`、`credits`、`included`
- 限制相关词：`limits`、`requests`、`tokens`、`seats`、`storage`、`usage`

对中文页面也尽量支持：

- 免费
- 试用
- 企业版
- 专业版
- 团队版
- 每月
- 每年
- 请求数
- 调用量
- 存储
- 席位

## 变化检测

至少能检测：

- 内容 hash 改变
- 价格样式文本改变
- 套餐名新增
- 套餐名删除
- 免费层变化
- 使用限制变化
- 页面从可访问变为不可访问
- 大块文本结构变化

生成人类可读的 `ChangeEvent`。

示例：

- `Pro 套餐价格从 $20/mo 变为 $25/mo`
- `检测到免费额度变化`
- `新增 Team 套餐`
- `Enterprise 套餐区域被移除`
- `价格页当前不可访问`

## Seed 产品

初始追踪这些产品：

- OpenAI
- Anthropic
- GitHub
- Vercel
- Supabase
- Cursor
- Notion
- Slack

产品 URL 应该配置化，不要写死在 UI 里。

## API

根据实际架构实现 API，至少包含：

- `GET /api/products`
- `POST /api/products`
- `GET /api/products/[slug]`
- `POST /api/crawl/[productId]`
- `GET /api/changes`
- `GET /api/snapshots/[snapshotId]`
- `GET /api/compare?from=&to=`

服务端代码必须与客户端组件分离。密钥只能在服务端读取。

## 定时任务

至少实现一种可部署的定时抓取方案：

- Vercel Cron，或
- GitHub Actions 定时调用 API，或
- Cloudflare Cron Worker

定时任务要求：

- 分批抓取 active 产品。
- 不要一次性抓全部，避免规模扩大后超时。
- 单个产品失败不能影响其他产品。
- 记录失败日志。
- 支持冷却时间。
- 使用 `CRON_SECRET` 保护触发入口。

## 存储

MVP 阶段可以把规范化文本存在 Postgres。

原始 HTML 和截图可以：

- 本地/MVP 阶段存数据库或文件系统。
- 生产阶段用对象存储，如 S3/R2。
- 如果暂时不保存截图，也要保留 storage adapter 接口，方便以后扩展。

## 测试

至少为以下逻辑写测试：

- URL 校验
- 文本规范化
- 内容 hash
- 价格文本提取
- 套餐名提取
- diff 分类
- 变更事件生成
- 管理 Token 校验

测试必须使用 fixtures，不依赖实时网络。

增加至少一个集成式 fixture：

- 一个 fake pricing page 的旧版本 HTML
- 一个 fake pricing page 的新版本 HTML
- 测试是否能检测价格变化和套餐变化

## 验证命令

每轮工作结束前尽量运行：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

如果这些脚本不存在，先补齐。

如果某个命令失败，不要假装完成。修复后重新运行。

## README

README 必须包含：

- 产品介绍
- 本地启动
- 环境变量
- 数据库初始化
- seed 产品
- 手动抓取
- 定时抓取
- 部署到 Vercel 或 Cloudflare
- 已知限制
- Roadmap

环境变量至少包括：

```text
DATABASE_URL=
ADMIN_TOKEN=
CRON_SECRET=
```

可选：

```text
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

核心功能不能依赖 LLM Key。

## Git 和提交规则

每完成一轮实质性工作，必须提交一次 commit。

一轮实质性工作可以是：

- 完成项目脚手架。
- 完成数据库 schema。
- 完成 crawler。
- 完成 diff 逻辑。
- 完成首页。
- 完成产品页。
- 完成管理页。
- 完成测试。
- 完成部署文档。
- 修复一批构建或测试失败。

提交要求：

- commit message 必须使用中文。
- message 要具体，不要写“更新”或“修复”这种空泛描述。
- 示例：
  - `初始化价格记忆项目骨架`
  - `实现产品和快照数据库模型`
  - `加入价格页面抓取与文本规范化`
  - `实现价格变化检测和事件生成`
  - `完善首页和产品时间线界面`
  - `补充抓取逻辑测试和 fixtures`

不要在 commit message 里写任何密码、Token 或隐私信息。

## 自主执行路线

按下面顺序持续推进。除非遇到真正阻塞，不要询问下一步。

1. 检查仓库现状。
2. 初始化或修复项目脚手架。
3. 配置 TypeScript、Tailwind、lint、test、build。
4. 设计并实现数据库 schema。
5. 加入 seed 产品。
6. 实现 crawler 基础抓取。
7. 实现 HTML 清洗和文本规范化。
8. 实现 content hash。
9. 实现快照保存。
10. 实现价格和套餐启发式提取。
11. 实现快照 diff。
12. 实现 ChangeEvent 生成。
13. 实现手动抓取 API。
14. 实现受保护 admin 页面。
15. 实现首页。
16. 实现产品详情页。
17. 实现快照对比页。
18. 实现定时抓取入口。
19. 加入 fixtures 和测试。
20. 打磨前端视觉。
21. 做响应式 QA。
22. 写 README。
23. 运行完整验证。
24. 修复失败。
25. 再次验证。
26. 提交最终阶段 commit。

## 什么时候可以停

只有在以下情况可以停：

- 产品达到最终验收标准。
- 需要用户提供数据库、部署平台或密钥。
- 外部服务不可用，且无法通过 mock/fixture 继续推进。
- 遇到会破坏用户已有工作的冲突，需要用户决定。

不要因为“已经实现了主要部分”就停。要继续补齐测试、错误状态、文档、前端细节和构建验证。

## 完成报告

完成时，用中文汇报：

- 已完成什么。
- 如何本地运行。
- 如何配置环境变量。
- 如何 seed 和抓取。
- 如何部署。
- 哪些验证命令通过。
- 当前已知限制。
- 下一步最值得做什么。

