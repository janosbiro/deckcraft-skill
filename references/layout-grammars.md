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

These are implemented, not just prompts. `hero` needs a title (and usually a body); `split` needs one body paragraph or native bullet list plus a chart/table/image/metric; `proof` needs a chart; `comparison` needs a structured left/right comparison; `timeline` needs 3–5 labeled steps; `matrix` needs a native table; `quote` needs quote and attribution text; `close` needs action text. The validator rejects unsupported element/layout combinations rather than silently dropping them. See [the enterprise example](../examples/enterprise-deck.json) for each executable form.

`variant: alternate` mirrors the named visual slots within the body area. This can change physical left/right order but never swaps the semantic labels. `variant: dense` expands slots slightly for legitimate dense evidence; it is not permission to shrink body type or pack more content into a slide. Always inspect the resulting PNG. Prefer `primary` unless the narrative gives a concrete reason to vary it.

## Composition rules

- Vary layout only when the narrative role changes; vary internal emphasis when the role remains the same.
- Establish alignment rails and a spacing scale before placing objects.
- Use contrast for hierarchy: scale, weight, color, and whitespace are stronger than borders and decoration.
- Keep dense evidence slides visually calm; remove labels that do not change the decision.
- A chart should answer a question. If it does not, use a metric, table, or annotation instead.
- Prefer one strong image over a collage of weak images.
