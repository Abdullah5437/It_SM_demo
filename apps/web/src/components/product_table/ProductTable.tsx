import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import styles from './ProductTable.module.css';
import LoaderPulse from '../Loader/Loader';

interface ProductVariant {
  name: string;
  sku?: string;
  stock: number;
  salePrice?: number;
  costPrice?: number;
}

interface Product {
  _id: string;
  sku: string;
  name: string;
  title?: string;
  description?: string;
  image?: string;
  type: string;
  category?: string;
  subcategory?: string;
  subsubcategory?: string;
  defaultSalePrice: number;
  defaultCost: number;
  currency: string;
  stock: number;
  status: string;
  variants?: ProductVariant[];
  createdAt: string;
}

interface ProductTableProps {
  onEdit?: (product: Product) => void;
  onRefresh?: () => void;
  refreshKey?: number;
}

export default function ProductTable({ onEdit, onRefresh, refreshKey }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [variantPopup, setVariantPopup] = useState<{ id: string; variants: ProductVariant[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await window.fetch('http://localhost:4000/api/v1/inventory/products?limit=100', { headers });
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts, refreshKey]);

  const handleDelete = async (id: string) => {
    try {
      const res = await window.fetch(`http://localhost:4000/api/v1/inventory/products/${id}`, {
        method: 'DELETE',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setProducts(prev => prev.filter(p => p._id !== id));
        setDeleteConfirmId(null);
        toast.success('Product deleted successfully!');
        if (onRefresh) onRefresh();
      } else {
        toast.error(json.error || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'inactive': return styles.statusInactive;
      case 'discontinued': return styles.statusDiscontinued;
      default: return styles.statusInactive;
    }
  };

  // Filter products by search query and dropdown filters
  const filteredProducts = products.filter(p => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        (p.type && p.type.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    // Type filter
    if (filterType && p.type !== filterType) return false;
    // Status filter
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  // Calculations for totals (based on filtered results)
  const totalCost = filteredProducts.reduce((sum, p) => sum + (p.defaultCost * p.stock), 0);
  const totalSale = filteredProducts.reduce((sum, p) => sum + (p.defaultSalePrice * p.stock), 0);
  const totalProfit = totalSale - totalCost;
  const totalStock = filteredProducts.reduce((sum, p) => sum + p.stock, 0);

  if (loading) {
    return <div className={styles.loadingState}><LoaderPulse/></div>;
  }

  if (products.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No products found</p>
          <p style={{ fontSize: '0.9rem', color: '#98a2b3' }}>Create a new product to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableHeader}>
        <div>
          <p className={styles.kicker}>Product Inventory</p>
          <h3 className={styles.heading}>All Products ({filteredProducts.length})</h3>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}></span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by name, SKU, category, type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
        <select
          className={styles.filterSelect}
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="hardware">Hardware</option>
          <option value="software">Software</option>
          <option value="component">Component</option>
          <option value="other">Other</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discontinued">Discontinued</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Products</span>
          <span className={styles.summaryValue}>{products.length}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Stock</span>
          <span className={styles.summaryValue}>{totalStock}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Cost</span>
          <span className={styles.summaryValue}>{formatPrice(totalCost, 'USD')}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Sale Value</span>
          <span className={styles.summaryValue}>{formatPrice(totalSale, 'USD')}</span>
        </div>
        <div className={`${styles.summaryCard} ${totalProfit >= 0 ? styles.profitPositive : styles.profitNegative}`}>
          <span className={styles.summaryLabel}>Est. Profit</span>
          <span className={styles.summaryValue}>{formatPrice(totalProfit, 'USD')}</span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              {/* <th>SKU</th> */}
              <th>Name</th>
              <th>Type</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Cost × Stock</th>
              <th>Sale × Stock</th>
              <th>Total Stock</th>
              <th>Status</th>
              <th>Variants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={12}>
                  <div className={styles.emptyState}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No products match your search</p>
                    <p style={{ fontSize: '0.9rem', color: '#98a2b3' }}>Try adjusting your search or filter criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
            filteredProducts.map(product => {
              const hasVariants = product.variants && product.variants.length > 0;
              return (
                <tr key={product._id}>
                  <td>
                    {product.image ? (
                      <img src={product.image} alt={product.name} className={styles.productImage} />
                    ) : (
                      <div className={styles.productImagePlaceholder}>N/A</div>
                    )}
                  </td>
                  {/* <td><span className={styles.skuPill}>{product.sku}</span></td> */}
                  <td>
                    <div className={styles.nameCell}>{product.name}</div>
                    {product.title && <div style={{ fontSize: '0.78rem', color: '#98a2b3' }}>{product.title}</div>}
                  </td>
                  <td><span className={styles.typePill}>{product.type}</span></td>
                  <td>
                    <div className={styles.catCell}>
                      {product.category || '-'}
                      {product.subcategory && <div style={{ fontSize: '0.78rem' }}>→ {product.subcategory}</div>}
                    </div>
                  </td>
                  <td className={styles.priceCell}>{formatPrice(product.defaultSalePrice, product.currency)}</td>
                  <td className={styles.stockCell}>{formatPrice(product.defaultCost * product.stock, product.currency)}</td>
                  <td className={styles.stockCell}>{formatPrice(product.defaultSalePrice * product.stock, product.currency)}</td>
                  <td className={styles.stockCell}>{product.stock}</td>
                  <td>
                    <span className={`${styles.statusDot} ${getStatusClass(product.status)}`}>
                      <span style={{ width: '0.4rem', height: '0.4rem', background: 'currentColor', borderRadius: '50%', display: 'inline-block', marginRight: '0.3rem' }}></span>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    {hasVariants ? (
                      <button
                        className={styles.variantBtn}
                        onClick={() => setVariantPopup({ id: product._id, variants: product.variants! })}
                        title="View variant details"
                      >
                       {product.variants!.length} variant{product.variants!.length > 1 ? 's' : ''}
                      </button>
                    ) : (
                      <span style={{ color: '#98a2b3', fontSize: '0.85rem', fontStyle: 'italic' }}>No variants</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                        onClick={() => onEdit && onEdit(product)}
                      >
                        ✎ Edit
                      </button>
                      {deleteConfirmId === product._id ? (
                        <div className={styles.deleteConfirm}>
                          <button className={styles.confirmBtn} onClick={() => handleDelete(product._id)}>Delete</button>
                          <button className={styles.cancelBtn} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          onClick={() => setDeleteConfirmId(product._id)}
                        >
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Variant Detail Popup */}
      {variantPopup && (
        <div className={styles.modalOverlay} onClick={() => setVariantPopup(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setVariantPopup(null)}>×</button>
            <h3 className={styles.modalTitle}>Variant Details</h3>
            <p className={styles.kicker} style={{ marginBottom: '1rem' }}>
              {variantPopup.variants.length} variant{variantPopup.variants.length > 1 ? 's' : ''}
            </p>
            {variantPopup.variants.map((v, vi) => {
              const vProfit = (v.salePrice || 0) - (v.costPrice || 0);
              const vTotalStockValue = (v.salePrice || 0) * v.stock;
              const vTotalCostValue = (v.costPrice || 0) * v.stock;
              return (
                <div key={vi} className={styles.variantPopupCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1rem', color: '#101828' }}>{v.name || 'Unnamed Variant'}</strong>
                    {v.sku && <span className={styles.skuPill}>{v.sku}</span>}
                  </div>
                  <div className={styles.variantPopupGrid}>
                    <div className={styles.variantPopupItem}>
                      <span className={styles.variantPopupLabel}>Stock</span>
                      <span className={styles.variantPopupValue}>{v.stock}</span>
                    </div>
                    <div className={styles.variantPopupItem}>
                      <span className={styles.variantPopupLabel}>Sale Price</span>
                      <span className={styles.variantPopupValue}>{formatPrice(v.salePrice || 0, 'USD')}</span>
                    </div>
                    <div className={styles.variantPopupItem}>
                      <span className={styles.variantPopupLabel}>Cost Price</span>
                      <span className={styles.variantPopupValue}>{formatPrice(v.costPrice || 0, 'USD')}</span>
                    </div>
                    <div className={styles.variantPopupItem}>
                      <span className={styles.variantPopupLabel}>Profit per unit</span>
                      <span className={`${styles.variantPopupValue} ${vProfit >= 0 ? styles.profitPositive : styles.profitNegative}`}>
                        {formatPrice(vProfit, 'USD')}
                      </span>
                    </div>
                    <div className={styles.variantPopupItem}>
                      <span className={styles.variantPopupLabel}>Total Stock Value (Sale)</span>
                      <span className={styles.variantPopupValue}>{formatPrice(vTotalStockValue, 'USD')}</span>
                    </div>
                    <div className={styles.variantPopupItem}>
                      <span className={styles.variantPopupLabel}>Total Stock Value (Cost)</span>
                      <span className={styles.variantPopupValue}>{formatPrice(vTotalCostValue, 'USD')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}