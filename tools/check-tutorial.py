#!/usr/bin/env python3
"""Check that the code in docs/tutorial.html still parses.

    tools/check-tutorial.py

The tutorial tells a reader to type out whole files. If one of them stops
parsing, the reader finds out by typing it in and getting a syntax error with
no way to tell whether they mistyped it or the page is wrong - which is the
worst possible failure for a document whose entire premise is "type this".

It has happened. The tutorial spent two rebuilds describing an interface the
code no longer had: bevelled surfaces, circular corners, rendering at window
resolution. Prose going stale is hard to catch automatically; code going stale
is not, and this catches the half that can be.

Only blocks marked `new` are checked. Those are whole files. A block marked
`edit` is a fragment - a few methods added to a class - and cannot parse alone.
"""

import html
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

WHOLE_FILE = re.compile(
    r'<figcaption><span>([^<]+\.gs)</span><span class="chip new">new</span></figcaption>\s*'
    r'<pre><code class="gs">(.*?)</code></pre>',
    re.S,
)


def blocks(source):
    for match in WHOLE_FILE.finditer(source):
        yield match.group(1), html.unescape(match.group(2))


def main():
    ghost = os.environ.get("GHOST", "ghost")
    page = os.path.join(ROOT, "docs", "tutorial.html")

    if not os.path.exists(page):
        print("docs/tutorial.html is missing")
        return 1

    source = open(page).read()
    failures = 0
    checked = 0

    with tempfile.TemporaryDirectory() as work:
        for name, code in blocks(source):
            checked += 1
            path = os.path.join(work, name.replace("/", "__"))
            open(path, "w").write(code)

            # `ghost <file>` reports a syntax fault before it evaluates
            # anything, so a file that only fails on a `lumen:` import is fine.
            # A file that fails to parse is not.
            result = subprocess.run(
                [ghost, path], capture_output=True, text=True, timeout=30
            )
            output = result.stdout + result.stderr

            if "syntax error" in output:
                print(f"syntax error in the {name} block:")

                for line in output.splitlines():
                    if line.strip():
                        print("   " + line)

                failures += 1

    print()
    print(f"{failures} problem(s); {checked} whole-file code blocks checked")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
