# Zazen Templates & Components Guide

This document defines how layouts, partial components, and visual editing placeholders are written for **Zazen sites**.

---

## 1. Template Structure Example

A typical layout file (e.g. `registry/templates/default.html`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{pageTitle}} | {{siteTitle}}</title>
  {{style:main.css}}
</head>
<body>
  {{component:header}}

  <main class="page-container">
    <article class="prose">
      <header class="page-header">
        <h1 class="page-title">{{title}}</h1>
        <p class="page-eyebrow">{{eyebrow || ''}}</p>
      </header>

      <div class="page-content">
        {{body}}
      </div>
    </article>
  </main>

  {{component:footer}}
  {{script:theme.js}}
</body>
</html>
```

---

## 2. Inclusions Reference

* **Components**: `{{component:header}}`, `{{component:footer}}`, `{{component:newsletter}}`
* **Styles**: `{{style:main.css}}` (automatically wrapped in `<style>` tags during compilation)
* **Scripts**: `{{script:theme.js}}` (automatically wrapped in `<script>` tags)
* **Navigation**: `{{navigation}}` (renders primary navigation links)

---

## 3. Conditionals & Fallbacks

* **Conditional (Ternary)**:
  `{{featured ? 'badge-featured' : 'badge-standard'}}`
* **Fallback**:
  `{{siteUrl || '/'}}`
  `{{readTime || '5'}} min read`

---

## 4. Visual Editing & Preview Hooks

When loaded inside **[Zazen.dev](https://zazen.dev)**:
1. Every placeholder (e.g. `{{title}}`, `{{body}}`) is rendered with interactive live-preview bindings.
2. Clicking a text container in preview opens the inline editor or schema field editor.
3. **Important Safety Rule**: Never place HTML markup or component tags inside HTML attributes.
   - Correct: `<img src="{{heroImage}}" alt="{{title}}">`
   - Incorrect: `<a href="{{component:link}}">`
