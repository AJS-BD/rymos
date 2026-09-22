#!/usr/bin/env python3
"""Probe prod Supabase anon REST using the anon key from the DEPLOYED Vercel bundle.

Fetches homepage + all its chunks AND recursively discovers more chunks via the
build manifest, since the supabase client lives in a lazily-loaded chunk.
"""
import re
import sys
import json as _json
import urllib.request
import urllib.error
import json

DEPLOY = 'https://rymos-git-main-xafors-projects.vercel.app'


def fetch(url, headers=None, timeout=15):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode('utf-8', errors='ignore')


blob = ''
seen = set()
queue = [DEPLOY + '/']

# also try common manifest paths
for path in ['/_next/build-manifest.json', '/_next/static/chunks/webpack.js']:
    queue.append(DEPLOY + path)

pages = ['/', '/products', '/admin/login', '/track-order', '/contact',
         '/customer/login', '/admin/dashboard', '/customer/cart']

for p in pages:
    try:
        html = fetch(DEPLOY + p)
        blob += html
        for c in re.findall(r'(/_next/static/(?:immutable|chunks)/[^"\'\\]+\.js)', html):
            if c not in seen:
                seen.add(c)
                queue.append(DEPLOY + c)
    except Exception as e:
        print('  page fetch failed:', p, str(e)[:50])

while queue:
    u = queue.pop(0)
    if u in seen:
        continue
    seen.add(u)
    try:
        blob += fetch(u)
        # discover nested chunk references
        for c in re.findall(r'(/_next/static/(?:immutable|chunks)/[^"\'\\)\s]+\.js)', blob[-200000:]):
            cu = DEPLOY + c
            if cu not in seen:
                queue.append(cu)
    except Exception:
        pass

print('total fetched bytes:', len(blob))
m = re.search(r'https://([a-z0-9]+)\.supabase\.co', blob)
mk = re.search(r'eyJ[A-Za-z0-9_-]{80,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', blob)
if not (m and mk):
    print('ANON_KEY_OR_URL_NOT_FOUND_IN_DEPLOYED_BUNDLE')
    sys.exit(0)

url = 'https://%s.supabase.co' % m.group(1)
key = mk.group(0)
print('project_url:', url)

tables = ['settings', 'contact_messages', 'admin_users', 'admin_bootstrap', 'coupons',
          'wishlists', 'product_reviews', 'credit_applications', 'credit_plans',
          'installments', 'order_status_history', 'returns', 'refunds', 'cart_items',
          'notifications', 'admin_audit_log', 'daily_sales', 'inventory_movements',
          'products', 'orders', 'customers', 'messages']

results = {}
for t in tables:
    req = urllib.request.Request(
        '%s/rest/v1/%s?select=*&limit=1' % (url, t),
        headers={'apikey': key, 'Authorization': 'Bearer ' + key})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            results[t] = r.status
    except urllib.error.HTTPError as e:
        results[t] = e.code
    except Exception as e:
        results[t] = str(e)[:40]

missing = sorted(t for t, c in results.items() if c == 404)
present = sorted(t for t, c in results.items() if c == 200)
other = {t: c for t, c in results.items() if c not in (200, 404)}
print('present (%d):' % len(present), ', '.join(present))
print('missing (%d):' % len(missing), ', '.join(missing))
print('other:', json.dumps(other))
print()
print('VERDICT:', 'SYNC_SQL_APPLIED' if not missing else 'SYNC_SQL_STILL_NOT_RUN')
