// lib/ensureTodayDraw.ts
import { ensureActiveDraw } from '@/lib/ensureActiveDraw';

/**
 * Backward-compatible wrapper.
 * Old code imports ensureTodayDraw(), but the canonical logic now lives in ensureActiveDraw(date).
 */
export async function ensureTodayDraw() {
  return ensureActiveDraw(new Date());
}
