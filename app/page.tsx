import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <NavBar />
      <main>
        <section className="bg-gradient-to-b from-brand-50 to-white">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Booster club membership, plus recruiting profiles recruiters can actually find.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Run your booster club&rsquo;s dues, roster, and local perks in one place. Parents can
              also give their athlete a fast, mobile, SEO-optimized recruiting profile page with a
              printable QR code &mdash; built for a recruiter searching from a phone at a game.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/organizations/new"
                className="rounded-md bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
              >
                Start Your Booster Club
              </Link>
              <Link
                href="/signup"
                className="rounded-md border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                I&rsquo;m a Parent
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            <Feature
              title="One club, every family"
              body="Dues tiers, renewal tracking, and a member roster your booster club admin manages from one dashboard."
            />
            <Feature
              title="Guardian-controlled recruiting profiles"
              body="Parents create and publish their athlete's profile. It's never on until a guardian explicitly turns it on, and it's never editable by anyone but them."
            />
            <Feature
              title="Built for a recruiter's phone"
              body="Unique SEO-friendly URL, fast mobile load, and a downloadable QR code for the program, poster, or business card."
            />
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center">
            <h2 className="text-2xl font-bold text-slate-900">How the money moves</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Booster dues go straight to your club&rsquo;s own payment account &mdash; we never
              hold your families&rsquo; money. The optional Recruiting Profile subscription is a
              separate add-on. Booster Club Hub&rsquo;s own revenue is a flat platform fee billed
              directly to your organization, kept structurally separate from both.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
