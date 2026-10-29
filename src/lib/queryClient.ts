import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

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

// TanStack Query's "refetch on focus" listens for browser focus, which doesn't exist in React
// Native. Coming back to the app is the phone's version of it, so stale lists refresh then.
focusManager.setEventListener((setFocused) => {
  const sub = AppState.addEventListener('change', (state) => setFocused(state === 'active'));
  return () => sub.remove();
});
