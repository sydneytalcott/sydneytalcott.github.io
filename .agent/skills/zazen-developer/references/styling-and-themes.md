# Zazen Styling & Themes Guide

This document defines the CSS design system, CSS custom properties, and theme switching standards for **Zazen sites**.

---

## 1. CSS Custom Properties (Design Tokens)

All stylesheets in `registry/styles/main.css` should use structured CSS variables:

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-serif: 'Newsreader', Georgia, serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Light Theme Palette */
  --bg: #ffffff;
  --surface: #f8fafc;
  --surface-hover: #f1f5f9;
  --text: #0f172a;
  --muted: #64748b;
  --line: #e2e8f0;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* Dark Theme Overrides */
:root[data-theme="dark"] {
  --bg: #090d16;
  --surface: #111827;
  --surface-hover: #1f2937;
  --text: #f8fafc;
  --muted: #94a3b8;
  --line: #1e293b;
  --accent: #3b82f6;
  --accent-hover: #60a5fa;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #090d16;
    --surface: #111827;
    --surface-hover: #1f2937;
    --text: #f8fafc;
    --muted: #94a3b8;
    --line: #1e293b;
    --accent: #3b82f6;
    --accent-hover: #60a5fa;
  }
}
```

---

## 2. Visual Hierarchy & Micro-Interactions

* Use clean typography scales (`1.25` or `1.333` ratio).
* Use responsive container widths (`max-width: 1120px` for wide pages, `680px` for articles/reading).
* Add smooth transitions on interactive elements (`transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;`).
