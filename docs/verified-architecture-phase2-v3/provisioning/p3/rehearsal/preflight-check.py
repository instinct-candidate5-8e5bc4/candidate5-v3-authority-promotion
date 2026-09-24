#!/usr/bin/env python3
# NON_CERTIFYING_REHEARSAL preflight: static conformance only, starts no VM.
# usage: preflight-check.py <config.json> <stage_dir>
import sys, os, json, hashlib, subprocess

# Lane prefix resolution (#18 F1, peer #17 final ruling): committed config bytes keep the
# canonical NON_CERTIFYING_REHEARSAL prefix; at load time every absolute /tmp lane path
# resolves to the running lane by the SINGLE resolver (lane_resolve.py, component-wise,
# fail-closed). Identity in the rehearsal and certification lanes; the scratch lane exports
# PREFIX=NON_CERTIFYING_SCRATCH. Non-/tmp config values pass through untouched.
PREFIX=os.environ.get("PREFIX","")
if not PREFIX: print("E_PREFIX_UNSET"); sys.exit(97)
ALLOWED=os.environ.get("ALLOWED_PREFIX","")
if PREFIX!=ALLOWED: print("E_PREFIX_MISMATCH prefix=%s allowed=%s"%(PREFIX,ALLOWED)); sys.exit(97)
LANE_TMP="/tmp/%s-"%PREFIX
# peer run-35959397469 ruling H5a: never write bytecode for sibling imports even when the
# caller's env drops PYTHONDONTWRITEBYTECODE (sudo env_reset on run-ceremony.sh under sudo did, and the
# lane_resolve .pyc tripped E_CHECKOUT_MUTATED at the end-of-job gate).
sys.dont_write_bytecode = True
from lane_resolve import LaneError, resolve_config_value

FORBIDDEN = "OVMF_CI_SECURE_BOOT_UKI_PASS"
E = []
def fail(code, msg): E.append((code, msg))
def sha(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for c in iter(lambda: f.read(1<<20), b""): h.update(c)
    return h.hexdigest()

cfg_path, stage = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))

# 1) forbidden marker must appear in NO rehearsal file content. The whitelist below names
# the files whose ROLE is to define, guard, diff, or (for the one certification workflow)
# emit the marker; every other rehearsal file is forbidden from containing the string at all.
ALLOW_MARKER_REF={"preflight-check.py","NON_CERTIFYING_REHEARSAL-workflow.yml",
                  "OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml",
                  "R3-static-review-candidate.md","A3-publication-manifest.json",
                  "certification-vs-rehearsal.diff",
                  "derive-scratch.py"}  # #18: the generator carries the derived workflow's banner, which names the marker inside its never-emit rule
for root,_,files in os.walk(here):
    for f in files:
        p=os.path.join(root,f)
        try: data=open(p,errors="replace").read()
        except Exception: continue
        if FORBIDDEN in data and os.path.basename(p) not in ALLOW_MARKER_REF:
            fail("E_FORBIDDEN_MARKER_REF", p)

# 1b) workflow placement (reviewer ruling): exactly ONE copy of each workflow, at
# .github/workflows/ on the candidate commit; the docs/ copies must not exist.
repo_root=os.path.normpath(os.path.join(here,"..","..","..","..",".."))
wf_dir=os.path.join(repo_root,".github","workflows")
for fn in ("NON_CERTIFYING_REHEARSAL-workflow.yml","OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml"):
    if os.path.exists(os.path.join(here,fn)): fail("E_STALE_DOCS_WORKFLOW", fn)
    if not os.path.exists(os.path.join(wf_dir,fn)): fail("E_WORKFLOW_MISSING", fn)

# 1c) scratch-prefix conformance (D1 static gate): every frozen script/config and BOTH
# workflows must use ONLY NON_CERTIFYING_REHEARSAL-prefixed /tmp and /var/tmp scratch paths
# (literal $PREFIX forms are allowed because both workflows pin PREFIX to exactly
# NON_CERTIFYING_REHEARSAL). The certification workflow runs the same frozen bytes, so any
# certification-labeled scratch path would diverge from the rehearsed scripts and fail.
import re as _re
SCRATCH_OK=("/tmp/NON_CERTIFYING_REHEARSAL","/var/tmp/NON_CERTIFYING_REHEARSAL")
for fn in ("NON_CERTIFYING_REHEARSAL-workflow.yml","OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml"):
    wtext=open(os.path.join(wf_dir,fn),errors="replace").read()
    if "\n  PREFIX: NON_CERTIFYING_REHEARSAL\n" not in "\n"+wtext:
        fail("E_WORKFLOW_PREFIX_MISMATCH", fn)
for fn in ("config.json","rehearsal-harness.py","run-ceremony.sh","rehearsal-enroll.sh"):
    for m in _re.finditer(r"/(?:var/)?tmp/[A-Za-z0-9_][A-Za-z0-9_./-]*", open(os.path.join(here,fn),errors="replace").read()):
        if not m.group(0).startswith(SCRATCH_OK):
            fail("E_SCRATCH_PREFIX_MISMATCH", fn+" "+m.group(0))
for fn in ("NON_CERTIFYING_REHEARSAL-workflow.yml","OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml"):
    for m in _re.finditer(r"/(?:var/)?tmp/[A-Za-z0-9_][A-Za-z0-9_./-]*", open(os.path.join(wf_dir,fn),errors="replace").read()):
        if not m.group(0).startswith(SCRATCH_OK):
            fail("E_SCRATCH_PREFIX_MISMATCH", fn+" "+m.group(0))

