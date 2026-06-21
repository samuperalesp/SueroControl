export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    nombres: string;
    apellidos: string;
    rol: string;
  };
}

export async function login(usuario: string, password: string): Promise<LoginResponse> {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Credenciales inválidas');
  }
  return res.json();
}
