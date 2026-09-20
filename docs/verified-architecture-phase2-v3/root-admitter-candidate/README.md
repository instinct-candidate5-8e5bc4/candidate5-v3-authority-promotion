# Cross-namespace pidfd-parent candidate

Helper opens a pidfd for itself before fork. PID1 inherits it across the namespace, installs PDEATHSIG, and requires the parent pidfd not readable before exec. This avoids namespace-relative getppid while closing every parent-death setup boundary. Image `5e8e7de6e6c405736ceb8ade688db540c29b840708e9d4224221ca283dc0fd25`, root `b24dcf930604552f6624c87f1acb92069ca1bced98a726f29444ea4cb150ccb8`, UKI `7f5c339270f486a107285e9abfe0150f6e95bef0456668f34f79401f81dcc836`. Candidate only.
