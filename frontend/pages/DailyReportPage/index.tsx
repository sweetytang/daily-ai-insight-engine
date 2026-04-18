import { useMemo, useState } from "react";

import { useDashboardStore } from "@/store/dashboardStore";
import { ChartCard } from "@/components/ChartCard";
import { EventCard } from "@/components/EventCard";
import { MetricCard } from "@/components/MetricCard";
import { SectionBlock } from "@/components/SectionBlock";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useReportSolution } from "@/hooks/useReportSolution";
import { formatCardDate, formatDateTimeLabel, formatImpactScore } from "@/utils/formatters";
import { THEME_FILTERS } from "@/constants/dashboard";

import styles from "./index.module.scss";

export function DailyReportPage() {
  const { solution, solutionOptions } = useReportSolution();
  const { data, loading, error } = useDashboardData(solution);
  const activeTheme = useDashboardStore((state) => state.activeTheme);
  const setActiveTheme = useDashboardStore((state) => state.setActiveTheme);
  const refreshing = useDashboardStore((state) => state.refreshing);
  const refreshError = useDashboardStore((state) => state.refreshError);
  const refreshReport = useDashboardStore((state) => state.refreshReport);
  const [showFullMethodology, setShowFullMethodology] = useState(false);

  const filteredInsights = useMemo(() => {
    if (!data) {
      return [];
    }

    if (activeTheme === "all") {
      return data.structuredInsights;
    }

    return data.structuredInsights.filter((item) => item.primaryTheme === activeTheme);
  }, [activeTheme, data]);

  if (loading) {
    return <main className={styles.state}>正在加载 AI 日报...</main>;
  }

  if (error || !data) {
    return <main className={styles.state}>加载失败：{error ?? "暂无数据"}</main>;
  }

  const methodologyItems = showFullMethodology
    ? data.methodology.keyStepReasons
    : data.methodology.keyStepReasons.slice(0, 2);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.kicker}>Daily AI Insight Engine</span>
          <h1 className={styles.title}>{data.title}</h1>
          <p className={styles.overview}>{data.overview}</p>
        </div>
        <div className={styles.heroPanel}>
          <span className={styles.panelLabel}>报告日期</span>
          <strong className={styles.panelValue}>{data.reportDate}</strong>
          <div className={styles.modeRow}>
            <span className={styles.modeBadge}>{data.solutionLabel}</span>
            <span className={styles.modeBadge}>
              {data.ingestion.mode === "live" ? "实时抓取" : "静态样例"}
            </span>
            <span className={styles.modeBadge}>{data.ingestion.fetchedCount} 条样本</span>
          </div>
          <div className={styles.solutionRow}>
            {solutionOptions.map((item) => (
              <a
                className={`${styles.solutionLink} ${data.solution === item.key ? styles.activeSolutionLink : ""}`}
                href={item.href}
                key={item.key}
              >
                {item.label}
              </a>
            ))}
          </div>
          <p className={styles.panelHint}>生成时间：{formatDateTimeLabel(data.generatedAt)}</p>
          <p className={styles.panelHint}>抓取时间：{formatDateTimeLabel(data.ingestion.refreshedAt)}</p>
          <p className={styles.panelHint}>本次来源：{data.ingestion.sources.join("、")}</p>
          {data.ingestion.failedSources.length ? (
            <p className={styles.panelWarning}>已跳过来源：{data.ingestion.failedSources.join("、")}</p>
          ) : null}
          {refreshError ? <p className={styles.panelWarning}>刷新失败：{refreshError}</p> : null}
          <button
            className={styles.refreshButton}
            disabled={refreshing}
            onClick={() => void refreshReport(solution)}
            type="button"
          >
            {refreshing ? "正在实时生成..." : "实时生成最新舆情"}
          </button>
        </div>
      </section>

      <section className={styles.metrics}>
        <MetricCard
          label="样本总量"
          value={`${data.summary.totalNews}`}
          hint={`官方 ${data.summary.officialCount} 条，媒体 ${data.summary.mediaCount} 条`}
          tone="neutral"
        />
        <MetricCard
          label="高热事件"
          value={`${data.summary.highImpactCount}`}
          hint="影响分大于等于 78 的事件会进入重点关注池"
          tone="warning"
        />
        <MetricCard
          label="平均影响分"
          value={`${data.summary.averageImpactScore}`}
          hint="由来源可信度、时效性、主题权重和实体影响力共同构成"
          tone="positive"
        />
      </section>

      <SectionBlock
        eyebrow="Hot Topics"
        title="今日 AI 领域主要热点"
        description="热点排序不是直接按摘要拼接，而是按结构化影响分进行排序。"
      >
        <div className={styles.hotGrid}>
          {data.hotTopics.map((topic, index) => (
            <EventCard
              key={topic.id}
              title={topic.title}
              score={`TOP ${index + 1} · ${formatImpactScore(topic.impactScore)}`}
              meta={[topic.primaryTheme, topic.sourceName, formatCardDate(topic.publishedAt)]}
              summary={topic.reason}
              note={`情绪判断：${topic.sentimentLabel}`}
              tags={topic.companies}
              tone={index === 0 ? "primary" : "secondary"}
            />
          ))}
        </div>
      </SectionBlock>

      <div className={styles.dualColumn}>
        <SectionBlock
          eyebrow="Deep Dive"
          title="重要事件深度总结"
          description="对最关键的三条事件补充背景与影响，而不是停留在标题层。"
        >
          <div className={styles.stack}>
            {data.deepDives.map((item) => (
              <article className={styles.noteCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.background}</p>
                <p>{item.impact}</p>
                <strong>{item.recommendation}</strong>
              </article>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock
          eyebrow="Trend"
          title="趋势、风险与机会"
          description="趋势来自主题聚合，风险和机会则直接连接决策视角。"
        >
          <div className={styles.signalColumns}>
            <div className={styles.signalGroup}>
              <h3>趋势判断</h3>
              {data.trendSignals.map((item) => (
                <article className={styles.signalCard} key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
            <div className={styles.signalGroup}>
              <h3>风险提示</h3>
              {data.riskAlerts.map((item) => (
                <article className={`${styles.signalCard} ${styles.risk}`} key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
            <div className={styles.signalGroup}>
              <h3>机会提示</h3>
              {data.opportunityAlerts.map((item) => (
                <article className={`${styles.signalCard} ${styles.opportunity}`} key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </SectionBlock>
      </div>

      <SectionBlock
        eyebrow="Visualize"
        title="可视化结果"
        description="四组轻量图表展示热点主题、来源结构、情绪分布和重点实体，满足题目对可视化展示的要求。"
      >
        <div className={styles.chartGrid}>
          <ChartCard title="主题分布" description="看热点落在什么主题" items={data.charts.themeDistribution} />
          <ChartCard title="来源结构" description="看官方与媒体比例" items={data.charts.sourceDistribution} />
          <ChartCard title="情绪分布" description="看舆情是正向还是谨慎" items={data.charts.sentimentDistribution} />
          <ChartCard title="重点实体" description="看谁在持续占据注意力" items={data.charts.entityDistribution} />
        </div>
      </SectionBlock>

      <SectionBlock
        eyebrow="Schema"
        title="结构化结果"
        description="这里展示每条新闻被抽取成什么结构，用来证明系统不是只做摘要。"
      >
        <div className={styles.filterBar}>
          {THEME_FILTERS.map((item) => (
            <button
              className={`${styles.filterButton} ${activeTheme === item.key ? styles.activeFilter : ""}`}
              key={item.key}
              onClick={() => setActiveTheme(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.insightGrid}>
          {filteredInsights.map((item) => (
            <EventCard
              key={item.id}
              title={item.title}
              score={formatImpactScore(item.impactScore)}
              meta={[
                item.sourceName,
                item.eventType,
                item.primaryTheme,
                formatCardDate(item.publishedAt)
              ]}
              summary={item.structuredSummary}
              note={item.impactAnalysis}
              tags={[...item.riskTags.slice(0, 2), ...item.opportunityTags.slice(0, 2)]}
            />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        eyebrow="Methodology"
        title="设计原因与开发方案"
        description="按题目要求，把 schema 设计原因、关键步骤原因、开发方案和 Prompt 设计一起归档。"
      >
        <div className={styles.methodGrid}>
          <article className={styles.noteCard}>
            <h3>Schema 设计原因</h3>
            {data.methodology.schemaDesign.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </article>
          <article className={styles.noteCard}>
            <h3>关键步骤理由</h3>
            {methodologyItems.map((item) => (
              <p key={item}>{item}</p>
            ))}
            <button
              className={styles.linkButton}
              onClick={() => setShowFullMethodology((value) => !value)}
              type="button"
            >
              {showFullMethodology ? "收起" : "展开更多"}
            </button>
          </article>
          <article className={styles.noteCard}>
            <h3>开发方案</h3>
            {data.methodology.developmentPlan.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </article>
          <article className={styles.noteCard}>
            <h3>Prompt 设计</h3>
            <p className={styles.promptHint}>
              {data.promptCatalog.executionMode === "runtime"
                ? "当前方案会在运行时真实调用这两段 Prompt。"
                : "当前方案只展示 Prompt 设计，不会真实调用大模型。"}
            </p>
            <p>{data.promptCatalog.extractionPrompt}</p>
            <p>{data.promptCatalog.reportPrompt}</p>
          </article>
        </div>
      </SectionBlock>
    </main>
  );
}
