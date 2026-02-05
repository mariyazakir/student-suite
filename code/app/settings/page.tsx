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
              <p className="text-sm text-[color:var(--topbar-muted)]">All policies are available as public pages (no login required).</p>
              <div className="flex flex-col gap-1 text-sm">
                <Link href="/terms" className="text-[color:var(--topbar-text)] underline">Terms &amp; Conditions</Link>
                <Link href="/privacy" className="text-[color:var(--topbar-text)] underline">Privacy Policy</Link>
                <Link href="/disclaimer" className="text-[color:var(--topbar-text)] underline">General Disclaimer</Link>
                <Link href="/user-content" className="text-[color:var(--topbar-text)] underline">User Content Policy</Link>
                <Link href="/copyright" className="text-[color:var(--topbar-text)] underline">Copyright &amp; Ownership</Link>
                <Link href="/ads" className="text-[color:var(--topbar-text)] underline">Ads &amp; Third-Party Disclaimer</Link>
                <Link href="/refund" className="text-[color:var(--topbar-text)] underline">Refund &amp; Cancellation</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
