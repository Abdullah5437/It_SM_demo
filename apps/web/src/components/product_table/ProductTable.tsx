import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import styles from './ProductTable.module.css';
import LoaderPulse from '../Loader/Loader';
import BarcodePrint from './BarcodePrint';

// Dynamic import for JsBarcode (client-side only)
let JsBarcode: any = null;

interface ProductSize {
  name: string;
  stock: number;
}

interface Product {
  _id: string;
  sku: string;
  name: string;
  title?: string;
  description?: string;
  type: string;
  defaultSalePrice: number;
  defaultCost: number;
  currency: string;
  stock: number;
  status: string;
  sizes?: ProductSize[];
  createdAt: string;
}

interface ProductTableProps {
  onEdit?: (product: Product) => void;
  onRefresh?: () => void;
  refreshKey?: number;
}

function BarcodeCell({ sku }: { sku: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!JsBarcode) {
      import('jsbarcode').then(mod => {
        JsBarcode = mod.default || mod;
        if (svgRef.current) {
          try {
            JsBarcode(svgRef.current, sku, {
              format: 'CODE128',
              width: 1,
              height: 25,
              displayValue: false,
              margin: 2,
              background: '#ffffff',
            });
          } catch {
            // silent
          }
        }
      });
    } else if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, sku, {
          format: 'CODE128',
          width: 1,
          height: 25,
          displayValue: false,
          margin: 2,
          background: '#ffffff',
        });
      } catch {
        // silent
      }
    }
  }, [sku]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
      <svg ref={svgRef} style={{ width: '100%', maxWidth: '100px' }}></svg>
      <span style={{ fontSize: '0.65rem', color: '#667085', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{sku}</span>
    </div>
  );
}