# 2) platform.lock: every deb staged, hash-verified, no extras
lock=json.load(open(os.path.join(here,"platform.lock.json")))
debdir=os.path.join(stage,"debs")
names_expected=set()
for e in lock["packages"]:
    fn=e["url"].rsplit("/",1)[1]; names_expected.add(fn)
    p=os.path.join(debdir,fn)
    if not os.path.exists(p): fail("E_LOCK_MISSING_DEB", fn); continue
    if sha(p)!=e["sha256"]: fail("E_LOCK_HASH_MISMATCH", fn)
if os.path.isdir(debdir):
    for f in os.listdir(debdir):
        if f not in names_expected: fail("E_LOCK_EXTRA_FILES", f)

# 3) pristine VARS from the extracted ovmf deb
vars_p=os.path.join(stage,"root/usr/share/OVMF/OVMF_VARS_4M.fd")
if not os.path.exists(vars_p): fail("E_VARS_MISSING", vars_p)
elif sha(vars_p)!="5d2ac383371b408398accee7ec27c8c09ea5b74a0de0ceea6513388b15be5d1e":
    fail("E_VARS_PRISTINE_MISMATCH", sha(vars_p))

# 4) evidence inputs, exact hashes
ev=os.path.join(here,"evidence")
EXPECT={"successor-signed.efi":("133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1",21166416),
        "successor-unsigned.efi":("ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536",21164544),
        "c5-signing-cert.der":("7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441",1092),
        "F-WRONGSIG.efi":("44706c4a02bc013a248d4ba228b731471d373a813ea7fd921416c9119071b50a",21166128),
        "F-HOSTILEUKI.efi":("5f6cfe5cf11b5e71158ce3a5736175eae925f33dec2a308370618c3aceec939e",21166112)}
for fn,(h,sz) in EXPECT.items():
    p=os.path.join(ev,fn)
    if not os.path.exists(p): fail("E_EVIDENCE_MISSING", fn); continue
    if os.path.getsize(p)!=sz or sha(p)!=h: fail("E_EVIDENCE_HASH_MISMATCH", fn)

# 5) config schema: no wildcards, exact values only
try: cfg=resolve_config_value(json.load(open(cfg_path)),PREFIX)
except LaneError as e: fail("E_CONFIG_LANE_RESOLVE", e.code+" "+e.detail); cfg={}
def scan_wildcards(o, path=""):
    if isinstance(o, dict):
        for k,v in o.items(): scan_wildcards(v, path+"."+k)
    elif isinstance(o, list):
        for i,v in enumerate(o): scan_wildcards(v, path+"[%d]"%i)
    elif isinstance(o, str):
        if "*" in o or "?" in o or "TBD" in o or "FILL" in o: fail("E_CONFIG_WILDCARD", path+"="+o)
scan_wildcards(cfg)
for req in ("qemu","cpu_model","memory_mb","v3_serials","disk_dir","vars_parser","ovmf_code_debug","ovmf_vars_pristine","enroll_app","cases"):
    if req not in cfg: fail("E_CONFIG_MISSING_FIELD", req)
for c in cfg.get("cases",[]):
    for req in ("id","vars_template","esp","firmware","expect"):
        if req not in c: fail("E_CONFIG_CASE_MISSING_FIELD", c.get("id","?")+"."+req)
    for pth_key in ("vars_template","esp","firmware"):
        p=c.get(pth_key,"")
        # build-output/ and out/ are generated during the ceremony by hash-pinned producers;
        # /tmp/$PREFIX-stage/ is the staged tree (verified above); both are lane-prefixed
        generated=("build-output/","out/","/tmp/%s-stage/"%PREFIX,"/tmp/%s-out/"%PREFIX)
        if p and not any(p.startswith(g) for g in generated) and not os.path.exists(p):
            fail("E_CONFIG_PATH_MISSING", c["id"]+"."+pth_key)

# 6) staged tool presence
for t in ("usr/bin/qemu-system-x86_64","usr/bin/sbvarsign","usr/bin/openssl","usr/sbin/mkfs.vfat","usr/sbin/fsck.vfat","sbin/sgdisk","usr/bin/nasm","usr/bin/iasl","usr/bin/gcc-13","usr/bin/bwrap"):
    if not os.path.exists(os.path.join(stage,"root",t)): fail("E_STAGED_TOOL_MISSING", t)

# 6b) batch1r3 A1 exec bits: every git-tracked script under provisioning/p3 must be mode
# 100755 and pass test -x (covers every transitively invoked ./x, ../x, "$HERE/x" form)
import subprocess as _sp
p3_root=os.path.normpath(os.path.join(here,".."))
ls=_sp.run(["git","-C",repo_root,"ls-files","-s","docs/verified-architecture-phase2-v3/provisioning/p3"],
           capture_output=True,text=True)
if ls.returncode!=0: fail("E_GIT_LSFILES", ls.stderr[:200])
else:
    for line in ls.stdout.splitlines():
        parts=line.split(None,3)
        if len(parts)<4: continue
        mode,path=parts[0],parts[3]
        if path.endswith((".sh",".py")):
            if mode!="100755": fail("E_EXEC_BIT", path+" mode="+mode)
            fp=os.path.join(repo_root,path)
            if not os.access(fp,os.X_OK): fail("E_EXEC_BIT", path+" not -x")

