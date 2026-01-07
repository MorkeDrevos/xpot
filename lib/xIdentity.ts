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

function isClerkProxyUrl(u: string) {
  const s = String(u || '').trim();
  if (!s) return false;
  return (
    s.includes('img.clerk.com/') ||
    s.includes('images.clerk.dev/oauth_x/') ||
    s.includes('clerk.dev/oauth_x/')
  );
}

// Upgrade common X/Twitter avatar URLs to higher-res when possible.
export function upgradeXAvatar(url: string) {
  try {
    const u = String(url || '').trim();
    if (!u) return u;

    // If it's a Clerk proxy, do NOT try to "resize" it here.
    // In practice it often remains a small thumbnail even with params.
    if (isClerkProxyUrl(u)) return u;

    // Upgrade X/Twitter patterns (_normal, _bigger, _mini)
    // Example: ..._normal.jpg -> ..._400x400.jpg
    return u
      .replace(/_normal(\.(jpg|jpeg|png|webp))/i, '_400x400$1')
      .replace(/_bigger(\.(jpg|jpeg|png|webp))/i, '_400x400$1')
      .replace(/_mini(\.(jpg|jpeg|png|webp))/i, '_400x400$1');
  } catch {
    return url;
  }
}

export function avatarUrlFor(handle: string, avatarUrl?: string | null) {
  const clean = normalizeHandle(handle).replace(/^@/, '');
  const bucket = Math.floor(Date.now() / (6 * 60 * 60 * 1000)); // 6h bucket cache buster

  // If the provided avatar is a Clerk proxy thumbnail, bypass it completely
  // and use a true high-res resolver based on handle.
  if (avatarUrl) {
    const raw = String(avatarUrl).trim();
    if (raw) {
      if (isClerkProxyUrl(raw)) {
        return `https://unavatar.io/twitter/${encodeURIComponent(clean)}?size=512&cache=${bucket}`;
      }
      return upgradeXAvatar(raw);
    }
  }

  // High-res fallback
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
