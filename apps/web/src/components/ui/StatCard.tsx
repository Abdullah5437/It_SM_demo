import { useState, useEffect } from 'react';
import styles from "./StatCard.module.css";
import LoaderPulse from '../Loader/Loader';

type OrderStats = {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSalesCents: number;
  totalCostCents: number;
  totalProfitCents: number;
};

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(2)}`;
}

function isPositive(value: number): boolean {
  return value >= 0;
}

export default function StatsCards(): JSX.Element {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = window.localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await window.fetch(
          'http://localhost:4000/api/v1/billing/orders/stats',
          { headers }
        );
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <LoaderPulse />
      </div>
    );
  }

  if (error || !stats) {
    // Fallback static stats on error
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={`${styles.iconBox} ${styles.green}`}>
            <svg style={{height:'28px'}} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V20M12 4L8 8M12 4L16 8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          <div className={styles.content}>
            <h3 className={styles.value}>---</h3>
            <p className={styles.label}>Orders</p>
          </div>
        </div>
        <div className={styles.card}>
          <div className={`${styles.iconBox} ${styles.green}`}>
            <svg style={{height:'28px'}} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V20M12 4L8 8M12 4L16 8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          <div className={styles.content}>
            <h3 className={styles.value}>---</h3>
            <p className={styles.label}>Sales</p>
          </div>
        </div>
        <div className={styles.card}>
          <div className={`${styles.iconBox} ${styles.green}`}>
            <svg style={{height:'28px'}} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V20M12 4L8 8M12 4L16 8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          <div className={styles.content}>
            <h3 className={styles.value}>---</h3>
            <p className={styles.label}>Profit / Loss</p>
          </div>
        </div>
      </div>
    );
  }

  const profitPositive = isPositive(stats.totalProfitCents);

  return (
    <div className={styles.container}>
      {/* Orders Card */}
      <div className={styles.card}>
        <div className={`${styles.iconBox} ${styles.green}`}>
          <svg style={{height:'28px'}} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.5777 4.43152L15.5777 3.38197C13.8221 2.46066 12.9443 2 12 2C11.0557 2 10.1779 2.46066 8.42229 3.38197L8.10057 3.5508L17.0236 8.64967L21.0403 6.64132C20.3941 5.90949 19.3515 5.36234 17.5777 4.43152Z" fill="#16a34a"/>
            <path d="M21.7484 7.96434L17.75 9.96353V13C17.75 13.4142 17.4142 13.75 17 13.75C16.5858 13.75 16.25 13.4142 16.25 13V10.7135L12.75 12.4635V21.904C13.4679 21.7252 14.2848 21.2965 15.5777 20.618L17.5777 19.5685C19.7294 18.4393 20.8052 17.8748 21.4026 16.8603C22 15.8458 22 14.5833 22 12.0585V11.9415C22 10.0489 22 8.86557 21.7484 7.96434Z" fill="#16a34a"/>
            <path d="M11.25 21.904V12.4635L2.25164 7.96434C2 8.86557 2 10.0489 2 11.9415V12.0585C2 14.5833 2 15.8458 2.5974 16.8603C3.19479 17.8748 4.27062 18.4393 6.42228 19.5685L8.42229 20.618C9.71524 21.2965 10.5321 21.7252 11.25 21.904Z" fill="#16a34a"/>
            <path d="M2.95969 6.64132L12 11.1615L15.4112 9.4559L6.52456 4.37785L6.42229 4.43152C4.64855 5.36234 3.6059 5.90949 2.95969 6.64132Z" fill="#16a34a"/>
          </svg>
        </div>

        <div className={styles.content}>
          <h3 className={styles.value}>{stats.totalOrders}</h3>
          <p className={styles.label}>Orders (30 days)</p>
        </div>

        <div className={`${styles.change} ${styles.textGreen}`}>
          {stats.completedOrders} completed
        </div>
      </div>

      {/* Sales Card */}
      <div className={styles.card}>
        <div className={`${styles.iconBox} ${styles.green}`}>
          <svg style={{height:'28px'}} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17V20H21V17" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3V14M12 14L8 10M12 14L16 10" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className={styles.content}>
          <h3 className={styles.value}>{formatCurrency(stats.totalSalesCents)}</h3>
          <p className={styles.label}>Sales (30 days)</p>
        </div>

        <div className={`${styles.change} ${styles.textGreen}`}>
          {stats.completedOrders} orders
        </div>
      </div>

      {/* Profit / Loss Card */}
      <div className={styles.card}>
        <div className={`${styles.iconBox} ${profitPositive ? styles.green : styles.red}`}>
          {profitPositive ? (
            <svg style={{height:'28px'}} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V20M12 4L8 8M12 4L16 8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          ) : (
            <svg style={{height:'28px'}} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(180)">
              <path d="M12 4V20M12 4L8 8M12 4L16 8" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          )}
        </div>

        <div className={styles.content}>
          <h3 className={styles.value}>{formatCurrency(Math.abs(stats.totalProfitCents))}</h3>
          <p className={styles.label}>{profitPositive ? 'Profit' : 'Loss'} (30 days)</p>
        </div>

        <div className={`${styles.change} ${profitPositive ? styles.textGreen : styles.textRed}`}>
          {profitPositive ? '+' : '-'}{formatCurrency(Math.abs(stats.totalProfitCents))}
        </div>
      </div>
    </div>
  );
}
