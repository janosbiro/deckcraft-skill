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
2. **Deck IR** — represent slide role, claim, content blocks, visual assets, data, and template intent in JSON or an equivalent typed object. Validate it with `scripts/validate_deck_ir.mjs`. `examples/minimal-deck.json` shows the executable subset.
3. **Design system** — define a small token set for typography, color, spacing, radius, and chart styling. Use one dominant visual idea per slide and vary composition intentionally.
4. **Native authoring** — create or edit PPTX through `@office-kit/pptx`. Prefer template masters/layouts/placeholders when a source deck exists. Keep text, paragraphs, tables, and charts editable.
5. **Preview loop** — render PNG previews with `@office-kit/pptx-preview`. On a new deck, inspect every slide once. After a local edit, use `scripts/render-preview.mjs ... --slides N` and inspect only changed slides; review all affected slides after shared style/template changes. Open each selected PNG in the agent's image tool and record a concise `PASS`/`FIX` decision using the visual QA criteria. Text and geometry findings are signals, not substitutes for seeing the slide.
6. **Final QA** — render the current PPTX with LibreOffice headless using `scripts/qa-libreoffice.mjs`. With Poppler, use `scripts/compare-renders.mjs ... --slides N` for edited slides or omit the flag for a first full-deck check. Inspect selected slide pairs, fix failures, and report unsupported features or renderer differences. The report checks coverage, not visual equivalence automatically.

## Non-negotiable PPTX policies

- Text uses native text frames and paragraph runs; bullets are paragraph properties.
- Tables use native table objects. Charts use native chart objects with data series and labels.
- Reuse existing master/layout/placeholder geometry before inventing new geometry.
- Do not rasterize text, charts, or tables.
- Do not create bullets from separate textboxes.
- Do not ship ungrouped shape soup. Use semantic objects, grouped diagrams, or a deliberate small set of shapes with clear ownership.
- Keep decorative raster assets separate from semantic content so the deck remains editable and accessible.

## Delivery standard

Before delivery, confirm:

- every slide has one clear claim and a visible hierarchy;
- the narrative works without speaker notes;
- no text or object overflows its intended region;
- repeated patterns are purposeful, not accidental;
- charts and tables are legible at presentation distance;
- the final PPTX opens, remains editable, and has passed preview plus final render QA where the required renderers are available.

If a requested feature cannot be represented natively by the installed adapter, say so explicitly and preserve the editable parts instead of silently flattening the slide.
