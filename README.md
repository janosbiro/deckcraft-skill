# Deckcraft

An agent skill for planning, designing, building, and visually checking editable PowerPoint decks. The repository name is `deckcraft-skill`; the skill name is `deckcraft`.

Deckcraft combines narrative and composition guidance with native PPTX authoring via `@office-kit/pptx`, quick visual review via `@office-kit/pptx-preview`, and a final LibreOffice render check. It includes small, attributed MIT-licensed code adaptations from [siril9/presentation-skill](https://github.com/siril9/presentation-skill) and [alfonsograziano/pptx-gen](https://github.com/alfonsograziano/pptx-gen), ported to an independent Office Kit implementation. See [third-party notices](THIRD_PARTY_NOTICES.md).

## Install the skill

Clone the repository into the skill directory for your agent. Each command installs the same repository under the skill folder name `deckcraft`:

```bash
# Codex: personal skill
git clone https://github.com/janosbiro/deckcraft-skill.git "$HOME/.agents/skills/deckcraft"

# GitHub Copilot: personal skill
git clone https://github.com/janosbiro/deckcraft-skill.git "$HOME/.copilot/skills/deckcraft"

# Claude Code: personal skill
git clone https://github.com/janosbiro/deckcraft-skill.git "$HOME/.claude/skills/deckcraft"
```

For a project skill, clone to `<project>/.agents/skills/deckcraft` for Codex, `<project>/.github/skills/deckcraft` for Copilot, or `<project>/.claude/skills/deckcraft` for Claude Code. Each agent reads the same root `SKILL.md` and nearby references/scripts. Restart the agent session if the skill is not discovered immediately. Agent skill locations are documented by [OpenAI](https://learn.chatgpt.com/docs/build-skills), [GitHub](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills), and [Anthropic](https://code.claude.com/docs/en/skills).

The skill instructions can guide decks created through other tools too; the included executable example uses Office Kit. A local Node.js runtime **22.18+** is required for its scripts.

## Run the minimal example

From the cloned skill directory:

```bash
npm ci
npm test
npm run validate:ir -- examples/minimal-deck.json
npm run build:example
npm run preview:example
npm run qa:lo
npm run qa:compare
```

The example makes native text, a chart, and a table. Generated files go under `artifacts/` and are ignored by Git. `qa:lo` requires a `soffice` or `libreoffice` executable on `PATH`; it exports a PDF. `qa:compare` also requires Poppler's `pdftoppm` on `PATH` and writes `artifacts/comparison/index.html`, pairing every preview slide with its LibreOffice render. Open that report to check text wrapping, chart axes, and table styling. It checks page counts but does not automatically decide whether a visual difference is acceptable. The PNG previews and PDF are QA artifacts, not source for the PPTX.

## Build a corporate deck

`examples/enterprise-deck.json` is an **illustrative, invented-data** eight-slide deck exercising every executable layout. It is not a factual business case. Its theme contains semantic color/font overrides; each slide chooses a role, layout, and optional `primary`/`alternate`/`dense` geometry variant. The script validates required content and basic text contrast before building.

```bash
npm run validate:ir -- examples/enterprise-deck.json
npm run build:enterprise
npm run preview:enterprise
```

To exercise the four additional editable compositions, run `npm run build:architecture` and `npm run preview:architecture` and inspect the resulting images under ignored `artifacts/`.

## Reusable project setup and design exploration

Create non-secret, project-local brand settings and human-readable rules without overwriting existing files:

```bash
node scripts/init-project.mjs /path/to/project
```

Put approved local templates under `.deckcraft/templates/` (keep the binaries local/private). Build and validate against that project's explicit semantic tokens with `--config /path/to/project/.deckcraft/config.json`. Deck-level theme tokens override project defaults. The skill reads `.deckcraft/DECKCRAFT.md` for project-specific narrative, brand, and data conventions.

Inventory a real PPTX template into a local JSON catalogue and PNG thumbnails; the source PPTX itself is not copied or modified:

```bash
node scripts/template-catalog.mjs /path/to/brand-template.pptx /path/to/project/.deckcraft/templates/brand --slides 1,3-6
```

The catalogue includes current editable shape IDs and text for mapped template slide fields. Prefer `{{token}}` fields when the template is authored for them; use `shapeFields` only with IDs from the current catalogue. For choosing between visual styles without changing content/layout, run `node scripts/audition-designs.mjs examples/minimal-deck.json 2 /tmp/deckcraft-audition` and compare its three preview PNGs.

Add top-level `sources` and slide-level `evidenceRefs` for material claims and values, then produce an auditable checklist with `node scripts/audit-evidence.mjs <deck-ir.json> <evidence-review.md>`. After rendering selected slides, use `node scripts/create-repair-packet.mjs <deck-ir.json> <preview-dir> <output-dir> --slides 2,4` to keep repair context bounded. A human review receipt can bind per-slide PASS/FIX decisions to PPTX/PNG SHA-256 hashes with `node scripts/create-review-receipt.mjs <current.pptx> <preview-dir> <review.json> <receipt.json>`.

The review input is intentionally human-authored, for example:

```json
{
  "reviewer": "Codex",
  "items": [
    { "slide": 2, "verdict": "PASS", "rationale": "Chart labels align and are readable at presentation size." },
    { "slide": 4, "verdict": "FIX", "rationale": "The timeline label sits left of its marker." }
  ]
}
```

The twelve bounded slide patterns include `system-map` for trust boundaries, `evidence-map` for sourced qualitative taxonomies, `phased-plan` for gated rollout steps, and `capability-stack` for reusable platform controls alongside the original eight. Choose by meaning, not by cycling through patterns. They generate editable native text, charts, tables, lines, and grouped diagrams. `role` is never printed; optional `eyebrow` is for intentional reader-facing copy. `timeline` requires a true `time` or `ordered` relation. `image` is accepted only as a supporting photo/illustration/texture on a `split` slide; do not use it to rasterize chart or text content. A clean automated report is not a visual pass: inspect every new slide's PNG, then compare the current PPTX with a LibreOffice render before delivery.

For an existing branded deck, `template.source` may point to a local `.pptx`; a slide with `templateSlide` (1-based) duplicates that slide and fills `{{token}}` fields from `fields`. The source slide's native structure, master and styling are preserved. Clone/fill and newly authored slides may be mixed in one deck. Tokens must each occur within a single text run; missing tokens fail loudly. The included renderer does not yet infer arbitrary editable regions or reproduce the upstream projects' full template libraries.

For a **single edited slide**, keep the visual loop small:

```bash
node scripts/render-preview.mjs artifacts/example.pptx artifacts/qa-slide-2 --slides 2
node scripts/qa-libreoffice.mjs artifacts/example.pptx artifacts/final
node scripts/compare-renders.mjs artifacts/qa-slide-2 artifacts/final/example.pdf artifacts/compare-slide-2 --slides 2
```

The first command writes only slide 2's SVG/PNG plus selected-slide text and geometry findings. The comparison renders only page 2 from the final PDF. Open the selected PNG and slide pair in an image-capable agent, decide `PASS` or `FIX`, and rerun only slide 2 after a fix. Use a fresh preview directory to avoid stale images. Omit `--slides` for a new deck or a global theme/layout change. See [slide design and visual QA](references/visual-design-qa.md) for the explicit pass criteria and change-scope rules. The geometry check detects connector lines crossing text frames; it does not replace visual judgment.

## Design workflow

1. Form a story spine: audience, decision, tension, proof, and call to action.
2. Give each slide one claim and choose a layout grammar from [references/layout-grammars.md](references/layout-grammars.md).
3. Store the semantic plan in the [deck IR](references/schema.md), then validate it.
4. Author editable text, tables, charts, and grouped diagrams with native PPTX objects. When editing a template, reuse its masters, layouts, and placeholders.
5. For a new deck, render and inspect every slide and the complete sequence. After a local edit, render and inspect only changed slides with `--slides`; expand the scope when shared design inputs change.
6. Export the current PPTX with LibreOffice, compare the edited slides (or the full deck at first baseline), and inspect the selected pairs. Report any preview/Office differences or unsupported objects.

The included renderer implements all twelve layouts in [the layout grammar reference](references/layout-grammars.md). It is a tested foundation, not a guarantee that arbitrary source material will look polished without review. The preview package is a fast approximation, so final visual QA still matters, especially for branded templates and fonts not installed on the host.

## Repository policy

Only text source and documentation belong in Git. `.gitignore` excludes dependencies, virtual environments, `.env*` files, generated decks, images, PDFs, ZIPs, caches, and build output. Before every push, review `git diff --cached --name-only` and verify the staged file types. Never add binaries with `git add -f`.
