'use client';

import { useState } from 'react';

export function SubscribeButton({ athleteProfileId }: { athleteProfileId: string }) {
  const [interval, setInterval_] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteProfileId, billingInterval: interval }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else alert(json.error ?? 'Could not start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={interval}
        onChange={(e) => setInterval_(e.target.value as 'monthly' | 'annual')}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      >
        <option value="monthly">Monthly</option>
        <option value="annual">Annual</option>
      </select>
      <button
        onClick={subscribe}
        disabled={loading}
        className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? 'Redirecting…' : 'Subscribe'}
      </button>
    </div>
  );
}
