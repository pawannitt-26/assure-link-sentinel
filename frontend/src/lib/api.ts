/** Build full API URL from VITE_API_URL + path (Strategy A — no nginx /api proxy). */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL ?? '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const fullPath = normalized.startsWith('/api') ? normalized : `/api${normalized}`;
  if (!base) return fullPath;
  return `${base.replace(/\/$/, '')}${fullPath}`;
}
