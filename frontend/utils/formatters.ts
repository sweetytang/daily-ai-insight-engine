import { formatDisplayDate } from "@common/utils/report";

export function formatImpactScore(score: number) {
  return `${score} / 100`;
}

export function formatCardDate(dateText: string) {
  return formatDisplayDate(dateText);
}

export function formatDateTimeLabel(dateText: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateText));
}

export function toneBySentiment(label: string) {
  if (label === "watch") {
    return "danger";
  }

  if (label === "positive") {
    return "positive";
  }

  return "neutral";
}
