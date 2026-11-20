// Auth: signing in with a UCSD Google account (email codes in dev builds), and knowing who is signed in.
// Screens: Welcome, Sign up / Sign in (AuthForm), Verify. AuthProvider/useSession hold the session for the app;
// the server-side @ucsd.edu check lives in the auth_hook migration.
export { AuthCallback } from './AuthCallback';
export { AuthForm } from './AuthForm';
export { AuthProvider, useSession } from './AuthProvider';
export { useIsGuest, useRequireSignIn, useSignOut } from './auth.hooks';
export { useGuestBrowsing } from './auth.store';
export { VerifyCodeForm } from './VerifyCodeForm';
export { WelcomeScreen } from './WelcomeScreen';
