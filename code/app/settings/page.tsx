/**
 * Settings Page
 *
 * Provides user-facing controls for account, preferences, defaults, data/storage, and about.
 * All changes autosave to localStorage with debounced feedback.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSession, updateUserGender, type UserGender } from '@/lib/auth/local-auth';
import { getTemplatesFor } from '@/src/lib/templates';
import { useTheme } from '@/components/theme/ThemeProvider';

const deriveThemeKey = (g: UserGender | undefined) => {
  if (g === 'female') return 'girlish';
  if (g === 'male') return 'boyish';
  return 'neutral';
};

type ThemeOption = 'light' | 'system';
type FontSize = 'small' | 'medium' | 'large';
type TemplateId = string;
type PdfPageSize = 'A4' | 'Letter';
type ExportFormat = 'pdf' | 'image';

type SettingsState = {
  displayName: string;
  gender: UserGender;
  highContrast: boolean;
  fontSize: FontSize;
  reduceMotion: boolean;
  theme: ThemeOption;
  defaultResumeTemplate: TemplateId | '';
  defaultNotesTemplate: TemplateId | '';
  defaultPdfPageSize: PdfPageSize;
  defaultExportFormat: ExportFormat;
};

const SETTINGS_KEY = 'settings-v1';

const defaultSettings: SettingsState = {
  displayName: 'User',
  gender: 'neutral',
  highContrast: false,
  fontSize: 'medium',
  reduceMotion: false,
  theme: 'light',
  defaultResumeTemplate: '',
  defaultNotesTemplate: '',
  defaultPdfPageSize: 'A4',
  defaultExportFormat: 'pdf',
};

const debounceMs = 500;

const estimateStorageUsage = () => {
  if (typeof window === 'undefined') return 'Storage usage: n/a';
  try {
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) ?? '';
      bytes += key.length + value.length;
    }
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `Storage usage: ${mb.toFixed(2)} MB (approx)`;
    return `Storage usage: ${kb.toFixed(1)} KB (approx)`;
  } catch {
    return 'Storage usage: unavailable';
  }
};

const applyDocumentFlags = (settings: SettingsState) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // High contrast
  if (settings.highContrast) {
    root.classList.add('high-contrast-mode');
  } else {
    root.classList.remove('high-contrast-mode');
  }

  // Font size
  root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
  root.classList.add(`font-size-${settings.fontSize}`);

  // Reduce motion
  if (settings.reduceMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }

  // Theme preference flag (non-destructive)
  root.dataset.theme = settings.theme;
};

export default function SettingsPage() {
  const session = useMemo(() => getSession(), []);
  const { setThemeByGender } = useTheme();
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        return {
          ...defaultSettings,
          ...parsed,
          displayName: parsed.displayName || parsed.displayName === '' ? parsed.displayName : (parsed as any)?.name || 'User',
          gender: (parsed.gender as UserGender) || session?.gender || 'neutral',
        } as SettingsState;
      }
    } catch {
      // ignore parse errors
    }
    return defaultSettings;
  });
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [storageUsage, setStorageUsage] = useState(() => estimateStorageUsage());
  const [resumeTemplates, setResumeTemplates] = useState<{ id: string; name: string }[]>([]);
  const [noteTemplates, setNoteTemplates] = useState<{ id: string; name: string }[]>([]);

  // Load templates once client-side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const resume = getTemplatesFor('resume').map((t) => ({ id: t.id, name: t.name }));
    const notes = getTemplatesFor('notes').map((t) => ({ id: t.id, name: t.name }));
    setResumeTemplates(resume);
    setNoteTemplates(notes);

    setSettings((prev) => ({
      ...prev,
      defaultResumeTemplate: prev.defaultResumeTemplate || resume[0]?.id || '',
      defaultNotesTemplate: prev.defaultNotesTemplate || notes[0]?.id || '',
    }));
  }, []);

  // Apply flags on mount/changes
  useEffect(() => {
    applyDocumentFlags(settings);
  }, [settings.highContrast, settings.fontSize, settings.reduceMotion]);

  // Sync gender-based theme + persisted flags outside render
  useEffect(() => {
    if (!settings.gender) return;
    setThemeByGender(settings.gender);
    if (session?.email) {
      updateUserGender(session.email, settings.gender);
    }
    if (typeof window !== 'undefined') {
      const themeKey = deriveThemeKey(settings.gender);
      window.localStorage.setItem('gender', settings.gender);
      window.localStorage.setItem('themeKey', themeKey);
      window.localStorage.setItem('student-suite-theme', themeKey);
    }
  }, [setThemeByGender, session?.email, settings.gender]);

  // Autosave with debounce
  useEffect(() => {
    const handle = setTimeout(() => {
      if (typeof window === 'undefined') return;
      setSavingState('saving');
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setSavingState('saved');
      setTimeout(() => setSavingState('idle'), 1200);
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [settings]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSavingState('saving');
    setSettings((prev) => {
      return { ...prev, [key]: value };
    });
  };

  const resetPreferences = () => {
    setSettings((prev) => ({
      ...defaultSettings,
      defaultResumeTemplate: resumeTemplates[0]?.id || '',
      defaultNotesTemplate: noteTemplates[0]?.id || '',
    }));
    setStorageUsage(estimateStorageUsage());
  };

  const clearDrafts = () => {
    if (typeof window === 'undefined') return;
    const keysToClear = [
      'saved-assignments',
      'notes-projects',
      'notes-projects-v2',
      'resume-draft',
      'resume-versions',
    ];
    keysToClear.forEach((key) => localStorage.removeItem(key));
    setStorageUsage(estimateStorageUsage());
  };

  const clearTemp = () => {
    if (typeof window === 'undefined') return;
    const keysToClear = ['pdf-temp-files', 'notes-temp-files'];
    keysToClear.forEach((key) => localStorage.removeItem(key));
    setStorageUsage(estimateStorageUsage());
  };

  return (
    <div className="no-print space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[color:var(--topbar-text)]">
            Settings
          </h1>
          <p className="text-sm text-[color:var(--topbar-muted)]">
            Manage your preferences, defaults, and account controls.
          </p>
        </div>
        <div className="text-xs text-[color:var(--topbar-muted)]">
          {savingState === 'saving' && 'Saving…'}
          {savingState === 'saved' && 'Saved'}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Account */}
        <section className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">Account</h2>
            <p className="text-sm text-[color:var(--topbar-muted)]">Manage identity and security.</p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:var(--topbar-muted)]">Name</p>
              <input
                type="text"
                value={settings.displayName}
                onChange={(e) => updateSetting('displayName', e.target.value)}
                className="input-field"
                aria-label="Display name"
                placeholder="Your name"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:var(--topbar-muted)]">Gender</p>
              <select
                className="input-field"
                value={settings.gender}
                onChange={(e) => updateSetting('gender', e.target.value as UserGender)}
                aria-label="Select gender"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:var(--topbar-muted)]">Email</p>
              <p className="text-sm text-[color:var(--topbar-text)]">{session?.email || 'Not signed in'}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="px-3 py-2 text-sm rounded-md border border-[color:var(--sidebar-border)] text-[color:var(--topbar-text)] hover:bg-[color:var(--sidebar-hover-bg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--topbar-focus)]" aria-label="Change password (placeholder)">
                Change password
              </button>
              <button type="button" className="px-3 py-2 text-sm rounded-md border border-[color:var(--sidebar-border)] text-[color:var(--topbar-text)] hover:bg-[color:var(--sidebar-hover-bg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--topbar-focus)]" aria-label="Logout from all devices (placeholder)">
                Logout from all devices
              </button>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">Preferences</h2>
            <p className="text-sm text-[color:var(--topbar-muted)]">Accessibility and appearance.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--topbar-text)]">High Contrast Mode</p>
                <p className="text-xs text-[color:var(--topbar-muted)]">Improve readability with stronger contrast.</p>
              </div>
              <button
                role="switch"
                aria-checked={settings.highContrast}
                aria-label={`High contrast ${settings.highContrast ? 'on' : 'off'}`}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--topbar-focus)] ${settings.highContrast ? 'bg-[color:var(--topbar-text)]' : 'bg-[color:var(--sidebar-border)]'}`}
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.highContrast ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--topbar-text)]">Default Font Size</p>
                <p className="text-xs text-[color:var(--topbar-muted)]">Applied across the app.</p>
              </div>
              <select
                className="input-field"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', e.target.value as FontSize)}
                aria-label="Default font size"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--topbar-text)]">Reduce Motion</p>
                <p className="text-xs text-[color:var(--topbar-muted)]">Limit animations for comfort.</p>
              </div>
              <button
                role="switch"
                aria-checked={settings.reduceMotion}
                aria-label={`Reduce motion ${settings.reduceMotion ? 'on' : 'off'}`}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--topbar-focus)] ${settings.reduceMotion ? 'bg-[color:var(--topbar-text)]' : 'bg-[color:var(--sidebar-border)]'}`}
                onClick={() => updateSetting('reduceMotion', !settings.reduceMotion)}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.reduceMotion ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--topbar-text)]">Theme</p>
                <p className="text-xs text-[color:var(--topbar-muted)]">Choose light or follow system.</p>
              </div>
              <select
                className="input-field"
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value as ThemeOption)}
                aria-label="Theme"
              >
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">Appearance</h2>
            <p className="text-sm text-[color:var(--topbar-muted)]">Control theme based on gender selection.</p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:var(--topbar-muted)]">Gender</p>
              <select
                className="input-field"
                value={settings.gender}
                onChange={(e) => updateSetting('gender', e.target.value as UserGender)}
                aria-label="Select gender for theme"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>
        </section>

        {/* Defaults */}
        <section className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">Defaults</h2>
            <p className="text-sm text-[color:var(--topbar-muted)]">Choose what loads first in tools.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--topbar-text)]">Default Resume Template</p>
                <p className="text-xs text-[color:var(--topbar-muted)]">Applied when opening Resume Builder.</p>
              </div>
              <select
                className="input-field"
                value={settings.defaultResumeTemplate}
                onChange={(e) => updateSetting('defaultResumeTemplate', e.target.value)}
                aria-label="Default resume template"
              >
                {resumeTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--topbar-text)]">Default Notes Template</p>
                <p className="text-xs text-[color:var(--topbar-muted)]">Applied when opening Notes → PDF.</p>
              </div>
              <select
                className="input-field"
                value={settings.defaultNotesTemplate}
                onChange={(e) => updateSetting('defaultNotesTemplate', e.target.value)}
                aria-label="Default notes template"
              >
                {noteTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--topbar-text)]">Default PDF Page Size</p>
                <p className="text-xs text-[color:var(--topbar-muted)]">For PDF tools exports.</p>
              </div>
              <select
                className="select-field"
                value={settings.defaultPdfPageSize}
                onChange={(e) => updateSetting('defaultPdfPageSize', e.target.value as PdfPageSize)}
                aria-label="Default PDF page size"
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--topbar-text)]">Default Export Format</p>
                <p className="text-xs text-[color:var(--topbar-muted)]">Used when exporting files.</p>
              </div>
              <select
                className="select-field"
                value={settings.defaultExportFormat}
                onChange={(e) => updateSetting('defaultExportFormat', e.target.value as ExportFormat)}
                aria-label="Default export format"
              >
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data & Storage */}
        <section className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">Data &amp; Storage</h2>
            <p className="text-sm text-[color:var(--topbar-muted)]">Manage local data and cache.</p>
          </div>
          <div className="space-y-3">
            <button type="button" className="px-3 py-2 w-full text-sm rounded-md border border-[color:var(--sidebar-border)] text-[color:var(--topbar-text)] hover:bg-[color:var(--sidebar-hover-bg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--topbar-focus)]" onClick={clearDrafts}>
              Clear local drafts
            </button>
            <button type="button" className="px-3 py-2 w-full text-sm rounded-md border border-[color:var(--sidebar-border)] text-[color:var(--topbar-text)] hover:bg-[color:var(--sidebar-hover-bg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--topbar-focus)]" onClick={clearTemp}>
              Clear temporary files
            </button>
            <button type="button" className="px-3 py-2 w-full text-sm rounded-md border border-[color:var(--sidebar-border)] text-[color:var(--topbar-text)] hover:bg-[color:var(--sidebar-hover-bg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--topbar-focus)]" onClick={resetPreferences}>
              Reset all preferences
            </button>
            <p className="text-xs text-[color:var(--topbar-muted)]">{storageUsage}</p>
          </div>
        </section>

        {/* About & Documents */}
        <section className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">About</h2>
            <p className="text-sm text-[color:var(--topbar-muted)]">Student Suite information.</p>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[color:var(--topbar-muted)]">App</p>
                <p className="text-sm text-[color:var(--topbar-text)]">Student Suite</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[color:var(--topbar-muted)]">Version</p>
                <p className="text-sm text-[color:var(--topbar-text)]">v1.0.0</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-[color:var(--topbar-muted)]">Footer</p>
                <p className="text-sm text-[color:var(--topbar-text)]">
                  © 2026 Student Suite (owner-operated by MARIYA ZAKIR). ALL rights reserved
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[color:var(--topbar-muted)]">Contact</p>
                <p className="text-sm text-[color:var(--topbar-text)]">support@studentsuite.app</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-[color:var(--topbar-muted)]">Policies</p>
              <div className="flex flex-col gap-1 text-sm">
                <Link href="#terms" className="text-[color:var(--topbar-text)] underline">Terms &amp; Conditions</Link>
                <Link href="#privacy" className="text-[color:var(--topbar-text)] underline">Privacy Policy</Link>
                <Link href="#disclaimer" className="text-[color:var(--topbar-text)] underline">General Disclaimer</Link>
                <Link href="#user-content" className="text-[color:var(--topbar-text)] underline">User Content Policy</Link>
                <Link href="#copyright" className="text-[color:var(--topbar-text)] underline">Copyright &amp; Ownership</Link>
                <Link href="#ads" className="text-[color:var(--topbar-text)] underline">Ads &amp; Third-Party Disclaimer</Link>
                <Link href="#refund" className="text-[color:var(--topbar-text)] underline">Refund &amp; Cancellation</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Documents placeholders */}
      <section id="terms" className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5">
        <details className="group">
          <summary className="flex items-start justify-between gap-3 cursor-pointer list-none">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">Terms &amp; Conditions</h2>
              <p className="text-sm text-[color:var(--topbar-muted)]">Content will be provided and stored here.</p>
            </div>
            <span className="text-lg text-[color:var(--topbar-muted)] transition-transform group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="mt-3 text-sm text-[color:var(--topbar-muted)] whitespace-pre-line">
          {`TERMS & CONDITION
For Student Suite
Last Updated: 26/01/2026
Welcome to Student Suite. These Terms and Conditions ("Terms") govern your access to and use of the Student Suite website, mobile application, and services (collectively, the "Service").
By accessing or using Student Suite, you agree to be bound by these Terms. If you do not agree, please do not use the Service.

1. About Student Suite
Student Suite is an educational and productivity platform designed to assist students with tools, features, and AI-based suggestions.
Student Suite is currently operated as an owner-operated platform and may later be transferred to or operated by a registered legal entity.

2. Eligibility & Minors
- You must be at least 13 years old to use Student Suite.
- If you are under 18 years of age, you confirm that you have obtained permission from a parent or legal guardian.
- Parents or legal guardians are responsible for monitoring and supervising the activities of minors.

3. Account Registration
To access certain features, you may be required to create an account.
You agree that:
- The information you provide is accurate and complete.
- You will not impersonate any person or entity.
- You will keep your login credentials confidential.
- You are responsible for all activities under your account.
We reserve the right to suspend or terminate any account that violates these Terms.

4. Privacy & Data Protection
We respect your privacy.
By using Student Suite, you agree to our Privacy Policy, which explains:
- What data we collect
- Why we collect it
- How we use it
- How we protect it

5. User Content & Uploads
Users may upload personal information, files, notes, images, or photos of their work.
You confirm that:
- You own or have rights to the content you upload.
- Your content does not violate any law.
- Your content does not infringe copyrights or trademarks.
- Your content is not harmful, abusive, or illegal.
We do not claim ownership of your content.
However, we reserve the right to remove any content that violates these Terms or applicable laws.

6. Educational Purpose & No Professional Advice
Student Suite provides educational tools, productivity features, and AI-generated suggestions.
All content is provided for informational and educational purposes only.
We do NOT provide:
- Legal advice
- Medical advice
- Financial advice
- Career guarantees
- Academic guarantees
You use all information at your own discretion and risk.

7. No Guarantee of Results
We do not guarantee:
- Improved grades
- Academic success
- Job placement
- Career outcomes
- Any specific results
Results depend on individual effort and circumstances.

8. Subscriptions & Payments
Student Suite may offer paid plans, including subscriptions (currently planned at ₹98/month).
By purchasing:
- You agree to pay applicable fees.
- Prices may change with notice.
- Payments are handled by third-party gateways (UPI, cards, Razorpay, etc.).
We are not responsible for third-party payment failures.

9. Refunds & Cancellations
Refunds are governed by our Refund Policy.
We reserve the right to deny refunds in cases of misuse, fraud, or abuse.

10. Advertisements & Third-Party Services
Student Suite may display ads and use third-party services such as:
- Google AdSense
- Google Analytics
- Firebase
We are not responsible for:
- Third-party content
- External websites
- External offers
- Third-party privacy practices
Use of third-party services is at your own risk.

11. Prohibited Activities
You agree NOT to:
- Violate any law
- Upload illegal or harmful content
- Hack, scrape, or reverse engineer
- Abuse other users
- Disrupt the platform
- Bypass security systems
- Misuse AI features
Violations may result in:
- Account suspension
- Permanent ban
- Legal action

12. Intellectual Property
All platform content including:
- Branding
- Logos
- UI/UX
- Design
- Code
- Features
- Text
- Graphics
Are owned by Student Suite (Owner-operated) or its future legal entity.
You may not copy, distribute, sell, or modify any part without written permission.

13. Service Availability
We do not guarantee:
- 24/7 uptime
- Error-free operation
- Bug-free experience
The Service may be modified, paused, or discontinued at any time.

14. Beta & Experimental Features
Some features may be in beta or experimental form.
These features may:
- Contain bugs
- Be unstable
- Change frequently
- Be removed at any time
You use such features at your own risk.

15. Data Loss Disclaimer
We are not responsible for:
- Loss of uploaded content
- Accidental deletion
- Sync failures
- Device issues
- Server issues

16. Backup Responsibility
You are responsible for maintaining your own backups of important data.

17. No Warranty
The Service is provided "as is" and "as available."
We make no warranties of any kind, including:
- Accuracy
- Reliability
- Fitness for a particular purpose
- Availability

18. Limitation of Liability
To the maximum extent permitted by law, Student Suite shall not be liable for:
- Indirect damages
- Data loss
- Academic loss
- Financial loss
- Emotional distress
- Service interruptions
Use of the Service is at your own risk.

19. Indemnification
You agree to defend and indemnify Student Suite from any claims, damages, or losses arising from:
- Your misuse
- Your content
- Your violation of these Terms

20. Force Majeure
We shall not be liable for failure to perform due to:
- Natural disasters
- Internet failures
- Power outages
- Government actions
- War
- Pandemics
- Server outages

21. Termination
We reserve the right to suspend or terminate your access at any time for violations of these Terms.
You may stop using the Service anytime.

22. Assignment
We may transfer or assign our rights and obligations to another entity in the future without restriction.

23. Severability
If any part of these Terms is found invalid, the remaining parts will continue to be valid.

24. Changes to These Terms
We may update these Terms at any time.
Continued use means acceptance of the updated Terms.

25. Governing Law
These Terms are governed by the laws of India.

26. Contact & Legal Notices
Legal notices may be sent via:
- Email
- In-app notification
- Website notice`}
          </div>
        </details>
      </section>

      <section id="privacy" className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5">
        <details className="group">
          <summary className="flex items-start justify-between gap-3 cursor-pointer list-none">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">Privacy Policy</h2>
              <p className="text-sm text-[color:var(--topbar-muted)]">Content will be provided and stored here.</p>
            </div>
            <span className="text-lg text-[color:var(--topbar-muted)] transition-transform group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="mt-3 text-sm text-[color:var(--topbar-muted)] whitespace-pre-line">
          {`PRIVACY POLICY
For Student Suite
Last Updated: 26/01/2026
Student Suite ("we", "our", "us") respects your privacy. This Privacy Policy explains how we collect, use, store, process, and protect your information when you use our website, mobile application, and related services (collectively, the "Service").
By using Student Suite, you agree to this Privacy Policy.

1. About Student Suite
Student Suite is currently a free, ad-supported educational and productivity platform.
We may introduce paid features in the future. If we do, this Privacy Policy will be updated accordingly.

2. Information We Collect
We collect only the information necessary to operate and improve the Service.
a) Information You Provide
- Email address (for account creation, login, security, and recovery)
- Username or display name
- Content you upload (notes, files, images, academic work)
- Optional profile information (if you choose to provide it)
b) Automatically Collected Information
- IP address
- Device type
- Browser type
- Operating system
- App usage data
- Log files
- Cookies and similar tracking technologies
c) Payment Information
Currently, we do not collect or store any payment information because Student Suite is free at this time.
If paid features are introduced in the future, payments will be handled by secure third-party gateways, and this policy will be updated.

3. Legal Basis for Processing Data
We process personal data based on:
- Your consent
- Providing and operating the Service
- Legitimate business interests
- Compliance with legal obligations

4. How We Use Your Information
We use your information to:
- Create and manage user accounts
- Provide and improve features
- Maintain security and prevent misuse
- Analyze usage and performance
- Display advertisements
- Communicate important updates
- Enforce our Terms & Conditions

5. AI & Automated Features
Some features may use AI or automated systems to generate suggestions or assistance.
Important:
- AI outputs are suggestions only
- They are not guaranteed to be accurate
- They do not constitute professional advice

6. Children's Privacy (Users Under 18)
Student Suite may be used by students under 18 years of age.
- Users under 18 must have parental or guardian permission
- Parents or guardians are responsible for supervision
- We do not knowingly collect unnecessary personal data from minors
If a user misrepresents their age, responsibility lies with the user and/or guardian.

7. Cookies & Tracking Technologies
We use cookies and similar technologies to:
- Keep users logged in
- Improve platform performance
- Analyze usage patterns
- Display advertisements
You can control cookies through your browser settings.

8. Do Not Track Signals
Some browsers send "Do Not Track" signals.
Currently, Student Suite does not respond to these signals due to the lack of a universal standard.

9. Advertisements
Student Suite displays advertisements to support free access.
Third-party ad partners (such as Google AdSense) may use cookies or similar technologies to show relevant ads.
We do not control third-party ad content.
You can manage ad personalization through Google Ad Settings.

10. Third-Party Service
We use trusted third-party services such as:
- Google Analytics
- Firebase
- Google AdSense
These services operate under their own privacy policies.
We are not responsible for how third parties collect or use data.

11. Data Storage & International Transfers
Your data may be stored or processed on servers located outside India due to global cloud service providers.
By using Student Suite, you consent to such international data transfers.

12. Data Security
We use reasonable security measures, including:
- Secure servers
- Encryption
- Access controls
- Monitoring systems
However, no method of storage or transmission is completely secure.

13. Data Retention
We retain personal data:
- While your account is active
- As required by law
- For legitimate business and operational purposes

14. Account Deactivation vs Deletion
- Deactivation: Your account is disabled, but data may remain stored
- Deletion: Your personal data is permanently removed, subject to legal requirements

15. Your Rights
You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Withdraw consent
- Close your account
Requests can be made through our support system.

16. Consent Withdrawal
You may withdraw your consent at any time by closing your account or contacting support.

17. Data Loss Disclaimer
We are not responsible for:
- Accidental data deletion
- Device or hardware failure
- Sync issues
- Server outages
Users are responsible for maintaining backups of important data.

18. Data Sharing
We do not sell personal data.
We may share data only:
- If required by law
- With service providers assisting in operations
- For security and fraud prevention
- With your explicit consent

19. Law Enforcement & Legal Requests
We may disclose personal data if required by:
- Courts
- Government authorities
- Law enforcement agencies

20. Business Transfers
If Student Suite is sold, merged, or transferred, user data may also be transferred as part of that transaction.

21. Email & System Communications
We may send emails or notifications related to:
- Account activity
- Security alerts
- Legal notices
- Policy updates
- System communications

22. Changes to This Privacy Policy
We may update this Privacy Policy at any time.
Continued use of the Service means acceptance of the updated policy.

23. Governing Law
This Privacy Policy is governed by the laws of India.

24. Contact
Student Suite (Owner-operated)
Legal and privacy notices may be sent via email, in-app notifications, or website updates.`}
          </div>
        </details>
      </section>

      <section id="disclaimer" className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5">
        <details className="group">
          <summary className="flex items-start justify-between gap-3 cursor-pointer list-none">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">General Disclaimer</h2>
              <p className="text-sm text-[color:var(--topbar-muted)]">Content will be provided and stored here.</p>
            </div>
            <span className="text-lg text-[color:var(--topbar-muted)] transition-transform group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="mt-3 text-sm text-[color:var(--topbar-muted)] whitespace-pre-line">
          {`GENERAL DISCLAIMER
For Student Suite
Last Updated: 26/01/2026
Student Suite is an educational and productivity platform created to assist students with tools, features, and informational resources.
All content, tools, AI-generated outputs, suggestions, and features provided through Student Suite are offered strictly for general informational and educational purposes only.

1. No Professional Advice
Student Suite does NOT provide professional advice of any kind, including but not limited to:
- Legal advice
- Medical advice
- Financial advice
- Career or academic advice
Any information or suggestions provided should not be considered a substitute for professional consultation.

2. AI-Generated Content Disclaimer
Some features of Student Suite may use artificial intelligence or automated systems.
Important:
- AI-generated outputs are suggestions only
- They may be inaccurate, incomplete, or outdated
- They should not be relied upon as factual or authoritative information
Users are solely responsible for how they interpret and use AI-generated content.

3. Educational Use Only
Student Suite is intended for educational and productivity support purposes only.
We do not guarantee:
- Academic performance
- Exam results
- Improved grades
- Career outcomes
- Job placement
Results depend on individual effort, learning habits, and external factors.

4. Use at Your Own Risk
Your use of Student Suite and its content is entirely at your own risk.
Student Suite shall not be held liable for:
- Any loss or damage resulting from reliance on information
- Decisions made based on platform content
- Academic, financial, or personal outcomes

5. External Content & Third-Party Services
Student Suite may display advertisements or include links to third-party websites or services.
We do not control, endorse, or guarantee the accuracy or reliability of third-party content.
Interactions with third-party services are at your own discretion and risk.

6. Limitation of Responsibility
To the maximum extent permitted by law, Student Suite disclaims all responsibility and liability for any direct or indirect damages arising from:
- Use of the platform
- Inability to access the platform
- Errors or omissions in content
- Technical issues or service interruptions

7. Changes to This Disclaimer
We may update this Disclaimer at any time.
Continued use of Student Suite after changes means acceptance of the updated version.

8. Governing Law
This Disclaimer is governed by the laws of India.

9. Contact
Student Suite (Owner-operated)
Legal notices may be provided via email, in-app notifications, or website updates.`}
          </div>
        </details>
      </section>

      <section id="user-content" className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5">
        <details className="group">
          <summary className="flex items-start justify-between gap-3 cursor-pointer list-none">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">User Content Policy</h2>
              <p className="text-sm text-[color:var(--topbar-muted)]">Content will be provided and stored here.</p>
            </div>
            <span className="text-lg text-[color:var(--topbar-muted)] transition-transform group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="mt-3 text-sm text-[color:var(--topbar-muted)] whitespace-pre-line">
          {`USER CONTENT POLICY
For Student Suite
Last Updated: 26/01/2026
This User Content Policy explains the rules, responsibilities, and rights related to content uploaded, submitted, or stored by users on Student Suite.
By uploading or submitting any content, you agree to comply with this policy.

1. Types of User Content
Users may upload or submit content including, but not limited to:
- Notes
- Images or photos
- Files or documents
- Academic or study material
- Personal educational content

2. Ownership of User Content
- You retain full ownership of any content you upload.
- Student Suite does NOT claim ownership of user-generated content.
By uploading content, you grant Student Suite a limited, non-exclusive, revocable right to store, process, and display the content only for the purpose of providing and operating the Service.

3. User Responsibility
You are solely responsible for the content you upload.
You confirm that:
- You own the content or have legal permission to use it
- The content complies with all applicable laws
- The content does not infringe copyrights, trademarks, or other rights
- The content is not harmful, misleading, or malicious

4. Prohibited Content
You must NOT upload content that:
- Is illegal or unlawful
- Infringes intellectual property rights
- Contains malware, viruses, or harmful code
- Is abusive, hateful, violent, or obscene
- Violates the privacy or rights of others
- Is misleading, fraudulent, or deceptive

5. Content Review & Removal
Student Suite reserves the right to:
- Review user content
- Remove, restrict, or delete content without prior notice
- Suspend or terminate accounts for policy violations
Content removal may occur at our sole discretion.

6. No Liability for User Content
Student Suite is not responsible or liable for:
- User-generated content
- Accuracy, legality, or reliability of uploaded content
- Disputes between users related to content
Any disputes related to user content are solely between the involved users.

7. Data Storage & Loss
While reasonable security measures are used, Student Suite is not responsible for:
- Data loss
- Accidental deletion
- Technical failures
- Device, server, or sync issues
Users are responsible for maintaining backups of their content.

8. Reporting Violations
If you believe any content violates this policy, you may report it through our support or reporting system.

9. Changes to This Policy
We may update this User Content Policy at any time.
Continued use of Student Suite means acceptance of the updated policy.

10. Governing Law
This User Content Policy is governed by the laws of India.

11. Contact
Student Suite (Owner-operated)
Legal notices may be provided via email, in-app notifications, or website updates.`}
          </div>
        </details>
      </section>

      <section id="copyright" className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5">
        <details className="group">
          <summary className="flex items-start justify-between gap-3 cursor-pointer list-none">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">Copyright &amp; Ownership Policy</h2>
              <p className="text-sm text-[color:var(--topbar-muted)]">Content will be provided and stored here.</p>
            </div>
            <span className="text-lg text-[color:var(--topbar-muted)] transition-transform group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="mt-3 text-sm text-[color:var(--topbar-muted)] whitespace-pre-line">
          {`COPYRIGHT & OWNERSHIP POLICY
For Student Suite
Last Updated: 26/01/2026
This Copyright & Ownership Policy explains the ownership rights related to the content, design, features, and intellectual property of Student Suite.

1. Ownership of Platform Content
All content and materials available on Student Suite, including but not limited to:
- Website and mobile application design
- User interface (UI) and user experience (UX)
- Logos, branding, and trademarks
- Source code and software
- Features, tools, and functionality
- Text, graphics, layouts, and icons
are the exclusive property of Student Suite (Owner-operated) or its future legal entity, unless otherwise stated.

2. Copyright Protection
All platform content is protected by applicable copyright, trademark, and intellectual property laws.
Unauthorized use, reproduction, modification, distribution, or exploitation of any part of Student Suite is strictly prohibited.

3. Limited Permission to Use
Student Suite grants users a limited, non-exclusive, non-transferable, and revocable license to access and use the Service for personal, educational, and non-commercial purposes only.
This permission does not transfer ownership of any intellectual property.

4. Prohibited Uses
You may NOT:
- Copy or reproduce platform content
- Modify or create derivative works
- Sell, license, or distribute content
- Reverse engineer or attempt to extract source code
- Use branding or logos without permission
- Use any part of the Service for commercial purposes without prior written consent from Student Suite.

5. User Content Exception
This policy does not apply to user-generated content.
Users retain ownership of content they upload, as outlined in the User Content Policy.

6. Intellectual Property Violations
If you believe that any content on Student Suite infringes your intellectual property rights, you may submit a complaint through our support system.
We reserve the right to remove infringing content where appropriate.

7. Reservation of Rights
All rights not expressly granted in this policy are reserved by Student Suite.

8. Changes to This Policy
We may update this Copyright & Ownership Policy at any time.
Continued use of the Service means acceptance of the updated policy.

9. Governing Law
This policy is governed by the laws of India.

10. Contact
Student Suite (Owner-operated)
Legal notices may be provided via email, in-app notifications, or website updates.`}
          </div>
        </details>
      </section>

      <section id="ads" className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5">
        <details className="group">
          <summary className="flex items-start justify-between gap-3 cursor-pointer list-none">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">Ads &amp; Third-Party Disclaimer</h2>
              <p className="text-sm text-[color:var(--topbar-muted)]">Content will be provided and stored here.</p>
            </div>
            <span className="text-lg text-[color:var(--topbar-muted)] transition-transform group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="mt-3 text-sm text-[color:var(--topbar-muted)] whitespace-pre-line">
          {`ADS & THIRD-PARTY DISCLAIMER
For Student Suite
Last Updated: 26/01/2026
This Ads & Third-Party Disclaimer explains how advertisements and third-party services are displayed and used on Student Suite.
By using Student Suite, you acknowledge and agree to this disclaimer.

1. Advertisements
Student Suite is a free platform supported by advertisements.
Advertisements displayed on Student Suite are provided by third-party ad networks (such as Google AdSense).
We do not control, endorse, or guarantee:
- The accuracy of advertisements
- The quality of advertised products or services
- The reliability or legality of third-party offers
Any interaction with advertisements is at your own risk.

2. Third-Party Links
Student Suite may contain links to third-party websites, services, or resources.
We are not responsible for:
- Content on third-party websites
- Privacy practices of third-party services
- Products or services offered by third parties
Accessing third-party links is done at your own discretion and risk.

3. No Endorsement
The presence of advertisements or third-party links on Student Suite does not imply endorsement, sponsorship, or recommendation by Student Suite.

4. Third-Party Services
Student Suite may use third-party tools and services, including but not limited to:
- Advertising networks
- Analytics providers
- Cloud or infrastructure services
These third-party services operate under their own terms and privacy policies.
Student Suite is not responsible for the actions or policies of third-party service providers.

5. Limitation of Liability
To the maximum extent permitted by law, Student Suite shall not be liable for:
- Any loss or damage arising from third-party advertisements
- Any loss or damage caused by third-party services
- Issues resulting from reliance on third-party content

6. Changes to This Disclaimer
We may update this Ads & Third-Party Disclaimer at any time.
Continued use of Student Suite means acceptance of the updated version.

7. Governing Law
This Disclaimer is governed by the laws of India.

8. Contact
Student Suite (Owner-operated)
Legal notices may be provided via email, in-app notifications, or website updates.`}
          </div>
        </details>
      </section>

      <section id="refund" className="rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-bg)] p-4 sm:p-5">
        <details className="group">
          <summary className="flex items-start justify-between gap-3 cursor-pointer list-none">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[color:var(--topbar-text)]">Refund &amp; Cancellation Policy</h2>
              <p className="text-sm text-[color:var(--topbar-muted)]">Content will be provided and stored here.</p>
            </div>
            <span className="text-lg text-[color:var(--topbar-muted)] transition-transform group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="mt-3 text-sm text-[color:var(--topbar-muted)] whitespace-pre-line">
          {`REFUND & CANCELLATION POLICY
For Student Suite
Last Updated: 26/01/2026
This Refund & Cancellation Policy explains how refunds, cancellations, and payment-related matters will be handled on Student Suite if and when paid features are introduced.
Currently, Student Suite is free to use and does not charge users. This policy will apply only when paid features or subscriptions are activated.

1. Current Status (No Payments)
At present:
- Student Suite is completely free
- No subscriptions or paid features are active
- No payments are collected
Therefore, no refunds or cancellations are applicable at this time.

2. Future Paid Features
Student Suite may introduce paid features, subscriptions, or premium services in the future.
By purchasing any paid feature, you agree to this Refund & Cancellation Policy.

3. All Sales Are Final (Strict No-Refund Policy)
Once payments are enabled, all purchases made on Student Suite will be considered final.
No refunds will be provided for:
- Change of mind
- Forgetting to cancel
- Partial usage
- Non-usage of features
- Dissatisfaction after purchase
- Misunderstanding of features
- Account suspension due to policy violations

4. Digital Services Disclaimer
All paid services provided by Student Suite are digital in nature and are considered consumed immediately upon activation.
Due to the nature of digital services, refunds are not possible once access is granted.

5. Cancellation of Subscription (If Applicable)
If subscription-based plans are introduced:
- Users may cancel their subscription at any time
- Cancellation will stop future billing
- Access will continue until the end of the current billing period
- No refunds will be issued for unused time

6. Legal & Technical Exceptions
Refunds may be considered only in the following limited cases:
- Duplicate payment due to technical error
- Incorrect charge caused by system failure
- Unauthorized or fraudulent transaction
- Refund required by applicable law
Such cases will be reviewed individually.

7. Abuse & Fraud Prevention
Student Suite reserves the right to deny refunds or disputes if we detect:
- Repeated refund requests
- Abuse of policies
- Fraudulent activity
- Chargeback misuse
Accounts involved in such activities may be suspended or permanently terminated.

8. Payment Gateways
Payments will be processed through third-party gateways such as:
- Razorpay
- UPI providers
- Card networks
Student Suite is not responsible for:
- Bank processing delays
- Gateway downtime
- Provider-side failures

9. Policy Changes
We reserve the right to update or modify this policy at any time.
Continued use of paid features (when available) means acceptance of the updated policy.

10. Governing Law
This Refund & Cancellation Policy is governed by the laws of India.

11. Contact
Student Suite (Owner-operated)
Billing or legal notices may be provided via email, in-app notifications, or website updates.`}
          </div>
        </details>
      </section>
    </div>
  );
}
