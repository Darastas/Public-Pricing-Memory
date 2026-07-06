# Public Pricing Memory 中文说明

Public Pricing Memory 是一个公开的价格记忆系统，用来长期追踪 SaaS、API、AI 工具和开发者产品的价格页面变化。它会保存历史快照，提取套餐、价格、免费额度、功能门槛和使用限制，并把变化沉淀成可搜索、可对比、可公开浏览的时间线。

这个项目的重点不是一次性“总结网页”，而是建立长期价格记忆：

- 定期抓取公开价格页。
- 保存规范化文本和原始 HTML。
- 提取套餐、价格、免费层和限制信息。
- 对比新旧快照并生成结构化变更事件。
- 在公开前端中搜索产品、查看历史、比较快照。
- 为后续截图存储、对象存储、订阅和 feed 留出扩展边界。

## 功能概览

- 首页 `/`：产品搜索、近期变化、追踪产品列表、抓取状态和提交新产品入口。
- 产品页 `/products/[slug]`：产品信息、当前套餐、历史快照、变化时间线和对比入口。
- 对比页 `/products/[slug]/compare?from=&to=`：规范化文本 diff、价格变化和套餐变化摘要。
- 管理页 `/admin`：新增产品、手动抓取、查看抓取日志、重新提取某个快照。
- API：产品、变化、快照、对比、手动抓取和 cron 抓取接口。
- Crawler：支持 HTTP 抓取、超时、错误记录、HTML 清洗、content hash、Playwright 动态渲染 fallback。
- 测试：覆盖 URL 校验、HTML 规范化、价格提取、diff、变更事件、鉴权、crawler、route handler 等关键逻辑。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- PostgreSQL
- Prisma 7 + `@prisma/adapter-pg`
- Cheerio
- Playwright
- Vitest

## 本地快速启动

安装依赖：

```bash
npm install
```

复制环境变量模板：

```bash
cp .env.example .env
```

准备 PostgreSQL，并在 `.env` 中配置 `DATABASE_URL`。示例：

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/public_pricing_memory?schema=public&connect_timeout=5"
ADMIN_TOKEN="replace-with-a-local-secret"
CRON_SECRET="replace-with-a-cron-secret"
```

推送数据库 schema：

```bash
npm run db:push
```

写入初始产品：

```bash
npm run db:seed
```

启动开发服务器：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

如果端口被占用，可以指定端口：

```bash
npm run dev -- --hostname 127.0.0.1 --port 3001
```

## 环境变量

必需变量：

```text
DATABASE_URL=
ADMIN_TOKEN=
CRON_SECRET=
```

可选变量：

```text
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=
```

`.env` 配置示例：

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/public_pricing_memory?schema=public&connect_timeout=5"
ADMIN_TOKEN="replace-with-a-local-admin-token"
CRON_SECRET="replace-with-a-cron-secret"

# Optional. Core functionality does not depend on LLM keys.
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
STORAGE_BUCKET=""
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""

# Optional. Use this only when the default Playwright browser cache is unavailable.
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=""
```

说明：

- 核心抓取、提取、diff 和变更事件生成不依赖 LLM key。
- `ADMIN_TOKEN` 用于保护新增产品、手动抓取和重新提取等管理操作。
- `CRON_SECRET` 用于保护定时抓取入口。
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 只在默认 Playwright 浏览器不可用、但系统已安装 Chromium、Edge 或 Chrome 时需要。
- 对象存储相关变量目前是预留项，MVP 默认仍可把原始 HTML 保存在数据库字段中。

## 数据库

项目使用 PostgreSQL + Prisma。主要模型包括：

- `Product`：被追踪的产品和价格页 URL。
- `Snapshot`：一次抓取生成的页面快照、HTTP 状态、hash、规范化文本和错误信息。
- `PricingPlan`：从快照中提取出的套餐、价格、计费周期、功能和限制。
- `ChangeEvent`：从新旧快照中检测到的价格、套餐、免费层、限制或文案变化。
- `CrawlJob`：一次抓取任务的状态、日志和失败原因。

常用命令：

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## Seed 产品

