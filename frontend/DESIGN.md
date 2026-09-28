# Design Direction — TicketFlow

## Subject

AI-powered ticket moderation system for support operations teams. The interface helps agents triage incoming tickets with AI confidence scores and routing decisions. Audience: support ops leads evaluating the tool, then support agents using it daily.

## Palette

| Token | Hex | Role |
|-------|-----|------|
| `--primary` | `#1B2A4A` | Deep navy — authority, trust, professionalism |
| `--primary-foreground` | `#F8FAFC` | Light text on primary |
| `--accent` | `#2563EB` | Strong blue — interactive elements, links, focus |
| `--accent-muted` | `#DBEAFE` | Light blue wash — selected states, highlights |
| `--destructive` | `#DC2626` | Red — high urgency, abusive content flags |
| `--warning` | `#D97706` | Amber — medium urgency, review needed |
| `--success` | `#059669` | Emerald — routed, resolved, high confidence |
| `--background` | `#FFFFFF` | Clean white canvas |
| `--surface` | `#F8FAFC` | Slate-50 — cards, sidebar |
| `--border` | `#E2E8F0` | Slate-200 — subtle structure |
| `--foreground` | `#0F172A` | Slate-900 — body text |
| `--muted` | `#64748B` | Slate-500 — secondary text, timestamps |

## Typography

**Font:** Geist Variable (installed via shadcn Nova preset).
- Headings: Geist 600, tracking tight
- Body: Geist 400, 16px base
- Data labels: Geist 500, 13px
- Monospace data (IDs, scores): Geist Mono if available, else tabular-nums

Line height: 1.5 body, 1.2 headings. Max line length: 72ch.

## Layout

- **Desktop:** sidebar-left (ticket history, scrollable) + main content (wizard flow)
- **Mobile:** history stacks above wizard
- Left-aligned throughout. No centered hero blocks.
- Cards for ticket items. No numbered markers unless content is sequential.
- Confidence bars use semantic color (success/warning/destructive by threshold)
- Status badges: filled background with status color, white text

## Principles

1. **Functional first.** This is a work tool, not a marketing page. Every element earns its space.
2. **Trust through data.** Show confidence scores, categories, routing reasons. Hide nothing.
3. **Calm urgency.** Color codes urgency (red/amber/green) without alarm. Support agents see red all day — don't add to the noise.
4. **No decoration.** No gradients, no shadows deeper than `shadow-sm`, no hover animations on data cards. Motion only on user-triggered actions (submit, expand).
