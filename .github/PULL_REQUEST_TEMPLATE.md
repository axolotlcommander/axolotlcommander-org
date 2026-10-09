<!-- Thanks! Discussion may be in Czech or English; everything committed is in English, except the Czech page texts in content/cs.json. -->

## What and why

<!-- Briefly: what the change does and why. Link the issue: "Closes #123". -->

## How I verified it

- [ ] `node build.mjs` passes (translation keys and local links are checked)
- [ ] Looked at the page locally (`python3 -m http.server -d _site 8000`), desktop and phone width
- [ ] Both languages: a changed text is changed in `content/en.json` and `content/cs.json`

## Checklist

- [ ] New source files have the SPDX header (`GPL-3.0-or-later`)
- [ ] No third-party requests (fonts, scripts, analytics) and no cookies
- [ ] Changed images were regenerated with `tools/make-assets.sh`
- [ ] Commit messages are in English, formatted `[Area] short description`
