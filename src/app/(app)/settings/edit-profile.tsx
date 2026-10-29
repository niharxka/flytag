import { useSession } from '@/features/auth';
import { EditProfileForm } from '@/features/profile';

export default function EditProfileRoute() {
  const { session } = useSession();
  // (app) routes only exist with a session; this keeps TypeScript sure of it.
  if (!session) return null;
  return <EditProfileForm userId={session.user.id} />;
}
