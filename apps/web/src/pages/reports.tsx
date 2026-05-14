import { useState, useEffect, useCallback, useRef } from 'react';
import DataTable from '../components/ui/DataTable';
import { RequireAuth } from '../components/auth/RequireAuth';
import LoaderPulse from '../components/Loader/Loader';
import { usePagination } from '../hooks/usePagination';
import { useSystemSettings } from '../hooks/useSystemSettings';

const API_BASE = 'http://localhost:4000/api/v1';

// ─── Interfaces ───────────────────────────────────────────
interface InvoiceItem {
  _id: string;
  invoiceNo?: string;
  clientName?: string;
  totalCents?: number;
  status?: string;
  createdAt?: string;
  dueDate?: string;
}

interface OrderItem {
  _id: string;
  orderNo?: string;
  clientName?: string;
  status?: string;
  createdAt?: string;
  lines?: Array<{ lineTotalCents: number; qty: number }>;
  currency?: string;
}

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
  type: string;
  category?: string;
  subcategory?: string;
  defaultSalePrice: number;
  defaultCost: number;
  currency: string;
  stock: number;
  status: string;
  variants: ProductVariant[];
}

interface MonthlySales {
  month: string;
  year: number;
  monthLabel: string;
  orderCount: number;
  totalCents: number;
  currency: string;
}

// ─── Column defs ───────────────────────────────────────────
const reportColumns = [
  { key: 'select', label: '' },
  { key: 'reportId', label: 'Report ID' },
  { key: 'report', label: 'Report' },
  { key: 'window', label: 'Reporting Window' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action' },
];

// ─── Styles ────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  section: {
    background: '#fff',
    border: '1px solid #e4e7ec',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e4e7ec',
    background: '#f9fafb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#101828',
    margin: 0,
  },
  sectionSub: {
    fontSize: '0.8rem',
    color: '#667085',
    margin: '0.15rem 0 0 0',
  },
  sectionBody: { padding: '1.5rem' },
  filterBar: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  searchInput: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '0.85rem',
    flex: '1 1 200px',
    minWidth: '150px',
    outline: 'none',
  },
  selectFilter: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '0.85rem',
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
  },
  btn: {
    padding: '0.5rem 1rem',
    border: '1px solid #d0d5dd',
    borderRadius: '8px',
    fontSize: '0.85rem',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  btnPrimary: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    background: '#0d5c63',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  summaryRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  summaryCard: {
    background: '#f9fafb',
    border: '1px solid #e4e7ec',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    flex: '1 1 150px',
    minWidth: '120px',
  },
  summaryLabel: { display: 'block', fontSize: '0.75rem', color: '#667085', marginBottom: '0.2rem' },
  summaryValue: { display: 'block', fontSize: '1.1rem', fontWeight: 700, color: '#101828' },
  stockTable: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85rem' },
  stockTh: { textAlign: 'left' as const, padding: '0.6rem 0.75rem', borderBottom: '2px solid #e4e7ec', color: '#667085', fontWeight: 600 },
  stockTd: { padding: '0.6rem 0.75rem', borderBottom: '1px solid #f0f0f0', color: '#344054' },
  lowStock: { color: '#b42318', fontWeight: 600 },
  variantTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.78rem',
    background: '#f2f4f7',
    color: '#344054',
    margin: '0.15rem',
  },
  variantStock: { fontWeight: 600, color: '#0d5c63' },
  scrollTable: { overflowX: 'auto' as const },
  monthChart: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' },
  monthCard: {
    background: '#f9fafb',
    border: '1px solid #e4e7ec',
    borderRadius: '8px',
    padding: '0.75rem',
    textAlign: 'center' as const,
  },
  monthLabel: { fontSize: '0.78rem', color: '#667085', display: 'block' },
  monthAmount: { fontSize: '1rem', fontWeight: 700, color: '#101828', display: 'block', marginTop: '0.25rem' },
  monthOrders: { fontSize: '0.75rem', color: '#98a2b3', display: 'block', marginTop: '0.15rem' },

  // Print styles overlay
  printable: { padding: '1.5rem' },
};

// ─── Helpers ──────────────────────────────────────────────
function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(cents / 100);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

