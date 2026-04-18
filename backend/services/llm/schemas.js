export const extractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    eventType: {
      type: "string",
      enum: ["funding", "model_release", "partnership", "infrastructure", "safety", "ecosystem"]
    },
    primaryTheme: {
      type: "string",
      enum: ["model", "infrastructure", "capital", "enterprise", "safety", "open_source", "world_model", "multimodal", "content_ai"]
    },
    secondaryThemes: {
      type: "array",
      items: {
        type: "string",
        enum: ["model", "infrastructure", "capital", "enterprise", "safety", "open_source", "world_model", "multimodal", "content_ai"]
      },
      maxItems: 3
    },
    companies: {
      type: "array",
      items: { type: "string" },
      maxItems: 5
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      maxItems: 5
    },
    sentimentLabel: {
      type: "string",
      enum: ["positive", "neutral", "watch"]
    },
    structuredSummary: {
      type: "string",
      maxLength: 280
    },
    impactAnalysis: {
      type: "string",
      maxLength: 280
    },
    riskTags: {
      type: "array",
      items: { type: "string" },
      maxItems: 4
    },
    opportunityTags: {
      type: "array",
      items: { type: "string" },
      maxItems: 4
    },
    confidenceScore: {
      type: "number",
      minimum: 0.5,
      maximum: 0.99
    }
  },
  required: [
    "eventType",
    "primaryTheme",
    "secondaryThemes",
    "companies",
    "keywords",
    "sentimentLabel",
    "structuredSummary",
    "impactAnalysis",
    "riskTags",
    "opportunityTags",
    "confidenceScore"
  ]
};

const alertItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      maxLength: 40
    },
    detail: {
      type: "string",
      maxLength: 220
    },
    level: {
      type: "string",
      enum: ["high", "medium", "low"]
    }
  },
  required: ["title", "detail", "level"]
};

export const reportNarrativeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overview: {
      type: "string",
      maxLength: 400
    },
    hotTopics: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          reason: {
            type: "string",
            maxLength: 220
          }
        },
        required: ["id", "reason"]
      }
    },
    deepDives: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
            maxLength: 80
          },
          background: {
            type: "string",
            maxLength: 220
          },
          impact: {
            type: "string",
            maxLength: 220
          },
          recommendation: {
            type: "string",
            maxLength: 120
          }
        },
        required: ["title", "background", "impact", "recommendation"]
      }
    },
    trendSignals: {
      type: "array",
      maxItems: 4,
      items: alertItemSchema
    },
    riskAlerts: {
      type: "array",
      maxItems: 4,
      items: alertItemSchema
    },
    opportunityAlerts: {
      type: "array",
      maxItems: 4,
      items: alertItemSchema
    }
  },
  required: ["overview", "hotTopics", "deepDives", "trendSignals", "riskAlerts", "opportunityAlerts"]
};