# 6c) batch1r3 C1: no ceremony state in the committed tree
for stale in ("build-output","disks","prep"):
    if os.path.exists(os.path.join(here,stale)): fail("E_STALE_STATE_COMMITTED", stale)

# 6d) batch1r3 B1: no direct staged-root execs outside make-shims.sh (fixture-generate.sh is
# the allow-listed known offline limitation, B1/R3; bwrap-argv.sh carries $RT only as bwrap
# bind ARGUMENTS, never as a command word)
import re as _re2
EXEC_RE=_re2.compile(r'(?:^|[|;&(]\s*|&&\s*|\|\|\s*)"\$(?:RT|SB|STAGE)/', _re2.M)
for root,_,files in os.walk(p3_root):
    for f in files:
        if not f.endswith(".sh"): continue
        if f in ("make-shims.sh","fixture-generate.sh"): continue
        p=os.path.join(root,f)
        for m in EXEC_RE.finditer(open(p,errors="replace").read()):
            fail("E_DIRECT_STAGED_EXEC", p)

# 6e) batch1r3 D1: the shared bwrap argv helper is the ONLY bwrap invocation in the build
# script and preflight, and the preflight executes the exact canonical argv against a
# temporary realwork dir with `-- true`
for fn in ("build-ovmf-debug.sh",):
    text=open(os.path.join(here,fn),errors="replace").read()
    if "bwrap-argv.sh" not in text: fail("E_BWRAP_HELPER_MISSING", fn)
    for ln,line in enumerate(text.splitlines(),1):
        t=line.strip()
        if "bwrap" not in line or t.startswith("#"): continue
        if "bwrap-argv.sh" in line or t.startswith("BWRAP=") or "$BWRAP" in line: continue
        fail("E_BWRAP_DIRECT", fn+":%d"%ln)
_tmp=None
try:
    # the launcher must be the staged-loader SHIM, exactly as build-ovmf-debug.sh invokes it
    # (the raw staged binary cannot run on the host loader), so the argv is truly identical
    _sp.run([os.path.join(here,"make-shims.sh"),stage,os.path.join(stage,"shims")],
            capture_output=True,text=True,check=True)
    _tmp=_sp.check_output(["mktemp","-d",LANE_TMP+"preflight-realwork.XXXXXX"],text=True).strip()
    r=_sp.run([os.path.join(here,"bwrap-argv.sh"),"canonical",
               os.path.join(stage,"shims","bwrap"),_tmp,"--","true"],
              capture_output=True,text=True)
    if r.returncode!=0: fail("E_BWRAP_ARGV_MISMATCH",(r.stderr or r.stdout)[:200])
except Exception as e:
    fail("E_BWRAP_ARGV_MISMATCH",str(e)[:200])
finally:
    if _tmp: _sp.run(["rm","-rf",_tmp])

# 6e2) scratch-6 ruling condition 5 (D1-class static gate extended to qemu-smoke.sh and
# bwrap-argv.sh): the smoke's namespace argv is frozen in argv-freeze.json (smoke_namespace)
# and consumed by qemu-smoke.sh at runtime. Statically verify the block's integrity (exact
# masked set, sha256 of the NUL-joined structural args, sentinel tokens, no masked path
# leaking into the structural args) and both files' declared forms: the smoke script must
# consume the block (no inline argv/mask arrays, exactly one declared self-wrap exec), and
# the D1 helper must retain its pinned canonical form.
_fz2=json.load(open(os.path.join(here,"argv-freeze.json")))
_sn=_fz2.get("smoke_namespace")
if not isinstance(_sn,dict): fail("E_SMOKE_NS_MISSING","smoke_namespace block absent from argv-freeze.json")
for _k in ("root","masked","structural_args","structural_sha256"):
    if _k not in _sn: fail("E_SMOKE_NS_SCHEMA","smoke_namespace."+_k)
if _sn["masked"]!=["/usr/share/qemu","/usr/share/seabios","/usr/lib/ipxe","/usr/lib/x86_64-linux-gnu/qemu"]:
    fail("E_SMOKE_NS_MASKED","masked set drifted: "+repr(_sn["masked"]))
_sa=_sn["structural_args"]
import hashlib as _hl2
if _hl2.sha256("\0".join(_sa).encode()).hexdigest()!=_sn["structural_sha256"]:
    fail("E_SMOKE_NS_SHA","structural_sha256 does not match structural_args")
for _sentinel in ("--unshare-all","--dev-bind","/dev/kvm","--tmpfs","$STAGE"):
    if _sentinel not in _sa: fail("E_SMOKE_NS_FORM","structural_args missing "+_sentinel)
for _m in _sn["masked"]:
    if _m in _sa: fail("E_SMOKE_NS_LEAK","masked path inside structural_args: "+_m)
