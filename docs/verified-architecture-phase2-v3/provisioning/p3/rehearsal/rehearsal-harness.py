#!/usr/bin/env python3
# NON_CERTIFYING_REHEARSAL harness (WS1, pre-freeze rehearsal only).
# Runs OVMF Secure Boot cases on QEMU/KVM and records structural evidence.
# NEVER emits or references any certification marker. KVM-only, fail-closed.
# usage: rehearsal-harness.py <config.json> <work_root> <out_dir>   (out_dir = the ceremony's $OUT, for the F4 allow-set construction)
import sys, os, json, socket, hashlib, subprocess, time, shutil, signal

# Lane prefix resolution (#18 F1, peer #17 final ruling): committed config bytes keep the
# canonical NON_CERTIFYING_REHEARSAL prefix; at load time every absolute /tmp lane path
# resolves to the running lane by the SINGLE resolver (lane_resolve.py, component-wise,
# fail-closed). Identity in the rehearsal and certification lanes (PREFIX defaults to
# NON_CERTIFYING_REHEARSAL); the scratch lane exports PREFIX=NON_CERTIFYING_SCRATCH.
# Non-/tmp config values (relative paths, case IDs, schema strings) pass through untouched.
PREFIX=os.environ.get("PREFIX","")
if not PREFIX: print("E_PREFIX_UNSET"); sys.exit(97)
ALLOWED=os.environ.get("ALLOWED_PREFIX","")
if PREFIX!=ALLOWED: print("E_PREFIX_MISMATCH prefix=%s allowed=%s"%(PREFIX,ALLOWED)); sys.exit(97)
from lane_resolve import LaneError, resolve_config_value, resolve_path, allowed_vars_templates

# C7 runtime-emission provenance: the signed cmdline (ro root=/dev/mapper/v3-root-admitter
# rootfstype=ext4 v3.root_admitter_verity=533d6d61..) carries NO console= parameter, so the
# serial channel is unsupported and the runtime-only channel is the kernel printk ring
# buffer (read via the QMP RAM dump). The frozen lines below are CONTIGUOUS runtime-formatted
# panic() records: the kernel image holds only the "exitcode=0x%08x" format string and the
# initrd is an UNCOMPRESSED newc cpio whose bytes appear verbatim in rootfs RAM at rest -
# but these exact formatted lines exist in NO input byte stream (verified absent from the
# accepted signed UKI 13309697..), so their presence in the post-run RAM proves the kernel
# formatted them at runtime, i.e. genuine execution rather than at-rest initrd bytes.
MARKER_KERNEL_EXEC = b"Kernel panic - not syncing: Attempted to kill init!"
MARKER_EXIT_98     = b"Attempted to kill init! exitcode=0x00006200"
MARKER_EXIT_97     = b"Attempted to kill init! exitcode=0x00006100"
STR_UNSIGNED_REJECT = "Image is not signed and %s hash of image is not found in DB/DBX"
STR_SIGNED_REJECT   = "Image is signed but signature is not allowed by DB and %s hash of image is not found in DB/DBX"
STR_DBX_REJECT      = "Image is signed but signature is forbidden by DBX"
STR_MALFORMED_PE    = "Not a valid PE/COFF image"
STR_FINAL_REJECT    = "The image doesn't pass verification"
ALL_REJECT_STRINGS = [STR_UNSIGNED_REJECT, STR_SIGNED_REJECT, STR_DBX_REJECT, STR_MALFORMED_PE, STR_FINAL_REJECT]
ADAPTER_STRINGS = [s.encode() for s in ("E_PROVIDER_NAMESPACE","E_PROVIDER_LINK_MISSING")]  # the signed adapter's own fail() reasons (cloud-boot-adapter.sh). OBSERVATIONAL ONLY: these strings are at-rest bytes inside the accepted signed UKI's uncompressed newc initrd, and the firmware loads the UKI image into guest RAM for hash verification even on REJECT paths, so their presence/absence in a post-run RAM dump is non-evidentiary. Execution provenance is the frozen runtime-formatted panic records (section 6 markers).

