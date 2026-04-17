import styles from "./index.module.scss";

interface EventCardProps {
  title: string;
  score: string;
  meta: string[];
  summary: string;
  note: string;
  tags: string[];
  tone?: "primary" | "secondary";
}

export function EventCard({
  title,
  score,
  meta,
  summary,
  note,
  tags,
  tone = "secondary"
}: EventCardProps) {
  return (
    <article className={`${styles.card} ${styles[tone]}`}>
      <div className={styles.topline}>
        <span className={styles.score}>{score}</span>
        <div className={styles.meta}>
          {meta.map((item) => (
            <span className={styles.metaItem} key={item}>
              {item}
            </span>
          ))}
        </div>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.summary}>{summary}</p>
      <p className={styles.note}>{note}</p>
      <div className={styles.tags}>
        {tags.map((tag) => (
          <span className={styles.tag} key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
