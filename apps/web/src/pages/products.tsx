import { useState, useCallback } from 'react';
import ProductForm from "../components/product_form/form"
import ProductTable from "../components/product_table/ProductTable"
import { RequireAuth } from "../components/auth/RequireAuth"
import styles from "../components/product_table/ProductTable.module.css"

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
  createdAt: string;
}
type ProductStatus = 'active' | 'inactive' | 'suspended';

type EditProduct = Omit<Product, 'status'> & {
  status: ProductStatus;
};

export default (() => {
  const [view, setView] = useState<'table' | 'create' | 'edit'>('table');
  const [editProduct, setEditProduct] = useState<EditProduct | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = useCallback((product: Product) => {
    setEditProduct(product as EditProduct);
    setView('edit');
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <RequireAuth>
      <div style={{ padding: '1rem' }}>
        {view === 'table' ? (
          <div>
            <div className={styles.headerRow}>
              <h2 style={{ margin: 0, color: '#101828' }}>Products</h2>
              <button className={styles.addBtn} onClick={() => { setView('create'); setEditProduct(null); }}>
                + Create New Product
              </button>
            </div>
            <ProductTable onEdit={handleEdit} onRefresh={handleRefresh} refreshKey={refreshKey} />
          </div>
        ) : (
          <div>
            <button
              className={styles.backBtn}
              onClick={() => { setView('table'); setEditProduct(null); }}
            >
              ← Back to Product List
            </button>
            <ProductForm editProduct={editProduct} onSuccess={() => { setView('table'); handleRefresh(); }} />
          </div>
        )}
      </div>
    </RequireAuth>
  )
})