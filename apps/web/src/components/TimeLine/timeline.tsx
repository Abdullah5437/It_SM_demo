import { useState, useEffect } from 'react';
import styles from './timeline.module.css'

type DailyActivity = {
  date: string;
  ordersCount: number;
  totalSales: number;
  topProduct: string;
};

function formatCurrency(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toFixed(2)}`;
}

export default function Timeline() {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const token = window.localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await window.fetch(
          'http://localhost:4000/api/v1/billing/orders/daily-activity',
          { headers }
        );
        const json = await res.json();
        if (json.success) {
          setActivities(json.data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  return (
    <div style={{marginTop:"2rem" ,background:'#fff',borderRadius:'16px',padding:'1.5rem',boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
      <h3 style={{ fontSize: "1.8rem", fontWeight: "600", color: "#12344d", marginTop: "1.5rem" }}>Activity Timeline</h3>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Recent updates and milestones in your account
      </p>
      {loading ? (
        <p style={{ color: "#6b7280", textAlign: "center", padding: "1rem" }}>Loading activity...</p>
      ) : activities.length === 0 ? (
        <p style={{ color: "#6b7280", textAlign: "center", padding: "1rem" }}>No recent activity.</p>
      ) : (
        <ul className={styles.timeline}>
          {activities.slice(0, 6).map((activity, i) => (
            <li key={i} className={styles.item}>
              <div className={i % 2 === 0 ? styles.directionR : styles.directionL}>
                <div className={styles.flagWrapper}>
                  <span className={styles.flag}>{activity.ordersCount} orders · {formatCurrency(activity.totalSales)}</span>
                  <span className={styles.timeWrapper}>
                    <span className={styles.time}>{activity.date}</span>
                  </span>
                </div>
                <div className={styles.desc}>
                  Best selling: <strong>{activity.topProduct}</strong>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}