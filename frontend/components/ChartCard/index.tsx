import styles from "./index.module.scss";

import type { ChartDatum } from "@/types/dashboard";

interface ChartCardProps {
  title: string;
  description: string;
  items: ChartDatum[];
}

export function ChartCard({ title, description, items }: ChartCardProps) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </header>
      <div className={styles.rows}>
        {items.map((item) => (
          <div className={styles.row} key={item.label}>
            <div className={styles.meta}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className={styles.track}>
              <span
                className={`${styles.fill} ${item.tone ? styles[item.tone] : ""}`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
