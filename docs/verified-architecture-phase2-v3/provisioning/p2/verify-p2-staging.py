#!/usr/bin/env python3
# verify-p2-staging.py - deterministic validator for the P2 staging set.
# Per image, in order: byte size, raw-superblock semantics (uuid/label/features/times/
# checksum/full hex), then inspect-image.py inventory (paths/types/modes/owners/sizes/
# content SHA-256/symlink targets/inode times), marker content, e2fsck, and finally the
# whole-image SHA-256 as catch-all. Then boot-pair freeze + input-manifest + offline-input
# pins are cross-checked against image content, and the declarative target spec against the
# certified contract. Read-only. Exit 0 PASS / exit 1 FAIL; canonical JSON report always.
import json, subprocess, sys, os, hashlib, struct, argparse

ROLES=("reviewed-root","reviewed-input","reviewed-output","reviewed-evidence")
EXPECTED_DISKS={"v3-rootfs-data":"rootfs-data","v3-rootfs-hash":"rootfs-hash",
 "v3-reviewed-root":"reviewed-root","v3-reviewed-input":"reviewed-input",
 "v3-reviewed-output":"reviewed-output","v3-reviewed-evidence":"reviewed-evidence"}
CERT_SHA="7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441"
UKI_SHA="133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1"
SPEC_KEYS={"spec_version","status","provider","architecture","owner_inputs","vm","boot","secure_boot","disks","network","cost","rollback","prohibited"}
COMPAT={0x0001:"dir_prealloc",0x0002:"imagic_inodes",0x0004:"has_journal",0x0008:"ext_attr",0x0010:"resize_inode",0x0020:"dir_index"}
INCOMPAT={0x0001:"compression",0x0002:"filetype",0x0004:"recover",0x0008:"journal_dev",0x0010:"meta_bg",0x0040:"extent",0x0080:"64bit",0x0100:"mmp",0x0200:"flex_bg",0x0400:"ea_inode",0x1000:"dirdata",0x2000:"csum_seed",0x4000:"large_dir",0x8000:"inline_data",0x10000:"encrypt",0x20000:"casefold"}
ROCOMPAT={0x0001:"sparse_super",0x0002:"large_file",0x0004:"btree_dir",0x0008:"huge_file",0x0010:"uninit_bg",0x0020:"dir_nlink",0x0040:"extra_isize",0x0080:"has_snapshot",0x0100:"quota",0x0200:"bigalloc",0x0400:"metadata_csum",0x0800:"replica",0x1000:"readonly",0x2000:"project",0x8000:"verity",0x10000:"orphan_present",0x20000:"shared_blocks"}
POLY=0x82F63B78
_T=[]
for _i in range(256):
    _c=_i
    for _ in range(8): _c=(_c>>1)^POLY if _c&1 else _c>>1
    _T.append(_c)
def raw_crc32c(data, init=0xFFFFFFFF):
    crc=init
    for b in data: crc=_T[(crc^b)&0xFF]^(crc>>8)
    return crc
def feats(bits, table):
    out=[]; unknown=bits
    for b in sorted(table):
        if bits&b: out.append(table[b]); unknown&=~b
    return out if not unknown else None
def fmt_uuid(b):
    h=b.hex()
    return f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"
def sha256b(b): return hashlib.sha256(b).hexdigest()
def sha256fp(fp):
    h=hashlib.sha256()
    with open(fp,"rb") as f:
        for c in iter(lambda:f.read(1<<20),b""): h.update(c)
    return h.hexdigest()

