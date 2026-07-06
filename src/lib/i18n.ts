export type Locale = "en" | "zh";

export type SearchParamValue = string | string[] | undefined;

export type SearchParamsLike = Record<string, SearchParamValue>;

export const dictionary = {
  en: {
    admin: "Admin",
    allCategories: "All categories",
    allRegions: "All regions",
    category: "Category",
    changes: "Changes",
    compareLatest: "Compare latest",
    crawlStatus: "Recent crawl status",
    currentPlans: "Current plans",
    databaseUnavailable: "Database unavailable",
    databaseUnavailableProduct:
      "Database unavailable: showing seed product metadata without snapshots.",
    deterministicCrawler: "deterministic crawler",
    detected: "detected",
    developerSubscriptions: "Developer subscriptions",
    extraction: "Extraction",
    fetched: "Fetched",
    global: "Global",
    hash: "Hash",
    historicalSnapshots: "Historical snapshots",
    historicalSnapshotsDetail:
      "Each row keeps normalized text, extracted plans, and raw HTML when stored.",
    historicalSnapshotsShort: "historical snapshots",
    httpStatus: "HTTP status",
    language: "Language",
    latestCrawl: "Latest crawl",
    latestRuns: "last runs",
    message: "Message",
    noCatalogMatches: "No catalog matches",
    noChangesYet: "No changes yet",
    noChangeEvents: "No change events",
    noCrawlJobs: "No crawl jobs",
    noErrorRecorded: "No error recorded",
    noMatchingProducts: "No matching products",
    noNormalizedText: "No normalized text available.",
    noPlansExtracted: "No plans extracted",
    noProductsYet: "No products yet",
    normalizedTextPreview: "Normalized text preview",
    officialPricingReferences: "Official pricing references",
    officialPricingFallback: "Official source fallback",
    officialPricingFallbackDetail:
      "Crawler extraction did not find plans in the latest snapshot, so these rows come from the curated official catalog.",
    open: "Open",
    paidOrCustomTier: "Paid or custom tier",
    price: "Price",
    pricingDirectory: "Pricing directory",
    pricingDirectoryDetail:
      "Official source references for major AI APIs, AI subscriptions, and platform memberships.",
    product: "Product",
    products: "Products",
    published: "Published",
    region: "Region",
    rawSnapshotJson: "Raw snapshot JSON",
    rawText: "Raw text",
    search: "Search",
    searchCatalog: "Search catalog",
    searchPlaceholder: "Search products, categories, or slugs",
    seedProductsInstruction: "Seed the initial products or submit a new pricing URL.",
    source: "Source",
    status: "Status",
    started: "Started",
    submittedUrl: "Submit a pricing URL",
    submittedUrlDetail:
      "Add a product to the archive and trigger crawls from the admin surface.",
    trackedProducts: "Tracked products",
    trackedProductsDetail:
      "Current plan extraction, latest snapshot state, and change count.",
    recentEvents: "Recent events",
    recentPriceMemory: "Recent price memory",
    recentCrawlFailures: "Recent crawl failures",
    changeTimeline: "Change timeline",
    compareNewestPair: "Compare newest pair",
    firstCrawlBaseline: "The first crawl will create a baseline event.",
    freeTierDetected: "Free tier detected",
    runCrawlInstruction: "Manual and scheduled crawls will be listed here.",
    heroTitle: "Searchable memory for public pricing pages.",
    heroDetail:
      "Track SaaS, API, AI tool, and developer product price pages with reproducible snapshots, extracted plans, and visible change events.",
    databaseUnavailableSeed:
      "Database unavailable: showing configured seed products only.",
    currentPlanExtraction: "Current plan extraction",
    latestSnapshot: "Latest snapshot",
    neverCrawled: "Never crawled",
    officialSourceStatus: "Official source status",
    verifiedCatalog: "curated official catalog",
    aiApi: "AI API",
    aiSubscriptions: "AI subscriptions",
    consumerSubscriptions: "Consumer subscriptions",
    needsReview: "Needs review",
    notPublished: "Not published"
  },
  zh: {
    admin: "管理",
    allCategories: "全部类别",
    allRegions: "全部地区",
    category: "类别",
    changes: "变化",
    compareLatest: "对比最新",
    crawlStatus: "近期抓取状态",
    currentPlans: "当前套餐",
    databaseUnavailable: "数据库不可用",
    databaseUnavailableProduct: "数据库不可用：当前只显示 seed 产品元数据，没有快照。",
    deterministicCrawler: "确定性抓取器",
    detected: "已检测",
    developerSubscriptions: "开发者订阅",
    extraction: "提取状态",
    fetched: "抓取时间",
    global: "全球",
    hash: "Hash",
    historicalSnapshots: "历史快照",
    historicalSnapshotsDetail: "每一行保留规范化文本、提取套餐，以及已存储的原始 HTML。",
    historicalSnapshotsShort: "历史快照",
    httpStatus: "HTTP 状态",
    language: "语言",
    latestCrawl: "最近抓取",
    latestRuns: "最近运行",
    message: "消息",
    noCatalogMatches: "没有匹配的目录项",
    noChangesYet: "暂无变化",
    noChangeEvents: "暂无变化事件",
    noCrawlJobs: "暂无抓取任务",
    noErrorRecorded: "没有错误记录",
    noMatchingProducts: "没有匹配产品",
    noNormalizedText: "暂无规范化文本。",
    noPlansExtracted: "暂无提取套餐",
    noProductsYet: "暂无产品",
    normalizedTextPreview: "规范化文本预览",
    officialPricingReferences: "官方价格参考",
    officialPricingFallback: "官方来源兜底",
    officialPricingFallbackDetail: "最新快照没有提取到套餐，因此这里展示人工复核的官方目录价格。",
    open: "打开",
    paidOrCustomTier: "付费或自定义套餐",
    price: "价格",
    pricingDirectory: "价格目录",
    pricingDirectoryDetail: "主要 AI API、AI 订阅和平台会员的官方来源价格参考。",
    product: "产品",
    products: "产品",
    published: "已发布",
    region: "地区",
    rawSnapshotJson: "原始快照 JSON",
    rawText: "原始文本",
    search: "搜索",
    searchCatalog: "搜索目录",
    searchPlaceholder: "搜索产品、类别或 slug",
    seedProductsInstruction: "写入初始产品或提交新的价格 URL。",
    source: "来源",
    status: "状态",
    started: "开始时间",
    submittedUrl: "提交价格 URL",
    submittedUrlDetail: "把产品加入档案库，并在管理界面触发抓取。",
    trackedProducts: "追踪产品",
    trackedProductsDetail: "当前套餐提取、最新快照状态和变化数量。",
    recentEvents: "近期事件",
    recentPriceMemory: "近期价格记忆",
    recentCrawlFailures: "近期抓取失败",
    changeTimeline: "变化时间线",
    compareNewestPair: "对比最新一组",
    firstCrawlBaseline: "第一次抓取会创建基线事件。",
    freeTierDetected: "检测到免费层",
    runCrawlInstruction: "手动和定时抓取任务会显示在这里。",
    heroTitle: "可搜索的公开价格页面记忆。",
    heroDetail: "追踪 SaaS、API、AI 工具和开发者产品价格页，保留可复现快照、提取套餐并展示变化事件。",
    databaseUnavailableSeed: "数据库不可用：当前只显示配置中的 seed 产品。",
    currentPlanExtraction: "当前套餐提取",
    latestSnapshot: "最新快照",
    neverCrawled: "尚未抓取",
    officialSourceStatus: "官方来源状态",
    verifiedCatalog: "人工维护官方目录",
    aiApi: "AI API",
    aiSubscriptions: "AI 订阅",
    consumerSubscriptions: "消费订阅",
    needsReview: "需复核",
    notPublished: "未公开"
  }
} as const;

export type Dictionary = typeof dictionary.en;

export function getLocale(searchParams: SearchParamsLike): Locale {
  const raw = searchParams.lang;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "zh" ? "zh" : "en";
}

export function withLocaleHref(href: string, locale: Locale): string {
  const [pathnameWithQuery, hash] = href.split("#", 2);
  const [pathname, query = ""] = pathnameWithQuery.split("?", 2);
  const params = new URLSearchParams(query);
  params.set("lang", locale);
  const search = params.toString();
  const nextHref = `${pathname}${search ? `?${search}` : ""}`;

  return hash ? `${nextHref}#${hash}` : nextHref;
}
