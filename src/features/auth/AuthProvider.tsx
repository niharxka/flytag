import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { getSession, onAuthChange, type Session } from './auth.api';

type AuthState = { session: Session | null; initializing: boolean };

const AuthContext = createContext<AuthState>({ session: null, initializing: true });

/**
 * Holds the current session for the whole app. Session is the one piece of "who am I" state
 * that isn't fetched with TanStack Query: Supabase pushes changes to us (sign in, refresh,
 * sign out), so we subscribe instead of polling.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ session: null, initializing: true });
  const userId = useRef<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const apply = (session: Session | null) => {
      // Signing out (or into a different account) must not leave the last user's data cached.
      if (userId.current !== session?.user.id) queryClient.clear();
      userId.current = session?.user.id;
      setState({ session, initializing: false });
    };
    getSession().then((session) => active && apply(session));
    const unsubscribe = onAuthChange(apply);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthState {
  return useContext(AuthContext);
}
