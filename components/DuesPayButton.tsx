'use client';

import { useState } from 'react';

export function DuesPayButton({ membershipId }: { membershipId: string }) {
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/dues-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        alert(json.error ?? 'Could not start checkout');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={pay}
      disabled={loading}
      className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
    >
      {loading ? 'Redirecting…' : 'Pay dues'}
    </button>
  );
}