_st=open(os.path.join(here,"qemu-smoke.sh"),errors="replace").read()
if "smoke_namespace" not in _st: fail("E_SMOKE_NS_UNUSED","qemu-smoke.sh does not consume the frozen block")
if "MASKED=(" in _st or "args=(--unshare-all" in _st: fail("E_SMOKE_NS_INLINE","qemu-smoke.sh carries inline namespace argv")
if _st.count('exec "$BWRAP"')!=1: fail("E_SMOKE_NS_EXEC","qemu-smoke.sh must have exactly one declared self-wrap exec")
_bh=open(os.path.join(here,"bwrap-argv.sh"),errors="replace").read()
if "COMMON=(" not in _bh or _bh.count('exec "$BWRAP" "${COMMON[@]}"')!=2:
    fail("E_BWRAP_HELPER_FORM","bwrap-argv.sh lost its pinned canonical form")

# 6e3) peer adjudication (3) of the additive smoke_namespace block: the pre-existing frozen
# case argv are pinned by INDEPENDENT sha256 constants HERE (outside argv-freeze.json), so
# the addition provably cannot perturb them; the block must be consumed by qemu-smoke.sh
# ONLY (never the ceremony); and the freeze file's top-level key set must be exactly the
# pre-addition keys plus smoke_namespace (additive-only proof).
CASE_ARGV_PINS=(
    ("NON_CERTIFYING_REHEARSAL-R1-positive", "c581e7dda5d855f2dc4be9fc587765305220107cc8225a87a27ce06b1bbee0b0"),
    ("NON_CERTIFYING_REHEARSAL-R2-N1-unsigned", "f382e94075d87cd0cb00df84b1f393f59ff7ee0e5de138f668713309ab2b1edc"),
    ("NON_CERTIFYING_REHEARSAL-R3-N2-wrongsig", "46d5c1c485cec634c3e0546e03395184b089d11ded01ffef0ca4db588bce6072"),
    ("NON_CERTIFYING_REHEARSAL-R4-N3a-hostile-sole-db", "daa8eee9131d7d2cc5ad48ceb8e1f6b164327dbf489412d8761aa83289c04215"),
    ("NON_CERTIFYING_REHEARSAL-R5-N3b-hostile-widened-db", "4a780d858f457e078c4a982d007cbfafd9f5f66e797c83b00ff523456c0df156"),
    ("NON_CERTIFYING_REHEARSAL-R6-N3c-hostile-fresh-sole-db", "6f2fc5a541aebbd23c4dc875d405519a2d834ea3b8376d71c6a3e9a8313bac10"),
    ("NON_CERTIFYING_REHEARSAL-R7-release-sibling-behavior-only", "2d450e95e778d9f1d1c9d165993c31023fb00c9b12c585bd068be89749774b05"),
)
if len(_fz2["cases"])!=len(CASE_ARGV_PINS):
    fail("E_CASE_ARGV_PIN","case count drifted: %d != %d"%(len(_fz2["cases"]),len(CASE_ARGV_PINS)))
for _cid,_pin in CASE_ARGV_PINS:
    _m=[c for c in _fz2["cases"] if c["id"]==_cid]
    if len(_m)!=1: fail("E_CASE_ARGV_PIN","case id missing or duplicated: "+_cid); continue
    _h=_hl2.sha256("\0".join(_m[0]["argv"]).encode()).hexdigest()
    if _h!=_pin: fail("E_CASE_ARGV_PIN",_cid+" argv sha256 drifted: "+_h)
    # F8 (peer, freeze blocker): ONE convention everywhere - sha256 over the NUL-joined
    # argv WITHOUT trailing NUL, identical to argv-freeze.json's stored argv_sha256 and
    # rehearsal-harness.py's det record. Cross-check the stored field so the external
    # pins and the frozen file's own fields cannot drift apart silently.
    if _h!=_m[0].get("argv_sha256"): fail("E_CASE_ARGV_PIN_STORED",_cid+" stored argv_sha256 disagrees: "+repr(_m[0].get("argv_sha256")))
EXPECTED_KEYS={"bwrap_argv","bwrap_helper","cases","cpu_model","memory_mb","note","qemu",
               "qmp_sock_max_bytes","qmp_sock_template","schema","v3_serials",
               "enroll_qmp_sock_basename"}
if set(_fz2.keys())!=EXPECTED_KEYS|{"smoke_namespace"}:
    fail("E_FREEZE_KEYS","argv-freeze.json top-level keys drifted: "+repr(sorted(_fz2.keys())))
# 6e6) peer FINAL COUNT RULING: pin the EXACT prefix occurrence counts (grep -o ... | wc -l,
# not line counts) of BOTH lane workflows, recomputed at the frozen bytes. Any edit to either
# workflow that adds/removes a literal NON_CERTIFYING_REHEARSAL occurrence fails closed here.
import subprocess as _sp
# counts updated for batch1-r3 #10 (peer N8/N9/N1b gates): cert 42->44 (N8 log path x2),
# rehearsal 74->77 (N8 log path x2 + env2-manifest step-name literal); rehearsal 77->78
# (peer run-12 C4-addendum E_XCHECK_SKIPPED strictness step name, one literal).
for _wf,_want in (("../../../../../.github/workflows/OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml",44),
                  ("../../../../../.github/workflows/NON_CERTIFYING_REHEARSAL-workflow.yml",78)):
    _n=len(_sp.run(["grep","-o","NON_CERTIFYING_REHEARSAL",os.path.join(here,_wf)],
                   capture_output=True,text=True,check=True).stdout.splitlines())
    if _n!=_want:
        fail("E_PREFIX_COUNT_MISMATCH",_wf+" occurrences="+str(_n)+" pinned="+str(_want))

