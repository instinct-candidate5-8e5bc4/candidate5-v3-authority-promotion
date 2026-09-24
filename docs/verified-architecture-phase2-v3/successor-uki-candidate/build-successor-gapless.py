#!/usr/bin/env python3
# build-successor-gapless.py - deterministic gapless rebuild of the successor UKI.
# Root cause and equivalence proofs: provisioning/p3/rehearsal/UKI-13309697-ROOT-CAUSE.md. Pure stdlib, no network, no
# timestamps. Inputs are the committed, hash-pinned artifacts:
#   root-admitter-candidate/uki/linuxx64.efi.stub    sha256 96dc5f83..
#   root-admitter-candidate/uki/vmlinuz              sha256 b253def2..
#   root-admitter-candidate/uki/cmdline              sha256 c95bc0a1..
#   successor-uki-candidate/successor-initramfs.cpio sha256 d62e7c87..
# The old builder appended the payload sections at the stub's 512-ALIGNED EOF (61440),
# turning the stub's trailing 10,240-byte overlay (6,481 non-zero junk bytes) into an
# INTER-SECTION GAP. This builder packs every section contiguously: each PointerToRawData
# equals the previous section's end. All section CONTENTS and the ENTIRE virtual layout
# (VAs, VirtualSizes, SizeOfImage) are byte-identical to the old UKI; only file offsets
# change. Fail-closed with E_UKI_BUILD_* on any input or structural deviation.
# usage: build-uki-gapless.py <candidate-root> <out.efi>
import sys, os, json, hashlib, struct

def die(code, msg):
    print(json.dumps({"result":"FAIL","code":code,"detail":msg}, sort_keys=True)); sys.exit(91)

def sha(b): return hashlib.sha256(b).hexdigest()

PINS = {
 "stub":   ("root-admitter-candidate/uki/linuxx64.efi.stub",
            "96dc5f83c624fd9976b5e431c6ad572ee3cc5aded400d2e0729abf422bdfc7b6"),
 "linux":  ("root-admitter-candidate/uki/vmlinuz",
            "b253def256f2560ed9b658830ca9ec2783bb51f3c5dcb0d9b5c695b6554d70fb"),
 "cmdline":("root-admitter-candidate/uki/cmdline",
            "c95bc0a143ab65365ac3a4ef035c00404f53c82b18bc38938b716df838dd0416"),
 "initrd": ("successor-uki-candidate/successor-initramfs.cpio",
            "d62e7c879186110c9767f52337bfef23040a034871cdc4138b1ec601f0a78d59"),
}
root, outp = sys.argv[1], sys.argv[2]
blobs = {}
for k,(rel,h) in PINS.items():
    p = os.path.join(root, rel)
    if not os.path.exists(p): die("E_UKI_BUILD_INPUT_MISSING", rel)
    b = open(p,"rb").read()
    if sha(b) != h: die("E_UKI_BUILD_INPUT_HASH", rel+" sha256="+sha(b))
    blobs[k] = b

stub = blobs["stub"]
e_lfanew = struct.unpack_from("<I", stub, 0x3c)[0]
if stub[e_lfanew:e_lfanew+4] != b"PE\0\0": die("E_UKI_BUILD_PE", "no PE signature")
coff = e_lfanew + 4
nsec = struct.unpack_from("<H", stub, coff+2)[0]
optsz = struct.unpack_from("<H", stub, coff+16)[0]
opt = coff + 20
if struct.unpack_from("<H", stub, opt)[0] != 0x20b: die("E_UKI_BUILD_PE", "not PE32+")
soh  = struct.unpack_from("<I", stub, opt+60)[0]
sa   = struct.unpack_from("<I", stub, opt+32)[0]
fa   = struct.unpack_from("<I", stub, opt+36)[0]
if struct.unpack_from("<II", stub, opt+112+4*8) != (0,0):
    die("E_UKI_BUILD_SECDIR", "stub carries a certificate table")
secbase = opt + optsz
EXPECT_STUB_SECTIONS = [
 (".text",   0x4000,  0x86a0, 34816, 1024),
 (".reloc",  0xd000,  0xc,      512, 35840),
 (".data",   0xe000,  0x20e8,  8704, 36352),
 (".dynamic",0x11000, 0x110,    512, 45056),
 (".rela",   0x12000, 0xe58,   4096, 45568),
 (".dynsym", 0x13000, 0x438,   1536, 49664),
]
if nsec != len(EXPECT_STUB_SECTIONS): die("E_UKI_BUILD_STUB_SECTIONS", "nsec=%d"%nsec)
sects = []   # [name, va, vsz, rawsz, rawptr, flags, content]
for i,(name,va,vsz,rawsz,rawptr) in enumerate(EXPECT_STUB_SECTIONS):
    o = secbase + i*40
    nm = stub[o:o+8].rstrip(b"\0").decode()
    v,av,rs,rp = struct.unpack_from("<IIII", stub, o+8)
    fl = struct.unpack_from("<I", stub, o+36)[0]
    if (nm,av,v,rs,rp) != (name,va,vsz,rawsz,rawptr):
        die("E_UKI_BUILD_STUB_SECTIONS", "%r va=0x%x vsz=0x%x rawsz=%d rawptr=%d"%(nm,av,v,rs,rp))
    sects.append([name, va, vsz, rawsz, rawptr, fl, stub[rawptr:rawptr+rawsz]])
last_end = max(rp+rs for _,_,_,rs,rp,_,_ in sects)
if last_end != 51200 or len(stub) < last_end:
    die("E_UKI_BUILD_STUB_LAYOUT", "last section end=%d stub len=%d"%(last_end,len(stub)))

PAYLOAD = [(".cmdline","cmdline",0x40000040), (".linux","linux",0x60000020), (".initrd","initrd",0x40000040)]
va = max(av + max(v, rs) for _,av,v,rs,_,_,_ in sects)
va = (va + sa - 1)//sa*sa
raw = last_end  # PACK: first payload section starts exactly at the last stub section's end
out = bytearray(stub[:last_end])
new_secs = [s[:] for s in sects]
for name,key,flags in PAYLOAD:
    payload = blobs[key]
    rs = (len(payload) + fa - 1)//fa*fa
    new_secs.append([name, va, len(payload), rs, raw, flags, payload])
    raw += rs
    va = (va + len(payload) + sa - 1)//sa*sa
    out.extend(payload + b"\0"*(rs - len(payload)))

hdr = bytearray(out[:soh])
struct.pack_into("<H", hdr, coff+2, len(new_secs))
# PE deprecates the COFF symbol table for images; the stub's table (PointerToSymbolTable=51200,
# NumberOfSymbols=315) was the inter-section gap in the old UKI and is NOT carried into the
# packed layout - leaving the pointer would reference moved section data. Zero both fields.
struct.pack_into("<II", hdr, coff+8, 0, 0)
struct.pack_into("<I", hdr, opt+56, va)  # SizeOfImage (same VA arithmetic as the old builder)
for i,(name,av,v,rs,rp,fl,_) in enumerate(new_secs):
    o = secbase + i*40
    hdr[o:o+40] = name.encode().ljust(8,b"\0") + struct.pack("<IIIIIIHHI", v, av, rs, rp, 0,0,0,0, fl)
out[:soh] = hdr
open(outp,"wb").write(bytes(out))
print(json.dumps({"result":"BUILT","out":outp,"bytes":len(out),"sha256":sha(bytes(out)),
                  "size_of_image":va,
                  "sections":[[s[0],s[1],s[2],s[3],s[4]] for s in new_secs]}, sort_keys=True))
