# Continued.md

## 当前进度

已读取根目录 `AGENTS.md`，并继续推进 **Public Pricing Memory**。

本轮在原有项目骨架、Prisma schema、seed 配置和核心纯函数测试基础上，新增并完成：

1. Crawler 编排：
   - `src/lib/crawler/run-crawl.ts`
   - 支持产品查询、抓取、HTML 规范化、content hash、套餐提取、快照保存、ChangeEvent 生成、CrawlJob 状态更新
   - 未变化时保存轻量快照，不重复生成事件
   - 页面不可访问时保存 failed snapshot 并生成 `page_unreachable`
2. HTTP fetcher：
   - `src/lib/crawler/fetcher.ts`
   - 支持 HTTP 状态、最终 URL、网络错误和超时
3. Prisma repository：
   - `src/lib/crawler/prisma-repository.ts`
   - 将 crawler 抽象接口接到 Prisma 模型
4. Snapshot compare：
   - `src/lib/compare/snapshot-compare.ts`
   - 生成规范化文本 diff 和结构化价格变化摘要
5. API routes：
   - `GET /api/products`
   - `POST /api/products`
   - `GET /api/products/[slug]`
   - `POST /api/crawl/[productId]`
   - `GET /api/changes`
   - `GET /api/snapshots/[snapshotId]`
   - `GET /api/compare?from=&to=`
   - `GET|POST /api/cron/crawl`
6. 定时任务：
   - `vercel.json`
   - 每 6 小时调用 `/api/cron/crawl?limit=3&cooldownHours=12`
7. 前端页面：
   - 首页 `/`
   - 产品详情页 `/products/[slug]`
   - 对比页 `/products/[slug]/compare`
   - 管理页 `/admin`
   - loading、not-found、error 状态
   - 数据库不可用时首页、产品页和 admin 页降级展示 seed 配置和清晰错误状态
8. 管理操作：
   - 首页和 admin 页面可提交产品
   - admin 页面可对单个产品触发抓取
   - 写操作使用 `ADMIN_TOKEN`
   - cron 入口使用 `CRON_SECRET`
9. 脚本和存储边界：
   - `scripts/crawl-active.ts`
   - `src/lib/storage/storage-adapter.ts`
10. README：
   - 已补本地运行、环境变量、数据库初始化、seed、手动抓取、cron、部署、限制和 Roadmap
11. Prisma 7 初始化：
   - 已安装并接入 `@prisma/adapter-pg`、`pg`、`@types/pg`
   - `prisma/seed.ts` 已加载 `dotenv/config`

## 当前验证结果

已确认通过：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

最近测试结果：

```text
Test Files  10 passed (10)
Tests       27 passed (27)
```

当前新增验证：

- Docker Desktop 已可用。
- 已成功拉取并启动 `postgres:16-alpine`。
- 本地 PostgreSQL 容器：
  - name: `public-pricing-memory-postgres`
  - database: `mydb`
  - user: `johndoe`
  - port: `localhost:5432`
- 已成功运行：

```bash
npm run db:push
npm run db:seed
```

- seed 结果：`Seeded 8 products.`
- 已修复 `scripts/crawl-active.ts`，现在会在导入 Prisma singleton 前加载 `dotenv/config`。
- 已新增回归测试：
  - `src/scripts/crawl-active-env.test.ts`
- 已成功运行真实抓取：
  - `npm run crawl:all -- --limit=1`
  - OpenAI 返回 HTTP 403，保存了 failed snapshot、CrawlJob 和 1 个 ChangeEvent。
  - 直接抓取 Anthropic 成功，保存了 succeeded snapshot、4 个 PricingPlan 和 1 个 ChangeEvent。
- 数据库当前计数：
  - Product: 8
  - Snapshot: 2
  - PricingPlan: 4
  - ChangeEvent: 2
  - CrawlJob: 2

浏览器 QA：

- Browser/IAB 工具不可用，已回退到项目本地 Playwright。
- dev server 运行在 `http://127.0.0.1:3001`。
- 已验证：
  - 首页桌面
  - 首页移动端
  - 产品页 `/products/openai`
  - admin 页 `/admin`
  - 首页搜索 `openai`
- 结果：
  - 无 console error
  - 无 console warning
  - 无 Next.js 错误 overlay
  - 搜索后 URL 为 `/?q=openai`
  - 搜索结果包含 OpenAI，不包含 Slack

## 当前重要注意事项

1. 本机 PostgreSQL 当前已可用：
   - Docker Hub 临时 EOF 已恢复，`postgres:16-alpine` 已拉取成功。
   - `db:push` 和 `db:seed` 已跑通。
2. 页面仍保留数据库不可用 fallback：
   - 首页、产品页、admin 页会展示 seed 配置和明确的数据库不可用提示。
   - 这只是开发体验兜底，不替代真实数据库。
3. 当前 dev server 可能仍在后台运行：
   - URL：`http://127.0.0.1:3001`
   - 日志：`logs/dev-server.log`
4. 当前 GitHub 远端已有 `master`：
   - 最新已推送 commit：`4be4532 实现价格记忆产品核心功能`
5. 工作区有一个未提交的 `AGENTS.md` 本地修改，包含敏感内容。
   - 不要提交或推送该文件。
   - 后续提交应显式 stage 目标文件，避免 `git add .`。

## 还没完全覆盖的事项

1. 还没有对象存储实现：
   - 目前仍以数据库字段保存原始 HTML。
2. 还没有 Playwright 动态页面抓取 fallback：
   - 当前 fetcher 使用 HTTP fetch。
3. 还没有保存截图：
   - schema 保留了 `screenshotStorageKey`。
4. 还没有为 API route 写独立 route handler 测试。
5. 真实页面启发式提取仍需打磨：
   - Anthropic 可以成功提取套餐，但部分价格/免费层归类仍偏粗糙。

## 下一步建议

1. 再次验证：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

2. 显式 stage 安全文件并提交：

```bash
git add Continued.md scripts/crawl-active.ts src/scripts/crawl-active-env.test.ts
git commit -m "修复抓取脚本环境加载"
```

3. 后续优先事项：
   - 打磨真实 pricing page 套餐/价格提取准确性。
   - 增加 API route 测试。
   - 增加 Playwright 动态页面抓取 fallback。
