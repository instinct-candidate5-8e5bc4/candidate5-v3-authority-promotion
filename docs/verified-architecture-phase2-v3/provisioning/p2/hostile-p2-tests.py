#!/usr/bin/env python3
# hostile-p2-tests.py - hostile mutation suite for verify-p2-staging.py.
# Every case builds a mutated copy of the P2 staging set (images, pins, manifest or
# target spec) and proves the validator rejects it with the expected error code.
# Operates only on copies in a temp dir; the certified inputs are never touched.
# usage: hostile-p2-tests.py --images <good_images_dir> --p2dir <p2 dir> --report <out.json>
import json, subprocess, sys, os, hashlib, shutil, tempfile, struct, argparse, re

EPOCH=1789923381
ROLES=("reviewed-root","reviewed-input","reviewed-output","reviewed-evidence")
POLY=0x82F63B78
T=[]
for i in range(256):
    c=i
    for _ in range(8): c=(c>>1)^POLY if c&1 else c>>1
    T.append(c)
def raw_crc32c(data, init=0xFFFFFFFF):
    crc=init
    for b in data: crc=T[(crc^b)&0xFF]^(crc>>8)
    return crc

def sha256fp(fp):
    h=hashlib.sha256()
    with open(fp,"rb") as f:
        for c in iter(lambda:f.read(1<<20),b""): h.update(c)
    return h.hexdigest()

def debugfs_stat(img, path):
    r=subprocess.run(["debugfs","-R",f"stat {path}",img],capture_output=True)
    out=r.stdout.decode(errors="replace")
    ino=int(re.search(r"Inode:\s+(\d+)",out).group(1))
    blk=None
    for m in re.finditer(r"\((\d+)(?:-\d+)?\):\s*(\d+)",out):
        blk=int(m.group(2)); break
    return ino, blk

def flip_file_byte(img, fs_path):
    ino,blk=debugfs_stat(img,fs_path)
    if blk is None: raise RuntimeError("no block for "+fs_path)
    off=blk*4096
    with open(img,"r+b") as f:
        f.seek(off); b=f.read(1)
        f.seek(off); f.write(bytes([b[0]^0xFF]))

def patch_sb(img, mutate):
    with open(img,"r+b") as f:
        f.seek(1024); sb=bytearray(f.read(1024))
        mutate(sb)
        struct.pack_into("<I",sb,0x3FC,0)
        struct.pack_into("<I",sb,0x3FC,raw_crc32c(bytes(sb[:1020])))
        f.seek(1024); f.write(sb)

def repin(img, inode_count):
    cmds="".join(f"sif <{i}> crtime @{EPOCH}\nsif <{i}> ctime @{EPOCH}\nsif <{i}> atime @{EPOCH}\nsif <{i}> mtime @{EPOCH}\n" for i in range(1,inode_count+1))
    cmds+=f"ssv mtime @{EPOCH}\nssv wtime @{EPOCH}\nssv lastcheck @{EPOCH}\nssv mkfs_time @{EPOCH}\n"
    debugfs_w(img,cmds)
    patch_sb(img,lambda sb: struct.pack_into("<I",sb,0x30,EPOCH))

