# GitHub Copilot Instructions

This file provides persistent context for GitHub Copilot and AI tools working on this codebase.

## Project Overview

**yaayes.dev** is a personal technical blog by Yassine Sedrani — a DevOps engineer. Built with Astro 5, TailwindCSS v4, MDX, and deployed on Cloudflare Pages. Topics include DevOps, infrastructure, security, CI/CD, Kubernetes, and tools that engineers actually use.

## Tech Stack

- **Framework**: Astro 5 + MDX
- **Styling**: TailwindCSS v4 (no config file; configured via CSS)
- **Search**: Pagefind (static, client-side)
- **Deployment**: Cloudflare Pages + Cloudflare Worker
- **Syntax highlighting**: Shiki (`github-light` / `github-dark`)

## Design Context

### Users

Broadly technical readers — developers, DevOps engineers, SREs, and students at any experience level. They come for practical, honest takes on real tools. Reading is as recreational as educational — tone matters as much as accuracy.

### Brand Personality

**Technical, casual, witty.** A knowledgeable colleague who knows their stuff but doesn't take themselves too seriously. Humor is a core ingredient, not decoration — e.g. titles like _"Stop Hardcoding Your Passwords, You Animal!"_ The interface should feel made by a specific person, not a SaaS template.

### Aesthetic Direction

- **Terminal-inspired** — The `➜ ~/yaayes.dev` CLI prompt logo with a blinking cursor is a deliberate motif. Lean into it tastefully.
- **Primary accent**: Yellow/amber — warm, energetic, distinctly non-corporate.
- **Typography**: Inter for prose; Fira Code / monospace for code and select UI fixtures.
- **Theme**: Light + dark mode, both first-class, system-preference-aware with manual override.
- **Inspiration**: Tailwind CSS blog (typography + whitespace confidence) with more personality. Approachable warmth without being corporate.
- **Anti-reference**: Generic Medium / Hashnode aesthetic — too clean, too corporate, too soulless.

### Design Principles

1. **Personality over polish** — Choices should feel made by a human with opinions, not a template.
2. **Terminal motif, not terminal cosplay** — CLI cues as subtle motifs; don't overdo the "hacker" aesthetic.
3. **Clarity is the feature** — Readable layouts, strong typographic hierarchy, excellent code blocks. Never sacrifice legibility for style.
4. **Earn the humor** — Wit lives in copy and micro-interactions; the layout stays functional and uncluttered.
5. **Accessible by default** — WCAG AA contrast, semantic HTML, `prefers-reduced-motion` respected, keyboard navigable.

### Design Tokens (from `src/styles/global.css`)

```
--color-primary:       rgb(220 151 53)  / rgb(250 204 21)   [light/dark]
--color-primary-hover: rgb(185 117 20)  / rgb(234 179 8)
--color-text:          rgb(30 41 59)    / rgb(226 232 240)
--color-bg:            rgb(252 252 250) / rgb(45 55 72)
--color-border:        rgb(226 232 240) / rgb(51 65 85)
```

Body font: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
Code font: `'Fira Code', 'Consolas', 'Monaco', monospace`

## Coding Conventions

- Use Astro components (`.astro`) for UI; MDX (`.mdx`) for content
- Styling via TailwindCSS utility classes; use CSS variables for theme-aware colors (e.g. `text-[rgb(var(--color-primary))]`)
- Dark mode via `.dark` class on `<html>` — Tailwind's `dark:` variant applies
- Keep components small and focused; avoid over-engineering
- No unnecessary abstractions — prefer clarity over DRY in component code
