JackpotPanel split plan

Source of truth:
- ../JackpotPanel.tsx

Goal:
- Gradually extract logic + UI into smaller files
- Zero behavior changes
- Zero visual changes

Rules:
- Never delete code before it renders correctly from index.tsx
- Always move, never rewrite
- One extraction at a time
