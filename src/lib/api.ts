import { useAuthStore } from "@/stores/authStore";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  public readonly status: number;
  public readonly requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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
  const response = await requestWithToken(path, options, options.accessToken);

  if (response.status !== 401) {
    return response;
  }

  const refreshedAccessToken = await refreshAccessToken();
  if (!refreshedAccessToken) {
    handleUnauthorized();
    return response;
  }

  const retriedResponse = await requestWithToken(path, options, refreshedAccessToken);
  if (retriedResponse.status === 401) {
    handleUnauthorized();
  }

  return retriedResponse;
}

export async function apiFetch<T>(path: string, options: AuthFetchOptions = {}): Promise<T> {
  const response = await authenticatedFetch(path, options);

  if (!response.ok) {
    const message = await readErrorMessage(response);

    if (response.status === 401) {
      handleUnauthorized();
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function requestWithToken(
  path: string,
  options: AuthFetchOptions,
  accessToken?: string,
): Promise<Response> {
  const { headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type") && !isFormData(rest.body)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const token = accessToken ?? useAuthStore.getState().accessToken;
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
    ...rest,
    headers: requestHeaders,
  });
}

async function refreshAccessToken(): Promise<string | undefined> {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        return undefined;
      }

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
    })().finally(() => {
      refreshRequest = undefined;
    });
  }

  return refreshRequest;
}

function handleUnauthorized() {
  useAuthStore.getState().clearSession();
  if (typeof window !== "undefined") {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const loginPath = window.location.pathname.startsWith("/admin")
      ? "/admin/login"
      : `/login?redirect=${encodeURIComponent(currentPath)}`;

    if (window.location.pathname !== "/login" && window.location.pathname !== "/admin/login") {
      window.location.assign(loginPath);
    }
  }
}

function isFormData(value: BodyInit | null | undefined): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();

  if (!text) {
    return "Request failed";
  }

  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    return parsed.error?.message || text;
  } catch {
    return text;
  }
}