// ─── Component ────────────────────────────────────────────
export default function ReportsPage() {
  // ── Data state ──
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'stock' | 'sales'>('invoices');

  // ── Stock filters ──
  const [stockSearch, setStockSearch] = useState('');
  const [stockType, setStockType] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // ── Month filter ──
  const [salesYear, setSalesYear] = useState(new Date().getFullYear());

  // ── Hooks ──
  const { getPaginationItemsPerPage } = useSystemSettings();
  const pagination = usePagination(getPaginationItemsPerPage());
  const printRef = useRef<HTMLDivElement>(null);

  // ── Auth ──
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // ── Fetch invoices/orders ──
  const fetchInvoicesOrders = useCallback(async (limit: number = 10, skip: number = 0) => {
    try {
      const [invRes, ordRes] = await Promise.all([
        window.fetch(`${API_BASE}/invoices?limit=${limit}&skip=${skip}`, { headers }).catch(() => null),
        window.fetch(`${API_BASE}/billing/orders?limit=${limit}&skip=${skip}`, { headers }).catch(() => null),
      ]);
      let invTotal = 0, ordTotal = 0;
      if (invRes) {
        const j = await invRes.json();
        if (j.success) { setInvoices(j.data || []); invTotal = j.pagination?.total || 0; }
      }
      if (ordRes) {
        const j = await ordRes.json();
        if (j.success) { setOrders(j.data || []); ordTotal = j.pagination?.total || 0; }
      }
      pagination.setTotalItems(invTotal + ordTotal);
    } catch { /* silent */ }
  }, []);

  // ── Fetch products (stock) ──
  const fetchProducts = useCallback(async () => {
    try {
      const res = await window.fetch(`${API_BASE}/inventory/products?limit=500`, { headers });
      const j = await res.json();
      if (j.success) setProducts(j.data || []);
    } catch { /* silent */ }
  }, []);

  // ── Fetch all monthly orders for sales ──
  const [allOrders, setAllOrders] = useState<OrderItem[]>([]);

  const fetchAllOrders = useCallback(async () => {
    try {
      const res = await window.fetch(`${API_BASE}/billing/orders?limit=5000`, { headers });
      const j = await res.json();
      if (j.success) setAllOrders(j.data || []);
    } catch { /* silent */ }
  }, []);

  // ── Initial load ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchInvoicesOrders(pagination.pageParams.limit, pagination.pageParams.skip),
      fetchProducts(),
      fetchAllOrders(),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, []);

  // ── Filtered products ──
  const filteredProducts = products.filter(p => {
    if (stockSearch) {
      const q = stockSearch.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    if (stockType && p.type !== stockType) return false;
    if (stockStatus && p.status !== stockStatus) return false;
    if (lowStockOnly && p.stock > 5) {
      const hasLowVariant = p.variants?.some(v => v.stock <= 5);
      if (p.stock > 5 && !hasLowVariant) return false;
    }
    return true;
  });

  // ── Monthly sales ──
  const monthlySales: MonthlySales[] = (() => {
    const map = new Map<string, MonthlySales>();
    const yearOrders = allOrders.filter(o => {
      if (!o.createdAt) return false;
      const d = new Date(o.createdAt);
      return d.getFullYear() === salesYear && o.status !== 'cancelled';
    });
    for (const o of yearOrders) {
      if (!o.createdAt) continue;
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const total = o.lines?.reduce((s, l) => s + (l.lineTotalCents || 0), 0) || 0;
      const existing = map.get(key);
      if (existing) {
        existing.orderCount++;
        existing.totalCents += total;
      } else {
        map.set(key, { month: key, year: salesYear, monthLabel: label, orderCount: 1, totalCents: total, currency: o.currency || 'USD' });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  })();

  const grandTotalCents = monthlySales.reduce((s, m) => s + m.totalCents, 0);
  const grandTotalOrders = monthlySales.reduce((s, m) => s + m.orderCount, 0);

  // ── Stock totals ──
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const totalStockValue = products.reduce((s, p) => s + (p.defaultCost || 0) * p.stock, 0);
  const totalSaleValue = products.reduce((s, p) => s + (p.defaultSalePrice || 0) * p.stock, 0);
  const lowStockCount = products.filter(p => {
    if (p.stock <= 5) return true;
    return p.variants?.some(v => v.stock <= 5);
  }).length;

  // ── Invoice/order rows for DataTable ──
  const invoiceRows = invoices.map(inv => {
    const invNo = inv.invoiceNo || `INV-${inv._id.slice(-6)}`;
    return {
      id: `inv-${inv._id}`,
      cells: [
        { type: 'checkbox' as const, label: `Select ${invNo}` },
        { type: 'pill' as const, text: `#${invNo}` },
        { type: 'member' as const, title: `Invoice ${invNo}`, subtitle: inv.clientName ? `Client: ${inv.clientName}` : 'N/A' },
        { type: 'stack' as const, title: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A', subtitle: inv.dueDate ? `Due: ${new Date(inv.dueDate).toLocaleDateString()}` : '' },
        { type: 'status' as const, label: inv.status || 'pending', tone: (inv.status === 'paid' ? 'active' : inv.status === 'overdue' ? 'warning' : 'accent') as any },
        { type: 'action' as const, label: `Actions for ${invNo}`, onEdit: () => window.alert(`View invoice ${invNo}`), onDelete: () => {} },
      ],
    };
  });

  const orderRows = orders.map(o => {
    const orderNo = o.orderNo || `ORD-${o._id.slice(-6)}`;
    return {
      id: `ord-${o._id}`,
      cells: [
        { type: 'checkbox' as const, label: `Select ${orderNo}` },
        { type: 'pill' as const, text: `#${orderNo}` },
        { type: 'member' as const, title: `Order ${orderNo}`, subtitle: o.clientName ? `Client: ${o.clientName}` : 'N/A' },
        { type: 'stack' as const, title: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A', subtitle: o.status || '' },
        { type: 'status' as const, label: o.status || 'pending', tone: (o.status === 'completed' ? 'active' : o.status === 'cancelled' ? 'inactive' : 'warning') as any },
        { type: 'action' as const, label: `Actions for ${orderNo}`, onEdit: () => window.alert(`View order ${orderNo}`), onDelete: () => {} },
      ],
    };
  });

  const reportRows = [...invoiceRows, ...orderRows];
  const totalCount = invoices.length + orders.length;

  // ── Print handler ──
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { window.alert('Please allow pop-ups for printing'); return; }
    const content = printRef.current?.innerHTML || '';
    const title = `I-ITSM Report - ${new Date().toLocaleDateString()}`;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #101828; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        th, td { border: 1px solid #d0d5dd; padding: 6px 8px; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        h2 { margin-top: 24px; }
        .summary { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .summary-card { border: 1px solid #e4e7ec; padding: 8px 12px; border-radius: 6px; }
        .summary-label { font-size: 11px; color: #667085; }
        .summary-value { font-size: 16px; font-weight: 700; }
        .variant-tag { display: inline-block; margin: 2px; padding: 2px 6px; border: 1px solid #d0d5dd; border-radius: 3px; font-size: 11px; }
        .low-stock { color: #b42318; font-weight: bold; }
        .no-print { display: none; }
        .page-break { page-break-before: always; }
      </style></head><body>
      <h1>I-ITSM Reports</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      ${content}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // ── Render ──
  return (
    <RequireAuth>
      <div style={{ padding: '1rem', fontFamily: 'Inter, sans-serif' }}>
        {/* ─── Header ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#101828', margin: 0 }}>Reports Center</h1>
            <p style={{ fontSize: '0.85rem', color: '#667085', margin: '0.25rem 0 0 0' }}>Stock overview, monthly sales, invoices & orders</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={S.btnPrimary} onClick={handlePrint}>
             Print / PDF
            </button>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '2px solid #e4e7ec' }}>
          {(['invoices', 'stock', 'sales'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.6rem 1.25rem', border: 'none', background: 'transparent',
                fontSize: '0.9rem', fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? '#0d5c63' : '#667085',
                borderBottom: activeTab === tab ? '2px solid #0d5c63' : '2px solid transparent',
                marginBottom: '-2px', cursor: 'pointer', textTransform: 'capitalize',
              }}
            >{tab === 'invoices' ? 'Invoices & Orders' : tab === 'stock' ? 'Stock Overview' : 'Monthly Sales'}</button>
          ))}
        </div>

        {loading ? (
          <LoaderPulse />
        ) : (
          <div ref={printRef}>
            {/* ════════════════ TAB: INVOICES ════════════════ */}
            {activeTab === 'invoices' && (
              <DataTable
                kicker="Invoices & Orders"
                heading="Transactions overview"
                meta={[`${totalCount} total`, `${invoices.length} invoices`, `${orders.length} orders`]}
                columns={reportColumns}
                rows={reportRows}
                pagination={{
                  currentPage: pagination.currentPage,
                  totalPages: pagination.totalPages,
                  totalItems: pagination.totalItems,
                  itemsPerPage: pagination.itemsPerPage,
                  onPageChange: pagination.setCurrentPage,
                  onItemsPerPageChange: pagination.setItemsPerPage,
                }}
              />
            )}

            {/* ════════════════ TAB: STOCK OVERVIEW ════════════════ */}
            {activeTab === 'stock' && (
              <div style={S.section}>
                <div style={S.sectionHeader}>
                  <div>
                    <h3 style={S.sectionTitle}>Stock Overview</h3>
                    <p style={S.sectionSub}>Real-time inventory levels across products and variants</p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div style={S.sectionBody}>
                  <div style={S.summaryRow}>
                    <div style={S.summaryCard}>
                      <span style={S.summaryLabel}>Total Products</span>
                      <span style={S.summaryValue}>{formatNumber(totalProducts)}</span>
                    </div>
                    <div style={S.summaryCard}>
                      <span style={S.summaryLabel}>Total Stock Units</span>
                      <span style={S.summaryValue}>{formatNumber(totalStock)}</span>
                    </div>
                    <div style={S.summaryCard}>
                      <span style={S.summaryLabel}>Stock Value (Cost)</span>
                      <span style={S.summaryValue}>{formatCurrency(totalStockValue * 100)}</span>
                    </div>
                    <div style={S.summaryCard}>
                      <span style={S.summaryLabel}>Sale Value</span>
                      <span style={S.summaryValue}>{formatCurrency(totalSaleValue * 100)}</span>
                    </div>
                    <div style={{ ...S.summaryCard, borderColor: lowStockCount > 0 ? '#fecdca' : '#e4e7ec' }}>
                      <span style={S.summaryLabel}> Low Stock Items</span>
                      <span style={{ ...S.summaryValue, color: lowStockCount > 0 ? '#b42318' : '#067647' }}>{formatNumber(lowStockCount)}</span>
                    </div>
                  </div>

                  {/* Filters */}
                  <div style={S.filterBar}>
                    <input style={S.searchInput} type="text" placeholder="Search by name or SKU..." value={stockSearch} onChange={e => setStockSearch(e.target.value)} />
                    <select style={S.selectFilter} value={stockType} onChange={e => setStockType(e.target.value)}>
                      <option value="">All Types</option>
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="component">Component</option>
                      <option value="other">Other</option>
                    </select>
                    <select style={S.selectFilter} value={stockStatus} onChange={e => setStockStatus(e.target.value)}>
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#344054', cursor: 'pointer' }}>
                      <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} />
                      Low stock only (≤ 5)
                    </label>
                    <span style={{ fontSize: '0.8rem', color: '#98a2b3' }}>{filteredProducts.length} shown</span>
                  </div>

                  {/* Stock Table */}
                  <div style={S.scrollTable}>
                    <table style={S.stockTable}>
                      <thead>
                        <tr>
                          <th style={S.stockTh}>SKU</th>
                          <th style={S.stockTh}>Name</th>
                          <th style={S.stockTh}>Type</th>
                          <th style={S.stockTh}>Category</th>
                          <th style={S.stockTh}>Unit Price</th>
                          <th style={S.stockTh}>Total Stock</th>
                          <th style={S.stockTh}>Stock Value</th>
                          <th style={S.stockTh}>Variants</th>
                          <th style={S.stockTh}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.length === 0 ? (
                          <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#98a2b3' }}>No products match your filters</td></tr>
                        ) : (
                          filteredProducts.map(p => {
                            const isLowStock = p.stock <= 5;
                            const hasLowVariant = p.variants?.some(v => v.stock <= 5);
                            return (
                              <tr key={p._id}>
                                <td style={S.stockTd}><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.sku}</span></td>
                                <td style={S.stockTd}><strong>{p.name}</strong></td>
                                <td style={S.stockTd}>{p.type}</td>
                                <td style={S.stockTd}>{p.category || '-'}{p.subcategory ? ` → ${p.subcategory}` : ''}</td>
                                <td style={S.stockTd}>{formatCurrency((p.defaultSalePrice || 0) * 100, p.currency)}</td>
                                <td style={{ ...S.stockTd, ...(isLowStock ? S.lowStock : {}) }}>{formatNumber(p.stock)}</td>
                                <td style={S.stockTd}>{formatCurrency((p.defaultCost || 0) * p.stock * 100, p.currency)}</td>
                                <td style={S.stockTd}>
                                  {p.variants && p.variants.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                      {p.variants.map((v, vi) => (
                                        <span key={vi} style={{ ...S.variantTag, ...(v.stock <= 5 ? { borderColor: '#fecdca', color: '#b42318' } : {}) }}>
                                          {v.name}
                                          <span style={{ ...S.variantStock, ...(v.stock <= 5 ? { color: '#b42318' } : {}) }}>
                                            {formatNumber(v.stock)}
                                          </span>
                                          {v.sku && <span style={{ fontSize: '0.7rem', color: '#98a2b3', marginLeft: '0.15rem' }}>({v.sku})</span>}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ color: '#98a2b3', fontStyle: 'italic' }}>No variants</span>
                                  )}
                                  {hasLowVariant && <span style={{ marginLeft: '0.35rem', color: '#b42318', fontSize: '0.75rem' }}>⚠️</span>}
                                </td>
                                <td style={S.stockTd}>
                                  <span style={{
                                    padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500,
                                    background: p.status === 'active' ? '#ecfdf3' : p.status === 'inactive' ? '#f2f4f7' : '#fef3f2',
                                    color: p.status === 'active' ? '#067647' : p.status === 'inactive' ? '#344054' : '#b42318',
                                  }}>{p.status}</span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════ TAB: MONTHLY SALES ════════════════ */}
            {activeTab === 'sales' && (
              <div style={S.section}>
                <div style={S.sectionHeader}>
                  <div>
                    <h3 style={S.sectionTitle}>Month-on-Month Sales</h3>
                    <p style={S.sectionSub}>Revenue breakdown by month for completed/confirmed orders</p>
                  </div>
                  <select style={S.selectFilter} value={salesYear} onChange={e => setSalesYear(Number(e.target.value))}>
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div style={S.sectionBody}>
                  {/* Year summary */}
                  <div style={S.summaryRow}>
                    <div style={S.summaryCard}>
                      <span style={S.summaryLabel}>Year</span>
                      <span style={S.summaryValue}>{salesYear}</span>
                    </div>
                    <div style={S.summaryCard}>
                      <span style={S.summaryLabel}>Total Orders</span>
                      <span style={S.summaryValue}>{formatNumber(grandTotalOrders)}</span>
                    </div>
                    <div style={S.summaryCard}>
                      <span style={S.summaryLabel}>Total Revenue</span>
                      <span style={S.summaryValue}>{formatCurrency(grandTotalCents)}</span>
                    </div>
                    <div style={S.summaryCard}>
                      <span style={S.summaryLabel}>Avg per Month</span>
                      <span style={S.summaryValue}>{monthlySales.length > 0 ? formatCurrency(Math.round(grandTotalCents / monthlySales.length)) : formatCurrency(0)}</span>
                    </div>
                  </div>

                  {/* Monthly grid */}
                  {monthlySales.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#98a2b3' }}>
                      No completed orders found for {salesYear}
                    </div>
                  ) : (
                    <>
                      <div style={S.monthChart}>
                        {monthlySales.map(m => (
                          <div key={m.month} style={S.monthCard}>
                            <span style={S.monthLabel}>{m.monthLabel}</span>
                            <span style={S.monthAmount}>{formatCurrency(m.totalCents)}</span>
                            <span style={S.monthOrders}>{m.orderCount} order{m.orderCount !== 1 ? 's' : ''}</span>
                          </div>
                        ))}
                      </div>

                      {/* Detailed table */}
                      <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                        <table style={S.stockTable}>
                          <thead>
                            <tr>
                              <th style={S.stockTh}>Month</th>
                              <th style={S.stockTh}>Orders</th>
                              <th style={S.stockTh}>Revenue</th>
                              <th style={S.stockTh}>% of Year</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlySales.map(m => {
                              const pct = grandTotalCents > 0 ? ((m.totalCents / grandTotalCents) * 100).toFixed(1) : '0.0';
                              return (
                                <tr key={m.month}>
                                  <td style={S.stockTd}><strong>{m.monthLabel}</strong></td>
                                  <td style={S.stockTd}>{formatNumber(m.orderCount)}</td>
                                  <td style={S.stockTd}>{formatCurrency(m.totalCents)}</td>
                                  <td style={S.stockTd}>{pct}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td style={{ ...S.stockTh, fontWeight: 700 }}>Total</td>
                              <td style={{ ...S.stockTh, fontWeight: 700 }}>{formatNumber(grandTotalOrders)}</td>
                              <td style={{ ...S.stockTh, fontWeight: 700 }}>{formatCurrency(grandTotalCents)}</td>
                              <td style={{ ...S.stockTh, fontWeight: 700 }}>100%</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}