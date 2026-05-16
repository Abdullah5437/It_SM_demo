
import { useState, useRef, useEffect, useCallback } from 'react';
import { RequireAuth } from "../components/auth/RequireAuth";
import styles from "../components/product_table/ProductTable.module.css";
import { toast } from 'react-toastify';

interface ProductSize {
  name: string;
  stock: number;
  salePrice?: number;
  costPrice?: number;
}

interface Product {
  _id: string;
  sku: string;
  name: string;
  title?: string;
  defaultSalePrice: number;
  defaultCost: number;
  currency: string;
  stock: number;
  sizes?: ProductSize[];
}

interface CartItem {
  id: string; // unique key for the cart entry
  product: Product;
  sizeName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export default function ScanOrderPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [searching, setSearching] = useState(false);
  const [skuInput, setSkuInput] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Auto-focus the scan input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const lookupProduct = useCallback(async (sku: string) => {
    const trimmed = sku.trim().toUpperCase();
    if (!trimmed) return;

    setSearching(true);
    try {
      const res = await window.fetch(
        `https://aquamarine-stork-973169.hostingersite.com/api/v1/inventory/products?limit=100`,
        { headers }
      );
      const json = await res.json();
      if (json.success) {
        const found = (json.data as Product[]).find(
          (p: Product) => p.sku.toUpperCase() === trimmed
        );
        if (found) {
          setProduct(found);
          setSelectedSize('');
          setQuantity(1);
          setUnitPrice(found.defaultSalePrice);
          toast.success(`Found: ${found.name}`);
        } else {
          toast.error(`Product with SKU "${trimmed}" not found`);
          setProduct(null);
        }
      }
    } catch {
      toast.error('Network error looking up product');
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSkuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupProduct(skuInput);
  };

  const handleSizeChange = (sizeName: string) => {
    setSelectedSize(sizeName);
    if (product && product.sizes) {
      const found = product.sizes.find(s => s.name === sizeName);
      if (found && found.salePrice != null) {
        setUnitPrice(found.salePrice);
      } else {
        setUnitPrice(product.defaultSalePrice);
      }
    }
  };

  const addToCart = () => {
    if (!product) return;

    const lineTotal = quantity * unitPrice;

    const item: CartItem = {
      id: `${product._id}-${selectedSize || 'nosize'}-${Date.now()}`,
      product,
      sizeName: selectedSize,
      qty: quantity,
      unitPrice,
      lineTotal,
    };

    setCart(prev => [...prev, item]);

    // Reset for next scan
    setProduct(null);
    setSkuInput('');
    setSelectedSize('');
    setQuantity(1);
    setUnitPrice(0);
    inputRef.current?.focus();
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setProduct(null);
    setSkuInput('');
    setSelectedSize('');
    setQuantity(1);
    setUnitPrice(0);
    setClientName('');
    setShowConfirm(false);
    inputRef.current?.focus();
  };

  const handlePlaceOrder = async () => {
    if (!clientName.trim()) {
      toast.error('Please enter a client name');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      const lines = cart.map((item, idx) => ({
        lineNo: idx + 1,
        itemType: 'product' as const,
        description: item.sizeName
          ? `${item.product.name} - ${item.sizeName}`
          : item.product.name,
        qty: item.qty,
        unitPriceCents: Math.round(item.unitPrice * 100),
        taxRateBps: 0,
        lineTotalCents: Math.round(item.lineTotal * 100),
        productId: item.product._id,
        variantName: item.sizeName || undefined,
      }));

      const payload = {
        clientName: clientName.trim(),
        clientEmail: undefined,
        currency: product?.currency || 'PKR',
        lines,
      };

      const res = await window.fetch('https://aquamarine-stork-973169.hostingersite.com/api/v1/billing/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to create order');
        setSubmitting(false);
        return;
      }

      toast.success(`Order ${result.data?.orderNo || ''} created successfully!`);
      clearCart();
    } catch {
      toast.error('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <RequireAuth>
      <div style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto' }}>
        <div className={styles.container}>
          <div className={styles.tableHeader}>
            <div>
              <p className={styles.kicker}>Point of Sale / Barcode Scan</p>
              <h3 className={styles.heading}>
                Scan & Order ({cart.length} item{cart.length !== 1 ? 's' : ''})
              </h3>
            </div>
          </div>

          {/* Client Name */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Client Name *</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. John Doe"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
            />
          </div>

          {/* Barcode/SKU Scanner */}
          <form onSubmit={handleSkuSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
            <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <label className={styles.label}>Scan SKU / Barcode</label>
              <input
                ref={inputRef}
                className={styles.input}
                type="text"
                placeholder="Scan or type SKU..."
                value={skuInput}
                onChange={e => setSkuInput(e.target.value)}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={searching || !skuInput.trim()}
              style={{
                padding: '0.7rem 1.2rem',
                borderRadius: '0.7rem',
                border: '1px solid #0d5c63',
                background: '#0d5c63',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                opacity: searching || !skuInput.trim() ? 0.6 : 1,
                height: '42px',
              }}
            >
              {searching ? 'Searching...' : 'Lookup'}
            </button>
          </form>

          {/* Scanned Product Details */}
          {product && (
            <div style={{
              border: '1px solid #0d5c63',
              borderRadius: '0.9rem',
              padding: '1rem',
              marginBottom: '1rem',
              background: '#f8fafc',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '1.05rem', color: '#101828' }}>{product.name}</strong>
                  {product.title && <span style={{ fontSize: '0.85rem', color: '#667085', marginLeft: '0.5rem' }}>({product.title})</span>}
                  <br />
                  <span style={{ fontSize: '0.78rem', color: '#667085', fontFamily: 'monospace' }}>SKU: {product.sku}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#667085' }}>
                  Stock: <strong>{product.stock}</strong>
                </span>
              </div>

              <div className={styles.row}>
                {/* Size Select */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Size</label>
                    <div className={styles.selectWrapper}>
                      <select
                        className={styles.selectInput}
                        value={selectedSize}
                        onChange={e => handleSizeChange(e.target.value)}
                      >
                        <option value="">No size</option>
                        {product.sizes.map(s => (
                          <option key={s.name} value={s.name}>
                            {s.name} (Stock: {s.stock})
                          </option>
                        ))}
                      </select>
                      <span className={styles.selectArrow} aria-hidden="true"></span>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Quantity</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                {/* Unit Price */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Sale Price</label>
                  <input
                    className={styles.input}
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Line Total */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Total</label>
                  <input
                    className={styles.input}
                    value={`$${(quantity * unitPrice).toFixed(2)}`}
                    disabled
                    style={{ fontWeight: 700 }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addToCart}
                disabled={quantity < 1 || unitPrice < 0}
                className={styles.saveBtn}
                style={{ marginTop: '0.5rem' }}
              >
                + Add to Cart
              </button>
            </div>
          )}

          {/* Cart / Line Items */}
          {cart.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div className={styles.tableHeader}>
                <div>
                  <p className={styles.kicker}>Order Items</p>
                  <h3 className={styles.heading}>Cart ({cart.length})</h3>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #dc2626',
                    background: '#fff',
                    color: '#dc2626',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Clear All
                </button>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Size</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className={styles.nameCell}>{item.product.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#98a2b3', fontFamily: 'monospace' }}>{item.product.sku}</div>
                        </td>
                        <td>{item.sizeName || <span style={{ color: '#98a2b3', fontStyle: 'italic' }}>N/A</span>}</td>
                        <td className={styles.stockCell}>{item.qty}</td>
                        <td className={styles.priceCell}>${item.unitPrice.toFixed(2)}</td>
                        <td className={styles.priceCell}>${item.lineTotal.toFixed(2)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: '0.4rem',
                              border: '1px solid #fecdca',
                              background: '#fef3f2',
                              color: '#b42318',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                border: '1px solid #eaecf0',
                borderRadius: '0.9rem',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#667085', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Total
                  </span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#101828' }}>
                    ${totalAmount.toFixed(2)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  disabled={submitting || cart.length === 0}
                  className={styles.saveBtn}
                  style={{ maxWidth: '200px', fontSize: '1rem', padding: '0.9rem 1.5rem', marginTop: 0 }}
                >
                  {submitting ? 'Creating...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}

          {cart.length === 0 && !product && (
            <div className={styles.emptyState}>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No items scanned</p>
              <p style={{ fontSize: '0.9rem', color: '#98a2b3' }}>
                Scan a barcode or type a SKU to add products to the order.
              </p>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className={styles.modalOverlay} onClick={() => setShowConfirm(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setShowConfirm(false)}>×</button>
              <h3 className={styles.modalTitle}>Confirm Order</h3>
              <p className={styles.kicker} style={{ marginBottom: '1rem' }}>
                Please review before confirming
              </p>

              <div style={{ marginBottom: '0.75rem' }}>
                <span className={styles.label}>Customer</span>
                <div style={{ fontWeight: 600, color: '#101828' }}>{clientName}</div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <span className={styles.label}>Items ({cart.length})</span>
                {cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0',
                    borderBottom: '1px solid #f1f3f5',
                    fontSize: '0.9rem',
                  }}>
                    <div>
                      {item.product.name}
                      {item.sizeName && <span style={{ color: '#667085' }}> - {item.sizeName}</span>}
                      <span style={{ color: '#98a2b3' }}> × {item.qty}</span>
                    </div>
                    <strong>${item.lineTotal.toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#101828',
                padding: '0.75rem 0',
                borderTop: '2px solid #eaecf0',
                marginTop: '0.5rem',
              }}>
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>

              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.cancelFormBtn}
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                >
                  {submitting ? 'Creating Order...' : 'Confirm & Place Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}