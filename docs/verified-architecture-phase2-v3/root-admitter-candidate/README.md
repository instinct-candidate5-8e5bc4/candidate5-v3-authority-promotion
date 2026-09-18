# Pre-fork parent-authentication candidate

Native helper captures expected_parent=getpid() before fork. PID1 inherits it, installs PDEATHSIG SIGKILL, then requires getppid()==expected_parent before work. Helper death at every clone/fork/prctl/recheck boundary leaves no surviving namespace init or descendants. Image `a59b177d84367ca2f3133040bb7a43194dd3594cdc8cadf798cf2a10e8a8b11b`, root `d6c28baa046ab220dd6fb27feb645596246511a694745d9a9aa200ecd0a63aaa`, UKI `7e5e70c00e74ec00272248be0a6559fb72335009d903414882c228e134b8a634`. Candidate only.
