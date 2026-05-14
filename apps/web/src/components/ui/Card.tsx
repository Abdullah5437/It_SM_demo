import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  rounded?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
  rounded = true,
  onClick,
}) => {
  const cardClasses = [
    styles.card,
    styles[`card--padding-${padding}`],
    styles[`card--shadow-${shadow}`],
    border && styles['card--border'],
    rounded && styles['card--rounded'],
    onClick && styles['card--clickable'],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;