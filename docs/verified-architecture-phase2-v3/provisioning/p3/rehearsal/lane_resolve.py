#!/usr/bin/env python3
# lane_resolve.py - the SINGLE lane-path resolver definition (peer #17 final ruling F1/F4;
# supersedes the #16 D15-2 leading-token resolver in resolve-lane-path.sh, which is now a
# thin caller of this module, and the ad-hoc pref() copies that rehearsal-harness.py and
# preflight-check.py used to carry).
#
# Rule (exactly as ruled): component-wise mapping, ONLY for canonical absolute /tmp lane
# paths. Every path component that IS the canonical token NON_CERTIFYING_REHEARSAL or starts
# with it plus '-' maps to the running lane's prefix; a canonical token anywhere else in a
# component fails closed (NO substring rewrites anywhere); a component naming a different
# NON_CERTIFYING_ lane fails closed; components already in the running lane pass through
# (idempotent); anything that is not an absolute /tmp lane path at all fails closed in the
# strict entry point. Config VALUES that are not absolute /tmp paths (relative paths, case
# IDs, schema strings, names) are never touched by the resolver's config traversal - they
# pass through byte-identical (ruled exemptions).
#
# Failure codes (stderr, exit 97; mirror the resolve-lane-path.sh contract):
#   E_LANE_PATH_USAGE        bad CLI form
#   E_LANE_PATH              bad lane prefix, or resolved path escapes the lane
#   E_LANE_PATH_NOT_CANON    not an absolute /tmp lane path (no canonical/lane component)
#   E_LANE_PATH_COMPONENT    canonical token inside a component but not at its start
#   E_LANE_PATH_FOREIGN      component names a different NON_CERTIFYING_ lane
#   E_PREFIX_UNSET / E_PREFIX_MISMATCH  (gate mode, same convention as the other scripts)
#   E_VARS_TEMPLATE_GATE     gate mode: a case vars_template resolved outside the
#                            constructed enrolled-template set (pre-ceremony static gate F3)
#
# usage: lane_resolve.py resolve PATH PREFIX
#        lane_resolve.py gate CONFIG.json OUT_DIR        (PREFIX/ALLOWED_PREFIX from env)
#        lane_resolve.py allowed-templates OUT_DIR PREFIX
import sys, os, json, re

CANON = "NON_CERTIFYING_REHEARSAL"
ENROLL_MODES = ("sole", "widened", "sole-fresh")

class LaneError(Exception):
    def __init__(self, code, detail):
        super().__init__(detail)
        self.code = code
        self.detail = detail

def _check_prefix(prefix):
    if not re.fullmatch(r"NON_CERTIFYING_[A-Za-z0-9_]+", prefix or ""):
        raise LaneError("E_LANE_PATH", "bad lane prefix: %s" % prefix)

def resolve_path(p, prefix):
    """Strict resolution of ONE absolute /tmp lane path. Component-wise; fail-closed."""
    _check_prefix(prefix)
    if not p.startswith("/tmp/"):
        raise LaneError("E_LANE_PATH_NOT_CANON", p)
    comps = p.split("/")
    out = ["", "tmp"]
    saw_canon = False
    saw_lane = False
    for c in comps[2:]:
        if c == CANON or c.startswith(CANON + "-"):
            out.append(prefix + c[len(CANON):])
            saw_canon = True
        elif CANON in c:
            raise LaneError("E_LANE_PATH_COMPONENT",
                            "canonical token not at component start (no substring rewrites): " + p)
        elif c == prefix or c.startswith(prefix + "-"):
            out.append(c)
            saw_lane = True
        elif c.startswith("NON_CERTIFYING_"):
            raise LaneError("E_LANE_PATH_FOREIGN", "foreign lane component %r in %s" % (c, p))
        else:
            out.append(c)
    if not saw_canon and not saw_lane:
        raise LaneError("E_LANE_PATH_NOT_CANON", p)
    resolved = "/".join(out)
    if saw_canon and not (resolved == "/tmp/" + prefix or resolved.startswith("/tmp/" + prefix + "-")):
        raise LaneError("E_LANE_PATH", "resolved path escapes lane: " + resolved)
    return resolved

def resolve_config_value(x, prefix):
    """Config traversal: only absolute /tmp path strings are resolved; every other value
    (relative paths, IDs, schema strings, names, non-strings) passes through untouched."""
    if isinstance(x, str):
        return resolve_path(x, prefix) if x.startswith("/tmp/") else x
    if isinstance(x, list):
        return [resolve_config_value(i, prefix) for i in x]
    if isinstance(x, dict):
        return {k: resolve_config_value(v, prefix) for k, v in x.items()}
    return x

def allowed_vars_templates(out_dir, prefix):
    """F4 single source: the ONE construction of the enrolled-template allow set, shared by
    the run-ceremony.sh pre-guest gate (F3) and rehearsal-harness.py's membership check."""
    return [os.path.join(out_dir, "%s-enroll-%s" % (prefix, m), "vars-enrolled.fd")
            for m in ENROLL_MODES]

def _env_prefix():
    prefix = os.environ.get("PREFIX", "")
    if not prefix:
        print("E_PREFIX_UNSET"); sys.exit(97)
    allowed = os.environ.get("ALLOWED_PREFIX", "")
    if prefix != allowed:
        print("E_PREFIX_MISMATCH prefix=%s allowed=%s" % (prefix, allowed)); sys.exit(97)
    return prefix

def _die(e):
    print("%s %s" % (e.code, e.detail), file=sys.stderr)
    sys.exit(97)

def main():
    if len(sys.argv) < 2:
        print("E_LANE_PATH_USAGE lane_resolve.py resolve PATH PREFIX | gate CONFIG OUT | allowed-templates OUT PREFIX",
              file=sys.stderr)
        sys.exit(97)
    cmd = sys.argv[1]
    try:
        if cmd == "resolve" and len(sys.argv) == 3 + 1:
            print(resolve_path(sys.argv[2], sys.argv[3]))
        elif cmd == "allowed-templates" and len(sys.argv) == 3 + 1:
            _check_prefix(sys.argv[3])
            for t in allowed_vars_templates(sys.argv[2], sys.argv[3]):
                print(t)
        elif cmd == "gate" and len(sys.argv) == 3 + 1:
            # F3 (peer #17 final ruling): pre-guest static gate. Every case vars_template in
            # the config must resolve (component-wise, this one resolver) into the ceremony's
            # OWN constructed enrolled-template set; anything else dies named BEFORE any
            # guest runs. Resolver deaths propagate with their own named codes.
            prefix = _env_prefix()
            cfg = json.load(open(sys.argv[2]))
            allowed = set(allowed_vars_templates(sys.argv[3], prefix))
            for case in cfg.get("cases", []):
                lit = case.get("vars_template", "")
                resolved = resolve_config_value(lit, prefix)
                if resolved not in allowed:
                    raise LaneError("E_VARS_TEMPLATE_GATE",
                                    "case %s vars_template resolves outside the enrolled-template set: literal=%s resolved=%s"
                                    % (case.get("id", "?"), lit, resolved))
            print("VARS_TEMPLATE_GATE_OK cases=%d out=%s" % (len(cfg.get("cases", [])), sys.argv[3]))
        else:
            print("E_LANE_PATH_USAGE lane_resolve.py resolve PATH PREFIX | gate CONFIG OUT | allowed-templates OUT PREFIX",
                  file=sys.stderr)
            sys.exit(97)
    except LaneError as e:
        _die(e)

if __name__ == "__main__":
    main()
