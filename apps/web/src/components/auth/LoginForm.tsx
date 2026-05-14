import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './login.module.css';
import { useRouter } from 'next/router';


/**
 * API response type
*/
type LoginResponse = {
  user: {
    id: string;
    email: string;
    name?: string;
    roles: string[];
    status: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
};
export type UserRole =
  | 'admin'
  | 'user'
  | 'support'
  | 'sales'
  | 'accounts';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      // handle HTTP errors
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Invalid credentials');
      }

      const json = (await res.json()) as { data: LoginResponse };
      const { user, tokens } = json.data;
      const isUserStatus = (status: string): status is UserStatus => {
  return ['active', 'inactive', 'suspended'].includes(status);
};
      
      login({
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
         roles: (user.roles ?? []).filter((r): r is UserRole =>
      ['admin', 'user', 'support', 'sales', 'accounts'].includes(r)
    ),
        status:isUserStatus(user.status) ? user.status : 'inactive',
        },
        token: tokens.accessToken,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('Login failed');
  }
}finally {
      setLoading(false);
    }
  };

  return (
   <div className={styles.shell}>
      {/* <div className={styles.background}></div> */}

      <div className={styles.layout}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.panelTitle}>Login to I-ITSM</h3>
            <p className={styles.panelText}>
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {/* EMAIL */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
               onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
  setEmail(e.target.value)
}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
  setPassword(e.target.value)
}
                required
              />
            </div>

            {/* ERROR */}
            {error && (
              <p style={{ color: 'red', marginBottom: '1rem' }}>
                {error}
              </p>
            )}

            <button
  className={styles.button}
  type="submit"
  disabled={loading}
>
  {loading ? 'Logging in...' : 'Login'}
</button>
          </form>
        </div>
      </div>
    </div>
  );
}