初始产品配置在 `src/config/seed-products.ts`，当前包含：

- OpenAI
- Anthropic
- GitHub
- Vercel
- Supabase
- Cursor
- Notion
- Slack

这些 URL 是配置化数据，不写死在 UI 里。

## 抓取流程

手动触发单个产品抓取：

```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/crawl/<productId>
```

批量抓取 active 产品：

```bash
npm run crawl:all -- --limit=3
```

抓取器流程：

1. 查询产品和上一版快照。
2. 使用 HTTP fetch 抓取价格页。
3. 记录 HTTP 状态、最终 URL、超时和错误信息。
4. 用 Cheerio 清理 HTML，提取可见文本并生成规范化文本。
5. 生成稳定 `contentHash`。
6. 提取套餐、价格、免费层、功能和限制。
7. 与上一版快照比较并生成 `ChangeEvent`。
8. 保存 `Snapshot`、`PricingPlan`、`ChangeEvent` 和 `CrawlJob`。

当 HTTP 返回成功但静态 HTML 没有有效文本，或页面明确要求 JavaScript 时，抓取器会尝试 Playwright 渲染 fallback。fallback 失败时不会丢弃原始 fetch 结果，而是记录错误信息。

## API

主要接口：

- `GET /api/products?q=&status=active|paused|failed`
- `POST /api/products`
- `GET /api/products/[slug]`
- `POST /api/crawl/[productId]`
- `GET /api/changes`
- `GET /api/snapshots/[snapshotId]`
- `POST /api/snapshots/[snapshotId]/reextract`
- `GET /api/compare?from=&to=`
- `GET|POST /api/cron/crawl`

写操作使用 `ADMIN_TOKEN` 或 `CRON_SECRET` 保护。生产环境没有配置 Token 时，不应开放危险管理操作。

## 定时抓取

项目包含 Vercel Cron 配置：

```json
{
  "crons": [
    {
      "path": "/api/cron/crawl?limit=3&cooldownHours=12",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

部署后需要配置 `CRON_SECRET`。Cron 入口会分批抓取 active 产品，支持冷却时间，单个产品失败不会阻断其他产品。响应会包含：

- `processed`
- `skippedDueToCooldown`
- `cooldownHours`
- `results`

## 重新提取快照

如果改进了套餐或价格提取逻辑，可以在 `/admin` 对最近快照执行重新提取。对应接口：

```text
POST /api/snapshots/[snapshotId]/reextract
```

重新提取会替换目标快照的 `PricingPlan`，更新提取状态，并重建该快照对应的 `ChangeEvent`。

## 部署

部署到 Vercel 或类似平台时：

1. 创建 PostgreSQL 数据库。
2. 配置环境变量：
   - `DATABASE_URL`
   - `ADMIN_TOKEN`
   - `CRON_SECRET`
3. 初始化数据库：

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. 部署 Next.js 应用。
5. 确认 `/api/cron/crawl` 可以被平台 cron 调用。

## 验证命令

每次提交前建议运行：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

测试不依赖实时网络，关键逻辑使用 fixtures 或 mock。

## 已知限制

- MVP 阶段原始 HTML 仍可存在数据库字段中；对象存储 adapter 已预留，但还没有接入 S3/R2。
- 当前没有保存截图，只保留了 `screenshotStorageKey` 字段。
- 价格提取是确定性启发式，适合作为第一版，但需要更多真实 pricing page fixtures 打磨准确率。
- Playwright fallback 可以处理一部分动态价格页，但不处理登录、强反爬或 CAPTCHA 页面。
- 当前没有队列系统；cron 和手动 API 会同步执行抓取。
- 结构化套餐重命名检测仍可继续增强。

## Roadmap

- 增加更多真实页面 fixtures，提升价格和套餐提取准确性。
- 接入对象存储保存原始 HTML 和截图。
- 增加队列、重试和失败告警。
- 增加 RSS/JSON feed 和产品订阅。
- 增加更细的套餐重命名、免费额度变化和功能门槛变化检测。
- 增加公开数据导出和历史趋势视图。
