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
   - 静态 HTML 无可提取文本或明确要求 JavaScript 时，会尝试 Playwright 渲染 fallback
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
   - `POST /api/snapshots/[snapshotId]/reextract`
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
   - admin 页面可对最近快照重新运行提取逻辑
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
12. 快照重新提取：
   - `src/lib/extract/reextract-snapshot.ts`
   - `src/lib/extract/prisma-reextract-repository.ts`
   - 重新提取会替换目标快照的 PricingPlan，更新 extraction 状态，并重建该快照对应的 ChangeEvent
   - 新增受保护 API：`POST /api/snapshots/[snapshotId]/reextract`
   - admin 页会列出最近快照并提供 Re-extract 操作
13. Playwright 动态页面抓取 fallback：
   - `src/lib/crawler/playwright-renderer.ts`
   - `src/lib/crawler/fetcher.ts`
   - HTTP 成功但静态 HTML 没有有效文本，或页面提示需要 JavaScript 时，抓取器会尝试 Playwright 渲染
   - fallback 失败时保留原始 HTTP fetch 结果，并把失败原因写入 `errorMessage`
   - 可选环境变量：`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
14. Cron route 测试和可观测性：
   - `src/app/api/cron/crawl/route.test.ts`
   - 覆盖 `CRON_SECRET` 拒绝未授权请求
   - 覆盖冷却时间跳过、单个产品抓取失败不阻断后续产品
   - `/api/cron/crawl` 响应新增 `skippedDueToCooldown`

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
Test Files  15 passed (15)
Tests       37 passed (37)
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

- Browser/IAB 工具当前返回 `Browser is not available: iab`，已回退到项目本地 Playwright，并使用系统 Edge 可执行文件运行。
- dev server 运行在 `http://127.0.0.1:3001`。
- 已验证：
  - 首页桌面
  - 首页移动端
  - 产品页 `/products/openai`
  - admin 页 `/admin`
  - 首页搜索 `openai`
  - admin 页 Recent snapshots 区域
  - admin 页 Re-extract 按钮交互
- 结果：
  - 无 console error
  - 无 console warning
  - 无 Next.js 错误 overlay
  - 搜索后 URL 为 `/?q=openai`
  - 搜索结果包含 OpenAI，不包含 Slack
  - `/admin` 显示 2 个 Re-extract 按钮
  - 本地开发环境未配置 `ADMIN_TOKEN` 时，Re-extract 按现有 dev 规则成功返回 `Re-extracted`

本轮完整验证已通过：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

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
   - 查看最新提交请以 `git log --oneline -1` 和 `git rev-parse origin/master` 为准。
5. 工作区有一个未提交的 `AGENTS.md` 本地修改，包含敏感内容。
   - 不要提交或推送该文件。
   - 后续提交应显式 stage 目标文件，避免 `git add .`。

## 还没完全覆盖的事项

1. 还没有对象存储实现：
   - 目前仍以数据库字段保存原始 HTML。
2. 还没有保存截图：
   - schema 保留了 `screenshotStorageKey`。
3. 真实页面启发式提取仍需打磨：
   - Anthropic 可以成功提取套餐，但部分价格/免费层归类仍偏粗糙。
4. 还没有覆盖所有 API route 的独立 route handler 测试。
5. Playwright fallback 不处理登录、CAPTCHA 或强反爬页面。

## 下一步建议

1. 再次验证：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

2. 后续优先事项：
   - 打磨真实 pricing page 套餐/价格提取准确性。
   - 增加更多 API route 测试。
   - 增加截图保存或对象存储落地。
