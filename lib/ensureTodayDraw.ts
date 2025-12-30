// lib/ensureTodayDraw.ts
import { ensureActiveDraw } from '@/lib/ensureActiveDraw';

// Backward-friendly helper
export async function ensureTodayDraw() {
  return ensureActiveDraw(new Date());
}