# Frozen per-case VARS template binding (reviewer ruling): each case must draw its VARS from
# exactly one of the three run-fresh post-enrollment templates, byte-identical, checked in-run.
# F4 (peer #17 final ruling): the allow set has ONE construction - lane_resolve
# .allowed_vars_templates over THIS ceremony's out dir + lane prefix, the same source the
# run-ceremony.sh pre-guest gate (F3) uses. Populated in __main__ from argv[3].
ALLOWED_VARS_TEMPLATES = set()

# C4 strict closed schema (T4 F6): unknown or missing keys fail.
TOP_KEYS = {"cases","cpu_model","disk_dir","enroll_app","enroll_app_sha256","esp_sha256",
            "esp_variant_sha256","firmware_debug_sha256","firmware_release","firmware_release_sha256",
            "memory_mb","note","ovmf_code_debug","ovmf_vars_pristine","qemu","schema",
            "v3_serials","vars_parser"}
TOP_REQUIRED = TOP_KEYS - {"note"}
CASE_KEYS = {"esp","expect","firmware","id","settle_seconds","vars_template"}
EXPECT_KEYS = {"kernel_exec","exit_98","exit_97","reject_strings","no_reject_strings"}
EXPECT_REQUIRED = {"kernel_exec","exit_98","exit_97","reject_strings"}
VARIANT_KEYS = {"unsigned","wrongsig","hostile"}
QMP_SOCK_MAX = 107          # G1/T5 F3: AF_UNIX sun_path limit
DISK_MARGIN = 1 << 30       # A5: free disk must cover the RAM dump plus this stated margin

