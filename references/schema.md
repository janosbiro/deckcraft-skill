# Deck IR schema

The IR is deliberately semantic. A renderer may choose different coordinates, but it must preserve the meaning and editability of the objects.

```json
{
  "schemaVersion": "0.1",
  "meta": { "title": "", "audience": "", "objective": "" },
  "theme": {
    "colors": { "ink": "#172033", "accent": "#175CD3", "paper": "#FFFFFF", "muted": "#475467" },
    "fonts": { "sans": "Arial", "serif": "Georgia" },
    "type": { "title": 34, "body": 20 },
    "layout": { "width": 13.333, "height": 7.5, "margin": 0.7 }
  },
  "template": { "source": null, "reuseMaster": true, "reuseLayouts": true },
  "slides": [
    {
      "id": "slide-01",
      "role": "title | context | argument | evidence | comparison | process | decision | appendix",
      "claim": "One sentence the audience should remember",
      "layout": "hero | split | proof | comparison | timeline | matrix | quote | close | system-map | evidence-map | phased-plan | capability-stack",
      "variant": "primary | alternate | dense (optional)",
      "eyebrow": "Optional reader-facing section label; never the internal role",
      "elements": [
        { "type": "text", "text": "", "style": "title | body | label | metric | quote | attribution | action" },
        { "type": "table", "columns": [], "rows": [] },
        { "type": "chart", "chartType": "bar | column | line | doughnut", "categories": [], "series": [{ "name": "", "values": [] }] },
        { "type": "image", "src": "", "role": "photo | texture | illustration" },
        { "type": "bullets", "items": ["First point", "Second point"] },
        { "type": "comparison", "left": { "heading": "", "body": "" }, "right": { "heading": "", "body": "" } },
        { "type": "timeline", "relation": "time | ordered", "steps": [{ "label": "", "detail": "" }] },
        { "type": "system", "core": { "label": "", "detail": "" }, "nodes": [{ "label": "", "detail": "" }] },
        { "type": "evidence", "areas": [{ "label": "", "detail": "" }], "takeaway": "", "source": "" },
        { "type": "phases", "steps": [{ "label": "", "detail": "", "gate": "" }] },
        { "type": "capabilities", "spine": { "label": "", "detail": "" }, "layers": [{ "label": "", "detail": "" }] }
      ],
      "speakerNotes": ""
    }
  ]
}
```

## Invariants

- `claim` is required and must be shorter than a paragraph.
- Every slide has one primary `layout` and one primary visual job.
- `text`, `table`, and `chart` are semantic native objects in the renderer.
- A table row or chart series carries data; it is not a screenshot.
- `template.reuseMaster` and `template.reuseLayouts` default to true when a source deck exists.
- Images may be raster, but no image may be the only carrier of text or quantitative meaning.
- `bullets` are available in `split` as 2–5 concise items and render as paragraphs inside one native text frame, not as separate textboxes.
- The included renderer accepts all twelve listed layouts; see [layout grammars](layout-grammars.md) for each layout's required elements. `alternate` mirrors layout slots and `dense` expands them slightly; neither changes content semantics.
- `role` and `claim` guide planning but never appear automatically on a slide. Use `eyebrow` only when a deliberate, reader-facing section label adds value.
- `timeline.relation` must be `time` or `ordered`. Parallel parts of a system belong in `system-map`, not a false timeline.
- `system-map` uses exactly four native, grouped satellite nodes around one core. `evidence-map` uses 3–4 qualitative areas, a takeaway, and a visible source. `phased-plan` uses 3–4 actions with explicit exit gates.
- `capability-stack` uses exactly four grouped layers alongside a shared spine for simultaneous reusable capabilities.
- `theme` overrides [semantic design defaults](../scripts/design-system.mjs). `ink` and `muted` must meet 4.5:1 contrast on `paper`; `accent` must meet 3:1. The included renderer requires 16:9 geometry.
- Source-image paths are relative to the IR file. Images are supported on `split` slides only; they may not carry text, charts, or tables.

## Branded template slide mode

When a local PPTX is the visual source of truth, set `template.source` to its path (relative to the IR file) and use this slide form:

```json
{
  "id": "brand-opening",
  "role": "title",
  "claim": "The decision in one sentence",
  "templateSlide": 2,
  "fields": { "headline": "The decision in one sentence", "subtitle": "A short supporting line" }
}
```

This clones source slide 2, substitutes `{{headline}}` and `{{subtitle}}`, and retains its native objects, master, and layout. Missing tokens are errors. A token must be contained in one PowerPoint text run; tokens split across multiple runs need manual placeholder editing via Office Kit. A deck may combine template slides with authored layout slides. Original template slides are removed from the output after the requested copies are built.
