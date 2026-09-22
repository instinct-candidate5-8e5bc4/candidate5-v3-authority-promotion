#!/usr/bin/env python3
# inspect-image.py - deterministic structural inspection of one P2 staging ext4 image.
# stdlib + debugfs/e2fsck only; no mounting, no root. Emits canonical compact JSON.
# usage: inspect-image.py <image.ext4>   (JSON on stdout, exit 0) or exit 1 + E_ code on stderr.
import json, subprocess, sys, os, hashlib, struct, tempfile, shutil, re

COMPAT={0x0001:"dir_prealloc",0x0002:"imagic_inodes",0x0004:"has_journal",0x0008:"ext_attr",0x0010:"resize_inode",0x0020:"dir_index"}
INCOMPAT={0x0001:"compression",0x0002:"filetype",0x0004:"recover",0x0008:"journal_dev",0x0010:"meta_bg",0x0040:"extent",0x0080:"64bit",0x0100:"mmp",0x0200:"flex_bg",0x0400:"ea_inode",0x1000:"dirdata",0x2000:"csum_seed",0x4000:"large_dir",0x8000:"inline_data",0x10000:"encrypt",0x20000:"casefold"}
ROCOMPAT={0x0001:"sparse_super",0x0002:"large_file",0x0004:"btree_dir",0x0008:"huge_file",0x0010:"uninit_bg",0x0020:"dir_nlink",0x0040:"extra_isize",0x0080:"has_snapshot",0x0100:"quota",0x0200:"bigalloc",0x0400:"metadata_csum",0x0800:"replica",0x1000:"readonly",0x2000:"project",0x8000:"verity",0x10000:"orphan_present",0x20000:"shared_blocks"}
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
def die(code, detail=""):
    print(code, detail, file=sys.stderr); sys.exit(1)
def sha256fp(fp):
    h=hashlib.sha256()
    with open(fp,"rb") as f:
        for c in iter(lambda:f.read(1<<20),b""): h.update(c)
    return h.hexdigest()
def feats(bits, table):
    out=[]; unknown=bits
    for b in sorted(table):
        if bits&b: out.append(table[b]); unknown&=~b
    if unknown: die("E_FEATURE_UNKNOWN", hex(unknown))
    return out
def fmt_uuid(b):
    h=b.hex()
    return f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"

