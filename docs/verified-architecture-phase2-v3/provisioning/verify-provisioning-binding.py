#!/usr/bin/env python3
"""Deterministic validator for provisioning-binding.v1.json.

Recomputes every repo-reproducible identity in the binding from git blobs at the
bound accepted source commit and checks internal consistency of the plan-level
identities. It does NOT verify peer-verified identities (signed UKI bytes,
certificate DER, final authority record): those bytes are owner/peer-held public
evidence and are checked at the P1 evidence-ingestion stage, not here. This
script performs no provisioning and mutates nothing.

Exit 0 with a JSON report on PASS. Exit 1 with `E_<CODE>` on stderr on any
mismatch. No timestamps or random values: the report is byte-deterministic for
a given binding and commit.
"""
import hashlib, json, re, subprocess, sys

E = lambda code, msg: (sys.stderr.write(f"{code} {msg}\n"), sys.exit(1))

def git(repo, *args, stream=False):
    p = subprocess.run(["git", "-C", repo, *args], capture_output=True)
    if p.returncode != 0:
        E("E_GIT", f"git {' '.join(args)} failed: {p.stderr.decode(errors='replace')[:200]}")
    return p.stdout if stream else p.stdout.decode(errors="replace")

def blob_bytes(repo, commit, path):
    p = subprocess.run(["git", "-C", repo, "cat-file", "blob", f"{commit}:{path}"],
                       capture_output=True)
    if p.returncode != 0:
        E("E_INPUT_MISSING", path)
    return p.stdout

def main():
    repo = sys.argv[1] if len(sys.argv) > 1 else "."
    binding_path = sys.argv[2] if len(sys.argv) > 2 else \
        "docs/verified-architecture-phase2-v3/provisioning/provisioning-binding.v1.json"
    b = json.load(open(binding_path, "rb"))
    if b.get("schema") != "v3.provisioning-binding.v1":
        E("E_SCHEMA", "unexpected schema")
    commit = b["requiredBindings"]["acceptedSourceCommit"]
    if b["source"]["acceptedSourceCommit"] != commit:
        E("E_BINDING_INCONSISTENT", "source.acceptedSourceCommit != requiredBindings.acceptedSourceCommit")

    hex64 = re.compile(r"^[0-9a-f]{64}$")
    for k in ("signedUkiSha256", "certificateDerSha256", "finalAuthorityRecordSha256"):
        if not hex64.match(b["requiredBindings"][k]):
            E("E_BINDING_FORMAT", k)
    if not re.match(r"^[0-9A-F]{40}$", b["requiredBindings"]["certificateThumbprintSha1"]):
        E("E_BINDING_FORMAT", "certificateThumbprintSha1")
    if not re.match(r"^[0-9a-f]{40}$", commit):
        E("E_BINDING_FORMAT", "acceptedSourceCommit")

    tree = git(repo, "rev-parse", f"{commit}^{{tree}}").strip()
    if tree != b["source"]["acceptedSourceTree"]:
        E("E_SOURCE_TREE", f"commit tree {tree} != bound {b['source']['acceptedSourceTree']}")

    report = {"schema": "v3.provisioning-binding-verification.v1",
              "bindingSha256": hashlib.sha256(open(binding_path, "rb").read()).hexdigest(),
              "acceptedSourceCommit": commit, "acceptedSourceTree": tree,
              "files": [], "checks": []}

    for f in b["repoReproducibleInputs"]["files"]:
        data = blob_bytes(repo, commit, f["path"])
        size = len(data)
        digest = hashlib.sha256(data).hexdigest()
        ok = size == f["bytes"] and digest == f["sha256"]
        report["files"].append({"path": f["path"], "bytes": size, "sha256": digest, "match": ok})
        if not ok:
            E("E_INPUT_HASH", f["path"])

    dm = json.loads(blob_bytes(repo, commit,
        "docs/verified-architecture-phase2-v3/root-admitter-candidate/dm-verity-metadata.v1.json"))
    want = b["repoReproducibleInputs"]["dmVerity"]
    got = {"algorithm": dm["algorithm"], "format": dm["format"],
           "dataBlockSize": dm["dataBlockSize"], "hashBlockSize": dm["hashBlockSize"],
           "dataBlocks": dm["dataBlocks"], "hashStartBlock": dm["hashStartBlock"],
           "salt": dm["salt"], "rootHash": dm["rootHash"],
           "dataImageSha256": dm["dataImageSha256"], "hashTreeSha256": dm["hashTreeSha256"],
           "hashTreeByteLength": dm["hashTreeByteLength"]}
    report["checks"].append({"check": "dmVerity", "match": got == want})
    if got != want:
        E("E_DM_VERITY", json.dumps({"repo": got, "binding": want}))

    bp = blob_bytes(repo, commit,
        "docs/verified-architecture-phase2-v3/root-admitter-candidate/rootfs/trust/boot-policy.v1").decode()
    policy = dict(l.split("=", 1) for l in bp.strip().splitlines() if "=" in l)
    policy.pop("schema", None)
    report["checks"].append({"check": "bootPolicy", "match": policy == b["repoReproducibleInputs"]["bootPolicy"]})
    if policy != b["repoReproducibleInputs"]["bootPolicy"]:
        E("E_BOOT_POLICY", json.dumps({"repo": policy, "binding": b['repoReproducibleInputs']['bootPolicy']}))

    adapter = blob_bytes(repo, commit,
        "docs/verified-architecture-phase2-v3/successor-uki-candidate/cloud-boot-adapter.sh").decode()
    m = re.search(r"^OLD_INIT_SHA256=([0-9a-f]{64})$", adapter, re.M)
    if not m or m.group(1) != b["repoReproducibleInputs"]["adapterOldInitSha256"]:
        E("E_OLD_INIT", "adapter OLD_INIT_SHA256 mismatch")
    m = re.search(r"^EXPECTED='([^']+)'$", adapter, re.M)
    adapter_devices = m.group(1).split() if m else []
    plan_devices = sorted(d["name"] for d in b["devicePlan"]["disks"])
    report["checks"].append({"check": "deviceNames", "adapterExpected": adapter_devices,
                             "match": sorted(adapter_devices) == plan_devices})
    if sorted(adapter_devices) != plan_devices:
        E("E_DEVICE_SET", f"adapter {adapter_devices} != plan {plan_devices}")
    if b["devicePlan"]["namespace"].find("google-*") < 0:
        E("E_DEVICE_NAMESPACE", "plan namespace must pin the GCP by-id google-* contract")

    for k, v in b["peerVerifiedIdentities"].items():
        if k.endswith("Sha256") and not hex64.match(str(v)):
            E("E_PEER_FORMAT", k)
    rb = b["requiredBindings"]
    if b["peerVerifiedIdentities"]["unsignedUkiIdentityInFinalRecord"] != \
       "ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536":
        E("E_PEER_FORMAT", "unsignedUkiIdentityInFinalRecord")
    report["checks"].append({"check": "peerVerifiedIdentities",
        "status": "FORMAT_ONLY__BYTES_NOT_HELD__P1_INGESTION_GATE"})
    report["checks"].append({"check": "requiredBindings", "status": "FORMAT_ONLY__CRYPTOGRAPHIC_VERIFICATION_PEER_SIDE"})
    report["mutationPerformed"] = False
    report["result"] = "PROVISIONING_BINDING_VERIFICATION_PASS"
    json.dump(report, sys.stdout, indent=1)
    sys.stdout.write("\n")

main()
