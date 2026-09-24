#!/usr/bin/env python3
# verify-uki-layout.py - fail-closed structural/layout gate for an unsigned UKI PE file.
# Companion to provisioning/p3/rehearsal/UKI-13309697-ROOT-CAUSE.md.
# Proves the gapless layout: first section rawptr == SizeOfHeaders; each next rawptr ==
# prev rawptr + rawsz; last section end == file size; no overlaps; FileAlignment respected;
# VAs strictly ascending and SectionAlignment-aligned; SizeOfImage consistent with the last
# VA + VirtualSize; security directory zero (unsigned input to the ceremony); no trailing
# data; file size % 8 == 0. ALSO proves the core invariant: the contiguous Authenticode
# digest == the EDK2 section-wise Authenticode digest (both printed; they must be EQUAL -
# on a gapless file every signer, standard or naive, embeds the firmware's digest).
# usage: check-uki-layout.py <file.efi>        exit 0 PASS / 91 FAIL (E_UKI_LAYOUT_* / E_UKI_DIGEST_*)
import sys, json, hashlib, struct

E = []
def fail(code, msg): E.append((code, msg))

def parse(b):
    e_lfanew = struct.unpack_from("<I", b, 0x3c)[0]
    if b[e_lfanew:e_lfanew+4] != b"PE\0\0": fail("E_UKI_LAYOUT_PE","no PE signature"); return None
    coff = e_lfanew + 4
    nsec = struct.unpack_from("<H", b, coff+2)[0]
    optsz = struct.unpack_from("<H", b, coff+16)[0]
    opt = coff + 20
    magic = struct.unpack_from("<H", b, opt)[0]
    if magic == 0x20b: dd = opt + 112
    elif magic == 0x10b: dd = opt + 96
    else: fail("E_UKI_LAYOUT_PE","bad optional-header magic 0x%04x"%magic); return None
    secs = []
    for i in range(nsec):
        o = opt + optsz + i*40
        name = b[o:o+8].rstrip(b"\0").decode("ascii","replace")
        vsz, va, rawsz, rawptr = struct.unpack_from("<IIII", b, o+8)
        secs.append({"name":name,"va":va,"vsz":vsz,"rawsz":rawsz,"rawptr":rawptr})
    psym, nsym = struct.unpack_from("<II", b, coff+8)
    dirs = [struct.unpack_from("<II", b, dd+i*8) for i in range(16)]
    return {"psym":psym,"nsym":nsym,"dirs":dirs,"nsec":nsec,"soh":struct.unpack_from("<I",b,opt+60)[0],
            "soi":struct.unpack_from("<I",b,opt+56)[0],
            "sa":struct.unpack_from("<I",b,opt+32)[0],
            "fa":struct.unpack_from("<I",b,opt+36)[0],
            "csum_off":opt+64,"secdir_off":dd+4*8,
            "secdir":struct.unpack_from("<II",b,dd+4*8),"secs":secs}

def auth_digest(b, p, contiguous):
    h = hashlib.sha256()
    h.update(b[:p["csum_off"]]); h.update(b[p["csum_off"]+4:p["secdir_off"]])
    h.update(b[p["secdir_off"]+8:p["soh"]])
    cva, csz = p["secdir"]
    end = cva if cva else len(b)
    if contiguous:
        h.update(b[p["soh"]:end])
    else:
        secs = sorted([s for s in p["secs"] if s["rawsz"]>0], key=lambda s: s["rawptr"])
        for s in secs: h.update(b[s["rawptr"]:s["rawptr"]+s["rawsz"]])
        sobh = p["soh"] + sum(s["rawsz"] for s in secs)
        if end > sobh: h.update(b[sobh:end])
    return h.hexdigest()

