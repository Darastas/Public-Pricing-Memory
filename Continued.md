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
15. Products route 测试和过滤：
   - `src/app/api/products/route.test.ts`
   - `GET /api/products` 支持 `q` 和 `status=active|paused|failed` 组合过滤
   - 不支持的 status 会返回 400
16. Compare route 测试和边界保护：
   - `src/app/api/compare/route.test.ts`
   - 覆盖缺少 `from`/`to` 参数、缺失快照、跨产品快照拒绝和成功对比响应
   - `GET /api/compare` 现在会拒绝 `from` 与 `to` 相同的无意义自比较
17. 中文 README：
   - 新增 `README.zh-CN.md`
   - 原 `README.md` 顶部增加中文版入口
   - 中文版覆盖产品定位、功能、环境变量、数据库、seed、抓取、API、cron、部署、验证、限制和 Roadmap
18. README 环境变量示例：
   - `README.md` 和 `README.zh-CN.md` 的环境变量章节新增可复制 `.env` 示例
   - 示例只使用本地连接串和占位 Token，不包含真实密钥

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
Test Files  17 passed (17)
Tests       44 passed (44)
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

## 2026-07-06 价格目录双语改版进展

已在隔离 worktree `D:\Public Pricing Memory\.worktrees\pricing-catalog-i18n` 的
`pricing-catalog-i18n` 分支继续执行方案 B。

本阶段完成：

- `src/config/pricing-catalog.ts` 支持一个产品维护多条官方价格行。
- OpenAI API、Spotify、YouTube Premium、Netflix、Disney+、Apple One、Amazon Prime、
  Notion、GitHub、Cursor、ChatGPT、Claude 已补充首批多套餐/多价格行。
- 仍无法稳定从官方页面直接确认的厂商继续使用 `needs_review`，不写入推断价格或换算价格。
- `src/config/pricing-catalog.test.ts` 新增多价格行覆盖，防止产品只保留一个代表价格。

来源策略：

- 只使用官方 pricing、API billing、help center 或产品订阅页作为 catalog source URL。
- 没有使用第三方价格聚合站或自行汇率换算。
- 每条 price row 仍带 `sourceUrl`、`sourceLabel`、`lastCheckedAt`、`confidence` 和 `status`。

本阶段验证：

```bash
npm run test -- src/config/pricing-catalog.test.ts
```

结果：6 个 catalog 测试全部通过。

## 2026-07-06 价格目录双语改版完成验证

本阶段完成：

- 首页加入官方价格目录，可按类别、地区和关键词筛选。
- 顶部加入 `EN` / `中文` 语言切换器，页面通过 `?lang=en|zh` 切换主要界面文案。
- 产品页加入“官方价格参考”区块，与 crawler 提取的“当前套餐”分开展示。
- `src/config/seed-products.ts` 从官方价格目录自动补齐默认追踪产品。
- 修复移动端和表格布局中的页面级横向溢出，表格只在自己的 `.table-wrap` 内横向滚动。
- README 和 README.zh-CN 说明了两类价格数据源、环境变量示例和扩展后的默认产品覆盖。

Rendered QA：

- Browser/IAB 状态：不可用，返回 `Browser is not available: iab`。
- 回退方案：使用项目本地 Playwright，通过 Microsoft Edge 渲染检查。
- Dev server：`http://127.0.0.1:3003`，使用 `DATABASE_URL`、`ADMIN_TOKEN`、`CRON_SECRET` 本地示例环境变量启动。
- 截图目录：`C:\Users\14737\AppData\Local\Temp\ppm-qa-1783343707294`
- 已验证页面：
  - `/` 桌面：价格目录、语言切换、官方目录状态可见。
  - `/?lang=zh` 桌面：中文价格目录、追踪产品、人工维护官方目录可见。
  - `/?kind=ai_api&region=CN&lang=zh`：筛选后显示 DeepSeek、智谱 GLM 等中国/全球 AI API 条目。
  - `/products/openai?lang=zh`：官方价格参考与当前套餐分开展示，OpenAI API 价格行可见。
  - `/?lang=zh` 移动端 390x900：无 Next overlay、无 console error、无页面级横向溢出。

最终验证：

```bash
git diff --check
npm run lint
npm run typecheck
npm run test
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/public_pricing_memory?schema=public&connect_timeout=2'; $env:ADMIN_TOKEN='local-dev-token'; $env:CRON_SECRET='local-cron-secret'; npm run build
```

结果：

- `git diff --check`：通过，仅有 Windows 行尾提示。
- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm run test`：重跑后通过，21 个测试文件、60 个测试。
- `npm run build`：配置必需环境变量后通过。

注意：

- `npm run build` 在未配置 `DATABASE_URL` 时会失败，因为 Prisma Client 初始化需要这个必需变量；README 已给出 `.env` 示例。
- 在 worktree 内构建时，Next 会提示主仓库和 worktree 各有一个 `package-lock.json`，因此有 root 推断 warning；构建本身通过。
- `package-lock.json` 仍有 npm 安装产生的未提交噪声，本轮未 stage。
