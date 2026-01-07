// lib/xIdentity.ts

export function normalizeHandle(h: any) {
  const s = String(h ?? '').trim();
  if (!s) return '';
  const core = s.replace(/^@+/, '').trim();
  return core ? `@${core}` : '';
}

export function handleCore(h: any) {
  return normalizeHandle(h).replace(/^@/, '').trim().toLowerCase();
}

// If name is empty OR same as handle (with/without @, case-insensitive), hide name.
export function displayName(name: any, handle: any) {
  const raw = String(name ?? '').trim();
  if (!raw) return null;

  const nCore = raw.replace(/^@+/, '').trim().toLowerCase();
  const hCore = handleCore(handle);

  if (!nCore) return null;
  if (hCore && nCore === hCore) return null;
  return raw;
}

// Upgrade common X/Twitter avatar URLs to higher-res when possible.
// Also upgrade Clerk proxy avatars to request larger variants.
export function upgradeXAvatar(url: string) {
  try {
    const u = String(url || '').trim();
    if (!u) return u;

    // 1) Upgrade X/Twitter patterns (_normal, _bigger, _mini)
    const tw = u
      .replace(/_normal(\.(jpg|jpeg|png|webp))/i, '_400x400$1')
      .replace(/_bigger(\.(jpg|jpeg|png|webp))/i, '_400x400$1')
      .replace(/_mini(\.(jpg|jpeg|png|webp))/i, '_400x400$1');

    // 2) Clerk image proxy URLs
    // - img.clerk.com (proxy)
    // - images.clerk.dev (source)
    if (tw.includes('img.clerk.com') || tw.includes('images.clerk.dev')) {
      const parts = new URL(tw);

      // request a larger image (safe to set multiple common param names)
      const size = '256';
      parts.searchParams.set('img_width', size);
      parts.searchParams.set('img_height', size);

      // sometimes supported by CDNs / proxies
      parts.searchParams.set('width', size);
      parts.searchParams.set('height', size);
      parts.searchParams.set('w', size);
      parts.searchParams.set('h', size);

      // if supported, nicer output
      parts.searchParams.set('img_format', 'webp');

      return parts.toString();
    }

    return tw;
  } catch {
    return url;
  }
}

export function avatarUrlFor(handle: string, avatarUrl?: string | null) {
  const clean = normalizeHandle(handle).replace(/^@/, '');
  const bucket = Math.floor(Date.now() / (6 * 60 * 60 * 1000)); // 6h bucket

  if (avatarUrl) {
    return upgradeXAvatar(String(avatarUrl));
  }

  // Force high-res fallback
  return `https://unavatar.io/twitter/${encodeURIComponent(clean)}?size=512&cache=${bucket}`;
}

export function initialsFor(handle: string) {
  const clean = normalizeHandle(handle).replace(/^@/, '').trim();
  return (clean || 'x').slice(0, 1).toUpperCase();
}

export function isSameHandle(a?: string | null, b?: string | null) {
  const aa = normalizeHandle(a).toLowerCase();
  const bb = normalizeHandle(b).toLowerCase();
  if (!aa || !bb) return false;
  return aa === bb;
}
