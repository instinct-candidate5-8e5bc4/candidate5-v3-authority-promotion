# Native result-channel candidate

The native wait helper writes exactly one V3WAIT result only after waitpid classification. Shell validates helper status and exact result separately. Helper kill/crash/OOM or missing/malformed/duplicate output is bounded terminal failure with stage cleanup, never a wait loop. Image `cc12c83666e7005606bb676312717539df70f21ba5edbb1b1f7a0d1018f83d2e`, root `18dda0b1b4bac0048cf3040c969b80b2f06a55ceeec5a153749d0ec1736d58e9`, UKI `088b1794012b032b168393a6fe75a23905f008583333880c86c96d3774d9820e`. Candidate only.
