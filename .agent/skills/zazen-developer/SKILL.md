---
name: zazen-developer
description: Expert developer instructions for updating schemas, templates, components, styling, themes, scripts, media, and manifest in a Zazen site.
---

# Zazen Developer Skill

This skill provides architectural guidelines and safety rules for AI developer agents modifying an existing **Zazen site** (visually managed via **[Zazen.dev](https://zazen.dev)**).

---

## 1. System Architecture Overview

Zazen is a self-sovereign, static-site publishing system driven by a single central manifest (`zazen.json`) and an asset registry:

```text
site-root/
├── zazen.json                      # The single source of truth manifest
├── media/                          # Uploaded photos, documents, and media assets
├── registry/
│   ├── templates/                  # Page-level HTML layouts (default, article, stream, landing)
│   ├── components/                 # Reusable HTML partials (header, footer, cards)
│   ├── styles/                     # CSS stylesheets (main.css)
│   └── scripts/                    # Client JavaScript files (theme.js)
└── (rendered static site output)   # Generated HTML pages on export / deploy
```

---

## 2. Safe Modification Workflow (Never Break Things!)

Follow this checklist whenever modifying any part of a Zazen site:

1. **Check Manifest Registration**:
   - Any new template, component, style, or script must be registered in `zazen.json` under its respective map (`"templates"`, `"components"`, `"styles"`, `"scripts"`).
2. **Follow Strict Conditional & Fallback Syntax**:
   - **Ternary values must be quoted**: `{{isFeatured ? 'featured-card' : 'standard-card'}}`
   - **Fallbacks**: `{{siteUrl || '/'}}` or `{{ctaText || 'Read More'}}`
3. **Preserve Live Preview Hooks**:
   - In preview mode, Zazen.dev wraps text placeholders in editable containers (`.zazen-editable`, `data-field="..."`).
   - Do NOT place HTML tags inside tag attributes (e.g. use `<img src="{{heroImage}}" alt="{{title}}">`, which Zazen safely handles).
4. **Theme & CSS Changes**:
   - Use CSS custom properties (`--bg`, `--text`, `--line`, `--muted`, `--surface`, `--accent`).
   - Preserve `:root`, `@media (prefers-color-scheme: dark)`, `:root[data-theme="light"]`, and `:root[data-theme="dark"]`.
5. **Client Script Changes**:
   - Use defensive DOM element checking (`if (el) ...`) and `DOMContentLoaded` or IIFE wrappers.
   - Never call `event.stopImmediatePropagation()` on global clicks in ways that disable editor toolbar interactions.
6. **Media Assets**:
   - Save photos to `media/` (never legacy `assets/`).
   - Register entries in `zazen.json` under `"media"` with metadata (`title`, `alt`, `caption`, `tags`, `dimensions`, `size`).

---

## 3. Template Engine Syntax Reference

Zazen compiles templates using regex-based evaluation in `generateFinalHTML`.

### A. Template Placeholders
| Placeholder | Purpose | Context / Fallback |
| :--- | :--- | :--- |
| `{{fieldName}}` | Injects page/post schema content | e.g. `{{title}}`, `{{body}}`, `{{heroImage}}` |
| `{{pageTitle}}` | Current page title | Active page metadata |
| `{{postTitle}}` | Current post title | Active post metadata |
| `{{streamTitle}}` | Parent stream title | Stream or post context |
| `{{publishedDate}}` | Formatted date string | e.g. `Sep 7, 2026` |
| `{{siteTitle}}` | Global site title | `settings.siteTitle` |
| `{{siteUrl}}` | Canonical site URL | `settings.siteUrl` (defaults to `/`) |
| `{{siteGithubRepoLink}}` | GitHub repo URL | `settings.siteGithubRepoLink` |
| `{{universalTag}}` | Custom global tags | Any key under `settings.universalTags` |

### B. Conditionals & Fallbacks
- **Conditional**: `{{key ? 'trueVal' : 'falseVal'}}` or `{{!key ? 'trueVal' : 'falseVal'}}`
- **Fallback**: `{{key || 'fallbackValue'}}`

### C. Inclusions (Components, Styles, Scripts, Navigation)
- **Component**: `{{component:header}}` or `{{component.header}}`
- **Style**: `{{style:main.css}}` or `{{style.main.css}}`
- **Script**: `{{script:theme.js}}` or `{{script.theme.js}}`
- **Navigation**: `{{navigation}}` (primary menu) or `{{navigation:footer}}` (named menu)

### D. Stream & Post Loops
- **`{{streamPosts}}`**: On stream pages (e.g. `/articles`), automatically expands into feed cards.
- **`{{nextPosts}}`**: On single post pages, renders next/related article cards.

---

## 4. Reference Documentation

For detailed specifications and examples, consult the reference guides:
- [Manifest & Schema Guide](references/manifest-schema-guide.md)
- [Templates & Components Guide](references/templates-and-components.md)
- [Styling & Themes Guide](references/styling-and-themes.md)
- [Scripts & Media Guide](references/scripts-and-media.md)
