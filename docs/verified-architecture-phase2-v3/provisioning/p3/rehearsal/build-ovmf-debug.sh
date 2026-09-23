#!/bin/bash
# NON_CERTIFYING_REHEARSAL reproducible OVMF DEBUG build.
# Pinned: edk2 commit, toolchain flags, SOURCE_DATE_EPOCH. Two independent workdirs must
# produce byte-identical OVMF_CODE.fd / OVMF_VARS.fd or the step fails.
# Usage: build-ovmf-debug.sh STAGE OUTDIR_A OUTDIR_B
# Modes (env): CANON_SINGLE=1 = one build only (env2 reproduction); CANON_MODE=hostile =
# one build at a deliberately NON-canonical host path (drift demonstration for the PDB
# verifier); CANON_REALWORK=p = real dir bound to /build (default: dirname(OUTA)/ovmf-work-real).
set -euo pipefail
STAGE="$1"; OUTA="$2"; OUTB="${3:-}"
# B4: no compiler/linker environment may leak into BaseTools or the firmware build
unset LD_LIBRARY_PATH GCC_EXEC_PREFIX COMPILER_PATH CPATH LIBRARY_PATH
# Reviewer condition 1: the build runs at the canonical in-container path /build, never a
# host/workspace/user path. Locally the canonical path is provided by a user-namespace bind
# (bwrap) of a real scratch dir; in CI the runner provides the container path directly.
if [ "${CANON_MODE:-}" != hostile ] && [ "${IN_CANON_NS:-}" != 1 ]; then
  REALWORK="${CANON_REALWORK:-$(dirname "$OUTA")/ovmf-work-real}"
  mkdir -p "$REALWORK" "$OUTA" ${OUTB:+"$OUTB"}
  # condition 2: no symlink components in any path that enters the build
  for p in "$STAGE" "$OUTA" ${OUTB:+"$OUTB"} "$REALWORK"; do
    [ "$(realpath "$p")" = "$p" ] || { echo "E_NONCANONICAL_INPUT_PATH $p"; exit 47; }
  done
  # C6: bwrap is load-bearing for the canonical path. Use ONLY the platform-lock-staged,
  # hash-verified bwrap via the staged-loader shim, never the host binary.
  "$(dirname "$0")/make-shims.sh" "$STAGE" "$STAGE/shims" >/dev/null
  BWRAP="$STAGE/shims/bwrap"
  [ -x "$BWRAP" ] || { echo "E_NO_STAGED_BWRAP $BWRAP"; exit 91; }
  IN_CANON_NS=1 CANON_REALWORK="$REALWORK"     exec "$(dirname "$0")/bwrap-argv.sh" canonical "$BWRAP" "$REALWORK" -- "$0" "$@"
