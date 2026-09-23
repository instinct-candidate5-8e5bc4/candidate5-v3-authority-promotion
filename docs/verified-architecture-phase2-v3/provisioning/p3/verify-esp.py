#!/usr/bin/env python3
# verify-esp.py - proves the ESP boot disk image has exactly one boot path.
# Checks: protective MBR (zero boot code, one 0xEE entry), GPT (declared disk GUID,
# exactly one partition, type EFI System, declared partition GUID/name), FAT32
# (exactly one regular file in the whole filesystem: /EFI/BOOT/BOOTX64.EFI, exact
# size and SHA-256 of the signed UKI). Canonical JSON on stdout; exit 1 on any failure.
import json, struct, sys, hashlib

UKI_SHA256="133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1"
UKI_BYTES=21166416
DISK_GUID="a42ac99f-298e-71d7-54e9-69cea084f6d6"
PART_GUID="a1eee143-302e-bfce-2da6-410baab6c2ea"
IMG_BYTES=10737418240
ESP_TYPE="c12a7328-f81f-11d2-ba4b-00a0c93ec93b"

def die(code, detail=""):
    print(json.dumps({"result":"FAIL","error":code,"detail":detail}))
    sys.exit(1)
def guid_le(b):
    return "%08x-%04x-%04x-%s-%s" % (struct.unpack_from("<I",b,0)[0],
        struct.unpack_from("<H",b,4)[0], struct.unpack_from("<H",b,6)[0],
        b[8:10].hex(), b[10:16].hex())

def main():
    img=sys.argv[1]
    size=0
    with open(img,"rb") as f:
        f.seek(0,2); size=f.tell()
        if size!=IMG_BYTES: die("E_SIZE",str(size))
        f.seek(0); mbr=f.read(512)
        if any(mbr[0:446]): die("E_MBR_BOOTCODE")
        if mbr[446+4]!=0xEE: die("E_MBR_PROTECTIVE")
        if any(mbr[446+16:510]): die("E_MBR_EXTRA_ENTRIES")
        f.seek(512); gpt=f.read(512)
        if gpt[0:8]!=b"EFI PART": die("E_GPT_MAGIC")
        dg=guid_le(gpt[56:72])
        if dg!=DISK_GUID: die("E_GPT_DISK_GUID",dg)
        nent=struct.unpack_from("<I",gpt,80)[0]
        ent_sz=struct.unpack_from("<I",gpt,84)[0]
        pe_lba=struct.unpack_from("<Q",gpt,72)[0]
        parts=[]
        f.seek(pe_lba*512)
        for i in range(nent):
            e=f.read(ent_sz)
            if e[0:16]!=b"\0"*16: parts.append(e)
        if len(parts)!=1: die("E_GPT_PART_COUNT",str(len(parts)))
        p=parts[0]
        if guid_le(p[0:16])!=ESP_TYPE: die("E_PART_TYPE",guid_le(p[0:16]))
        pg=guid_le(p[16:32])
        if pg!=PART_GUID: die("E_PART_GUID",pg)
        pname=p[56:128].decode("utf-16-le").rstrip("\0")
        if pname!="EFI System": die("E_PART_NAME",pname)
        first_lba=struct.unpack_from("<Q",p,32)[0]
        last_lba=struct.unpack_from("<Q",p,40)[0]
        part_off=first_lba*512
        f.seek(part_off); bpb=f.read(512)
        if bpb[82:90].rstrip()!=b"FAT32": die("E_FS_TYPE",bpb[82:90].decode(errors="replace"))
        bps=struct.unpack_from("<H",bpb,11)[0]; spc=bpb[13]
        reserved=struct.unpack_from("<H",bpb,14)[0]; nfats=bpb[16]
        fat_secs=struct.unpack_from("<I",bpb,36)[0]; root=struct.unpack_from("<I",bpb,44)[0]
        fat_start=part_off+reserved*bps
        data_start=part_off+(reserved+nfats*fat_secs)*bps
        clus=lambda n: data_start+(n-2)*bps*spc
        f.seek(fat_start); fat=f.read(fat_secs*bps)
        def chain(start):
            out=[]; c=start
            while c<0x0FFFFFF8:
                out.append(c)
                c=struct.unpack_from("<I",fat,c*4)[0]&0x0FFFFFFF
            return out
        files=[]
        def walk(clus_n, prefix):
            f.seek(clus(clus_n)); d=f.read(bps*spc)
            for i in range(0,len(d),32):
                e=d[i:i+32]
                if e[0]==0x00: return
                if e[0]==0xE5 or e[11]==0x0F: continue
                name=e[0:11].decode("ascii",errors="replace").strip()
                base=name[0:8].rstrip(); ext=name[8:11].rstrip() if len(name)>8 else ""
                nm=base+("."+ext if ext else "")
                attr=e[11]; fc=struct.unpack_from("<H",e,20)[0]<<16|struct.unpack_from("<H",e,26)[0]
                sz=struct.unpack_from("<I",e,28)[0]
                if attr&0x10:
                    walk(fc, prefix+"/"+nm)
                else:
                    path=prefix+"/"+nm
                    h=hashlib.sha256()
                    cl=chain(fc)
                    if len(cl)*bps*spc<sz: die("E_CHAIN_SHORT")
                    if all(cl[i+1]==cl[i]+1 for i in range(len(cl)-1)):
                        f.seek(clus(cl[0])); remaining=sz
                        while remaining>0:
                            chunk=f.read(min(remaining,8*1024*1024))
                            if not chunk: die("E_FILE_READ")
                            h.update(chunk); remaining-=len(chunk)
                    else:
                        remaining=sz
                        for c in cl:
                            f.seek(clus(c))
                            chunk=f.read(min(remaining,bps*spc))
                            h.update(chunk); remaining-=len(chunk)
                    files.append({"path":path,"size":sz,"sha256":h.hexdigest()})
        walk(root,"")
    if len(files)!=1: die("E_FILE_COUNT",json.dumps(files)[:300])
    if files[0]["path"]!="/EFI/BOOT/BOOTX64.EFI": die("E_BOOT_PATH",files[0]["path"])
    if files[0]["size"]!=UKI_BYTES or files[0]["sha256"]!=UKI_SHA256: die("E_UKI",files[0]["sha256"])
    out={"result":"PASS","image":{"bytes":size},"disk_guid":dg,
         "partition":{"guid":pg,"type":ESP_TYPE,"name":pname,"first_lba":first_lba,"last_lba":last_lba},
         "filesystem":{"type":"FAT32","files":files},
         "single_boot_path":True}
    print(json.dumps(out,sort_keys=True,separators=(",",":")))
main()