def main():
    img=sys.argv[1]
    size=os.path.getsize(img)
    with open(img,"rb") as f:
        f.seek(1024); sb=f.read(1024)
    if struct.unpack_from("<H",sb,0x38)[0]!=0xEF53: die("E_SB_MAGIC")
    u32=lambda o: struct.unpack_from("<I",sb,o)[0]
    u16=lambda o: struct.unpack_from("<H",sb,o)[0]
    label=sb[0x78:0x88].split(b"\0")[0].decode()
    block_size=1024<<u32(0x18)
    sup={
      "block_count": u32(0x04)+(u32(0x150)<<32),
      "block_size": block_size,
      "blocks_free": u32(0x0C),
      "checksum": "%08x"%u32(0x3FC),
      "checksum_valid": raw_crc32c(sb[:1020])==u32(0x3FC),
      "compat_features": feats(u32(0x5C),COMPAT),
      "incompat_features": feats(u32(0x60),INCOMPAT),
      "ro_compat_features": feats(u32(0x64),ROCOMPAT),
      "errors_behavior": u16(0x3C),
      "first_ino": u32(0x54),
      "inode_count": u32(0x00),
      "inode_size": u16(0x58),
      "inodes_free": u32(0x10),
      "inodes_per_group": u32(0x28),
      "label": label,
      "lastcheck": u32(0x40),
      "mkfs_time": u32(0x108),
      "mnt_count": u16(0x34),
      "mtime": u32(0x2C),
      "state": u16(0x3A),
      "superblock_hex": sb.hex(),
      "uuid": fmt_uuid(sb[0x68:0x78]),
      "wtime": u32(0x30),
    }
    if not sup["checksum_valid"]: die("E_SB_CHECKSUM")
    # e2fsck read-only
    rc=subprocess.run(["e2fsck","-fn",img],capture_output=True).returncode
    # inventory: rdump + walk
    tmp=tempfile.mkdtemp(prefix="inspect-")
    try:
        r=subprocess.run(["debugfs","-R",f"rdump / {tmp}",img],capture_output=True)
        if r.returncode!=0: die("E_DEBUGFS_RDUMP", r.stderr.decode(errors="replace")[:200])
        entries=[]
        for root,dirs,files in os.walk(tmp):
            dirs.sort(); files.sort()
            for name in dirs+files:
                fp=os.path.join(root,name)
                rel="/"+os.path.relpath(fp,tmp)
                st=os.lstat(fp)
                if not re.fullmatch(r"[ -~]+", rel) or "\\" in rel:
                    die("E_PATH_CHARSET", rel)
                if os.path.islink(fp):
                    entries.append({"path":rel,"type":"symlink","size":st.st_size,"target":os.readlink(fp)})
                elif os.path.isdir(fp):
                    entries.append({"path":rel,"type":"dir","size":st.st_size})
                else:
                    entries.append({"path":rel,"type":"file","size":st.st_size,"sha256":sha256fp(fp)})
        # stat batch for modes/owners/times
        cmdfile=os.path.join(tmp+".cmds")
        with open(cmdfile,"w") as cf:
            cf.write("stat /\n")
            for e in entries: cf.write(f"stat {e['path']}\n")
        r=subprocess.run(["debugfs","-f",cmdfile,img],capture_output=True)
        if r.returncode!=0: die("E_DEBUGFS_STAT", r.stderr.decode(errors="replace")[:200])
        blocks=r.stdout.decode(errors="replace").split("Inode:")
        svals=[]
        for b in blocks[1:]:
            m=re.search(r"Type: (\w+)\s+Mode:\s+(\d+)",b)
            ug=re.search(r"User:\s+(\d+)\s+Group:\s+(\d+)",b)
            if not m or not ug: die("E_STAT_PARSE")
            times={}
            for tf in ("ctime","atime","mtime","crtime"):
                tm=re.search(tf+r": 0x([0-9a-f]+):([0-9a-f]+)",b)
                if not tm: die("E_STAT_PARSE", tf)
                times[tf]=int(tm.group(1),16)
                if int(tm.group(2),16)!=0: die("E_TIME_NS")
            sz=re.search(r"Size: (\d+)",b)
            if not sz: die("E_STAT_PARSE","size")
            svals.append({"mode":m.group(2)[-4:],"uid":int(ug.group(1)),"gid":int(ug.group(2)),"type":m.group(1),"size":int(sz.group(1)),**times})
        if len(svals)!=len(entries)+1: die("E_STAT_COUNT", f"{len(svals)} != {len(entries)+1}")
        root_s=svals.pop(0)
        entries.insert(0,{"path":"/","type":"dir","size":root_s["size"],"mode":root_s["mode"],"uid":root_s["uid"],"gid":root_s["gid"],
                          "atime":root_s["atime"],"ctime":root_s["ctime"],"mtime":root_s["mtime"],"crtime":root_s["crtime"]})
        for e,s in zip(entries[1:],svals):
            e.update({"mode":s["mode"],"uid":s["uid"],"gid":s["gid"],
                      "atime":s["atime"],"ctime":s["ctime"],"mtime":s["mtime"],"crtime":s["crtime"]})
            tmap={"directory":"dir","regular":"file","symlink":"symlink"}
            if tmap.get(s["type"],"?")!=e["type"]: die("E_STAT_TYPE", e["path"])
            if e["type"]=="dir":
                e["size"]=s["size"]
            elif e["size"]!=s["size"]: die("E_SIZE_MISMATCH", e["path"])
    finally:
        shutil.rmtree(tmp,ignore_errors=True)
        if os.path.exists(tmp+".cmds"): os.unlink(tmp+".cmds")
    out={"image":{"bytes":size,"sha256":sha256fp(img)},
         "superblock":sup,
         "e2fsck_clean": rc==0,
         "inventory":entries}
    print(json.dumps(out,sort_keys=True,separators=(",",":")))

main()
