#!/usr/bin/env python3
"""extract.py N tests|impl [--list] — write Task N's full-file code blocks
("`path`:" followed by a fenced block) from the Plan 2 document."""
import re, sys, os
PLAN = 'docs/superpowers/plans/2026-09-23-redesign-plan-2-data-sessions-projects.md'
n, kind = sys.argv[1], sys.argv[2]
plan = open(PLAN).read()
start = plan.index(f'### Task {n}:')
nxt = re.search(r'\n### Task \d+:', plan[start + 10:])
sec = plan[start: start + 10 + nxt.start()] if nxt else plan[start:]
for m in re.finditer(r"^`([\w@()\[\]/.\-{},]+\.(?:tsx?|css|mjs|md))`:\n\n```\w*\n(.*?)^```", sec, re.S | re.M):
    path, body = m.group(1), m.group(2)
    is_test = path.startswith('tests/')
    if (kind == 'tests') != is_test:
        continue
    if '--list' in sys.argv:
        print(path); continue
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    open(path, 'w').write(body)
    print('wrote', path)
