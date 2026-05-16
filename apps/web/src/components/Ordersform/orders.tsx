import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import styles from "./form.module.css";
import LoaderPulse from '../Loader/Loader';

interface ProductSize {
  name: string;
  stock: number;
  salePrice?: number;
  costPrice?: number;
}

interface ProductItem {
  _id: string;
  name: string;
  sku: string;
  defaultSalePrice: number;
  sizes?: ProductSize[];
}

interface ServicePlanItem {
  _id: string;
  name: string;
  price?: number;
}

interface CartItem {
  cartId: string;
  lineNo: number;
  itemType: 'product' | 'service' | 'addon' | 'other';
  description: string;
  qty: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
  productId: string;
  variantName: string;
  servicePlanId?: string;
  serviceAddonId?: string;
}

interface OrderLine {
  lineNo: number;
  itemType: 'product' | 'service' | 'addon' | 'other';
  description: string;
  qty: string;
  unitPrice: string;
  taxRate: string;
  lineTotal: number;
  productId?: string;
  variantName?: string;
  servicePlanId?: string;
  serviceAddonId?: string;
}

interface FormData {
  orderNo: string;
  clientName: string;
  clientEmail: string;
  orderDate: string;
  status: string;
  currency: string;
  lines: OrderLine[];
}

interface EditOrder {
  _id: string;
  orderNo: string;
  clientName: string;
  clientEmail?: string;
  orderDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  currency: string;
  lines: Array<{
    lineNo: number;
    itemType: 'product' | 'service' | 'addon' | 'other';
    description: string;
    qty: number;
    unitPriceCents: number;
    taxRateBps: number;
    lineTotalCents: number;
    productId?: string;
    variantName?: string;
    servicePlanId?: string;
    serviceAddonId?: string;
  }>;
}

interface OrderFormProps {
  editOrder?: EditOrder | null;
  onSuccess?: () => void;
}

let cartIdCounter = 0;

