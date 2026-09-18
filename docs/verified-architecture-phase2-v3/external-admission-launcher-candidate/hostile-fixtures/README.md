# Hostile review fixtures

The matrix is permanent review data. Race cases use an explicit interleaving model: before open, pathname/type/digest/tree-entry checks reject substitution; after open, every byte check and the handoff use descriptor 9, so rename/path replacement cannot select a new object; concurrent mutation is blocked by the enforced read-only root mount and an altered object digest fails. The candidate is not executed in this design task.

The signed-wrong-admission fixture has a valid signature from the candidate key over canonical but stale admission bytes. Signature validation passes; exact reconstruction from actual candidate bytes fails `E_ADMISSION_BINDING`.
