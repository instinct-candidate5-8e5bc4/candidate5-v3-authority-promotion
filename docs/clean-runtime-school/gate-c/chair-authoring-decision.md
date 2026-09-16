# CHAIR AUTHORING DECISION RECORD - gate-c-chair-authoring-001

The School treatment chair is AUTHORED_NEW physical truth. No legacy chair, image, panorama, renderer, or scene variant supplied dimensions.

| Decision | Physical meaning | Value | Unit | Basis/reference | Why required | Uncertainty |
|---|---|---:|---|---|---|---|
| GC-DIM-01 | Seat support height | 0.49 | m | BIFMA G1-2013 adjustable seat-height range 0.376-0.512 m | support plane/contact | fixed authored point inside range; not a population claim |
| GC-DIM-02 | Seat/body width | 0.50 | m | BIFMA G1-2013 seat width minimum 0.489 m, rounded upward | support region and collision width | conservative authored width |
| GC-DIM-03 | Seat depth | 0.50 | m | body envelope includes frame; seat support region is 0.48 m; BIFMA fixed pan guidance <=0.415 m is ergonomic, not collision truth | collision footprint and bounded support | treatment-chair shape not product-derived |
| GC-DIM-04 | Overall body height | 0.90 | m | seat 0.49 m plus 0.41 m AUTHORED_NEW backrest envelope | collision extent | backrest is not ergonomic certification |
| GC-DIM-05 | Seat slab thickness | 0.04 | m | AUTHORED_NEW minimal non-zero collision slab | separates surface plane from body | no structural/load claim |
| GC-DIM-06 | Seat support inset | 0.01 each edge | m | AUTHORED_NEW, keeps support plane distinct from whole AABB | explicit seat-only surface | no cushion deformation model |

Reference: https://ewiworks.com/wp-content/uploads/2023/03/Updated-Chair-Standards-Overview.pdf . It reports BIFMA G1-2013 ranges; it is REFERENCE_ONLY. Values are not a claim of compliance, load capacity, anatomy, clinical suitability, or a real product.