export default function ProductTable({ onEdit, onRefresh, refreshKey }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sizePopup, setSizePopup] = useState<{ id: string; sizes: ProductSize[] } | null>(null);
  const [barcodePrint, setBarcodePrint] = useState<{ items: { sku: string; name: string; salePrice?: number; currency?: string }[]; mode: 'single' | 'all' } | null>(null);
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.type && p.type.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    if (filterType && p.type !== filterType) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  // Calculate totals respecting per-size pricing
  const calcProductCost = (p: Product): number => {
    if (p.sizes && p.sizes.length > 0) {
      return p.sizes.reduce((sum, s) => {
        const qty = s.stock || 0;
        const cp = (s as any).costPrice != null ? Number((s as any).costPrice) : p.defaultCost;
        return sum + cp * qty;
      }, 0);
    }
    return p.defaultCost * p.stock;
  };
  const calcProductSale = (p: Product): number => {
    if (p.sizes && p.sizes.length > 0) {
      return p.sizes.reduce((sum, s) => {
        const qty = s.stock || 0;
        const sp = (s as any).salePrice != null ? Number((s as any).salePrice) : p.defaultSalePrice;
        return sum + sp * qty;
      }, 0);
    }
    return p.defaultSalePrice * p.stock;
  };

  const totalCost = filteredProducts.reduce((sum, p) => sum + calcProductCost(p), 0);
  const totalSale = filteredProducts.reduce((sum, p) => sum + calcProductSale(p), 0);
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setBarcodePrint({
              items: filteredProducts.map(p => ({
                sku: p.sku,
                name: p.name,
                salePrice: p.defaultSalePrice,
                currency: p.currency,
              })),
              mode: 'all',
            })}
            style={{
              padding: '0.6rem 1rem',
              background: '#ffffff',
              color: '#0d5c63',
              border: '1px solid #0d5c63',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
             Print All Barcodes
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}></span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by name, SKU, type..."
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
          <option value="Mens">Mens</option>
          <option value="Women">Women</option>
          <option value="Children">Children</option>
          <option value="Other">Other</option>
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
          <span className={styles.summaryValue}>{formatPrice(totalCost, 'PKR')}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Sale Value</span>
          <span className={styles.summaryValue}>{formatPrice(totalSale, 'PKR')}</span>
        </div>
        <div className={`${styles.summaryCard} ${totalProfit >= 0 ? styles.profitPositive : styles.profitNegative}`}>
          <span className={styles.summaryLabel}>Est. Profit</span>
          <span className={styles.summaryValue}>{formatPrice(totalProfit, 'PKR')}</span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Barcode / SKU</th>
              <th>Name</th>
              <th>Type</th>
              <th>Unit Price</th>
              <th>Cost × Stock</th>
              <th>Sale × Stock</th>
              <th>Total Stock</th>
              <th>Status</th>
              <th>Sizes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <div className={styles.emptyState}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No products match your search</p>
                    <p style={{ fontSize: '0.9rem', color: '#98a2b3' }}>Try adjusting your search or filter criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
            filteredProducts.map(product => {
              const hasSizes = product.sizes && product.sizes.length > 0;
              
              // Calculate size-based metrics
              let avgSalePrice = product.defaultSalePrice;
              let totalCostValue = product.defaultCost * product.stock;
              let totalSaleValue = product.defaultSalePrice * product.stock;
              
              if (hasSizes) {
                let totalSizeStock = 0;
                let weightedSaleSum = 0;
                let weightedCostSum = 0;
                
                for (const s of product.sizes!) {
                  const qty = s.stock || 0;
                  totalSizeStock += qty;
                  const sp = (s as any).salePrice != null ? Number((s as any).salePrice) : product.defaultSalePrice;
                  const cp = (s as any).costPrice != null ? Number((s as any).costPrice) : product.defaultCost;
                  weightedSaleSum += sp * qty;
                  weightedCostSum += cp * qty;
                }
                
                avgSalePrice = totalSizeStock > 0 ? weightedSaleSum / totalSizeStock : product.defaultSalePrice;
                totalCostValue = weightedCostSum;
                totalSaleValue = weightedSaleSum;
              }
              
              return (
                <tr key={product._id}>
                  <td>
                    <BarcodeCell sku={product.sku} />
                  </td>
                  <td>
                    <div className={styles.nameCell}>{product.name}</div>
                    {product.title && <div style={{ fontSize: '0.78rem', color: '#98a2b3' }}>{product.title}</div>}
                  </td>
                  <td><span className={styles.typePill}>{product.type}</span></td>
                  <td className={styles.priceCell}>
                    {formatPrice(avgSalePrice, product.currency)}
                    {hasSizes && <div style={{ fontSize: '0.7rem', color: '#98a2b3', fontWeight: 400 }}>avg across sizes</div>}
                  </td>
                  <td className={styles.stockCell}>{formatPrice(totalCostValue, product.currency)}</td>
                  <td className={styles.stockCell}>{formatPrice(totalSaleValue, product.currency)}</td>
                  <td className={styles.stockCell}>{product.stock}</td>
                  <td>
                    <span className={`${styles.statusDot} ${getStatusClass(product.status)}`}>
                      <span style={{ width: '0.4rem', height: '0.4rem', background: 'currentColor', borderRadius: '50%', display: 'inline-block', marginRight: '0.3rem' }}></span>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    {hasSizes ? (
                      <button
                        className={styles.variantBtn}
                        onClick={() => setSizePopup({ id: product._id, sizes: product.sizes! })}
                        title="View size details"
                      >
                       {product.sizes!.length} size{product.sizes!.length > 1 ? 's' : ''}
                      </button>
                    ) : (
                      <span style={{ color: '#98a2b3', fontSize: '0.85rem', fontStyle: 'italic' }}>No sizes</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnBarcode}`}
                        onClick={() => setBarcodePrint({
                          items: [{
                            sku: product.sku,
                            name: product.name,
                            salePrice: product.defaultSalePrice,
                            currency: product.currency,
                          }],
                          mode: 'single',
                        })}
                        title="Print barcode for this product"
                        style={{
                          borderColor: '#0d5c63',
                          color: '#0d5c63',
                        }}
                      >
                         Barcode
                      </button>
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

      {/* Size Detail Popup */}
      {sizePopup && (
        <div className={styles.modalOverlay} onClick={() => setSizePopup(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSizePopup(null)}>×</button>
            <h3 className={styles.modalTitle}>Size Details</h3>
            <p className={styles.kicker} style={{ marginBottom: '1rem' }}>
              {sizePopup.sizes.length} size{sizePopup.sizes.length > 1 ? 's' : ''}
            </p>
            {sizePopup.sizes.map((s, vi) => {
              const hasSalePrice = (s as any).salePrice != null;
              const hasCostPrice = (s as any).costPrice != null;
              return (
                <div key={vi} className={styles.variantPopupCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1rem', color: '#101828' }}>{s.name}</strong>
                  </div>
                  <div className={styles.variantPopupGrid}>
                    <div className={styles.variantPopupItem}>
                      <span className={styles.variantPopupLabel}>Stock</span>
                      <span className={styles.variantPopupValue}>{s.stock}</span>
                    </div>
                    {hasSalePrice && (
                      <div className={styles.variantPopupItem}>
                        <span className={styles.variantPopupLabel}>Sale Price</span>
                        <span className={styles.variantPopupValue}>${Number((s as any).salePrice).toFixed(2)}</span>
                      </div>
                    )}
                    {hasCostPrice && (
                      <div className={styles.variantPopupItem}>
                        <span className={styles.variantPopupLabel}>Cost Price</span>
                        <span className={styles.variantPopupValue}>${Number((s as any).costPrice).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barcode Print Modal */}
      {barcodePrint && (
        <BarcodePrint
          items={barcodePrint.items}
          mode={barcodePrint.mode}
          onClose={() => setBarcodePrint(null)}
        />
      )}
    </div>
  );
}