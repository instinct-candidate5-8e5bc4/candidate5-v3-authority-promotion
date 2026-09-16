# adult-v1 MALE / SUPINE_FLOOR Dimension Authoring Record

Decision: `DA-ADULT-V1-MALE-SUPINE-001`. Status: `AUTHORED_NEW`, submitted for Gate B review.

This is one bounded physical profile for the School Vertical Slice. It does not represent every adult male, and it makes no population-wide claim across stature, mass, age, body shape, disability or clothing. It is independent of all legacy visual dimensions, `casualtyLength`, PNG/alpha/shadow bounds, GLB bounds, runtime scale and bone edits.

Reference evidence: NASA OCHMO-HB-004 Rev A, December 2023, Table 1, https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-hb-004-rev-a-dec2023.pdf. The table gives minimal-clothing design ranges including standing stature 148.6-194.6 cm, bideltoid breadth 37.8-56.1 cm, forearm-to-forearm breadth 38.9-66.0 cm, and standing bust depth 19.1-30.2 cm. NASA notes body dimensions are not perfectly correlated. The source is reference for explicit author decisions, not inherited Physical Truth.

| Dimension ID | Authored value | Meaning / need | Method and limitation | Decision |
|---|---:|---|---|---|
| ENVELOPE_Z | 1,946,000 microunits | Head-to-feet exclusion and footprint length | Upper cited stature selected as conservative slice envelope; standing-to-supine correspondence is an authoring assumption | DA-...-D01 |
| ENVELOPE_X | 660,000 | Lateral body/arm exclusion | Upper cited forearm-to-forearm breadth selected to avoid a narrow false PASS; may cause conservative false rejects | DA-...-D02 |
| ENVELOPE_Y | 302,000 | Maximum body height above floor | Upper cited bust depth selected as conservative supine thickness; posture correspondence is an authoring assumption | DA-...-D03 |
| TORSO | 560,000 x 302,000 x 650,000 | Central body collision/contact primitive | Explicit simple partition within envelopes, sized to carry max thickness; not an anatomical torso model | DA-...-D04 |
| HEAD | 240,000 x 240,000 x 240,000 | Head-end collision/contact primitive | Explicit rounded slice authoring choice; not universal anatomy | DA-...-D05 |
| LEGS | 460,000 x 220,000 x 1,056,000 | Feet-end collision/contact primitive | Chosen so head, torso and legs exactly span ENVELOPE_Z; both legs simplified into one conservative box | DA-...-D06 |
| ARMS (each) | 50,000 x 180,000 x 700,000 | Complete lateral exclusion/contact | Positioned symmetrically so aggregate equals ENVELOPE_X; static, non-articulated slice geometry | DA-...-D07 |

All five components touch local floor plane Y=0. Every final value is AUTHORED_NEW. Reviewer identity remains unassigned; Gate B stops at VALIDATED pending user review, so no VERIFIED_FOR_SLICE claim is made.
