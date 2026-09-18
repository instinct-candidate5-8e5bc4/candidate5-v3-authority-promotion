# Verified cleanup-state candidate

Cleanup latches signals, retries unmount/removal three times, independently verifies mount and path absence, and changes state only after verified absence. Persistent cleanup failure emits a distinct terminal residue fault and makes no retry-freshness claim. Image `ec92653481b98547cf878470aa71cfb77a0dde93da44e51507f830364d3189da`, root `fec48d1c7f6c46878b0b059212885fb8b9d8885c3f80050686b7cdc02dee2faa`, UKI `478b78a841e52b38fc0e214d70ee141806d3f77aa5e730de9d3877a2c872eb5e`. Candidate only.
