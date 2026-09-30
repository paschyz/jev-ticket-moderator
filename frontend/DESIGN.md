# Design Direction — TicketFlow

## Subject

AI-powered ticket moderation system for support operations teams. The interface helps agents triage incoming tickets with AI confidence scores and routing decisions. Audience: support ops leads evaluating the tool, then support agents using it daily.

## Palette

Warm paper canvas, ink-navy primary, semantic status colors. Tokens live in `src/index.css` (oklch).

| Token | Role |
|-------|------|
| `--background` | Warm off-white canvas |
| `--card` | Pure white — panels, selected row, header |
| `--primary` | Ink navy — primary action, selected marker |
| `--muted` / `--muted-foreground` | Hover wash / secondary text |
| `--border` | Warm hairline |
| `--destructive` | Needs review, high urgency, abusive |
| `--warning` | Awaiting route, medium urgency |
| `--success` | Routed, high confidence |
| `--ring` | Focus (indigo) |

## Typography

**Font:** Geist Variable (installed via shadcn Nova preset).
- Headings: Geist 600, tracking tight
- Body: Geist 400, 16px base
- Data labels: Geist 500, 13px
- Monospace data (IDs, scores, times, counts): system mono stack + tabular-nums

Line height: 1.5 body, 1.2 headings. Max line length: 72ch.

## Color semantics

Color marks what needs a person. Settled states stay quiet.

| Signal | Meaning |
|--------|---------|
| Red | Needs review, high/critical urgency |
| Amber | Analyzed, waiting for you to route |
| Hollow grey ring | Not analyzed yet |
| Solid grey dot | Routed queue (billing, technical, ...), no color per category |
| Ink dot + shield | Abusive, content hidden |
| Green | The Routed status only (badge, progress, confirmation) |

## Layout

- **Desktop:** top bar (brand, live queue counts, New ticket) over a 360px queue + detail split, full viewport height, each pane scrolls independently.
- **Mobile:** queue stacks above detail (max 45vh).
- Queue: flat rows with hairline dividers, sticky uppercase group headers, selected row = white card + ink left marker.
- Detail: progress steps (Received → Analyzed → Routed), message as the headline, always-visible Jev signal meters with threshold ticks, actions in bordered sections.
- Left-aligned throughout. Radius 0.5rem.

## Principles

1. **Functional first.** This is a work tool, not a marketing page. Every element earns its space.
2. **Trust through data.** Show confidence scores, categories, routing reasons. Hide nothing.
3. **Calm urgency.** Color codes urgency (red/amber/green) without alarm. Support agents see red all day — don't add to the noise.
4. **No decoration.** No gradients, no shadows deeper than `shadow-sm`, no hover animations on data cards. Motion only on user-triggered actions: buttons scale to 0.97 on press (150ms ease-out), meters ease their width (300ms).
