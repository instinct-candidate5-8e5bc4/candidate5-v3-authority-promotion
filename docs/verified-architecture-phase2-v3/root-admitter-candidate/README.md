# Dedicated native result-channel candidate

The command-substitution FIFO is verified and CLOEXEC. Only the helper parent retains its writer; child stdout is separate. Child uses a new process group plus PDEATHSIG kill/race check, so helper death closes the result pipe and terminates the child. Image `8c602481c9334ccba6587dff0b84e1b4be32f79c29bb4dae0b09693544ee6668`, root `f531756bcb4482773b443929ab3c32cdf46b9f13fb4ec2b78f289c52f3ef3f0e`, UKI `a9d9b33421555cd4ef106f658033a09aa3aa1a7e6aab96e828e48c22e4faa4d7`. Candidate only.
