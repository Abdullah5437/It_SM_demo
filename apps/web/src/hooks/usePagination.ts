import { useState, useCallback, useMemo } from 'react';

interface UsePaginationReturn {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (itemsPerPage: number) => void;
  totalPages: number;
  totalItems: number;
  setTotalItems: (total: number) => void;
  pageParams: { skip: number; limit: number };
}

export function usePagination(defaultItemsPerPage = 10): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [totalItems, setTotalItems] = useState(0);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  }, [totalItems, itemsPerPage]);

  const pageParams = useMemo(() => {
    return {
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
    };
  }, [currentPage, itemsPerPage]);

  const handleSetItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage: handleSetItemsPerPage,
    totalPages,
    totalItems,
    setTotalItems,
    pageParams,
  };
}