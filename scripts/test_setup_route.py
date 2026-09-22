#!/usr/bin/env python3
"""Dry-run test of /api/setup/apply against a mock Management API server.

Runs the compiled Next.js route handler under node with fetch redirected to a
local mock of api.supabase.com. Verifies: token validation, SQL apply (exact
file content), table verification, setup-code generation, idempotent re-run.
"""
import json
import threading
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 8991
SQL_FILE = '/root/projects/rymos/supabase/sync_20260922_prod_sync.sql'

state = {
    'applied_queries': [],
    'tables': ['admin_users', 'categories', 'customers', 'messages', 'orders',
               'products', 'reviews', 'youtube_reviews'],  # prod-like: sync NOT run
    'admin_count': 0,
    'bootstrap_codes': [],
}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):  # noqa: A002
        pass

    def do_POST(self):
        if '/database/query' not in self.path:
            self.send_error(404)
            return
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length) or b'{}')
        token = self.headers.get('Authorization', '').replace('Bearer ', '').strip()

        if not token.startswith('sbp_'):
            self._json(401, {'message': 'Invalid token'})
            return

        q = body.get('query', '')
        state['applied_queries'].append(q)

        if q.strip() == 'SELECT 1 AS ok;':
            self._json(201, [{'ok': 1}])
            return

        # Order matters: the big sync SQL also mentions information_schema.tables
        # (legacy admin_users stub check) and count(*) (DO block), so check for
        # the apply payload FIRST.
        if 'CREATE TABLE IF NOT EXISTS' in q:
            for t in ['settings', 'coupons', 'wishlists', 'credit_applications',
                      'credit_plans', 'installments', 'order_status_history',
                      'product_reviews', 'contact_messages', 'admin_bootstrap']:
                if t not in state['tables']:
                    state['tables'].append(t)
            self._json(201, [])
            return

        if 'information_schema.tables' in q and 'CREATE TABLE' not in q:
            self._json(201, [{'table_name': t} for t in sorted(state['tables'])])
            return

        if q.strip().startswith('SELECT count(*)') and 'admin_users' in q:
            if 'admin_users' not in state['tables']:
                self._json(400, {'code': '42P01', 'message': 'relation does not exist'})
                return
            self._json(201, [{'n': state['admin_count']}])
            return

        if q.strip().startswith('INSERT INTO admin_bootstrap'):
            code = q.split("'")[1]
            state['bootstrap_codes'].append(code)
            self._json(201, [])
            return

        self._json(201, [])

    def _json(self, code, obj):
        data = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def start_server():
    srv = HTTPServer(('127.0.0.1', PORT), Handler)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    return srv


srv = start_server()
print('mock Management API on :%d' % PORT)

try:
    r = subprocess.run(['node', 'scripts/test_setup_route.js'],
                       capture_output=True, text=True, timeout=90,
                       cwd='/root/projects/rymos',
                       env={**__import__('os').environ, 'MOCK_PORT': str(PORT)})
    if r.stderr:
        print('--- stderr ---')
        print(r.stderr[:1500])
    try:
        out = json.loads(r.stdout)
    except json.JSONDecodeError:
        print('--- raw stdout ---')
        print(r.stdout[:2000])
        sys.exit(1)

    failures = []

    def check(name, cond, detail=''):
        status = 'PASS' if cond else 'FAIL'
        if not cond:
            failures.append(name)
        print(f'[{status}] {name} {detail}')

    t1 = out.get('t1_missing_token', {})
    check('missing token -> 400 with message', t1.get('status') == 400 and t1.get('body', {}).get('error'))

    t2 = out.get('t2_invalid_token', {})
    check('invalid token -> 400, friendly 401 copy', t2.get('status') == 400 and 'rejected' in t2.get('body', {}).get('error', ''), str(t2.get('body', {}).get('error', ''))[:70])

    t3 = out.get('t3_happy', {})
    b3 = t3.get('body', {})
    check('happy path -> 200', t3.get('status') == 200, str(t3)[:80])
    check('success true', b3.get('success') is True)
    check('zero missing tables', b3.get('missing') == [], str(b3.get('missing')))
    check('adminCount 0 detected', b3.get('adminCount') == 0)
    code = b3.get('setupCode')
    check('setup code format XXXX-XXXX', isinstance(code, str) and len(code) == 9 and code[4] == '-', str(code))
    check('code stored in admin_bootstrap (mock)',
          len(state['bootstrap_codes']) >= 1 and code in state['bootstrap_codes'],
          f"stored={state['bootstrap_codes']} code={code}")
    check('code charset unambiguous', all(c in 'ABCDEFGHJKMNPQRSTUVWXYZ23456789-' for c in (code or 'XXX')))

    t4 = out.get('t4_repeat', {})
    b4 = t4.get('body', {})
    check('idempotent re-run -> 200, still no missing', t4.get('status') == 200 and b4.get('missing') == [])

    applied = [q for q in state['applied_queries'] if 'CREATE TABLE IF NOT EXISTS' in q]
    sql_file = open(SQL_FILE).read()
    check('applied SQL is byte-identical to repo file',
          len(applied) >= 1 and applied[0].strip() == sql_file.strip())

    print()
    print('ALL PASS' if not failures else f'FAILURES: {failures}')
    sys.exit(0 if not failures else 1)
finally:
    srv.shutdown()
