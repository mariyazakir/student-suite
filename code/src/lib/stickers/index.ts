const STICKERS_DB = 'notes-stickers-db';
const STICKERS_KEY = 'notes-stickers-fallback';

export type Sticker = {
  id: string;
  name: string;
  imageDataUrl: string;
  createdAt: string;
};

const saveFallback = (stickers: Sticker[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STICKERS_KEY, JSON.stringify(stickers));
  window.dispatchEvent(new CustomEvent('stickers-updated'));
};

const loadFallback = (): Sticker[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STICKERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Sticker[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const openDB = (): Promise<IDBDatabase | null> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      resolve(null);
      return;
    }
    const req = indexedDB.open(STICKERS_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('stickers')) {
        db.createObjectStore('stickers', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

export const loadStickers = async (): Promise<Sticker[]> => {
  const db = await openDB();
  if (!db) return loadFallback();
  return new Promise((resolve) => {
    const tx = db.transaction('stickers', 'readonly');
    const store = tx.objectStore('stickers');
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as Sticker[]) ?? []);
    req.onerror = () => resolve(loadFallback());
  });
};

export const addSticker = async (sticker: Sticker) => {
  const db = await openDB();
  if (!db) {
    saveFallback([sticker, ...loadFallback()]);
    return;
  }
  return new Promise<void>((resolve) => {
    const tx = db.transaction('stickers', 'readwrite');
    tx.objectStore('stickers').put(sticker);
    tx.oncomplete = () => {
      resolve();
      window.dispatchEvent(new CustomEvent('stickers-updated'));
    };
    tx.onerror = () => {
      saveFallback([sticker, ...loadFallback()]);
      resolve();
    };
  });
};