export default function OrderForm({
  editOrder,
  onSuccess,
}: OrderFormProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [, setServicePlans] = useState<ServicePlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Product selection form state (for adding items to cart)
  const [newItemProductId, setNewItemProductId] = useState('');
  const [newItemSize, setNewItemSize] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnitPrice, setNewItemUnitPrice] = useState('');
  const [newItemTaxRate, setNewItemTaxRate] = useState('0');
  const [newItemDescription, setNewItemDescription] = useState('');

  const getInitialData = (): FormData => {
    if (editOrder) {
      return {
        orderNo: editOrder.orderNo,
        clientName: editOrder.clientName,
        clientEmail: editOrder.clientEmail || '',
        orderDate: editOrder.orderDate.split('T')[0],
        status: editOrder.status,
        currency: editOrder.currency,
        lines: editOrder.lines.map((line) => ({
          lineNo: line.lineNo,
          itemType: line.itemType,
          description: line.description,
          qty: String(line.qty),
          unitPrice: String(line.unitPriceCents / 100),
          taxRate: String(line.taxRateBps / 100),
          lineTotal: line.lineTotalCents / 100,
          productId: line.productId,
          variantName: line.variantName,
          servicePlanId: line.servicePlanId,
          serviceAddonId: line.serviceAddonId,
        })),
      };
    }

    return {
      orderNo: '',
      clientName: '',
      clientEmail: '',
      orderDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      currency: 'PKR',
      lines: [],
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialData);

  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('token')
      : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, servicesRes] = await Promise.all([
        window.fetch('http://localhost:4000/api/v1/inventory/products', {
          headers,
        }),
        window.fetch('http://localhost:4000/api/v1/services/plans', {
          headers,
        }),
      ]);

      const productsJson = await productsRes.json();
      const servicesJson = await servicesRes.json();

      if (productsJson.success) {
        setProducts(productsJson.data || []);
      }

      if (servicesJson.success) {
        setServicePlans(servicesJson.data || []);
      }
    } catch (_err) {
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // If editing, populate cart from existing order lines
    if (editOrder) {
      const cartItems: CartItem[] = editOrder.lines.map((line, idx) => ({
        cartId: `edit_${idx}`,
        lineNo: line.lineNo,
        itemType: line.itemType,
        description: line.description,
        qty: line.qty,
        unitPrice: line.unitPriceCents / 100,
        taxRate: line.taxRateBps / 100,
        lineTotal: line.lineTotalCents / 100,
        productId: line.productId || '',
        variantName: line.variantName || '',
        servicePlanId: line.servicePlanId,
        serviceAddonId: line.serviceAddonId,
      }));
      setCart(cartItems);
    }
  }, [fetchData, editOrder]);

  const calculateLineTotal = (
    qty: number,
    unitPrice: number,
    taxRate: number
  ) => {
    const subtotal = qty * unitPrice;
    const tax = subtotal * (taxRate / 100);
    return subtotal + tax;
  };

  const orderSubtotal = cart.reduce((sum, item) => {
    return sum + item.qty * item.unitPrice;
  }, 0);

  const orderTax = cart.reduce((sum, item) => {
    const subtotal = item.qty * item.unitPrice;
    return sum + subtotal * (item.taxRate / 100);
  }, 0);

  const orderTotal = orderSubtotal + orderTax;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---- Product selection helpers ----
  const selectedProduct = newItemProductId
    ? products.find((p) => p._id === newItemProductId)
    : null;
  const selectedProductSize = selectedProduct?.sizes?.find(
    (s) => s.name === newItemSize
  );

  // When product changes, reset size and set default price
  const handleNewItemProductChange = (productId: string) => {
    setNewItemProductId(productId);
    setNewItemSize('');

    const product = products.find((p) => p._id === productId);
    if (!product) {
      setNewItemUnitPrice('');
      setNewItemDescription('');
      return;
    }

    setNewItemDescription(product.name);
    // If product has sizes, don't set price yet - wait for size selection
    if (product.sizes && product.sizes.length > 0) {
      setNewItemUnitPrice('');
    } else {
      setNewItemUnitPrice(String(product.defaultSalePrice));
    }
  };

  // When size changes, update price with the size's salePrice if available
  const handleNewItemSizeChange = (sizeName: string) => {
    setNewItemSize(sizeName);

    if (!selectedProduct) return;
    const size = selectedProduct.sizes?.find((s) => s.name === sizeName);
    if (size && size.salePrice != null) {
      setNewItemUnitPrice(String(size.salePrice));
    } else if (size) {
      // If size has no salePrice, fall back to defaultSalePrice
      setNewItemUnitPrice(String(selectedProduct.defaultSalePrice));
    }
  };

  // Add item to cart
  const handleAddToCart = () => {
    if (!newItemProductId) {
      toast.error('Please select a product');
      return;
    }
    const product = products.find((p) => p._id === newItemProductId);
    if (!product) return;

    if (product.sizes && product.sizes.length > 0 && !newItemSize) {
      toast.error('Please select a size for this product');
      return;
    }

    const qty = Number(newItemQty);
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const unitPrice = Number(newItemUnitPrice);
    if (!unitPrice || unitPrice <= 0) {
      toast.error('Please enter a valid unit price');
      return;
    }

    const taxRate = Number(newItemTaxRate);
    const lineTotal = calculateLineTotal(qty, unitPrice, taxRate);

    cartIdCounter += 1;

    const description =
      newItemDescription ||
      product.name +
        (newItemSize ? ` - ${newItemSize}` : '');

    const newItem: CartItem = {
      cartId: `cart_${cartIdCounter}`,
      lineNo: cart.length + 1,
      itemType: 'product',
      description,
      qty,
      unitPrice,
      taxRate,
      lineTotal,
      productId: product._id,
      variantName: newItemSize || '',
    };

    setCart((prev) => [...prev, newItem]);

    // Reset the product selection form
    setNewItemProductId('');
    setNewItemSize('');
    setNewItemQty('1');
    setNewItemUnitPrice('');
    setNewItemTaxRate('0');
    setNewItemDescription('');

    toast.success(`Added "${description}" to cart`);
  };

  // Remove item from cart
  const handleRemoveFromCart = (cartId: string) => {
    setCart((prev) =>
      prev
        .filter((item) => item.cartId !== cartId)
        .map((item, idx) => ({ ...item, lineNo: idx + 1 }))
    );
  };

  // Edit item in cart - pull it back to the product selection form
  const handleEditCartItem = (item: CartItem) => {
    setNewItemProductId(item.productId);
    setNewItemSize(item.variantName);
    setNewItemQty(String(item.qty));
    setNewItemUnitPrice(String(item.unitPrice));
    setNewItemTaxRate(String(item.taxRate));
    setNewItemDescription(item.description);
    // Remove the old item from cart so it gets re-added
    handleRemoveFromCart(item.cartId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Please add at least one item to the cart');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail || undefined,
        orderDate: formData.orderDate,
        status: formData.status,
        currency: formData.currency,
        lines: cart.map((item) => ({
          lineNo: item.lineNo,
          itemType: item.itemType,
          description: item.description,
          qty: item.qty,
          unitPriceCents: Math.round(item.unitPrice * 100),
          taxRateBps: Math.round(item.taxRate * 100),
          lineTotalCents: Math.round(item.lineTotal * 100),
          productId: item.productId || undefined,
          variantName: item.variantName || undefined,
          servicePlanId: item.servicePlanId || undefined,
          serviceAddonId: item.serviceAddonId || undefined,
        })),
      };

      const isEditing = !!editOrder?._id;

      const url = isEditing
        ? `http://localhost:4000/api/v1/billing/orders/${editOrder._id}`
        : 'http://localhost:4000/api/v1/billing/orders';

      const res = await window.fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(
          result.error ||
            (isEditing
              ? 'Failed to update order'
              : 'Failed to create order')
        );
        setSubmitting(false);
        return;
      }

      toast.success(
        isEditing
          ? 'Order updated successfully!'
          : 'Order created successfully!'
      );

      if (onSuccess) {
        onSuccess();
        return;
      }

      if (!isEditing) {
        setFormData(getInitialData());
        setCart([]);
      }
    } catch (_err) {
      toast.error('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.shell}>
        <LoaderPulse />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.background}></div>

      <form onSubmit={handleSubmit}>
        <div className={styles.layout}>
          {/* LEFT SIDE */}
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.panelTitle}>
                {editOrder ? 'Edit Order' : 'Order Information'}
              </h3>
              <p className={styles.panelText}>
                Create and manage customer orders.
              </p>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Order Number</label>
                <input
                  className={styles.input}
                  placeholder={editOrder ? formData.orderNo : 'Auto-generated on save'}
                  name="orderNo"
                  value={editOrder ? formData.orderNo : ''}
                  readOnly
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                {!editOrder && (
                  <span style={{ fontSize: '0.75rem', color: '#667085', marginTop: '0.25rem', display: 'block' }}>
                    Order number is auto-generated by the system
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Order Date *</label>
                <input
                  type="date"
                  className={styles.input}
                  name="orderDate"
                  value={formData.orderDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Client Name *</label>
              <input
                className={styles.input}
                placeholder="e.g. John Doe"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Client Email (optional)</label>
              <input
                type="email"
                className={styles.input}
                placeholder="e.g. john@example.com"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Status</label>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.selectInput}
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <span className={styles.selectArrow} aria-hidden="true"></span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Currency</label>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.selectInput}
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                  >
                    <option value="PKR">PKR - Pakistani Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                  <span className={styles.selectArrow} aria-hidden="true"></span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.panelTitle}>Order Summary</h3>
              <p className={styles.panelText}>
                Review totals before saving.
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.05)',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <span>Items</span>
                <strong>{cart.length}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <span>Subtotal</span>
                <strong>
                  {formData.currency} {orderSubtotal.toFixed(2)}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <span>Tax</span>
                <strong>
                  {formData.currency} {orderTax.toFixed(2)}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.1rem',
                }}
              >
                <span>Total</span>
                <strong>
                  {formData.currency} {orderTotal.toFixed(2)}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={submitting}
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              {submitting
                ? editOrder
                  ? 'Updating Order...'
                  : 'Creating Order...'
                : editOrder
                ? 'Update Order'
                : 'Create Order'}
            </button>
          </div>
        </div>

        {/* PRODUCT SELECTOR - Add items to cart */}
        <div className={styles.container} style={{ marginTop: '2rem' }}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.panelTitle}>Add Products to Order</h3>
            <p className={styles.panelText}>
              Select a product, choose size (if applicable), set quantity, then add to cart.
            </p>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Product *</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectInput}
                  value={newItemProductId}
                  onChange={(e) => handleNewItemProductChange(e.target.value)}
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>

            {/* Size dropdown - shown only when product has sizes */}
            {selectedProduct && selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Size *</label>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.selectInput}
                    value={newItemSize}
                    onChange={(e) => handleNewItemSizeChange(e.target.value)}
                  >
                    <option value="">Select Size</option>
                    {selectedProduct.sizes.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                        {s.salePrice != null ? ` - ${formData.currency} ${s.salePrice}` : ''}
                        {' | Stock: '}
                        {s.stock}
                      </option>
                    ))}
                  </select>
                  <span className={styles.selectArrow} aria-hidden="true"></span>
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Quantity</label>
              <input
                type="number"
                min="1"
                className={styles.input}
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Unit Price *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={styles.input}
                value={newItemUnitPrice}
                placeholder={selectedProductSize?.salePrice != null ? String(selectedProductSize.salePrice) : selectedProduct?.defaultSalePrice?.toString() || ''}
                onChange={(e) => setNewItemUnitPrice(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tax %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={styles.input}
                value={newItemTaxRate}
                onChange={(e) => setNewItemTaxRate(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.input}
              rows={2}
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="Product description (auto-filled)"
            />
          </div>

          <button
            type="button"
            className={styles.button}
            onClick={handleAddToCart}
            style={{ marginTop: '0.5rem' }}
          >
            + Add to Cart
          </button>
        </div>

        {/* CART - Review items before creating order */}
        <div className={styles.container} style={{ marginTop: '2rem' }}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.panelTitle}>
              Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
            </h3>
            <p className={styles.panelText}>
              Review items below. You can edit or remove items before creating the order.
            </p>
          </div>

          {cart.length === 0 ? (
            <p style={{ color: '#667085', textAlign: 'center', padding: '2rem' }}>
              No items in cart. Add products above.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e4e7ec' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: '#667085', fontWeight: 600 }}>#</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: '#667085', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: '#667085', fontWeight: 600 }}>Size</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', color: '#667085', fontWeight: 600 }}>Qty</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', color: '#667085', fontWeight: 600 }}>Unit Price</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', color: '#667085', fontWeight: 600 }}>Tax %</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', color: '#667085', fontWeight: 600 }}>Total</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#667085', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.cartId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '0.5rem' }}>{item.lineNo}</td>
                      <td style={{ padding: '0.5rem' }}>{item.description}</td>
                      <td style={{ padding: '0.5rem' }}>{item.variantName || '-'}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.qty}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        {formData.currency} {item.unitPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.taxRate}%</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>
                        {formData.currency} {item.lineTotal.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleEditCartItem(item)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            marginRight: '0.25rem',
                            borderRadius: '4px',
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.cartId)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #fecdca',
                            background: '#fef3f2',
                            color: '#b42318',
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
          )}
        </div>
      </form>
    </div>
  );
}