#!/usr/bin/env python3
# Single source of truth for the rehearsal config TOP-LEVEL closed schema (peer
# run-36017957182 ruling, Q1+Q2): TOP_KEYS, TOP_REQUIRED and the enrollments validator
# live HERE and are imported by BOTH rehearsal-harness.py and preflight-check.py (the
# two-copy drift - config.json carrying "enrollments" while the harness's schema did
# not - is how run 36017957182's F6 E_CONFIG_SCHEMA happened). Stdlib-only, no sibling
# imports. Consumers wrap ConfigSchemaError with their own named exit path.
import re


class ConfigSchemaError(Exception):
    def __init__(self, msg):
        super().__init__(msg)
        self.msg = msg


TOP_KEYS = {"cases","cpu_model","disk_dir","enroll_app","enroll_app_sha256","enrollments",
            "esp_sha256","firmware_debug_sha256","firmware_release","firmware_release_sha256",
            "memory_mb","note","ovmf_code_debug","ovmf_vars_pristine","qemu","schema",
            "v3_serials","vars_parser"}
# Q1: enrollments is REQUIRED (never merely tolerated) - E_CERT_POSITIVE_MISSING and the
# signed-slot cross-check depend on the enrollment record being present.
TOP_REQUIRED = TOP_KEYS - {"note"}

_HEX64 = re.compile(r"[0-9a-f]{64}$")
_INRUN = re.compile(r"IN-RUN:[A-Za-z0-9-]+$")


def check_top(cfg):
    extra = set(cfg) - TOP_KEYS
    missing = TOP_REQUIRED - set(cfg)
    if extra or missing:
        raise ConfigSchemaError("top extra=%s missing=%s" % (sorted(extra), sorted(missing)))
    enr = cfg["enrollments"]
    if not isinstance(enr, dict) or not enr:
        raise ConfigSchemaError("enrollments must be a nonempty object (name -> {db_der_sha256})")
    for name, v in sorted(enr.items()):
        if not isinstance(v, dict) or set(v) != {"db_der_sha256"}:
            raise ConfigSchemaError("enrollments.%s must be exactly {db_der_sha256: [...]}" % name)
        dbs = v["db_der_sha256"]
        if not isinstance(dbs, list) or not dbs:
            raise ConfigSchemaError("enrollments.%s db_der_sha256 must be a nonempty list" % name)
        for entry in dbs:
            if not isinstance(entry, str) or not (_HEX64.match(entry) or _INRUN.match(entry)):
                raise ConfigSchemaError(
                    "enrollments.%s db_der_sha256 entry must be 64 lowercase hex or IN-RUN:<name>: %r"
                    % (name, entry))
