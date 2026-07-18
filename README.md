
<div align="center">
  <a href="https://supabase.com/"><img alt="Supabase" src="https://img.shields.io/badge/Supabase-Optional%20Sync-3B82F6?style=flat-square" /></a>
  <a href="https://developer.mozilla.org/docs/Web/JavaScript"><img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-Vanilla-FFD54F?style=flat-square&logo=javascript&logoColor=black" /></a>
  <a href="https://en.wikipedia.org/wiki/Progressive_web_app"><img alt="PWA" src="https://img.shields.io/badge/PWA-Installable-4CAF50?style=flat-square" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-2F80ED?style=flat-square" /></a>
  <a href="fonts/OFL.txt"><img alt="Fonts" src="https://img.shields.io/badge/Fonts-SIL%20OFL-8E24AA?style=flat-square" /></a>
</div>

## Palatica

A small Serbian vocabulary trainer built for spaced repetition, bilingual learning, and a calm offline-first workflow.

Use it directly in your browser: https://dtischler95.github.io/palatica/

No cloning, no setup, no local server needed. Just open the app and start learning.

## Why this exists

This started as a personal tool for Serbian vocabulary and phrases. I kept running into small friction points in other apps, so I built something that felt more natural to use.

It also works as a hands-on playground for [Claude Code](https://claude.com/claude-code), a place to explore what works well, what does not, and how a small app can grow step by step.

## Features

- Two collections: words and sentences/phrases
- Spaced repetition scheduling with intervals like $1, 3, 7, 14, 30, 60, 120$
- Card mode for spaced repetition practice
- Fully usable offline once loaded, and installable as a PWA
- Optional cross-device sync through your own Supabase project
- JSON import/export for backups or sharing

### Run locally

No build step, no Node.js toolchain, and no package install is required. The app needs a real HTTP origin rather than `file://` so the service worker and manifest work correctly.

```bash
python serve.py            # http://localhost:8080
python serve.py --port 9000
```

## Tech

Vanilla JavaScript, ES modules, no framework, no bundler. The entry page loads a single module from `js/app.js`, which pulls the rest of the app in as needed.

## Cloud sync

Cloud sync is off by default. Your data stays in `localStorage` until you enable it. If you want cross-device syncing, create your own free Supabase project, run `supabase/schema.sql` against it, and enter the project URL and anon key in the cloud panel.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

The bundled fonts under `fonts/` are licensed separately under the SIL Open
Font License — see [fonts/OFL.txt](fonts/OFL.txt).

