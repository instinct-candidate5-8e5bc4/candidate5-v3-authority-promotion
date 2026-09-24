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
set -eEuo pipefail
# peer run-11: every otherwise-bare bash failure is NAMED (script/line/rc/command), exit 97.
trap '_rc=$?; echo "E_BASH_ERRTRAP qemu-smoke.sh line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
PREFIX="${PREFIX:-}"
[ -n "$PREFIX" ] || { echo "E_PREFIX_UNSET"; exit 97; }
[ "$PREFIX" = "${ALLOWED_PREFIX:-}" ] || { echo "E_PREFIX_MISMATCH prefix=$PREFIX allowed=$ALLOWED_PREFIX"; exit 97; }
export PREFIX
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
  # namespace argv = the frozen smoke_namespace block in argv-freeze.json (D1-class static
  # gate, scratch-6 ruling condition 5, peer adjudication 3). F2: the builder writes the
  # argv to a FILE and its exit code is checked (process substitution hid builder
  # failure); the builder self-asserts its expanded head equals the block's
  # structural_args exactly and that no masked path leaked; the shell independently
  # re-checks the head (sha), the masked set, and the total count, then walks the stream
  # with a POSITIONAL option allowlist with declared arities (F3). newline-joined: the
  # pinned token set and host /usr names carry no newlines.
  mkdir -p "/tmp/$PREFIX-out"
  # run-8 defect-1 fix + peer N2: this mkdir may run as root before any runner-side mkdir;
  # hand the ephemeral out dir to the invoking runner user (never world-writable). chmod
  # fallback is at most o+rx (CI output only, never hashed input).
  if [ -n "${SUDO_UID:-}" ] && [ -n "${SUDO_GID:-}" ]; then
    chown "$SUDO_UID:$SUDO_GID" "/tmp/$PREFIX-out" || chmod o+rx "/tmp/$PREFIX-out"
  else
    chmod o+rx "/tmp/$PREFIX-out"
  fi
  ARGVF="/tmp/$PREFIX-out/$PREFIX-smoke-argv.txt"; NSMAN="$ARGVF.ns-manifest"
  if ! python3 - "$HERE/argv-freeze.json" "$STAGE" "$PREFIX" "$ARGVF" "$NSMAN" <<'SMOKE_NS_EOF'
import hashlib, json, os, sys
fz=json.load(open(sys.argv[1])); stage=sys.argv[2]; prefix=sys.argv[3]
outpath, manpath = sys.argv[4], sys.argv[5]
sn=fz["smoke_namespace"]
masked=list(sn["masked"])
enum_parents=sorted({os.path.dirname(m) for m in masked})
def under_masked(p):
    return any(p==m or p.startswith(m+"/") for m in masked)
head=[t.replace("$STAGE",stage).replace("$PREFIX",prefix) for t in sn["structural_args"]]
out=list(head)
out.append("--tmpfs"); out.append(sn["root"])
def bind_children(d):
    try: entries=sorted(os.listdir(d))
    except OSError: return
    for name in entries:
        e=os.path.join(d,name)
        if e in enum_parents:
            out.extend(("--tmpfs",e)); bind_children(e)
        elif e in masked:
            continue
        else:
            rp=os.path.realpath(e)
            if rp and under_masked(rp): continue
            out.extend(("--ro-bind-try",e,e))
bind_children(sn["root"])
if out[:len(head)] != head:
    print("E_QEMU_SMOKE_NS_HEAD builder head mismatch"); sys.exit(97)
bad=[m for m in masked if any(tok==m or tok.startswith(m+"/") for tok in out)]
if bad:
    print("E_QEMU_SMOKE_NS_MASKED builder leaked", bad); sys.exit(97)
with open(outpath,"w") as f:
    f.write("\n".join(out)+"\n")
with open(manpath,"w") as f:
    f.write("structural_count=%d\n" % len(head))
    f.write("structural_sha256=%s\n" % hashlib.sha256(("\n".join(head)+"\n").encode()).hexdigest())
    f.write("total_count=%d\n" % len(out))
    f.write("masked_count=%d\n" % len(masked))
    for m in masked: f.write("masked=%s\n" % m)
