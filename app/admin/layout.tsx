import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: account } = await supabase
    .from('accounts')
    .select('role, full_name, organization_id')
    .eq('id', user.id)
    .single();

  if (!account || (account.role !== 'org_admin' && account.role !== 'platform_owner')) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/admin" className="text-lg font-bold text-brand-700">
            Booster Club Hub &mdash; Admin
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/admin" className="hover:text-brand-700">
              Dashboard
            </Link>
            <Link href="/admin/perks" className="hover:text-brand-700">
              Perks
            </Link>
            {account.role === 'org_admin' && (
              <Link href="/admin/connect" className="hover:text-brand-700">
                Payment Setup
              </Link>
            )}
            <span>{account.full_name ?? 'Admin'}</span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
