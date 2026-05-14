import React from 'react';
import Card from './Card';
import styles from './ChartCard.module.css';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  loading = false,
  className = '',
  actions,
}) => {
  return (
    <Card className={`${styles.chartCard} ${className}`}>
      <div className={styles.chartCardHeader}>
        <div className={styles.chartCardTitle}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.chartCardActions}>{actions}</div>}
      </div>

      <div className={styles.chartCardContent}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading chart...</p>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
};

export default ChartCard;