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

export interface OtpRequestResponse {
  success: boolean;
  phoneE164?: string;
  country?: string;
  channel?: string;
  ttlSeconds?: number;
  message?: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
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

export async function requestOtp(input: {
  phone: string;
  channel?: "sms" | "whatsapp";
  country?: string;
}): Promise<OtpRequestResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/otp/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message as string)) || `İstek başarısız (status: ${res.status})`;
    throw new Error(message);
  }
  return data as OtpRequestResponse;
}

export async function verifyOtp(input: {
  phone: string;
  code: string;
  country?: string;
}): Promise<OtpVerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message as string)) || `İstek başarısız (status: ${res.status})`;
    throw new Error(message);
  }
  return data as OtpVerifyResponse;
}

export async function loginMinimalUser(input: {
  email: string;
  phone: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login-minimal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse(res);
}

export async function registerMinimalUser(input: {
  name: string;
  email: string;
  phone: string;
  cityCode?: string;
  districtCode?: string;
  role?: string;
  subRoles?: string[];
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register-minimal`, {
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