def debugfs_w(img, cmds):
    cf=tempfile.NamedTemporaryFile("w",delete=False,suffix=".cmds")
    cf.write(cmds); cf.close()
    r=subprocess.run(["debugfs","-w","-f",cf.name,img],capture_output=True)
    os.unlink(cf.name)
    return r.returncode

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--images",required=True)
    ap.add_argument("--p2dir",required=True)
    ap.add_argument("--report",required=True)
    a=ap.parse_args()
    p2=a.p2dir
    validator=os.path.join(p2,"verify-p2-staging.py")
    good_manifest=json.load(open(os.path.join(p2,"staging-manifest.v1.json")))
    good_pins=json.load(open(os.path.join(p2,"offline-input-pins.v1.json")))
    good_spec=json.load(open(os.path.join(p2,"target-spec.v1.json")))
    tmp=tempfile.mkdtemp(prefix="hostile-p2-")
    cases=[]

    def run_case(cid, expect, mutate_images=None, manifest=None, pins=None, spec=None):
        cdir=os.path.join(tmp,cid); os.makedirs(cdir)
        idir=os.path.join(cdir,"images"); os.makedirs(idir)
        mutated=set((mutate_images or {}).keys())
        for name in ROLES:
            dst=os.path.join(idir,name+".ext4")
            if name in mutated:
                shutil.copyfile(os.path.join(a.images,name+".ext4"),dst)
                mutate_images[name](dst)
            else:
                os.symlink(os.path.join(a.images,name+".ext4"),dst)
        canon=lambda o: json.dumps(o,sort_keys=True,separators=(",",":"))+"\n"
        mpath=os.path.join(cdir,"manifest.json"); open(mpath,"w").write(canon(manifest or good_manifest))
        ppath=os.path.join(cdir,"pins.json"); open(ppath,"w").write(canon(pins or good_pins))
        spath=os.path.join(cdir,"spec.json"); open(spath,"w").write(canon(spec or good_spec))
        rep=os.path.join(cdir,"report.json")
        rc=subprocess.run([sys.executable,validator,"--images",idir,"--manifest",mpath,
                           "--pins",ppath,"--target-spec",spath,"--report",rep],capture_output=True)
        rj=json.load(open(rep))
        got=rj.get("first_error")
        ok = rj["result"]=="FAIL" and got==expect
        cases.append({"case_id":cid,"expected_code":expect,"observed_code":got,
                      "validator_result":rj["result"],"result":"PASS" if ok else "FAIL"})
        print(("PASS" if ok else "FAIL"),cid,"expect",expect,"got",got)

    def mutate_spec(fn):
        s=json.loads(json.dumps(good_spec)); fn(s); return s
    def spec_and_manifest(s):
        m=json.loads(json.dumps(good_manifest))
        m["target_spec_sha256"]=hashlib.sha256((json.dumps(s,sort_keys=True,separators=(",",":"))+"\n").encode()).hexdigest()
        return m
    # NOTE: spec mutations are re-pinned into a forged manifest so the attack reaches the
    # semantic spec checks (an un-repinned mutation is already caught as E_SPEC_PIN).

    run_case("H_SIZE","E_SIZE",
        mutate_images={"reviewed-evidence":lambda p: open(p,"ab").write(b"\0"*4096)})
    run_case("H_MARKER","E_MARKER",
        mutate_images={"reviewed-output":lambda p: flip_file_byte(p,"/.v3-volume-role")})
    run_case("H_CONTENT","E_CONTENT",
        mutate_images={"reviewed-input":lambda p: flip_file_byte(p,"/offline-inputs/channel-rust-1.98.1.toml")})
    def add_extra(p):
        debugfs_w(p,"write /etc/hostname /evil-payload\n"); repin(p,128)
    run_case("H_EXTRA","E_EXTRA",mutate_images={"reviewed-evidence":add_extra})
    def do_rm(p):
        debugfs_w(p,"rm /binding.v1.json\n"); repin(p,512)
    run_case("H_MISSING","E_MISSING",mutate_images={"reviewed-input":do_rm})
    def chmod_lf(p):
        repin(p,128)
        ino,_=debugfs_stat(p,"/lost+found"); debugfs_w(p,f"sif <{ino}> mode 040755\n")
        patch_sb(p,lambda sb: struct.pack_into("<I",sb,0x30,EPOCH))
    run_case("H_MODE","E_MODE",mutate_images={"reviewed-output":chmod_lf})
    def chown_lf(p):
        repin(p,128)
        ino,_=debugfs_stat(p,"/lost+found"); debugfs_w(p,f"sif <{ino}> uid 1000\n")
        patch_sb(p,lambda sb: struct.pack_into("<I",sb,0x30,EPOCH))
    run_case("H_OWNER","E_OWNER",mutate_images={"reviewed-output":chown_lf})
    def time_lf(p):
        repin(p,128)
        ino,_=debugfs_stat(p,"/lost+found"); debugfs_w(p,f"sif <{ino}> mtime @{EPOCH+1}\n")
        patch_sb(p,lambda sb: struct.pack_into("<I",sb,0x30,EPOCH))
    run_case("H_TIME_INODE","E_TIME",mutate_images={"reviewed-output":time_lf})
    run_case("H_TIME_SB","E_TIME",
        mutate_images={"reviewed-output":lambda p: patch_sb(p,lambda sb: struct.pack_into("<I",sb,0x2C,EPOCH+1))})
    run_case("H_UUID","E_UUID",
        mutate_images={"reviewed-output":lambda p: patch_sb(p,lambda sb: sb.__setitem__(0x68,sb[0x68]^0xFF))})
    run_case("H_LABEL","E_LABEL",
        mutate_images={"reviewed-output":lambda p: patch_sb(p,lambda sb: sb.__setitem__(slice(0x78,0x88),b"evil-label\0\0\0\0\0\0"))})
    run_case("H_FEATURE","E_FEATURE",
        mutate_images={"reviewed-root":lambda p: patch_sb(p,lambda sb: struct.pack_into("<I",sb,0x5C,struct.unpack_from("<I",sb,0x5C)[0]|0x0004))})
    def type_swap(p):
        target="/repo/docs/verified-architecture-phase2-v3/root-admitter-candidate/uki/initramfs/bin/sh"
        debugfs_w(p,f"rm {target}\nwrite /etc/hostname {target}\n"); repin(p,2048)
    run_case("H_TYPE","E_TYPE",mutate_images={"reviewed-root":type_swap})
    # forged pins+manifest pairing with genuine images: boot-pair binding must fire
    def forge_bootpair():
        pins=json.loads(json.dumps(good_pins))
        pins["boot_pair_freeze"]["rootfs"]["sha256"]="0"*64
        m=json.loads(json.dumps(good_manifest))
        m["pins_sha256"]=hashlib.sha256((json.dumps(pins,sort_keys=True,separators=(",",":"))+"\n").encode()).hexdigest()
        return m,pins
    m_f,p_f=forge_bootpair()
    run_case("H_BOOT_PAIR","E_BOOT_PAIR",manifest=m_f,pins=p_f)
    s=mutate_spec(lambda s: s["secure_boot"]["dbs"].append(dict(s["secure_boot"]["dbs"][0])))
    run_case("H_DB_EXTRA","E_TARGET_DB",manifest=spec_and_manifest(s),spec=s)
    s=mutate_spec(lambda s: s["secure_boot"].update(dbs=[],db_entry_count=0))
    run_case("H_DB_ZERO","E_TARGET_DB",manifest=spec_and_manifest(s),spec=s)
    s=mutate_spec(lambda s: s["secure_boot"]["dbs"][0].update(sha256="0"*64))
    run_case("H_CERT","E_TARGET_DB",manifest=spec_and_manifest(s),spec=s)
    s=mutate_spec(lambda s: s["boot"].update(boot_entries=2))
    run_case("H_BOOT_EXTRA","E_TARGET_BOOT",manifest=spec_and_manifest(s),spec=s)
    s=mutate_spec(lambda s: s["boot"].update(uki_sha256="0"*64))
    run_case("H_UKI","E_TARGET_BOOT",manifest=spec_and_manifest(s),spec=s)
    s=mutate_spec(lambda s: s["network"].update(external_ip=True))
    run_case("H_NETWORK","E_TARGET_NETWORK",manifest=spec_and_manifest(s),spec=s)
    s=mutate_spec(lambda s: s["disks"].pop(0))
    run_case("H_DISK_MISSING","E_TARGET_DISK",manifest=spec_and_manifest(s),spec=s)
    def add_swap(s):
        d=dict(s["disks"][0]); d["device_name"]="v3-swap"; d["role"]="swap"; s["disks"].append(d)
    s=mutate_spec(add_swap)
    run_case("H_DISK_EXTRA_SWAP","E_TARGET_DISK",manifest=spec_and_manifest(s),spec=s)
    s=mutate_spec(lambda s: s["disks"][0].update(device_name="v3-rootfs-dat"))
    run_case("H_DISK_NAME","E_TARGET_DISK",manifest=spec_and_manifest(s),spec=s)
    s=mutate_spec(lambda s: s["boot"].update(boot_disk_device_name="v3-boot"))
    run_case("H_BOOTDISK_NS","E_TARGET_DISK",manifest=spec_and_manifest(s),spec=s)
    s=mutate_spec(lambda s: s.update(architecture="aarch64"))
    run_case("H_ARCH","E_TARGET_ARCH",manifest=spec_and_manifest(s),spec=s)
    s=mutate_spec(lambda s: s["disks"][0].update(source_sha256="0"*64))
    run_case("H_DISK_SOURCE","E_TARGET_DISK",manifest=spec_and_manifest(s),spec=s)
    run_case("H_SB_HEX","E_SUPERBLOCK",
        mutate_images={"reviewed-evidence":lambda p: patch_sb(p,lambda sb: struct.pack_into("<I",sb,0x0C,struct.unpack_from("<I",sb,0x0C)[0]+1))})
    s=mutate_spec(lambda s: s.update(unexpected_key=True))
    run_case("H_SCHEMA","E_TARGET_SCHEMA",manifest=spec_and_manifest(s),spec=s)

    passed=sum(1 for c in cases if c["result"]=="PASS")
    rep={"hostile_report_version":1,"validator":"verify-p2-staging.py",
         "summary":{"total":len(cases),"passed":passed,"failed":len(cases)-passed},
         "cases":cases}
    out=json.dumps(rep,sort_keys=True,separators=(",",":"))+"\n"
    open(a.report,"w").write(out)
    print("summary:",passed,"/",len(cases))
    shutil.rmtree(tmp,ignore_errors=True)
    sys.exit(0 if passed==len(cases) else 1)

main()
