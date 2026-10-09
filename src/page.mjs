// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Axolotl Commander Authors

// HTML of the landing page and the 404 page. Every text comes from content/<lang>.json and is
// escaped here; nothing in this file runs in the browser.

import { SITE, REPO, KEYS, FEATURE_KEYS } from './site.mjs';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes text for HTML content and attribute values. */
export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

const kbd = (key) => `<kbd>${esc(key)}</kbd>`;

/** Absolute URL of a page path ('' or 'cs/') on the production domain. */
const absolute = (path) => SITE.url + path;

function head(t, ctx) {
  const { root, langs, assets, release } = ctx;
  const og = `${SITE.url}assets/og-${t.lang}.png`;
  const alternates = langs
    .map((l) => `<link rel="alternate" hreflang="${l.lang}" href="${absolute(l.path)}">`)
    .join('\n  ');
  const otherLocales = langs
    .filter((l) => l.lang !== t.lang)
    .map((l) => `<meta property="og:locale:alternate" content="${l.locale}">`)
    .join('\n  ');
  const app = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
    description: t.description,
    url: absolute(t.path),
    image: og,
    screenshot: `${SITE.url}assets/screenshot-2480.png`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'macOS 15 or later',
    inLanguage: langs.map((l) => l.lang),
    isAccessibleForFree: true,
    license: 'https://www.gnu.org/licenses/gpl-3.0.html',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Organization', name: 'The Axolotl Commander Authors', url: SITE.url },
    sameAs: [REPO],
    ...(release && { softwareVersion: release.version, downloadUrl: release.url }),
  };
  // `<` is escaped so the JSON can never close the script element.
  const jsonLd = JSON.stringify(app).replace(/</g, '\\u003c');

  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>${esc(t.title)}</title>
  <meta name="description" content="${esc(t.description)}">
  <meta name="author" content="The Axolotl Commander Authors">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#0C2432">
  <link rel="canonical" href="${absolute(t.path)}">
  ${alternates}
  <link rel="alternate" hreflang="x-default" href="${absolute('')}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:title" content="${esc(t.title)}">
  <meta property="og:description" content="${esc(t.description)}">
  <meta property="og:url" content="${absolute(t.path)}">
  <meta property="og:locale" content="${t.locale}">
  ${otherLocales}
  <meta property="og:image" content="${og}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(t.ogImageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(t.title)}">
  <meta name="twitter:description" content="${esc(t.description)}">
  <meta name="twitter:image" content="${og}">
  <meta name="twitter:image:alt" content="${esc(t.ogImageAlt)}">

  <link rel="icon" href="${root}favicon.ico" sizes="32x32">
  <link rel="icon" href="${root}assets/icon-192.png" type="image/png">
  <link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
  <link rel="manifest" href="${root}site.webmanifest">
  <link rel="stylesheet" href="${root}${assets['styles.css']}">
  <script src="${root}${assets['site.js']}"></script>
  <script type="application/ld+json">${jsonLd}</script>
