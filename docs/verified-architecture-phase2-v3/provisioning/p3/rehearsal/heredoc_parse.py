#!/usr/bin/env python3
"""Bash-rule heredoc parser for workflow run blocks (peer run-36004747396 ruling,
C1''''' items 2+4). SINGLE SOURCE OF TRUTH shared by preflight-check.py's
E_HEREDOC_STRUCTURE gate, test-heredoc-structure.py's planted negatives, and
test-k2-sweeps.py's sweep-body extraction. Stdlib only; no sibling imports.

Parse rules (bash): a heredoc opener is `<<` / `<<-` followed by a quoted delimiter
('TAG' or "TAG"); here-strings (`<<<`) are NOT heredocs. While a body is open every
line is data until the first line equal to the delimiter (whitespace-stripped; YAML
block indentation is removed before parsing), which closes it. Multiple openers on
one command line queue in opener order. An opener still pending at the end of its
run block is UNCLOSED. A delimiter line cannot itself open a heredoc (bash reads it
as the body terminator), so opener detection only runs OUTSIDE an open body.
"""
import re

RUN_RE = re.compile(r"^(\s*)run:\s*\|[-+]?[ \t]*(?:#.*)?$")
_OP = r"(?<!<)<<(?!<)-?\s*(?:'([A-Za-z_][A-Za-z0-9_]*)'|\"([A-Za-z_][A-Za-z0-9_]*)\")"
OPENER_RE = re.compile(_OP)
BODY_OPENER_RE = OPENER_RE  # a python-body line matching this is itself a heredoc opener
PY_OPENER_RE = re.compile(r"python[0-9.]*\s+-[^<\n]*" + _OP)


def iter_run_blocks(text):
    """Yield (run_key_lineno, [(lineno, deindented_line), ...]) for each `run: |` block."""
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        m = RUN_RE.match(lines[i])
        if not m:
            i += 1
            continue
        key_indent = len(m.group(1))
        block = []
        j = i + 1
        while j < len(lines):
            ln = lines[j]
            if ln.strip() and len(ln) - len(ln.lstrip(" ")) <= key_indent:
                break
            block.append((j + 1, ln))
            j += 1
        indents = [len(l) - len(l.lstrip(" ")) for _, l in block if l.strip()]
        base = min(indents) if indents else 0
        yield i + 1, [(n, l[base:] if l.strip() else "") for n, l in block]
        i = j


def parse_heredocs(block):
    """Bash-rule parse of one de-indented run block. Returns (closed, unclosed):
    closed   = [{tag, opener_lineno, opener_line, body=[(lineno, line)], closed_lineno}]
    unclosed = [{tag, opener_lineno, opener_line, body=[...]}] (pending at end of step)."""
    pending, closed = [], []
    for lineno, line in block:
        if pending:
            cur = pending[0]
            if line.strip() == cur["tag"]:
                cur["closed_lineno"] = lineno
                closed.append(cur)
                pending.pop(0)
            else:
                cur["body"].append((lineno, line))
            continue
        for m in OPENER_RE.finditer(line):
            pending.append({"tag": m.group(1) or m.group(2), "opener_lineno": lineno,
                            "opener_line": line, "body": []})
    return closed, pending


def is_python(h):
    """True when the opener line runs python reading the heredoc on stdin."""
    return bool(PY_OPENER_RE.search(h["opener_line"]))


def body_text(h):
    return "\n".join(l for _, l in h["body"]) + "\n"
