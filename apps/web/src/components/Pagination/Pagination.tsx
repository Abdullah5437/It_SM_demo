import React from 'react';
import styles from './pagination.module.css';

interface PaginationProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function Pagination({
  currentPage = 1,
  totalPages = 10,
  onPageChange
}: PaginationProps) {
  const handlePageChange = (page: number) => {
    if (onPageChange && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button
            key={i}
            className={`${styles.number} ${i === currentPage ? styles.active : ''}`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }
    } else {
      // Show first page
      pages.push(
        <button
          key={1}
          className={`${styles.number} ${1 === currentPage ? styles.active : ''}`}
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );

      // Show ellipsis if needed
      if (currentPage > 3) {
        pages.push(<span key="start-ellipsis" className={styles.ellipsis}>...</span>);
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(
          <button
            key={i}
            className={`${styles.number} ${i === currentPage ? styles.active : ''}`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }

      // Show ellipsis if needed
      if (currentPage < totalPages - 2) {
        pages.push(<span key="end-ellipsis" className={styles.ellipsis}>...</span>);
      }

      // Show last page
      if (totalPages > 1) {
        pages.push(
          <button
            key={totalPages}
            className={`${styles.number} ${totalPages === currentPage ? styles.active : ''}`}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </button>
        );
      }
    }

    return pages;
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.paginationInfo}>
        Page {'1'} of {'24'}
      </div>
   <div className={styles.container}>
      <button
        className={styles.arrow}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <span className={styles.arrowIcon}>‹</span>
        <span className={styles.arrowText}>Previous</span>
      </button>

      {renderPageNumbers()}

      <button
        className={styles.arrow}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <span className={styles.arrowText}>Next</span>
        <span className={styles.arrowIcon}>›</span>
      </button>
    </div>
    </div>
 
  );
}