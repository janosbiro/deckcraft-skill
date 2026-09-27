# Layout grammars

Choose a grammar by communication job, not by convenience.

| Grammar | Best for | Composition |
|---|---|---|
| `hero` | opening or decisive close | one dominant statement, one visual anchor |
| `split` | argument with supporting proof | asymmetric text/visual split, clear reading order |
| `proof` | metric or evidence | one large metric/chart plus concise interpretation |
| `comparison` | alternatives or before/after | aligned columns with one highlighted difference |
| `timeline` | sequence or roadmap | one horizontal/vertical path with milestone emphasis |
| `matrix` | prioritization | native table or structured grid with restrained labels |
| `quote` | voice of customer or principle | short quote, attribution, contextual visual |
| `close` | decision or call to action | recap, next action, owner, timing |
| `system-map` | simultaneous capabilities or trust boundaries | one core, four grouped surrounding controls |
| `evidence-map` | qualitative taxonomy with sourced implications | 3–4 evidence areas, one takeaway, visible source |
| `phased-plan` | staged rollout with acceptance gates | 3–4 actions, each paired with an exit condition |
| `capability-stack` | reusable platform capabilities | a shared policy spine beside four concurrent layers |

These are implemented, not just prompts. `hero` needs a title (and usually a body); `split` needs one body paragraph or native bullet list plus a chart/table/image/metric; `proof` needs a chart; `comparison` needs a structured left/right comparison; `timeline` needs 3–5 labeled steps with an explicit `relation`; `matrix` needs a native table; `quote` needs quote and attribution text; `close` needs action text. The four new layouts require their matching `system`, `evidence`, `phases`, or `capabilities` element. The validator rejects unsupported element/layout combinations rather than silently dropping them. See [the enterprise example](../examples/enterprise-deck.json) and [the architecture example](../examples/architecture-deck.json).

## Choose by content, not by a fixed slide sequence

- A diagram of concurrent controls, actors, or trust surfaces is `system-map`, even if the brief lists them in order. Use `timeline` only when time passes or one step truly depends on another.
- A common platform supporting several simultaneous functions is `capability-stack`; avoid repeating the same four-spoke map in one short deck.
- A quantitative claim with defensible values is `proof` with a native chart. A conceptual or editorial grouping is `evidence-map`; do not invent numeric bars to make it look like data. The on-slide source must explain the grouping.
- A rollout whose stages have completion criteria is `phased-plan`, not a generic closing statement. Use `close` for an actual decision/ask.
- A meaningful external quotation is `quote`; an unsourced design principle is better expressed as an argument or decision.
- The eight-slide enterprise example demonstrates API coverage, **not** a recommended narrative sequence. Do not force one slide of every layout into a real deck.

`variant: alternate` mirrors the named visual slots within the body area. This can change physical left/right order but never swaps the semantic labels. `variant: dense` expands slots slightly for legitimate dense evidence; it is not permission to shrink body type or pack more content into a slide. Always inspect the resulting PNG. Prefer `primary` unless the narrative gives a concrete reason to vary it.

## Composition rules

- Vary layout when the evidence shape or narrative job changes; `role` alone does not determine layout.
- Establish alignment rails and a spacing scale before placing objects.
- Use contrast for hierarchy: scale, weight, color, and whitespace are stronger than borders and decoration.
- Keep dense evidence slides visually calm; remove labels that do not change the decision.
- A chart should answer a question. If it does not, use a metric, table, or annotation instead.
- Prefer one strong image over a collage of weak images.
