/**
 * Signup Page
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUser, setSession, type UserGender } from '@/lib/auth/local-auth';

const deriveThemeKey = (g: UserGender | undefined) => {
  if (g === 'female') return 'girlish';
  if (g === 'male') return 'boyish';
  return 'neutral';
};

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [gender, setGender] = useState<UserGender>('neutral');

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
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setError('Please agree to the Terms and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const user = await createUser(email, password, gender);
      setSession({
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
        gender: user.gender,
      });
      if (typeof window !== 'undefined') {
        const themeKey = deriveThemeKey(user.gender);
        window.localStorage.setItem('gender', user.gender || 'neutral');
        window.localStorage.setItem('themeKey', themeKey);
        window.localStorage.setItem('student-suite-theme', themeKey);
      }
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-[color:var(--sidebar-bg)] border border-[color:var(--sidebar-border)] rounded-xl p-6">
      <h1 className="text-xl font-semibold text-[color:var(--topbar-text)]">Create Account</h1>
      <p className="text-sm text-[color:var(--topbar-muted)] mt-1">Start using Student Suite.</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" aria-label="Signup form">
        <div>
          <label htmlFor="signup-email" className="block text-sm text-[color:var(--topbar-text)] mb-1">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-field"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-sm text-[color:var(--topbar-text)] mb-1">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input-field"
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label htmlFor="signup-gender" className="block text-sm text-[color:var(--topbar-text)] mb-1">
            Gender
          </label>
          <select
            id="signup-gender"
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
          <label htmlFor="signup-confirm" className="block text-sm text-[color:var(--topbar-text)] mb-1">
            Confirm Password
          </label>
          <input
            id="signup-confirm"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="input-field"
            autoComplete="new-password"
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
          aria-label="Create account"
        >
          {loading ? 'Creating…' : 'Sign up'}
        </button>
      </form>

      <p className="text-xs text-[color:var(--topbar-muted)] mt-4">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Login
        </Link>
      </p>
    </div>
  );
}
