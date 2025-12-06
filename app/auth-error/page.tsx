'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div style={{ padding: 40 }}>
      <h1>Authentication Error</h1>

      <p><b>Code:</b> {error ?? 'unknown'}</p>

      <pre style={{
        marginTop: 20,
        padding: 12,
        background: '#111',
        color: '#0f0',
        borderRadius: 6
      }}>
        {JSON.stringify({ error }, null, 2)}
      </pre>

      <p style={{ marginTop: 20 }}>
        Return to <a href="/">home</a>
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading error info…</div>}>
      <ErrorContent />
    </Suspense>
  );
}