fi
STAGE="$(realpath "$STAGE")"; OUTA="$(realpath "$OUTA")"; [ -z "$OUTB" ] || OUTB="$(realpath "$OUTB")"
EDK2_COMMIT=edc6681206c1a8791981a2f911d2fb8b3d2f5768   # edk2-stable202402
export SOURCE_DATE_EPOCH=1706745600                    # 2024-02-01T00:00:00Z, frozen
export PYTHONHASHSEED=0
SUBMODULES="CryptoPkg/Library/OpensslLib/openssl CryptoPkg/Library/MbedTlsLib/mbedtls BaseTools/Source/C/BrotliCompress/brotli MdeModulePkg/Universal/RegularExpressionDxe/oniguruma MdeModulePkg/Library/BrotliCustomDecompressLib/brotli MdePkg/Library/MipiSysTLib/mipisyst MdePkg/Library/BaseFdtLib/libfdt ArmPkg/Library/ArmSoftFloatLib/berkeley-softfloat-3 RedfishPkg/Library/JsonLib/jansson"
"$(dirname "$0")/make-shims.sh" "$STAGE" "$STAGE/shims" >/dev/null
SHIMS="$STAGE/shims"
# two environments: BaseTools are HOST tools (host toolchain, host glibc);
# the firmware build (GCC5) is freestanding and uses the pinned staged toolchain via shims.
export NASM_PREFIX="$SHIMS/"
export IASL_PREFIX="$SHIMS/"
build_one() {
  local WORK="$1"
  rm -rf "$WORK"; mkdir -p "$WORK"
  cd "$WORK"
  # D4: sources come ONLY from the staged cache (staging is the only network phase). Any
  # git network protocol attempt fails (GIT_ALLOW_PROTOCOL=file); the enclosing bwrap
  # namespace has no network at all (--unshare-net, both canonical and hostile modes).
  export GIT_ALLOW_PROTOCOL=file
  cp -a "$STAGE/sources/edk2" edk2 || { echo "E_SOURCE_CACHE_MISSING $STAGE/sources/edk2"; exit 44; }
  cd edk2
  local HEAD; HEAD=$(git rev-parse HEAD)
  [ "$HEAD" = "$EDK2_COMMIT" ] || { echo "E_EDK2_COMMIT_MISMATCH $HEAD"; exit 41; }
  local sm want got
  for sm in $SUBMODULES; do
    want=$(git ls-tree HEAD -- "$sm" | awk '{print $3}')
    got=$(git -C "$sm" rev-parse HEAD 2>/dev/null || echo MISSING)
    [ "$want" = "$got" ] || { echo "E_SOURCE_PIN_MISMATCH $sm want $want got $got"; exit 44; }
  done
  git submodule status | awk '{print "submodule:",$2,$1}'
  # host-compat: only uuid (header + static lib) from the staged tree; no glibc mixing
  COMPAT="$WORK/host-compat"
  mkdir -p "$COMPAT/include/uuid" "$COMPAT/lib"
  cp "$STAGE/root/usr/include/uuid/uuid.h" "$COMPAT/include/uuid/uuid.h"
  cp "$STAGE/root/usr/lib/x86_64-linux-gnu/libuuid.a" "$COMPAT/lib/libuuid.a"
  mkdir -p "$COMPAT/bin"; ln -sf "$(command -v python3)" "$COMPAT/bin/python"
  env -u LIBRARY_PATH PATH="$COMPAT/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
    CPATH="$COMPAT/include" LIBRARY_PATH="$COMPAT/lib" \
    make -C BaseTools -j"$(nproc)" >/dev/null
  # B4: no uuid_* member may be pulled from the staged libuuid.a into any host-built
  # BaseTools binary, and no noble-glibc marker symbol may appear (latent glibc mixing)
  for bt in "$WORK/edk2/BaseTools/Source/C/bin/"*; do
    [ -f "$bt" ] || continue
    nm "$bt" 2>/dev/null | grep -q "uuid_" && { echo "E_UUID_MEMBER_LINKED $bt"; exit 50; }
    nm -u "$bt" 2>/dev/null | grep -q "__isoc23_" && { echo "E_GLIBC_MIX_SYMBOL $bt"; exit 50; }
  done
  # PATH must include COMPAT/bin (python) BEFORE edksetup: it probes for python
  export PATH="$SHIMS:$COMPAT/bin:$WORK/edk2/BaseTools/BinWrappers/PosixLike:$PATH"
  # edksetup parses "$@" — clear positional params or it treats our args as its options
  set --
  # and it loads any PREVIOUS configuration from exported WORKSPACE: scrub the edk2 env
  unset WORKSPACE EDK_TOOLS_PATH CONF_PATH PYTHON_COMMAND || true
  set +eu; . edksetup.sh > "$WORK/edksetup.log" 2>&1; set -eu
  [ -s Conf/tools_def.txt ] || { echo "E_TOOLSDEF_TEMPLATE_MISSING"; exit 45; }
  grep -q "^DEFINE GCC5_X64_CC_FLAGS" Conf/tools_def.txt || { echo "E_TOOLSDEF_TEMPLATE_CONTENT"; exit 46; }
  # frozen toolchain-flag recipe: GCC13 emits new warnings (disable -Werror only) and the
  # DEBUG target's LTO is disabled so the recipe is host-independent (no lto-plugin/toolchain
  # coupling); -ffile-prefix-map normalizes embedded build paths (41 absolute workdir paths);
  # -g0 drops DWARF: GenFw writes a wall-clock debug-directory timestamp per module (ignores
  # SOURCE_DATE_EPOCH), and ONE such byte cascades through the COMPRESSED PEI FV into a 1.9M-byte
  # FD diff (second dual-build mismatch, root-caused by region/cluster analysis). The DEBUG()
  # reject strings this ceremony relies on are regular string literals, unaffected by -g0.
  # Optimization/debug-info changes only, no semantic flag change.
  # appended AFTER edksetup has copied the real template
  cat >> Conf/tools_def.txt <<'TD'
DEFINE GCC5_X64_CC_FLAGS = DEF(GCC5_X64_CC_FLAGS) -Wno-error -Wno-stringop-overflow -Wno-array-bounds -Wno-stringop-overread
DEBUG_GCC5_X64_CC_FLAGS = DEF(GCC5_X64_CC_FLAGS) -g0 -ffile-prefix-map=$(WORKSPACE)=/ws
DEBUG_GCC5_X64_DLINK_FLAGS = DEF(GCC5_X64_DLINK_FLAGS) -Os
TD
  export WORKSPACE="$WORK/edk2"
  export EDK_TOOLS_PATH="$WORK/edk2/BaseTools"
  export CONF_PATH="$WORK/edk2/Conf"
  build -q -a X64 -t GCC5 -p OvmfPkg/OvmfPkgX64.dsc -b DEBUG \
    -D SECURE_BOOT_ENABLE=TRUE -D SMM_REQUIRE=TRUE \
    -D SOURCE_DATE_EPOCH=$SOURCE_DATE_EPOCH > "$WORK/fw-build.log" 2>&1
  tail -5 "$WORK/fw-build.log"
  cp Build/OvmfX64/DEBUG_GCC5/FV/OVMF_CODE.fd Build/OvmfX64/DEBUG_GCC5/FV/OVMF_VARS.fd "$WORK"/
  # B3: fail-closed dependency provenance scan: every dependency recorded by the build,
  # absolute or resolved-relative, must live under the work tree or the staged root.
  # Exception BY DESIGN: BaseTools are HOST tools (documented host-compat split; their host
  # gcc/make inputs are recorded in the deterministic manifest), so .d files under
  # edk2/BaseTools/ may additionally reference the declared host toolchain include paths.
  # Any other host path, anywhere, fails the build.
  WORK="$WORK" SROOT="$STAGE/root" python3 - <<'PYDEP'
import os,sys,glob
work=os.environ["WORK"]; sroot=os.environ["SROOT"]
HOST_OK=("/usr/include/","/usr/local/include/","/usr/lib/gcc/")
bad=[]
for df in glob.glob(work+"/**/*.d",recursive=True):
    if not os.path.isfile(df): continue
    host_tool = df.startswith(work+"/edk2/BaseTools/")
    dd=os.path.dirname(df)
    txt=open(df,errors="replace").read().replace("\\\n"," ")
    for tok in txt.split():
        if tok.endswith(":"): continue
        r=os.path.realpath(tok if os.path.isabs(tok) else os.path.join(dd,tok))
        if r==work or r==sroot or r.startswith(work+"/") or r.startswith(sroot+"/"):
            continue
        if host_tool and any(r.startswith(p) for p in HOST_OK):
            continue
        bad.append(f"{df}: {tok} -> {r}")
if bad:
    print("E_DEP_PATH_UNPINNED")
    print("\n".join(bad[:5]))
    sys.exit(51)
PYDEP
  cd /
}
# Canonical-path reproducibility (reviewer-accepted): GenFw embeds the absolute DLL path in
# each module's CodeView debug-directory PDB entry (-ffile-prefix-map cannot rewrite it; -g0
# does not remove the entry). The field is deterministic per workdir, so two builds at
# DIFFERENT paths always differ, and one such byte cascades through the COMPRESSED PEI FV
# into a ~1.9M-byte FD diff (third dual-build mismatch, root-caused via SecMain.dll 4-byte
# diff + GenFw source read: GenFw zeroes TimeDateStamp, so the residual was the PDB path;
# the earlier wall-clock-timestamp theory is SUPERSEDED). The firmware is therefore claimed
# reproducible at the CANONICAL path /build only, NOT path-independent; the PDB-path verifier
# (scan-pe-pdb-paths.py) rejects any host/workspace/user path in the accepted firmware.
# D4: the hostile build also runs with the network cut - the same merged-/usr namespace
# plus --unshare-net. The deliberately NON-canonical host path is preserved verbatim (it is
# the PDB-drift evidence); only network access is removed.
if [ "${CANON_MODE:-}" = hostile ] && [ "${IN_HOSTILE_NS:-}" != 1 ]; then
  WORKFIX="${CANON_REALWORK:-$(dirname "$OUTA")/ovmf-hostile}"
  mkdir -p "$WORKFIX" "$OUTA"
  for p in "$STAGE" "$OUTA" "$WORKFIX"; do
    [ "$(realpath "$p")" = "$p" ] || { echo "E_NONCANONICAL_INPUT_PATH $p"; exit 47; }
  done
  "$(dirname "$0")/make-shims.sh" "$STAGE" "$STAGE/shims" >/dev/null
  BWRAP="$STAGE/shims/bwrap"
  [ -x "$BWRAP" ] || { echo "E_NO_STAGED_BWRAP $BWRAP"; exit 91; }
  IN_HOSTILE_NS=1 CANON_REALWORK="$WORKFIX"     exec "$(dirname "$0")/bwrap-argv.sh" hostile "$BWRAP" - -- "$0" "$@"
