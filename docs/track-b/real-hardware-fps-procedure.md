# B6 - Real-hardware FPS measurement procedure (owner bar)

Owner's bar: **45 FPS target**. Production measured **17 FPS**. **Emulated or
software-GL numbers are not accepted.** The headless/swiftshader number seen in
development screenshots is a rendering smoke signal only, never a perf result.

## How to measure (real hardware only)

1. On the target device (phone or desktop - record which), serve the repo root
   with any static server, e.g. `python3 -m http.server 8000`, and open
   `http://<device>:8000/visual-slice/` in the browser under test.
2. Let the scene run for 10 seconds of warmup.
3. Read the HUD field `FPS(measured on this hardware)` after it stabilizes
   (updates once per second).
4. Record: device model, GPU, OS, browser + version, window size / fullscreen,
   whether charging (mobile), and the FPS value.
5. Repeat for each target device/browser combination.

## Reporting

Report the recorded tuple (device, GPU, browser, window, FPS) back through the
review loop. State plainly when the 45 FPS target is not met. Do not substitute
emulator, simulator, or software-rendering numbers.

## Current status

- This side (Linux container): no real hardware available; perf measurement is
  **not done** and is owed by a real-hardware run. Visual smoke assertions
  (pixels/visual behavior only) are in `scripts/track-b/visual-smoke.js`.
