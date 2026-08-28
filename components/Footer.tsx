export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Booster Club Hub. All rights reserved.</p>
        <p className="mt-1">
          Booster dues and platform fees are billed separately. Booster dues are collected by
          your school&rsquo;s own booster club, not by Booster Club Hub.
        </p>
      </div>
    </footer>
  );
}
