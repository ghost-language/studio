#!/usr/bin/env python3
"""Static checks for the Ghost sources in this repository.

Ghost is dynamically typed and has no compiler, and everything that imports a
`lumen:` module cannot be run by `ghost test.gs` at all - which is precisely
where every bug that reached a real run of this app has lived. These are the
three mistakes that actually shipped, each now checked before it can again:

  arity    a call passing fewer arguments than a callable requires. Ghost
           needs a default on every optional parameter, so adding a bare
           parameter silently breaks existing calls at the moment they run.
           This shipped three times.

  guards   `x == null or x.field` - `and`/`or` do not short-circuit in Ghost,
           so the guarded side is dereferenced anyway. This shipped twice,
           once crashing on every unbound keypress.

  shadow   a class method whose name matches a module imported by the same
           file. A method's name shadows the import for every method in the
           class. This shipped once, as a crash at startup.

Run it with `python3 tools/lint.py`; it exits non-zero if anything is found.
"""

import re, glob, collections, sys

def strip_strings(line):
    """Blank out string/template contents so commas inside them don't count."""
    out, i, n = [], 0, len(line)
    while i < n:
        c = line[i]
        if c in "'\"`":
            q = c; out.append(c); i += 1
            while i < n and line[i] != q:
                if line[i] == '\\': out.append('_'); i += 1
                if i < n: out.append('_'); i += 1
            if i < n: out.append(q); i += 1
        else:
            out.append(c); i += 1
    return ''.join(out)

def split_args(s):
    """Split a call's argument text on top-level commas."""
    s = s.strip()
    if not s: return []
    parts, depth, cur = [], 0, ''
    for ch in s:
        if ch in '([{': depth += 1
        elif ch in ')]}': depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur); cur = ''
        else:
            cur += ch
    parts.append(cur)
    return [p for p in parts]

def match_call_args(text, start):
    """Given index of '(', return the raw arg text and index after ')'."""
    depth, i, n = 0, start, len(text)
    while i < n:
        if text[i] == '(': depth += 1
        elif text[i] == ')':
            depth -= 1
            if depth == 0: return text[start+1:i], i+1
        i += 1
    return None, None


BUILTIN = set('''contains length push pop shift unshift slice join map filter reduce sort reverse
find findIndex findAll some every flatten flatMap chunk fill isEmpty insertAt removeAt indexOf
lastIndexOf first last tail concat unique each get set has keys values merge remove entries
toString toNumber toUpperCase toLowerCase trim trimStart trimEnd split replace startsWith
endsWith charAt repeat padStart padEnd format matches round floor ceil abs pow clamp isNaN
isFinite isInfinite isInteger isEven isOdd isNegative isPositive isZero draw drawQuad clip
print printf getWidth getHeight getDimensions getPixel setFilter getLineHeight setLineHeight
getAscent getDescent getBaseline getWrap getSize'''.split())

KEYWORDS = {'if','while','for','switch','return','function','class','trait','new','catch','and','or','use','import','case','default'}

# --- collect declarations -------------------------------------------------
decls = collections.defaultdict(list)   # name -> list of (file, required, total)
for path in sorted(glob.glob('**/*.gs', recursive=True)):
    for lineno, raw in enumerate(open(path), 1):
        line = strip_strings(raw)
        if line.lstrip().startswith('//'): continue
        # `function name(...)` or an indented method `name(...) {`
        m = re.match(r'\s*function\s+(\w+)\s*\(', line) or re.match(r'^\s{2,}(\w+)\s*\(', line)
        if not m: continue
        name = m.group(1)
        if name in KEYWORDS: continue
        open_idx = line.index('(', m.end(1)-1 if line[m.end(1)-1]=='(' else m.end(1))
        args, after = match_call_args(line, open_idx)
        if args is None: continue
        if after is None or '{' not in line[after:]: continue   # must be a declaration
        params = [p.strip() for p in split_args(args) if p.strip()]
        required = len([p for p in params if '=' not in p and not p.startswith('...')])
        decls[name].append((path, lineno, required, len(params)))

# --- check call sites -----------------------------------------------------
unique = {n: v[0] for n, v in decls.items() if len(v) == 1}
findings = []
for path in sorted(glob.glob('**/*.gs', recursive=True)):
    for lineno, raw in enumerate(open(path), 1):
        line = strip_strings(raw)
        if line.lstrip().startswith('//'): continue
        for m in re.finditer(r'(?:\.|\b)(\w+)\s*\(', line):
            name = m.group(1)
            if name in KEYWORDS or name in BUILTIN or name not in unique: continue
            dpath, dline, required, total = unique[name]
            if dpath == path and lineno == dline: continue      # the declaration itself
            args, _ = match_call_args(line, line.index('(', m.end(1)))
            if args is None: continue
            count = len([a for a in split_args(args) if a.strip()])
            if count < required:
                findings.append((path, lineno, name, count, required, dpath, dline, raw.strip()))

problems = 0

for f in findings:
    print(f"arity  {f[0]}:{f[1]}  {f[2]}() got {f[3]}, needs {f[4]}   (declared {f[5]}:{f[6]})")
    print(f"       {f[7][:100]}")
    problems += 1

# --- guards: `and`/`or` do not short-circuit ------------------------------
GUARD = re.compile(r'(\b[\w.]+)\s*(?:==|!=)\s*null\s+(?:and|or)\b(.*)$')

for path in sorted(glob.glob('**/*.gs', recursive=True)):
    for lineno, raw in enumerate(open(path), 1):
        line = strip_strings(raw)
        if line.lstrip().startswith('//'):
            continue
        m = GUARD.search(line)
        if not m:
            continue
        name, rest = m.group(1), m.group(2)
        # flagged only when the same name is dereferenced on the other side
        if re.search(re.escape(name) + r'\s*[.(\[]', rest):
            print(f"guard  {path}:{lineno}  `{name}` is null-checked and dereferenced in one expression")
            print(f"       {raw.strip()[:100]}")
            problems += 1

# --- shadow: a method named the same as one of the file's imports ----------
for path in sorted(glob.glob('**/*.gs', recursive=True)):
    src = open(path).read()
    imports = set()
    for m in re.finditer(r'import\s+"([a-zA-Z][\w+.-]*:)?([\w/-]+)"(?:\s+as\s+(\w+))?', src):
        imports.add(m.group(3) or m.group(2).split('/')[-1])
    methods = set(re.findall(r'^\s{2,}(\w+)\s*\([^)]*\)\s*\{', src, re.M))
    for name in sorted(methods & imports):
        print(f"shadow {path}  method `{name}()` shadows the import bound to the same name")
        problems += 1

print()
print(f"{problems} problem(s); {len(unique)} uniquely-named callables checked")

sys.exit(1 if problems else 0)
