#!/bin/bash
# NON_CERTIFYING_REHEARSAL masked-host binding smoke (batch1r3 A3 / scratch-1 and
# scratch-2 rulings). Self-wraps under the staged, lock-verified bwrap in a user
# namespace where the host qemu ROM/module dirs are ABSENT BY CONSTRUCTION: ROOT
# (/usr) is assembled piecemeal (tmpfs parents + one ro-bind per surviving entry),
# never ro-bound wholesale, because bwrap cannot mkdir a mountpoint under a
# read-only mount (scratch run 2: "Can't mkdir /usr/share/qemu: Read-only file
# system"). Inside, it runs the EXACT frozen case argv from argv-freeze.json (with
# -S inserted; -daemonize kept), proving machine init incl. firmware load from the
# staged tree only, plus a clean QMP handshake + quit. The CPU never starts (-S):
# no case is booted. Exit 97 on any failure.
set -euo pipefail
PREFIX="${PREFIX:-NON_CERTIFYING_REHEARSAL}"
HERE="$(cd "$(dirname "$0")" && pwd)"

if [ "${QEMU_SMOKE_NS:-0}" != "1" ]; then
  STAGE="/tmp/$PREFIX-stage"
  BWRAP="$STAGE/shims/bwrap"
  [ -x "$BWRAP" ] || { echo "E_QEMU_SMOKE no staged bwrap at $BWRAP"; exit 97; }
  ROOT=/usr
  MASKED=(/usr/share/qemu /usr/share/seabios /usr/lib/ipxe /usr/lib/x86_64-linux-gnu/qemu)
  # enum parents = every dir that directly holds a masked child
  ENUMP=()
  for m in "${MASKED[@]}"; do ENUMP+=("$(dirname "$m")"); done
  is_enum_parent() { local e; for e in "${ENUMP[@]}"; do [ "$1" = "$e" ] && return 0; done; return 1; }
  is_masked() { local e; for e in "${MASKED[@]}"; do [ "$1" = "$e" ] && return 0; done; return 1; }
  under_masked() {  # canonical path $1 lives inside a masked dir (symlink re-import guard)
    local m; for m in "${MASKED[@]}"; do case "$1" in "$m"|"$m"/*) return 0;; esac; done; return 1; }
  args=(--unshare-all --die-with-parent --proc /proc --dev /dev --dev-bind /dev/kvm /dev/kvm
        --tmpfs /tmp --ro-bind "$STAGE" "$STAGE" --tmpfs "/tmp/$PREFIX-out"
        --ro-bind /etc /etc --ro-bind /home /home
        --symlink usr/bin /bin --symlink usr/sbin /sbin --symlink usr/lib /lib --symlink usr/lib64 /lib64)
  bind_children() {  # $1 = host dir already tmpfs-shadowed in the namespace
    local e rp
    shopt -s nullglob
    for e in "$1"/*; do
      if is_enum_parent "$e"; then
        args+=(--tmpfs "$e"); bind_children "$e"
      elif is_masked "$e"; then
        :
      else
        rp="$(readlink -f "$e" || true)"
        if [ -n "$rp" ] && under_masked "$rp"; then :; else args+=(--ro-bind-try "$e" "$e"); fi
      fi
    done
    shopt -u nullglob
  }
  args+=(--tmpfs "$ROOT")
  bind_children "$ROOT"
  QEMU_SMOKE_NS=1 exec "$BWRAP" "${args[@]}" "$HERE/qemu-smoke.sh" "$@"
fi

CFG="${1:?usage: qemu-smoke.sh CONFIG FREEZE IDX}"; FREEZE="${2:?}"; IDX="${3:?}"
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
        pid=int(open(pf[0]).readline().strip()); os.kill(pid,0)
    except (ProcessLookupError,ValueError,FileNotFoundError,IndexError):
        gone=True; break
    time.sleep(0.2)
if not gone:
    print("E_QEMU_SMOKE qemu still running after quit"); sys.exit(97)
print("QEMU_SMOKE_OK exact frozen case argv + -S, host qemu dirs absent from namespace; QMP handshake + quit clean")
PYEOF
rm -rf "$W"
