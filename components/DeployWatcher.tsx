'use client';

import { useEffect } from 'react';

export default function DeployWatcher() {
  useEffect(() => {
    let currentBuild: string | null = null;

    async function checkBuild() {
      try {
        const res = await fetch('/api/build-info', { cache: 'no-store' });
        const json = await res.json();

        if (!currentBuild) {
          currentBuild = json.buildId;
        } else if (json.buildId !== currentBuild) {
          window.location.reload();
        }
      } catch {
        // silently fail
      }
    }

    checkBuild();
    const interval = setInterval(checkBuild, 30_000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
