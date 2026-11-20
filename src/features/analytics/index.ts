// Analytics: the few signals behind the §14 metrics. Where a rider came from (a tagged web link,
// remembered until onboarding), and which days they opened the app (activity_days).
// The numbers themselves are read in the Supabase dashboard from the `analytics` schema views.
export { forgetSignupSource, readSignupSource } from './analytics.api';
export { useCaptureSignupSource, useRecordActivity } from './analytics.hooks';