def sha(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for c in iter(lambda: f.read(1<<20), b""): h.update(c)
    return h.hexdigest()

def fail(code, msg):
    print(json.dumps({"result":"FAIL","code":code,"detail":msg}, sort_keys=True)); sys.exit(90)

def check_schema(cfg):
    extra=set(cfg)-TOP_KEYS; missing=TOP_REQUIRED-set(cfg)
    if extra or missing: fail("E_CONFIG_SCHEMA", "top extra=%s missing=%s"%(sorted(extra),sorted(missing)))
    v=cfg.get("esp_variant_sha256",{})
    if set(v)!=VARIANT_KEYS: fail("E_CONFIG_SCHEMA","esp_variant_sha256 keys=%s"%sorted(v))
    if not isinstance(cfg.get("cases"),list) or not cfg["cases"]: fail("E_CONFIG_SCHEMA","cases")
    for case in cfg["cases"]:
        extra=set(case)-CASE_KEYS; missing=CASE_KEYS-set(case)
        if extra or missing: fail("E_CONFIG_SCHEMA","case %s extra=%s missing=%s"%(case.get("id"),sorted(extra),sorted(missing)))
        e=case["expect"]
        extra=set(e)-EXPECT_KEYS; missing=EXPECT_REQUIRED-set(e)
        if extra or missing: fail("E_CONFIG_SCHEMA","expect %s extra=%s missing=%s"%(case["id"],sorted(extra),sorted(missing)))

def qmp_dump(sock_path, out_path, timeout=180):
    # A5/T5 async: dump-guest-memory returns immediately; completion is polled via
    # query-dump with a bounded timeout (never a fixed readline wait).
    s=socket.socket(socket.AF_UNIX, socket.SOCK_STREAM); s.settimeout(30)
    t0=time.time()
    while True:
        try: s.connect(sock_path); break
        except (FileNotFoundError, ConnectionRefusedError):
            if time.time()-t0>20: fail("E_QMP_CONNECT", sock_path)
            time.sleep(0.5)
    f=s.makefile("rw")
    f.readline()  # greeting
    f.write(json.dumps({"execute":"qmp_capabilities"})+"\n"); f.flush(); f.readline()
    f.write(json.dumps({"execute":"dump-guest-memory","arguments":{"paging":False,"protocol":"file:"+out_path}})+"\n"); f.flush()
    s.settimeout(30)
    while True:
        line=f.readline()
        if not line: s.close(); fail("E_QMP_DUMP","no response to dump-guest-memory")
        try: msg=json.loads(line)
        except Exception: continue
        if "return" in msg: break
        if "error" in msg: s.close(); fail("E_QMP_DUMP", line.strip())
    t0=time.time()
    while True:
        if time.time()-t0>timeout: s.close(); fail("E_QMP_DUMP_TIMEOUT", out_path)
        f.write(json.dumps({"execute":"query-dump"})+"\n"); f.flush()
        line=f.readline()
        if not line: s.close(); fail("E_QMP_DUMP","query-dump EOF")
        try: msg=json.loads(line)
        except Exception: continue
        if "error" in msg: s.close(); fail("E_QMP_DUMP", line.strip())
        if "return" in msg:
            st=msg["return"].get("status")
            if st=="completed": break
            if st=="failed": s.close(); fail("E_QMP_DUMP","query-dump status=failed")
            time.sleep(1)
    s.close()

def scan_ram(path, needles):
    # A5/T4 F3: streaming scan, chunk overlap >= the longest needle; the dump is never
    # loaded whole and only its sha256 is recorded.
    overlap=max(len(n) for n in needles)
    found={n:False for n in needles}
    prev=b""
    with open(path,"rb") as f:
        while True:
            chunk=f.read(8<<20)
            if not chunk: break
            buf=prev+chunk
            for n in needles:
                if not found[n] and n in buf: found[n]=True
            prev=buf[-overlap:]
    return found

def build_argv(cfg, case_dir, vars_fd, esp, firmware, sock):
    a=[cfg["qemu"],
       "-machine","q35,smm=on","-accel","kvm","-cpu",cfg["cpu_model"],
       "-drive",f"if=pflash,format=raw,unit=0,readonly=on,file={firmware}",
       "-drive",f"if=pflash,format=raw,unit=1,file={vars_fd}",
       "-global","driver=cfi.pflash01,property=secure,value=on",
       "-debugcon",f"file:{case_dir}/ovmf-debug.log",
       "-global","isa-debugcon.iobase=0x402",
       "-display","none","-serial","none","-nic","none","-no-reboot",
       "-m",str(cfg["memory_mb"]),
       "-drive",f"file={esp},format=raw,if=none,id=esp,readonly=on",
       "-device","virtio-blk-pci,drive=esp,serial=c5-esp"]
    for i,role in enumerate(cfg["v3_serials"]):
        a+=["-drive",f"file={cfg['disk_dir']}/disk{i}.raw,format=raw,if=none,id=d{i},readonly=on",
            "-device",f"virtio-blk-pci,drive=d{i},serial={role}"]
    a+=["-qmp",f"unix:{sock},server,nowait",
        "-pidfile",f"{case_dir}/qemu.pid","-daemonize"]
    return a

def parse_vars(cfg, vars_fd, code):
    p=subprocess.run([cfg["vars_parser"],vars_fd],capture_output=True,text=True)
    if p.returncode!=0: fail(code, (p.stderr or p.stdout)[:200])
    v=json.loads(p.stdout)
    # F7 (peer #17 audit): the parser exits 0 even on structural errors (its output then
    # carries "error" and lacks the keys below) - a missing producer key must never
    # surface as a bare KeyError.
    for k in ("variables","summary"):
        if k not in v: fail("E_VARS_PARSE_SCHEMA", code+" producer output missing key "+k)
    return v

def run_case(cfg, case, idx):
    cid=case["id"]; cdir=os.path.join(cfg["work_root"],cid)
    os.makedirs(cdir, exist_ok=False)
    # G1/T5 F3: short fresh per-case QMP socket path, asserted within the sun_path limit
    sock=resolve_path(f"/tmp/NON_CERTIFYING_REHEARSAL-q{idx}.sock",PREFIX)   # short, fresh; canonical literal resolved per lane by the single resolver (#18 F1)
    if len(sock)>QMP_SOCK_MAX: fail("E_QMP_PATH_TOO_LONG","%d>%d %s"%(len(sock),QMP_SOCK_MAX,sock))
    if os.path.exists(sock): os.unlink(sock)
    vars_fd=os.path.join(cdir,"vars.fd")
    shutil.copyfile(case["vars_template"], vars_fd)
    vars_template_sha=sha(case["vars_template"])
    # F6 (peer #17 final ruling): the template<->enrollment byte tie is STATIC - verify it
    # before anything else (pre-parse, guest). The producer record is enroll-predicate.json's
    # enrolled_fd_sha256, which enroll-predicate-check.py computes with its one sha_f over
    # the EXACT vars-enrolled.fd the ceremony keeps (its argv[4]). A missing/unreadable
    # record or a mismatch dies named, never soft.
    evd=os.path.join(os.path.dirname(case["vars_template"]),"evidence","enroll-predicate.json")
    try: _tie=json.load(open(evd))
    except Exception: fail("E_VARS_TEMPLATE_ENROLL_TIE", cid+" tie record unreadable: "+evd)
    if _tie.get("enrolled_fd_sha256")!=vars_template_sha:
        fail("E_VARS_TEMPLATE_ENROLL_TIE", cid+" template sha256 != enrolled_fd_sha256 in "+evd)
    prej=parse_vars(cfg,vars_fd,"E_VARS_PRE_PARSE")
    trust_ok={"PK","KEK","db"}<={x["name"] for x in prej.get("variables",[])}
    argv=build_argv(cfg,cdir,vars_fd,case["esp"],case["firmware"],sock)
    with open(os.path.join(cdir,"argv.txt"),"w") as f: f.write("\0".join(argv))
    if not os.path.exists("/dev/kvm"): fail("E_NO_KVM", cid)
    # A5: free-disk preflight before the RAM dump
    need=cfg["memory_mb"]*(1<<20)+DISK_MARGIN
    free=shutil.disk_usage(cdir).free
    if free<need: fail("E_DISK_MARGIN","free=%d need=%d"%(free,need))
    r=subprocess.run(argv,capture_output=True,text=True,timeout=30)
    if r.returncode!=0: fail("E_QEMU_START", cid+" "+r.stderr[:400])
    ram=os.path.join(cdir,"ram.bin")
    try:
        time.sleep(case.get("settle_seconds",45))
        qmp_dump(sock, ram)
    finally:
        pid=int(open(os.path.join(cdir,"qemu.pid")).read())
        os.kill(pid, signal.SIGTERM)
        time.sleep(2)
        try: os.kill(pid, signal.SIGKILL)
        except ProcessLookupError: pass
    needles=[MARKER_KERNEL_EXEC,MARKER_EXIT_98,MARKER_EXIT_97]+ADAPTER_STRINGS
    found=scan_ram(ram, needles)
    ram_sha=sha(ram)
    os.remove(ram)   # A5: the dump is deleted after scanning and never lands under an upload path
    kexec=found[MARKER_KERNEL_EXEC]; e98=found[MARKER_EXIT_98]; e97=found[MARKER_EXIT_97]
    adapters_present=[n.decode() for n in ADAPTER_STRINGS if found[n]]
    dbg=open(os.path.join(cdir,"ovmf-debug.log"),errors="replace").read()
    def match_template(t):
        parts=t.split("%s"); pos=0
        for p in parts:
            i=dbg.find(p,pos)
            if i<0: return False
            pos=i+len(p)
        return True
    rejects_found=[s for s in ALL_REJECT_STRINGS if match_template(s)]
    postj=parse_vars(cfg,vars_fd,"E_VARS_POST_PARSE")
    exp=case["expect"]; checks={}
    checks["kernel_exec"]= (kexec==exp["kernel_exec"])
    checks["exit_98"]= (e98==exp["exit_98"])
    checks["exit_97"]= (e97==exp["exit_97"])
    checks["reject_strings"]= (rejects_found==exp["reject_strings"])
    checks["vars_template_allowed"]= (case["vars_template"] in ALLOWED_VARS_TEMPLATES)
    checks["vars_template_byte_identity"]= (vars_template_sha==sha(case["vars_template"]))
    if not checks["vars_template_byte_identity"]:
        fail("E_VARS_TEMPLATE_BYTE_IDENTITY", cid+" template bytes changed during the case")
    checks["vars_template_enroll_tie"]= True   # proven pre-guest by the F6 fatal gate above
    checks["pre_parse_trust_predicate"]= trust_ok
    if exp.get("no_reject_strings"): checks["no_reject_strings"]=(len(rejects_found)==0)
    det={"case":cid,"argv_sha256":hashlib.sha256("\0".join(argv).encode()).hexdigest(),
         "vars_template":case["vars_template"],
         "esp_sha256":sha(case["esp"]),
         "firmware_sha256":sha(case["firmware"]),
         "disk_free_margin_bytes":DISK_MARGIN,
         "expect":exp,"checks":checks,
         "markers":{"kernel_exec":kexec,"exit_98":e98,"exit_97":e97},
         "reject_strings_found":rejects_found}
    # C5/T4 F8: throwaway-key-dependent and run-varying values live in the OBSERVATIONAL
    # manifest only, so two harness runs with different throwaway keys produce
    # byte-identical deterministic manifests.
    obs={"vars_template_sha256":vars_template_sha,
         "vars_pre_sha256":sha(vars_fd),
         "vars_pre_parse":prej["summary"],
         "vars_post_sha256":sha(vars_fd),
         "vars_post_parse":postj["summary"],
         "adapter_strings_present":adapters_present,
         "ram_sha256":ram_sha,
         "debug_log_sha256":sha(os.path.join(cdir,"ovmf-debug.log")),
         "qmp_sock":sock,
         "settle_seconds":case.get("settle_seconds",45)}
    ok=all(checks.values())
    det["result"]="EXPECTATIONS_MET" if ok else "EXPECTATIONS_VIOLATED"
    with open(os.path.join(cdir,"manifest-deterministic.json"),"w") as f:
        json.dump(det,f,indent=1,sort_keys=True); f.write("\n")
    with open(os.path.join(cdir,"manifest-observational.json"),"w") as f:
        json.dump(obs,f,indent=1,sort_keys=True); f.write("\n")
    print(json.dumps({"case":cid,"result":det["result"],"checks":checks},sort_keys=True))
    return ok

if __name__=="__main__":
    if len(sys.argv)!=4:
        print("E_HARNESS_USAGE rehearsal-harness.py <config.json> <work_root> <out_dir>"); sys.exit(97)
    try: cfg=resolve_config_value(json.load(open(sys.argv[1])),PREFIX)
    except LaneError as e: print("%s %s"%(e.code,e.detail)); sys.exit(97)
    check_schema(cfg)
    cfg["work_root"]=sys.argv[2]
    ALLOWED_VARS_TEMPLATES.update(allowed_vars_templates(sys.argv[3],PREFIX))
    os.makedirs(cfg["work_root"],exist_ok=True)
    results={}
    for idx,case in enumerate(cfg["cases"]):
        results[case["id"]]=run_case(cfg,case,idx)
    ok=all(results.values())
    print(json.dumps({"suite":"NON_CERTIFYING_REHEARSAL","lane":PREFIX,"all_expectations_met":ok,"cases":results},sort_keys=True))
    sys.exit(0 if ok else 91)
