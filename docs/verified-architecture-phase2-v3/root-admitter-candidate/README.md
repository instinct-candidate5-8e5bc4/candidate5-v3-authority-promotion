# Kernel exact used-size/next-offset candidate

Supervisor requires returned data_size region to equal exact unaligned spec+NUL parameter used size, next to equal ALIGN_UP(used,8), and next bounded against original request capacity. It never reads padding beyond returned data_size. Independent fixture evaluator accepts committed exact valid fixture. Supervisor `494d6b7edb1da1c68e5ae0730c9b269c45041f7d608a886077808cbd62bb38d7`, root `501df761f691580f6ae3c59e360ac6eba6d9898848e487d5f6d112fea52b83ec`, UKI `5409fae940ee565e4a3359ecd94fbc6c322a822521a1048957342307420eeb02`. Candidate only.
