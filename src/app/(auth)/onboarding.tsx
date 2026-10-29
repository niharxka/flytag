import { useSession } from '@/features/auth';
import { OnboardingForm } from '@/features/profile';

export default function OnboardingRoute() {
  const { session } = useSession();
  // The (auth) layout only shows this screen with a session.
  if (!session) return null;
  return <OnboardingForm userId={session.user.id} />;
}
