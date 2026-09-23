#!/usr/bin/env python3
# NON_CERTIFYING_REHEARSAL harness (WS1, pre-freeze rehearsal only).
# Runs OVMF Secure Boot cases on QEMU/KVM and records structural evidence.
# NEVER emits or references any certification marker. KVM-only, fail-closed.
# usage: rehearsal-harness.py <config.json> <work_root>
import sys, os, json, struct, socket, hashlib, subprocess, time, shutil, signal

MARKER_KERNEL_EXEC = b"Attempted to kill init!"
MARKER_EXIT_98     = b"exitcode=0x00006200"
MARKER_EXIT_97     = b"exitcode=0x00006100"
STR_UNSIGNED_REJECT = "Image is not signed and %s hash of image is not found in DB/DBX"
STR_SIGNED_REJECT   = "Image is signed but signature is not allowed by DB and %s hash of image is not found in DB/DBX"
STR_DBX_REJECT      = "Image is signed but signature is forbidden by DBX"
STR_MALFORMED_PE    = "Not a valid PE/COFF image"
STR_FINAL_REJECT    = "The image doesn't pass verification"
ALL_REJECT_STRINGS = [STR_UNSIGNED_REJECT, STR_SIGNED_REJECT, STR_DBX_REJECT, STR_MALFORMED_PE, STR_FINAL_REJECT]
ADAPTER_STRINGS = ["E_PROVIDER_NAMESPACE","E_PROVIDER_LINK_MISSING"]  # the signed adapter's own fail() reasons (cloud-boot-adapter.sh); observable in the RAM dump only via the accepted signed UKI's initrd

def sha(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for c in iter(lambda: f.read(1<<20), b""): h.update(c)
    return h.hexdigest()

def fail(code, msg):
    print(json.dumps({"result":"FAIL","code":code,"detail":msg}, sort_keys=True)); sys.exit(90)

def qmp_dump(sock_path, out_path, timeout=60):
    s=socket.socket(socket.AF_UNIX, socket.SOCK_STREAM); s.settimeout(timeout)
    s.connect(sock_path)
    f=s.makefile("rw")
    f.readline()  # greeting
    f.write(json.dumps({"execute":"qmp_capabilities"})+"\n"); f.flush(); f.readline()
    f.write(json.dumps({"execute":"dump-guest-memory","arguments":{"paging":False,"protocol":"file:"+out_path}})+"\n"); f.flush()
    t0=time.time()
    while time.time()-t0<timeout:
        line=f.readline()
        if not line: break
        try: msg=json.loads(line)
        except Exception: continue
        if "return" in msg: break
        if "error" in msg: s.close(); fail("E_QMP_DUMP", line.strip())
    s.close()

def build_argv(cfg, case_dir, vars_fd, esp, firmware):
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
    a+=["-qmp",f"unix:{case_dir}/qmp.sock,server,nowait",
        "-pidfile",f"{case_dir}/qemu.pid","-daemonize"]
    return a

def run_case(cfg, case):
    """case: {id, vars_template, esp, expect:{kernel_exec,exit_marker,reject_strings[],no_reject_strings,expect_invariant_trip}}"""
    cid=case["id"]; cdir=os.path.join(cfg["work_root"],cid)
    os.makedirs(cdir, exist_ok=False)
    vars_fd=os.path.join(cdir,"vars.fd")
    shutil.copyfile(case["vars_template"], vars_fd)
    pre_parse=subprocess.run([cfg["vars_parser"],vars_fd],capture_output=True,text=True)
    vars_pre_sha=sha(vars_fd)
    argv=build_argv(cfg,cdir,vars_fd,case["esp"],case["firmware"])
    with open(os.path.join(cdir,"argv.txt"),"w") as f: f.write("\0".join(argv))
    if not os.path.exists("/dev/kvm"): fail("E_NO_KVM", cid)
    r=subprocess.run(argv,capture_output=True,text=True,timeout=30)
    if r.returncode!=0: fail("E_QEMU_START", cid+" "+r.stderr[:400])
    time.sleep(case.get("settle_seconds",45))
    ram=os.path.join(cdir,"ram.bin")
    try: qmp_dump(os.path.join(cdir,"qmp.sock"), ram)
    finally:
        pid=int(open(os.path.join(cdir,"qemu.pid")).read())
        os.kill(pid, signal.SIGTERM)
        time.sleep(2)
        try: os.kill(pid, signal.SIGKILL)
        except ProcessLookupError: pass
    data=open(ram,"rb").read()
    kexec=MARKER_KERNEL_EXEC in data
    e98=MARKER_EXIT_98 in data
    e97=MARKER_EXIT_97 in data
    dbg=open(os.path.join(cdir,"ovmf-debug.log"),errors="replace").read()
    def match_template(t):
        parts=t.split("%s"); pos=0
        for p in parts:
            i=dbg.find(p,pos)
            if i<0: return False
            pos=i+len(p)
        return True
    rejects_found=[s for s in ALL_REJECT_STRINGS if match_template(s)]
    post_parse=subprocess.run([cfg["vars_parser"],vars_fd],capture_output=True,text=True)
    exp=case["expect"]; checks={}
    checks["kernel_exec"]= (kexec==exp["kernel_exec"])
    if exp.get("exit_98") is not None: checks["exit_98"]=(e98==exp["exit_98"])
    if exp.get("exit_97") is not None: checks["exit_97"]=(e97==exp["exit_97"])
    checks["reject_strings"]= (rejects_found==exp.get("reject_strings",[]))
    if exp.get("no_reject_strings"): checks["no_reject_strings"]=(len(rejects_found)==0)
    if exp.get("adapter_strings"): checks["adapter_strings"]=all(s.encode() in data for s in exp["adapter_strings"])
    if exp.get("adapter_strings_absent"): checks["adapter_strings_absent"]=not any(s.encode() in data for s in ADAPTER_STRINGS)
    det={"case":cid,"argv_sha256":hashlib.sha256("\0".join(argv).encode()).hexdigest(),
         "vars_pre_sha256":vars_pre_sha,"esp_sha256":sha(case["esp"]),
         "firmware_sha256":sha(case["firmware"]),
         "expect":exp,"checks":checks,
         "markers":{"kernel_exec":kexec,"exit_98":e98,"exit_97":e97,
                    "adapter_strings_present":[s for s in ADAPTER_STRINGS if s.encode() in data]},
         "reject_strings_found":rejects_found,
         "vars_pre_parse":json.loads(pre_parse.stdout)["summary"],
         "vars_post_sha256":sha(vars_fd),
         "vars_post_parse":json.loads(post_parse.stdout)["summary"]}
    obs={"ram_sha256":sha(ram),"debug_log_sha256":sha(os.path.join(cdir,"ovmf-debug.log")),
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
    cfg=json.load(open(sys.argv[1]))
    cfg["work_root"]=sys.argv[2]
    os.makedirs(cfg["work_root"],exist_ok=True)
    results={}
    for case in cfg["cases"]:
        results[case["id"]]=run_case(cfg,case)
    ok=all(results.values())
    print(json.dumps({"suite":"NON_CERTIFYING_REHEARSAL","all_expectations_met":ok,"cases":results},sort_keys=True))
    sys.exit(0 if ok else 91)
