import { renderRouter, screen } from 'expo-router/testing-library';

// Regression test for the auth gate in src/app/_layout.tsx and (auth)/_layout.tsx, using the
// real route files. It lives outside src/app on purpose: every file in src/app becomes a route,
// so a test there gets bundled into the app (and its Node-only imports crash Metro). Auth and profile are faked so each sign-in state can be set directly.
// Bug it guards: a signed-out launch opens "/", which only exists inside (app), and showed
// "Unmatched route" until the guards got redirectTo.

const mockAuth = { session: null as null | { user: { id: string; email: string } } };
const mockProfile = { onboardedAt: null as string | null };

// Screens become plain labels; the gate is what's under test.
const mockScreen = (label: string) =>
  function MockScreen() {
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return <Text>{label}</Text>;
  };

jest.mock('@/features/auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ session: mockAuth.session, initializing: false }),
  useSignOut: () => ({ mutate: jest.fn(), isPending: false }),
  WelcomeScreen: mockScreen('Welcome screen'),
  AuthForm: ({ mode }: { mode: string }) => {
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return <Text>{mode === 'sign-up' ? 'Sign up screen' : 'Sign in screen'}</Text>;
  },
  VerifyCodeForm: mockScreen('Verify screen'),
}));
jest.mock('@/features/profile', () => ({
  useMyProfile: () => ({ isPending: false, data: { onboardedAt: mockProfile.onboardedAt } }),
  OnboardingForm: mockScreen('Onboarding screen'),
  ProfileScreen: mockScreen('Profile screen'),
  EditProfileForm: mockScreen('Edit profile screen'),
  RiderProfile: mockScreen('Rider screen'),
  useAvatarUrl: () => ({ data: undefined }),
}));
jest.mock('@/features/rides', () => ({
  RidesScreen: mockScreen('Rides screen'),
  PostRideForm: mockScreen('Post ride screen'),
  RideDetail: mockScreen('Ride screen'),
  EditRideForm: mockScreen('Edit ride screen'),
}));
jest.mock('@/features/chat', () => ({
  ChatScreen: mockScreen('Chat screen'),
  ChatPreview: mockScreen('Chat preview'),
  ChatsScreen: mockScreen('Chats screen'),
}));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
// Jest stubs global.css, so NativeWind never learns darkMode is 'class' and throws on a manual
// scheme change. Theme switching isn't what these tests are about; skip applying it.
jest.mock('@/theme/useThemeMode', () => ({
  ...jest.requireActual('@/theme/useThemeMode'),
  useApplyThemePref: () => {},
}));

const signedIn = { user: { id: 'u1', email: 'a@ucsd.edu' } };

describe('auth gate', () => {
  it('signed out: opening the app shows Welcome', async () => {
    mockAuth.session = null;
    await renderRouter('./src/app', { initialUrl: '/' });
    expect(screen).toHavePathname('/welcome');
    expect(screen.getByText('Welcome screen')).toBeTruthy();
  });

  it('signed out: Sign up and Sign in are separate screens', async () => {
    mockAuth.session = null;
    await renderRouter('./src/app', { initialUrl: '/sign-up' });
    expect(screen.getByText('Sign up screen')).toBeTruthy();
    await renderRouter('./src/app', { initialUrl: '/sign-in' });
    expect(screen.getByText('Sign in screen')).toBeTruthy();
  });

  it('signed in, not onboarded: goes to Onboarding, even from /welcome', async () => {
    mockAuth.session = signedIn;
    mockProfile.onboardedAt = null;
    await renderRouter('./src/app', { initialUrl: '/welcome' });
    expect(screen).toHavePathname('/onboarding');
  });

  it('onboarded: opening the app shows the Rides tab, and auth screens bounce back', async () => {
    mockAuth.session = signedIn;
    mockProfile.onboardedAt = '2026-10-29T00:00:00Z';
    await renderRouter('./src/app', { initialUrl: '/' });
    expect(screen).toHavePathname('/');
    expect(screen.getByText('Rides screen')).toBeTruthy();
  });

  it('onboarded: a stale link to sign-in lands on Rides', async () => {
    mockAuth.session = signedIn;
    mockProfile.onboardedAt = '2026-10-29T00:00:00Z';
    await renderRouter('./src/app', { initialUrl: '/sign-in' });
    expect(screen).toHavePathname('/');
  });
});
