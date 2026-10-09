#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Axolotl Commander Authors

// Builds the static site into _site/: one page per language, the 404 page, sitemap.xml,
// robots.txt and a copy of static/. No dependencies; Node 20 or later.
//
//   node build.mjs              asks GitHub whether the app has a release (Download button)
//   node build.mjs --offline    skips the question and builds the "Get it on GitHub" button
//
// GITHUB_TOKEN, when set, is sent with the question (the CI sets it) to avoid rate limits.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import { landingPage, notFoundPage } from './src/page.mjs';
import { FEATURE_KEYS, KEYS, LANGUAGES, LATEST_RELEASE_API, SITE } from './src/site.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, '_site');
const offline = process.argv.includes('--offline');

/** Files referenced with a content hash in the query, so a new version is never served stale. */
const FINGERPRINTED = ['styles.css', 'site.js'];

function loadContent() {
  const langs = LANGUAGES.map((lang) => JSON.parse(readFileSync(join(ROOT, 'content', `${lang}.json`), 'utf8')));
  const reference = Object.keys(langs[0]).sort().join();
  for (const t of langs) {
    const fail = (message) => { throw new Error(`content/${t.lang}.json: ${message}`); };
    if (Object.keys(t).sort().join() !== reference) fail(`keys differ from content/${langs[0].lang}.json`);
    if (t.keys.length !== KEYS.length) fail(`"keys" needs ${KEYS.length} labels`);
    if (t.features.length !== FEATURE_KEYS.length) fail(`"features" needs ${FEATURE_KEYS.length} items`);
  }
  return langs;
}

/** The app's latest release, or null before the first one. */
async function latestRelease() {
  if (offline) return null;
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'axolotlcommander.org build' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(LATEST_RELEASE_API, { headers });
  if (response.status === 404) return null;
  // Any other failure stops the build, so a deployed Download button never turns back by accident.
  if (!response.ok) throw new Error(`GitHub API: ${response.status} ${response.statusText} (use --offline to skip)`);
  const release = await response.json();
  return { version: release.tag_name.replace(/^v/, ''), url: release.html_url };
}

function fingerprint() {
  const assets = {};
  for (const file of FINGERPRINTED) {
    const hash = createHash('sha256').update(readFileSync(join(ROOT, 'static', file))).digest('hex').slice(0, 10);
    assets[file] = `${file}?v=${hash}`;
  }
  return assets;
}

function sitemap(langs, date) {
  const links = langs.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.lang}" href="${SITE.url}${l.path}"/>`).join('\n');
  const urls = langs.map((t) => `  <url>
    <loc>${SITE.url}${t.path}</loc>
    <lastmod>${date}</lastmod>
${links}
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE.url}"/>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

const robots = () => `User-agent: *
Allow: /

Sitemap: ${SITE.url}sitemap.xml
`;

/** Date of the last commit (YYYY-MM-DD), so a rebuild without changes keeps the sitemap's lastmod. */
function lastChange() {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function write(path, text) {
  mkdirSync(dirname(join(OUT, path)), { recursive: true });
  writeFileSync(join(OUT, path), text);
}

/** Fails when a page links to a local file that is not in _site/. */
function checkLocalLinks(pages) {
  const missing = [];
  for (const page of pages) {
    const html = readFileSync(join(OUT, page), 'utf8');
    const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    for (const m of html.matchAll(/\ssrcset="([^"]+)"/g)) {
      refs.push(...m[1].split(',').map((part) => part.trim().split(/\s+/)[0]));
    }
    for (const ref of refs) {
      if (/^(?:[a-z]+:|#)/i.test(ref)) continue;
      const clean = ref.split(/[?#]/)[0];
      const target = clean.startsWith('/') ? clean.slice(1) : posix.join(posix.dirname(page), clean);
      const file = join(OUT, target);
      const exists = existsSync(file) && (!statSync(file).isDirectory() || existsSync(join(file, 'index.html')));
      if (!exists) missing.push(`${page}: ${ref}`);
    }
  }
  if (missing.length) throw new Error(`Broken local links:\n  ${missing.join('\n  ')}`);
}

async function build() {
  const langs = loadContent();
  const release = await latestRelease();
  const assets = fingerprint();

  rmSync(OUT, { recursive: true, force: true });
  cpSync(join(ROOT, 'static'), OUT, { recursive: true });

  const pages = [];
  for (const t of langs) {
    const root = t.path ? '../'.repeat(t.path.split('/').filter(Boolean).length) : '';
    const page = `${t.path}index.html`;
    write(page, landingPage(t, { root, langs, assets, release }));
    pages.push(page);
  }
  write('404.html', notFoundPage(langs, { assets }));
  pages.push('404.html');
  write('sitemap.xml', sitemap(langs, lastChange() || new Date().toISOString().slice(0, 10)));
  write('robots.txt', robots());

  checkLocalLinks(pages);
  const files = readdirSync(OUT, { recursive: true }).filter((f) => statSync(join(OUT, f)).isFile());
  console.log(`_site/: ${files.length} files; ${release ? `release ${release.version}` : 'no release yet'}`);
}

build().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
