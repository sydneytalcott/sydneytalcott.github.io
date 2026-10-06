# Zazen Manifest & Schema Guide

This document defines the complete specification of the `zazen.json` manifest used by **Zazen Site Engine** and **[Zazen.dev](https://zazen.dev)**.

---

## 1. Manifest Structure Overview

```json
{
  "schemas": {},
  "templates": {},
  "components": {},
  "styles": {},
  "scripts": {},
  "media": {},
  "pages": {},
  "streams": {},
  "navigation": {},
  "settings": {}
}
```

---

## 2. Schemas (`"schemas"`)

Schemas define content fields, input widgets, and types for pages and stream posts.

```json
"schemas": {
  "landing": {
    "name": "Landing Page",
    "fields": [
      { "name": "title", "label": "Page Title", "type": "text", "required": true },
      { "name": "heroEyebrow", "label": "Eyebrow Badge", "type": "text" },
      { "name": "heroHeadline", "label": "Hero Headline", "type": "text", "required": true },
      { "name": "heroSubheadline", "label": "Subheadline", "type": "textarea" },
      { "name": "heroImage", "label": "Hero Visual", "type": "image", "folder": "media" },
      { "name": "ctaText", "label": "CTA Button Text", "type": "text" },
      { "name": "ctaLink", "label": "CTA Link URL", "type": "text" },
      { "name": "body", "label": "Main Content", "type": "textarea" }
    ]
  },
  "article": {
    "name": "Article",
    "fields": [
      { "name": "title", "label": "Title", "type": "text", "required": true },
      { "name": "publishedDate", "label": "Date", "type": "text" },
      { "name": "heroImage", "label": "Featured Image", "type": "image", "folder": "media" },
      { "name": "excerpt", "label": "Summary / Excerpt", "type": "textarea" },
      { "name": "body", "label": "Article Body", "type": "textarea", "required": true },
      { "name": "tags", "label": "Tags", "type": "text" }
    ]
  }
}
```

### Supported Field Types

| Type | Description | Properties |
| :--- | :--- | :--- |
| `text` | Single-line text input | `name`, `label`, `required`, `placeholder` |
| `textarea` | Rich text or multiline copy | `name`, `label`, `required` |
| `image` | Image asset picker / uploader | `name`, `label`, `folder` (default `"media"`) |
| `color` | Color picker | `name`, `label`, `default` |
| `number` | Numeric value | `name`, `label`, `min`, `max`, `step` |
| `select` | Dropdown selection | `name`, `label`, `options: [...]` |
| `blocks` | Dynamic block array | `name`, `label` |

---

## 3. Templates, Components, Styles & Scripts

Registry mappings point to static files inside `registry/`:

```json
"templates": {
  "landing": { "file": "registry/templates/landing.html", "schema": "landing" },
  "default": { "file": "registry/templates/default.html", "schema": "default" },
  "article": { "file": "registry/templates/article.html", "schema": "article" },
  "stream": { "file": "registry/templates/stream.html", "schema": "default" },
  "feature-grid": { "file": "registry/templates/feature-grid.html", "schema": "landing" }
},
"components": {
  "header": "registry/components/header.html",
  "footer": "registry/components/footer.html"
},
"styles": {
  "main.css": "registry/styles/main.css"
},
"scripts": {
  "theme.js": "registry/scripts/theme.js"
}
```

---

## 4. Pages & Streams

* **`pages`**: Defines root and sub-pages.
* **`streams`**: Defines collections of items (like blogs, projects, or case studies).

```json
"pages": {
  "home": {
    "title": "Home",
    "slug": "index",
    "template": "landing",
    "content": {
      "title": "Home",
      "heroHeadline": "Crafted with Intention.",
      "heroSubheadline": "A self-sovereign web presence powered by Zazen.",
      "body": "<p>Welcome to our new digital garden.</p>"
    }
  },
  "about": {
    "title": "About",
    "slug": "about",
    "template": "default",
    "content": {
      "title": "About Us",
      "body": "<p>Our mission and philosophy.</p>"
    }
  }
},
"streams": {
  "articles": {
    "title": "Articles",
    "slug": "articles",
    "template": "stream",
    "itemTemplate": "article",
    "posts": {
      "first-post": {
        "title": "First Post",
        "slug": "first-post",
        "content": {
          "title": "Welcome to Zazen",
          "publishedDate": "Sep 7, 2026",
          "body": "<p>This is the first article published on our new site.</p>"
        }
      }
    }
  }
}
```

---

## 5. Settings (`"settings"`)

Global site settings including site URL, repository links, navigation defaults, and deployment:

```json
"settings": {
  "siteTitle": "My Zazen Site",
  "siteUrl": "https://username.github.io/my-site",
  "siteGithubRepoLink": "https://github.com/username/my-site",
  "universalTags": {
    "author": "Elena Rostova",
    "contactEmail": "hello@example.com"
  },
  "deploy": {
    "target": "github-pages"
  }
}
```
