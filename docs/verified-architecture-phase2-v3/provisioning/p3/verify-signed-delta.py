#!/usr/bin/env python3
# verify-signed-delta.py - the precise signed-vs-unsigned delta rule (peer ruling 2026-09-24,
# supersedes the vague 'signed minus cert table == unsigned' wording; tail rule REFINED per the
# peer's second 2026-09-24 ruling). With U unsigned, S signed:
#   len(S) > len(U), len(U) % 8 == 0
#   S[:len(U)] == U byte-for-byte EXCEPT the PE CheckSum field [opt+64, opt+68) and the
#     security-directory entry [secdir, secdir+8); ANY other delta is fatal E_SIGNED_UNSIGNED_DELTA
#   security directory: VirtualAddress == len(U), Size == len(S)-len(U)
#   S's tail is exactly ONE WIN_CERTIFICATE entry running exactly to EOF:
#     Size == ALIGN8(dwLength); padding = Size - dwLength (0-7 bytes), every padding byte ZERO;
#     dwLength >= 8; wRevision 0x0200; wCertificateType 0x0002. BOTH the sbsign shape
#     (dwLength=1957, pad 3 outside dwLength) and the signtool/osslsigncode shape
#     (dwLength == Size, pad inside) are legitimate per the PE spec; NO post-sign normalization.
#   PE CheckSum equals the correct computed checksum over S OR is zero - recorded either way.
#   Each tool's shape (dwLength, Size, pad) is recorded in the report.
# usage: verify-signed-delta.py <unsigned.efi> <signed.efi>   exit 0 PASS / 91 FAIL
import sys, json, struct
U = open(sys.argv[1],"rb").read(); S = open(sys.argv[2],"rb").read()
E = []
def pe(b):
    e = struct.unpack_from("<I", b, 0x3c)[0]; coff = e+4; opt = coff+20
    magic = struct.unpack_from("<H", b, opt)[0]
    dd = opt + (112 if magic == 0x20b else 96)
    return opt, dd+4*8
opt_u, sec_u = pe(U); opt_s, sec_s = pe(S)
if len(S) <= len(U): E.append(["E_SIGNED_UNSIGNED_DELTA","len(S)=%d <= len(U)=%d"%(len(S),len(U))])
if len(U) % 8 != 0: E.append(["E_SIGNED_UNSIGNED_DELTA","len(U)=%d not 8-aligned"%len(U)])
if not E:
    allowed = set(range(opt_u+64, opt_u+68)) | set(range(sec_u, sec_u+8))
    bad = [i for i in range(len(U)) if S[i] != U[i] and i not in allowed]
    if bad: E.append(["E_SIGNED_UNSIGNED_DELTA","%d unexpected byte deltas, first at %d"%(len(bad), bad[0])])
    cva, csz = struct.unpack_from("<II", S, sec_s)
    if cva != len(U): E.append(["E_SIGNED_UNSIGNED_DELTA","security VA=%d != len(U)=%d"%(cva,len(U))])
    if csz != len(S)-len(U): E.append(["E_SIGNED_UNSIGNED_DELTA","security Size=%d != len(S)-len(U)=%d"%(csz,len(S)-len(U))])
    shape = None
    if cva == len(U) and csz == len(S)-len(U):
        dw, rev, typ = struct.unpack_from("<IHH", S, cva)
        align8 = (dw + 7)//8*8
        pad = csz - dw
        if dw < 8: E.append(["E_SIGNED_UNSIGNED_DELTA","WIN_CERTIFICATE dwLength=%d < 8"%dw])
        if csz != align8: E.append(["E_SIGNED_UNSIGNED_DELTA","table Size=%d != ALIGN8(dwLength=%d)=%d"%(csz,dw,align8)])
        if not (0 <= pad <= 7): E.append(["E_SIGNED_UNSIGNED_DELTA","padding=%d outside 0-7"%pad])
        elif pad and S[cva+dw:cva+csz] != b"\0"*pad: E.append(["E_SIGNED_UNSIGNED_DELTA","%d padding bytes not zero"%pad])
        if rev != 0x0200 or typ != 0x0002: E.append(["E_SIGNED_UNSIGNED_DELTA","revision=0x%04x type=0x%04x"%(rev,typ)])
        shape = {"dwLength":dw,"table_size":csz,"pad":pad}
    def pe_checksum(b):
        # PE checksum: sum of 16-bit words (skipping the CheckSum field), folded, plus file length
        csum_off = opt_s+64
        v = 0
        n = len(b)
        for i in range(0, n, 2):
            if i == csum_off or i == csum_off+2: continue
            w = b[i] | ((b[i+1] if i+1 < n else 0) << 8)
            v = (v + w) & 0xffffffff
            v = (v & 0xffff) + (v >> 16)
        v = (v & 0xffff) + (v >> 16)
        return (v + n) & 0xffffffff
    stored = struct.unpack_from("<I", S, opt_s+64)[0]
    computed = pe_checksum(S)
    checksum_record = {"stored": stored, "computed": computed,
                       "state": "correct" if stored == computed else ("zero" if stored == 0 else "STALE")}
    if checksum_record["state"] == "STALE":
        E.append(["E_SIGNED_UNSIGNED_DELTA","PE CheckSum stored=0x%08x computed=0x%08x (must be correct or zero)"%(stored,computed)])
    if E:
        print(json.dumps({"result":"FAIL","unsigned":sys.argv[1],"signed":sys.argv[2],"errors":E,"checksum":checksum_record,"win_certificate":shape}, sort_keys=True)); sys.exit(91)
    print(json.dumps({"result":"PASS","unsigned":sys.argv[1],"signed":sys.argv[2],
                      "unsigned_bytes":len(U),"signed_bytes":len(S),"checksum":checksum_record,"win_certificate":shape}, sort_keys=True))
    sys.exit(0)
print(json.dumps({"result":"FAIL","errors":E}, sort_keys=True)); sys.exit(91)
