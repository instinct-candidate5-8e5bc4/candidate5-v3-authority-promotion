# Cross-namespace pidfd-parent candidate

Helper opens a pidfd for itself before fork. PID1 inherits it across the namespace, installs PDEATHSIG, and requires the parent pidfd not readable before exec. This avoids namespace-relative getppid while closing every parent-death setup boundary. Image `77a3bd99ad9dbfa18952dcc7b2bd180bbebd57843ac8c21edcec63dc737b64f0`, root `533d6d61d83ad8e03539549d500fb74ec6d844f18ee3bcaec238f7fb78303245`, UKI `7f5c339270f486a107285e9abfe0150f6e95bef0456668f34f79401f81dcc836`. Candidate only.
