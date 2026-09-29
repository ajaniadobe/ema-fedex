/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-quick-actions. Base: cards. Source: https://www.fedex.com/en-us/home.html
 * Structure (blocks/cards-quick-actions/README.md):
 *   Rows 1..n: 2 columns [icon] [label link]
 *   Final row: 1 cell "Tracking number" hint + "Track" link to https://www.fedex.com/fedextrack/
 * Selectors validated against migration-work/block-context/cards-quick-actions/source.html:
 *   homepage-b-link (custom element wrapping each <a>), fdx-icon > img (data-URI SVG with
 *   <use xlink:href="#sprite-id">), span.hide-on-mobile (desktop label), form.homepage-b-links__track.
 * Icons are sprite references (not standalone SVGs), so they are authored as :icon-name:
 * notation derived from the sprite symbol id (e.g. #brand_rates_s -> :rates:).
 */
const TRACK_URL = 'https://www.fedex.com/fedextrack/';

function spriteIdFromIcon(item) {
  // Inline SVG (live DOM variant)
  const use = item.querySelector('svg use');
  if (use) {
    const href = use.getAttribute('xlink:href') || use.getAttribute('href') || '';
    if (href) return href.replace(/^.*#/, '');
  }
  // Data-URI SVG image (cleaned DOM variant)
  const img = item.querySelector('fdx-icon img, img');
  const src = img ? (img.getAttribute('src') || '') : '';
  if (src.startsWith('data:image/svg+xml')) {
    let svg = '';
    try {
      const [, payload = ''] = src.split(',');
      svg = src.includes(';base64,') ? atob(payload) : decodeURIComponent(payload);
    } catch (e) { svg = ''; }
    const m = svg.match(/href="#([^"]+)"/);
    if (m) return m[1];
  }
  return '';
}

function iconName(spriteId, label) {
  let name = (spriteId || '')
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/^brand-/, '')
    .replace(/-s$/, '');
  if (!name) name = (label || '').toLowerCase().trim().split(/\s+/).pop() || '';
  return name.replace(/[^a-z0-9-]/g, '');
}

function labelText(anchor) {
  const desktop = anchor.querySelector('.hide-on-mobile');
  const source = desktop || anchor.querySelector('span') || anchor;
  const clone = source.cloneNode(true);
  clone.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  // Iterate the custom-element wrappers (block-level), fall back to the anchors.
  let anchors = [...element.querySelectorAll('homepage-b-link')]
    .map((item) => item.querySelector('a[href]'))
    .filter(Boolean);
  if (!anchors.length) {
    anchors = [...element.querySelectorAll('.homepage-b-links__links a[href]')];
  }

  const cells = [];
  anchors.forEach((anchor) => {
    const label = labelText(anchor);
    const name = iconName(spriteIdFromIcon(anchor), label);
    const iconCell = name ? `:${name}:` : '';
    const link = document.createElement('a');
    link.href = anchor.getAttribute('href');
    link.textContent = label;
    cells.push([iconCell, link]);
  });

  // Final Track row
  const form = element.querySelector('form.homepage-b-links__track, form');
  if (form || anchors.length) {
    const input = form?.querySelector('input');
    const button = form?.querySelector('button');
    const hint = document.createElement('p');
    hint.textContent = (input?.getAttribute('placeholder') || input?.getAttribute('aria-label') || '').trim() || 'Tracking number';
    const trackP = document.createElement('p');
    const track = document.createElement('a');
    track.href = TRACK_URL;
    track.textContent = (button?.textContent || '').trim() || 'Track';
    trackP.append(track);
    cells.push([[hint, trackP]]);
  }

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-quick-actions', cells });
  element.replaceWith(block);
}
