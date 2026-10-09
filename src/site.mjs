// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Axolotl Commander Authors

// Facts shared by every page.

export const SITE = {
  name: 'Axolotl Commander',
  url: 'https://axolotlcommander.org/',
  email: 'milan@axolotlcommander.org',
  coffee: 'https://buymeacoffee.com/acidekcz',
  year: 2026,
};

export const REPO = 'https://github.com/axolotlcommander/axolotl-commander';

/** The GitHub API path of the app's latest release (404 until the first one is published). */
export const LATEST_RELEASE_API = 'https://api.github.com/repos/axolotlcommander/axolotl-commander/releases/latest';

/** Languages in the order of the switcher; the first one lives at the site root. */
export const LANGUAGES = ['en', 'cs'];

/** Hero shortcut table; the labels are `keys` in content/<lang>.json, in the same order. */
export const KEYS = ['Tab', 'F3', '⌘Y', 'F5', 'F6', 'F7', 'F8', '⌘K'];

/** Shortcuts shown next to each item of `features` in content/<lang>.json. */
export const FEATURE_KEYS = [['Tab'], ['F5', 'F8'], ['F3', '⌃F10'], [], ['⌘K'], ['⌘Y']];
