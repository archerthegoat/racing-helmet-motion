---
name: racing-helmet-motion
description: Build and refine interactive racing-helmet portrait effects with an original-color cutout, a registered helmet and ghost, an automatic flowing reveal, localized pointer ripples, and restrained pointer-following pose. Use when this helmet reveal is the focal web effect; skip general page animation and unrelated 3D work.
license: MIT
metadata:
  author: "Archer (@archerthegoat)"
  publisher: "Archer"
  version: "1.0.1"
  repository: "https://github.com/archerthegoat/racing-helmet-motion"
  demo: "https://www.archeroy.io/index.html"
  inspiration: "https://landonorris.com/"
---

# Racing Helmet Motion

Create the portrait effect as a layered illusion: preserve the real person, register the helmet around the head, and let color, wireframe, water, and pose move on separate timelines. Use the included renderer as a tested reference implementation, not as proof of a real 3D scan or of another site's internal algorithm.

The interaction direction was inspired by the public portrait experience on the [official Lando Norris website](https://landonorris.com/). This Skill is an independent implementation and includes none of that site's source code or media. When presenting the result, describe the website as inspiration and the rendered effect as the user's own implementation; do not imply affiliation, endorsement, or exact reproduction.

## Preserve the effect contract

The intended behavior is:

- original-color portrait with its background removed
- face and body proportions unchanged
- very small whole-portrait turn toward the pointer
- faint helmet shell or wireframe that appears from crown to visor and chin
- an automatic irregular flow that crosses the helmet without user input
- a localized mouse or touch wake that can run at the same time
- automatic and manual reveals that start, evolve, and expire independently
- static portrait fallback plus pause, keyboard, reduced-motion, hidden-page, modal, and offscreen handling

Read [references/effect-contract.md](references/effect-contract.md) before changing the motion. It distinguishes the accepted behavior from the rigid or oversized versions that were rejected during development.

## Prepare and register the media

Use three aligned inputs:

1. a transparent, original-color portrait
2. a transparent color helmet image or a licensed render
3. a ghost or wireframe view matched to the same helmet silhouette, camera, and registration

Keep private portraits local unless the user explicitly authorizes another destination. Check the helmet source and reuse rights. A public product photo is not automatically a reusable asset.

Fit the helmet, visor, face opening, crown, and chin in a static composite before tuning motion. Do not hide registration problems with stronger glow, blur, distortion, or a larger mask. Read [references/asset-registration.md](references/asset-registration.md) for the current reference dimensions and replacement options.

## Start from the reference renderer

The folder [assets/reference-renderer](assets/reference-renderer) contains the exact accepted renderer snapshot and its CPU auto-reveal field. Copy both files together because `portrait-renderer.js` imports `auto-reveal-field.js`.

The snapshot expects the current reference image layout and contains registration constants for it. Change those constants only when the new media requires a different fit. Keep a clean copy or hash of the accepted source before tuning. Once the user accepts a new effect, freeze its core and integrate it through an adapter.

Use [assets/integration/portrait-adapter.js](assets/integration/portrait-adapter.js), [assets/integration/portrait.css](assets/integration/portrait.css), and [assets/integration/markup.html](assets/integration/markup.html) as dependency-free integration examples. Replace asset URLs and fit the wrapper to the page; do not put page layout logic into the renderer.

## Tune in the right order

1. Confirm static portrait and helmet registration
2. Confirm the faint ghost silhouette and top-to-bottom reveal direction
3. Tune the automatic flow shape, cadence, taper, and decay
4. Tune the pointer wake without enlarging it into a circular spotlight
5. Check automatic and pointer layers together
6. Add tiny pose following and gentle return
7. Integrate pause, fallback, keyboard, touch, and page lifecycle
8. Measure performance and only then adjust rendering cost

Changing amplitude, blur, speed, and frequency cannot repair the wrong motion structure. If the result looks like a hole sliding left and right, change the mask field and transport behavior rather than polishing the same travel path.

## Keep the person stable

Apply water and reveal distortion only to the helmet, ghost, and surrounding reflected light. Move the portrait as one rigid layer. Avoid local depth warping of eyes, nose, mouth, or jaw unless a real depth asset and a separately accepted design require it.

Use small ranges and smooth targets. The reference implementation intentionally keeps translation and roll minimal, with only a slight shared-plane yaw and pitch. A user should notice responsiveness without seeing the face wobble.

## Verify before delivery

Read [references/integration-and-qa.md](references/integration-and-qa.md) for the interaction matrix and evidence boundaries. At minimum, inspect the real browser while idle, during pointer movement, during overlap of both reveal layers, after pointer leave, while paused, and after resume. Check that the renderer stops unnecessary work when inactive.

Run `scripts/verify-reference-kit.mjs` from the Skill directory to confirm that the bundled accepted core remains intact. Code checks and frame samples do not replace the user's visual acceptance.
