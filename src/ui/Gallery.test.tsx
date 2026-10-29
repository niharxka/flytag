import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Gallery } from './Gallery';

// Smoke test: every ui/ component and variant renders without throwing.
describe('ui gallery', () => {
  it('renders every component', async () => {
    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <Gallery />
      </SafeAreaProvider>,
    );
    // Labels a screen reader would hear, from a few components: proves real content rendered.
    expect(screen.getAllByLabelText('Post a ride').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Jake hasn’t shared a number').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Wed 3/19, 2:00 PM, full').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('tab', { selected: true }).length).toBeGreaterThan(0);
  });
});
