import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from "./form.module.css";

interface UserFormProps {
  editUser?: {
    _id: string;
    name: string;
    email: string;
    roles?: string[];
    status?: string;
  } | null;
  onSuccess?: () => void;
}

export default function UserForm({ editUser, onSuccess }: UserFormProps) {
    const [signupKey, setSignupKey] = useState('') as any;
  const [formData, setFormData] = useState({
  name: editUser?.name || '',
  email: editUser?.email || '',
  password: '',
  confirmPassword: '',
//   signupKey: '',
  roles: (editUser?.roles as string[]) || ['user'],
  status: editUser?.status || 'active',
});
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roleOptions = [
    { value: 'user', label: 'User', description: 'Basic user access' },
    { value: 'sales', label: 'Sales', description: 'Sales team access' },
    { value: 'support', label: 'Support', description: 'Support team access' },
    { value: 'accounts', label: 'Accounts', description: 'Accounting access' },
    { value: 'admin', label: 'Admin', description: 'Full administrative access' },
  ];

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'Please select at least one role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  const submitData = {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    roles: formData.roles,
    status: formData.status,
  };

  const isEditing = !!editUser?._id;

  try {
    const url = isEditing
      ? `http://localhost:4000/api/v1/users/${editUser._id}`
      : 'http://localhost:4000/api/v1/users';

    const res = await fetch(url, {
      method: isEditing ? 'PATCH' : 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
         'x-signup-key': !isEditing ? signupKey : '',
      },
      body: JSON.stringify(submitData),
    });

    if (!res.ok) {
      const errorData = await res.json() as any;
      throw new Error(errorData.message || 'Something went wrong');
    }

    toast.success(isEditing ? 'User updated successfully!' : 'User created successfully!');

    // optional: reset form
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    //   signupKey: '',
      roles: ['user'],
      status: 'active',
    });

    if (onSuccess) {
      onSuccess();
    }

  } catch (error: any) {
    console.error('API Error:', error.message);
    setErrors({ api: error.message });
  }
};

  return (
    <div className={styles.shell}>
      <div className={styles.background}></div>

      <form onSubmit={handleSubmit}>
        <div className={styles.layout}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.panelTitle}>User Account Information</h3>
              <p className={styles.panelText}>Create a new user account with authentication credentials.</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name *</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g., John Doe"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              {errors.name && <span style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.name}</span>}
            </div>
            <div className={styles.formGroup}>
  <label className={styles.label}>Authentication Key *</label>

  <input
    className={styles.input}
    type="password"
    placeholder="Enter admin signup key"
    name="signupKey"
    value={signupKey}
  onChange={(e:any) =>
    setSignupKey(e.target.value)
  }
  />

  {errors.signupKey && (
    <span
      style={{
        color: '#dc2626',
        fontSize: '0.875rem',
        marginTop: '0.25rem',
      }}
    >
      {errors.signupKey}
    </span>
  )}
</div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address *</label>
              <input
                className={styles.input}
                type="email"
                placeholder="e.g., john.doe@company.com"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && <span style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.email}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  className={styles.input}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#667085',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.password}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm Password *</label>
              <input
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              {errors.confirmPassword && <span style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.confirmPassword}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Account Status</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.selectInput}
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <span className={styles.selectArrow} aria-hidden="true"></span>
              </div>
            </div>
          </div>

          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.panelTitle}>User Roles & Permissions</h3>
              <p className={styles.panelText}>Select user roles to define access level and permissions.</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>User Type (Roles) *</label>
              {errors.roles && <span style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>{errors.roles}</span>}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {roleOptions.map(role => (
                  <div key={role.value} style={{
                    padding: '1rem',
                    border: '1px solid #e4e7ec',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: formData.roles.includes(role.value) ? '#f0f9ff' : 'transparent',
                    borderColor: formData.roles.includes(role.value) ? '#0d5c63' : '#e4e7ec',
                  }}
                  onClick={() => handleRoleChange(role.value)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role.value)}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontWeight: '500', color: '#101828' }}>{role.label}</div>
                        <div style={{ fontSize: '0.875rem', color: '#667085' }}>{role.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e4e7ec' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#101828' }}>Selected Roles:</h4>
              {formData.roles.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#667085' }}>
                  {formData.roles.map(role => {
                    const roleOption = roleOptions.find(r => r.value === role);
                    return <li key={role}>✓ {roleOption?.label}</li>;
                  })}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#a3a3a3', fontStyle: 'italic' }}>No roles selected</p>
              )}
            </div>

            <button type="submit" className={styles.button}>Create User</button>
          </div>
        </div>
      </form>
    </div>
  );
}
