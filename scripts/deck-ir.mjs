import { resolveDesign, contrastRatio } from './design-system.mjs';
import { SUPPORTED_LAYOUTS, SUPPORTED_VARIANTS } from './layout-contracts.mjs';

const ROLES = new Set(['title', 'context', 'argument', 'evidence', 'comparison', 'process', 'decision', 'appendix']);
const TYPES = new Set(['text', 'table', 'chart', 'image', 'comparison', 'timeline', 'bullets', 'system', 'evidence', 'phases', 'capabilities']);
const TEXT_STYLES = new Set(['title', 'body', 'label', 'metric', 'quote', 'attribution', 'action']);

export function validateDeck(deck) {
  const errors = [];
  const need = (value, path) => { if (value === undefined || value === null || value === '') errors.push(`${path} is required`); };
  if (!deck || typeof deck !== 'object' || Array.isArray(deck)) return ['deck must be an object'];
  need(deck.schemaVersion, 'schemaVersion');
  need(deck.meta?.title, 'meta.title');
  need(deck.meta?.audience, 'meta.audience');
  if (!Array.isArray(deck.slides) || !deck.slides.length) errors.push('slides must be a non-empty array');
  const sourceIds = new Set();
  if (deck.sources !== undefined && !Array.isArray(deck.sources)) errors.push('sources must be an array');
  for (const [index, source] of (Array.isArray(deck.sources) ? deck.sources : []).entries()) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) { errors.push(`sources[${index}] must be an object`); continue; }
    need(source.id, `sources[${index}].id`);
    if (sourceIds.has(source.id)) errors.push(`sources[${index}].id must be unique`);
    sourceIds.add(source.id);
    need(source.label, `sources[${index}].label`);
    if (source.url !== undefined && typeof source.url !== 'string') errors.push(`sources[${index}].url must be a string`);
  }

  let design;
  try {
    design = resolveDesign(deck.theme);
  } catch (error) {
    errors.push(error.message);
  }
  if (design) {
    if (contrastRatio(design.colors.ink, design.colors.paper) < 4.5) errors.push('theme.colors.ink lacks text contrast against paper');
    if (contrastRatio(design.colors.muted, design.colors.paper) < 4.5) errors.push('theme.colors.muted lacks text contrast against paper');
    if (contrastRatio(design.colors.accent, design.colors.paper) < 3) errors.push('theme.colors.accent lacks essential-graphic contrast against paper');
  }

  const ids = new Set();
  const slides = Array.isArray(deck.slides) ? deck.slides : [];
  for (const [index, slide] of slides.entries()) {
    const path = `slides[${index}]`;
    if (!slide || typeof slide !== 'object' || Array.isArray(slide)) { errors.push(`${path} must be an object`); continue; }
    need(slide.id, `${path}.id`);
    if (ids.has(slide.id)) errors.push(`${path}.id must be unique`);
    ids.add(slide.id);
    need(slide.claim, `${path}.claim`);
    if (typeof slide.claim === 'string' && slide.claim.length > 220) errors.push(`${path}.claim is too long`);
    if (!ROLES.has(slide.role)) errors.push(`${path}.role is unsupported`);
    if (slide.eyebrow !== undefined && (typeof slide.eyebrow !== 'string' || !slide.eyebrow.trim() || slide.eyebrow.length > 60)) {
      errors.push(`${path}.eyebrow must be a short, non-empty reader-facing label`);
    }
    if (slide.evidenceRefs !== undefined && !Array.isArray(slide.evidenceRefs)) errors.push(`${path}.evidenceRefs must be an array`);
    for (const [factIndex, fact] of (Array.isArray(slide.evidenceRefs) ? slide.evidenceRefs : []).entries()) {
      const fp = `${path}.evidenceRefs[${factIndex}]`;
      need(fact?.claim, `${fp}.claim`);
      if (!Array.isArray(fact?.sourceIds) || !fact.sourceIds.length) errors.push(`${fp}.sourceIds must cite at least one source`);
      else for (const sourceId of fact.sourceIds) if (!sourceIds.has(sourceId)) errors.push(`${fp} refers to unknown source id ${sourceId}`);
      if (fact?.values !== undefined && (!Array.isArray(fact.values) || fact.values.some((value) => typeof value !== 'string' && !Number.isFinite(value)))) {
        errors.push(`${fp}.values must contain only strings or finite numbers`);
      }
    }
    if (slide.templateSlide !== undefined) {
      if (!deck.template?.source) errors.push(`${path}.templateSlide needs template.source`);
      if (!Number.isInteger(slide.templateSlide) || slide.templateSlide < 1) errors.push(`${path}.templateSlide must be a 1-based integer`);
      if (!slide.fields || typeof slide.fields !== 'object' || Array.isArray(slide.fields) || !Object.keys(slide.fields).length) {
        if (!slide.shapeFields || typeof slide.shapeFields !== 'object' || Array.isArray(slide.shapeFields) || !Object.keys(slide.shapeFields).length) {
          errors.push(`${path} needs fields or shapeFields for template editing`);
        }
      } else {
        for (const [key, value] of Object.entries(slide.fields)) {
          if (!key.trim() || typeof value !== 'string' || !value.trim()) errors.push(`${path}.fields values must be non-empty strings`);
        }
      }
      for (const [name, binding] of Object.entries(slide.shapeFields ?? {})) {
        if (!name.trim() || !binding || !Number.isSafeInteger(binding.shapeId) || binding.shapeId < 1
          || typeof binding.value !== 'string' || !binding.value.trim()) {
          errors.push(`${path}.shapeFields.${name} needs a positive shapeId and non-empty value`);
        }
      }
      if (slide.layout || slide.elements) errors.push(`${path} template slides cannot also declare layout/elements`);
      continue;
    }
    if (!SUPPORTED_LAYOUTS.includes(slide.layout)) errors.push(`${path}.layout is unsupported`);
    if (slide.variant && !SUPPORTED_VARIANTS.includes(slide.variant)) errors.push(`${path}.variant is unsupported`);
    if (!Array.isArray(slide.elements) || !slide.elements.length) errors.push(`${path}.elements must be non-empty`);
    const elements = Array.isArray(slide.elements) ? slide.elements : [];
    for (const [j, element] of elements.entries()) {
      const ep = `${path}.elements[${j}]`;
      if (!element || typeof element !== 'object' || Array.isArray(element)) { errors.push(`${ep} must be an object`); continue; }
      if (!TYPES.has(element.type)) { errors.push(`${ep}.type is unsupported`); continue; }
      if (element.type === 'text') {
        need(element.text, `${ep}.text`);
        if (!TEXT_STYLES.has(element.style)) errors.push(`${ep}.style is unsupported`);
        if (typeof element.text === 'string' && element.style === 'title' && element.text.length > 105) errors.push(`${ep}.text is too long for a slide title`);
      }
      if (element.type === 'table') {
        if (!Array.isArray(element.columns) || !element.columns.length || !Array.isArray(element.rows) || !element.rows.length) {
          errors.push(`${ep} needs non-empty columns and rows`);
        } else if (element.rows.some((row) => !Array.isArray(row) || row.length !== element.columns.length)) {
          errors.push(`${ep} rows must match column count`);
        }
      }
      if (element.type === 'chart') {
        if (!['bar', 'column', 'line', 'doughnut'].includes(element.chartType)
          || !Array.isArray(element.categories) || !element.categories.length
          || !Array.isArray(element.series) || !element.series.length) {
          errors.push(`${ep} needs a supported chartType, categories, and series`);
        } else if (element.series.some((series) => !series.name || !Array.isArray(series.values)
          || series.values.length !== element.categories.length || series.values.some((v) => !Number.isFinite(v)))) {
          errors.push(`${ep} series must contain numeric values for every category`);
        }
      }
      if (element.type === 'image') {
        need(element.src, `${ep}.src`);
        if (!['photo', 'illustration', 'texture'].includes(element.role)) errors.push(`${ep}.role must be photo, illustration, or texture`);
      }
      if (element.type === 'comparison') {
        for (const side of ['left', 'right']) {
          need(element[side]?.heading, `${ep}.${side}.heading`);
          need(element[side]?.body, `${ep}.${side}.body`);
        }
      }
      if (element.type === 'timeline') {
        if (!Array.isArray(element.steps) || element.steps.length < 3 || element.steps.length > 5) errors.push(`${ep}.steps needs 3–5 entries`);
        if (!['time', 'ordered'].includes(element.relation)) errors.push(`${ep}.relation must be time or ordered; parallel capabilities belong in system-map`);
        for (const [k, step] of (element.steps ?? []).entries()) {
          need(step.label, `${ep}.steps[${k}].label`);
          need(step.detail, `${ep}.steps[${k}].detail`);
        }
      }
      if (element.type === 'bullets') {
        if (!Array.isArray(element.items) || element.items.length < 2 || element.items.length > 5
          || element.items.some((value) => typeof value !== 'string' || !value.trim() || value.length > 150)) {
          errors.push(`${ep}.items needs 2–5 concise strings`);
        }
      }
      if (element.type === 'system') {
        need(element.core?.label, `${ep}.core.label`);
        need(element.core?.detail, `${ep}.core.detail`);
        if (!Array.isArray(element.nodes) || element.nodes.length !== 4) errors.push(`${ep}.system needs exactly four surrounding nodes`);
        for (const [k, node] of (element.nodes ?? []).entries()) {
          need(node?.label, `${ep}.nodes[${k}].label`);
          need(node?.detail, `${ep}.nodes[${k}].detail`);
        }
      }
      if (element.type === 'evidence') {
        if (!Array.isArray(element.areas) || element.areas.length < 3 || element.areas.length > 4) errors.push(`${ep}.evidence needs 3–4 areas`);
        for (const [k, area] of (element.areas ?? []).entries()) {
          need(area?.label, `${ep}.areas[${k}].label`);
          need(area?.detail, `${ep}.areas[${k}].detail`);
        }
        need(element.takeaway, `${ep}.takeaway`);
        need(element.source, `${ep}.source`);
      }
      if (element.type === 'phases') {
        if (!Array.isArray(element.steps) || element.steps.length < 3 || element.steps.length > 4) errors.push(`${ep}.phases needs 3–4 steps`);
        for (const [k, step] of (element.steps ?? []).entries()) {
          need(step?.label, `${ep}.steps[${k}].label`);
          need(step?.detail, `${ep}.steps[${k}].detail`);
          need(step?.gate, `${ep}.steps[${k}].gate`);
        }
      }
      if (element.type === 'capabilities') {
        need(element.spine?.label, `${ep}.spine.label`);
        need(element.spine?.detail, `${ep}.spine.detail`);
        if (!Array.isArray(element.layers) || element.layers.length !== 4) errors.push(`${ep}.capabilities needs exactly four layers`);
        for (const [k, layer] of (element.layers ?? []).entries()) {
          need(layer?.label, `${ep}.layers[${k}].label`);
          need(layer?.detail, `${ep}.layers[${k}].detail`);
        }
      }
    }
    const first = (type, style) => elements.find((e) => e && e.type === type && (!style || e.style === style));
    if (!first('text', 'title')) errors.push(`${path} needs a title text element`);
    const required = {
      proof: [['chart']], comparison: [['comparison']],
      timeline: [['timeline']], matrix: [['table']], quote: [['text', 'quote'], ['text', 'attribution']], close: [['text', 'action']],
      'system-map': [['system']], 'evidence-map': [['evidence']], 'phased-plan': [['phases']],
      'capability-stack': [['capabilities']],
    }[slide.layout] ?? [];
    for (const [type, style] of required) if (!first(type, style)) errors.push(`${path} needs ${style ?? type} for ${slide.layout}`);
    if (slide.layout === 'split') {
      if (Number(Boolean(first('text', 'body'))) + Number(Boolean(first('bullets'))) !== 1) {
        errors.push(`${path} split needs exactly one body paragraph or native bullet list`);
      }
      const visualCount = elements.filter((e) => e && (['chart', 'table', 'image'].includes(e.type) || (e.type === 'text' && e.style === 'metric'))).length;
      if (visualCount !== 1) errors.push(`${path} split needs exactly one chart, table, image, or metric`);
      if (first('text', 'metric') && !first('text', 'label')) errors.push(`${path} split metric needs a contextual label`);
    }
    const allowedForLayout = {
      hero: new Set(['text']), split: new Set(['text', 'bullets', 'chart', 'table', 'image']), proof: new Set(['text', 'chart']),
      comparison: new Set(['text', 'comparison']), timeline: new Set(['text', 'timeline']),
      matrix: new Set(['text', 'table']), quote: new Set(['text']), close: new Set(['text']),
      'system-map': new Set(['text', 'system']), 'evidence-map': new Set(['text', 'evidence']), 'phased-plan': new Set(['text', 'phases']),
      'capability-stack': new Set(['text', 'capabilities']),
    }[slide.layout];
    if (allowedForLayout) for (const e of elements) if (e && !allowedForLayout.has(e.type)) errors.push(`${path} ${e.type} is not rendered by ${slide.layout}`);
    const allowedStyles = {
      hero: ['title', 'body'], split: ['title', 'body', 'metric', 'label'], proof: ['title', 'body'],
      comparison: ['title'], timeline: ['title'], matrix: ['title'],
      quote: ['title', 'quote', 'attribution'], close: ['title', 'action'],
      'system-map': ['title'], 'evidence-map': ['title'], 'phased-plan': ['title'],
      'capability-stack': ['title'],
    }[slide.layout];
    if (allowedStyles) for (const e of elements) {
      if (e?.type === 'text' && !allowedStyles.includes(e.style)) errors.push(`${path} text style ${e.style} is not rendered by ${slide.layout}`);
    }
  }
  return errors;
}
