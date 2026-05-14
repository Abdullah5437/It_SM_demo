import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import styles from "./form.module.css";
import LoaderPulse from '../Loader/Loader';

type ProductStatus = 'active' | 'inactive' | 'suspended';
interface SubSubcategoryItem {
  name: string;
  description?: string;
}

interface SubcategoryItem {
  name: string;
  description?: string;
  subSubcategories: SubSubcategoryItem[];
}

interface CategoryItem {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  subcategories: SubcategoryItem[];
}

interface EditProductVariant {
  name: string;
  sku?: string;
  stock: number;
  salePrice?: number;
  costPrice?: number;
}
type VariantForm = {
  name: string;
  sku: string;
  stock: string;
  salePrice: string;
  costPrice: string;
};


type ProductFormState = {
  sku: string;
  name: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  subsubcategory: string;
  image: File | null;
  imageUrl: string;
  defaultSalePrice: string;
  defaultCost: string;
  currency: string;
  trackInventory: boolean;
  trackSerial: boolean;
  stock: string;
  type: string;
  variants: VariantForm[];
};
type ProductPayload = {
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
  trackInventory: boolean;
  trackSerial: boolean;
  stock: number;
  variants: {
    name: string;
    sku?: string;
    stock: number;
    salePrice: number;
    costPrice: number;
  }[];

  status: ProductStatus;
};
interface EditProduct {
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
  status: ProductStatus;
  variants?: EditProductVariant[];
}

