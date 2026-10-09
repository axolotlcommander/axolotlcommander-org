# axolotlcommander.org — instructions for AI assistants

The website of [Axolotl Commander](https://github.com/axolotlcommander/axolotl-commander). See
[README.md](README.md) for the layout, build and deployment.

## Language (binding)

- **Everything committed to git is in English**: code, comments, README, workflows, commit
  messages, pull requests. The only exception are the texts of a non-English page
  (`content/cs.json` and future `content/<lang>.json`).
- Talk to each contributor in their own language; translate their input into English before it
  goes into git.

## Rules

- Plain HTML, CSS and vanilla JavaScript; no framework, no npm dependencies, no build tools other
  than Node for `build.mjs`.
- No third-party requests (fonts, scripts, analytics) and no cookies.
- A text change goes into every `content/<lang>.json`; `node build.mjs --offline` must pass.
- Every new source file starts with `SPDX-License-Identifier: GPL-3.0-or-later` and
  `Copyright (C) 2026 The Axolotl Commander Authors`.
- Commit messages: `[Area] short description` (at most 72 characters), details after a blank line.
- `main` is protected: changes go through a pull request with the Build check.
