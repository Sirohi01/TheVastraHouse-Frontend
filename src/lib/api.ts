import { useAuthStore } from "@/stores/authStore";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly requestId?: string;

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

type AuthFetchOptions = RequestInit & { accessToken?: string };
type RefreshResponse = { accessToken: string; refreshToken: string };

let refreshRequest: Promise<string | undefined> | undefined;

export async function authenticatedFetch(
  path: string,
  options: AuthFetchOptions = {},
): Promise<Response> {
  const hadSession = Boolean(options.accessToken ?? useAuthStore.getState().accessToken);
  let response: Response;

  try {
    response = await requestWithToken(path, options, options.accessToken);
  } catch {
    throw new ApiError("We could not reach the server. Check your connection and try again.", 0);
  }

  if (response.status !== 401 || !hadSession) {
    return response;
  }

  const refreshedAccessToken = await refreshAccessToken();

  if (!refreshedAccessToken) {
    handleSessionExpired();
    // Public endpoints (cart, catalog, checkout) keep working as a guest.
    return requestWithToken(path, { ...options, accessToken: undefined }, "");
  }

  const retriedResponse = await requestWithToken(path, options, refreshedAccessToken);

  if (retriedResponse.status === 401) {
    handleSessionExpired();
  }

  return retriedResponse;
}

export async function apiFetch<T>(path: string, options: AuthFetchOptions = {}): Promise<T> {
  const response = await authenticatedFetch(path, options);

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** Unauthenticated JSON request that still returns friendly ApiErrors. */
export async function publicFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  } catch {
    throw new ApiError("We could not reach the server. Check your connection and try again.", 0);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (response.status === 204 ? undefined : await response.json()) as T;
}

export async function toApiError(response: Response) {
  const text = await response.text();
  let message = "Something went wrong. Please try again.";
  let code: string | undefined;
  let requestId: string | undefined;

  try {
    const parsed = JSON.parse(text) as {
      error?: string | { message?: string; code?: string; requestId?: string };
    };
    if (typeof parsed.error === "string") {
      code = parsed.error;
    } else if (parsed.error) {
      message = parsed.error.message || message;
      code = parsed.error.code;
      requestId = parsed.error.requestId;
    }
  } catch {
    if (text && text.length < 200 && !text.trim().startsWith("<")) {
      message = text;
    }
  }

  if (response.status === 429 && !code) {
    message = message.startsWith("Too many")
      ? message
      : "Too many attempts. Please wait a moment and try again.";
  }

  return new ApiError(cleanValidationMessage(message), response.status, code, requestId);
}

/** Zod messages arrive as JSON arrays; show the first human-readable message. */
function cleanValidationMessage(message: string) {
  if (!message.trim().startsWith("[")) return message;
  try {
    const issues = JSON.parse(message) as Array<{
      message?: string;
      path?: Array<string | number>;
    }>;
    const first = issues[0];
    if (!first?.message) return "Please check the form and try again.";
    const field = first.path?.length ? `${String(first.path[first.path.length - 1])}: ` : "";
    return `${field}${first.message}`;
  } catch {
    return "Please check the form and try again.";
  }
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

async function requestWithToken(
  path: string,
  options: AuthFetchOptions,
  accessToken?: string,
): Promise<Response> {
  const { headers } = options;
  const rest: RequestInit = {
    body: options.body,
    cache: options.cache,
    credentials: options.credentials,
    integrity: options.integrity,
    keepalive: options.keepalive,
    method: options.method,
    mode: options.mode,
    priority: options.priority,
    redirect: options.redirect,
    referrer: options.referrer,
    referrerPolicy: options.referrerPolicy,
    signal: options.signal,
    window: options.window,
  };
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type") && !isFormData(rest.body)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  // An explicit empty string means "send no token" (guest retry after a failed refresh).
  const token =
    accessToken === "" ? undefined : (accessToken ?? useAuthStore.getState().accessToken);

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
    ...rest,
    headers: requestHeaders,
  });
}

export async function refreshAccessToken(): Promise<string | undefined> {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        return undefined;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
          body: JSON.stringify({ refreshToken }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!response.ok) {
          return undefined;
        }

        const session = (await response.json()) as RefreshResponse;
        useAuthStore.setState({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        });

        return session.accessToken;
      } catch {
        return undefined;
      }
    })().finally(() => {
      refreshRequest = undefined;
    });
  }

  return refreshRequest;
}

/** Signs out locally and revokes the refresh token server-side. */
export async function logout() {
  const refreshToken = useAuthStore.getState().refreshToken;
  useAuthStore.getState().clearSession();

  if (refreshToken) {
    await fetch(`${apiBaseUrl}/auth/logout`, {
      body: JSON.stringify({ refreshToken }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch(() => undefined);
  }
}

function handleSessionExpired() {
  useAuthStore.getState().clearSession();

  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    const protectedArea =
      path.startsWith("/admin") || path.startsWith("/account") || path.startsWith("/documents");

    if (!protectedArea || path === "/login" || path === "/admin/login") {
      return;
    }

    const currentPath = `${path}${window.location.search}`;
    window.location.assign(
      path.startsWith("/admin")
        ? "/admin/login"
        : `/login?redirect=${encodeURIComponent(currentPath)}`,
    );
  }
}

function isFormData(value: BodyInit | null | undefined): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

/** Only same-site relative paths are allowed as post-login destinations (no open redirect). */
export function safeRedirectPath(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
