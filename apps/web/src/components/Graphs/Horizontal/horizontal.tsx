import { useState, useEffect } from 'react';
import styles from "./horizontal.module.css";

export default function HorizontalChart() {
  const [data, setData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = window.localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await window.fetch(
          'http://localhost:4000/api/v1/billing/orders/product-sales?period=monthly',
          { headers }
        );
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles.chart}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>Product Sales Comparison</h3>
        <p style={{ color: "#6b7280", marginBottom: "1.25rem" }}>Loading product sales data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.chart}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>Product Sales Comparison</h3>
        <p style={{ color: "#6b7280", marginBottom: "1.25rem" }}>
          No product sales data available.
        </p>
      </div>
    );
  }

  // Find max value for percentage scaling
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className={styles.chart}>
      <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>Product Sales Comparison</h3>
      <p style={{ color: "#6b7280", marginBottom: "1.25rem" }}>
        Top selling products by revenue.
      </p>
      {data.slice(0, 10).map((item, i) => {
        const percentage = (item.value / maxValue) * 100;
        return (
          <div key={i} className={styles.row}>
            <span className={styles.label}>{item.label}</span>

            <div className={styles.barWrapper}>
              <div
                className={`${styles.bar} ${
                  i % 3 === 0
                    ? styles.green
                    : i % 3 === 1
                    ? styles.purple
                    : styles.orange
                }`}
                style={{
                  width: `${percentage}%`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            </div>

            <span className={styles.value}>{item.value.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}