// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Axolotl Commander Authors

// Language choice. Loaded in <head> so a redirect happens before anything is drawn.
//
// - `?lang=en` or `?lang=cs` opens that language and remembers it.
// - A click on the language switcher remembers the chosen language.
// - The English page (the site root) goes to the remembered language, or on a first visit to
//   Czech when the browser prefers Czech or Slovak.
// - The Czech page never redirects by itself, so a shared link opens as it was sent.
//
// Without JavaScript or storage, both pages work as plain links.

(() => {
  'use strict';

  /** Page path of each language, relative to the site root (mirrors content/<lang>.json). */
  const PATHS = { en: '', cs: 'cs/' };
  const STORAGE_KEY = 'ac-lang';

  const page = document.documentElement.lang;
  const root = PATHS[page] ? '../' : '';

  const known = (lang) => (Object.hasOwn(PATHS, lang) ? lang : null);

  const remembered = () => {
    try {
      return known(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  };

  const remember = (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage blocked (private mode, disabled site data): the choice lasts for this page only.
    }
  };

  const preferredByBrowser = () => {
    const preferences = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
    for (const tag of preferences) {
      if (/^(cs|sk)\b/i.test(tag)) return 'cs';
      if (/^en\b/i.test(tag)) return 'en';
    }
    return null;
  };

  const open = (lang) => location.replace(root + PATHS[lang] || './');

  const asked = known(new URLSearchParams(location.search).get('lang'));
  if (asked) {
    remember(asked);
    if (asked !== page) open(asked);
  } else if (page === 'en') {
    const wanted = remembered() ?? preferredByBrowser();
    if (wanted && wanted !== page) open(wanted);
  }

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element && event.target.closest('a[data-lang]');
    if (link) remember(link.dataset.lang);
  });
})();
