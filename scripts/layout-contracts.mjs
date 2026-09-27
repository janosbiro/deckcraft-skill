// transformSlots/absoluteSlot adapted from siril9/presentation-skill
// templates/pptxgenjs/role_layout_contracts.js (MIT); see THIRD_PARTY_NOTICES.md.
// Slots are normalized inside the body area. Role and visual treatment remain separate.
const CONTRACTS = Object.freeze({
  hero: { main: [0, 0.04, 0.91, 0.34], support: [0, 0.52, 0.75, 0.22] },
  split: { left: [0, 0.05, 0.46, 0.83], right: [0.53, 0.05, 0.47, 0.83] },
  proof: { visual: [0, 0.04, 0.72, 0.87], takeaway: [0.76, 0.17, 0.24, 0.55] },
  comparison: { left: [0, 0.04, 0.47, 0.82], right: [0.53, 0.04, 0.47, 0.82] },
  timeline: { track: [0.03, 0.22, 0.94, 0.66] },
  matrix: { table: [0, 0.02, 1, 0.84] },
  quote: { quote: [0.05, 0.14, 0.88, 0.48], source: [0.05, 0.71, 0.7, 0.13] },
  close: { main: [0, 0.08, 0.84, 0.36], action: [0, 0.57, 0.84, 0.22] },
});

export const SUPPORTED_LAYOUTS = Object.freeze(Object.keys(CONTRACTS));
export const SUPPORTED_VARIANTS = Object.freeze(['primary', 'alternate', 'dense']);

export function transformSlots(slots, variant = 'primary') {
  if (!SUPPORTED_VARIANTS.includes(variant)) throw new Error(`Unsupported role layout variant: ${variant}`);
  const out = {};
  for (const [name, raw] of Object.entries(slots)) {
    if (!Array.isArray(raw) || raw.length !== 4) throw new Error(`Invalid slot: ${name}`);
    const [x, y, w, h] = raw.map(Number);
    if (![x, y, w, h].every(Number.isFinite) || x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > 1.000001 || y + h > 1.000001) {
      throw new Error(`Slot ${name} must fit the normalized page`);
    }
    if (variant === 'alternate') {
      out[name] = [Number((1 - x - w).toFixed(6)), y, w, h];
    } else if (variant === 'dense') {
      const left = Math.max(0, x - 0.012);
      const top = Math.max(0, y - 0.018);
      const right = Math.min(1, x + w + 0.012);
      const bottom = Math.min(1, y + h + 0.018);
      out[name] = [left, top, right - left, bottom - top].map((value) => Number(value.toFixed(6)));
    } else {
      out[name] = [x, y, w, h];
    }
  }
  return out;
}

export function absoluteSlot(slots, slotName, bodyBox) {
  const raw = slots[slotName];
  if (!raw) throw new Error(`Unknown layout slot: ${slotName}`);
  const [x, y, w, h] = raw;
  return { x: bodyBox.x + x * bodyBox.w, y: bodyBox.y + y * bodyBox.h, w: w * bodyBox.w, h: h * bodyBox.h };
}

export function layoutSlots(layout, variant = 'primary') {
  const contract = CONTRACTS[layout];
  if (!contract) throw new Error(`Unsupported layout: ${layout}`);
  return transformSlots(contract, variant);
}
