# Cross-namespace pidfd-parent candidate

Helper opens a pidfd for itself before fork. PID1 inherits it across the namespace, installs PDEATHSIG, and requires the parent pidfd not readable before exec. This avoids namespace-relative getppid while closing every parent-death setup boundary. Image `71e3290fa06f2017f685ebe87bc863a9b083f49dcb888305b96f37e26dc90a21`, root `c8f1ca4197a6982aa09ea53dd92ef76fded30dce84c75ff63d2e978b4d227015`, UKI `7f5c339270f486a107285e9abfe0150f6e95bef0456668f34f79401f81dcc836`. Candidate only.
