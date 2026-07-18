
<div align="center">
  <a href="https://supabase.com/"><img alt="Supabase" src="https://img.shields.io/badge/Supabase-Optional%20Sync-3B82F6?style=flat-square" /></a>
  <a href="https://developer.mozilla.org/docs/Web/JavaScript"><img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-Vanilla-FFD54F?style=flat-square&logo=javascript&logoColor=black" /></a>
  <a href="https://en.wikipedia.org/wiki/Progressive_web_app"><img alt="PWA" src="https://img.shields.io/badge/PWA-Installable-4CAF50?style=flat-square" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-2F80ED?style=flat-square" /></a>
  <a href="fonts/OFL.txt"><img alt="Fonts" src="https://img.shields.io/badge/Fonts-SIL%20OFL-8E24AA?style=flat-square" /></a>
</div>


## Palatica
Vocabulary trainer for Serbian with spaced repetition. Bilingual UI (Cyrillic
with a German subline), offline-first PWA, no account required.

## Why this exists

A personal learning tool. I wanted something for Serbian vocab and kept
running into a handful of specific things Anki and similar tools didn't do
the way I wanted, so I built the tool instead of working around it.

It's also where I try out [Claude Code](https://claude.com/claude-code) —
exploring what it can and can't do, hands-on, rather than reading about it.
Most of the code here was written with it.

## Features

- Two collections: words and sentences/phrases
- Spaced repetition scheduling (`SCHEDULE = [1,3,7,14,30,60,120]`)
- Card mode and fill-in-the-blank mode
- Fully offline once loaded, installable as a PWA
- Optional cross-device sync — bring your own Supabase project, nobody
  shares an account or a quota
- JSON import/export, per collection or full backup

## Running locally

No build step, no Node. Needs a real HTTP origin (not `file://`) for the
service worker and manifest to work.

```
python serve.py            # http://localhost:8080
python serve.py --port 9000
```

## Tech

Vanilla JS, ES modules, no framework, no bundler. `index.html` loads a
single entry module (`js/app.js`) that pulls in the rest.

## Cloud sync

Off by default, everything stays in `localStorage`. If you want sync across
devices, create your own free Supabase project, run `supabase/schema.sql`
against it, and enter the project URL and anon key in the cloud panel (top
right). Your data lives in your own project, not mine.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

The bundled fonts under `fonts/` are licensed separately under the SIL Open
Font License — see [fonts/OFL.txt](fonts/OFL.txt).

