# Native wait-classifier candidate

The existing measured static-PIE supervisor provides a wait mode: it blocks HUP/INT/TERM before fork, uses waitpid, and classifies zero/nonzero/helper-fault while signals remain blocked. Shell accepts only the helper's finite terminal domain and retries 128+ interrupted waits. Image `f6e4d693c730a0b6c53d54bbbdc9618a80e8471bfd7783011d9b49c0341e6883`, root `57f52e9c8d52c1cf7fb48581f64d02852d01a4c4fd37f6fee245da7f90d47f33`, UKI `970e007bea6988a71427a60e9d0dc443b483b3f87c92f59e274e16c1ce749ff7`. Candidate only.
