import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from "./form.module.css";

const PREDEFINED_SIZES = ['Small', 'Medium', 'Large', 'XL'];

interface EditProductSize {
  name: string;
  stock: number;
  salePrice?: number;
  costPrice?: number;
}

interface EditProduct {
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
  sizes?: EditProductSize[];
}

interface ProductFormProps {
  editProduct?: EditProduct | null;
  onSuccess?: () => void;
}

interface SizeEntry {
  name: string;
  selected: boolean;
  stock: string;
  salePrice: string;
  costPrice: string;
}

export default function ProductForm({ editProduct, onSuccess }: ProductFormProps) {
  const [uploading, setUploading] = useState(false);
  const [customSizeName, setCustomSizeName] = useState('');

  // Build initial sizes from predefined list, marking those from editProduct as selected
  const buildInitialSizes = (): SizeEntry[] => {
    const editSizes = editProduct?.sizes || [];
    return PREDEFINED_SIZES.map(sizeName => {
      const existing = editSizes.find(s => s.name === sizeName);
      return {
        name: sizeName,
        selected: !!existing,
        stock: existing ? String(existing.stock) : '0',
        salePrice: existing && existing.salePrice != null ? String(existing.salePrice) : '',
        costPrice: existing && existing.costPrice != null ? String(existing.costPrice) : '',
      };
    });
  };

  const getInitialFormData = () => ({
    sku: editProduct?.sku || '',
    name: editProduct?.name || '',
    title: editProduct?.title || '',
    description: editProduct?.description || '',
    defaultSalePrice: editProduct ? String(editProduct.defaultSalePrice) : '',
    defaultCost: editProduct ? String(editProduct.defaultCost) : '',
    currency: editProduct?.currency || 'PKR',
    trackInventory: true,
    trackSerial: false,
    stock: editProduct ? String(editProduct.stock) : '',
    type: editProduct?.type || 'Women' as string,
    sizes: buildInitialSizes(),
  });

  const [formData, setFormData] = useState(getInitialFormData);
  const [createdSku, setCreatedSku] = useState<string | null>(null);

  const isEditing = !!editProduct?._id;
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

  const selectedSizes = formData.sizes.filter(s => s.selected);
  const hasSelectedSizes = selectedSizes.length > 0;

  // Calculate total stock from selected sizes
  const totalSizeStock = selectedSizes.reduce((sum, s) => sum + Number(s.stock || 0), 0);

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleSize = (sizeName: string) => {
    setFormData(prev => {
      const targetSize = prev.sizes.find(s => s.name === sizeName);
      const becomingSelected = targetSize && !targetSize.selected;
      return {
        ...prev,
        sizes: prev.sizes.map(s =>
          s.name === sizeName
            ? {
                ...s,
                selected: !s.selected,
                stock: !s.selected ? s.stock : '0',
                // Pre-fill sale/cost from defaults when selecting a size (user can edit)
                salePrice: becomingSelected && !s.salePrice ? prev.defaultSalePrice : s.salePrice,
                costPrice: becomingSelected && !s.costPrice ? prev.defaultCost : s.costPrice,
              }
            : s
        ),
      };
    });

     // silent
  };

  const addCustomSize = () => {
    const trimmed = customSizeName.trim();
    if (!trimmed) return;
    if (formData.sizes.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Size "${trimmed}" already exists`);
      return;
    }
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { 
        name: trimmed, 
        selected: true, 
        stock: '0', 
        salePrice: prev.defaultSalePrice, 
        costPrice: prev.defaultCost 
      }],
    }));
    setCustomSizeName('');
  };

  const removeCustomSize = (sizeName: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s.name !== sizeName),
    }));
  };

  const handleSizeStockChange = (sizeName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map(s =>
        s.name === sizeName ? { ...s, stock: value } : s
      ),
    }));
  };

  const handleSizePriceChange = (sizeName: string, field: 'salePrice' | 'costPrice', value: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map(s =>
        s.name === sizeName ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    const payload: Record<string, any> = {
      name: formData.name,
      title: formData.title || undefined,
      description: formData.description || undefined,
      type: formData.type,
      defaultSalePrice: Number(formData.defaultSalePrice),
      defaultCost: Number(formData.defaultCost),
      currency: formData.currency,
      trackInventory: formData.trackInventory,
      trackSerial: formData.trackSerial,
      stock: hasSelectedSizes ? totalSizeStock : Number(formData.stock),
      sizes: hasSelectedSizes
        ? selectedSizes.map(s => ({
            name: s.name,
            stock: Number(s.stock) || 0,
            salePrice: s.salePrice !== '' ? Number(s.salePrice) : undefined,
            costPrice: s.costPrice !== '' ? Number(s.costPrice) : undefined,
          }))
        : [],
    };

    // For editing, include sku; for creation let backend auto-generate
    if (isEditing) {
      payload.sku = formData.sku;
    }

    if (isEditing && editProduct?.status) {
      payload.status = editProduct.status;
    } else {
      payload.status = 'active';
    }

    try {
      const url = isEditing
        ? `https://aquamarine-stork-973169.hostingersite.com/api/v1/inventory/products/${editProduct._id}`
        : 'https://aquamarine-stork-973169.hostingersite.com/api/v1/inventory/products';

      const res = await window.fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result: Record<string, unknown> = await res.json();

      if (!res.ok) {
        toast.error(`Error: ${(result.error as string) || (isEditing ? 'Failed to update product' : 'Failed to create product')}`);
        setUploading(false);
        return;
      }

      const createdData = result.data as Record<string, any> | undefined;
      const autoSku = createdData?.sku as string | undefined;
      if (!isEditing && autoSku) {
        setCreatedSku(autoSku);
        toast.success(`Product created! SKU: ${autoSku}`);
      } else {
        toast.success(isEditing ? 'Product updated successfully!' : 'Product created successfully!');
      }

      if (onSuccess) {
        onSuccess();
        return;
      }

      if (!isEditing) {
        setFormData({
          sku: '',
          name: '',
          title: '',
          description: '',
          defaultSalePrice: '',
          defaultCost: '',
          currency: 'PKR',
          trackInventory: true,
          trackSerial: false,
          stock: '',
          type: 'Women',
          sizes: PREDEFINED_SIZES.map(n => ({ name: n, selected: false, stock: '0', salePrice: '', costPrice: '' })),
        });
      }
    } catch (_err) {
      toast.error('Network error: Could not create product');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.background}></div>

      <form onSubmit={handleSubmit}>
        <div className={styles.layout}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.panelTitle}>{editProduct ? `Edit Product: ${editProduct.name}` : 'Product Information'}</h3>
              <p className={styles.panelText}>Enter basic product details and pricing information.</p>
            </div>

            {/* SKU auto-generated by backend; show if editing or after creation */}
            {isEditing ? (
              <div className={styles.formGroup}>
                <label className={styles.label}>SKU</label>
                <input 
                  className={styles.input} 
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
            ) : createdSku ? (
              <div className={styles.formGroup}>
                <label className={styles.label}>SKU (Auto-Generated)</label>
                <div className={styles.skuDisplay}>
                  {createdSku}
                </div>
              </div>
            ) : null}

            <div className={styles.formGroup}>
              <label className={styles.label}>Product Name (Title) *</label>
              <input 
                className={styles.input} 
                placeholder="e.g., Dell XPS 13 Laptop" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Product Description</label>
              <textarea 
                className={styles.input} 
                placeholder="Enter detailed product description" 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            {!hasSelectedSizes && (
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Sale Price ($) *</label>
                  <input 
                    className={styles.input} 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 999.99" 
                    name="defaultSalePrice"
                    value={formData.defaultSalePrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cost ($) *</label>
                  <input 
                    className={styles.input} 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 600.00" 
                    name="defaultCost"
                    value={formData.defaultCost}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}
            {hasSelectedSizes && (
              <p className={styles.sizePricingNote}>
                Pricing is set per size below. Default sale price and cost are not used when sizes are assigned.
              </p>
            )}

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
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="USD">USD - US Dollar</option>
                 
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <input 
                    type="checkbox" 
                    name="trackInventory"
                    checked={formData.trackInventory}
                    onChange={handleInputChange}
                  />
                  {' '}Track Inventory
                </label>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <input 
                    type="checkbox" 
                    name="trackSerial"
                    checked={formData.trackSerial}
                    onChange={handleInputChange}
                  />
                  {' '}Track Serial Numbers
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Stock *</label>
              {hasSelectedSizes ? (
                <div className={styles.stockFromSizes}>
                  {totalSizeStock} (from sizes)
                </div>
              ) : (
                <input
                  className={styles.input}
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="Enter stock"
                />
              )}
            </div>

            {/* Sizes Section */}
            <div className={''}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.panelTitle}>
                  Sizes (Optional)
                </h3>
                <p className={styles.panelText}>
                  Select sizes and set stock & pricing per size. Click a size to toggle it on/off. When sizes are used, the per-size prices override the default sale price and cost.
                </p>
              </div>

              <div className={styles.sizesFlex}>
                {/* Default sizes */}
                {formData.sizes.filter(s => PREDEFINED_SIZES.includes(s.name)).map(size => (
                  <div key={size.name} className={`${styles.sizeCard} ${size.selected ? styles.sizeCardSelected : styles.sizeCardUnselected}`}>
                    <button
                      type="button"
                      onClick={() => toggleSize(size.name)}
                      className={`${styles.sizeToggleBtn} ${size.selected ? styles.sizeToggleBtnSelected : styles.sizeToggleBtnUnselected}`}
                      title={size.selected ? `Click to deselect ${size.name}` : `Click to select ${size.name}`}
                    >
                      {size.name}
                    </button>
                    {size.selected && (
                      <div className={styles.sizeInputs}>
                        <div className={styles.sizeInputRow}>
                          <span className={styles.sizeInputLabel}>Qty</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={size.stock}
                            onChange={(e) => handleSizeStockChange(size.name, e.target.value)}
                            className={styles.sizeInputField}
                          />
                        </div>
                        <div className={styles.sizeInputRow}>
                          <span className={styles.sizeInputLabel}>$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Sale"
                            value={size.salePrice}
                            onChange={(e) => handleSizePriceChange(size.name, 'salePrice', e.target.value)}
                            className={styles.sizeInputField}
                            title="Sale price for this size"
                          />
                        </div>
                        <div className={styles.sizeInputRow}>
                          <span className={styles.sizeInputLabel}>C</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Cost"
                            value={size.costPrice}
                            onChange={(e) => handleSizePriceChange(size.name, 'costPrice', e.target.value)}
                            className={styles.sizeInputField}
                            title="Cost price for this size"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Custom sizes */}
              {formData.sizes.filter(s => !PREDEFINED_SIZES.includes(s.name)).length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p className={styles.customSectionLabel}>Custom Sizes</p>
                  <div className={styles.customSizeFlex}>
                    {formData.sizes.filter(s => !PREDEFINED_SIZES.includes(s.name)).map(size => (
                      <div key={size.name} className={`${styles.sizeCard} ${size.selected ? styles.sizeCardSelected : styles.sizeCardUnselected}`}>
                        <div className={styles.customSizeHeader}>
                          <button
                            type="button"
                            onClick={() => toggleSize(size.name)}
                            className={`${styles.sizeToggleBtn} ${size.selected ? styles.sizeToggleBtnSelected : styles.sizeToggleBtnUnselected}`}
                          >
                            {size.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCustomSize(size.name)}
                            className={styles.customSizeRemoveBtn}
                            title="Remove this size"
                          >×</button>
                        </div>
                        {size.selected && (
                          <div className={styles.sizeInputs}>
                            <div className={styles.sizeInputRow}>
                              <span className={styles.sizeInputLabel}>Qty</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={size.stock}
                                onChange={(e) => handleSizeStockChange(size.name, e.target.value)}
                                className={styles.sizeInputField}
                              />
                            </div>
                            <div className={styles.sizeInputRow}>
                              <span className={styles.sizeInputLabel}>$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Sale"
                                value={size.salePrice}
                                onChange={(e) => handleSizePriceChange(size.name, 'salePrice', e.target.value)}
                                className={styles.sizeInputField}
                                title="Sale price for this size"
                              />
                            </div>
                            <div className={styles.sizeInputRow}>
                              <span className={styles.sizeInputLabel}>C</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Cost"
                                value={size.costPrice}
                                onChange={(e) => handleSizePriceChange(size.name, 'costPrice', e.target.value)}
                                className={styles.sizeInputField}
                                title="Cost price for this size"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add custom size */}
              <div className={styles.addCustomSizeRow}>
                <input
                  type="text"
                  placeholder="Add custom size..."
                  value={customSizeName}
                  onChange={(e) => setCustomSizeName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }}
                  className={styles.addCustomSizeInput}
                />
                <button
                  type="button"
                  onClick={addCustomSize}
                  className={styles.addCustomSizeBtn}
                >
                  + Add
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Product Type *</label>
              <div className={styles.selectWrapper}>
                <select 
                  className={styles.selectInput}
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  <option value="">Select type...</option>
                  <option value="Mens">Mens</option>
                  <option value="Women">Women</option>
                  <option value="Children">Children</option>
                  <option value="Other">Other</option>
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={uploading}
              style={{ opacity: uploading ? 0.7 : 1 }}
            >
              {uploading ? (editProduct ? 'Updating product...' : 'Creating product...') : (editProduct ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}