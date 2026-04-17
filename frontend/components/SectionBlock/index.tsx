import { ReactNode } from "react";

import styles from "./index.module.scss";

interface SectionBlockProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function SectionBlock({ eyebrow, title, description, children }: SectionBlockProps) {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </header>
      <div>{children}</div>
    </section>
  );
}
