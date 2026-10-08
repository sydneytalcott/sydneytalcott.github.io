# Zazen

This repository is a [Zazen](https://zazen.dev) site for [sydneytalcott.com](https://sydneytalcott.com).

## Site Model
- `zazen.json` is the source of truth for content structure, templates, navigation, and settings.
- Templates live in `registry/templates/` and render HTML with `{{tag}}` placeholders.
- Schemas define which fields a page can edit in Zazen.
- Content entries choose a schema and a template, then supply values for those fields.
- Generated pages (`index.html`, `work.html`, `work/index.html`) are committed at the repository root.

## Templates In This Site
- `landing`
- `work`

## Schemas In This Site
- `landing`: Home Page
- `work`: Work Page

## Canonical Site Tags
- `{{siteTitle}}`
- `{{siteUrl}}`
- `{{siteLatestCommitMessage}}`
- `{{siteGithubRepoLink}}`

## Custom Universal Tags
- `{{author}}`, `{{contactEmail}}`, `{{linkedinUrl}}`, `{{githubUrl}}`, `{{location}}`, `{{caseStudies}}`

## Feature Flags
- `caseStudies` (in `zazen.json` under `settings.universalTags`): `"off"` hides the case study links on the home page and the Case studies section on the work page; set it to `"on"` and regenerate the pages to show them. The flagged markup carries the `flag-case-studies` class and is hidden by `.case-studies-off` in `registry/styles/main.css`.
- `heroButtons` (same place): `"off"` hides the two hero buttons ("View work" and "Get in touch") on the home page; set it to `"on"` and regenerate the pages to show them. To preview without changing the setting, visit the home page with `?heroButtons=on` (handled in `registry/scripts/site.js`). The `.cta-container` carries `flag-hero-buttons`, hidden by `.hero-buttons-off`.
