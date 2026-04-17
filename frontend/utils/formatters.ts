import { formatDisplayDate } from "@common/utils/report";

export function formatImpactScore(score: number) {
  return `${score} / 100`;
}

export function formatCardDate(dateText: string) {
  return formatDisplayDate(dateText);
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
