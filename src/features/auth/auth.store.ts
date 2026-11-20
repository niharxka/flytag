import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type GuestState = {
  /** They tapped "Look around first" on Welcome, so a signed-out launch opens the tabs. */
  browsing: boolean;
  /** AsyncStorage has been read. Until then we can't tell a new visitor from a returning guest. */
  hydrated: boolean;
  startBrowsing: () => void;
  stopBrowsing: () => void;
};

/**
 * Guest mode, remembered on the device. Without it a signed-out launch couldn't tell a
 * brand-new visitor (show Welcome) from someone who already chose to look around (show rides).
 */
export const useGuestBrowsing = create<GuestState>()(
  persist(
    (set) => ({
      browsing: false,
      hydrated: false,
      startBrowsing: () => set({ browsing: true }),
      stopBrowsing: () => set({ browsing: false }),
    }),
    {
      name: 'flytag.guest-browsing',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ browsing: s.browsing }),
      onRehydrateStorage: () => () => useGuestBrowsing.setState({ hydrated: true }),
    },
  ),
);
