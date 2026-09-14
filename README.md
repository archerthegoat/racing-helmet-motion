<div align="center">

<p>
  <strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a>
</p>

# Racing Helmet Motion

**A cinematic racing-helmet reveal for real portraits, packaged as an Agent Skill**

Original-color portrait · autonomous helmet flow · local pointer ripples · restrained pose response

[![Agent Skill](https://img.shields.io/badge/Agent-Skill-e8edf0?style=flat-square&labelColor=080a0c&color=cad4da)](./SKILL.md)
[![Vanilla JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-e8edf0?style=flat-square&labelColor=080a0c&color=cad4da)](./assets/integration/portrait-adapter.js)
[![WebGL](https://img.shields.io/badge/WebGL-Native-e8edf0?style=flat-square&labelColor=080a0c&color=cad4da)](./assets/reference-renderer/portrait-renderer.js)
[![MIT License](https://img.shields.io/badge/License-MIT-e8edf0?style=flat-square&labelColor=080a0c&color=cad4da)](./LICENSE)

[Live demo](https://www.archeroy.io/index.html) · [Install](#install) · [See how it works](#how-it-works) · [Read the Skill](./SKILL.md)

<a href="https://www.archeroy.io/index.html">
  <img src="docs/media/archer-helmet-motion.webp" width="760" alt="Racing helmet ghost and flowing color moving across Archer's original-color portrait">
</a>

<sub>Captured from Archer's live implementation — move the pointer on the website to see the full interaction</sub>

</div>

---

Racing Helmet Motion teaches coding agents to build the effect as a set of registered, independent layers. The portrait stays recognizable while a helmet ghost emerges from crown to chin, an automatic reveal keeps moving without input, and a localized pointer wake responds without cancelling it.

## Install

Install with the cross-agent Skills CLI:

```bash
npx skills add archerthegoat/racing-helmet-motion
```

The CLI discovers the root-level `SKILL.md` and lets you choose a supported agent and installation scope. Node.js and npm are required.

For a user-level Codex installation:

```bash
npx skills add archerthegoat/racing-helmet-motion --agent codex --global
```

<details>
<summary>Install from inside a Codex conversation</summary>

Enter this in Codex as a message, not in a terminal:

```text
$skill-installer install https://github.com/archerthegoat/racing-helmet-motion
```

`$skill-installer` invokes Codex's bundled installer. Restart the target agent if the newly installed Skill does not appear immediately.

</details>

## Try it

Give your coding agent the portrait and helmet assets, then ask:

```text
Use the racing-helmet-motion skill to build a subtle helmet reveal around this portrait.
Keep the person in original color, fit the helmet before tuning motion, and keep
the automatic flow independent from the pointer response.
```

Start with assets that you own or are licensed to use:

1. A transparent, original-color portrait
2. A transparent color helmet image or licensed model render
3. A matching transparent helmet ghost or wireframe

## How it works

| Layer | Behavior |
|---|---|
| **Portrait** | Preserves the person's color, proportions, and recognizable features |
| **Helmet ghost** | Reveals from the crown toward the visor and chin with faint material motion |
| **Automatic flow** | Crosses the helmet on its own with changing shape, cadence, and decay |
| **Pointer wake** | Produces small, local ripples without interrupting the automatic pass |
| **Pose response** | Turns the whole portrait within a restrained range and returns smoothly |

The renderer separates autonomous motion, pointer response, helmet presence, and portrait pose into different timelines. This separation is what keeps the interaction fluid when the pointer moves.

## Build sequence

1. **Register the media** — align the crown, visor, face opening, and chin in a static composite
2. **Shape the helmet presence** — establish the faint top-to-bottom ghost before adding stronger motion
3. **Tune independent flows** — adjust the automatic reveal and pointer wake separately, then test them together
4. **Integrate page lifecycle** — add static fallback, reduced motion, pause, offscreen, hidden-page, and resume behavior
5. **Inspect in a real browser** — watch idle motion, pointer motion, overlap, pointer leave, pause, and recovery continuously

Detailed guidance lives in the [effect contract](./references/effect-contract.md), [asset registration guide](./references/asset-registration.md), and [integration and QA guide](./references/integration-and-qa.md).

## What ships

```text
racing-helmet-motion/
├── SKILL.md                         Agent instructions and workflow
├── assets/
│   ├── reference-renderer/          Frozen accepted WebGL renderer
│   └── integration/                 Dependency-free page adapter and CSS
├── references/                      Effect, registration, and QA guidance
├── scripts/verify-reference-kit.mjs Renderer integrity check
└── docs/media/                      Rendered demonstration preview
```

The reference renderer uses native JavaScript and WebGL with no third-party runtime dependency. Its registration constants match the bundled reference layout; new media still needs a deliberate fit.

## Verify

```bash
node scripts/verify-reference-kit.mjs
node --check assets/reference-renderer/portrait-renderer.js
node --check assets/reference-renderer/auto-reveal-field.js
node --check assets/integration/portrait-adapter.js
```

These checks establish source integrity and JavaScript syntax. Final motion quality still requires continuous inspection in a real browser.

## Inspiration and authorship

The interaction direction was inspired by the public portrait experience on the [official Lando Norris website](https://landonorris.com/), especially its top-to-bottom helmet presence, autonomous reveal, and separation between pointer response and ambient motion.

This repository is an independently designed and written implementation. It includes no source code, model, image, or other media copied from that website and has no affiliation with, authorization from, or endorsement by Lando Norris or his team.

The preview above comes from [Archer's personal website](https://www.archeroy.io/index.html). The repository publishes the rendered demonstration, method, code, and integration examples while keeping Archer's source portrait and project helmet inputs outside the package.

## Asset boundary

The package does not bundle reusable source portraits, helmet models or images, or extracted racing-team and sponsor artwork. The animated WebP is a rendered demonstration, not an input asset or a grant to reuse anything depicted in it. Third-party names, logos, and trade dress visible in the demonstration remain the property of their respective owners.

## Publisher

Created and published by **Archer** · [@archerthegoat](https://github.com/archerthegoat) · [archeroy.io](https://www.archeroy.io/)

Released under the [MIT License](./LICENSE) · Copyright © 2026 Archer