# 6e9) peer pushed-byte review 3(a): the planted-fault hook is scratch-only - the
# certification and rehearsal workflows must contain ZERO ENROLL_PLANTED_FAULT references;
# the scratch workflow MUST carry the must-show steps (guards a silent derivation drop).
for _wf,_lo,_hi in (("../../../../../.github/workflows/OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml",0,0),
                    ("../../../../../.github/workflows/NON_CERTIFYING_REHEARSAL-workflow.yml",0,0),
                    ("../../../../../.github/workflows/NON_CERTIFYING_SCRATCH-workflow.yml",1,10**9)):
    _n=len(_sp.run(["grep","-o","ENROLL_PLANTED_FAULT",os.path.join(here,_wf)],
                   capture_output=True,text=True).stdout.splitlines())
    if not (_lo <= _n <= _hi):
        fail("E_PLANTED_FAULT_WORKFLOW_SCOPE",_wf+" ENROLL_PLANTED_FAULT occurrences="+str(_n)+" (cert+rehearsal must be 0; scratch must be >=1)")

# 6e10) peer #16 D15-2(b): DERIVATION CONFORMANCE. The derived scratch workflow must
# contain ZERO canonical-path occurrences (NON_CERTIFYING_REHEARSAL) and ZERO remap-needle
# occurrences (CANON_TMP): every canonical-config path reaches it ONLY through
# resolve-lane-path.sh. A canonical literal in the derived workflow means the derivation
# bypassed the shared resolver (the run-15 PF-4 defect class).
_scwf=os.path.join(here,"../../../../../.github/workflows/NON_CERTIFYING_SCRATCH-workflow.yml")
if not os.path.exists(_scwf):
    fail("E_DERIVED_CANON_LITERAL","scratch workflow missing: "+_scwf)
else:
    for _tok in ("NON_CERTIFYING_REHEARSAL","CANON_TMP"):
        _r=_sp.run(["grep","-o",_tok,_scwf],capture_output=True,text=True)
        if _r.returncode not in (0,1):
            fail("E_DERIVED_CANON_LITERAL","grep rc="+str(_r.returncode)+" on scratch workflow ("+_tok+") - cannot prove purity")
            continue
        _n=len(_r.stdout.splitlines())
        if _n!=0:
            fail("E_DERIVED_CANON_LITERAL","scratch workflow carries "+str(_n)+" "+_tok+" occurrences (must be 0; resolve via resolve-lane-path.sh)")

# 6e11) #18 F5 (peer #17 final ruling, extending 6e10 to RESOLVED config paths): after the
# single resolver maps the committed config, no resolved absolute /tmp path may retain a
# canonical component. Enforced in every lane whose prefix is NOT the canonical token (in
# the rehearsal/certification lane the lane token IS the canonical token, so the check is
# vacuous there by construction; it bites in the scratch lane, where any surviving
# canonical component proves a resolution bypass). The ruled exemptions are structural,
# never listed strings: relative build-output esp filenames, case IDs, and schema strings
# do not start with /tmp and never enter this check (the esp_variant_sha256 assertion
# site - run-ceremony.sh PINS[1..3] over build-output/esp-variant/ - is the writer/reader
# agreement for those relative names).
def _resolved_paths(o):
    if isinstance(o,dict):
        for v in o.values():
            yield from _resolved_paths(v)
    elif isinstance(o,list):
        for v in o:
            yield from _resolved_paths(v)
    elif isinstance(o,str) and o.startswith("/tmp/"):
        yield o
if PREFIX!="NON_CERTIFYING_REHEARSAL":
    for _rp in _resolved_paths(cfg):
        for _comp in _rp.split("/")[2:]:
            if _comp=="NON_CERTIFYING_REHEARSAL" or _comp.startswith("NON_CERTIFYING_REHEARSAL-"):
                fail("E_RESOLVED_CANON_COMPONENT","resolved config path retains a canonical component: "+_rp)

# 6e12) #18 (peer directive): DERIVATION BYTE-IDENTITY. Re-deriving the scratch workflow
# from the committed NON_CERTIFYING_REHEARSAL workflow with the committed generator must
# reproduce the committed NON_CERTIFYING_SCRATCH workflow BYTE-IDENTICALLY; any drift means
# the generated file was hand-edited or the generator is stale.
import tempfile as _tf
_dfd,_dp=_tf.mkstemp(suffix=".yml"); os.close(_dfd)
try:
    _der=_sp.run([sys.executable,os.path.join(here,"derive-scratch.py"),
                  os.path.join(wf_dir,"NON_CERTIFYING_REHEARSAL-workflow.yml"),_dp],
                 capture_output=True)
    if _der.returncode!=0:
        fail("E_SCRATCH_DERIVE_DRIFT","derive-scratch.py rc=%s: %s"%(_der.returncode,(_der.stderr or _der.stdout)[:200]))
    elif open(_dp,"rb").read()!=open(_scwf,"rb").read():
        fail("E_SCRATCH_DERIVE_DRIFT","re-derived scratch workflow differs from the committed bytes")
finally:
    os.unlink(_dp)

