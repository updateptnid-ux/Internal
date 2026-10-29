import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function RootPage() {
  // Redirect root traffic directly to the enterprise task management board
  redirect('/dashboard/tasks');
}
