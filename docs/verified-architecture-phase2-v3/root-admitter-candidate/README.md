# Native PID-lifetime candidate

The admitted helper itself calls unshare(CLONE_NEWPID), forks PID1, and supervises it directly. PID1 sets PDEATHSIG SIGKILL against the helper with parent recheck. No external wrapper remains; helper death kills PID1 and kernel teardown kills all namespace members. Image `55a2686939ae0adb8060bf4bceea2eb96cb7d0188576787f140a6ddc676bff74`, root `d860cb10c45261bf76a4c8c886dfe6373516ee693eba224dbbeef5bcbc73b935`, UKI `5e1264dcbdea6f31f8683fa41cca09da9763cd37fd204cfcad50b1b416a88675`. Candidate only.