# 6e13) #18 F1 conformance: resolve-lane-path.sh (the bash caller) and lane_resolve.py (the
# single definition) must agree on rc AND stdout over a corpus covering: nested canonical,
# leading-only canonical, already-lane idempotence, the run-17 mixed lane/canonical shape,
# foreign-lane, non-leading-token, token-free /tmp, and the G1 dotseg probes (traversal,
# dot component, empty component - the peer #18 G1 reviewer inputs; the last six must fail
# both).
_CONFORM=("/tmp/NON_CERTIFYING_REHEARSAL-out/NON_CERTIFYING_REHEARSAL-enroll-sole/vars-enrolled.fd",
          "/tmp/NON_CERTIFYING_REHEARSAL-stage/root/usr/share/OVMF/OVMF_VARS_4M.fd",
          "/tmp/%s-out/%s-enroll-sole/vars-enrolled.fd"%(PREFIX,PREFIX),
          "/tmp/%s-out/NON_CERTIFYING_REHEARSAL-enroll-sole/vars-enrolled.fd"%PREFIX,
          "/tmp/NON_CERTIFYING_FOREIGN-x",
          "/tmp/x-NON_CERTIFYING_REHEARSAL-y",
          "/tmp/token-free",
          "/tmp/NON_CERTIFYING_REHEARSAL-out/../../etc/passwd",
          "/tmp/NON_CERTIFYING_REHEARSAL-out/./x",
          "/tmp/NON_CERTIFYING_REHEARSAL-out//x")
for _i,_cp in enumerate(_CONFORM):
    _b=_sp.run([os.path.join(here,"resolve-lane-path.sh"),_cp,PREFIX],capture_output=True,text=True)
    _y=_sp.run([sys.executable,os.path.join(here,"lane_resolve.py"),"resolve",_cp,PREFIX],capture_output=True,text=True)
    if (_b.returncode,_b.stdout)!=(_y.returncode,_y.stdout):
        fail("E_LANE_RESOLVER_CONFORMANCE","bash/python resolver disagree on %s: bash(rc=%s,out=%r) python(rc=%s,out=%r)"%(_cp,_b.returncode,_b.stdout.strip(),_y.returncode,_y.stdout.strip()))
    if _i<4 and _b.returncode!=0:
        fail("E_LANE_RESOLVER_CONFORMANCE","resolver rejected a valid lane path: "+_cp+" rc="+str(_b.returncode))
    if _i>=4 and _b.returncode==0:
        fail("E_LANE_RESOLVER_CONFORMANCE","resolver accepted an invalid lane path: "+_cp)

# 6e7) peer N4: PREFIX==ALLOWED_PREFIX equality alone accepts any literal from the same
# workflow - bind the literals to the LANE statically per workflow file.
import re as _re
for _wf,_lit in (("../../../../../.github/workflows/NON_CERTIFYING_SCRATCH-workflow.yml","NON_CERTIFYING_SCRATCH"),
                 ("../../../../../.github/workflows/NON_CERTIFYING_REHEARSAL-workflow.yml","NON_CERTIFYING_REHEARSAL"),
                 ("../../../../../.github/workflows/OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml","NON_CERTIFYING_REHEARSAL")):
    _t=open(os.path.join(here,_wf),errors="replace").read()
    for _k in ("PREFIX","ALLOWED_PREFIX"):
        _m=_re.search(r"^  %s: (\S+)\s*$" % _k, _t, _re.M)
        if not _m or _m.group(1)!=_lit:
            fail("E_PREFIX_LANE_LITERAL",_wf+" "+_k+" must be exactly "+_lit+" (found "+(_m.group(1) if _m else "<absent>")+")")

# 6e8) peer N1: the enrollment QMP socket is pinned and must never reach the upload - pin the
# basename, the sun_path assert, and the post-query unlink in rehearsal-enroll.sh.
_qbs=_fz2.get("enroll_qmp_sock_basename")
if _qbs != "qmp.sock":
    fail("E_FREEZE_KEYS","argv-freeze.json enroll_qmp_sock_basename drifted: "+repr(_qbs))
_en=open(os.path.join(here,"rehearsal-enroll.sh"),errors="replace").read()
for _pat in ('QMP_SOCK="$EVD/'+_qbs+'"',"[ \"${#QMP_SOCK}\" -le 107 ]","E_QMP_PATH_TOO_LONG",
             '-qmp unix:"$QMP_SOCK",server,nowait','rm -f "$QMP_SOCK"'):
    if _pat not in _en:
        fail("E_QMP_SOCK_PIN","rehearsal-enroll.sh lost pinned QMP-socket handling: "+_pat)

# 6e5) peer: the ESP-builder chatter acceptance stands ONLY while the image-hash log lines
# exist - pin their presence fail-closed so they cannot be silently dropped.
for _f,_pat in (("../build-esp-image.sh",'echo "image $(stat -c %s \"$IMG\") $(sha256sum \"$IMG\"'),
                ("build-esp-variant.sh",'echo "image $(stat -c %s \"$IMG\") $(sha256sum \"$IMG\"')):
    if _pat not in open(os.path.join(here,_f),errors="replace").read():
        fail("E_ESP_HASHLINE_MISSING",_f+" lost its image-hash log line (chatter acceptance void)")

for _fn in sorted(os.listdir(here)):
    if _fn.endswith((".sh",".py")) and _fn not in ("preflight-check.py","qemu-smoke.sh"):
        if "smoke_namespace" in open(os.path.join(here,_fn),errors="replace").read():
            fail("E_SMOKE_NS_CONSUMER","smoke_namespace referenced outside qemu-smoke.sh: "+_fn)

