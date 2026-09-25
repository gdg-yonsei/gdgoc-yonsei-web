#!/usr/bin/env python3
"""extract3.py N list | show K | write K PATH | append K PATH
Fenced code blocks of Plan 3's Task N, by index (see `list`)."""
import re, sys, os
PLAN = 'docs/superpowers/plans/2026-09-24-redesign-plan-3-landing-restyles-dark.md'
n, cmd = sys.argv[1], sys.argv[2]
plan = open(PLAN).read()
start = plan.index(f'### Task {n}:')
nxt = re.search(r'\n### Task \d+:', plan[start + 10:])
sec = plan[start: start + 10 + nxt.start()] if nxt else plan[start:]
blocks = list(re.finditer(r'^```(\w*)\n(.*?)^```', sec, re.S | re.M))
if cmd == 'list':
    for i, m in enumerate(blocks):
        before = sec[:m.start()].rstrip().splitlines()[-1][:90]
        print(f'{i}: [{m.group(1)}] {len(m.group(2).splitlines())} lines — {before}')
    sys.exit()
body = blocks[int(sys.argv[3])].group(2)
if cmd == 'show':
    sys.stdout.write(body)
elif cmd in ('write', 'append'):
    path = sys.argv[4]
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    with open(path, 'w' if cmd == 'write' else 'a') as f:
        if cmd == 'append':
            f.write('\n')
        f.write(body)
    print(cmd, path)
