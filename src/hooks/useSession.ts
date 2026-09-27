"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

/**
 * Current user. Uses the refresh-aware API client, so an expired access token is renewed
 * transparently instead of logging the user out after 15 minutes.
 */
export function useSession() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const persistedUser = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["session", Boolean(refreshToken)],
    enabled: hasHydrated && Boolean(accessToken || refreshToken),
    initialData: persistedUser,
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async (): Promise<AuthUser> => {
      const payload = await apiFetch<{ user: AuthUser }>("/auth/me");
      useAuthStore.setState({ user: payload.user });
      return payload.user;
    },
  });
}
