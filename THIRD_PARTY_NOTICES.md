# Third-party notices

Deckcraft contains adapted source code from the following MIT-licensed projects. The upstream renderers and asset collections are **not** bundled. The adapted code targets `@office-kit/pptx` and remains editable PowerPoint content.

## alfonsograziano/pptx-gen

Source: <https://github.com/alfonsograziano/pptx-gen>

Adapted `src/design.ts` semantic token/default-and-override pattern in `scripts/design-system.mjs`, and the header/card helper structure from `src/custom-slide-helpers.ts` in `scripts/slide-primitives.mjs`. Geometry, API calls, validation, and colors were revised for Deckcraft and Office Kit. No Lucide icons or other upstream assets are included.

MIT License

Copyright (c) 2026 pptx-gen contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## siril9/presentation-skill

Source: <https://github.com/siril9/presentation-skill>

Adapted the normalized `transformSlots` and `absoluteSlot` layout routines from `templates/pptxgenjs/role_layout_contracts.js` in `scripts/layout-contracts.mjs`. The actual contracts are newly authored for Deckcraft's eight Office Kit layouts; the PptxGenJS renderer, style corpus, and preset assets are not included.

MIT License

Copyright (c) 2026 Siril Sengolraj

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
