#!/usr/bin/env python3
"""Fill src/lib/sync-sql.ts with the real SQL content (String.raw template)."""
sql = open('/root/projects/rymos/supabase/sync_20260922_prod_sync.sql').read()
# String.raw keeps backslashes literal; only ` and ${ need care. Verify none exist.
assert '`' not in sql, 'SQL contains a backtick — cannot embed in template literal'
assert '${' not in sql, 'SQL contains ${ — cannot embed in template literal'
tmpl = """// AUTO-GENERATED from supabase/sync_20260922_prod_sync.sql \u2014 do not edit here.
// Bundled as a TS module so the /api/setup/apply route cannot fail on
// filesystem tracing in any deployment target.
export const SYNC_SQL = String.raw`
""" + sql + """
`;
"""
open('/root/projects/rymos/src/lib/sync-sql.ts', 'w').write(tmpl)
print('written, bytes:', len(tmpl))
