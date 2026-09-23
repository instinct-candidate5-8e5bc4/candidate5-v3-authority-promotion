#!/usr/bin/env python3
# Structural OVMF VARS parser (peer correction D). Stdlib-only, deterministic, read-only.
# Parses an OVMF VARS fd: FV header(s), authenticated variable store, per-variable
# auth headers, names, GUIDs, attributes; full ESL semantics for PK/KEK/db/dbx
# (signature lists: type GUID, owner GUID, entry sizes, cert DER hashes); boot
# variables (BootOrder/Boot####) enumerated structurally. Exit 0 = parse OK.
import sys, struct, hashlib, json

GUID_AUTH_STORE = bytes.fromhex("782cf3aa7b949a43a1802e144ec37792")
ESL_X509 = bytes.fromhex("a159c0a5e494a74a87b5ab155c2bf072")  # EFI_CERT_X509_GUID on-disk

def guid_str(b):
    d1,d2,d3=struct.unpack_from("<IHH",b,0)
    d4=b[8:10].hex(); d5=b[10:16].hex()
    return f"{d1:08x}-{d2:04x}-{d3:04x}-{d4[:4]}-{d4[4:]}{d5}"[:36]

def parse_esl(data):
    lists=[]; off=0
    while off+28<=len(data):
        stype=data[off:off+16]; lsz,hdrsz,esz=struct.unpack_from("<III",data,off+16)
        if lsz<28 or off+lsz>len(data):
            return lists, f"E_ESL_BOUNDS@{off}"
        entries=[]
        body=off+28+hdrsz
        end=off+lsz
        if esz<16: return lists, f"E_ESL_ENTSIZE@{off}"
        while body+esz<=end:
            owner=data[body:body+16]
            edata=data[body+16:body+esz]
            entries.append({"owner":guid_str(owner),
                            "type":"X509" if stype==ESL_X509 else guid_str(stype),
                            "data_sha256":hashlib.sha256(edata).hexdigest(),
                            "data_len":len(edata)})
            body+=esz
        if body!=end: return lists, f"E_ESL_TRAILING@{off}"
        lists.append({"sig_type":"X509" if stype==ESL_X509 else guid_str(stype),
                      "list_size":lsz,"header_size":hdrsz,"entry_size":esz,"entries":entries})
        off+=lsz
    if off!=len(data): return lists, f"E_ESL_TRAILING_END@{off}"
    return lists, None

def parse_vars(path):
    d=open(path,"rb").read()
    out={"file":path,"bytes":len(d),"file_sha256":hashlib.sha256(d).hexdigest()}
    i=d.find(GUID_AUTH_STORE)
    if i<0: out["error"]="E_NO_AUTH_STORE"; return out
    store_size=struct.unpack_from("<I",d,i+16)[0]
    out["store"]={"offset":i,"size":store_size,"format":d[i+20],"state":hex(d[i+21])}
    out["variables"]=[]
    v=i+28
    end=i+store_size
    errors=[]
    while v+44<=end:
        start=struct.unpack_from("<H",d,v)[0]
        if start==0xFFFF: break
        if start!=0x55AA:
            errors.append(f"E_VAR_START@{v}"); break
        state=d[v+2]; attr=struct.unpack_from("<I",d,v+4)[0]
        mono=struct.unpack_from("<Q",d,v+8)[0]
        nsz,dsz=struct.unpack_from("<II",d,v+36)
        vg=d[v+44:v+60]
        name_raw=d[v+60:v+60+nsz]
        data=d[v+60+nsz:v+60+nsz+dsz]
        if v+60+nsz+dsz>end: errors.append(f"E_VAR_BOUNDS@{v}"); break
        # decode first (name_size is even, includes the NUL terminator), then strip the
        # terminator: byte-level rstrip would eat the last UTF-16 unit's high zero byte and
        # make every populated-store name undecodable (latent bug caught by the
        # enroll-predicate-check.py synthetic fixtures, 2026-09-23).
        try: name=name_raw.decode("utf-16-le","strict").rstrip("\x00")
        except Exception: name="<undecodable>"
        rec={"offset":v,"name":name,"vendor_guid":guid_str(vg),"state":hex(state),
             "attributes":hex(attr),"monotonic":mono,"name_size":nsz,"data_size":dsz,
             "data_sha256":hashlib.sha256(data).hexdigest()}
        if name in ("PK","KEK","db","dbx"):
            lists,err=parse_esl(data)
            rec["esl_lists"]=lists
            rec["esl_entry_count"]=sum(len(l["entries"]) for l in lists)
            rec["esl_list_count"]=len(lists)
            if err: rec["esl_error"]=err
        if name.startswith("Boot") and name!="BootOrder":
            rec["boot_option"]=True
        out["variables"].append(rec)
        v=v+60+nsz+dsz
        v=(v+3)&~3
    if errors: out["errors"]=errors
    names=[x["name"] for x in out["variables"]]
    out["summary"]={"variable_count":len(out["variables"]),
        "names":names,
        "pk_entries":next((x.get("esl_entry_count") for x in out["variables"] if x["name"]=="PK"),None),
        "kek_entries":next((x.get("esl_entry_count") for x in out["variables"] if x["name"]=="KEK"),None),
        "db_entries":next((x.get("esl_entry_count") for x in out["variables"] if x["name"]=="db"),None),
        "dbx_entries":next((x.get("esl_entry_count") for x in out["variables"] if x["name"]=="dbx"),None),
        "boot_options":sorted(n for n in names if n.startswith("Boot") and n!="BootOrder"),
        "boot_order_present":"BootOrder" in names}
    return out

if __name__=="__main__":
    print(json.dumps(parse_vars(sys.argv[1]), indent=1, sort_keys=True))