SMOKE_NS_EOF
  then echo "E_QEMU_SMOKE_NS_EMIT namespace argv builder failed"; exit 97; fi
  # run-8 defect-1 fix: the builder wrote these as root; make them runner-readable for upload.
  chmod o+r "$ARGVF" "$NSMAN"
  mapfile -t ARGS < "$ARGVF"
  SC=$(sed -n 's/^structural_count=//p' "$NSMAN")
  SSH_B=$(sed -n 's/^structural_sha256=//p' "$NSMAN")
  TOTAL=$(sed -n 's/^total_count=//p' "$NSMAN")
  MC=$(sed -n 's/^masked_count=//p' "$NSMAN")
  [ "${#ARGS[@]}" = "$TOTAL" ] || { echo "E_QEMU_SMOKE_NS_COUNT ${#ARGS[@]} != $TOTAL"; exit 97; }
  SSH_S=$(head -n "$SC" "$ARGVF" | sha256sum | cut -d' ' -f1)
  [ "$SSH_S" = "$SSH_B" ] || { echo "E_QEMU_SMOKE_NS_HEAD_SHA $SSH_S != $SSH_B"; exit 97; }
  MI=0
  while IFS= read -r m; do
    MI=$((MI+1))
    for tok in "${ARGS[@]}"; do
      case "$tok" in "$m"|"$m"/*) echo "E_QEMU_SMOKE_NS_MASKED $tok"; exit 97;; esac
    done
  done < <(sed -n 's/^masked=//p' "$NSMAN")
  [ "$MI" = "$MC" ] && [ "$MI" -ge 1 ] || { echo "E_QEMU_SMOKE_NS_MASKED_COUNT $MI != $MC"; exit 97; }
  declare -A ARITY=( [--unshare-all]=0 [--die-with-parent]=0 [--proc]=1 [--dev]=1 [--dev-bind]=2 [--tmpfs]=1 [--ro-bind]=2 [--ro-bind-try]=2 [--symlink]=2 )
  i=0; ndev=0
  while [ "$i" -lt "${#ARGS[@]}" ]; do
    tok="${ARGS[$i]}"
    case "$tok" in
      --*) ;;
      *) echo "E_QEMU_SMOKE_NS_POSITIONAL token $i not an option: $tok"; exit 97;;
    esac
    [ -n "${ARITY[$tok]+set}" ] || { echo "E_QEMU_SMOKE_NS_OPTION $tok"; exit 97; }
    a=${ARITY[$tok]}
    [ $((i+a)) -lt "${#ARGS[@]}" ] || { echo "E_QEMU_SMOKE_NS_ARITY $tok truncated"; exit 97; }
    if [ "$tok" = "--dev-bind" ]; then
      ndev=$((ndev+1))
      { [ "${ARGS[$((i+1))]}" = "/dev/kvm" ] && [ "${ARGS[$((i+2))]}" = "/dev/kvm" ]; }         || { echo "E_QEMU_SMOKE_NS_DEVBIND ${ARGS[$((i+1))]} ${ARGS[$((i+2))]}"; exit 97; }
    fi
    i=$((i+1+a))
  done
  [ "$i" = "${#ARGS[@]}" ] || { echo "E_QEMU_SMOKE_NS_ARITY_TAIL $i != ${#ARGS[@]}"; exit 97; }
  [ "$ndev" = "1" ] || { echo "E_QEMU_SMOKE_NS_DEVBIND_COUNT $ndev"; exit 97; }
  # condition-7 evidence: the artifact file + its SHA + bind counts by type (the allowlist
  # above enforces zero rw binds; these counts are the logged proof).
  sha256sum "$ARGVF"
  for k in --ro-bind --ro-bind-try --dev-bind --tmpfs --symlink; do
    printf 'bind count %s: %s\n' "$k" "$(grep -cx -- "$k" "$ARGVF" || true)"
  done
  QEMU_SMOKE_NS=1 exec "$BWRAP" "${ARGS[@]}" "$HERE/qemu-smoke.sh" "$@"
fi

CFG="${1:?usage: qemu-smoke.sh CONFIG FREEZE IDX}"; FREEZE="${2:?}"; IDX="${3:?}"
# in-namespace evidence (peer condition 7): what the namespace actually sees for the
# script, the QEMU binary the frozen case argv launches, and /dev/kvm - findmnt shows the
# bind sources, stat shows the owner mapping the traversal repair depends on.
echo "in-namespace evidence:"
stat -c '%A %a %U:%g %n' "$0"
findmnt -T "$(readlink -f "$0")" -o TARGET,SOURCE,FSTYPE,OPTIONS || true
# peer N7: stat/findmnt the ACTUAL EXECUTED argv0 - the frozen case argv0 after the
# lane-prefix rewrite, resolved to an absolute path - and fail closed if it is missing.
# (The old PATH lookup of a bare name printed "resolved: MISSING" even on healthy runs,
# a prefix-confusion artifact; the smoke never execs a PATH-resolved binary.)
RAW_ARGV0=$(python3 -c "import json;print(json.load(open('$FREEZE'))['cases'][$IDX]['argv'][0])")
EXEC_ARGV0=${RAW_ARGV0//\/tmp\/NON_CERTIFYING_REHEARSAL-/\/tmp\/$PREFIX-}
echo "frozen argv0 raw: $RAW_ARGV0"
echo "executed argv0 (lane-resolved absolute): $EXEC_ARGV0"
case "$EXEC_ARGV0" in
  /*) ;;
  *) echo "E_QEMU_SMOKE_ARGV0_NOT_ABSOLUTE $EXEC_ARGV0"; exit 97;;
esac
if [ ! -x "$EXEC_ARGV0" ]; then
  echo "E_QEMU_SMOKE_ARGV0_MISSING executed argv0 not present+executable in-namespace: $EXEC_ARGV0"; exit 97
fi
stat -c '%A %a %U:%g %n' "$EXEC_ARGV0"
findmnt -T "$EXEC_ARGV0" -o TARGET,SOURCE,FSTYPE,OPTIONS || true
stat -c '%A %a %U:%g %n' /dev/kvm
findmnt -T /dev/kvm -o TARGET,SOURCE,FSTYPE,OPTIONS || true
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
# peer-ordered #9 fix (same rule as the ceremony's make-shims): make-disks output is
# evidence, never suppressed - captured to a named log in the work root and echoed into the
# smoke log (the durable out-dir evidence log the workflow preserves); nonzero gets a named
# error. ($W is namespace-local and ephemeral; the durable copy is the smoke log.)
DISKS_LOG="$W/make-disks.log"
_rc=0
"$HERE/make-disks.sh" "$W/disks" >"$DISKS_LOG" 2>&1 || _rc=$?
# peer ruling: echo unconditionally (success AND failure) with delimiters and the log's
# sha256, so it lands verbatim in the durable workflow-captured smoke log; the $W copy
# stays ephemeral (no writable bind added to the namespace).
echo "----- begin make-disks.log sha256=$(sha256sum "$DISKS_LOG" | cut -d' ' -f1) -----"
cat "$DISKS_LOG"
echo "----- end make-disks.log -----"
[ "$_rc" = 0 ] || { echo "E_QEMU_SMOKE_DISKS make-disks.sh rc=$_rc"; exit 97; }
python3 - "$CFG" "$FREEZE" "$IDX" "$W" <<'PYEOF'
import hashlib, json, os, socket, subprocess, sys, time
cfg=json.load(open(sys.argv[1])); fz=json.load(open(sys.argv[2]))
_fz_raw=fz  # raw committed bytes, kept pre lane-prefix resolution for the F7 run-log block
# Lane prefix resolution (scratch-3 ruling): committed config/argv-freeze bytes keep the
# canonical NON_CERTIFYING_REHEARSAL prefix; at load time every /tmp/NON_CERTIFYING_REHEARSAL-
# path prefix resolves to the running lane's /tmp/$PREFIX-. Identity in the rehearsal and
# certification lanes; the scratch lane exports PREFIX=NON_CERTIFYING_SCRATCH.
PREFIX=os.environ["PREFIX"]  # presence+allowlist enforced fail-closed by the shell wrapper (F1)
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
# peer F7 run-log condition (refined): per case print BOTH the raw committed hash and the
# lane-local executed-form hash, pre/post lane-prefix resolution. Convention: NUL-join
# WITHOUT trailing NUL (tree-wide; F8); +-S inserts -S at position 1. In the rehearsal and
# certification lanes the rewrite is identity, so raw==lane is ASSERTED fail-closed; in the
# scratch lane the log states the difference is only the /tmp/<prefix>- rewrite, proven by
# reverse-rewriting the lane form back to the raw bytes per case.
def _argv_h(_a): return hashlib.sha256("\0".join(_a).encode()).hexdigest()
def _withS(_a): return _a[:1]+["-S"]+_a[1:]
print("case argv sha256 (NUL-join, no trailing NUL; +-S inserts -S at position 1):")
for _c in _fz_raw["cases"]:
    _raw=_c["argv"]; _loc=_pref(_raw)
    print("  %s raw  argv=%s argv+-S=%s" % (_c["id"], _argv_h(_raw), _argv_h(_withS(_raw))))
    print("  %s lane argv=%s argv+-S=%s" % (_c["id"], _argv_h(_loc), _argv_h(_withS(_loc))))
    if PREFIX=="NON_CERTIFYING_REHEARSAL":
        if _loc!=_raw:
            print("E_QEMU_SMOKE_ARGV_LANE identity lane rewrote argv", _c["id"]); sys.exit(97)
    else:
        _back=[_t.replace("/tmp/%s-"%PREFIX,"/tmp/NON_CERTIFYING_REHEARSAL-") for _t in _loc]
        if _back!=_raw:
            print("E_QEMU_SMOKE_ARGV_LANE lane difference is not only the /tmp prefix rewrite", _c["id"]); sys.exit(97)
if PREFIX=="NON_CERTIFYING_REHEARSAL":
    print("lane argv check: PREFIX=NON_CERTIFYING_REHEARSAL - rewrite is identity; raw==lane asserted for all %d cases" % len(_fz_raw["cases"]))
else:
    print("lane argv check: PREFIX=%s - lane values differ from raw ONLY by the /tmp/%s- path-prefix rewrite (reverse-rewrite verified per case)" % (PREFIX, PREFIX))
print("executed case id=%s executed argv+-S sha256=%s" % (fz["cases"][idx]["id"], _argv_h(argv)))
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
# peer N7 (exec site): the argv0 about to be exec'd must be an absolute, executable file.
_argv0=argv[0]
print("executed argv0 at spawn (lane-resolved absolute):", _argv0)
if not _argv0.startswith("/") or not os.path.isfile(_argv0) or not os.access(_argv0, os.X_OK):
    print("E_QEMU_SMOKE_ARGV0_MISSING at spawn:", _argv0); sys.exit(97)
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
