# Public Pricing Memory

Public Pricing Memory 是一个公开价格记忆站：持续追踪 SaaS、API、AI 工具和开发者产品的价格页，保存历史快照，提取套餐和价格文本，并生成可公开浏览的变化时间线。

核心目标不是一次性总结网页，而是长期积累：

- 定期抓取价格页
- 保存规范化文本和原始 HTML
- 提取套餐、价格、免费层和限制
- 比较新旧快照
- 生成结构化变更事件
- 在公开页面搜索、查看详情和对比快照

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- PostgreSQL
- Prisma 7 + `@prisma/adapter-pg`
- Cheerio
- Playwright
- Vitest

## 本地启动

安装依赖：

```bash
npm install
```

配置环境变量：

```bash
cp .env.example .env
```

启动开发服务器：

```bash
npm run dev
```

默认地址：

```text
http://localhost:3000
```

如果端口被占用，可以指定端口：

```bash
npm run dev -- --hostname 127.0.0.1 --port 3001
```

## 环境变量

必需：

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

核心抓取、提取、diff 和事件生成不依赖 LLM key。

## 数据库初始化

需要 PostgreSQL。示例连接串：

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/public_pricing_memory?schema=public&connect_timeout=5"
```

推送 schema：

```bash
npm run db:push
```

生成 Prisma client：

```bash
npm run db:generate
```

## Seed 产品

初始产品配置在 `src/config/seed-products.ts`，包含：

- OpenAI
- Anthropic
- GitHub
- Vercel
- Supabase
- Cursor
- Notion
- Slack

写入数据库：

```bash
npm run db:seed
```

## 手动抓取

在 `/admin` 页面输入 `ADMIN_TOKEN`，可以对单个产品触发抓取，也可以对最近快照重新运行套餐/价格提取逻辑。

也可以直接调用 API：

```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/crawl/<productId>
```

批量抓取 active 产品：

```bash
npm run crawl:all -- --limit=3
```

## API

已实现的主要接口：

- `GET /api/products`
- `POST /api/products`
- `GET /api/products/[slug]`
- `POST /api/crawl/[productId]`
- `GET /api/changes`
- `GET /api/snapshots/[snapshotId]`
- `POST /api/snapshots/[snapshotId]/reextract`
- `GET /api/compare?from=&to=`
- `GET|POST /api/cron/crawl`

写操作使用 `ADMIN_TOKEN` 或 `CRON_SECRET` 保护。生产环境没有配置 Token 时，不会开放危险写操作。

## 定时抓取

项目包含 `vercel.json`：

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

部署到 Vercel 后，配置 `CRON_SECRET`。Cron 请求会调用 `/api/cron/crawl`，分批抓取 active 产品，并为单个产品失败保留错误日志。

## 前端页面

- `/`：搜索、近期变化、追踪产品、抓取状态、提交 URL
- `/products/[slug]`：产品详情、当前套餐、变化时间线、历史快照、规范化文本入口
- `/products/[slug]/compare?from=&to=`：文本 diff 和结构化价格变化
- `/admin`：新增产品、手动抓取、快照重新提取、抓取日志和失败原因

数据库不可用时，首页、产品页和 admin 页会展示 seed 配置和明确的数据库不可用状态，避免空白页。

## 部署

1. 创建 PostgreSQL 数据库。
2. 在部署平台配置：
   - `DATABASE_URL`
   - `ADMIN_TOKEN`
   - `CRON_SECRET`
3. 执行 schema 初始化：
   ```bash
   npm run db:push
   npm run db:seed
   ```
4. 部署 Next.js 应用。
5. 确认 `/api/cron/crawl` 可由平台 cron 调用。

## 验证命令

每轮提交前运行：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 已知限制

- MVP 将原始 HTML 存在数据库字段中；对象存储 adapter 已预留，但还未接 S3/R2。
- 价格提取是确定性启发式，适合第一版，但还需要更多真实页面 fixture 扩展。
- 动态渲染或反爬强的价格页可能需要后续接 Playwright 页面抓取。
- 当前没有队列系统；cron 和手动 API 会同步执行抓取。
- 没有实现截图保存，只保留了 `screenshotStorageKey` 字段。

## Roadmap

- 增加更多真实 pricing page fixtures。
- 加入 Playwright fallback 抓取动态价格页。
- 接入对象存储保存原始 HTML 和截图。
- 增加队列和重试策略。
- 为 ChangeEvent 增加更细的套餐重命名检测。
- 增加 RSS/JSON feed 和产品订阅。
