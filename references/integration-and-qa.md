# Integration and QA

Use this reference when placing the effect in a page and before presenting it for review.

## Integration boundary

Keep the renderer responsible for compositing and motion fields. Keep the adapter responsible for:

- asset URLs
- DOM size and coordinate mapping
- pointer, keyboard, and touch input
- pause and full-helmet controls
- reduced-motion and page lifecycle
- offscreen suspension
- static fallback and user-facing status

Keep page layout, navigation, background scenes, and project interactions outside both. If the effect has already been accepted, preserve the renderer bytes and change only the adapter or wrapper.

## Browser interaction matrix

| Check | Expected result |
|---|---|
| Initial load | Original-color portrait is immediately available as fallback; renderer replaces it only after ready |
| Idle | Faint ghost moves and an automatic irregular reveal eventually appears without input |
| Pointer enter/move | Portrait turns only slightly; local wake follows the path |
| Concurrent input | Automatic reveal continues while the pointer wake is active |
| Pointer leave | Manual wake decays and portrait returns gently; automatic clock is unchanged |
| Direct trigger | Click, Enter, or Space starts the intended local/demo response |
| Keyboard pose | Arrow keys provide a bounded equivalent to pointer targeting |
| Escape | Clears the current interactive state and returns toward the base pose |
| Pause/resume | Drawing and clocks stop, then restart without a flash of stale water |
| Reduced motion | Static portrait remains; continuous motion is absent |
| Hidden/offscreen/modal | Heavy rendering suspends and resumes safely |
| Missing helmet | Portrait remains usable and the unavailable control is hidden or disabled |
| WebGL failure | Static portrait remains readable and interactive page controls still work |

## Visual inspection

Inspect continuous frames rather than a single screenshot. Look for crown-to-visor-to-chin progression, independent ghost motion, changing widths and fragments, and local wake decay. A still image cannot prove the flow feels alive.

Compare at the actual target viewport. Check registration after resize and after the containing layout changes. Make sure the face never receives wave distortion and that the helmet opening does not drift relative to the eyes or jaw.

## Runtime evidence

The reference renderer exposes diagnostic data attributes on the canvas, including sequence state, frame samples, ghost time, and flow uploads. Use them to test lifecycle and overlap, not as proof of visual quality.

When performance matters, sample the real foreground page while idle, during automatic reveal, during pointer input, and during overlap. Record the environment, mean frame interval, slow-frame threshold, and whether screenshot or video capture was running. Verify that manual texture uploads stop when the manual field is inactive.

## Reference integrity

The bundled renderer snapshot has these SHA-256 values:

- `portrait-renderer.js`: `48c625bebbba04c7d93d04a59ca6b30352e01cef450d28cc0dda9594c4dec5a6`
- `auto-reveal-field.js`: `1fe99a8c7452ef1f48e7c52ac19623e0c35e4d065db487df77225b8a4187d293`

Run `node scripts/verify-reference-kit.mjs` from the Skill directory before copying the reference or after any packaging change.

Keep conclusions separate: code validity, browser function, local performance, visual similarity, user acceptance, and deployment are different claims.
