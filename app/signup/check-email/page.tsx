import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

export default function CheckEmailPage() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
        <p className="mt-3 text-slate-600">
          We sent you a confirmation link. Once you confirm, log in to finish joining your booster
          club and, if you&rsquo;d like, set up your athlete&rsquo;s recruiting profile.
        </p>
      </main>
      <Footer />
    </>
  );
}
