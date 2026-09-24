#!/usr/bin/env python3
# Shared lock-pinned fetch helper (peer F1-F6 ruling, adopted via main): ONE
# implementation for EVERY HTTP(S) file fetch - the stage-platform.sh deb downloads
# and the lockgen index snapshots, all lanes (scratch, rehearsal, certification,
# env2). Sources are restricted to URLs recorded in platform.lock.json (per-deb
# archive URLs + the snapshot.ubuntu.com index URLs and deb fallback constructed
# from the lock-recorded snapshot_ts and pool path; same pinned sha256/size).
# F1 (capped to match D7): retry ONLY transient failures (HTTP 5xx, 429,
#   timeouts, connection reset/refused, DNS): max 3 attempts, bounded backoff
#   (5s/10s), one log line per attempt with URL + status/exception + attempt n/3.
#   The lockgen index loop retries ONLY its own lock-recorded URL (no alternate
#   source for indices); the deb path keeps D7 semantics (archive 404/410 ->
#   snapshot fallback, E_LOCK_DOWNLOAD_FAILED 34 when both sources are down).
# F2: NEVER retry on sha256/size mismatch or non-429 4xx - fail at once, named
#   (E_LOCKGEN_INDEX_MISMATCH / E_LOCK_HASH_MISMATCH / E_STAGE_FETCH_HTTP <code>).
# F3: every attempt's bytes verified against the same lock-pinned sha256 before use.
# F4: attempts exhausted -> E_STAGE_FETCH_EXHAUSTED <name> <url> <last error>,
#   exit 53. No bare tracebacks on any failure path.
import hashlib, os, sys, time, urllib.request, urllib.error

MAX_ATTEMPTS = 3

def _transient_http(code):
    return code == 429 or code >= 500

def fetch_locked(url, name, dest, sha256, size=None,
                 mismatch_name="E_LOCKGEN_INDEX_MISMATCH", mismatch_rc=52,
                 hard=True):
    """Fetch url to dest with lock-pinned verification.
    Returns ('ok', sha256, attempts) | ('http', code) | ('exhausted', last_error).
    sha256/size mismatch exits immediately (named, mismatch_rc) in every mode.
    With hard=True, http/exhausted also exit named (E_STAGE_FETCH_HTTP 54 /
    E_STAGE_FETCH_EXHAUSTED 53); with hard=False they return for caller policy."""
    part = dest + ".part"
    last = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        print("fetch attempt %d/%d [%s] url=%s" % (attempt, MAX_ATTEMPTS, name, url), flush=True)
        try:
            with urllib.request.urlopen(url, timeout=60) as r, open(part, "wb") as f:
                while True:
                    chunk = r.read(1 << 20)
                    if not chunk: break
                    f.write(chunk)
        except urllib.error.HTTPError as ex:
            if os.path.exists(part): os.unlink(part)
            print("attempt %d/%d failed [%s] url=%s: HTTP %d" % (attempt, MAX_ATTEMPTS, name, url, ex.code),
                  file=sys.stderr, flush=True)
            if not _transient_http(ex.code):
                if hard:
                    print("E_STAGE_FETCH_HTTP %d %s %s" % (ex.code, name, url), file=sys.stderr)
                    sys.exit(54)
                return ("http", ex.code)
            last = "HTTP %d" % ex.code
        except Exception as ex:
            # timeouts, connection reset/refused, DNS and other network classes: transient
            if os.path.exists(part): os.unlink(part)
            print("attempt %d/%d failed [%s] url=%s: %s" % (attempt, MAX_ATTEMPTS, name, url, ex),
                  file=sys.stderr, flush=True)
            last = str(ex)
        else:
            got_size = os.path.getsize(part)
            if size is not None and got_size != size:
                os.unlink(part)
                print("%s %s size %d != %d (%s)" % (mismatch_name, name, got_size, size, url), file=sys.stderr)
                sys.exit(mismatch_rc)
            d = hashlib.sha256(open(part, "rb").read()).hexdigest()
            if d != sha256:
                os.unlink(part)
                print("%s %s sha256 %s != %s (%s)" % (mismatch_name, name, d, sha256, url), file=sys.stderr)
                sys.exit(mismatch_rc)
            os.rename(part, dest)
            return ("ok", d, attempt)
        if attempt < MAX_ATTEMPTS:
            time.sleep(min(5 * (2 ** (attempt - 1)), 30))
    if hard:
        print("E_STAGE_FETCH_EXHAUSTED %s %s %s" % (name, url, last), file=sys.stderr)
        sys.exit(53)
    return ("exhausted", last)

def main():
    url, name, dest, sha256 = sys.argv[1:5]
    size = int(sys.argv[5]) if len(sys.argv) > 5 and sys.argv[5] != "-" else None
    res = fetch_locked(url, name, dest, sha256, size)
    print("verified %s sha256=%s attempts=%d" % (name, res[1], res[2]), flush=True)

if __name__ == "__main__":
    main()
