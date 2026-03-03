# Claude Code — UI Design Explorer Command

## Setup

```bash
mkdir -p .claude/commands
cp design.md .claude/commands/design.md
```

## Usage

```
/design people management data table
/design notification settings panel
/design file upload component with progress
/design deployment status dashboard
```

## How It Works

```
  /design [feature]
         │
         ▼
  ┌──────────────────────────────────────┐
  │  PHASE 1: UX QUESTIONS               │
  │                                      │
  │  Claude asks 5-10 targeted questions │
  │  about UX behavior:                  │
  │                                      │
  │  - Scope (component vs full page)    │
  │  - Selection (none/single/multi)     │
  │  - Pagination (pages/scroll/load)    │
  │  - Filters (inline/sidebar/chips)    │
  │  - Actions (inline/hover/menu)       │
  │  - Theme, density, responsive etc.   │
  │                                      │
  │  User answers: "1a, 2c, 3a, 4b..."  │
  └──────────┬───────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────────┐
  │  PHASE 2: VISUAL DESIGN              │
  │                                      │
  │  3 mockups with SAME UX behavior     │
  │  but DIFFERENT visual styles:        │
  │                                      │
  │  A) Clean & spacious (light)         │
  │  B) Dense & professional (dark)      │
  │  C) Modern & polished (branded)      │
  │                                      │
  │  All 3 have identical:               │
  │  ✓ Pagination type                   │
  │  ✓ Selection behavior                │
  │  ✓ Filter approach                   │
  │  ✓ Action patterns                   │
  └──────────┬───────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────────┐
  │  Choose:                             │
  │                                      │
  │  ✅ Pick one → APPROVED              │
  │  🔀 Mix visuals from two options     │
  │  ✏️ Tweak colors/fonts/spacing       │
  │  🔄 3 more visual styles             │
  │  🔁 Change UX decisions              │
  │  🔁 Start over                       │
  └──────────────────────────────────────┘
```

## Key Difference from v1

**Before (v1):** Claude assumed UX behavior (pagination type, selection model, filter layout) and varied the *layout* across options — leading to unwanted designs like sidebar filters on a standalone component.

**Now (v2):** Claude asks UX questions first, then generates 3 options that all share the same UX behavior but differ only in *visual style* (colors, typography, spacing, theme). You control the UX; Claude explores the aesthetics.

## Visual Styles (Up to 9 across 3 rounds)

| Round | Option | Visual Style |
|-------|--------|-------------|
| 1 | A | Clean, light, spacious |
| 1 | B | Dense, professional, dark/neutral |
| 1 | C | Modern, polished, branded |
| 2 | D | Flat, monochrome, borderless |
| 2 | E | Glassmorphism, frosted, layered |
| 2 | F | Editorial, magazine-like typography |
| 3 | G | Retro, terminal, monospace |
| 3 | H | Soft, pastel, friendly |
| 3 | I | Brutalist, raw, high-contrast |

## Example Session

```
You:    /design people data table component

Claude: Before I design, a few questions:
        1. Scope: (a) Just the table (b) Full page with header
        2. Row selection: (a) None (b) Single-click (c) Multi-select
        3. Pagination: (a) Page numbers (b) Infinite scroll (c) Load more
        ...

You:    1a, 2c, 3a, 4a, 5b, 6a, 7a, 8a

Claude: [writes 3 HTML files to disk, opens in browser]
        🎨 Round 1 — People Table
        All options: multi-select, page numbers, search bar, hover actions
        🅰️ Option A — Airy Light: ...
        🅱️ Option B — Dark Pro: ...
        🅲 Option C — Branded Modern: ...

You:    Go with B but make it lighter

Claude: [writes refined.html, opens it]
        Here's the refined version. Approve or tweak more?
```

## Optional: Add to CLAUDE.md

```markdown
## UI Design Process

Before implementing any new UI feature:
1. Use `/design [feature]` — answer UX questions first
2. Review visual options in browser
3. Pick or refine until approved
4. Implement from `mockups/APPROVED.md`

Never assume UX behavior. Always ask first.
```

## Tips

- Answer with shorthand: `1a, 2c, 3a, 4b, 5b, 6a, 7c, 8a`
- Upload a reference screenshot — Claude will ask what to keep vs change
- Add `mockups/` to `.gitignore`
- Say "change UX decisions" anytime to revisit Phase 1