# 6e4) peer adjudication (2): canonical schema identifiers remain only as PINNED constants
# carrying no verdict/lane-claim words, and every schema report carries an explicit lane
# field sourced from the allowlisted PREFIX (the producers' exact forms are pinned here).
SCHEMA_PINS=("NON_CERTIFYING_REHEARSAL-manifest/v1",
             "NON_CERTIFYING_REHEARSAL-source-manifest/v1",
             "NON_CERTIFYING_REHEARSAL-enroll-predicate/v1",
             "NON_CERTIFYING_REHEARSAL-preflight/v1")
for _s in SCHEMA_PINS:
    for _w in ("pass","verdict","certification","accepted","verified"):
        if _w in _s.lower(): fail("E_SCHEMA_PIN","schema id carries a claim word: "+_s)
_sc=open(os.path.join(here,"run-ceremony.sh"),errors="replace").read()
if "'NON_CERTIFYING_REHEARSAL-manifest/v1','lane':os.environ['PREFIX']" not in _sc:
    fail("E_SCHEMA_LANE","run-ceremony.sh manifest lost its pinned schema+lane form")
_sp2=open(os.path.join(here,"stage-platform.sh"),errors="replace").read()
if "'NON_CERTIFYING_REHEARSAL-source-manifest/v1','lane':os.environ['PREFIX']" not in _sp2:
    fail("E_SCHEMA_LANE","stage-platform.sh source-manifest lost its pinned schema+lane form")
_ep=open(os.path.join(here,"enroll-predicate-check.py"),errors="replace").read()
if _ep.count('"NON_CERTIFYING_REHEARSAL-enroll-predicate/v1", "lane": PREFIX')!=2:
    fail("E_SCHEMA_LANE","enroll-predicate-check.py reports lost their pinned schema+lane form")
_rh=open(os.path.join(here,"rehearsal-harness.py"),errors="replace").read()
if '"suite":"NON_CERTIFYING_REHEARSAL","lane":PREFIX' not in _rh:
    fail("E_SCHEMA_LANE","rehearsal-harness.py suite report lost its pinned schema+lane form")

# 6f) batch1r3 C7: no upload path may be a prefix of the enrollment prep dir
prep_abs=os.path.join(here,"prep")
for fn in ("NON_CERTIFYING_REHEARSAL-workflow.yml","OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml"):
    wtext=open(os.path.join(wf_dir,fn),errors="replace").read()
    for m in _re.finditer(r"path:\s*(\S+)", wtext):
        up=m.group(1).replace("$PREFIX","NON_CERTIFYING_REHEARSAL").replace("${{ env.PREFIX }}","NON_CERTIFYING_REHEARSAL")
        if up.startswith("/") and (prep_abs.startswith(up) or up.startswith(prep_abs)):
            fail("E_UPLOAD_PREFIX_PREP", fn+" "+up)

# 6g) batch1r3 D7: platform.lock.json must carry ONE well-formed snapshot_ts, and
# stage-platform.sh must build snapshot URLs from exactly that field and nothing else
lock_ts=lock.get("snapshot_ts")
if not lock_ts or not _re.fullmatch(r"\d{8}T\d{6}Z", lock_ts or ""):
    fail("E_SNAPSHOT_TS", repr(lock_ts))
_sp_text=open(os.path.join(here,"stage-platform.sh"),errors="replace").read()
if "snapshot.ubuntu.com" not in _sp_text:
    fail("E_SNAPSHOT_TS","stage-platform.sh has no snapshot fallback")
for m in _re.finditer(r"snapshot\.ubuntu\.com/ubuntu/([^/\s\"\']+)", _sp_text):
    if m.group(1) not in ("%s","$SNAPSHOT_TS","${SNAPSHOT_TS}"):
        fail("E_SNAPSHOT_TS","hardcoded snapshot base "+m.group(1))
if m is not None and m.group(1)=="%s" and "lock.get('snapshot_ts')" not in _sp_text and 'lock.get("snapshot_ts")' not in _sp_text:
    fail("E_SNAPSHOT_TS","snapshot URL not built from the lock field")

# 6h) batch1r3 addendum2 (2c): python imports are stdlib-only, checked against an explicit
# allow-list, over every committed .py file AND every python heredoc body in committed .sh
import re as _re3
PY_ALLOW={"collections","datetime","glob","hashlib","json","lzma","os","re",
          "shutil","signal","socket","struct","subprocess","sys","time","urllib",
          "tempfile","uuid"}  # #16: uuid (E1 GUID canonicalization), tempfile (verify-auth scratch)
def _py_mods(text):
    mods=set()
    for ln in text.splitlines():
        s=ln.strip()
        m=_re3.match(r"import\s+([A-Za-z0-9_.,\s]+)",s)
        if m:
            for part in m.group(1).split(","):
                nm=part.strip().split(" as ")[0].strip()
                if _re3.fullmatch(r"[A-Za-z0-9_.]+",nm or ""): mods.add(nm.split(".")[0])
            continue
        m=_re3.match(r"from\s+([A-Za-z0-9_.]+)\s+import\s+",s)
        if m: mods.add(m.group(1).split(".")[0])
    return mods
