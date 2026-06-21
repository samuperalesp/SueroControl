export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options?.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }
  return res;
}
