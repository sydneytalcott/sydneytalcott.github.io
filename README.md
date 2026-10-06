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
- `{{author}}`, `{{contactEmail}}`, `{{linkedinUrl}}`, `{{githubUrl}}`, `{{location}}`
