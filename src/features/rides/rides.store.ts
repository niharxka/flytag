import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Direction } from './rides.api';

type RidesUiState = {
  direction: Direction;
  setDirection: (direction: Direction) => void;
};

/**
 * UI state only (§8.4): which direction the Rides tab shows. Persisted so the choice survives
 * relaunching the app (§9.4). Server data never goes in here; that's TanStack Query's job.
 */
export const useRidesUi = create<RidesUiState>()(
  persist(
    (set) => ({
      direction: 'to_airport',
      setDirection: (direction) => set({ direction }),
    }),
    { name: 'flytag.rides-ui', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
