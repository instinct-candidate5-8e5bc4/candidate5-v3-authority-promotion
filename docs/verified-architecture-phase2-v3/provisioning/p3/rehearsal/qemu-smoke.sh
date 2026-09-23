#!/bin/bash
# NON_CERTIFYING_REHEARSAL masked-host binding smoke (batch1r3 A3 / scratch-1 ruling).
# Runs the EXACT frozen case argv from argv-freeze.json (with -S inserted; -daemonize
# kept) while the CALLER's bwrap masks the four host qemu dirs; proves machine init
# (incl. firmware load from the staged tree only) plus a clean QMP handshake + quit.
# The CPU never starts (-S): no case is booted. Exit 97 on any failure.
set -euo pipefail
CFG="${1:?usage: qemu-smoke.sh CONFIG FREEZE IDX}"; FREEZE="${2:?}"; IDX="${3:?}"
HERE="$(cd "$(dirname "$0")" && pwd)"
PREFIX="${PREFIX:-NON_CERTIFYING_REHEARSAL}"
W="/tmp/$PREFIX-smoke-work"
rm -rf "$W"; mkdir -p "$W"
ln -s "$HERE/build-output" "$W/build-output"
"$HERE/make-disks.sh" "$W/disks" >/dev/null
python3 - "$CFG" "$FREEZE" "$IDX" "$W" <<'PYEOF'
import json, os, socket, subprocess, sys, time
cfg=json.load(open(sys.argv[1])); fz=json.load(open(sys.argv[2]))
idx=int(sys.argv[3]); W=sys.argv[4]
argv=list(fz["cases"][idx]["argv"])
# -S immediately after the launcher: CPU never starts; every other element byte-exact.
argv=argv[:1]+["-S"]+argv[1:]
vars_src=cfg["ovmf_vars_pristine"]
for a in argv:
    for tok in a.split(","):
        if tok.startswith("file=") or tok.startswith("file:"):
            p=tok[5:]
            if p.startswith("/tmp/"):
                os.makedirs(os.path.dirname(p), exist_ok=True)
                if "unit=1" in a:
                    with open(vars_src,"rb") as s, open(p,"wb") as d: d.write(s.read())
i=argv.index("-qmp"); sock=argv[i+1].split("unix:",1)[1].split(",",1)[0]
if os.path.lexists(sock): os.unlink(sock)
os.makedirs(os.path.dirname(sock), exist_ok=True)
p=subprocess.run(argv, cwd=W, capture_output=True, text=True, timeout=120)
if p.returncode!=0:
    print("E_QEMU_SMOKE spawn rc=%d"%p.returncode, (p.stdout or "")[-300:], (p.stderr or "")[-300:])
    sys.exit(97)
s=socket.socket(socket.AF_UNIX)
deadline=time.time()+30
while True:
    try: s.connect(sock); break
    except OSError:
        if time.time()>deadline:
            print("E_QEMU_SMOKE qmp connect timeout"); sys.exit(97)
        time.sleep(0.2)
s.settimeout(10)
def rd():
    buf=b""
    while b"\n" not in buf:
        chunk=s.recv(4096)
        if not chunk: break
        buf+=chunk
    return buf
rd()
s.sendall(b'{"execute":"qmp_capabilities"}\n'); rd()
s.sendall(b'{"execute":"quit"}\n'); rd()
gone=False
for _ in range(20):
    pf=[a for a in argv if a.endswith("qemu.pid")]
    try:
        pid=int(open(pf[0]).read().strip()); os.kill(pid,0)
    except (ProcessLookupError,ValueError,FileNotFoundError,IndexError):
        gone=True; break
    time.sleep(0.2)
if not gone:
    print("E_QEMU_SMOKE qemu still running after quit"); sys.exit(97)
print("QEMU_SMOKE_OK exact frozen case argv + -S under masked host dirs; QMP handshake + quit clean")
PYEOF
rm -rf "$W"
