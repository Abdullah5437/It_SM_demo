import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Banner from '../Banner/Banner';
import Sidebar from '../Sidebar/Sidebar';
import styles from './AppLayout.module.css';

type AppLayoutProps = {
  children: ReactNode;
};

type PageMeta = {
  title: string;
  subtitle: string;
  buttonLabel?: string;
};

const pageMeta: Record<string, PageMeta> = {
  '/': {
    title: 'Welcome',
    subtitle: 'Navigate through the I-ITSM workspace from one consistent app layout.',
  },
  '/dashboard': {
    title: 'Admin Dashboard',
    subtitle: 'Manage your application and monitor key metrics.',
    buttonLabel: 'Add New User',
  },
  '/products': {
    title: 'Products',
    subtitle: 'Create, review, and manage your product records in one place.',
  },
  '/order': {
    title: 'Orders',
    subtitle: 'Track incoming orders and keep fulfillment moving smoothly.',
  },
  '/users': {
    title: 'Users',
    subtitle: 'View and manage user information across the system.',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Update workspace preferences and system configuration.',
  },
  '/reports': {
    title: 'Reports',
    subtitle: 'Review insights and reporting data across the platform.',
  },
};

const fallbackMeta: PageMeta = {
  title: 'I-ITSM',
  subtitle: 'Work across the platform with a shared sidebar and page banner.',
};

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const meta = pageMeta[router.pathname] ?? fallbackMeta;

  // When not authenticated, just show the page content without sidebar/banner
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.content}>
        <div className={styles.inner}>
          <Banner
            title={meta.title}
            subtitle={meta.subtitle}
            buttonLabel={meta.buttonLabel}
          />
          <div className={styles.pageContent}>{children}</div>
        </div>
      </main>
    </div>
  );
}
