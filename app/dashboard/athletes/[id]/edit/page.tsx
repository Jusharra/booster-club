import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PhotoUploader } from '@/components/PhotoUploader';
import { SubscribeButton } from '@/components/SubscribeButton';
import { updateAthleteProfile, setPhotoUrl, togglePublish } from './actions';

export default async function EditAthletePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; saved?: string; subscribed?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/athletes/${params.id}/edit`);

  const { data: athlete } = await supabase
    .from('athlete_profiles')
    .select('*')
    .eq('id', params.id)
    .eq('guardian_account_id', user.id)
    .single();

  if (!athlete) notFound();

  const { data: subscription } = await supabase
    .from('profile_subscriptions')
    .select('status, billing_interval, current_period_end')
    .eq('athlete_profile_id', athlete.id)
    .maybeSingle();

  const boundUpdate = updateAthleteProfile.bind(null, athlete.id);
  const boundSetPhoto = setPhotoUrl.bind(null, athlete.id);
  const statEntries = Object.entries(athlete.stats ?? {});
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {athlete.first_name} {athlete.last_name}
        </h1>
        <p className="text-sm text-slate-500">
          This page is 100% guardian-controlled. Nothing here is public until you publish it.
        </p>
      </div>

      {searchParams.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
      )}
      {searchParams.saved && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>
      )}

      {/* Publish control */}
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">
              {athlete.published ? 'Published — publicly visible' : 'Private — not publicly visible'}
            </p>
            {athlete.published && (
              <Link href={`/athletes/${athlete.slug}`} className="text-sm text-brand-700 underline">
                View public page: /athletes/{athlete.slug}
              </Link>
            )}
          </div>
          <form action={togglePublish}>
            <input type="hidden" name="athlete_id" value={athlete.id} />
            <input type="hidden" name="publish" value={(!athlete.published).toString()} />
            <button
              type="submit"
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                athlete.published ? 'bg-slate-600 hover:bg-slate-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {athlete.published ? 'Unpublish' : 'Publish'}
            </button>
          </form>
        </div>

        {athlete.published && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700">QR code</p>
            <p className="text-sm text-slate-500">
              Printable for a program, poster, or business card. Links to the public page above.
            </p>
            <a
              href={`/api/qr/${athlete.id}`}
              className="mt-2 inline-block rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              Download QR code (PNG)
            </a>
          </div>
        )}
      </section>

      {/* Recruiting profile subscription */}
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Recruiting Profile subscription</h2>
        <p className="mt-1 text-sm text-slate-500">
          Optional add-on separate from booster dues. Status:{' '}
          <span className="font-semibold">{subscription?.status ?? 'none'}</span>
        </p>
        {searchParams.subscribed === '0' && (
          <p className="mt-2 text-sm text-amber-600">Checkout canceled.</p>
        )}
        {subscription?.status !== 'active' && subscription?.status !== 'trialing' && (
          <div className="mt-3">
            <SubscribeButton athleteProfileId={athlete.id} />
          </div>
        )}
      </section>

      {/* Photo */}
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Photo</h2>
        <p className="mt-1 text-sm text-slate-500">
          Used with alt text including name, sport, and location for SEO and accessibility.
        </p>
        <div className="mt-3">
          <PhotoUploader
            athleteId={athlete.id}
            currentPhotoUrl={athlete.photo_url}
            defaultAlt={`${athlete.first_name} ${athlete.last_name}, ${athlete.sport} at ${athlete.school_name}`}
            onUploaded={boundSetPhoto}
          />
        </div>
      </section>

      {/* Main details form */}
      <form action={boundUpdate} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Profile details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" name="first_name" defaultValue={athlete.first_name} required />
          <Field label="Last name" name="last_name" defaultValue={athlete.last_name} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sport" name="sport" defaultValue={athlete.sport} required />
          <Field label="Grad year" name="grad_year" type="number" defaultValue={athlete.grad_year} required />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Position" name="position" defaultValue={athlete.position ?? ''} />
          <Field label="Height" name="height" defaultValue={athlete.height ?? ''} placeholder={`6'1"`} />
          <Field label="Weight" name="weight" defaultValue={athlete.weight ?? ''} placeholder="180 lbs" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="GPA" name="gpa" type="number" step="0.01" defaultValue={athlete.gpa ?? ''} />
          <Field label="City" name="city" defaultValue={athlete.city ?? ''} />
          <Field label="State" name="state" defaultValue={athlete.state ?? ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Bio</label>
          <textarea
            name="bio"
            rows={4}
            defaultValue={athlete.bio ?? ''}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Highlight video links (YouTube/Hudl, one per line)
          </label>
          <textarea
            name="highlight_video_urls"
            rows={3}
            defaultValue={(athlete.highlight_video_urls ?? []).join('\n')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <p className="block text-sm font-medium text-slate-700">Stats (manual entry)</p>
          <div className="mt-2 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => {
              const entry = statEntries[i];
              return (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    name={`stat_${i}_key`}
                    defaultValue={entry ? String(entry[0]) : ''}
                    placeholder="e.g. 40-yard dash"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    name={`stat_${i}_value`}
                    defaultValue={entry ? String(entry[1]) : ''}
                    placeholder="e.g. 4.6s"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
        >
          Save
        </button>
      </form>

      <p className="text-xs text-slate-400">
        Contact on the public page always resolves to you, the guardian, at {user.email}. Your
        athlete never has their own login and is never listed with contact info beyond yours.
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  required,
  step,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
      />
    </div>
  );
}
