// lib/ensureTodayDraw.ts
import { ensureActiveDraw } from '@/lib/ensureActiveDraw';

// Backwards-compatible wrapper.
// Old code imports ensureTodayDraw(), but the canonical logic lives in ensureActiveDraw().
export async function ensureTodayDraw() {
  return ensureActiveDraw(new Date());
}
