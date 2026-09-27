# Deck IR schema

The IR is deliberately semantic. A renderer may choose different coordinates, but it must preserve the meaning and editability of the objects.

```json
{
  "schemaVersion": "0.1",
  "meta": { "title": "", "audience": "", "objective": "" },
  "theme": { "fontFamily": "Aptos", "colors": { "ink": "#111827", "accent": "#2563EB" } },
  "template": { "source": null, "reuseMaster": true, "reuseLayouts": true },
  "slides": [
    {
      "id": "slide-01",
      "role": "title | context | argument | evidence | comparison | process | decision | appendix",
      "claim": "One sentence the audience should remember",
      "layout": "hero | split | proof | comparison | timeline | matrix | quote | close",
      "elements": [
        { "type": "text", "text": "", "style": "title | body | label | metric" },
        { "type": "table", "columns": [], "rows": [] },
        { "type": "chart", "chartType": "bar | column | line | doughnut", "categories": [], "series": [{ "name": "", "values": [] }] },
        { "type": "image", "src": "", "role": "photo | texture | illustration" }
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
- The included renderer accepts only `hero`, `proof`, and `matrix`; use Office Kit directly for the other grammars.
