---
name: deckcraft
description: Create or edit polished, editable PowerPoint presentations from a narrative brief using a typed deck IR, native office-kit PPTX objects, preview-driven visual QA, and LibreOffice final rendering.
metadata:
  short-description: Build professional editable PPTX decks with visual QA
---

# Deckcraft

Use this skill when the user wants a professional presentation, an editable PPTX deck, a template-based deck edit, or a repeatable presentation-generation workflow. It works in Codex, GitHub Copilot, and Claude Code.

## Operating contract

Treat every deck as a communication system, not a collection of decorated slides. First establish the audience, decision, narrative arc, evidence, and desired action. Then express the deck as a typed IR and choose a layout grammar per slide.

For the exact IR contract, read [references/schema.md](references/schema.md). For composition choices, read [references/layout-grammars.md](references/layout-grammars.md). Before authoring or reviewing slides, read the explicit [slide design and visual QA criteria](references/visual-design-qa.md).

## Required workflow

1. **Brief and story spine** — identify audience, objective, key tension, proof, and call to action. Create a slide-by-slide claim sequence before writing slide copy.
2. **Project context and deck IR** — when present, read `.deckcraft/DECKCRAFT.md` and `.deckcraft/config.json` for project rules and brand tokens. Initialize without overwriting existing files using `node scripts/init-project.mjs <project-dir>`. Represent slide role, claim, content blocks, assets, data, and template intent in the IR. Validate with `scripts/validate_deck_ir.mjs`; pass `--config` when project theme tokens should participate. `examples/enterprise-deck.json` and `examples/architecture-deck.json` have invented illustrative facts only.
3. **Design system and audition** — resolve semantic color, typography, and grid tokens from optional project config plus IR `theme` overrides. Use one dominant visual idea per slide and the tested geometry variants. When the best direction is uncertain, freeze the content and layout and run `scripts/audition-designs.mjs <ir> <slide-number> <output-dir>`; compare the same slide under three style presets before changing the deck.
4. **Template intake and native authoring** — inventory approved source decks with `scripts/template-catalog.mjs <source.pptx> <catalog-dir> [--slides ...]`; inspect thumbnails and editable shape IDs. For branded slides, reuse master/layout/placeholder geometry. Clone with `template.source` + `templateSlide`; fill `{{token}}` placeholders with `fields`, or bind a known editable shape ID using `shapeFields`. New slides use the twelve Office Kit layouts. Missing targets fail; they are not a cue to redraw the source slide.
5. **Evidence** — record metadata in top-level `sources`; map material slide claims or values using `evidenceRefs` with claim, values, units/scope, and `sourceIds`. `scripts/audit-evidence.mjs` creates a traceability checklist. It does not establish factual accuracy; a human still checks authority, date, scope, definitions, and arithmetic.
6. **Preview loop** — render PNG previews with `@office-kit/pptx-preview`. On a new deck, inspect every slide once. After a local edit, use `scripts/render-preview.mjs ... --slides N` and inspect only changed slides; review all affected slides after shared style/template changes. Open each selected PNG in the agent's image tool and record a concise `PASS`/`FIX` decision using the visual QA criteria. `scripts/create-repair-packet.mjs` combines only the selected slides' claims, previews, and QA findings; after a fix, rerender only that selection.
7. **Final QA** — render the current PPTX with LibreOffice headless using `scripts/qa-libreoffice.mjs`. With Poppler, use `scripts/compare-renders.mjs ... --slides N` for edited slides or omit the flag for a first full-deck check. Inspect selected slide pairs, fix failures, and report unsupported features or renderer differences. The report checks coverage, not visual equivalence automatically.

Font substitution is a material QA failure even when geometry checks pass. Choose a font installed on the production render host (the examples use Arial), or package/deploy the licensed corporate font through an approved process. If LibreOffice renders a different family than the preview, correct the font environment or theme before delivery. For auditable visual sign-off, provide per-slide `PASS`/`FIX` plus rationale in a review JSON and run `scripts/create-review-receipt.mjs`; its hashes bind the decision to the exact PPTX and preview PNGs.

## Non-negotiable PPTX policies

- Text uses native text frames and paragraph runs; bullets are paragraph properties.
- Tables use native table objects. Charts use native chart objects with data series and labels.
- Reuse existing master/layout/placeholder geometry before inventing new geometry.
- Do not rasterize text, charts, or tables.
- Do not create bullets from separate textboxes.
- Do not ship ungrouped shape soup. Use semantic objects, grouped diagrams, or a deliberate small set of shapes with clear ownership.
- Keep decorative raster assets separate from semantic content so the deck remains editable and accessible.
- `role` and `claim` are internal metadata, never automatically visible slide text. Use the optional `eyebrow` only for deliberate reader-facing wording.
- Do not encode simultaneous controls as a timeline or editorial categories as invented chart values. `timeline.relation` must explain real time or step dependency; use `system-map` or `evidence-map` when appropriate.

## Delivery standard

Before delivery, confirm:

- every slide has one clear claim and a visible hierarchy;
- the narrative works without speaker notes;
- no text or object overflows its intended region;
- repeated patterns are purposeful, not accidental;
- charts and tables are legible at presentation distance;
- the final PPTX opens, remains editable, and has passed preview plus final render QA where the required renderers are available.

If a requested feature cannot be represented natively by the installed adapter, say so explicitly and preserve the editable parts instead of silently flattening the slide.

The included code adapts bounded parts of two MIT-licensed upstream projects; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Their full engines, style libraries, and assets are not installed by this skill.
