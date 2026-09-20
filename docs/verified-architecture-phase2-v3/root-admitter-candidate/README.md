# Cross-namespace pidfd-parent candidate

Helper opens a pidfd for itself before fork. PID1 inherits it across the namespace, installs PDEATHSIG, and requires the parent pidfd not readable before exec. This avoids namespace-relative getppid while closing every parent-death setup boundary. Image `b541bfef551fa845dddcb4f0d342e2f9dd2c6706b618da04bc5597125783a9a5`, root `b1d724bb9ffdb3ecd6a0db36590090e4362b5f0aff6959eff868e83079efa7cf`, UKI `7f5c339270f486a107285e9abfe0150f6e95bef0456668f34f79401f81dcc836`. Candidate only.
