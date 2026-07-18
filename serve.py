#!/usr/bin/env python3
# Static file server for local dev. Service worker and manifest.json need a real
# origin, file:// skips the offline cache and installability.
#
#   python serve.py            -> http://localhost:8080
#   python serve.py --port 9000
import argparse
import http.server
import os

ROOT = os.path.dirname(os.path.abspath(__file__))

MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return MIME_TYPES.get(ext, super().guess_type(path))

    def end_headers(self):
        # No caching, so the browser never tests stale files during development.
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description='Palatica dev server')
    parser.add_argument('-p', '--port', type=int, default=8080)
    args = parser.parse_args()

    server = http.server.ThreadingHTTPServer(('localhost', args.port), Handler)
    print(f'Palatica laeuft auf http://localhost:{args.port}/  (Strg+C zum Beenden)')
    print(f'Wurzel: {ROOT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