interface ProductFormProps {
  editProduct?: EditProduct | null;
  onSuccess?: () => void;
}
export default function ProductForm({ editProduct, onSuccess }: ProductFormProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const getInitialFormData = () => {
    if (editProduct) {
      const hasVariantsData = editProduct.variants && editProduct.variants.length > 0;
      return {
        sku: editProduct.sku,
        name: editProduct.name,
        title: editProduct.title || '',
        description: editProduct.description || '',
        category: editProduct.category || '',
        subcategory: editProduct.subcategory || '',
        subsubcategory: editProduct.subsubcategory || '',
        image: null as File | null,
        imageUrl: editProduct.image || '',
        defaultSalePrice: String(editProduct.defaultSalePrice),
        defaultCost: String(editProduct.defaultCost),
        currency: editProduct.currency,
        trackInventory: true,
        trackSerial: false,
        stock: String(editProduct.stock),
        type: editProduct.type,
        variants: hasVariantsData
          ? editProduct.variants!.map(v => ({
              name: v.name,
              sku: v.sku || '',
              stock: String(v.stock),
              salePrice: String(v.salePrice || ''),
              costPrice: String(v.costPrice || ''),
            }))
          : [{ name: '', sku: '', stock: '', salePrice: '', costPrice: '' }]
      };
    }
    return {
      sku: '',
      name: '',
      title: '',
      description: '',
      category: '',
      subcategory: '',
      subsubcategory: '',
      image: null as File | null,
      imageUrl: '',
      defaultSalePrice: '',
      defaultCost: '',
      currency: 'USD',
      trackInventory: true,
      trackSerial: false,
      stock: '',
      type: 'hardware' as string,
      variants: [
        {
          name: '',
          sku: '',
          stock: '',
          salePrice: '',
          costPrice: '',
        }
      ]
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await window.fetch('http://localhost:4000/api/v1/categories/categories', { headers });
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch {
      // silent
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const hasVariants = formData.variants.some(
    (v) => v.name.trim() || v.stock
  );

  const totalVariantStock = formData.variants.reduce(
    (sum, v) => sum + Number(v.stock || 0),
    0
  );

  // Auto-calculate stock, cost and sale price based on variants
  useEffect(() => {
    if (hasVariants) {
      const totalStock = formData.variants.reduce(
        (sum, v) => sum + Number(v.stock || 0), 0
      );

      // Weighted average: (sum of stock * price) / total stock
      const totalCostCalc = formData.variants.reduce(
        (sum, v) => sum + (Number(v.stock || 0) * Number(v.costPrice || 0)), 0
      );
      const totalSaleCalc = formData.variants.reduce(
        (sum, v) => sum + (Number(v.stock || 0) * Number(v.salePrice || 0)), 0
      );

      const avgCost = totalStock > 0 ? Math.round((totalCostCalc / totalStock) * 100) / 100 : 0;
      const avgSale = totalStock > 0 ? Math.round((totalSaleCalc / totalStock) * 100) / 100 : 0;

    setFormData(prev => {
  const newData: ProductFormState = {
    ...prev,
    stock: String(totalStock),
  };

  const hasAnyCost = prev.variants.some(v => Number(v.costPrice) > 0);
  const hasAnySale = prev.variants.some(v => Number(v.salePrice) > 0);

  if (hasAnyCost) {
    newData.defaultCost = String(avgCost);
  }

  if (hasAnySale) {
    newData.defaultSalePrice = String(avgSale);
  }

  return newData;
});
    }
  }, [formData.variants]);

  // Filter categories by selected type
  const filteredCategories = categories.filter(c => c.type === formData.type && c.subcategories.length > 0);

  // Find the selected category object
  const selectedCategory = categories.find(c => c._id === formData.category || c.name === formData.category);

  // Available subcategories for the selected category
  const availableSubcategories = selectedCategory ? selectedCategory.subcategories : [];

  // Find the selected subcategory
  const selectedSubcategory = availableSubcategories.find(s => s.name === formData.subcategory);

  // Available sub-subcategories for the selected subcategory
  const availableSubSubcategories = selectedSubcategory ? selectedSubcategory.subSubcategories : [];

  // Upload image to Cloudinary via backend
  const uploadImage = async (file: File): Promise<string> => {
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    const res = await window.fetch('http://localhost:4000/api/v1/upload/image', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formDataUpload,
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Upload failed');
    }
    return json.data.url;
  };

const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const target = e.target;

  const { name, value } = target;

  const isCheckbox = target instanceof HTMLInputElement && target.type === 'checkbox';

  setFormData(prev => ({
    ...prev,
    [name]: isCheckbox ? target.checked : value,
  }));
};

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData(prev => ({
    ...prev,
    image: e.target.files?.[0] || null,
    imageUrl: '',
  }));
};

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value,
      subcategory: '',
      subsubcategory: ''
    }));
  };

  const handleSubcategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subcategory: value,
      subsubcategory: ''
    }));
  };

  const handleVariantChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return {
        ...prev,
        variants: updated,
      };
    });
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: '',
          sku: '',
          stock: '',
          salePrice: '',
          costPrice: '',
        },
      ],
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = formData.imageUrl;

    // Upload image to Cloudinary if a file was selected
    if (formData.image) {
      try {
        imageUrl = await uploadImage(formData.image);
      } catch (err) {
        toast.error(`Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setUploading(false);
        return;
      }
    }

    const isEditing = !!editProduct?._id;

  const payload: ProductPayload = {
      sku: formData.sku,
      name: formData.name,
      title: formData.title || undefined,
      description: formData.description || undefined,
      image: imageUrl || undefined,
      type: formData.type,
      category: formData.category || undefined,
      subcategory: formData.subcategory || undefined,
      subsubcategory: formData.subsubcategory || undefined,
      defaultSalePrice: Number(formData.defaultSalePrice),
      defaultCost: Number(formData.defaultCost),
      currency: formData.currency,
      trackInventory: formData.trackInventory,
      trackSerial: formData.trackSerial,
      stock: hasVariants ? totalVariantStock : Number(formData.stock),
      status: 'active', 
      variants: hasVariants
        ? formData.variants
            .filter(v => v.name.trim())
            .map(v => ({
              name: v.name,
              sku: v.sku || undefined,
              stock: Number(v.stock) || 0,
              salePrice: Number(v.salePrice) || 0,
              costPrice: Number(v.costPrice) || 0,
            }))
        : [],
    };

    // Include status only if editing (preserve existing)
   if (isEditing && editProduct?.status) {
  payload.status = editProduct.status;
} else {
  payload.status = 'active';
}

    try {
      const url = isEditing
        ? `http://localhost:4000/api/v1/inventory/products/${editProduct._id}`
        : 'http://localhost:4000/api/v1/inventory/products';

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

      toast.success(isEditing ? 'Product updated successfully!' : 'Product created successfully!');

      if (onSuccess) {
        onSuccess();
        return;
      }

      // Reset form (only on create, edit will navigate back via onSuccess)
      if (!isEditing) {
        setFormData({
          sku: '',
          name: '',
          title: '',
          description: '',
          category: '',
          subcategory: '',
          subsubcategory: '',
          image: null,
          imageUrl: '',
          defaultSalePrice: '',
          defaultCost: '',
          currency: 'USD',
          trackInventory: true,
          trackSerial: false,
          stock: '',
          type: 'hardware',
          variants: [{ name: '', sku: '', stock: '', salePrice: '', costPrice: '' }],
        });
      }
    } catch (_err) {
      toast.error('Network error: Could not create product');
    } finally {
      setUploading(false);
    }
  };

  if (categoriesLoading) {
    return <div className={styles.shell}>
   <LoaderPulse/>


    </div>;
  }

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

            <div className={styles.formGroup}>
              <label className={styles.label}>Product SKU *</label>
              <input 
                className={styles.input} 
                placeholder="e.g., PROD-001" 
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                required
              />
            </div>

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

            <div className={styles.formGroup}>
              <label className={styles.label}>Currency</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectInput}
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="PKR">PKR - Pakistani Rupee</option>
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
              <input
                className={styles.input}
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                disabled={hasVariants}
                placeholder="Enter stock"
              />
              {hasVariants && (
                <p style={{ fontSize: '0.85rem', color: '#667085', marginTop: '0.4rem' }}>
                  Stock is calculated from variants ({totalVariantStock})
                </p>
              )}
            </div>

            {hasVariants && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                <strong>Total Stock:</strong> {totalVariantStock}
              </div>
            )}

            <div className={''}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.panelTitle}>
                  Product Variants (Optional)
                </h3>
                <p className={styles.panelText}>
                  Add optional product types with separate stock and pricing.
                </p>
              </div>

              {formData.variants.map((variant, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Variant Name</label>
                      <input
                        className={styles.input}
                        placeholder="e.g. 16GB RAM / Black / i7"
                        value={variant.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleVariantChange(index, 'name', e.target.value)
                        }
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Variant SKU</label>
                     <input
                      className={styles.input}
                      placeholder="e.g. DELL-I7"
                      value={variant.sku}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleVariantChange(index, 'sku', e.target.value)
                      }
                    />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Stock</label>
                      <input
                          type="number"
                          className={styles.input}
                          placeholder="0"
                          value={variant.stock}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleVariantChange(index, 'stock', e.target.value)
                          }
                        />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Sale Price ($)</label>
                      <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={styles.input}
                          placeholder="999.99"
                          value={variant.salePrice}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleVariantChange(index, 'salePrice', e.target.value)
                          }
                        />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Cost Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={styles.input}
                        placeholder="600.00"
                        value={variant.costPrice}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleVariantChange(index, 'costPrice', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {formData.variants.length > 1 && (
                    <button
                      type="button"
                      className={styles.button}
                      onClick={() => removeVariant(index)}
                    >
                      Remove Variant
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className={styles.button}
                onClick={addVariant}
              >
                + Add Variant
              </button>
            </div>
          </div>

          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.panelTitle}>Product Categorization & Image</h3>
              <p className={styles.panelText}>Classify and upload product image.</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Product Type *</label>
              <div className={styles.selectWrapper}>
                <select 
                  className={styles.selectInput}
                  name="type"
                  value={formData.type}
                  onChange={(e) => {
                    handleInputChange(e);
                    setFormData(prev => ({ ...prev, category: '', subcategory: '', subsubcategory: '' }));
                  }}
                >
                  <option value="">Select type...</option>
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="component">Component</option>
                  <option value="other">Other</option>
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Category *</label>
              <div className={styles.selectWrapper}>
                <select 
              className={styles.selectInput}
              value={formData.category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleCategoryChange(e.target.value)
              }
              required
              disabled={!formData.type}
              >
                  <option value="">Select Category</option>
                  {filteredCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Subcategory *</label>
              <div className={styles.selectWrapper}>
                <select 
                 className={styles.selectInput}
                 value={formData.subcategory}
                 onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                 handleSubcategoryChange(e.target.value)
                 }
                 required
                 disabled={!formData.category || availableSubcategories.length === 0}
                 >
                  <option value="">Select Subcategory</option>
                  {availableSubcategories.map((sub, i) => (
                    <option key={i} value={sub.name}>{sub.name}</option>
                  ))}
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Sub-Subcategory *</label>
              <div className={styles.selectWrapper}>
                <select 
                  className={styles.selectInput}
                  name="subsubcategory"
                  value={formData.subsubcategory}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.subcategory || availableSubSubcategories.length === 0}
                >
                  <option value="">Select Sub-Subcategory</option>
                  {availableSubSubcategories.map((ss, i) => (
                    <option key={i} value={ss.name}>{ss.name}</option>
                  ))}
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Product Image</label>
              <label className={styles.uploadBox}>
                <input 
                  type="file" 
                  className={styles.fileInput}
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <span className={styles.uploadTitle}>Drop image here or browse</span>
                <span className={styles.uploadText}>PNG, JPG, WebP up to 5MB</span>
              </label>
              {formData.image && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#0d5c63', margin: 0 }}>
                    ✓ {formData.image.name}
                  </p>
                  <img
                    src={URL.createObjectURL(formData.image)}
                    alt="Preview"
                    style={{
                      marginTop: '0.5rem',
                      maxWidth: '200px',
                      maxHeight: '150px',
                      borderRadius: '8px',
                      border: '1px solid #e4e7ec',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={uploading}
              style={{ opacity: uploading ? 0.7 : 1 }}
            >
              {uploading ? (editProduct ? 'Updating product...' : 'Uploading image & creating...') : (editProduct ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}