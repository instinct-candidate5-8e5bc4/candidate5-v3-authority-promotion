# Closed-environment measured root-admitter candidate

Supervisor uses `execve` with exactly PATH, LANG, LC_ALL and TZ, so no inherited loader/shell/config variable reaches dynamic Bash. Launcher first validates its exact post-Bash environment and rejects everything except those entries plus exact shell-created SHLVL and `_`. Rootfs contains exact signed 31-record closure.

Launcher `e81527cfbe94283d328f2724dc08eab8c304b1c785e41f4d0629704aef4a88d5`; supervisor `1e0bd9c8844c41dc0147caa2fd05dc68e273c24a2f0428f2803c56177e601b0a`; image `26e3af008dcaf786c089634073379a303080bc785308762220078caae7c8f042`; verity root `71f373bfd2144b68e7f26d7f278f01d18e24df320e56460c110b942adbeb9b90`; signed UKI `9ec13012930db1f34a70959d062cf655132f475a05ca9244f432c14ad5095c9c`; db certificate DER `9e210583657ab6c1cb85ec82652bf0aea93e98cecc5c32a3706872eccb28f7ec`. Candidate only; no generated artifact executed, mounted, activated or booted.
