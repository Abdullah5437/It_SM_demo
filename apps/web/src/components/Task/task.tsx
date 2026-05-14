"use client";

import { useEffect, useState } from "react";
import styles from "./task.module.css";

type Slide = {
  title: string;
  description: string;
  items: string[];
};

export default function Task() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const token = window.localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await window.fetch(
          'http://localhost:4000/api/v1/billing/orders/dashboard-slides',
          { headers }
        );
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setSlides(json.data);
        } else {
          // Fallback slides
          setSlides([
            {
              title: "No Data Yet",
              description: "Start tracking orders to see insights here.",
              items: ["Create your first order", "Monitor inventory levels", "Track sales performance"],
            },
          ]);
        }
      } catch {
        setSlides([
          {
            title: "Welcome",
            description: "Your dashboard insights will appear here.",
            items: ["Orders overview", "Low stock alerts", "Sales summary"],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 8000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.cardBorder}></div>
        <div style={{ color: '#baf7f0', padding: '2rem', textAlign: 'center' }}>Loading insights...</div>
      </div>
    );
  }

  return (
    <>
    <div className={styles.card}>
      <div className={styles.cardBorder}></div>

      <div className={styles.topBar}>
        <div className={styles.sliderCount}>
          <span>{String(activeIndex + 1).padStart(2, "0")}</span>
          <span className={styles.countDivider}>/</span>
          <span>{String(slides.length).padStart(2, "0")}</span>
        </div>

        <div className={styles.navigation}>
          <button
            type="button"
            className={styles.navButton}
            onClick={goToPrevious}
            aria-label="Previous slide"
          >
            &#8249;
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={goToNext}
            aria-label="Next slide"
          >
            &#8250;
          </button>
        </div>
      </div>

      <div className={styles.sliderViewport}>
        <div
          className={styles.sliderTrack}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <section key={slide.title} className={styles.slide}>
              <div className={styles.titleContainer}>
                <span className={styles.title}>{slide.title}</span>
                <p className={styles.paragraph}>{slide.description}</p>
              </div>

              <hr className={styles.line} />

              <ul className={styles.list}>
                {slide.items.map((item) => (
                  <li key={item} className={styles.listItem}>
                    <span className={styles.check}>
                      
                    </span>
                    <span className={styles.listText}>{item}</span>
                  </li>
                ))}
              </ul>

              <button className={styles.button}>View Details</button>
            </section>
          ))}
        </div>
      </div>

      <div className={styles.dots}>
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ""}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to ${slide.title}`}
          />
        ))}
      </div>

    </div>
    <div className={styles.tagContainer}>
      <p className={styles.tagTitle}>Tags</p>
     
    </div>
    
    </>

  );
}