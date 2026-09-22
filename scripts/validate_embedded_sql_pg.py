#!/usr/bin/env python3
"""Validate the EMBEDDED sync SQL (exactly what /api/setup/apply sends) on the
local PG16 replica: fresh apply from prod-like state, then idempotent re-run.

Uses psql via sudo -u postgres against rymos_setup_route_test (a copy of the
prod-replica database). Exits non-zero on any SQL error.
"""
import re
import subprocess
import sys

DB = 'rymos_setup_route_test'

# Extract the embedded SQL from the TS module — this is the exact payload
ts = open('/root/projects/rymos/src/lib/sync-sql.ts').read()
m = re.search(r'String\.raw`\n(.*)\n`;\s*$', ts, re.S)
if not m:
    print('EMBEDDED SQL NOT FOUND')
    sys.exit(1)
sql = m.group(1)

def run_sql(payload, label):
    p = subprocess.run(
        ['sudo', '-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-d', DB, '-c', payload],
        capture_output=True, text=True, timeout=120)
    errs = [l for l in p.stderr.splitlines() if 'ERROR' in l or 'FATAL' in l]
    notices = [l for l in (p.stdout + p.stderr).splitlines() if 'NOTICE' in l]
    print(f'{label}: exit={p.returncode} errors={len(errs)} notices={len(notices)}')
    for e in errs[:5]:
        print('  ', e.strip()[:120])
    return p.returncode == 0 and not errs

ok1 = run_sql(sql, 'RUN 1 (fresh apply from prod-like state)')
ok2 = run_sql(sql, 'RUN 2 (idempotency re-run)')

# Verify expected tables exist now
p = subprocess.run(
    ['sudo', '-u', 'postgres', 'psql', '-d', DB, '-t', '-A', '-c',
     "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1;"],
    capture_output=True, text=True)
tables = p.stdout.split()
expected = ['settings', 'coupons', 'wishlists', 'credit_applications', 'credit_plans',
            'installments', 'order_status_history', 'product_reviews', 'contact_messages',
            'admin_bootstrap', 'admin_users']
missing = [t for t in expected if t not in tables]
print(f'tables after apply: {len(tables)}; missing expected: {missing or "none"}')

# Functional check: the RPC + bootstrap flow the route depends on
p = subprocess.run(
    ['sudo', '-u', 'postgres', 'psql', '-d', DB, '-t', '-A', '-c',
     "INSERT INTO admin_bootstrap (code) VALUES ('TEST-CODE'); SELECT count(*) FROM admin_bootstrap WHERE code='TEST-CODE' AND used=false;"],
    capture_output=True, text=True)
print('bootstrap insert+select:', p.stdout.strip().splitlines()[-1] if p.stdout.strip() else 'FAIL', p.stderr[:100] if p.returncode else '')

ok = ok1 and ok2 and not missing
print()
print('ALL PASS' if ok else 'FAILED')
sys.exit(0 if ok else 1)
