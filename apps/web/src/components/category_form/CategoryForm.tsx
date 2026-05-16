import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import styles from './category.module.css';

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

export default function CategoryForm() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Form 1: Create Category ──
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catType, setCatType] = useState('');

  // ── Form 2: Create Subcategory ──
  const [subCatId, setSubCatId] = useState('');
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');

  // ── Form 3: Create Sub-Subcategory ──
  const [ssCatId, setSsCatId] = useState('');
  const [ssSubName, setSsSubName] = useState('');
  const [ssName, setSsName] = useState('');
  const [ssDesc, setSsDesc] = useState('');

  // ── Inline edit state ──
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatType, setEditCatType] = useState('');

  const [editingSubKey, setEditingSubKey] = useState<string | null>(null); // "catId::subName"
  const [editSubName, setEditSubName] = useState('');
  const [editSubDesc, setEditSubDesc] = useState('');

  const [editingSsKey, setEditingSsKey] = useState<string | null>(null); // "catId::subName::ssName"
  const [editSsName, setEditSsName] = useState('');
  const [editSsDesc, setEditSsDesc] = useState('');

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await window.fetch('https://aquamarine-stork-973169.hostingersite.com/api/v1/categories/categories', { headers });
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Handle: Create Category ──
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      const res = await window.fetch('https://aquamarine-stork-973169.hostingersite.com/api/v1/categories/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: catName.trim(),
          description: catDesc.trim() || undefined,
          type: catType || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(prev => [...prev, json.data]);
        setCatName(''); setCatDesc(''); setCatType('');
        toast.success('Category created!');
      } else {
        toast.error(json.error || 'Failed');
      }
    } catch { toast.error('Network error'); }
  };

  // ── Handle: Create Subcategory ──
  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCatId || !subName.trim()) return;
    try {
      const res = await window.fetch(`https://aquamarine-stork-973169.hostingersite.com/api/v1/categories/categories/${subCatId}/subcategories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: subName.trim(), description: subDesc.trim() || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(prev => prev.map(c => (c._id === subCatId ? json.data : c)));
        setSubName(''); setSubDesc('');
        toast.success('Subcategory added!');
      } else {
        toast.error(json.error || 'Failed');
      }
    } catch { toast.error('Network error'); }
  };

  // ── Handle: Create Sub-Subcategory ──
  const handleCreateSubSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssCatId || !ssSubName || !ssName.trim()) return;
    try {
      const res = await window.fetch(`https://aquamarine-stork-973169.hostingersite.com/api/v1/categories/categories/${ssCatId}/subcategories/${encodeURIComponent(ssSubName)}/subsubcategories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: ssName.trim(), description: ssDesc.trim() || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(prev => prev.map(c => (c._id === ssCatId ? json.data : c)));
        setSsName(''); setSsDesc('');
        toast.success('Sub-subcategory added!');
      } else {
        toast.error(json.error || 'Failed');
      }
    } catch { toast.error('Network error'); }
  };

  // ── Handle: Update Category ──
  const startEditCategory = (cat: CategoryItem) => {
    setEditingCategoryId(cat._id);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setEditCatType(cat.type || '');
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
  };

  const handleUpdateCategory = async (catId: string) => {
    if (!editCatName.trim()) return;
    try {
      const res = await window.fetch(`https://aquamarine-stork-973169.hostingersite.com/api/v1/categories/categories/${catId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: editCatName.trim(),
          description: editCatDesc.trim() || undefined,
          type: editCatType || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(prev => prev.map(c => (c._id === catId ? json.data : c)));
        setEditingCategoryId(null);
        toast.success('Category updated!');
      } else {
        toast.error(json.error || 'Failed');
      }
    } catch { toast.error('Network error'); }
  };

  // ── Handle: Update Subcategory ──
  const startEditSubcategory = (catId: string, sub: SubcategoryItem) => {
    setEditingSubKey(`${catId}::${sub.name}`);
    setEditSubName(sub.name);
    setEditSubDesc(sub.description || '');
  };

  const cancelEditSubcategory = () => {
    setEditingSubKey(null);
  };

  const handleUpdateSubcategory = async (catId: string, oldName: string) => {
    if (!editSubName.trim()) return;
    try {
      const res = await window.fetch(`https://aquamarine-stork-973169.hostingersite.com/api/v1/categories/categories/${catId}/subcategories/${encodeURIComponent(oldName)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: editSubName.trim() || undefined,
          description: editSubDesc.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(prev => prev.map(c => (c._id === catId ? json.data : c)));
        setEditingSubKey(null);
        toast.success('Subcategory updated!');
      } else {
        toast.error(json.error || 'Failed');
      }
    } catch { toast.error('Network error'); }
  };

  // ── Handle: Update Sub-Subcategory ──
  const startEditSubSubcategory = (catId: string, subName: string, ss: SubSubcategoryItem) => {
    setEditingSsKey(`${catId}::${subName}::${ss.name}`);
    setEditSsName(ss.name);
    setEditSsDesc(ss.description || '');
  };

  const cancelEditSubSubcategory = () => {
    setEditingSsKey(null);
  };

  const handleUpdateSubSubcategory = async (catId: string, subName: string, oldSsName: string) => {
    if (!editSsName.trim()) return;
    try {
      const res = await window.fetch(`https://aquamarine-stork-973169.hostingersite.com/api/v1/categories/categories/${catId}/subcategories/${encodeURIComponent(subName)}/subsubcategories/${encodeURIComponent(oldSsName)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: editSsName.trim() || undefined,
          description: editSsDesc.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories(prev => prev.map(c => (c._id === catId ? json.data : c)));
        setEditingSsKey(null);
        toast.success('Sub-subcategory updated!');
      } else {
        toast.error(json.error || 'Failed');
      }
    } catch { toast.error('Network error'); }
  };

  // Available subcategories for the selected category in Form 3
  const selectedCategory = categories.find(c => c._id === ssCatId);
  const availableSubs = selectedCategory ? selectedCategory.subcategories : [];

  if (loading) {
    return <div className={styles.shell}><p>Loading categories...</p></div>;
  }

  return (
    <div className={styles.shell}>
      <div className={styles.layout}>
        {/* ─── Form 1: Create Category ─── */}
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.panelTitle}>Create Category</h3>
            <p className={styles.panelText}>Add a new product category.</p>
          </div>
          <form onSubmit={handleCreateCategory}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category Name *</label>
              <input className={styles.input} placeholder="e.g., Computers" value={catName} onChange={e => setCatName(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Product Type (optional)</label>
              <div className={styles.selectWrapper}>
                <select className={styles.selectInput} value={catType} onChange={e => setCatType(e.target.value)}>
                  <option value="">All Types</option>
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="component">Component</option>
                  <option value="other">Other</option>
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Description (optional)</label>
              <input className={styles.input} placeholder="Brief description" value={catDesc} onChange={e => setCatDesc(e.target.value)} />
            </div>
            <button type="submit" className={styles.button}>Create Category</button>
          </form>
        </div>

        {/* ─── Form 2: Create Subcategory ─── */}
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.panelTitle}>Create Subcategory</h3>
            <p className={styles.panelText}>Add a subcategory to an existing category.</p>
          </div>
          <form onSubmit={handleCreateSubcategory}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Parent Category *</label>
              <div className={styles.selectWrapper}>
                <select className={styles.selectInput} value={subCatId} onChange={e => setSubCatId(e.target.value)} required>
                  <option value="">Select a category...</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}{c.type ? ` (${c.type})` : ''}</option>
                  ))}
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Subcategory Name *</label>
              <input className={styles.input} placeholder="e.g., Laptops" value={subName} onChange={e => setSubName(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Description (optional)</label>
              <input className={styles.input} placeholder="Brief description" value={subDesc} onChange={e => setSubDesc(e.target.value)} />
            </div>
            <button type="submit" className={styles.button}>Add Subcategory</button>
          </form>
        </div>

        {/* ─── Form 3: Create Sub-Subcategory ─── */}
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.panelTitle}>Create Sub-Subcategory</h3>
            <p className={styles.panelText}>Add a sub-subcategory under a subcategory.</p>
          </div>
          <form onSubmit={handleCreateSubSubcategory}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Parent Category *</label>
              <div className={styles.selectWrapper}>
                <select className={styles.selectInput} value={ssCatId} onChange={e => { setSsCatId(e.target.value); setSsSubName(''); }} required>
                  <option value="">Select a category...</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}{c.type ? ` (${c.type})` : ''}</option>
                  ))}
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Parent Subcategory *</label>
              <div className={styles.selectWrapper}>
                <select className={styles.selectInput} value={ssSubName} onChange={e => setSsSubName(e.target.value)} required disabled={!ssCatId}>
                  <option value="">Select a subcategory...</option>
                  {availableSubs.map((s, i) => (
                    <option key={i} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Sub-Subcategory Name *</label>
              <input className={styles.input} placeholder="e.g., Gaming Laptops" value={ssName} onChange={e => setSsName(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Description (optional)</label>
              <input className={styles.input} placeholder="Brief description" value={ssDesc} onChange={e => setSsDesc(e.target.value)} />
            </div>
            <button type="submit" className={styles.button}>Add Sub-Subcategory</button>
          </form>
        </div>

        {/* ─── List ─── */}
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.panelTitle}>All Categories ({categories.length})</h3>
            <p className={styles.panelText}>Overview of existing categories and their nested structure.</p>
          </div>
          {categories.length === 0 ? (
            <p style={{ color: '#667085', textAlign: 'center', padding: '2rem 0' }}>No categories yet.</p>
          ) : (
            <div className={styles.categoryList}>
              {categories.map(cat => (
                <div key={cat._id} className={styles.nestedCard}>
                  {/* ── Category inline edit ── */}
                  {editingCategoryId === cat._id ? (
                    <div className={styles.inlineEditRow}>
                      <input className={styles.inlineInput} placeholder="Category name" value={editCatName} onChange={e => setEditCatName(e.target.value)} />
                      <input className={styles.inlineInput} placeholder="Description" value={editCatDesc} onChange={e => setEditCatDesc(e.target.value)} />
                      <div className={styles.selectWrapper}>
                        <select className={styles.inlineInput} value={editCatType} onChange={e => setEditCatType(e.target.value)} style={{ appearance: 'auto', paddingRight: '0.55rem' }}>
                          <option value="">All Types</option>
                          <option value="hardware">Hardware</option>
                          <option value="software">Software</option>
                          <option value="component">Component</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className={styles.inlineActions}>
                        <button className={styles.btnSave} onClick={() => handleUpdateCategory(cat._id)}>Save</button>
                        <button className={styles.btnCancel} onClick={cancelEditCategory}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: '#101828' }}>{cat.name}</strong>
                          {cat.type && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#667085', background: '#f2f4f7', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>{cat.type}</span>
                          )}
                        </div>
                        <button className={styles.btnEdit} onClick={() => startEditCategory(cat)}>✎ Edit</button>
                      </div>
                      {cat.description && <p style={{ fontSize: '0.82rem', color: '#667085', margin: '0.25rem 0 0.75rem' }}>{cat.description}</p>}
                    </div>
                  )}
                  {cat.subcategories.length > 0 ? (
                    <div style={{ borderLeft: '2px solid #e4e7ec', paddingLeft: '0.75rem', marginTop: '0.75rem' }}>
                      {cat.subcategories.map((sub, si) => {
                        const subKey = `${cat._id}::${sub.name}`;
                        return (
                          <div key={si} style={{ marginBottom: '0.5rem' }}>
                            {/* ── Subcategory inline edit ── */}
                            {editingSubKey === subKey ? (
                              <div className={styles.inlineEditRow}>
                                <input className={styles.inlineInput} placeholder="Subcategory name" value={editSubName} onChange={e => setEditSubName(e.target.value)} />
                                <input className={styles.inlineInput} placeholder="Description" value={editSubDesc} onChange={e => setEditSubDesc(e.target.value)} />
                                <div className={styles.inlineActions}>
                                  <button className={styles.btnSave} onClick={() => handleUpdateSubcategory(cat._id, sub.name)}>Save</button>
                                  <button className={styles.btnCancel} onClick={cancelEditSubcategory}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#344054' }}>{sub.name}</div>
                                  <button className={styles.btnEdit} onClick={() => startEditSubcategory(cat._id, sub)}>✎ Edit</button>
                                </div>
                                {sub.description && <p style={{ fontSize: '0.8rem', color: '#667085', margin: '0.15rem 0 0.25rem' }}>{sub.description}</p>}
                              </div>
                            )}
                            {sub.subSubcategories.length > 0 && (
                              <div style={{ paddingLeft: '0.75rem', marginTop: '0.25rem', color: '#667085', fontSize: '0.85rem' }}>
                                {sub.subSubcategories.map((ss, ssi) => {
                                  const ssKey = `${cat._id}::${sub.name}::${ss.name}`;
                                  return (
                                    <div key={ssi} style={{ marginBottom: '0.25rem' }}>
                                      {/* ── Sub-subcategory inline edit ── */}
                                      {editingSsKey === ssKey ? (
                                        <div className={styles.inlineEditRow}>
                                          <input className={styles.inlineInput} placeholder="Sub-subcategory name" value={editSsName} onChange={e => setEditSsName(e.target.value)} />
                                          <input className={styles.inlineInput} placeholder="Description" value={editSsDesc} onChange={e => setEditSsDesc(e.target.value)} />
                                          <div className={styles.inlineActions}>
                                            <button className={styles.btnSave} onClick={() => handleUpdateSubSubcategory(cat._id, sub.name, ss.name)}>Save</button>
                                            <button className={styles.btnCancel} onClick={cancelEditSubSubcategory}>Cancel</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <span>• {ss.name}</span>
                                          <button className={styles.btnEdit} onClick={() => startEditSubSubcategory(cat._id, sub.name, ss)}>✎ Edit</button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: '#98a2b3', fontStyle: 'italic', marginTop: '0.75rem' }}>No subcategories</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}