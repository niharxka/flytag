import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Same values as profile_private.theme_pref (§6), so syncing it to the server later is a straight copy. */
export type ThemePref = 'system' | 'mist' | 'charcoal';

type ThemePrefState = {
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
};

/**
 * The theme the user picked (§8.4 "theme preference mirror"). Persisted on the device so the app
 * opens in the right theme straight away, without waiting on a network round trip.
 */
export const useThemePref = create<ThemePrefState>()(
  persist(
    (set) => ({
      pref: 'system',
      setPref: (pref) => set({ pref }),
    }),
    { name: 'flytag.theme-pref', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
