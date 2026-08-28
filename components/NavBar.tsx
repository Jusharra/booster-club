import Link from 'next/link';

export function NavBar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-brand-700">
          Booster Club Hub
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/organizations/new" className="hover:text-brand-700">
            Start a Booster Club
          </Link>
          <Link href="/login" className="hover:text-brand-700">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
          >
            Join as a Parent
          </Link>
        </nav>
      </div>
    </header>
  );
}
