export type UserGender = 'male' | 'female' | 'neutral';

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  gender?: UserGender; // optional for backwards compatibility
}

export interface UserSession {
  userId: string;
  email: string;
  createdAt: string;
  gender?: UserGender;
}

const USERS_KEY = 'student-suite-users';
const SESSION_KEY = 'student-suite-session';

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const getUsers = (): StoredUser[] => {
  const storage = getStorage();
  if (!storage) return [];
  const raw = storage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveUsers = (users: StoredUser[]) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(USERS_KEY, JSON.stringify(users));
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const fallbackHash = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return `fallback-${Math.abs(hash)}`;
};

export const hashPassword = async (value: string) => {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return fallbackHash(value);
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return `sha256-${toHex(digest)}`;
};

export const findUserByEmail = (email: string) => {
  const users = getUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
};

export const createUser = async (email: string, password: string, gender: UserGender = 'neutral') => {
  const users = getUsers();
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('User already exists.');
  }
  const passwordHash = await hashPassword(password);
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
    gender,
  };
  saveUsers([...users, newUser]);
  return newUser;
};

export const verifyUser = async (email: string, password: string) => {
  const user = findUserByEmail(email);
  if (!user) return null;
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) return null;
  return user;
};

export const getSession = () => {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UserSession;
    return parsed;
  } catch {
    return null;
  }
};

export const setSession = (session: UserSession) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
};

/**
 * Clear all document and work-area data from localStorage so that the next
 * sign-in (same or different user) gets a fresh state.
 */
function clearDocumentAndWorkAreaStorage(
  storage: Storage,
  userId: string | null,
) {
  // Resume Builder
  storage.removeItem('resumes');
  storage.removeItem('lastOpenedResumeId');

  // Assignment Formatter
  storage.removeItem('assignment-formatter-v1');
  storage.removeItem('assignment-formatter-saves');

  // Notes → PDF (current user + guest)
  if (userId) storage.removeItem(`student-suite-notes-${userId}`);
  storage.removeItem('student-suite-notes-guest');

  // Builder UI (ATS job description per resume, onboarding)
  storage.removeItem('rb-onboarding-dismissed');
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key?.startsWith('ats-job-description-')) keysToRemove.push(key);
    if (key?.startsWith('resume-accessibility-')) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => storage.removeItem(key));
}

export const clearSession = () => {
  const storage = getStorage();
  if (!storage) return;
  const session = getSession();
  const userId = session?.userId ?? null;
  storage.removeItem(SESSION_KEY);
  clearDocumentAndWorkAreaStorage(storage, userId);
};

export const updateUserGender = (email: string, gender: UserGender) => {
  const users = getUsers();
  const next = users.map((user) =>
    user.email.toLowerCase() === email.toLowerCase() ? { ...user, gender } : user,
  );
  saveUsers(next);
  const session = getSession();
  if (session && session.email.toLowerCase() === email.toLowerCase()) {
    setSession({ ...session, gender });
  }
};

export const isAuthenticated = () => Boolean(getSession());
