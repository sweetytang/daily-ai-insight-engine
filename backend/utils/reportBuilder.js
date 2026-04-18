import {
  SOURCE_TYPE_LABELS,
  THEME_LABELS
} from "../../common/constants/analysis.js";
import {
  DEFAULT_REPORT_SOLUTION,
  getReportSolutionLabel,
  isLlmSolution,
  normalizeReportSolution
} from "../../common/constants/solution.js";
import { groupCount, sumBy, uniqueItems } from "../../common/utils/report.js";
import { extractionPrompt, reportPrompt } from "../models/promptTemplates.js";

function buildChartData(counter, labels, scoreMap = {}) {
  return Object.entries(counter)
    .map(([key, value]) => ({
      label: labels[key] ?? key,
      value,
      tone: scoreMap[key] >= 90 ? "warning" : scoreMap[key] >= 70 ? "positive" : "neutral"
    }))
    .sort((left, right) => right.value - left.value);
}

function buildEntityDistribution(structuredItems) {
  const entityScores = structuredItems.reduce((accumulator, item) => {
    item.companies.forEach((company) => {
      accumulator[company] = (accumulator[company] ?? 0) + item.impactScore;
    });
    return accumulator;
  }, {});

  return Object.entries(entityScores)
    .map(([label, value]) => ({ label, value, tone: value >= 160 ? "warning" : "positive" }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);
}

function buildHotTopics(structuredItems) {
  return structuredItems.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    reason: `${item.sourceName} 的 ${SOURCE_TYPE_LABELS[item.sourceType]}样本，影响分 ${item.impactScore}，主题聚焦 ${THEME_LABELS[item.primaryTheme] ?? item.primaryTheme}。`,
    impactScore: item.impactScore,
    sourceName: item.sourceName,
    publishedAt: item.publishedAt,
    primaryTheme: THEME_LABELS[item.primaryTheme] ?? item.primaryTheme,
    sentimentLabel: item.sentimentLabel,
    companies: item.companies
  }));
}

function buildDeepDives(structuredItems) {
  return structuredItems.slice(0, 3).map((item) => ({
    title: item.title,
    background: item.structuredSummary,
    impact: item.impactAnalysis,
    recommendation: item.opportunityTags[0]
      ? `建议重点跟踪：${item.opportunityTags[0]}。`
      : "建议继续跟踪后续披露，确认商业化兑现节奏。"
  }));
}

function buildTrendSignals(themeCount, themeScoreMap) {
  const signals = [];

  if ((themeCount.infrastructure ?? 0) + (themeCount.capital ?? 0) >= 4) {
    signals.push({
      title: "算力与资本继续向头部集中",
      detail: "OpenAI 与 Anthropic 的融资和算力承诺同时升温，说明行业竞争门槛正快速抬高。",
      level: "high"
    });
  }

  if ((themeCount.model ?? 0) + (themeCount.multimodal ?? 0) + (themeCount.open_source ?? 0) >= 4) {
    signals.push({
      title: "模型竞争从文本转向多模态与部署效率",
      detail: "GPT-5.4、Gemma 4、Gemini Flash Audio/Flash-Lite 指向同一个方向：能力、成本和交互模态需要同时优化。",
      level: "medium"
    });
  }

  if ((themeCount.enterprise ?? 0) >= 1) {
    signals.push({
      title: "企业级 Agent 正向行业工作流深入",
      detail: "Anthropic 与 Infosys 的合作说明受监管行业已开始要求可治理、可交付的行业级 AI 方案。",
      level: "medium"
    });
  }

  if ((themeCount.safety ?? 0) >= 1) {
    signals.push({
      title: "安全治理从配角变成主线投资",
      detail: "OpenAI Safety Fellowship 与 Anthropic Institute 都在扩展外部研究网络，安全投入正在制度化。",
      level: "medium"
    });
  }

  if ((themeScoreMap.world_model ?? 0) + (themeScoreMap.content_ai ?? 0) >= 120) {
    signals.push({
      title: "中国市场把增量资金投向世界模型与视频生成",
      detail: "生数科技、爱诗科技等融资说明国内更关注可见场景和商业化路径清晰的多模态赛道。",
      level: "medium"
    });
  }

  return signals.slice(0, 4);
}

