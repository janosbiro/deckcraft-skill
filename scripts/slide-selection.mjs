export function parseSlidesFlag(args) {
  if (args.length === 0) return undefined;
  if (args.length === 2 && args[0] === '--slides') return args[1];
  if (args.length === 1 && args[0].startsWith('--slides=')) return args[0].slice('--slides='.length);
  throw new Error('Expected only --slides <numbers/ranges>, for example --slides 3,5-6');
}

export function parseSlideSelection(spec, slideCount) {
  if (!Number.isSafeInteger(slideCount) || slideCount < 1) throw new Error('Deck must contain at least one slide');
  if (spec === undefined) return Array.from({ length: slideCount }, (_, index) => index + 1);
  if (!spec || !/^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/.test(spec)) {
    throw new Error('Invalid slide selection; use numbers and ranges such as 3,5-6');
  }
  const selected = new Set();
  for (const part of spec.split(',')) {
    const [start, end = start] = part.split('-').map(Number);
    if (end < start) throw new Error(`Descending slide range: ${part}`);
    if (start < 1 || end > slideCount) throw new Error(`Slide selection out of range: ${part} (deck has ${slideCount})`);
    for (let slide = start; slide <= end; slide++) {
      if (selected.has(slide)) throw new Error(`Duplicate slide in selection: ${slide}`);
      selected.add(slide);
    }
  }
  return [...selected].sort((a, b) => a - b);
}
