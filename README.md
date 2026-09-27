# Deckcraft

An agent skill for planning, designing, building, and visually checking editable PowerPoint decks. The repository name is `deckcraft-skill`; the skill name is `deckcraft`.

Deckcraft combines narrative and composition guidance with native PPTX authoring via `@office-kit/pptx`, quick visual review via `@office-kit/pptx-preview`, and a final LibreOffice render check. The design approach is inspired by [siril9/presentation-skill](https://github.com/siril9/presentation-skill); this is an independent implementation, not a copy of its code.

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

## Design workflow

1. Form a story spine: audience, decision, tension, proof, and call to action.
2. Give each slide one claim and choose a layout grammar from [references/layout-grammars.md](references/layout-grammars.md).
3. Store the semantic plan in the [deck IR](references/schema.md), then validate it.
4. Author editable text, tables, charts, and grouped diagrams with native PPTX objects. When editing a template, reuse its masters, layouts, and placeholders.
5. Render every slide to PNG, inspect both individual slides and the complete sequence, fix hierarchy, clipping, and repetition, then rerender.
6. Export the final PPTX with LibreOffice, build the side-by-side comparison, and inspect each slide. Report any preview/Office differences or unsupported objects.

The minimal renderer implements `hero`, `proof`, and `matrix` layouts for the sample. Other layout grammars guide the agent's design decisions; they are not all automated by the example script. The preview package is a fast approximation, so final visual QA still matters.

## Repository policy

Only text source and documentation belong in Git. `.gitignore` excludes dependencies, virtual environments, `.env*` files, generated decks, images, PDFs, ZIPs, caches, and build output. Before every push, review `git diff --cached --name-only` and verify the staged file types. Never add binaries with `git add -f`.
