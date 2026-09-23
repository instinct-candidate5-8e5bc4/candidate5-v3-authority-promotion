#!/usr/bin/env python3
# NON_CERTIFYING_REHEARSAL preflight: static conformance only, starts no VM.
# usage: preflight-check.py <config.json> <stage_dir>
import sys, os, json, hashlib, subprocess

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

# 1) forbidden marker must appear in NO rehearsal file content
for root,_,files in os.walk(here):
    for f in files:
        p=os.path.join(root,f)
        try: data=open(p,errors="replace").read()
        except Exception: continue
        if FORBIDDEN in data and os.path.basename(p) not in ("preflight-check.py","NON_CERTIFYING_REHEARSAL-workflow.yml"):
            fail("E_FORBIDDEN_MARKER_REF", p)

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
cfg=json.load(open(cfg_path))
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
        # /tmp/NON_CERTIFYING_REHEARSAL-stage/ is the staged tree (verified above)
        generated=("build-output/","out/","/tmp/NON_CERTIFYING_REHEARSAL-stage/")
        if p and not any(p.startswith(g) for g in generated) and not os.path.exists(p):
            fail("E_CONFIG_PATH_MISSING", c["id"]+"."+pth_key)

# 6) staged tool presence
for t in ("usr/bin/qemu-system-x86_64","usr/bin/sbvarsign","usr/bin/openssl","usr/sbin/mkfs.vfat","sbin/sgdisk","usr/bin/nasm","usr/bin/iasl","usr/bin/gcc-13"):
    if not os.path.exists(os.path.join(stage,"root",t)): fail("E_STAGED_TOOL_MISSING", t)

# 7) KVM requirement is declarative here; runtime fail-closed check lives in the workflow
report={"schema":"NON_CERTIFYING_REHEARSAL-preflight/v1","errors":E,
        "result":"PASS" if not E else "FAIL"}
print(json.dumps(report,indent=1,sort_keys=True))
sys.exit(0 if not E else 30)
