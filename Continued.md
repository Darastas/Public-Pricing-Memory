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

1. 本机 PostgreSQL 当前不可用：
   - `npm run db:push` 曾因 `localhost:5432` 连接失败报 P1001。
   - Docker Desktop 可以启动，但拉取 `postgres:16-alpine` 连续遇到 Docker Hub EOF。
   - 因此本轮没有实际跑通 `db:push` 和 `db:seed`。
2. 页面已做数据库不可用 fallback：
   - 首页、产品页、admin 页会展示 seed 配置和明确的数据库不可用提示。
   - 这只是开发体验兜底，不替代真实数据库。
3. 当前 dev server 可能仍在后台运行：
   - URL：`http://127.0.0.1:3001`
   - 日志：`logs/dev-server.log`
4. 尚未提交 commit。

## 还没完全覆盖的事项

1. 未在真实 PostgreSQL 上执行：
   - `npm run db:push`
   - `npm run db:seed`
   - 实际抓取 seed 产品
2. 还没有对象存储实现：
   - 目前仍以数据库字段保存原始 HTML。
3. 还没有 Playwright 动态页面抓取 fallback：
   - 当前 fetcher 使用 HTTP fetch。
4. 还没有保存截图：
   - schema 保留了 `screenshotStorageKey`。
5. 还没有为 API route 写独立 route handler 测试。

## 下一步建议

1. 准备可用 PostgreSQL。
2. 运行：

```bash
npm run db:push
npm run db:seed
```

3. 触发一次抓取：

```bash
npm run crawl:all -- --limit=1
```

4. 再次验证：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

5. 用中文 commit message 提交当前阶段成果。
