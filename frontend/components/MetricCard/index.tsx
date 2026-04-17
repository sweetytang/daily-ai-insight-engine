import styles from "./index.module.scss";

interface MetricCardProps {
  label: string;
  value: string;
  hint: string;
  tone?: "positive" | "neutral" | "warning";
}

export function MetricCard({ label, value, hint, tone = "neutral" }: MetricCardProps) {
  return (
    <article className={`${styles.card} ${styles[tone]}`}>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{value}</strong>
      <p className={styles.hint}>{hint}</p>
    </article>
  );
}
