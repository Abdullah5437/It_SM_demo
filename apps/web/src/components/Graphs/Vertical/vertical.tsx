import { useState, useEffect } from 'react';
import styles from "./vertical.module.css";

type Period = 'daily' | 'monthly' | 'yearly';

// Predefined colors for pie segments
const SEGMENT_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
];

export default function VerticalChart() {
  const [data, setData] = useState<{ label: string; value: number }[]>([]);
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = window.localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await window.fetch(
          `http://localhost:4000/api/v1/billing/orders/product-sales?period=${period}`,
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
  }, [period]);



  const buttonStyle = (p: Period): React.CSSProperties => ({
    padding: '0.4rem 0.9rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: period === p ? 600 : 400,
    background: period === p ? '#0d5c63' : '#f3f4f6',
    color: period === p ? '#fff' : '#374151',
    fontSize: '0.8rem',
    transition: 'all 0.2s',
  });

  // Calculate total for percentages
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  // Generate conic-gradient string dynamically
  const generateConicGradient = (): string => {
    if (data.length === 0 || totalValue === 0) return '';

    let cumulativePercent = 0;
    const segments = data.map((item, i) => {
      const percent = (item.value / totalValue) * 100;
      const start = cumulativePercent;
      cumulativePercent += percent;
      const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      return `${color} ${start}% ${cumulativePercent}%`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  };

  // Format currency value for labels
  const formatValue = (val: number): string => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  const renderDonutContent = () => {
    if (loading) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Loading...
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          No product sales data available.
        </div>
      );
    }

    return (
      <>
        <div className={styles.chartWrapper}>
          <div
            className={styles.donut}
            style={{ background: generateConicGradient() }}
          >
            <div className={styles.donutCenter}>
              <span className={styles.donutTotal}>
                {formatValue(totalValue)}
              </span>
              <span className={styles.donutLabel}>Total Sales</span>
            </div>
          </div>
        </div>

        <div className={styles.legend}>
          {data.slice(0, 10).map((item, i) => {
            const percent = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0';
            const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
            return (
              <div key={i} className={styles.legendItem}>
                <div
                  className={styles.legendDot}
                  style={{ backgroundColor: color }}
                />
                <span className={styles.legendLabel}>{item.label}</span>
                <span className={styles.legendValue}>
                  {formatValue(item.value)} ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.2rem',
      flex: 1,
      minWidth: 0,
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>
          Top Selling Products
        </h3>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button style={buttonStyle('daily')} onClick={() => setPeriod('daily')}>Daily</button>
          <button style={buttonStyle('monthly')} onClick={() => setPeriod('monthly')}>Monthly</button>
          <button style={buttonStyle('yearly')} onClick={() => setPeriod('yearly')}>Yearly</button>
        </div>
      </div>

      <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>
        Product sales comparison — which products sold the most.
      </p>

      {renderDonutContent()}
    </div>
  );
}