# Slide design and visual QA

Use these defaults for a new deck. A supplied template, brand system, audience, or user instruction takes precedence. A rule is useful only when it improves communication; document an intentional exception in the slide plan.

## What a good slide must do

1. **One job:** the title names the subject or supported takeaway. The slide has one dominant visual or piece of evidence. Subtitles, footer bars, and decorations do not repeat the headline.
2. **Three-second reading order:** the viewer sees the title, the main visual/evidence, then supporting detail. Use size, position, and whitespace before boxes and borders. A grid of equal cards is appropriate only for a real comparison or taxonomy, not as the default composition.
3. **Presentation-distance legibility:** without a template, aim for 28–40 pt titles, 18–24 pt body copy, 14–18 pt diagram labels, and at least 10–12 pt for sources. Shorten or split content before reducing type below these ranges. Check the rendered image at normal slide size, not only zoomed in.
4. **Stable geometry:** align objects to a small set of rails and spacing values. For a new 16:9 slide, keep ordinary content at least 0.5 in from the canvas edge and give framed content at least 0.15 in internal padding. Full-bleed backgrounds are an intentional exception. No unintended clipping, overlap, or overflow beyond a parent panel.
5. **Honest diagrams:** arrows encode direction, sequence, or causality; use grouping, alignment, or enclosure for simultaneous capabilities. Connectors attach to shape boundaries, do not cross labels, and sit behind nodes when appropriate. Every color, badge, and marker has a stable meaning or is removed.
6. **Useful contrast:** aim for at least 4.5:1 for ordinary text and 3:1 for large text and essential diagram lines. Muted footnotes must remain readable in the actual render. Do not rely on color alone for a distinction.
7. **Editable evidence:** data charts, tables, labels, and bullets remain native PPTX objects. Do not replace evidence with decorative boxes or rasterized text.
8. **No internal labels:** `role` and `claim` are planning metadata. Never expose `TITLE`, `ARGUMENT`, `EVIDENCE`, or similar role words as automatic slide chrome. A visible eyebrow must be intentional audience-facing copy.
9. **Relational alignment:** labels belong to the marker, node, or data point they explain. Check both their bounding-box center and the actual paragraph alignment. Grouping alone does not prove visual alignment.
10. **Truthful format:** a timeline must express time or dependency; a conceptual taxonomy must not masquerade as a measured chart. Put a meaningful source and caveat on an evidence slide rather than only in speaker notes.

## Per-slide QA decision

For each slide selected for review, open its actual PNG in the agent's image-viewing tool. A path, an HTML report, or an empty `text-layout-issues.json` is not visual inspection. At normal size answer, briefly:

- **Fit:** any clipped object, line over text, unexpected wrap, panel escape, or insufficient gap?
- **Readability:** can title, key evidence, diagram labels, and caveats be read at presentation distance?
- **Font fidelity:** did LibreOffice substitute the intended typeface or change wrapping, weight, or hierarchy compared with the preview?
- **Meaning:** does the diagram/chart show the relationship claimed by the title and copy? Are arrows and colors semantically correct?
- **Choice:** is this the right visual grammar for the content, or was it selected merely because the template exists?
- **Hierarchy:** one focal point and a clear reading order, without redundant callout bars or unneeded cards?

Record `PASS` or `FIX` with the slide number and one concrete reason. A hard error from text or geometry QA is `FIX`; a clean automated report is not automatically `PASS`. Fix the slide, regenerate its preview, and inspect it again. If the visual decision is uncertain, mark it for human review rather than silently shipping it.

## Incremental review without wasting tokens

- **New deck or first baseline:** preview and visually inspect every slide once. Do a sequence-level pass for pacing and repetition.
- **Local slide edit:** pass only the edited slide number(s) with `--slides`; inspect only those PNGs. Keep previously reviewed slides valid when their content and shared design inputs did not change.
- **Shared theme, master, font, layout helper, slide size, ordering, or global data change:** review every affected slide; if the blast radius is unclear, review all. A change to a common footer does not justify rereading every slide's main content, but its render still needs spot checks on affected layouts.
- **Final delivery:** regenerate the LibreOffice PDF from the current PPTX. Compare and visually inspect the changed slides against their final render. A new deck has no prior baseline, so the final pass covers all slides.

Use a fresh output directory for each selected-preview run. The scripts reject stale PNGs from unselected slides in the same directory. `--slides 3,5-6` is 1-based and accepts individual slide numbers or ranges. The text-layout audit may still compute across the deck internally, but only selected findings and images are returned; the token-heavy visual review stays scoped.

The automated geometry check detects top-level connectors crossing text frames, accidentally visible internal role shapes, and Deckcraft timeline labels whose frame or paragraph is off-center from the marker. It does not understand arbitrary nested groups, panel ownership, clipped first glyphs, or whether a diagram's meaning is correct. The per-slide visual decision is still required. If a title appears to lose a character, compare its rendered PNG with its IR/PPTX text; a clean text-layout JSON is not proof that every glyph painted correctly.
