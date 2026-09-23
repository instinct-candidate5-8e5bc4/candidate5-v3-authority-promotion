#!/usr/bin/env python3
"""NON_CERTIFYING_REHEARSAL PDB-path verifier (reviewer condition 5).
Parses EVERY PE module in a Build tree (or a single .efi/.fd) for CodeView
debug-directory PDB paths (RSDS/NB10), plus a raw-carve backstop for absolute
.dll/.pdb/.debug paths. Accepted firmware: every embedded absolute path carries the
canonical /build/ prefix. Any host/workspace/user path is a hard reject.
Usage: scan-pe-pdb-paths.py PATH [CANON_PREFIX=/build/]
Exit 0 PASS / 43 REJECT / 45 NO-DEBUG-ENTRIES (suspicious: expected at least one) / 2 usage."""
import os, re, struct, sys

CANON = sys.argv[2] if len(sys.argv) > 2 else "/build/"
HOSTILE = re.compile(rb"/tmp/|/home/|/Users/|/root/|/var/|/workspace|GITHUB|:")
ABS_PATH = re.compile(rb"(/[A-Za-z0-9_+.\-]+){2,}[.](dll|pdb|debug)")

def pe_pdb_paths(buf):
    """Yield (kind, path-bytes) for CodeView entries via the PE debug directory."""
    out = []
    if len(buf) < 0x40 or buf[:2] != b"MZ":
        return out
    pe = struct.unpack_from("<I", buf, 0x3C)[0]
    if pe + 0x18 > len(buf) or buf[pe:pe+4] != b"PE\x00\x00":
        return out
    magic = struct.unpack_from("<H", buf, pe + 0x18)[0]
    if magic == 0x10B:      # PE32:  data directories at opt+0x60
        base = pe + 0x18 + 0x60
    elif magic == 0x20B:    # PE32+: data directories at opt+0x70
        base = pe + 0x18 + 0x70
    else:
        return out
    dd = base + 6 * 8       # IMAGE_DIRECTORY_ENTRY_DEBUG
    if dd + 8 > len(buf):
        return out
    rva, size = struct.unpack_from("<II", buf, dd)
    if rva == 0 or size == 0:
        return out
    nsec = struct.unpack_from("<H", buf, pe + 6)[0]
    soff = pe + 0x18 + struct.unpack_from("<H", buf, pe + 0x14)[0]
    foff = None
    for i in range(nsec):
        s = soff + i * 40
        if s + 40 > len(buf):
            break
        va, vsz, raw = struct.unpack_from("<III", buf, s + 12)
        if va <= rva < va + max(vsz, 1):
            foff = raw + (rva - va)
            break
    if foff is None or foff + 28 > len(buf):
        return out
    for i in range(size // 28):
        e = foff + i * 28
        typ  = struct.unpack_from("<I", buf, e + 12)[0]
        csz  = struct.unpack_from("<I", buf, e + 16)[0]
        ptr  = struct.unpack_from("<I", buf, e + 24)[0]
        if typ != 2 or ptr + 4 > len(buf):
            continue
        sig = buf[ptr:ptr+4]
        if sig == b"RSDS":
            out.append(("RSDS", buf[ptr+24:ptr+csz].split(b"\x00")[0]))
        elif sig == b"NB10":
            out.append(("NB10", buf[ptr+16:ptr+csz].split(b"\x00")[0]))
    return out

def scan_file(path):
    buf = open(path, "rb").read()
    hits = pe_pdb_paths(buf)
    carved = [(b"carve", m.group(0)) for m in ABS_PATH.finditer(buf)]
    seen = {p for _, p in hits}
    hits += [(k, p) for k, p in carved if p not in seen]
    return hits

def main():
    root = sys.argv[1]
    files = [root] if os.path.isfile(root) else [
        os.path.join(dp, fn) for dp, _, fns in os.walk(root) for fn in fns if fn.endswith(".efi")]
    bad, npaths, nentries = [], 0, 0
    for f in sorted(files):
        for kind, p in scan_file(f):
            nentries += 1
            try:
                s = p.decode()
            except UnicodeDecodeError:
                continue
            if not s.startswith("/"):
                continue
            npaths += 1
            if not s.startswith(CANON) or HOSTILE.search(p):
                bad.append((f, kind, s))
    print(f"scanned {len(files)} PE files, {nentries} debug entries/carves, {npaths} absolute paths, canonical prefix {CANON!r}")
    if nentries == 0:
        print("VERDICT: SUSPICIOUS - zero debug entries found; parser or tree wrong")
        sys.exit(45)
    if bad:
        for f, k, s in bad[:50]:
            print(f"E_NONCANONICAL_PDB_PATH [{k}] {s} in {f}")
        print(f"VERDICT: REJECT ({len(bad)} non-canonical paths)")
        sys.exit(43)
    print("VERDICT: PASS (all absolute PDB paths carry the canonical prefix)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(2)
    main()
