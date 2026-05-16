import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import LoaderPulse from '../components/Loader/Loader';
import DataTable from '../components/ui/DataTable';
import { RequireAuth } from '../components/auth/RequireAuth';
import UserForm from '../components/user_form/form';
import { usePagination } from '../hooks/usePagination';
import { useSystemSettings } from '../hooks/useSystemSettings';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  roles?: string[];
  status?: string;
  createdAt?: string;
}

const userColumns = [
  { key: 'select', label: '' },
  { key: 'userId', label: 'User ID' },
  { key: 'member', label: 'Member' },
  { key: 'access', label: 'Access' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action' },
];

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const { getPaginationItemsPerPage } = useSystemSettings();
  const pagination = usePagination(getPaginationItemsPerPage());

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchUsers = useCallback(async (limit: number = 10, skip: number = 0) => {
    try {
      setLoading(true);
      const res = await window.fetch(`https://aquamarine-stork-973169.hostingersite.com/api/v1/users?limit=${limit}&skip=${skip}`, { headers });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
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
    fetchUsers(pagination.pageParams.limit, pagination.pageParams.skip);
  }, [fetchUsers, pagination.pageParams, refreshKey]);

  const handleEdit = useCallback((user: UserItem) => {
    setEditUser(user);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (user: UserItem) => {
    const confirmed = window.confirm(`Are you sure you want to delete user ${user.name}?`);
    if (!confirmed) return;

    try {
      const res = await window.fetch(
        `https://aquamarine-stork-973169.hostingersite.com/api/v1/users/${user._id}`,
        { method: 'DELETE', headers }
      );
      const json = await res.json();
      if (json.success) {
        toast.success('User deleted successfully!');
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(json.error || 'Failed to delete user');
      }
    } catch {
      toast.error('Network error');
    }
  }, []);

  const handleSuccess = useCallback(() => {
    setShowForm(false);
    setEditUser(null);
    setRefreshKey(prev => prev + 1);
  }, []);

  // Map users to DataTable rows
  const userRows = users.map((user) => {
    const userIdShort = user._id.slice(-6).toUpperCase();
    const roles = user.roles?.join(', ') || 'user';
    let statusTone: 'active' | 'warning' | 'accent' | 'inactive' = 'warning';
    if (user.status === 'active') statusTone = 'active';
    else if (user.status === 'inactive') statusTone = 'inactive';
    else if (user.status === 'suspended') statusTone = 'inactive';

    return {
      id: user._id,
      cells: [
        { type: 'checkbox' as const, label: `Select user ${user.name}` },
        { type: 'pill' as const, text: `#USR-${userIdShort}` },
        {
          type: 'member' as const,
          title: user.name,
          subtitle: user.email,
        },
        {
          type: 'stack' as const,
          title: roles,
          subtitle: 'System User',
        },
        { type: 'status' as const, label: user.status || 'active', tone: statusTone },
        {
          type: 'action' as const,
          label: `Actions for ${user.name}`,
          onEdit: () => handleEdit(user),
          onDelete: () => handleDelete(user),
        },
      ],
    };
  });

  return (
    <RequireAuth roles={['admin', 'accounts']}>
      <div style={{ padding: '1rem' }}>
        {!showForm ? (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1>User Management</h1>
              <button
                onClick={() => { setEditUser(null); setShowForm(true); }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#0d5c63',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                + Create New User
              </button>
            </div>
            {loading ? (
              <LoaderPulse />
            ) : (
              <DataTable
                kicker="User Directory"
                heading="Workspace access overview"
                meta={[`${users.length} managed users`, 'API Connected']}
                columns={userColumns}
                rows={userRows}
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
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowForm(false)}
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#f0f0f0',
                border: '1px solid #d0d0d0',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              ← Back to User List
            </button>
            <UserForm editUser={editUser} onSuccess={handleSuccess} />
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
