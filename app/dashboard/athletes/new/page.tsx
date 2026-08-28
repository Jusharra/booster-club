import { createClient } from '@/lib/supabase/server';
import { createAthleteProfile } from './actions';

export default async function NewAthletePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = user
    ? await supabase
        .from('memberships')
        .select('organization_id, organizations(name, school_name)')
        .eq('account_id', user.id)
    : { data: [] };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">Add an athlete</h1>
      <p className="mt-1 text-sm text-slate-600">
        This creates a private draft. Nothing is public until you explicitly publish it.
      </p>

      {searchParams.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
      )}

      <form action={createAthleteProfile} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Booster club / school</label>
          <select
            name="organization_id"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {(memberships ?? []).map((m: any) => (
              <option key={m.organization_id} value={m.organization_id}>
                {m.organizations?.name} — {m.organizations?.school_name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">First name</label>
            <input name="first_name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Last name</label>
            <input name="last_name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Primary sport</label>
          <input name="sport" required placeholder="Baseball" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Graduation year</label>
          <input
            name="grad_year"
            type="number"
            required
            min={2024}
            max={2035}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
        >
          Create draft profile
        </button>
      </form>
    </div>
  );
}
