import { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../components/ui/DataTable';
import { RequireAuth } from "../components/auth/RequireAuth";
import Orderform from '../components/Ordersform/orders';
import { usePagination } from '../hooks/usePagination';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { toast } from 'react-toastify';
import LoaderPulse from '../components/Loader/Loader';

/* =========================
   API TYPE (loose)
========================= */
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
    itemType: string;
    description: string;
    qty: number;
    unitPriceCents: number;
    taxRateBps: number;
    lineTotalCents: number;
  }>;
  createdAt: string;
}

/* =========================
   EDIT TYPE (strict UI)
========================= */
type EditOrder = {
  _id: string;
  orderNo: string;
  orderDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  currency: string;
  clientName: string;
  clientEmail?: string;
  lines: {
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
  }[];
};

/* =========================
   NORMALIZER
========================= */
const normalizeItemType = (
  type: string
): 'product' | 'service' | 'addon' | 'other' => {
  if (type === 'product' || type === 'service' || type === 'addon') {
    return type;
  }
  return 'other';
};

const normalizeOrderForEdit = (order: OrderItem): EditOrder => {
  return {
    ...order,
    lines: order.lines.map(line => ({
      ...line,
      itemType: normalizeItemType(line.itemType),
    })),
  };
};

/* =========================
   TABLE COLUMNS
========================= */
const orderColumns = [
  { key: 'select', label: '' },
  { key: 'orderId', label: 'Order ID' },
  { key: 'customer', label: 'Customer' },
  { key: 'shipment', label: 'Shipment' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action' },
];

/* =========================
   COMPONENT
========================= */
export default function OrderPage() {
  const [view, setView] = useState<'table' | 'create' | 'edit'>('table');

  const [selectedOrder, setSelectedOrder] = useState<EditOrder | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { getPaginationItemsPerPage } = useSystemSettings();
  const pagination = usePagination(getPaginationItemsPerPage());

  const token = typeof window !== 'undefined'
    ? window.localStorage.getItem('token')
    : null;

  const headers = useMemo(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [token]);

  /* =========================
     FETCH ORDERS
  ========================= */
  const fetchOrders = useCallback(
    async (limit: number = 10, skip: number = 0) => {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:4000/api/v1/billing/orders?limit=${limit}&skip=${skip}`,
          { headers }
        );

        const json = await res.json();

        if (json.success) {
          setOrders(json.data || []);

          if (json.pagination?.total) {
            pagination.setTotalItems(json.pagination.total);
          }
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    },
    [headers, pagination]
  );

  useEffect(() => {
    fetchOrders(pagination.pageParams.limit, pagination.pageParams.skip);
  }, [fetchOrders, pagination.pageParams, fetchOrders]);

  /* =========================
     HANDLERS
  ========================= */
  const handleEditOrder = useCallback((order: OrderItem) => {
    setSelectedOrder(normalizeOrderForEdit(order));
    setView('edit');
  }, []);

  const handleDeleteOrder = useCallback(
    async (order: OrderItem) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete order ${order.orderNo || order._id}?`
      );
      if (!confirmed) return;

      try {
        const res = await fetch(
          `http://localhost:4000/api/v1/billing/orders/${order._id}`,
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
      }
    },
    [headers, fetchOrders]
  );

  const handleCreateOrder = useCallback(() => {
    setSelectedOrder(null);
    setView('create');
  }, []);

  const handleBack = useCallback(() => {
    setView('table');
    setSelectedOrder(null);
  }, []);

  const handleSuccess = useCallback(() => {
    setView('table');
    setSelectedOrder(null);
    fetchOrders();
  }, [fetchOrders]);

  /* =========================
     ROW MAPPING
  ========================= */
  const orderRows = orders.map(order => {
    const totalItems = order.lines.reduce((sum, l) => sum + l.qty, 0);
    const orderTotal =
      order.lines.reduce((sum, l) => sum + l.lineTotalCents, 0) / 100;

    const customerName = order.clientName || 'N/A';
    const emailDisplay = order.clientEmail ? ` - ${order.clientEmail}` : '';

    const customerSubtitle =
      `${totalItems} item${totalItems !== 1 ? 's' : ''}` +
      `${emailDisplay} - ${order.currency} ${orderTotal.toFixed(2)}`;

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

  /* =========================
     UI
  ========================= */
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
      </div>
    </RequireAuth>
  );
}