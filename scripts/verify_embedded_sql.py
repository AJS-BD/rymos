#!/usr/bin/env python3
"""Verify src/lib/sync-sql.ts embeds the exact SQL file content."""
import re

ts = open('/root/projects/rymos/src/lib/sync-sql.ts').read()
sql_file = open('/root/projects/rymos/supabase/sync_20260922_prod_sync.sql').read()

# extract between the String.raw` marker and the closing `;
m = re.search(r'String\.raw`\n(.*)\n`;\s*$', ts, re.S)
if not m:
    print('PATTERN_NOT_FOUND')
    raise SystemExit(1)
embedded = m.group(1)

if embedded == sql_file:
    print('IDENTICAL — embedded SQL matches the .sql file exactly (%d bytes)' % len(embedded))
else:
    print('MISMATCH')
    print('embedded len:', len(embedded), 'file len:', len(sql_file))
    for i, (a, b) in enumerate(zip(embedded, sql_file)):
        if a != b:
            print('first diff at char', i, repr(a), 'vs', repr(b))
            break
