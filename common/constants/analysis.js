export const DEFAULT_REPORT_DATE = "2026-04-17";

export const SOURCE_TYPE_LABELS = {
  official: "官方渠道",
  media: "媒体报道"
};

export const EVENT_TYPE_LABELS = {
  model_release: "模型发布",
  funding: "融资事件",
  partnership: "合作落地",
  infrastructure: "算力基础设施",
  safety: "安全治理",
  ecosystem: "生态变化"
};

export const THEME_LABELS = {
  model: "模型能力",
  infrastructure: "算力基础设施",
  capital: "资本动向",
  enterprise: "企业落地",
  safety: "安全治理",
  open_source: "开源生态",
  world_model: "世界模型",
  multimodal: "多模态",
  content_ai: "内容生成"
};

export const SOURCE_WEIGHTS = {
  official: 26,
  media: 18
};

export const THEME_WEIGHTS = {
  infrastructure: 24,
  capital: 24,
  model: 22,
  enterprise: 20,
  safety: 19,
  open_source: 18,
  world_model: 18,
  multimodal: 17,
  content_ai: 17
};

export const ENTITY_WEIGHTS = {
  OpenAI: 24,
  Anthropic: 23,
  "Google DeepMind": 22,
  Google: 20,
  Broadcom: 12,
  Infosys: 10,
  "生数科技": 16,
  "爱诗科技": 15,
  "阿里云": 11,
  PixVerse: 10
};

export const COMPANY_KEYWORDS = {
  OpenAI: ["openai", "chatgpt", "gpt-5.4", "gpt‑5.4", "gpt-4o", "sora", "codex"],
  Anthropic: ["anthropic", "claude"],
  "Google DeepMind": ["google deepmind", "deepmind", "gemma", "gemini", "lyria"],
  Google: ["google cloud", "google"],
  Broadcom: ["broadcom"],
  Infosys: ["infosys"],
  "生数科技": ["生数科技", "vidu", "motus"],
  "爱诗科技": ["爱诗科技", "pixverse"],
  "阿里云": ["阿里云"],
  PixVerse: ["pixverse"]
};

export const THEME_KEYWORDS = {
  infrastructure: ["compute", "tpu", "基础设施", "算力", "capacity", "gigawatts"],
  capital: ["funding", "valuation", "融资", "领投", "raise", "capital"],
  model: ["model", "发布", "release", "gpt", "gemini", "gemma"],
  enterprise: ["enterprise", "regulated industries", "telecommunications", "企业", "行业"],
  safety: ["safety", "alignment", "manipulation", "治理", "robustness", "ethics"],
  open_source: ["open model", "open models", "开源"],
  world_model: ["world model", "世界模型", "embodied", "具身"],
  multimodal: ["audio", "speech", "video", "多模态", "multimodal", "tts"],
  content_ai: ["music", "video", "音视频", "创作者", "content"]
};