fi
if [ "${CANON_MODE:-}" = hostile ]; then
  # deliberately different, host-flavored path: drift evidence for scan-pe-pdb-paths.py
  WORKFIX="${CANON_REALWORK:-$(dirname "$OUTA")/ovmf-hostile}"
  mkdir -p "$OUTA"   # hostile mode skips the canonical-namespace block that creates OUTA
  build_one "$WORKFIX"
  cp "$WORKFIX/OVMF_CODE.fd" "$WORKFIX/OVMF_VARS.fd" "$OUTA"/
  sha256sum "$OUTA/OVMF_CODE.fd" "$OUTA/OVMF_VARS.fd"
  echo "hostile-path build complete (expect PDB-path verifier REJECT)"
  exit 0
fi
# condition 2/3: canonical workdir, resolved, no symlinks, entire tree deleted between builds
WORKFIX=/build/work
[ "$(realpath "$WORKFIX")" = "$WORKFIX" ] || { echo "E_NONCANONICAL_WORKDIR"; exit 48; }
find /build -type l -print -quit | grep -q . && { echo "E_SYMLINK_IN_CANON_TREE"; exit 49; } || true
# condition 3: two clean sequential builds at the canonical path; build_one rm -rf's the
# whole tree and restores only pinned inputs (pinned edk2 commit + staged toolchain).
build_one "$WORKFIX"
cp "$WORKFIX/OVMF_CODE.fd" "$WORKFIX/OVMF_VARS.fd" "$OUTA"/
if [ "${CANON_SINGLE:-}" = 1 ]; then
  # tree intentionally KEPT: scan-pe-pdb-paths.py must parse every module .efi (condition 5)
  sha256sum "$OUTA/OVMF_CODE.fd" "$OUTA/OVMF_VARS.fd"
  echo "single canonical-path build complete (tree kept at real path $CANON_REALWORK/work)"
  exit 0
fi
build_one "$WORKFIX"
cp "$WORKFIX/OVMF_CODE.fd" "$WORKFIX/OVMF_VARS.fd" "$OUTB"/
rm -rf "$WORKFIX"
cmp "$OUTA/OVMF_CODE.fd" "$OUTB/OVMF_CODE.fd" || { echo "E_OVMF_DUAL_BUILD_MISMATCH CODE"; exit 42; }
cmp "$OUTA/OVMF_VARS.fd" "$OUTB/OVMF_VARS.fd" || { echo "E_OVMF_DUAL_BUILD_MISMATCH VARS"; exit 43; }
sha256sum "$OUTA/OVMF_CODE.fd" "$OUTA/OVMF_VARS.fd"
echo "dual OVMF DEBUG build byte-identical (canonical path /build)"
