import { useEffect, useState } from "react";
import styles from "./card_home.module.css";
type CardVariant = "green" | "blue" | "orange" | "red";

type Card = {
  date: string;
  title: string;
  subtitle: string;
  progress: number;
  daysLeft: string;
  variant: CardVariant;
  members: string[];
};

const cards: Card[] = [
  {
    date: "Feb 2, 2021",
    title: "Web Designing",
    subtitle: "Prototyping",
    progress: 90,
    daysLeft: "2 days left",
    variant: "green",
    members: ["AM", "SK", "RT"],
  },
  {
    date: "Apr 14, 2021",
    title: "Product Launch",
    subtitle: "Campaign Assets",
    progress: 64,
    daysLeft: "6 days left",
    variant: "orange",
    members: ["AR", "FM", "LS"],
  },

];

export default function HomeCard() {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const interval = globalThis.setInterval(() => {
      setActiveIndex((current) => (current + 1) % cards.length);
    }, 3200);

    return () => globalThis.clearInterval(interval);
  }, []);

  const previousIndex = (activeIndex - 1 + cards.length) % cards.length;
  const nextIndex = (activeIndex + 1) % cards.length;

  return (
    <section className={styles.section}>
      <div className={styles.slider}>
        {cards.map((card, index) => {
          const positionClass =
            index === activeIndex
              ? styles.active
              : index === previousIndex
              ? styles.previous
              : index === nextIndex
              ? styles.next
              : styles.hidden;

          return (
            <article
              key={`${card.title}-${card.date}`}
              className={`${styles.card} ${styles[card.variant]} ${positionClass}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.date}>{card.date}</div>
              </div>

              <div className={styles.cardBody}>
                <h3>{card.title}</h3>
                <p>{card.subtitle}</p>

                <div className={styles.progress}>
                  <div className={styles.progressTop}>
                    <span>Progress</span>
                    <span>{card.progress}%</span>
                  </div>

                  <div className={styles.progressBar}>
                    <span
                      className={styles.progressFill}
                      style={{ width: `${card.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Optional Footer */}
              {/* 
              <div className={styles.cardFooter}>
                <ul className={styles.members}>
                  {card.members.map((member) => (
                    <li key={member} className={styles.memberBadge}>
                      {member}
                    </li>
                  ))}
                </ul>

                <span className={styles.btnCountdown}>
                  {card.daysLeft}
                </span>
              </div> 
              */}
            </article>
          );
        })}
      </div>

      <div className={styles.pagination}>
        {cards.map((card, index) => (
          <button
            key={`${card.title}-dot`}
            type="button"
            className={`${styles.dot} ${
              index === activeIndex ? styles.dotActive : ""
            }`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to ${card.title}`}
          />
        ))}
      </div>
    </section>
  );
}