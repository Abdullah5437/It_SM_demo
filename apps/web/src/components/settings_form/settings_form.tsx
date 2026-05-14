import { useState } from 'react';
import { toast } from 'react-toastify';
// import { useAuth } from '../../contexts/AuthContext';
import styles from "./settings_form.module.css";
type EmailNotifications = {
  newOrders: boolean;
  userRegistrations: boolean;
  systemAlerts: boolean;
};

type Settings = {
  theme: 'light' | 'dark' | 'auto';
  defaultView: 'dashboard' | 'products' | 'orders' | 'users';
  itemsPerPage: number;
  emailNotifications: EmailNotifications;
  adminAccessLevel: 'full' | 'limited' | 'readonly';
  sessionTimeout: number;
  twoFactorAuth: boolean;
  maintenanceMode: boolean;
  debugMode: boolean;
};
export type DefaultView = 'dashboard' | 'products' | 'orders' | 'users';

export default function SettingsForm() {
const [settings, setSettings] = useState<Settings>({
  theme: 'light',
  defaultView: 'dashboard',
  itemsPerPage: 10,
  emailNotifications: {
    newOrders: true,
    userRegistrations: true,
    systemAlerts: false,
  },
  adminAccessLevel: 'full',
  sessionTimeout: 30,
  twoFactorAuth: false,
  maintenanceMode: false,
  debugMode: false,
});
const handleSettingChange = <K extends keyof Settings>(
  key: K,
  value: Settings[K]
) => {
  setSettings(prev => ({
    ...prev,
    [key]: value,
  }));
};

  const handleNotificationChange = (notification: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [notification]: checked
      }
    }));
  };

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };



const toTheme = (value: string): Settings['theme'] => {
  if (value === 'light' || value === 'dark' || value === 'auto') {
    return value;
  }
  return 'light'; // fallback safety
};
  return (
    <div className={styles.shell}>
      <div className={styles.background}></div>

      <div className={styles.layout}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.panelTitle}>Panel Configuration</h3>
            <p className={styles.panelText}>Configure your admin panel settings and preferences.</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Panel Theme</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.selectInput}
                value={settings.theme}
               onChange={(e) =>
                handleSettingChange('theme', toTheme(e.target.value))
              }
              >
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
                <option value="auto">Auto (System)</option>
              </select>
              <span className={styles.selectArrow} aria-hidden="true"></span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Default View</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.selectInput}
                value={settings.defaultView}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
  handleSettingChange('defaultView', e.target.value as DefaultView)
}
              >
                <option value="dashboard">Dashboard</option>
                <option value="products">Products</option>
                <option value="orders">Orders</option>
                <option value="users">Users</option>
              </select>
              <span className={styles.selectArrow} aria-hidden="true"></span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Items Per Page</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.selectInput}
                value={settings.itemsPerPage}
                onChange={(e) => handleSettingChange('itemsPerPage', parseInt(e.target.value))}
              >
                <option value={5}>5 items</option>
                <option value={10}>10 items</option>
                <option value={25}>25 items</option>
                <option value={50}>50 items</option>
              </select>
              <span className={styles.selectArrow} aria-hidden="true"></span>
            </div>
          </div>

          <div className={styles.sectionTitle}>Notifications</div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Notifications</label>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={settings.emailNotifications.newOrders}
                  onChange={(e) => handleNotificationChange('newOrders', e.target.checked)}
                />
                <span className={styles.checkboxText}>New orders</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={settings.emailNotifications.userRegistrations}
                  onChange={(e) => handleNotificationChange('userRegistrations', e.target.checked)}
                />
                <span className={styles.checkboxText}>User registrations</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={settings.emailNotifications.systemAlerts}
                  onChange={(e) => handleNotificationChange('systemAlerts', e.target.checked)}
                />
                <span className={styles.checkboxText}>System alerts</span>
              </label>
            </div>
          </div>

          <button className={styles.button} onClick={handleSave}>Save Settings</button>
        </div>

        {/* {canAccessAdminSettings && (
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.panelTitle}>Access Control</h3>
              <p className={styles.panelText}>Manage user permissions and access levels.</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Admin Access Level</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectInput}
                  value={settings.adminAccessLevel}
                  onChange={(e) => handleSettingChange('adminAccessLevel', e.target.value)}
                >
                  <option value="full">Full Access</option>
                  <option value="limited">Limited Access</option>
                  <option value="readonly">Read Only</option>
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Session Timeout</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectInput}
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={240}>4 hours</option>
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Two-Factor Authentication</label>
              <div className={styles.toggleGroup}>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggle}
                    checked={settings.twoFactorAuth}
                    onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                  />
                  <span className={styles.toggleText}>Enable 2FA</span>
                </label>
              </div>
            </div>

            <div className={styles.sectionTitle}>System Settings</div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Maintenance Mode</label>
              <div className={styles.toggleGroup}>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggle}
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  />
                  <span className={styles.toggleText}>Enable maintenance mode</span>
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Debug Mode</label>
              <div className={styles.toggleGroup}>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggle}
                    checked={settings.debugMode}
                    onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                  />
                  <span className={styles.toggleText}>Enable debug logging</span>
                </label>
              </div>
            </div>

            <button className={styles.button} onClick={handleApply}>Apply Changes</button>
          </div>
        )} */}
      </div>
    </div>
  );
}