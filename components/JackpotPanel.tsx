// components/JackpotPanel.tsx
// IMPORTANT:
// This file exists only to avoid older imports shadowing the newer folder component.
// Next resolves `@/components/JackpotPanel` to THIS file if it exists,
// so we forward everything to the real implementation in /components/JackpotPanel/.

export { default } from './JackpotPanel/JackpotPanel';
export type { JackpotPanelProps } from './JackpotPanel/JackpotPanel';
