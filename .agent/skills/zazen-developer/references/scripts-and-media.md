# Zazen Scripts & Media Guide

This document defines client-side JavaScript practices and media asset management for **Zazen sites**.

---

## 1. Client-Side JavaScript Guidelines

Scripts in `registry/scripts/` (such as `theme.js`) should follow strict safety rules:

1. **Defensive DOM Querying**: Always verify elements exist before attaching listeners:
   ```javascript
   document.addEventListener('DOMContentLoaded', () => {
     const toggleBtn = document.getElementById('theme-toggle');
     if (toggleBtn) {
       toggleBtn.addEventListener('click', () => {
         const current = document.documentElement.getAttribute('data-theme');
         const next = current === 'dark' ? 'light' : 'dark';
         document.documentElement.setAttribute('data-theme', next);
         localStorage.setItem('zazen-theme', next);
       });
     }
   });
   ```
2. **Never Break Editor Events**: Do not call `event.stopImmediatePropagation()` on document-level click handlers that could interfere with Zazen.dev visual editing tools.

---

## 2. Media Asset Management

1. All media assets should be placed in `media/` directory.
2. Register images in `zazen.json` under `"media"` with metadata:
   ```json
   "media": {
     "hero.jpg": {
       "title": "Hero Image",
       "alt": "Modern architecture facade",
       "caption": "Minimalist facade in Tokyo",
       "dimensions": { "width": 1920, "height": 1080 }
     }
   }
   ```
