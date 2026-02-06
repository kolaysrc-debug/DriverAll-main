// lib/api/auth.ts

// Artık doğrudan kendi origin'imize istek atacağız.
// Next.js, /api/* isteklerini backend'e proxy'leyecek.
const API_BASE_URL = ""; // relative path kullanıyoruz

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
}

async function handleResponse(res: Response): Promise<AuthResponse> {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data && (data.message as string)) ||
      `İstek başarısız (status: ${res.status})`;
    throw new Error(message);
  }

  return data;
}

// Kayıt
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse(res);
}

// Giriş
export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse(res);
}
