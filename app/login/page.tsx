import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { login } from './actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
        <p className="mt-1 text-sm text-slate-600">
          Parents/guardians and booster club admins log in here.
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}

        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={searchParams.next ?? ''} />
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
          >
            Log in
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