function buildRiskAlerts(structuredItems, themeCount) {
  const alerts = [];

  if ((themeCount.infrastructure ?? 0) >= 1) {
    alerts.push({
      title: "基础设施集中度上升",
      detail: "多吉瓦级算力协议意味着头部公司对供应链和资本的占用会继续扩大，中小团队的进入门槛同步变高。",
      level: "high"
    });
  }

  if ((themeCount.capital ?? 0) >= 3) {
    alerts.push({
      title: "高估值需要更快兑现收入",
      detail: "超大规模融资提升了行业预期，一旦产品增速或企业付费不达预期，情绪波动会更剧烈。",
      level: "high"
    });
  }

  if (structuredItems.some((item) => item.sentimentLabel === "watch")) {
    alerts.push({
      title: "资本情绪开始分化",
      detail: "媒体报道已出现对 OpenAI 和 Anthropic 相对估值的重新比较，说明舆情不再只看技术领先，还开始看回报与兑现。",
      level: "medium"
    });
  }

  if (structuredItems.some((item) => item.eventType === "ecosystem")) {
    alerts.push({
      title: "模型退役会带来迁移成本",
      detail: "旧模型退役说明平台治理节奏加快，依赖特定模型风格的用户和企业需要更主动地做兼容适配。",
      level: "medium"
    });
  }

  return alerts.slice(0, 4);
}

function buildOpportunityAlerts(themeCount) {
  const alerts = [];

  if ((themeCount.enterprise ?? 0) >= 1) {
    alerts.push({
      title: "行业 Agent 集成商有明确窗口",
      detail: "电信、金融、制造等场景正在需要既懂模型又懂交付的解决方案商。",
      level: "high"
    });
  }

  if ((themeCount.multimodal ?? 0) + (themeCount.content_ai ?? 0) >= 3) {
    alerts.push({
      title: "实时语音、视频与互动内容是新增量",
      detail: "Gemini Flash Audio、PixVerse 等事件共同说明音视频交互将成为下一轮产品差异化重点。",
      level: "high"
    });
  }

  if ((themeCount.open_source ?? 0) >= 1) {
    alerts.push({
      title: "开源与端侧部署生态会持续扩张",
      detail: "Gemma 4 这类高智能密度模型，会给边缘设备、私有化部署和行业定制带来更多机会。",
      level: "medium"
    });
  }

  if ((themeCount.safety ?? 0) >= 1) {
    alerts.push({
      title: "安全评测与合规工具链值得跟踪",
      detail: "随着安全投入制度化，评测、审计、数据治理和滥用防控工具会逐步标准化。",
      level: "medium"
    });
  }

  return alerts.slice(0, 4);
}

function buildIngestionSnapshot(ingestion, fallbackCount) {
  return {
    mode: ingestion?.mode === "live" ? "live" : "seed",
    sources: uniqueItems(ingestion?.sources ?? ["本地样例数据"]),
    failedSources: uniqueItems(ingestion?.failedSources ?? []),
    fetchedCount: ingestion?.fetchedCount ?? fallbackCount,
    refreshedAt: ingestion?.refreshedAt ?? new Date().toISOString()
  };
}

