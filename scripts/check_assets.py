#!/usr/bin/env python3
# Checks that the precache list in sw.js matches the files in the repo,
# in both directions. Exit code 1 on any mismatch.
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SW = ROOT / 'sw.js'


def assets_from_sw():
    m = re.search(r'var ASSETS = \[(.*?)\];', SW.read_text(encoding='utf-8'), re.S)
    if not m:
        sys.exit('ASSETS array not found in sw.js')
    return re.findall(r"'([^']+)'", m.group(1))


def expected_files():
    files = {'index.html', 'manifest.json'}
    for pattern in ('css/**/*.css', 'js/**/*.js', 'icons/*.png', 'fonts/*.woff2'):
        files.update(p.relative_to(ROOT).as_posix() for p in ROOT.glob(pattern))
    return files


def main():
    assets = {a[2:] if a.startswith('./') else a for a in assets_from_sw()}
    assets.discard('')  # the './' entry, an alias for index.html
    expected = expected_files()

    missing = sorted(expected - assets)
    stale = sorted(a for a in assets if not (ROOT / a).is_file())

    if missing:
        print('Missing from ASSETS in sw.js:')
        for f in missing:
            print('  ' + f)
    if stale:
        print('Listed in ASSETS but not in the repo:')
        for f in stale:
            print('  ' + f)
    if missing or stale:
        sys.exit(1)
    print(f'ASSETS ok: {len(expected)} files precached.')


main()
