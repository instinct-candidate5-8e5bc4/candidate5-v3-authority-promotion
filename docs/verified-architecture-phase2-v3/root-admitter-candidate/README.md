# Cross-namespace pidfd-parent candidate

Helper opens a pidfd for itself before fork. PID1 inherits it across the namespace, installs PDEATHSIG, and requires the parent pidfd not readable before exec. This avoids namespace-relative getppid while closing every parent-death setup boundary. Image `5c6b747d4b2ffa44655f3f2139e3993e2740534e0fc6c8ae67916c13238ba148`, root `b78ccbc789be451715c52d661902d61abc3e149ea0e26afb2491f6a467c47646`, UKI `7f5c339270f486a107285e9abfe0150f6e95bef0456668f34f79401f81dcc836`. Candidate only.
