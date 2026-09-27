// Adapted from alfonsograziano/pptx-gen src/design.ts (MIT); see THIRD_PARTY_NOTICES.md.
// A deck's semantic design tokens are resolved once, before any slide is rendered.
const DEFAULTS = Object.freeze({
  colors: Object.freeze({
    ink: '#172033',
    accent: '#175CD3',
    paper: '#FFFFFF',
    surface: '#F3F6FA',
    muted: '#475467',
    line: '#D0D5DD',
    inkSoft: '#243047',
    accentOnDark: '#84CAFF',
  }),
  fonts: Object.freeze({ sans: 'Arial', serif: 'Georgia', mono: 'Courier New' }),
  layout: Object.freeze({ width: 13.333, height: 7.5, margin: 0.7, gutter: 0.28 }),
  type: Object.freeze({ title: 34, hero: 42, body: 20, label: 16, metric: 38, footnote: 12 }),
});

const HEX = /^#[0-9a-fA-F]{6}$/;

export function resolveDesign(theme = {}) {
  if (!theme || typeof theme !== 'object' || Array.isArray(theme)) throw new Error('theme must be an object');
  const legacyFonts = theme.fontFamily ? { sans: theme.fontFamily } : {};
  const design = {
    colors: { ...DEFAULTS.colors, ...theme.colors },
    fonts: { ...DEFAULTS.fonts, ...legacyFonts, ...theme.fonts },
    layout: { ...DEFAULTS.layout, ...theme.layout },
    type: { ...DEFAULTS.type, ...theme.type },
  };
  for (const [name, value] of Object.entries(design.colors)) {
    if (!HEX.test(value)) throw new Error(`theme.colors.${name} must be #RRGGBB`);
  }
  for (const [name, value] of Object.entries(design.fonts)) {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`theme.fonts.${name} must be a font family`);
  }
  for (const group of ['layout', 'type']) {
    for (const [name, value] of Object.entries(design[group])) {
      if (!Number.isFinite(value) || value <= 0) throw new Error(`theme.${group}.${name} must be positive`);
    }
  }
  if (Math.abs(design.layout.width / design.layout.height - 16 / 9) > 0.015) {
    throw new Error('This renderer requires a 16:9 canvas');
  }
  return Object.freeze(Object.fromEntries(Object.entries(design).map(([key, value]) => [key, Object.freeze(value)])));
}

export function contrastRatio(a, b) {
  const luminance = (hex) => {
    const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
    const linear = channels.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
