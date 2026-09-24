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
# peer run-36004747396 C1-prime6 ruling (b): UNQUOTED openers (<<TAG, <<-TAG) fail closed.
# The parser recognises only quoted delimiters; an unquoted match is a violation record,
# never queued as a parseable heredoc.
UNQUOTED_RE = re.compile(r"(?<!<)<<(?!<)-?\s*(?!['\"])([A-Za-z_][A-Za-z0-9_]*)")


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
    """Bash-rule parse of one de-indented run block. Returns (closed, unclosed, unquoted):
    closed   = [{tag, opener_lineno, opener_line, body=[(lineno, line)], closed_lineno}]
    unclosed = [{tag, opener_lineno, opener_line, body=[...]}] (pending at end of step)
    unquoted = [{tag, lineno, line}] (unquoted openers - violations, never queued)."""
    pending, closed, unquoted = [], [], []
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
        for m in UNQUOTED_RE.finditer(line):
            unquoted.append({"tag": m.group(1), "lineno": lineno, "line": line})
    return closed, pending, unquoted


def walk(block, prefix=""):
    """Recursive bash-rule walk (peer run-36004747396 C1-prime6 ruling (a)): yields
    ("heredoc", path, rec) for every closed heredoc at EVERY depth, descending into
    non-python bodies (shell-stdin scripts such as sudo unshare ... bash -se <<'CSIGN'
    whose own heredocs bash parses at runtime; python bodies are data and are not
    descended into), plus ("unclosed", path, rec) and ("unquoted", path, rec) at any
    depth. path is the >-joined tag chain, e.g. CSIGN>PYK2C, CFIX>PYK2."""
    closed, unclosed, unquoted = parse_heredocs(block)
    for h in closed:
        path = prefix + h["tag"]
        yield ("heredoc", path, h)
        if not is_python(h):
            yield from walk(h["body"], path + ">")
    for u in unclosed:
        yield ("unclosed", prefix + u["tag"], u)
    for q in unquoted:
        yield ("unquoted", prefix + q["tag"], q)


def is_python(h):
    """True when the opener line runs python reading the heredoc on stdin."""
    return bool(PY_OPENER_RE.search(h["opener_line"]))


def body_text(h):
    return "\n".join(l for _, l in h["body"]) + "\n"