_py_files=[os.path.join(here,f) for f in sorted(os.listdir(here)) if f.endswith(".py")]
_py_files+=[os.path.join(p3_root,f) for f in sorted(os.listdir(p3_root)) if f.endswith(".py")]
for _p in _py_files:
    _bad=_py_mods(open(_p,errors="replace").read())-PY_ALLOW
    # #18 F1 (peer #17 final ruling): NARROW named allowance - exactly the reviewed local
    # resolver module "lane_resolve" (this directory, exec-bit pinned, stdlib-only itself),
    # ONLY in its two committed consumers. No wildcard, no other file, no other module.
    if os.path.basename(_p) in ("rehearsal-harness.py","preflight-check.py"):
        _bad-={"lane_resolve"}
    # #18 (same shape): derive-scratch.py's REAL imports are re+sys; the generator embeds
    # the workflow step TEXT it injects, whose fetch-test heredoc carries an
    # "import http.server" line (stdlib, executed by the CI runner inside the step, never
    # by the generator). This line-regex scan cannot see the string boundary, so the one
    # phantom module is allow-listed for this one file only.
    if os.path.basename(_p)=="derive-scratch.py":
        _bad-={"http"}
    if _bad: fail("E_PYTHON_IMPORTS",_p+" "+",".join(sorted(_bad)))
_sh_files=[os.path.join(here,f) for f in sorted(os.listdir(here)) if f.endswith(".sh")]
_sh_files.append(os.path.join(p3_root,"build-esp-image.sh"))
for _p in _sh_files:
    if not os.path.exists(_p): continue
    _on=False; _body=[]
    for _ln in open(_p,errors="replace").read().splitlines()+["PY"]:
        if _re3.search(r"<<\s*['\"]?PY",_ln): _on=True; _body=[]; continue
        if _on and _ln in ("PY","PYEOF"):
            _bad=_py_mods("\n".join(_body))-PY_ALLOW
            # #15 S2 (peer condition, run-14 verdict): NARROW named allowance - exactly
            # the reviewed local fetch helper module "fetch_locked" (this directory,
            # exec-bit pinned, stdlib-only itself), ONLY inside stage-platform.sh
            # heredocs. No wildcard, no other file, no other module. The lockgen index
            # loops live in the workflow YAML (outside this scan) and are covered by
            # the staging import smoke + F6 case 0 at runtime.
            if os.path.basename(_p)=="stage-platform.sh":
                _bad-={"fetch_locked"}
            if _bad: fail("E_PYTHON_IMPORTS",_p+" heredoc "+",".join(sorted(_bad)))
            _on=False; continue
        if _on: _body.append(_ln)

# 6i) batch1r3 addendum2 (2c): no venv/setup-python/pip provisioning in the ceremony workflows
for fn in ("NON_CERTIFYING_REHEARSAL-workflow.yml","OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml"):
    _wt=open(os.path.join(wf_dir,fn),errors="replace").read()
    for _pat in ("setup-python","pip install","pip3 install","-m venv","virtualenv"):
        if _pat in _wt: fail("E_PYTHON_FORBIDDEN_PROVISIONING",fn+" "+_pat)

# 6j) peer run-35959397469 ruling H5c: any rehearsal .py that imports a sibling module must
# set sys.dont_write_bytecode = True BEFORE that import - self-protection against callers whose
# env drops PYTHONDONTWRITEBYTECODE. Planted negative lives in the scratch lane and must fail
# by this name.
import re as _re_bg
for _f in sorted(os.listdir(here)):
    if not _f.endswith(".py"): continue
    _lines=open(os.path.join(here,_f),errors="replace").read().splitlines()
    _guard_at=None; _first_sib=None
    for _i,_ln in enumerate(_lines):
        if _guard_at is None and _re_bg.search(r"sys\.dont_write_bytecode\s*=\s*True",_ln): _guard_at=_i
        _m=_re_bg.match(r"\s*(?:from|import)\s+([A-Za-z_][A-Za-z0-9_]*)",_ln)
        if _m and os.path.isfile(os.path.join(here,_m.group(1)+".py")) and _first_sib is None:
            _first_sib=(_i,_m.group(1))
    if _first_sib is not None and (_guard_at is None or _guard_at>_first_sib[0]):
        fail("E_BYTECODE_GUARD","%s:%d imports sibling %s without sys.dont_write_bytecode=True before it"%(_f,_first_sib[0]+1,_first_sib[1]))

# 6k) peer run-35959397469 review J1(c): any case on non-debug firmware MUST carry
# expect.kernel_exec=true, else its boot target is statically unprovable - release firmware
# emits no debugcon output (R7's run-18' log is 0 bytes), so the behavioral proof needs the
# kernel-exec RAM marker. The debug firmware path is the config's own build-output literal.
for _c in cfg.get("cases",[]):
    if _c["firmware"]!="build-output/ovmf-debug/OVMF_CODE.fd" and _c["expect"].get("kernel_exec") is not True:
        fail("E_CASE_BOOT_TARGET_UNPROVABLE",_c["id"]+" non-debug firmware without expect.kernel_exec=true")

# 7) KVM requirement is declarative here; runtime fail-closed check lives in the workflow
report={"schema":"NON_CERTIFYING_REHEARSAL-preflight/v1","lane":PREFIX,"errors":E,
        "result":"PASS" if not E else "FAIL"}
print(json.dumps(report,indent=1,sort_keys=True))
sys.exit(0 if not E else 30)
