# Racing Helmet Motion

An Agent Skill for building a restrained, interactive racing-helmet reveal around an original-color portrait. The effect keeps the person stable while a registered helmet ghost, automatic flowing reveal, local pointer wake, and subtle pose response move on independent timelines.

Published by **Archer** ([@archerthegoat](https://github.com/archerthegoat)).

## What the Skill covers

- original-color cutout portrait with a static fallback
- aligned color helmet and translucent or wireframe ghost
- crown-to-visor-to-chin ghost reveal
- automatic irregular flow that continues without pointer input
- localized pointer water response that does not cancel the automatic pass
- restrained whole-portrait pointer following
- pause, reduced-motion, visibility, offscreen, keyboard, and failure handling
- a dependency-free WebGL reference renderer with an integrity check

## Install

Ask Codex to install this repository as a Skill, or clone it into the Codex skills directory:

```bash
git clone https://github.com/archerthegoat/racing-helmet-motion.git ~/.codex/skills/racing-helmet-motion
```

Then invoke it as `$racing-helmet-motion` when the helmet portrait is the focal interaction.

## Use

The Skill expects three project-specific inputs:

1. a transparent, original-color portrait
2. a transparent color helmet image or licensed render
3. a matching transparent ghost or wireframe view

Read `SKILL.md` first. It routes asset fitting, motion tuning, integration, and QA to the relevant references. The files under `assets/reference-renderer/` are the frozen accepted motion core; the files under `assets/integration/` show how to connect it to a page without coupling it to page layout.

Run the package checks from the repository root:

```bash
python3 /path/to/skill-creator/scripts/quick_validate.py .
node scripts/verify-reference-kit.mjs
node --check assets/reference-renderer/portrait-renderer.js
node --check assets/reference-renderer/auto-reveal-field.js
node --check assets/integration/portrait-adapter.js
```

The first command uses the validator bundled with Codex's `skill-creator`; its exact path depends on the local Codex installation.

## Asset and provenance boundary

This repository contains instructions and original implementation code. It does not include a person's portrait, racing-team or sponsor artwork, a third-party helmet model or product image, or copied source code from another website. Supply assets you own or are licensed to use, and keep private portraits local unless their owner authorizes publication.

The included renderer is a reference implementation of the documented interaction contract. Code checks and captured frames do not establish visual acceptance; review the real effect in motion at the target viewport.

## License

MIT. See [LICENSE](LICENSE).

---

Created and published by Archer · [github.com/archerthegoat](https://github.com/archerthegoat)