export function buildDailyReportPayload({
  reportDate,
  structuredItems,
  ingestion,
  solution = DEFAULT_REPORT_SOLUTION,
  promptExecutionMode = isLlmSolution(solution) ? "runtime" : "design_only"
}) {
  const normalizedSolution = normalizeReportSolution(solution);
  const sortedItems = [...structuredItems].sort((left, right) => right.impactScore - left.impactScore);
  const sourceCount = groupCount(sortedItems, (item) => item.sourceType);
  const themeCount = groupCount(sortedItems, (item) => item.primaryTheme);
  const sentimentCount = groupCount(sortedItems, (item) => item.sentimentLabel);
  const themeScoreMap = sortedItems.reduce((accumulator, item) => {
    accumulator[item.primaryTheme] = (accumulator[item.primaryTheme] ?? 0) + item.impactScore;
    return accumulator;
  }, {});
  const dominantThemes = Object.entries(themeScoreMap)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([theme]) => THEME_LABELS[theme] ?? theme);
  const averageImpactScore = Math.round(sumBy(sortedItems, (item) => item.impactScore) / Math.max(sortedItems.length, 1));
  const highImpactCount = sortedItems.filter((item) => item.impactScore >= 78).length;
  const ingestionSnapshot = buildIngestionSnapshot(ingestion, sortedItems.length);

  return {
    solution: normalizedSolution,
    solutionLabel: getReportSolutionLabel(normalizedSolution),
    reportDate,
    generatedAt: new Date().toISOString(),
    title: `AI 舆情分析日报 - ${reportDate}`,
    overview: `本期系统共处理 ${sortedItems.length} 条近期 AI 相关新闻，其中官方来源 ${sourceCount.official ?? 0} 条、媒体来源 ${sourceCount.media ?? 0} 条。热点主要集中在 ${dominantThemes.join("、")} 三个方向，说明当前行业主线是“头部资本与算力继续集中、多模态模型持续升级、行业落地与安全治理同步推进”。`,
    summary: {
      totalNews: sortedItems.length,
      officialCount: sourceCount.official ?? 0,
      mediaCount: sourceCount.media ?? 0,
      highImpactCount,
      averageImpactScore
    },
    ingestion: ingestionSnapshot,
    hotTopics: buildHotTopics(sortedItems),
    deepDives: buildDeepDives(sortedItems),
    trendSignals: buildTrendSignals(themeCount, themeScoreMap),
    riskAlerts: buildRiskAlerts(sortedItems, themeCount),
    opportunityAlerts: buildOpportunityAlerts(themeCount),
    charts: {
      themeDistribution: buildChartData(themeCount, THEME_LABELS, themeScoreMap),
      sourceDistribution: buildChartData(sourceCount, SOURCE_TYPE_LABELS),
      sentimentDistribution: buildChartData(sentimentCount, {
        positive: "偏正向",
        neutral: "中性",
        watch: "需关注"
      }),
      entityDistribution: buildEntityDistribution(sortedItems)
    },
    structuredInsights: sortedItems,
    methodology: {
      schemaDesign: [
        "把新闻拆成 eventType、primaryTheme、companies、keywords、sentiment、impactScore 等字段，是因为日报必须支持排序、聚合、聚类和可视化，而不是只输出摘要。",
        "保留 riskTags 与 opportunityTags，是为了把舆情判断直接转化为决策提示，避免报告只有描述没有动作。",
        "同时记录 confidenceScore，是为了区分官方披露与媒体转述的可信度差异，保证分析可解释。"
      ],
      keyStepReasons: [
        "先做清洗归一化，再做结构化抽取，可以把不同来源的标题、摘要、发布时间和语言统一到同一个分析口径。",
        "把热点排序拆成来源权重、主题权重、时效性和实体权重，是为了避免模型或人工凭直觉排序。",
        "趋势判断基于主题聚合结果生成，而不是直接摘要堆砌，满足题目对逻辑支撑的要求。",
        isLlmSolution(normalizedSolution)
          ? "方案 B 让 Prompt 真正参与“结构化抽取 + 日报生成”，但影响分、排序和图表仍保持规则可解释。"
          : "方案 A 保持规则链路，优势是稳定、可解释，也方便和方案 B 做同口径对比。"
      ],
      developmentPlan: [
        "阶段 1：补齐前后端骨架、Prisma 数据模型和样本数据。",
        "阶段 2：用 LangGraph 编排清洗、抽取、评分、日报生成链路。",
        "阶段 3：实现 Express API、React 可视化看板和种子脚本。",
        "阶段 4：生成样例日报并补齐说明文档与最小测试。",
        "阶段 5：保留规则版方案 A，再增加真实调用大模型的方案 B，通过 URL 参数切换。"
      ],
      sourceSelection: [
        ingestionSnapshot.mode === "live"
          ? `实时模式当前优先抓取 ${ingestionSnapshot.sources.join("、")}，原因是这两类官方源结构稳定、可直接服务端抓取。`
          : "默认模式继续保留本地样例数据，方便离线演示和测试。",
        "官方渠道优先选 OpenAI、Anthropic、Google DeepMind，因为它们更适合获取模型发布、融资和安全动作的一手信息。",
        "媒体渠道补充 TechCrunch 与量子位，用来观察资本市场、行业情绪和中国市场的融资动向。",
        "样本时间主要落在 2026 年 2 月到 4 月，保证“近期性”和主题集中度。"
      ],
      ingestion: ingestionSnapshot,
      solution: normalizedSolution
    },
    promptCatalog: {
      extractionPrompt,
      reportPrompt,
      executionMode: promptExecutionMode
    }
  };
}
