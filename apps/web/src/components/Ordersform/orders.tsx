import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import styles from "./form.module.css";
import LoaderPulse from '../Loader/Loader';

interface ProductItem {
  _id: string;
  name: string;
  sku: string;
  defaultSalePrice: number;
}

interface ServicePlanItem {
  _id: string;
  name: string;
  price?: number;
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
  servicePlanId?: string;
  serviceAddonId?: string;
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
    servicePlanId?: string;
    serviceAddonId?: string;
  }>;
}

interface OrderFormProps {
  editOrder?: EditOrder | null;
  onSuccess?: () => void;
}

export default function OrderForm({
  editOrder,
  onSuccess,
}: OrderFormProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [servicePlans, setServicePlans] = useState<ServicePlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getInitialData = () => {
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
      status: 'pending' as const,
      currency: 'USD',
      lines: [
        {
          lineNo: 1,
          itemType: 'product' as const,
          description: '',
          qty: '1',
          unitPrice: '',
          taxRate: '0',
          lineTotal: 0,
          productId: '',
          servicePlanId: '',
          serviceAddonId: '',
        },
      ],
    };
  };

  const [formData, setFormData] = useState(getInitialData);

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
  }, [fetchData]);

  const calculateLineTotal = (
    qty: number,
    unitPrice: number,
    taxRate: number
  ) => {
    const subtotal = qty * unitPrice;
    const tax = subtotal * (taxRate / 100);
    return subtotal + tax;
  };

  const orderSubtotal = formData.lines.reduce((sum, line) => {
    return sum + Number(line.qty || 0) * Number(line.unitPrice || 0);
  }, 0);

  const orderTax = formData.lines.reduce((sum, line) => {
    const subtotal =
      Number(line.qty || 0) * Number(line.unitPrice || 0);

    return sum + subtotal * (Number(line.taxRate || 0) / 100);
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

  const handleLineChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const updatedLines = [...prev.lines];

      updatedLines[index] = {
        ...updatedLines[index],
        [field]: value,
      };

      const qty = Number(updatedLines[index].qty || 0);
      const unitPrice = Number(updatedLines[index].unitPrice || 0);
      const taxRate = Number(updatedLines[index].taxRate || 0);

      updatedLines[index].lineTotal = calculateLineTotal(
        qty,
        unitPrice,
        taxRate
      );

      return {
        ...prev,
        lines: updatedLines,
      };
    });
  };

  const handleProductSelect = (
    index: number,
    productId: string
  ) => {
    const product = products.find((p) => p._id === productId);

    if (!product) return;

    setFormData((prev) => {
      const updatedLines = [...prev.lines];

      updatedLines[index] = {
        ...updatedLines[index],
        productId,
        description: product.name,
        unitPrice: String(product.defaultSalePrice),
        lineTotal: calculateLineTotal(
          Number(updatedLines[index].qty || 1),
          product.defaultSalePrice,
          Number(updatedLines[index].taxRate || 0)
        ),
      };

      return {
        ...prev,
        lines: updatedLines,
      };
    });
  };

  const addLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          lineNo: prev.lines.length + 1,
          itemType: 'product',
          description: '',
          qty: '1',
          unitPrice: '',
          taxRate: '0',
          lineTotal: 0,
          productId: '',
          servicePlanId: '',
          serviceAddonId: '',
        },
      ],
    }));
  };

  const removeLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines
        .filter((_, i) => i !== index)
        .map((line, i) => ({
          ...line,
          lineNo: i + 1,
        })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      const payload = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail || undefined,
        orderDate: formData.orderDate,
        status: formData.status,
        currency: formData.currency,
        lines: formData.lines.map((line) => ({
          lineNo: line.lineNo,
          itemType: line.itemType,
          description: line.description,
          qty: Number(line.qty),
          unitPriceCents: Math.round(
            Number(line.unitPrice) * 100
          ),
          taxRateBps: Math.round(
            Number(line.taxRate) * 100
          ),
          lineTotalCents: Math.round(
            line.lineTotal * 100
          ),
          productId: line.productId || undefined,
          servicePlanId:
            line.servicePlanId || undefined,
          serviceAddonId:
            line.serviceAddonId || undefined,
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
        <LoaderPulse/>
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
                {editOrder
                  ? 'Edit Order'
                  : 'Order Information'}
              </h3>

              <p className={styles.panelText}>
                Create and manage customer orders.
              </p>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Order Number
                </label>

                <input
                  className={styles.input}
                  placeholder={editOrder ? formData.orderNo : "Auto-generated on save"}
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
                <label className={styles.label}>
                  Order Date *
                </label>

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
              <label className={styles.label}>
                Client Name *
              </label>

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
              <label className={styles.label}>
                Client Email (optional)
              </label>

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
                <label className={styles.label}>
                  Status
                </label>

                <div className={styles.selectWrapper}>
                  <select
                    className={styles.selectInput}
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="pending">
                      Pending
                    </option>

                    <option value="confirmed">
                      Confirmed
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>

                    <option value="completed">
                      Completed
                    </option>
                  </select>

                  <span
                    className={styles.selectArrow}
                    aria-hidden="true"
                  ></span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Currency
                </label>

                <div className={styles.selectWrapper}>
                  <select
                    className={styles.selectInput}
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                  >
                    <option value="USD">
                      USD - US Dollar
                    </option>

                    <option value="PKR">
                      PKR - Pakistani Rupee
                    </option>

                    <option value="EUR">
                      EUR - Euro
                    </option>

                    <option value="GBP">
                      GBP - British Pound
                    </option>
                  </select>

                  <span
                    className={styles.selectArrow}
                    aria-hidden="true"
                  ></span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.panelTitle}>
                Order Summary
              </h3>

              <p className={styles.panelText}>
                Review totals before saving.
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: '16px',
                background:
                  'rgba(255,255,255,0.05)',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <span>Subtotal</span>
                <strong>
                  {formData.currency}{' '}
                  {orderSubtotal.toFixed(2)}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <span>Tax</span>
                <strong>
                  {formData.currency}{' '}
                  {orderTax.toFixed(2)}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  fontSize: '1.1rem',
                }}
              >
                <span>Total</span>

                <strong>
                  {formData.currency}{' '}
                  {orderTotal.toFixed(2)}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={submitting}
              style={{
                opacity: submitting ? 0.7 : 1,
              }}
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

        {/* ORDER LINES */}
        <div
          className={styles.container}
          style={{ marginTop: '2rem' }}
        >
          <div className={styles.sectionHeader}>
            <h3 className={styles.panelTitle}>
              Order Line Items
            </h3>

            <p className={styles.panelText}>
              Add products and services to the
              order.
            </p>
          </div>

          {formData.lines.map((line, index) => (
            <div
              key={index}
              style={{
                border:
                  '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Item Type
                  </label>

                  <div
                    className={styles.selectWrapper}
                  >
                    <select
                      className={
                        styles.selectInput
                      }
                      value={line.itemType}
                      onChange={(e) =>
                        handleLineChange(
                          index,
                          'itemType',
                          e.target.value
                        )
                      }
                    >
                      <option value="product">
                        Product
                      </option>

                      <option value="service">
                        Service
                      </option>

                      <option value="addon">
                        Addon
                      </option>

                      <option value="other">
                        Other
                      </option>
                    </select>

                    <span
                      className={
                        styles.selectArrow
                      }
                      aria-hidden="true"
                    ></span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Product
                  </label>

                  <div
                    className={styles.selectWrapper}
                  >
                    <select
                      className={
                        styles.selectInput
                      }
                      value={line.productId}
                      onChange={(e) =>
                        handleProductSelect(
                          index,
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Select Product
                      </option>

                      {products.map((product) => (
                        <option
                          key={product._id}
                          value={product._id}
                        >
                          {product.name}
                        </option>
                      ))}
                    </select>

                    <span
                      className={
                        styles.selectArrow
                      }
                      aria-hidden="true"
                    ></span>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Description *
                </label>

                <textarea
                  className={styles.input}
                  rows={3}
                  value={line.description}
                  onChange={(e) =>
                    handleLineChange(
                      index,
                      'description',
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    className={styles.input}
                    value={line.qty}
                    onChange={(e) =>
                      handleLineChange(
                        index,
                        'qty',
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Unit Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={styles.input}
                    value={line.unitPrice}
                    onChange={(e) =>
                      handleLineChange(
                        index,
                        'unitPrice',
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Tax %
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={styles.input}
                    value={line.taxRate}
                    onChange={(e) =>
                      handleLineChange(
                        index,
                        'taxRate',
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Total
                  </label>

                  <input
                    className={styles.input}
                    value={line.lineTotal.toFixed(
                      2
                    )}
                    disabled
                  />
                </div>
              </div>

              {formData.lines.length > 1 && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() =>
                    removeLine(index)
                  }
                >
                  Remove Line
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className={styles.button}
            onClick={addLine}
          >
            + Add Line Item
          </button>
        </div>
      </form>
    </div>
  );
}