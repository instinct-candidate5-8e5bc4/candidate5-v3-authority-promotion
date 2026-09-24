#!/usr/bin/env python3
# Authenticode PKCS#7 signature verification (openssl cms cannot parse Authenticode's raw
# eContent tag, so verify manually): (a) messageDigest signed-attr == sha256(eContent DER);
# (b) RSA PKCS#1 v1.5 verify of sha256(signedAttrs-as-SET-OF) against the signer cert;
# (c) signer cert identity. usage: auth_verify.py <pkcs7.der>   prints JSON, rc 0 valid / 91 invalid
import sys, json, hashlib, struct, subprocess, tempfile, os

def tlv(b, i):
    tag = b[i]; i += 1
    ln = b[i]; i += 1
    if ln & 0x80:
        n = ln & 0x7f; ln = int.from_bytes(b[i:i+n], "big"); i += n
    hdr = i
    return tag, ln, hdr, hdr + ln

def children(b, i, end):
    out = []
    while i < end:
        tag, ln, s, e = tlv(b, i)
        out.append((tag, i, s, e))
        i = e
    return out

b = open(sys.argv[1], "rb").read()
res = {"file": sys.argv[1]}
# ContentInfo: SEQ { oid signedData, [0] SignedData }
t, l, s, e = tlv(b, 0)
ci = children(b, s, e)
sd_wrap = ci[1]  # [0]
t, l, s, e = tlv(b, sd_wrap[2])
sd = children(b, s, e)  # version, digestAlgorithms, encapContentInfo, [0]certs?, signerInfos
encap = sd[2]
certs, signerinfos = None, None
for tag, hs, cs, ce in sd[3:]:
    if tag == 0xa0: certs = (cs, ce)
    elif tag == 0x31: signerinfos = (cs, ce)
ecn = children(b, encap[2], encap[3])  # oid, [0] eContent
t, l, s, e = tlv(b, ecn[1][1])
# signtool's messageDigest is sha256 of the SpcIndirectDataContent SEQUENCE's CONTENT
# octets (the eContent value minus the inner SEQUENCE tag/len), per PKCS#7 'content' semantics
t2, l2, s2, e2 = tlv(b, s)
econtent = b[s2:e2]
res["econtent_sha256"] = hashlib.sha256(econtent).hexdigest()
# signer cert: first cert in [0] certs
t, l, s, e = tlv(b, certs[0])
cert_der = b[certs[0]:e]
with tempfile.NamedTemporaryFile(suffix=".der", delete=False) as f:
    f.write(cert_der); certpath = f.name
subj = subprocess.run(["openssl","x509","-inform","DER","-in",certpath,"-noout","-subject","-serial","-fingerprint","-sha256"],capture_output=True,text=True).stdout.strip().replace("\n"," ")
res["signer_cert"] = subj
# signerInfo: SEQ { version, issuerAndSerial, digestAlg, [0] signedAttrs, digestEncAlg, signature }
t, l, s, e = tlv(b, signerinfos[0])
sif = children(b, s, e)
attrs_tag, attrs_hs, attrs_s, attrs_e = None, None, None, None
sig = None
for tag, hs, cs, ce in sif[3:]:
    if tag == 0xa0: attrs_hs, attrs_s, attrs_e = hs, cs, ce
    elif tag == 0x04: sig = b[cs:ce]
attrs = children(b, attrs_s, attrs_e)
md = None
for tag, hs, cs, ce in attrs:
    t2, l2, s2, e2 = tlv(b, cs)
    oid_len = e2 - s2
    if b[s2:e2] == bytes.fromhex("2a864886f70d010904"):  # messageDigest OID 1.2.840.113549.1.9.4
        t3, l3, s3, e3 = tlv(b, e2)  # SET
        t4, l4, s4, e4 = tlv(b, s3)  # OCTET STRING
        md = b[s4:e4].hex()
res["messageDigest_attr"] = md
res["messageDigest_matches_econtent"] = (md == res["econtent_sha256"])
# verify RSA signature over signedAttrs encoded as SET OF
setof = b"\x31" + b[attrs_hs+1:attrs_s] + b[attrs_s:attrs_e]
if len(b[attrs_hs:attrs_s]) == 4 and b[attrs_hs+1] & 0x80:  # long-form length preserved
    setof = b"\x31" + b[attrs_hs+1:attrs_s] + b[attrs_s:attrs_e]
with tempfile.NamedTemporaryFile(delete=False) as f: f.write(setof); setpath = f.name
with tempfile.NamedTemporaryFile(delete=False) as f: f.write(sig); sigpath = f.name
pub = subprocess.run(["openssl","x509","-inform","DER","-in",certpath,"-noout","-pubkey"],capture_output=True,text=True).stdout
with tempfile.NamedTemporaryFile(suffix=".pem", delete=False, mode="w") as f: f.write(pub); pubpath = f.name
v = subprocess.run(["openssl","dgst","-sha256","-verify",pubpath,"-signature",sigpath,setpath],capture_output=True,text=True)
res["rsa_verify"] = v.stdout.strip()
res["valid"] = res["messageDigest_matches_econtent"] and "Verified OK" in v.stdout
for p in (certpath, setpath, sigpath, pubpath): os.unlink(p)
res["result"] = "VALID" if res["valid"] else "INVALID"
print(json.dumps(res, sort_keys=True))
sys.exit(0 if res["valid"] else 91)
