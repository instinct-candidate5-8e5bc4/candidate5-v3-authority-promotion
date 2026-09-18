# PID-namespace lifetime candidate

The native wait helper is PID 1 in a nested pid namespace. Init death makes the kernel terminate all namespace descendants; unshare --fork reaps init before command substitution returns, so no grandchild/stage holder/output mutator survives before cleanup. Image `46bcc28cf4bda04daf43f341ea4472d1d60a77fe8a16128c0006b158efc3bd3d`, root `bfda76d0ebcb6a8d2b258faa6a0c0e6bf963c46b22b5f8d9103c33a5758e116e`, UKI `ddf00d68669a47f386c7673819929447633c1b2f02adde0eb4210684c5bb1360`. Candidate only.
