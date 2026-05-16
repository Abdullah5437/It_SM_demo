import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/ui/DataTable';
import { RequireAuth } from "../components/auth/RequireAuth"
import Orderform from '../components/Ordersform/orders';
import { usePagination } from '../hooks/usePagination';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { toast } from 'react-toastify';
import LoaderPulse from '../components/Loader/Loader';
import modalStyles from '../components/product_table/ProductTable.module.css';

interface OrderItem {
  _id: string;
  orderNo: string;
  orderDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  currency: string;
  clientName: string;
  clientEmail?: string;
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
  createdAt: string;
}

const orderColumns = [
  { key: 'select', label: '' },
  { key: 'orderId', label: 'Order ID' },
  { key: 'customer', label: 'Customer' },
  { key: 'shipment', label: 'Shipment' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action' },
];

export default function OrderPage() {
  const [view, setView] = useState<'table' | 'create' | 'edit'>('table');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<OrderItem | null>(null);

  const { getPaginationItemsPerPage } = useSystemSettings();
  const pagination = usePagination(getPaginationItemsPerPage());

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchOrders = useCallback(async (limit: number = 10, skip: number = 0) => {
    try {
      setLoading(true);
      const res = await window.fetch(`http://localhost:4000/api/v1/billing/orders?limit=${limit}&skip=${skip}`, { headers });
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
        if (json.pagination?.total) {
          pagination.setTotalItems(json.pagination.total);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(pagination.pageParams.limit, pagination.pageParams.skip);
  }, [fetchOrders, pagination.pageParams]);

  /**
   * Open edit form
   */
  const handleEditOrder = useCallback((order: OrderItem) => {
    setSelectedOrder(order);
    setView('edit');
  }, []);

  /**
   * Delete order
   */
  const handleDeleteOrder = useCallback((order: OrderItem) => {
    setDeleteConfirmOrder(order);
  }, []);

  const confirmDeleteOrder = useCallback(async () => {
    if (!deleteConfirmOrder) return;

    try {
      const res = await window.fetch(
        `http://localhost:4000/api/v1/billing/orders/${deleteConfirmOrder._id}`,
        { method: 'DELETE', headers }
      );
      const json = await res.json();
      if (json.success) {
        toast.success('Order deleted successfully!');
        fetchOrders();
      } else {
        toast.error(json.error || 'Failed to delete order');
      }
    } catch {
      toast.error('Network error occurred');
    } finally {
      setDeleteConfirmOrder(null);
    }
  }, [deleteConfirmOrder]);

  /**
   * Open create form
   */
  const handleCreateOrder = useCallback(() => {
    setSelectedOrder(null);
    setView('create');
  }, []);

  /**
   * Back to table
   */
  const handleBack = useCallback(() => {
    setView('table');
    setSelectedOrder(null);
  }, []);

  /**
   * Form success -> refresh table
   */
  const handleSuccess = useCallback(() => {
    setView('table');
    setSelectedOrder(null);
    fetchOrders();
  }, []);

  // Map orders to DataTable rows
  const orderRows = orders.map((order) => {
    const totalItems = order.lines.reduce((sum, l) => sum + l.qty, 0);
    const orderTotal = order.lines.reduce((sum, l) => sum + l.lineTotalCents, 0) / 100;
    const customerName = order.clientName || 'N/A';
    const emailDisplay = order.clientEmail ? ` - ${order.clientEmail}` : '';
    const customerSubtitle = `${totalItems} item${totalItems !== 1 ? 's' : ''}${emailDisplay} - ${order.currency} ${orderTotal.toFixed(2)}`;

    let statusTone: 'active' | 'warning' | 'accent' | 'inactive' = 'warning';
    if (order.status === 'confirmed') statusTone = 'active';
    else if (order.status === 'completed') statusTone = 'accent';
    else if (order.status === 'cancelled') statusTone = 'inactive';

    const orderDate = new Date(order.orderDate).toLocaleDateString();

    return {
      id: order._id,
      cells: [
        { type: 'checkbox' as const, label: `Select order ${order.orderNo}` },
        { type: 'pill' as const, text: `#${order.orderNo}` },
        {
          type: 'member' as const,
          title: customerName,
          subtitle: customerSubtitle,
        },
        {
          type: 'stack' as const,
          title: `Date: ${orderDate}`,
          subtitle: `Status: ${order.status}`,
        },
        { type: 'status' as const, label: order.status, tone: statusTone },
        {
          type: 'action' as const,
          label: `Actions for ${order.orderNo}`,
          onEdit: () => handleEditOrder(order),
          onDelete: () => handleDeleteOrder(order),
        },
      ],
    };
  });

  return (
    <RequireAuth>
      <div style={{ padding: '1rem' }}>
        {view === 'table' ? (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ margin: 0 }}>Orders</h2>

              <button
                onClick={handleCreateOrder}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: '#0d5c63',
                  color: '#fff',
                }}
              >
                + Create New Order
              </button>
            </div>

              {loading ? (
              <LoaderPulse />
            ) : (
              <DataTable
                kicker="Order Operations"
                heading="Live fulfillment queue"
                meta={[`${orders.length} orders`]}
                columns={orderColumns}
                rows={orderRows}
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
          </>
        ) : (
          <div>
            <button
              onClick={handleBack}
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ← Back to Orders
            </button>

            <Orderform
              editOrder={selectedOrder}
              onSuccess={handleSuccess}
            />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmOrder && (
          <div className={modalStyles.modalOverlay} onClick={() => setDeleteConfirmOrder(null)}>
            <div className={modalStyles.modal} onClick={e => e.stopPropagation()}>
              <button className={modalStyles.modalClose} onClick={() => setDeleteConfirmOrder(null)}>×</button>
              <h3 className={modalStyles.modalTitle}>Delete Order</h3>
              <p className={modalStyles.kicker} style={{ marginBottom: '1rem' }}>
                Are you sure you want to delete order {deleteConfirmOrder.orderNo || deleteConfirmOrder._id}?
              </p>

              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fef3f2', borderRadius: '0.5rem', border: '1px solid #fecdca', color: '#b42318', fontSize: '0.9rem' }}>
                This action cannot be undone. The order and all associated data will be permanently removed.
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <span className={modalStyles.label} style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#98a2b3' }}>Order Details</span>
                <div style={{ fontWeight: 600, color: '#101828', marginTop: '0.25rem' }}>
                  #{deleteConfirmOrder.orderNo} — {deleteConfirmOrder.clientName}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d0d5dd',
                    background: '#fff',
                    color: '#344054',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                  onClick={() => setDeleteConfirmOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: '#dc2626',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                  onClick={confirmDeleteOrder}
                >
                  Delete Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
