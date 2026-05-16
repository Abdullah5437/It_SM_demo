import { useState, useEffect, useCallback } from 'react';
import { RequireAuth } from '../components/auth/RequireAuth';

const API_BASE = 'https://aquamarine-stork-973169.hostingersite.com/api/v1';

interface Setting {
  _id: string;
  key: string;
  value: string;
  group: string;
  description: string;
}

const SETTING_GROUPS = [
  {
    key: 'pagination',
    label: 'Pagination Settings',
    description: 'Control how many items appear per page in all tables across the system.',
    settings: [
      { key: 'pagination_items_per_page', label: 'Items Per Page', type: 'number', description: 'Default number of items to display per page in all tables (e.g., orders, users, products)' },
    ],
  },
  {
    key: 'general',
    label: 'General Settings',
    description: 'General system-wide settings.',
    settings: [
      { key: 'system_name', label: 'System Name', type: 'text', description: 'The name of the system displayed in the UI' },
      { key: 'system_timezone', label: 'Timezone', type: 'text', description: 'Default timezone for the system (e.g., Asia/Karachi)' },
    ],
  },
];

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await window.fetch(`${API_BASE}/settings`, { headers });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getValue = (key: string): string => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || '';
  };

  const handleSave = async (key: string, value: string, group: string, description: string) => {
    setSaving(key);
    setMessage(null);
    try {
      const res = await window.fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ key, value, group, description }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `"${key}" saved successfully` });
        fetchSettings();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save setting' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(null);
    }
  };

  const handleResetPagination = async () => {
    setSaving('pagination_items_per_page');
    setMessage(null);
    try {
      const res = await window.fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ key: 'pagination_items_per_page', value: '10', group: 'pagination', description: 'Default number of items to display per page in all tables' }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Pagination reset to 10 items per page' });
        fetchSettings();
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(null);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: '1.5rem',
      maxWidth: 'full',
      margin: '0 auto',
    },
    header: {
      marginBottom: '2rem',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#101828',
      margin: '0 0 0.5rem 0',
    },
    subtitle: {
      fontSize: '0.9rem',
      color: '#667085',
      margin: 0,
    },
    cardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem',
      alignItems: 'start',
    },
   card: {
      background: '#fff',
      border: '1px solid #e4e7ec',
      borderRadius: '12px',
      overflow: 'hidden',
      width: '100%',
    },
    cardHeader: {
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #e4e7ec',
      background: '#f9fafb',
    },
    cardTitle: {
      fontSize: '1.05rem',
      fontWeight: 600,
      color: '#101828',
      margin: '0 0 0.25rem 0',
    },
    cardDesc: {
      fontSize: '0.85rem',
      color: '#667085',
      margin: 0,
    },
    cardBody: {
      padding: '1.5rem',
     
    },
    fieldGroup: {
      marginBottom: '1.25rem',
      paddingBottom: '1.25rem',
      borderBottom: '1px solid #f0f0f0',
    },
    fieldLabel: {
      display: 'block',
      fontSize: '0.9rem',
      fontWeight: 500,
      color: '#344054',
      marginBottom: '0.35rem',
    },
    fieldDesc: {
      display: 'block',
      fontSize: '0.8rem',
      color: '#98a2b3',
      marginBottom: '0.5rem',
    },
    input: {
      width: '100%',
      padding: '0.6rem 0.75rem',
      border: '1px solid #d0d5dd',
      borderRadius: '8px',
      fontSize: '0.9rem',
      color: '#101828',
      background: '#fff',
      boxSizing: 'border-box' as const,
      outline: 'none',
    },
    inputRow: {
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'center',
    },
    saveBtn: {
      padding: '0.6rem 1.25rem',
      background: '#0d5c63',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.85rem',
      fontWeight: 500,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
      flexShrink: 0,
    },
    resetBtn: {
      padding: '0.5rem 1rem',
      background: 'transparent',
      color: '#667085',
      border: '1px solid #d0d5dd',
      borderRadius: '8px',
      fontSize: '0.8rem',
      cursor: 'pointer',
      marginTop: '0.75rem',
    },
    message: {
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      fontSize: '0.85rem',
      fontWeight: 500,
    },
    successMsg: {
      background: '#ecfdf3',
      color: '#067647',
      border: '1px solid #abefc6',
    },
    errorMsg: {
      background: '#fef3f2',
      color: '#b42318',
      border: '1px solid #fecdca',
    },
    loading: {
      textAlign: 'center' as const,
      padding: '3rem',
      color: '#667085',
    },
  };

  if (loading) {
    return (
      <RequireAuth roles={['admin']}>
        <div style={styles.container}>
          <div style={styles.loading}>Loading system settings...</div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth roles={['admin']}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>System Settings</h1>
          <p style={styles.subtitle}>Configure system-wide settings. These settings affect all users and modules.</p>
        </div>

        {message && (
          <div style={{ ...styles.message, ...(message.type === 'success' ? styles.successMsg : styles.errorMsg) }}>
            {message.text}
          </div>
        )}

        <div style={styles.cardsGrid}>
  {SETTING_GROUPS.map((group) => (
    <div key={group.key} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>{group.label}</h3>
              <p style={styles.cardDesc}>{group.description}</p>
            </div>
            <div style={styles.cardBody}>
              {group.settings.map((setting) => {
                const currentValue = getValue(setting.key);
                return (
                  <div key={setting.key} style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>{setting.label}</label>
                    <span style={styles.fieldDesc}>{setting.description}</span>
                    <div style={styles.inputRow}>
                      <input
                        type={setting.type}
                        style={styles.input}
                        defaultValue={currentValue}
                        placeholder={`Enter ${setting.label.toLowerCase()}...`}
                        id={`input-${setting.key}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            handleSave(setting.key, input.value, group.key, setting.description);
                          }
                        }}
                      />
                      <button
                        style={{
                          ...styles.saveBtn,
                          opacity: saving === setting.key ? 0.6 : 1,
                        }}
                        disabled={saving === setting.key}
                        onClick={() => {
                          const input = document.getElementById(`input-${setting.key}`) as HTMLInputElement;
                          handleSave(setting.key, input.value, group.key, setting.description);
                        }}
                      >
                        {saving === setting.key ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {group.key === 'pagination' && (
                <button style={styles.resetBtn} onClick={handleResetPagination}>
                  Reset to default (10 per page)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
        </div>
    </RequireAuth>
  );
}