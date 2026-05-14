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

      // ✅ FIX: extract nested data from api response wrapper
      const json = (await res.json()) as { data: LoginResponse };
      const { user, tokens } = json.data;
    console.log('Login successful:', user, tokens);
      // map api response shape to what AuthContext expects
      login({
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          roles: user.roles as any,
          status: user.status as any,
        },
        token: tokens.accessToken,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
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
                onChange={(e:any) => setEmail(e.target.value)}
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
                onChange={(e:any) => setPassword(e.target.value)}
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