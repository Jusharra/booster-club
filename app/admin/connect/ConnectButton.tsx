'use client';

import { useState } from 'react';

export function ConnectButton() {
  const [loading, setLoading] = useState(false);

  async function startOnboarding() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startOnboarding}
      disabled={loading}
      className="mt-4 rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
    >
      {loading ? 'Redirecting…' : 'Connect Stripe'}
    </button>
  );
}
