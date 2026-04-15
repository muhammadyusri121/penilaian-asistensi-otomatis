import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GradingSystem from '@/components/grading/GradingSystem';
import { verifyAuthToken } from '@/lib/server/auth';
import { getUserByUsername } from '@/lib/server/userStore';

export default async function Home() {
  const cookieStore = cookies();
  const token = cookieStore.get('penilaian_auth')?.value;
  const authUser = token ? verifyAuthToken(token) : null;
  const dbUser = authUser ? await getUserByUsername(authUser.username) : null;

  if (!authUser || !dbUser || !dbUser.isActive) {
    redirect('/login');
  }

  return (
    <GradingSystem
      currentUser={{
        username: dbUser.username,
        fullName: dbUser.fullName,
      }}
    />
  );
}
