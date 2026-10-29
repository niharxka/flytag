import { Redirect } from 'expo-router';

import { Gallery } from '@/ui/Gallery';

// Component gallery (spec §5.4). Development only: release builds bounce to the home route.
export default function DevUiRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Gallery />;
}
