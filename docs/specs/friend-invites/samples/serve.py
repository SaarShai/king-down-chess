"""Serve the static sample and its existing assets on port 4322 only."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[4]
SAMPLE = ROOT / 'docs/specs/friend-invites/samples'

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if any(part.startswith('.') or part == '..' for part in path.split('/') if part):
            self.send_error(404)
            return
        if path.startswith(('/fonts/', '/ui/')):
            target = ROOT / 'public' / path.lstrip('/')
        else:
            target = ROOT / path.lstrip('/')
        target = target.resolve()
        allowed = (
            target.is_relative_to(SAMPLE) and target.suffix in {'.html', '.css', '.mjs'}
            or target.is_relative_to(ROOT / 'src') and target.suffix == '.css'
            or target.is_relative_to(ROOT / 'src/plugin/assets') and target.suffix == '.webp'
            or target.is_relative_to(ROOT / 'public') and target.suffix in {'.webp', '.woff2', '.svg'}
        )
        if not allowed or not target.is_file():
            self.send_error(404)
            return
        self.target = target
        super().do_GET()

    def do_HEAD(self):
        self.send_error(405)

    def translate_path(self, path):
        return str(self.target)

if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 4322), Handler)
    print('Sample server: http://127.0.0.1:4322/docs/specs/friend-invites/samples/index.html', flush=True)
    server.serve_forever()
