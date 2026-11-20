import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { rideDayKey } from '@/lib/dates';

import { recordActivity, rememberSignupSource } from './analytics.api';
import { sourceFromQuery } from './analytics.logic';

/**
 * Web only: if this page was opened from a tagged link (?utm_source=instagram), remember the tag
 * for onboarding. Runs once, on the URL the visitor landed on. Phones skip it: app stores drop
 * link tags, so there the onboarding question is the only signal.
 */
export function useCaptureSignupSource() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const source = sourceFromQuery(window.location.search);
    // Losing a tag is harmless, so a storage failure is ignored rather than shown.
    if (source) rememberSignupSource(source).catch(() => {});
  }, []);
}

/**
 * Record that the rider used the app today: on launch and whenever it comes back to the
 * foreground. Only one request per San Diego day leaves the phone; the server dedupes too.
 * Pass undefined (signed out, or not onboarded yet) to record nothing.
 */
export function useRecordActivity(userId: string | undefined) {
  const lastDay = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    lastDay.current = null; // a different account on the same phone counts separately
    const record = () => {
      const today = rideDayKey(new Date());
      if (lastDay.current === today) return;
      lastDay.current = today;
      // A missed day only makes a metric slightly low; never bother the rider with it.
      recordActivity().catch(() => {
        lastDay.current = null;
      });
    };
    record();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') record();
    });
    return () => sub.remove();
  }, [userId]);
}
