import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'https://aquamarine-stork-973169.hostingersite.com/api/v1';

interface Setting {
  _id: string;
  key: string;
  value: string;
  group: string;
  description: string;
}

interface UseSystemSettingsReturn {
  settings: Setting[];
  loading: boolean;
  error: string | null;
  getSetting: (key: string) => string | undefined;
  getGroupSettings: (group: string) => Setting[];
  updateSetting: (key: string, value: string, group?: string, description?: string) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
  getPaginationItemsPerPage: () => number;
}

export function useSystemSettings(): UseSystemSettingsReturn {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const refreshSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await window.fetch(`${API_BASE}/settings`, { headers });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data || []);
      }
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const getSetting = useCallback((key: string): string | undefined => {
    const setting = settings.find(s => s.key === key);
    return setting?.value;
  }, [settings]);

  const getGroupSettings = useCallback((group: string): Setting[] => {
    return settings.filter(s => s.group === group);
  }, [settings]);

  const updateSetting = useCallback(async (
    key: string,
    value: string,
    group = 'general',
    description = ''
  ): Promise<boolean> => {
    try {
      const res = await window.fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ key, value, group, description }),
      });
      const json = await res.json();
      if (json.success) {
        await refreshSettings();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const getPaginationItemsPerPage = useCallback((): number => {
    const val = getSetting('pagination_items_per_page');
    return val ? parseInt(val, 10) : 10;
  }, [getSetting]);

  return {
    settings,
    loading,
    error,
    getSetting,
    getGroupSettings,
    updateSetting,
    refreshSettings,
    getPaginationItemsPerPage,
  };
}