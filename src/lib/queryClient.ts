import { QueryClient } from '@tanstack/react-query';

/**
 * Server-state cache (spec §2.1). Defaults suit a phone: data is "fresh" for 30 s so tab
 * switches don't refetch constantly, and failed requests retry once, not three times.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
    mutations: { retry: 0 },
  },
});
