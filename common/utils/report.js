export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function uniqueItems(items) {
  return [...new Set(items.filter(Boolean))];
}

export function sumBy(items, getter) {
  return items.reduce((total, item) => total + getter(item), 0);
}

export function groupCount(items, getter) {
  return items.reduce((accumulator, item) => {
    const key = getter(item);
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

export function toDateKey(input) {
  return new Date(input).toISOString().slice(0, 10);
}

export function daysBetween(laterDate, earlierDate) {
  const later = new Date(laterDate);
  const earlier = new Date(earlierDate);
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24)));
}

export function formatDisplayDate(input) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(input));
}

export function formatPercent(value, total) {
  if (!total) {
    return "0%";
  }
  return `${Math.round((value / total) * 100)}%`;
}