class V:
    def __init__(self):
        self.checks=[]; self.first=None
    def chk(self, name, ok, code, detail=""):
        self.checks.append({"check":name,"result":"PASS" if ok else "FAIL","code":None if ok else code,"detail":"" if ok else detail})
        if not ok and self.first is None: self.first=code
        return ok

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--images",required=True)
    ap.add_argument("--manifest",required=True)
    ap.add_argument("--pins",required=True)
    ap.add_argument("--target-spec",required=True)
    ap.add_argument("--report",required=True)
    a=ap.parse_args()
    v=V()
    here=os.path.dirname(os.path.abspath(__file__))
    inspector=os.path.join(here,"inspect-image.py")

    try:
        m=json.load(open(a.manifest))
        assert m["manifest_version"]==1 and set(m["images"])==set(ROLES)
    except Exception as e:
        v.chk("manifest-schema",False,"E_MANIFEST",str(e)[:200]); return finish(v,a)
    v.chk("manifest-schema",True,None)

    pins_bytes=open(a.pins,"rb").read()
    if not v.chk("pins-integrity", sha256b(pins_bytes)==m["pins_sha256"], "E_PINS"): return finish(v,a)
    pins=json.loads(pins_bytes)
    spec_bytes=open(a.target_spec,"rb").read()
    if not v.chk("target-spec-pin", sha256b(spec_bytes)==m["target_spec_sha256"], "E_SPEC_PIN"): return finish(v,a)
    spec=json.loads(spec_bytes)

    insp={}
    for name in ROLES:
        img=os.path.join(a.images,f"{name}.ext4")
        if not v.chk(f"{name}:exists", os.path.isfile(img), "E_MISSING_IMAGE"): return finish(v,a)
        exp=m["images"][name]
        if not v.chk(f"{name}:size", os.path.getsize(img)==exp["image"]["bytes"], "E_SIZE"): return finish(v,a)
        with open(img,"rb") as f:
            f.seek(1024); sb=f.read(1024)
        es=exp["superblock"]
        u32=lambda o: struct.unpack_from("<I",sb,o)[0]
        if not v.chk(f"{name}:sb-magic", struct.unpack_from("<H",sb,0x38)[0]==0xEF53, "E_SB_MAGIC"): return finish(v,a)
        if not v.chk(f"{name}:sb-checksum", raw_crc32c(sb[:1020])==u32(0x3FC), "E_SB_CHECKSUM"): return finish(v,a)
        if not v.chk(f"{name}:uuid", fmt_uuid(sb[0x68:0x78])==es["uuid"], "E_UUID", fmt_uuid(sb[0x68:0x78])): return finish(v,a)
        if not v.chk(f"{name}:label", sb[0x78:0x88].split(b"\0")[0].decode()==es["label"], "E_LABEL"): return finish(v,a)
        got_feats=(feats(u32(0x5C),COMPAT),feats(u32(0x60),INCOMPAT),feats(u32(0x64),ROCOMPAT))
        want_feats=(es["compat_features"],es["incompat_features"],es["ro_compat_features"])
        if not v.chk(f"{name}:features", got_feats==want_feats, "E_FEATURE"): return finish(v,a)
        times_ok=all(u32(o)==es[k] for o,k in ((0x2C,"mtime"),(0x30,"wtime"),(0x40,"lastcheck"),(0x108,"mkfs_time")))
        if not v.chk(f"{name}:sb-times", times_ok, "E_TIME"): return finish(v,a)
        r=subprocess.run([sys.executable,inspector,img],capture_output=True)
        if r.returncode!=0:
            code=r.stderr.decode(errors="replace").split()[0] if r.stderr else "E_INSPECT"
            v.chk(f"{name}:inspect",False,code); return finish(v,a)
        act=json.loads(r.stdout)
        insp[name]=act
        if not v.chk(f"{name}:fsck", act["e2fsck_clean"] is True, "E_FSCK"): return finish(v,a)
        einv={e["path"]:e for e in exp["inventory"]}
        ainv={e["path"]:e for e in act["inventory"]}
        extra=sorted(set(ainv)-set(einv))
        if not v.chk(f"{name}:no-extra", not extra, "E_EXTRA", ",".join(extra[:5])): return finish(v,a)
        missing=sorted(set(einv)-set(ainv))
        if not v.chk(f"{name}:no-missing", not missing, "E_MISSING", ",".join(missing[:5])): return finish(v,a)
        marker=ainv.get("/.v3-volume-role",{})
        if not v.chk(f"{name}:marker", marker.get("type")=="file" and marker.get("sha256")==sha256b(m["markers"][name].encode()), "E_MARKER"): return finish(v,a)
        bad=None
        for p in sorted(einv):
            e,g=einv[p],ainv[p]
            if e["type"]!=g["type"]: bad=("E_TYPE",p); break
            if e["mode"]!=g["mode"]: bad=("E_MODE",p); break
            if e["uid"]!=g["uid"] or e["gid"]!=g["gid"]: bad=("E_OWNER",p); break
            if e["size"]!=g["size"]: bad=("E_ENTRY_SIZE",p); break
            tbad=any(e[t]!=g[t] for t in ("atime","ctime","mtime","crtime"))
            if tbad: bad=("E_TIME",p); break
            if e["type"]=="file" and e["sha256"]!=g["sha256"]: bad=("E_CONTENT",p); break
            if e["type"]=="symlink" and e["target"]!=g["target"]: bad=("E_SYMLINK",p); break
        if not v.chk(f"{name}:inventory", bad is None, bad[0] if bad else None, bad[1] if bad else ""): return finish(v,a)
        if not v.chk(f"{name}:superblock", sb.hex()==es["superblock_hex"], "E_SUPERBLOCK"): return finish(v,a)
        if not v.chk(f"{name}:image-sha256", sha256fp(img)==exp["image"]["sha256"], "E_IMAGE_SHA"): return finish(v,a)

    rr={e["path"]:e for e in insp["reviewed-root"]["inventory"]}
    base="/repo/docs/verified-architecture-phase2-v3/root-admitter-candidate/"
    bp=pins["boot_pair_freeze"]
    for key,rel in (("rootfs","root-admitter-rootfs.ext4"),("verity","root-admitter-rootfs.verity"),
                    ("dm_verity_metadata","dm-verity-metadata.v1.json"),("boot_policy","rootfs/trust/boot-policy.v1")):
        ent=rr.get(base+rel,{})
        if not v.chk(f"boot-pair:{key}", ent.get("sha256")==bp[key]["sha256"] and ent.get("size")==bp[key]["bytes"], "E_BOOT_PAIR", key): return finish(v,a)
    oim=pins["offline_input_manifest"]
    for key in ("bin","sig","public_key"):
        ent=rr.get("/input-manifest/"+oim[key]["source_name"],{})
        if not v.chk(f"input-manifest:{key}", ent.get("sha256")==oim[key]["sha256"], "E_INPUT_MANIFEST", key): return finish(v,a)
    ri={e["path"]:e for e in insp["reviewed-input"]["inventory"]}
    for e in pins["offline_inputs"]:
        ent=ri.get(e["image_path"],{})
        if not v.chk("offline-input:"+e["source_name"], ent.get("sha256")==e["sha256"] and ent.get("size")==e["bytes"], "E_INPUT_PIN", e["source_name"]): return finish(v,a)
    for e in pins["review_evidence"]:
        ent=ri.get(e["image_path"],{})
        if not v.chk("review-evidence:"+e["source_name"], ent.get("sha256")==e["sha256"] and ent.get("size")==e["bytes"], "E_INPUT_PIN", e["source_name"]): return finish(v,a)
    if not v.chk("binding", ri.get("/binding.v1.json",{}).get("sha256")==m["binding_v1_sha256"], "E_BINDING"): return finish(v,a)
    for name in ROLES:
        if not v.chk(f"dual-build:{name}", m["dual_build"]["build1"][name]==m["dual_build"]["build2"][name], "E_DUAL_BUILD", name): return finish(v,a)

    if not v.chk("target:schema", set(spec)==SPEC_KEYS, "E_TARGET_SCHEMA", ",".join(sorted(set(spec)^SPEC_KEYS))): return finish(v,a)
    if not v.chk("target:status", spec["status"]=="DECLARATIVE-UNEXECUTED", "E_TARGET_SCHEMA"): return finish(v,a)
    if not v.chk("target:arch", spec["architecture"]=="x86_64", "E_TARGET_ARCH", spec["architecture"]): return finish(v,a)
    disks=spec["disks"]
    names={d["device_name"] for d in disks}
    if not v.chk("target:disk-set", len(disks)==6 and names==set(EXPECTED_DISKS), "E_TARGET_DISK", ",".join(sorted(names))): return finish(v,a)
    ok=all(set(d)=={"device_name","role","size_gb","mode","source","source_sha256","source_bytes"} and EXPECTED_DISKS[d["device_name"]]==d["role"] for d in disks)
    if not v.chk("target:disk-roles", ok, "E_TARGET_DISK"): return finish(v,a)
    ok=True
    for d in disks:
        if d["device_name"]=="v3-rootfs-data" and d["source_sha256"]!=bp["rootfs"]["sha256"]: ok=False
        if d["device_name"]=="v3-rootfs-hash" and d["source_sha256"]!=bp["verity"]["sha256"]: ok=False
        if d["device_name"].startswith("v3-reviewed-") and d["source_sha256"]!=m["images"][d["role"]]["image"]["sha256"]: ok=False
    if not v.chk("target:disk-sources", ok, "E_TARGET_DISK"): return finish(v,a)
    b=spec["boot"]
    if not v.chk("target:boot-disk-name", not b["boot_disk_device_name"].startswith("v3-"), "E_TARGET_DISK", b["boot_disk_device_name"]): return finish(v,a)
    if not v.chk("target:boot-entries", b["boot_entries"]==1, "E_TARGET_BOOT"): return finish(v,a)
    if not v.chk("target:uki", b["uki_sha256"]==UKI_SHA, "E_TARGET_BOOT", "uki sha256"): return finish(v,a)
    s=spec["secure_boot"]
    if not v.chk("target:db-count", s["db_entry_count"]==1 and len(s["dbs"])==1, "E_TARGET_DB"): return finish(v,a)
    if not v.chk("target:db-cert", s["dbs"][0]["sha256"]==CERT_SHA and s["dbs"][0]["bytes"]==1092, "E_TARGET_DB", "cert sha256"): return finish(v,a)
    if not v.chk("target:dbxs", s["dbxs"]==[], "E_TARGET_DB", "dbxs"): return finish(v,a)
    n=spec["network"]
    if not v.chk("target:network", n["external_ip"] is False and n["firewall"]["ingress"]=="deny-all" and n["firewall"]["egress"]=="deny-all", "E_TARGET_NETWORK"): return finish(v,a)
    if not v.chk("target:cost", spec["cost"]["intended_usd"]==0, "E_TARGET_COST"): return finish(v,a)
    return finish(v,a,insp)

def finish(v,a,insp=None):
    rep={"validator":"verify-p2-staging.py","result":"PASS" if v.first is None else "FAIL",
         "first_error":v.first,"checks":v.checks,
         "images":{n:{"bytes":insp[n]["image"]["bytes"],"sha256":insp[n]["image"]["sha256"]} for n in insp} if insp else {}}
    out=json.dumps(rep,sort_keys=True,separators=(",",":"))+"\n"
    open(a.report,"w").write(out)
    sys.stdout.write(out)
    sys.exit(0 if v.first is None else 1)

main()
