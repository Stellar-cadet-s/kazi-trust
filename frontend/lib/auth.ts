const TOKEN_KEY = 'trustwork_access';
const USER_KEY = 'trustwork_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): { id: number; user_type: string; first_name?: string; last_name?: string; email?: string | null } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: number; user_type: string; first_name?: string; last_name?: string; email?: string | null };
  } catch {
    return null;
  }
}

export function setAuth(access: string, user: { id: number; user_type: string; first_name?: string; last_name?: string; email?: string | null }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isEmployer(): boolean {
  const u = getUser();
  return u?.user_type === 'employer';
}

export function isEmployee(): boolean {
  const u = getUser();
  return u?.user_type === 'employee';
}
