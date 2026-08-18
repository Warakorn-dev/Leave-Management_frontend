'use client';

import { useState } from 'react';

export default function ApiHealthCheckPage() {
  const [result, setResult] = useState<string | null>(null);

  async function checkApi() {
    setResult('Checking API…');
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      const payload = await response.json();
      setResult(response.ok && payload.success ? 'API is running.' : 'API returned an unexpected response.');
    } catch {
      setResult('Unable to reach the API. Check the configured backend URL.');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">API health check</h1>
      <p className="text-zinc-600">This diagnostic uses the configured application API proxy.</p>
      <button className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-white" onClick={checkApi} type="button">
        Check API
      </button>
      {result && <p aria-live="polite">{result}</p>}
    </main>
  );
}
