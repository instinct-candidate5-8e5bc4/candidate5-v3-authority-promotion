# adult-v1 MALE SUPINE_FLOOR Body Review

Top view (+Z is head):

```
               +Z HEAD
              [ HEAD ]
       [LEFT ARM][TORSO][RIGHT ARM]
              [ LEGS ]
               -Z FEET
```

Frame: right-handed; +X casualty right, +Y up, +Z toward head. Origin `(0,0,0)` is the authored floor-contact frame. Canonical orientation is identity. Floor contact is Y=0, authored independently of visuals.

Components `(size X,Y,Z; center X,Y,Z)` in microunits:
- head: `(240000,240000,240000); (0,120000,647000)`
- torso: `(560000,302000,650000); (0,151000,202000)`
- legs: `(460000,220000,1056000); (0,110000,-651000)`
- left arm: `(50000,180000,700000); (-305000,90000,227000)`
- right arm: `(50000,180000,700000); (305000,90000,227000)`

Derived aggregate: X `[-330000,330000]`, Y `[0,302000]`, Z `[-1179000,767000]`; total `660000 x 302000 x 1946000`. Footprint is the union of five exact component XZ rectangles. Contact is five matching rectangles on Y=0. Phase 2 receives the conservative aggregate AABB. PASS is valid under that bounded representation; FAIL may be a conservative false rejection and is never compensated.
