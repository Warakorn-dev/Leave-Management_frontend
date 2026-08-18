'use client';

import { useEffect } from 'react';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep diagnostics in the browser console without exposing error details in the UI.
    console.error('Unhandled application error');
  }, []);

  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', textAlign: 'center' }}>
          <div>
            <h1>Something went wrong</h1>
            <p>Please try the request again.</p>
            <button type="button" onClick={reset}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
}
