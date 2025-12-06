'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const params = useSearchParams();
  const error = params.get('error');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#0a0a0a',
      color: 'white',
      fontSize: 18
    }}>
      <h1>Auth Error</h1>
      <pre style={{
        marginTop: 20,
        padding: 16,
        background: '#111',
        border: '1px solid #333'
      }}>
        {error}
      </pre>
    </div>
  );
}