</head>`;
}

function header(t, ctx) {
  const { root, langs } = ctx;
  const switcher = langs
    .map((l) => {
      const current = l.lang === t.lang ? ' aria-current="page"' : '';
      return `<a href="${(root + l.path) || './'}" hreflang="${l.lang}" lang="${l.lang}" data-lang="${l.lang}" title="${esc(l.langName)}"${current}>${l.lang.toUpperCase()}</a>`;
    })
    .join('');
  return `<header class="topbar">
      <a class="brand" href="${(root + t.path) || './'}">
        <img src="${root}assets/icon-64.png" alt="" width="30" height="30">
        <span>${SITE.name}</span>
      </a>
      <div class="topbar-links">
        <a class="plain" href="${REPO}">GitHub</a>
        <nav class="lang-switch" aria-label="${esc(t.langLabel)}">${switcher}</nav>
      </div>
    </header>`;
}

function hero(t, ctx) {
  const { root, release } = ctx;
  const primary = release
    ? { href: `${REPO}/releases/latest`, label: t.download }
    : { href: REPO, label: t.getGh };
  const version = release ? ` · ${esc(t.version.replace('{version}', release.version))}` : '';
  const rows = KEYS.map(
    (key, i) => `<tr${key === 'F3' ? ' class="current"' : ''}><td>${kbd(key)}</td><td>${esc(t.keys[i])}</td></tr>`,
  ).join('\n              ');
  return `<section class="split hero" aria-labelledby="title">
      <div class="pane left">
        <div class="inner">
          <img class="hero-icon" src="${root}assets/icon-256.png" alt="" width="104" height="104">
          <h1 id="title">${SITE.name}</h1>
          <p class="claim">${esc(t.claim)}</p>
          <p class="sub">${esc(t.sub)}</p>
          <div class="actions">
            <a class="button primary" href="${primary.href}">${esc(primary.label)}</a>
            <a class="button secondary" href="${REPO}">${esc(t.viewGh)}</a>
          </div>
          <p class="note">${esc(t.note)}${version}</p>
        </div>
      </div>
      <div class="pane right">
        <div class="inner">
          <table class="keys">
            <caption class="visually-hidden">${esc(t.keysCaption)}</caption>
            <thead><tr><th scope="col">${esc(t.keyCol)}</th><th scope="col">${esc(t.cmdCol)}</th></tr></thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    </section>`;
}

function screenshot(t, ctx) {
  const { root } = ctx;
  const set = (ext) => `${root}assets/screenshot-1240.${ext} 1240w, ${root}assets/screenshot-2480.${ext} 2480w`;
  const sizes = '(min-width: 1336px) 1240px, calc(100vw - 2 * clamp(8px, 3vw, 48px))';
  return `<section class="shot">
      <picture>
        <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
        <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
        <img src="${root}assets/screenshot-1240.png" srcset="${set('png')}" sizes="${sizes}" alt="${esc(t.shotAlt)}" width="2864" height="1424" decoding="async">
      </picture>
    </section>`;
}

/** A two-pane section: the heading on the lighter left pane, the body on the darker right one. */
function section(id, heading, body, { sticky = false, lead = '' } = {}) {
  return `<section class="split" id="${id}" aria-labelledby="${id}-h">
      <div class="pane left">
        <div class="inner${sticky ? ' sticky' : ''}">
          <h2 id="${id}-h">${esc(heading)}</h2>${lead}
        </div>
      </div>
      <div class="pane right">
        <div class="inner">
          ${body}
        </div>
      </div>
    </section>`;
}

function features(t) {
  const items = t.features
    .map(([title, text], i) => {
      const keys = FEATURE_KEYS[i].map(kbd).join('');
      return `<li>
            <div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>
            ${keys ? `<div class="feature-keys">${keys}</div>` : ''}
          </li>`;
    })
    .join('\n          ');
  return section('features', t.featuresH, `<ul class="rows features">\n          ${items}\n          </ul>`, { sticky: true });
}

function why(t) {
  return section('why', t.whyH, `<blockquote class="why">
            <p>${esc(t.why)}</p>
            <footer>${esc(t.whySig)}</footer>
          </blockquote>`);
}

function ai(t) {
  const steps = t.steps
    .map(([title, text], i) => `<li><span class="step-n">0${i + 1}</span><div><strong>${esc(title)}</strong><p>${esc(text)}</p></div></li>`)
    .join('\n            ');
  const body = `<p class="body">${esc(t.aiBody)}</p>
          <ol class="rows steps">
            ${steps}
          </ol>
          <aside class="warn" aria-labelledby="warn-label">
            <p class="warn-label" id="warn-label">${esc(t.warnLabel)}</p>
            <p>${esc(t.warn)}</p>
          </aside>
          <p class="links">
            <a href="https://github.com/github/spec-kit">Spec Kit</a>
            <a href="https://claude.com/claude-code">Claude Code</a>
            <a href="${REPO}/tree/main/specs">${esc(t.specsLink)}</a>
          </p>`;
  return section('ai', t.aiH, body, { sticky: true, lead: `\n          <p class="lead">${esc(t.aiLead)}</p>` });
}

function inspiration(t) {
  return section('inspiration', t.inspH, `<p class="body bright">${esc(t.insp1)}<a href="https://github.com/tandemcommander/tandemcommander">${esc(t.tc)}</a>${esc(t.insp2)}<a href="https://github.com/OpenSalamander/salamander">${esc(t.os)}</a>${esc(t.insp3)}</p>
          <p class="small">${esc(t.inspDisclaimer)}</p>`);
}

function footer(t, ctx) {
  const { root } = ctx;
  return `<footer class="split site-footer">
    <div class="pane left">
      <div class="inner">
        <p class="brand"><img src="${root}assets/icon-64.png" alt="" width="26" height="26"><span>${SITE.name}</span></p>
        <p>© ${SITE.year} The Axolotl Commander Authors</p>
        <p><a href="${REPO}/blob/main/LICENSE">${esc(t.license)}</a></p>
      </div>
    </div>
    <div class="pane right">
      <nav class="inner footer-links" aria-label="${esc(t.footerNav)}">
        <a href="${REPO}">GitHub</a>
        <a href="${REPO}/issues">${esc(t.bug)}</a>
        <a href="mailto:${SITE.email}">${SITE.email}</a>
        <a href="${SITE.coffee}">${esc(t.coffee)}</a>
      </nav>
    </div>
  </footer>`;
}

/** The landing page in one language. */
export function landingPage(t, ctx) {
  return `<!doctype html>
<html lang="${t.lang}">
${head(t, ctx)}
<body>
  <div class="page">
    ${header(t, ctx)}
    <main>
    ${hero(t, ctx)}
    ${screenshot(t, ctx)}
    ${features(t)}
    ${why(t)}
    ${ai(t)}
    ${inspiration(t)}
    </main>
  ${footer(t, ctx)}
  </div>
</body>
</html>
`;
}

/**
 * The 404 page in both languages. GitHub Pages serves it for a missing path at any depth, so
 * its links are absolute from the site root.
 */
export function notFoundPage(langs, ctx) {
  const { assets } = ctx;
  const blocks = langs
    .map((t) => `<div lang="${t.lang}">
        <h1>${esc(t.notFoundTitle)}</h1>
        <p>${esc(t.notFoundText)} <a href="/${t.path}">${esc(t.notFoundHome)}</a></p>
      </div>`)
    .join('\n      ');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self'; style-src 'self'; script-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'">
  <meta name="robots" content="noindex">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#0C2432">
  <title>404 · ${SITE.name}</title>
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="stylesheet" href="/${assets['styles.css']}">
</head>
<body>
  <main class="not-found">
    <img src="/assets/icon-256.png" alt="" width="104" height="104">
    ${blocks}
  </main>
</body>
</html>
`;
}
