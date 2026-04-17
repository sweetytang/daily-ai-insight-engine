export const THEME_FILTERS = [
  { key: "all", label: "全部" },
  { key: "capital", label: "资本" },
  { key: "infrastructure", label: "算力" },
  { key: "model", label: "模型" },
  { key: "enterprise", label: "企业" },
  { key: "safety", label: "安全" },
  { key: "world_model", label: "世界模型" },
  { key: "content_ai", label: "内容生成" }
] as const;

export const LEVEL_TONE = {
  high: "high",
  medium: "medium",
  low: "low"
} as const;
