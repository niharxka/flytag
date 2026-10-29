import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';

// FlyTag is designed for phones. On a laptop's wide browser window the screens would stretch
// edge to edge, so the web build shows them in a centred, phone-width column.
const MAX_WIDTH = 480;

export function WebFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return children;
  return (
    <View className="flex-1 items-center bg-mist-deep">
      <View className="w-full flex-1 overflow-hidden" style={{ maxWidth: MAX_WIDTH }}>
        {children}
      </View>
    </View>
  );
}
