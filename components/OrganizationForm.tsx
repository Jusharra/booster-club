'use client';

import { useState } from 'react';

type TierRow = { name: string; price: string; interval: 'monthly' | 'annual' | 'one_time' };

export function OrganizationForm({
  action,
  includeCredentials,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  includeCredentials: boolean;
  submitLabel: string;
}) {
  const [tiers, setTiers] = useState<TierRow[]>([
    { name: 'Individual', price: '50', interval: 'annual' },
    { name: 'Family', price: '85', interval: 'annual' },
  ]);

  function updateTier(i: number, patch: Partial<TierRow>) {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  return (
    <form action={action} className="mt-6 space-y-6">
      {includeCredentials && (
        <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-700">Your admin login</legend>
          <div>
            <label htmlFor="admin_contact_name" className="block text-sm font-medium text-slate-700">
              Your name
            </label>
            <input
              id="admin_contact_name"
              name="admin_contact_name"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
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
              minLength={8}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">Your booster club</legend>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Booster club name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Lincoln High Athletic Booster Club"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="school_name" className="block text-sm font-medium text-slate-700">
            School name
          </label>
          <input
            id="school_name"
            name="school_name"
            required
            placeholder="Lincoln High School"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="sports" className="block text-sm font-medium text-slate-700">
            Sports covered (comma separated)
          </label>
          <input
            id="sports"
            name="sports"
            placeholder="Football, Baseball, Track"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-slate-700">
              City
            </label>
            <input
              id="city"
              name="city"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-slate-700">
              State
            </label>
            <input
              id="state"
              name="state"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">Dues tiers</legend>
        {tiers.map((tier, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input
              name={`tier_${i}_name`}
              value={tier.name}
              onChange={(e) => updateTier(i, { name: e.target.value })}
              placeholder="Tier name"
              className="rounded-md border border-slate-300 px-3 py-2"
            />
            <input
              name={`tier_${i}_price`}
              value={tier.price}
              onChange={(e) => updateTier(i, { price: e.target.value })}
              type="number"
              step="0.01"
              min="0"
              placeholder="Price"
              className="rounded-md border border-slate-300 px-3 py-2"
            />
            <select
              name={`tier_${i}_interval`}
              value={tier.interval}
              onChange={(e) => updateTier(i, { interval: e.target.value as TierRow['interval'] })}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="annual">per year</option>
              <option value="monthly">per month</option>
              <option value="one_time">one time</option>
            </select>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTiers((prev) => [...prev, { name: '', price: '', interval: 'annual' }])}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          + Add another tier
        </button>
      </fieldset>

      <button
        type="submit"
        className="w-full rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
