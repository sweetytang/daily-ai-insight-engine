export interface ChartDatum {
  label: string;
  value: number;
  tone?: "positive" | "neutral" | "warning" | "danger";
}

export interface HotTopic {
  id: string;
  title: string;
  reason: string;
  impactScore: number;
  sourceName: string;
  publishedAt: string;
  primaryTheme: string;
  sentimentLabel: string;
  companies: string[];
}

export interface DeepDive {
  title: string;
  background: string;
  impact: string;
  recommendation: string;
}

export interface AlertItem {
  title: string;
  detail: string;
  level: "high" | "medium" | "low";
}

export interface StructuredInsightView {
  id: string;
  title: string;
  sourceName: string;
  sourceType: string;
  sourceUrl: string;
  publishedAt: string;
  language: string;
  region: string;
  eventType: string;
  primaryTheme: string;
  secondaryThemes: string[];
  companies: string[];
  keywords: string[];
  sentimentLabel: string;
  impactScore: number;
  confidenceScore: number;
  riskTags: string[];
  opportunityTags: string[];
  structuredSummary: string;
  impactAnalysis: string;
}

export interface DailyReportPayload {
  reportDate: string;
  generatedAt: string;
  title: string;
  overview: string;
  summary: {
    totalNews: number;
    officialCount: number;
    mediaCount: number;
    highImpactCount: number;
    averageImpactScore: number;
  };
  hotTopics: HotTopic[];
  deepDives: DeepDive[];
  trendSignals: AlertItem[];
  riskAlerts: AlertItem[];
  opportunityAlerts: AlertItem[];
  charts: {
    themeDistribution: ChartDatum[];
    sourceDistribution: ChartDatum[];
    sentimentDistribution: ChartDatum[];
    entityDistribution: ChartDatum[];
  };
  structuredInsights: StructuredInsightView[];
  methodology: {
    schemaDesign: string[];
    keyStepReasons: string[];
    developmentPlan: string[];
    sourceSelection: string[];
  };
  promptCatalog: {
    extractionPrompt: string;
    reportPrompt: string;
  };
}
