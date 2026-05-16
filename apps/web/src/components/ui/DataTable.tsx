import { useEffect, useState } from 'react';
import styles from './DataTable.module.css';
import Pagination from './Pagination';

type StatusTone = 'active' | 'inactive' | 'warning' | 'accent';

type DataTableCell =
  | {
      type: 'checkbox';
      label: string;
    }
  | {
      type: 'pill';
      text: string;
    }
  | {
      type: 'member';
      title: string;
      subtitle: string;
    }
  | {
      type: 'stack';
      title: string;
      subtitle?: string;
    }
  | {
      type: 'status';
      label: string;
      tone: StatusTone;
    }
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'action';
      label: string;
      onEdit?: () => void;
      onDelete?: () => void;
    };

type DataTableColumn = {
  key: string;
  label: string;
};

type DataTableRow = {
  id: string | number;
  cells: DataTableCell[];
};

type User = {
  _id: string;
  name: string;
  email: string;
  roles?: string[];
  status?: string;
};

type DataTableProps = {
  kicker?: string;
  heading?: string;
  meta?: string[];
  columns?: DataTableColumn[];
  rows?: DataTableRow[];
  onEdit?: (user: User) => void;
  /** When true, the table will fetch users automatically (only used if rows not provided) */
  autoFetchUsers?: boolean;
  /** Pagination props */
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
  };
};

const defaultColumns: DataTableColumn[] = [
  { key: 'select', label: '' },
  { key: 'userId', label: 'User ID' },
  { key: 'member', label: 'Member' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action' },
];

function renderCell(cell: DataTableCell) {
  switch (cell.type) {
    case 'checkbox':
      return <input type="checkbox" aria-label={cell.label} />;

    case 'pill':
      return <span className={styles.orderPill}>{cell.text}</span>;

    case 'member':
      return (
        <div className={styles.memberCell}>
          <div className={styles.memberInfo}>
            <span className={styles.memberName}>{cell.title}</span>
            <span className={styles.memberText}>{cell.subtitle}</span>
          </div>
        </div>
      );

    case 'stack':
      return (
        <div className={styles.occupation}>
          <span className={styles.roleTitle}>{cell.title}</span>

          {cell.subtitle ? (
            <span className={styles.memberText}>{cell.subtitle}</span>
          ) : null}
        </div>
      );

    case 'status': {
      const toneClass =
        cell.tone === 'active'
          ? styles.statusActive
          : cell.tone === 'warning'
          ? styles.statusWarning
          : cell.tone === 'accent'
          ? styles.statusAccent
          : styles.statusInactive;

      return (
        <span className={`${styles.statusBadge} ${toneClass}`}>
          <span className={styles.statusDot} />
          {cell.label}
        </span>
      );
    }

    case 'text':
      return <span className={styles.roleTitle}>{cell.text}</span>;

    case 'action':
      return (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <button
            aria-label="Edit"
            onClick={cell.onEdit}
            style={{backgroundColor: 'gray', color: '#fff',border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px'}}
          >
            edit
          </button>

          <button
            style={{backgroundColor: 'gray', color: '#fff',border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px'}}
            aria-label="Delete"
            onClick={cell.onDelete}
          >
            delete
          </button>
        </div>
      );

    default:
      return null;
  }
}

export default function Table({
  heading = 'Overview',
  meta,
  columns = defaultColumns,
  rows: externalRows,
  onEdit,
  autoFetchUsers = false,
  pagination,
}: DataTableProps) {
  const [internalRows, setInternalRows] = useState<DataTableRow[]>([]);
  const [loading, setLoading] = useState(!!autoFetchUsers);

  // Use external rows if provided, otherwise use internal state
  const rows = externalRows || internalRows;

  /**
   * Fetch users (only when autoFetchUsers is true and no rows are provided externally)
   */
  const fetchUsers = async () => {
    if (!autoFetchUsers || externalRows) return;
    try {
      setLoading(true);

      const response = await fetch(
        'https://aquamarine-stork-973169.hostingersite.com/api/v1/users'
      );
      const data = await response.json();

      const users = data?.data || data || [];

      const mappedRows: DataTableRow[] = users.map((user: User) => ({
        id: user._id,

        cells: [
          {
            type: 'checkbox',
            label: `Select ${user.name}`,
          },

          {
            type: 'pill',
            text: user._id.slice(-6),
          },

          {
            type: 'member',
            title: user.name,
            subtitle: user.email,
          },

          {
            type: 'stack',
            title: user.roles?.join(', ') || 'user',
            subtitle: 'System User',
          },

          {
            type: 'status',
            label: user.status || 'active',
            tone:
              user.status === 'active'
                ? 'active'
                : user.status === 'inactive'
                ? 'inactive'
                : 'warning',
          },

          {
            type: 'action',

            label: `Actions for ${user.name}`,

            onEdit: () => {
              if (onEdit) {
                onEdit(user);
              }
            },

            onDelete: async () => {
              const confirmed = window.confirm(
                `Delete ${user.name}?`
              );

              if (!confirmed) return;

              try {
                await fetch(
                  `https://aquamarine-stork-973169.hostingersite.com/api/v1/users/${user._id}`,
                  {
                    method: 'DELETE',
                  }
                );

                fetchUsers();
              } catch {
                // silent
              }
            },
          },
        ],
      }));

      setInternalRows(mappedRows);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetchUsers && !externalRows) {
      fetchUsers();
    }
  }, [autoFetchUsers, externalRows]);

  const metaItems = meta ?? [
    `${rows.length} items`,
    'API Connected',
  ];

  return (
    <div className={styles.container}>
      <div className={styles.tableHeader}>
        <div>
          <h3 className={styles.heading}>{heading}</h3>
        </div>

        <div className={styles.headerMeta}>
          {metaItems.map((item) => (
            <span key={item} className={styles.metaPill}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <div style={{ padding: '2rem' }}>
            Loading data...
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>
                    {column.key === 'select'
                      ? ''
                      : column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem', color: '#98a2b3' }}>
                    No data available
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  return (
                    <tr key={row.id}>
                      {row.cells.map((cell, index) => (
                        <td
                          key={`${row.id}-${columns[index]?.key ?? index}`}
                        >
                          {renderCell(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {pagination && !loading && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.onPageChange}
          onItemsPerPageChange={pagination.onItemsPerPageChange}
        />
      )}
    </div>
  );
}