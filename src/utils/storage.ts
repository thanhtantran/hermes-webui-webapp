import { HermesURL } from '../types';

const STORAGE_KEY = 'hermes_urls';

export const loadStoredUrls = (): HermesURL[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to load Hermes URLs from storage:', err);
    return [];
  }
};

export const saveStoredUrls = (urls: HermesURL[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
    return true;
  } catch (err) {
    console.error('Failed to save Hermes URLs to storage:', err);
    return false;
  }
};

export const exportUrlsAsJson = (urls: HermesURL[]): string => {
  return JSON.stringify(urls, null, 2);
};

export const importUrlsFromJson = (jsonStr: string): HermesURL[] => {
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) {
    throw new Error('Imported data must be an array of servers.');
  }
  return parsed.map((item, idx) => ({
    id: item.id || `imported-${Date.now()}-${idx}`,
    name: String(item.name || 'Unnamed Server'),
    url: String(item.url || 'https://'),
    password: item.password ? String(item.password) : undefined,
    saveCredentials: Boolean(item.saveCredentials),
    createdAt: item.createdAt || Date.now(),
  }));
};
