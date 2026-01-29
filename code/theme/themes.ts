export type ThemeTokens = {
  name: 'neutral' | 'girlish' | 'boyish';
  bg: string;
  cardBg: string;
  sidebarBg: string;
  textPrimary: string;
  textSecondary: string;
  primaryBtn: string;
  accent: string;
  border: string;
  radius: string;
  shadow: string;
};

export const neutralTheme: ThemeTokens = {
  name: 'neutral',
  bg: '#F9FAFB',
  cardBg: '#FFFFFF',
  sidebarBg: '#F3F4F6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  primaryBtn: '#2563EB',
  accent: '#2563EB',
  border: '#E5E7EB',
  radius: '12px',
  shadow: '0 4px 12px rgba(0,0,0,0.05)',
};

export const girlishTheme: ThemeTokens = {
  name: 'girlish',
  bg: '#FFF3E8',
  cardBg: '#FFFFFF',
  sidebarBg: '#FFE6EE',
  textPrimary: '#2F2F2F',
  textSecondary: '#6F6F6F',
  primaryBtn: '#FF8FAB',
  accent: '#FFD166',
  border: '#FFD6E0',
  radius: '18px',
  shadow: '0 8px 24px rgba(255,143,171,0.22)',
};

export const boyishTheme: ThemeTokens = {
  name: 'boyish',
  bg: '#020617',
  cardBg: '#0F172A',
  sidebarBg: '#020617',
  textPrimary: '#E5E7EB',
  textSecondary: '#94A3B8',
  primaryBtn: '#2563EB',
  accent: '#22D3EE',
  border: '#1E293B',
  radius: '10px',
  shadow: '0 0 20px rgba(34,211,238,0.35)',
};
