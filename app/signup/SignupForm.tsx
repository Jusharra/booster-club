'use client';

import { useMemo, useState } from 'react';
import { signUpParent } from './actions';
import type { DuesTier, OrganizationPublic } from '@/lib/types/database';

export function SignupForm({
  organizations,
  duesTiers,
  defaultOrgId,
}: {
  organizations: OrganizationPublic[];
  duesTiers: DuesTier[];
  defaultOrgId?: string;
}) {
  const [orgId, setOrgId] = useState(defaultOrgId ?? organizations[0]?.id ?? '');
  const tiersForOrg = useMemo(
    () => duesTiers.filter((t) => t.organization_id === orgId),
    [duesTiers, orgId]
  );

  return (
    <form action={signUpParent} className="mt-6 space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
          Your full name
        </label>
        <input
          id="full_name"
          name="full_name"
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
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
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

      <div>
        <label htmlFor="organization_id" className="block text-sm font-medium text-slate-700">
          Your booster club
        </label>
        <select
          id="organization_id"
          name="organization_id"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        >
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} &mdash; {org.school_name}
            </option>
          ))}
        </select>
      </div>

      {tiersForOrg.length > 0 && (
        <div>
          <label htmlFor="dues_tier_id" className="block text-sm font-medium text-slate-700">
            Membership tier
          </label>
          <select
            id="dues_tier_id"
            name="dues_tier_id"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {tiersForOrg.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name} &mdash; ${(tier.price_cents / 100).toFixed(2)} / {tier.billing_interval}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
      >
        Create my account
      </button>
    </form>
  );
}
