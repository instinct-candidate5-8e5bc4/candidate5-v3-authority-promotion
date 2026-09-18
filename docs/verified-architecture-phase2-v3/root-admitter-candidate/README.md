# Full-flow freshness-semantics candidate

Success removes only the private input stage, verifies durable OUTPUT/EVIDENCE remain committed, and intentionally rejects replay as already complete. Retry freshness is claimed only for failures where downstream cleanup removed output and evidence; failure after evidence commit makes no whole-operation retry claim. Image `9f5f890dce43d759553cda8d6ce3b8856b2f78cd2bcb77d990c63a5fd1f2728a`, root `f1eb350116264a28fd8fd444afa6b7ac5669bf0c9b32ef707ed085eac0806893`, UKI `30901ef67e2d767c740fecf46649342bb9b5cf9c9434b38059cebeeb778f81e5`. Candidate only.
