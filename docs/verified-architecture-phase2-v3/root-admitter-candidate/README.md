# Cross-namespace pidfd-parent candidate

Helper opens a pidfd for itself before fork. PID1 inherits it across the namespace, installs PDEATHSIG, and requires the parent pidfd not readable before exec. This avoids namespace-relative getppid while closing every parent-death setup boundary. Image `b345d4eccd3232e707cda9ff283d813a7ac9c6d2c6ff53a2e7190cf0de172689`, root `e6ddb15916e12220c6117b6abded6550acd77df9379101662d8af78c7396dad7`, UKI `7f5c339270f486a107285e9abfe0150f6e95bef0456668f34f79401f81dcc836`. Candidate only.
