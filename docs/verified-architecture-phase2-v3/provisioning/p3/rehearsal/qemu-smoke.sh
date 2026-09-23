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
# no case is booted. Exit 97 on any failure. Runs as root (KVM device mapping). Relative argv
# paths resolve against a work root materialized from the pin-verified dual-build
# products (the same bytes the ceremony copies into the repo tree one step later).
set -euo pipefail
PREFIX="${PREFIX:-NON_CERTIFYING_REHEARSAL}"; export PREFIX
HERE="$(cd "$(dirname "$0")" && pwd)"

if [ "${QEMU_SMOKE_NS:-0}" != "1" ]; then
  # must run as root (the workflows invoke it via sudo, exactly like the ceremony's sudo
  # unshare -n): /dev/kvm is root:kvm 0660 on the runner, and inside bwrap's user namespace
  # an unmapped owner/group fails the open with EACCES (scratch run 5). With euid 0 bwrap
  # maps ns uid 0 to real uid 0, so the node owner is mapped and owner-rw applies.
  [ "$(id -u)" = "0" ] || { echo "E_QEMU_SMOKE must run as root (KVM device owner mapping; use sudo as the workflows do)"; exit 97; }
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
  # the dual-build product dirs (created and pin-verified by earlier workflow steps) must be
  # visible inside: /tmp is tmpfs'd, so bind them explicitly (hard binds: missing = fail loud)
  args=(--unshare-all --die-with-parent --proc /proc --dev /dev --dev-bind /dev/kvm /dev/kvm
        --tmpfs /tmp --ro-bind "$STAGE" "$STAGE" --tmpfs "/tmp/$PREFIX-out"
        --ro-bind "/tmp/$PREFIX-ovmf-a" "/tmp/$PREFIX-ovmf-a" --ro-bind "/tmp/$PREFIX-esp-a" "/tmp/$PREFIX-esp-a"
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
rm -rf "$W"; mkdir -p "$W/build-output/ovmf-debug" "$W/build-output/esp"
# the frozen argv carries RELATIVE paths (build-output/ovmf-debug/OVMF_CODE.fd,
# build-output/esp/c5-root-admitter-uki-v3-esp.raw) that the ceremony resolves against the
# repo tree after its pin-verified copy; at this earlier step the same bytes live only in
# the dual-build product dirs. Resolve them to exactly those bytes: hash-verify each source
# against the committed pins (exit 97 on any mismatch), then link it into the work root.
CODE_SHA=$(python3 -c "import json;print(json.load(open('$CFG'))['firmware_debug_sha256'])")
ESP_SHA=$(python3 -c "import json;print(json.load(open('$CFG'))['esp_sha256'])")
[ "$(sha256sum "/tmp/$PREFIX-ovmf-a/OVMF_CODE.fd" | cut -d' ' -f1)" = "$CODE_SHA" ] || { echo "E_QEMU_SMOKE build product OVMF_CODE.fd sha mismatch"; exit 97; }
[ "$(sha256sum "/tmp/$PREFIX-esp-a/c5-root-admitter-uki-v3-esp.raw" | cut -d' ' -f1)" = "$ESP_SHA" ] || { echo "E_QEMU_SMOKE build product esp sha mismatch"; exit 97; }
ln -s "/tmp/$PREFIX-ovmf-a/OVMF_CODE.fd" "$W/build-output/ovmf-debug/OVMF_CODE.fd"
ln -s "/tmp/$PREFIX-esp-a/c5-root-admitter-uki-v3-esp.raw" "$W/build-output/esp/c5-root-admitter-uki-v3-esp.raw"
"$HERE/make-disks.sh" "$W/disks" >/dev/null
python3 - "$CFG" "$FREEZE" "$IDX" "$W" <<'PYEOF'
import json, os, socket, subprocess, sys, time
cfg=json.load(open(sys.argv[1])); fz=json.load(open(sys.argv[2]))
# Lane prefix resolution (scratch-3 ruling): committed config/argv-freeze bytes keep the
# canonical NON_CERTIFYING_REHEARSAL prefix; at load time every /tmp/NON_CERTIFYING_REHEARSAL-
# path prefix resolves to the running lane's /tmp/$PREFIX-. Identity in the rehearsal and
# certification lanes; the scratch lane exports PREFIX=NON_CERTIFYING_SCRATCH.
PREFIX=os.environ.get("PREFIX","NON_CERTIFYING_REHEARSAL")
def _pref(x):
    if isinstance(x,str): return x.replace("/tmp/NON_CERTIFYING_REHEARSAL-","/tmp/%s-"%PREFIX)
    if isinstance(x,list): return [_pref(i) for i in x]
    if isinstance(x,dict): return {k:_pref(v) for k,v in x.items()}
    return x
cfg=_pref(cfg); fz=_pref(fz)
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
# every relative file= path in the frozen argv must resolve to a real file under the work
# root (firmware, ESP, disks) - fail closed naming the exact missing path
for a in argv:
    for tok in a.split(","):
        if (tok.startswith("file=") or tok.startswith("file:")) and not tok[5:].startswith("/"):
            if not os.path.exists(os.path.join(W,tok[5:])):
                print("E_QEMU_SMOKE missing relative argv path", tok[5:]); sys.exit(97)
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
