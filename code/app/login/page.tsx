/**
 * Login Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { findUserByEmail, getSession, setSession, verifyUser, type UserGender } from '@/lib/auth/local-auth';

const deriveThemeKey = (g: UserGender | undefined) => {
  if (g === 'female') return 'girlish';
  if (g === 'male') return 'boyish';
  return 'neutral';
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [gender, setGender] = useState<UserGender>('neutral');
  const [redirecting, setRedirecting] = useState(false);

  // Prefill gender if we already know the user locally
  useEffect(() => {
    const existing = findUserByEmail(email);
    if (existing?.gender) {
      setGender(existing.gender);
    }
  }, [email]);

  useEffect(() => {
    if (getSession()) {
      setRedirecting(true);
      router.replace('/');
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setError('Please agree to the Terms and Privacy Policy.');
      return;
    }

    setLoading(true);
    const user = await verifyUser(email, password);
    if (!user) {
      setLoading(false);
      setError('Invalid email or password.');
      return;
    }

    const effectiveGender = (user.gender as UserGender | undefined) || gender || 'neutral';
    const themeKey = deriveThemeKey(effectiveGender);

    setSession({
      userId: user.id,
      email: user.email,
      createdAt: new Date().toISOString(),
      gender: effectiveGender,
    });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gender', effectiveGender);
      window.localStorage.setItem('themeKey', themeKey);
      window.localStorage.setItem('student-suite-theme', themeKey);
    }
    setLoading(false);
    router.replace('/');
  };

  if (redirecting) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-[color:var(--sidebar-bg)] border border-[color:var(--sidebar-border)] rounded-xl p-6">
      <h1 className="text-xl font-semibold text-[color:var(--topbar-text)]">Login</h1>
      <p className="text-sm text-[color:var(--topbar-muted)] mt-1">Welcome back to Student Suite.</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" aria-label="Login form">
        <div>
          <label htmlFor="login-email" className="block text-sm text-[color:var(--topbar-text)] mb-1">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-field"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="login-gender" className="block text-sm text-[color:var(--topbar-text)] mb-1">
            Gender
          </label>
          <select
            id="login-gender"
            value={gender}
            onChange={(event) => setGender(event.target.value as UserGender)}
            className="input-field"
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm text-[color:var(--topbar-text)] mb-1">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input-field"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div className="text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-2 text-sm text-[color:var(--topbar-text)]">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1"
              aria-label="Agree to Terms and Conditions"
              required
            />
            <span>
              I agree to the{' '}
              <Link href="/settings#terms" className="underline">
                Terms and Conditions
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="mt-1"
              aria-label="Agree to Privacy Policy"
              required
            />
            <span>
              I agree to the{' '}
              <Link href="/settings#privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !agreeTerms || !agreePrivacy}
          className="w-full rounded-lg px-4 py-2 text-sm font-medium"
          aria-label="Login"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>

      <p className="text-xs text-[color:var(--topbar-muted)] mt-4">
        No account yet?{' '}
        <Link href="/signup" className="underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
