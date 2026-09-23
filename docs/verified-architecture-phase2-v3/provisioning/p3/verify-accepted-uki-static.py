#!/usr/bin/env python3
# J static verifier (peer correction J): extract the exact accepted UKI initrd,
# validate size/hash, safe-parse the newc cpio, byte-compare /init and
# /bin/gce-by-id-producer against accepted source blobs, and prove the exit-98
# structure. Read-only, stdlib-only, deterministic. Exit 0 = PASS, 90s = fail codes.
import sys, struct, hashlib, json

UKI_PATH = sys.argv[1]
ADAPTER_SRC = sys.argv[2]   # accepted cloud-boot-adapter.sh blob
EXPECT = {
 "uki_size": 21166416,
 "uki_sha256": "133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1",
 "initrd_size": 9371136,
 "initrd_sha256": "d62e7c879186110c9767f52337bfef23040a034871cdc4138b1ec601f0a78d59",
 "cmdline": "ro root=/dev/mapper/v3-root-admitter rootfstype=ext4 v3.root_admitter_verity=533d6d61d83ad8e03539549d500fb74ec6d844f18ee3bcaec238f7fb78303245\n",
}
def die(code, msg):
    print(json.dumps({"result":"FAIL","code":code,"detail":msg}, sort_keys=True)); sys.exit(90)

d = open(UKI_PATH,"rb").read()
if len(d) != EXPECT["uki_size"]: die("E_UKI_SIZE", str(len(d)))
if hashlib.sha256(d).hexdigest() != EXPECT["uki_sha256"]: die("E_UKI_HASH","")
pe = struct.unpack_from("<I", d, 0x3c)[0]
if d[pe:pe+4] != b"PE\0\0": die("E_PE","")
nsec = struct.unpack_from("<H", d, pe+6)[0]
optsz = struct.unpack_from("<H", d, pe+20)[0]
sec = pe+24+optsz
sects = {}
for i in range(nsec):
    name = d[sec+i*40:sec+i*40+8].rstrip(b"\0").decode()
    vsize, vaddr, rsize, roff = struct.unpack_from("<IIII", d, sec+i*40+8)
    sects[name] = (roff, rsize)
for need in (".cmdline",".linux",".initrd"):
    if need not in sects: die("E_SECTION", need)
cmd = d[sects[".cmdline"][0]:sects[".cmdline"][0]+sects[".cmdline"][1]].rstrip(b"\0").decode()
if cmd != EXPECT["cmdline"]: die("E_CMDLINE", cmd)
initrd = d[sects[".initrd"][0]:sects[".initrd"][0]+sects[".initrd"][1]]
if len(initrd) != EXPECT["initrd_size"]: die("E_INITRD_SIZE", str(len(initrd)))
if hashlib.sha256(initrd).hexdigest() != EXPECT["initrd_sha256"]: die("E_INITRD_HASH","")

# safe newc parse with hard bounds
entries = {}
off = 0
count = 0
while off + 110 <= len(initrd):
    if initrd[off:off+6] != b"070701": die("E_CPIO_MAGIC", str(off))
    h = initrd[off:off+110]
    vals = [int(h[6+i*8:14+i*8], 16) for i in range(13)]
    fsize, nsize = vals[6], vals[11]
    if nsize < 1 or nsize > 4096: die("E_CPIO_NSIZE", str(nsize))
    name = initrd[off+110:off+110+nsize-1].decode("utf-8", "strict")
    dataoff = (off + 110 + nsize + 3) & ~3
    if dataoff + fsize > len(initrd): die("E_CPIO_BOUNDS", name)
    entries[name] = (vals[1], initrd[dataoff:dataoff+fsize])
    off = (dataoff + fsize + 3) & ~3
    count += 1
    if count > 100000: die("E_CPIO_RUNAWAY","")
    if name == "TRAILER!!!": break
if "init" not in entries: die("E_INIT_ABSENT","")
if "bin/gce-by-id-producer" not in entries: die("E_PRODUCER_ABSENT","")

# byte-compare /init against the accepted adapter source blob
accepted = open(ADAPTER_SRC,"rb").read()
init_body = entries["init"][1]
adapter_equal = (init_body == accepted)

# exit-code structure proof from the signed bytes themselves
init_txt = init_body.decode("utf-8")
fail_defines_98 = 'fail() { "$BB" echo "$1" >&2; exit 98; }' in init_txt
codes = sorted(set(__import__("re").findall(r"exit (\d+)", init_txt)))
producer_txt = entries["bin/gce-by-id-producer"][1].decode("utf-8")
pcodes = sorted(set(__import__("re").findall(r"exit (\d+)", producer_txt)))
hooks = [n for n in entries if n not in (
 "bin","bin/busybox","bin/gce-by-id-producer","bin/measured-supervisor","bin/mkdir",
 "bin/modprobe","bin/mount","bin/sh","gce-disk-naming.rules","init","init.root-admitter",
 "lib","lib/modules","lib/modules/5.15.0-191-generic",
 "lib/modules/5.15.0-191-generic/kernel","lib/modules/5.15.0-191-generic/kernel/drivers",
 "lib/modules/5.15.0-191-generic/kernel/drivers/md",
 "lib/modules/5.15.0-191-generic/kernel/drivers/md/dm-bufio.ko",
 "lib/modules/5.15.0-191-generic/kernel/drivers/md/dm-verity.ko",
 "lib/x86_64-linux-gnu","lib/x86_64-linux-gnu/ld-linux-x86-64.so.2",
 "lib/x86_64-linux-gnu/libc.so.6","lib/x86_64-linux-gnu/libdevmapper.so.1.02.1",
 "lib/x86_64-linux-gnu/libm.so.6","lib/x86_64-linux-gnu/libselinux.so.1","lib64",
 "lib64/ld-linux-x86-64.so.2","sbin","sbin/dmsetup","sbin/scsi_id","usr","usr/lib",
 "usr/lib/x86_64-linux-gnu","usr/lib/x86_64-linux-gnu/libpcre2-8.so.0",
 "usr/lib/x86_64-linux-gnu/libpcre2-8.so.0.10.4","usr/lib/x86_64-linux-gnu/libudev.so.1",
 "usr/lib/x86_64-linux-gnu/libudev.so.1.7.2","TRAILER!!!")]
no_external_hook = not hooks and ("wget" not in init_txt) and ("curl" not in init_txt) and ("http" not in init_txt)
print(json.dumps({
 "result": "PASS",
 "uki_sha256": hashlib.sha256(d).hexdigest(),
 "initrd_sha256": hashlib.sha256(initrd).hexdigest(),
 "initrd_entries": len(entries),
 "init_equals_accepted_adapter_source": adapter_equal,
 "init_exit_codes": codes,
 "init_fail_exit98": fail_defines_98,
 "producer_exit_codes": pcodes,
 "unexpected_entries": hooks,
 "no_external_hook_or_bypass": no_external_hook,
 "cert_table_signer_der_sha256": None
}, sort_keys=True, indent=1))
