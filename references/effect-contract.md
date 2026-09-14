# Racing helmet effect contract

Use this reference to assess or tune the motion itself.

## Layer model

The effect is a composite of four independent layers:

| Layer | Role | Must remain independent from |
|---|---|---|
| Portrait | Original-color person and subtle rigid pose | Wave displacement and reveal masks |
| Ghost | Faint shell, visor, and wireframe presence | Color reveal state |
| Automatic reveal | Irregular transported color fragments | Pointer entry, movement, clicks, and leave |
| Manual wake | Local water and color response along input | Automatic cycle and ghost clock |

Combine automatic and manual masks at render time. Pointer activity must not reset, postpone, or replace the automatic pass. When the automatic pass ends, it must not clear an active manual wake.

## Accepted visual behavior

- The portrait remains in color and recognizable at every moment
- The helmet ghost is very faint and changes continuously while motion is enabled
- Ghost visibility advances from the crown downward, with a fading upper wake
- Automatic reveal consists of changing local fragments that shear, curl, narrow, widen, and disappear at different times
- The interior of the face remains visible; the reveal is not a solid helmet-shaped wipe
- A pointer wake stays near the path and decays after input stops
- Water outside the helmet is a restrained reflection, not a large expanding ring
- Pointer following is a tiny whole-image perspective response with a gentle return
- The effect can idle between active manual waves and avoids unnecessary texture uploads

## Rejected failure modes

- a rigid circular hole moving left to right
- one complete spiral or band moving as a single object
- mouse motion cancelling the automatic effect
- a permanent hover spotlight
- large concentric ripples, heavy refraction, or distorted facial features
- synchronized whole-helmet blinking
- large 3D head rotation from a flat photograph
- black-and-white conversion of the portrait
- calling a photo-and-wireframe composite a scan or an exact reproduction of a third-party site

## Tuning guidance

Change structure before decoration. When motion feels mechanical, vary where new reveal material enters, how old material transports, and how segments taper and decay. Blur alone usually makes the effect softer but not more alive.

Keep automatic cadence slightly variable. Use smooth acceleration and deceleration, asymmetric leading and trailing edges, and short gaps. Avoid a perfectly periodic sweep that exposes the loop.

Keep the ghost and color reveal related through registration, not through a shared opacity value. The ghost should retain its own material motion when the color layer is absent.