b = open(sys.argv[1],"rb").read()
p = parse(b)
if p:
    secs = p["secs"]
    if p["secdir"] != (0,0): fail("E_UKI_LAYOUT_SECDIR","security directory not zero: %r"%(p["secdir"],))
    if p["psym"] != 0 or p["nsym"] != 0:
        fail("E_UKI_LAYOUT_SYMTAB","COFF symbol table not zeroed: PointerToSymbolTable=%d NumberOfSymbols=%d"%(p["psym"],p["nsym"]))
    DIRN = ["export","import","resource","exception","security","basereloc","debug","arch","globalptr","tls","loadconfig","boundimport","iat","delayimport","clr","reserved"]
    for di,(rva,sz) in enumerate(p["dirs"]):
        if di == 4: continue  # security checked above
        if (rva,sz) == (0,0): continue
        hit = [s for s in secs if s["va"] <= rva and rva+sz <= s["va"]+max(s["vsz"],s["rawsz"])]
        if not hit: fail("E_UKI_LAYOUT_DIR_UNRESOLVED","data directory %s RVA=0x%x size=%d resolves in no section"%(DIRN[di],rva,sz))
    if len(b) % 8 != 0: fail("E_UKI_LAYOUT_SIZE_ALIGN","file size %d not 8-aligned"%len(b))
    prev_end = p["soh"]; prev_va = None
    for s in sorted(secs, key=lambda s: s["rawptr"]):
        if s["rawsz"] == 0: continue
        if s["rawptr"] < prev_end: fail("E_UKI_LAYOUT_OVERLAP","%s rawptr=%d overlaps (prev end %d)"%(s["name"],s["rawptr"],prev_end))
        if s["rawptr"] != prev_end: fail("E_UKI_LAYOUT_GAP","%s rawptr=%d, gap of %d bytes before it"%(s["name"],s["rawptr"],s["rawptr"]-prev_end))
        if s["rawsz"] % p["fa"] != 0: fail("E_UKI_LAYOUT_RAWSZ_ALIGN","%s rawsz=%d not FileAlignment(%d)-multiple"%(s["name"],s["rawsz"],p["fa"]))
        if s["rawptr"] + s["rawsz"] > len(b): fail("E_UKI_LAYOUT_BOUNDS","%s raw data past EOF"%s["name"])
        if prev_va is not None and s["va"] <= prev_va: fail("E_UKI_LAYOUT_VA_ORDER","%s VA not ascending"%s["name"])
        if s["va"] % p["sa"] != 0: fail("E_UKI_LAYOUT_VA_ALIGN","%s VA=0x%x not SectionAlignment(%d)-aligned"%(s["name"],s["va"],p["sa"]))
        prev_end = s["rawptr"] + s["rawsz"]; prev_va = s["va"]
    if secs:
        last = max(secs, key=lambda s: s["rawptr"]+s["rawsz"])
        if last["rawptr"] + last["rawsz"] != len(b):
            fail("E_UKI_LAYOUT_TRAILING","%d trailing bytes after last section"%(len(b)-(last["rawptr"]+last["rawsz"])))
        top = max(s["va"] + max(s["vsz"], s["rawsz"]) for s in secs)
        soi_want = (top + p["sa"] - 1)//p["sa"]*p["sa"]
        if p["soi"] != soi_want: fail("E_UKI_LAYOUT_SIZEOFIMAGE","SizeOfImage=%d want %d"%(p["soi"],soi_want))
        first = min(secs, key=lambda s: s["rawptr"])
        if first["rawptr"] != p["soh"]: fail("E_UKI_LAYOUT_FIRST_RAWPTR","first rawptr=%d != SizeOfHeaders=%d"%(first["rawptr"],p["soh"]))
    sw = auth_digest(b, p, False); ct = auth_digest(b, p, True)
    if sw != ct: fail("E_UKI_DIGEST_METHOD_MISMATCH","section-wise=%s contiguous=%s"%(sw,ct))
    print(json.dumps({"result":"PASS" if not E else "FAIL","file":sys.argv[1],"bytes":len(b),
        "file_sha256":hashlib.sha256(b).hexdigest(),
        "sectionwise_authenticode_sha256":sw,"contiguous_authenticode_sha256":ct,
        "errors":E}, indent=1, sort_keys=True))
    sys.exit(0 if not E else 91)
print(json.dumps({"result":"FAIL","errors":E}, sort_keys=True)); sys.exit(91)
