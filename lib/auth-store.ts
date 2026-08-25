const TOKEN_KEY = "salva_consumer_token";
const REFRESH_KEY = "salva_consumer_refresh_token";
const REFRESH_EXPIRES_KEY = "salva_consumer_refresh_expires_at";

type TokenPayload = {
  exp?: number;
  user_type?: string;
};

function decodePayload(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token.split(".")[1])) as TokenPayload;
  } catch {
    return null;
  }
}

function isAccessExpired(token: string): boolean {
  const payload = decodePayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

function getRefreshExpiresAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_EXPIRES_KEY);
}

function isRefreshValid(): boolean {
  const refresh = getConsumerRefreshToken();
  const expiresAt = getRefreshExpiresAt();
  if (!refresh || !expiresAt) return false;
  return Date.now() < new Date(expiresAt).getTime();
}

export function getConsumerRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getConsumerToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(TOKEN_KEY);
  if (token && isConsumerTokenValid(token)) {
    return token;
  }

  return isRefreshValid() ? localStorage.getItem(TOKEN_KEY) : null;
}

export function setConsumerTokens(
  accessToken: string,
  refreshToken: string,
  refreshExpiresAt?: string,
): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(
    REFRESH_EXPIRES_KEY,
    refreshExpiresAt ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  );
}

/** @deprecated Use setConsumerTokens */
export function setConsumerToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearConsumerToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(REFRESH_EXPIRES_KEY);
}

export function isConsumerTokenValid(token?: string | null): boolean {
  const value =
    token ?? (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
  if (!value || isAccessExpired(value)) return false;
  const payload = decodePayload(value);
  return payload?.user_type === "user";
}

export function isConsumerLoggedIn(): boolean {
  if (isConsumerTokenValid()) return true;
  return isRefreshValid();
}

export async function ensureConsumerAccessToken(): Promise<boolean> {
  if (isConsumerTokenValid()) return true;
  if (!isRefreshValid()) return false;

  const refresh = getConsumerRefreshToken();
  if (!refresh) return false;

  const baseURL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  try {
    const response = await fetch(`${baseURL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
    };
    setConsumerTokens(
      data.access_token,
      data.refresh_token,
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    );
    return true;
  } catch {
    return false;
  }
}

export async function logoutConsumerSession(): Promise<void> {
  const refresh = getConsumerRefreshToken();
  if (!refresh) {
    clearConsumerToken();
    return;
  }

  const baseURL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  try {
    await fetch(`${baseURL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
  } catch {
    // best effort
  } finally {
    clearConsumerToken();
  }
}
