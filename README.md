# axolotlcommander.org

The website of [Axolotl Commander](https://github.com/axolotlcommander/axolotl-commander), a
keyboard-driven two-panel file manager for macOS: a static landing page in English (`/`) and
Czech (`/cs/`), deployed to GitHub Pages by GitHub Actions.

Plain HTML, CSS and a few lines of vanilla JavaScript. No framework, no dependencies, no
tracking, no cookies, no third-party requests.

## Layout

| Path | What it is |
|---|---|
| `content/en.json`, `content/cs.json` | All texts of the page, one file per language (same keys) |
| `src/site.mjs` | Shared facts: domain, repository, e-mail, shortcuts shown on the page |
| `src/page.mjs` | HTML of the landing page and the 404 page |
| `build.mjs` | Builds `_site/` (pages, `sitemap.xml`, `robots.txt`, copy of `static/`) |
| `static/` | Copied as is: `styles.css`, `site.js` (language choice), icons, images, manifest |
| `assets-src/` | Source images (icon and screenshot from the app repository) |
| `tools/make-assets.sh` | Regenerates the images in `static/` from `assets-src/` (macOS) |
| `.github/workflows/pages.yml` | Build and deployment |

## Build and preview

Node 20 or later:

```sh
node build.mjs            # asks GitHub whether the app has a release yet
node build.mjs --offline  # without network: "Get it on GitHub" instead of "Download"
python3 -m http.server -d _site 8000   # http://localhost:8000
```

The build fails on a missing translation key or a broken local link.

## Language

The English page is the site root; the Czech page is `/cs/`. Both are complete static pages
with `hreflang` links, so search engines index each language on its own. `static/site.js`
chooses the language for people:

- `?lang=en` / `?lang=cs` opens that language and remembers it;
- a click on the EN / CS switcher remembers the choice;
- the English page opens the remembered language, or, on a first visit, Czech when the browser
  prefers Czech or Slovak;
- the Czech page never redirects by itself, so a shared link opens as it was sent.

A new language: add `content/<lang>.json` with the same keys, add it to `LANGUAGES` in
`src/site.mjs` and to `PATHS` in `static/site.js`, then generate its social image
(`tools/make-assets.sh`).

## Download button

Until the app has its first release, the main button says "Get it on GitHub" and opens the
repository. `build.mjs` asks the GitHub API for the latest release; once there is one, the
button says "Download", opens the latest release and the page shows the version. The workflow
runs every day, so the button changes by itself within a day of a release (or run the workflow
by hand). GitHub turns scheduled workflows off after 60 days without a commit; Actions shows a
button to turn it back on.

## Images

`tools/make-assets.sh` needs macOS with `sips` and `swift`, plus `brew install webp libavif`.
It writes the favicons, the web app icons, the screenshot in AVIF, WebP and PNG (1240 and
2480 px), and a 1200 × 630 social preview per language (`tools/images.swift`). The results are
committed, so the deployment needs nothing but Node.

To update the screenshot, copy `docs/images/screenshot.png` of the app repository to
`assets-src/screenshot.png` and run the script.

## Deployment

Every push to `main` builds the site and deploys it to GitHub Pages (Settings → Pages → Source:
GitHub Actions); pull requests only build. The custom domain `axolotlcommander.org` is set in the
Pages settings and verified for the organization; its DNS points to GitHub Pages.

## License

GPL-3.0-or-later, the same as the app ([LICENSE](LICENSE)). The icon and the screenshot are
from the Axolotl Commander repository.
