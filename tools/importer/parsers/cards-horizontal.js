/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-horizontal. Base: cards. Source: https://www.fedex.com/en-us/home.html
 * Structure (blocks/cards-horizontal/README.md): 2 columns per row (1 row per card):
 *   [image] [h3 title, p text, p link]
 *
 * The instance selector (`.aem-Grid > .title_v1:nth-child(19) ~ .column_control_v1`) matches
 * 3 sibling column_control_v1 elements that together form ONE block. Whichever of them is
 * passed in, the parser resolves the whole run of sibling card column_controls (spacers in
 * between are skipped), builds a single block from all of them, replaces the first with the
 * block and replaces the other matched siblings with empty placeholder <div>s. Placeholders
 * (instead of removal) keep the :nth-child positions of the main grid stable. Every group
 * member is flagged as consumed, so later calls for the other siblings are a no-op.
 *
 * Selectors validated against migration-work/block-context/cards-horizontal/source.html:
 *   .image_v2 .fxg-desktop-image img, .title_v1 h4.fxg-title, .cc-aem-c-richtext p,
 *   .button_v1 a.fxg-link.
 */
const CONSUMED = 'data-excat-cards-horizontal';

function isCard(el) {
  return !!el && el.classList.contains('column_control_v1')
    && !!el.querySelector('.image_v2, .fxg-image-component')
    && !!el.querySelector('.title_v1, .fxg-title');
}

function isSkippable(el) {
  return !!el && (el.classList.contains('spacer') || el.classList.contains('personalization-slot'));
}

function prevCard(el) {
  let p = el.previousElementSibling;
  while (p && isSkippable(p)) p = p.previousElementSibling;
  return isCard(p) && !p.hasAttribute(CONSUMED) ? p : null;
}

function nextCard(el) {
  let n = el.nextElementSibling;
  while (n && isSkippable(n)) n = n.nextElementSibling;
  return isCard(n) && !n.hasAttribute(CONSUMED) ? n : null;
}

function buildRow(card, document) {
  const img = card.querySelector('.image_v2 .fxg-desktop-image img')
    || card.querySelector('.image_v2 img, .fxg-image-component img, img');

  const text = [];
  const titleEl = card.querySelector('.title_v1 .fxg-title, .fxg-title, h2, h3, h4, h5');
  if (titleEl && titleEl.textContent.trim()) {
    const h3 = document.createElement('h3');
    h3.innerHTML = titleEl.innerHTML.trim();
    text.push(h3);
  }
  [...card.querySelectorAll('.cc-aem-c-richtext p, .richtext p')]
    .filter((p, i, arr) => arr.indexOf(p) === i && p.textContent.trim())
    .forEach((p) => text.push(p));
  [...card.querySelectorAll('.button_v1 a[href], .fxg-button-link a[href]')]
    .filter((a, i, arr) => arr.indexOf(a) === i)
    .forEach((a) => {
      const p = document.createElement('p');
      p.append(a);
      text.push(p);
    });

  if (!img && !text.length) return null;
  return [img || '', text];
}

export default function parse(element, { document }) {
  // Already consumed as part of an earlier group (or detached): no-op.
  if (element.hasAttribute(CONSUMED) || !element.parentElement) return;

  // Resolve the first card of the run, then collect the run forward.
  let first = element;
  let p = prevCard(first);
  while (p) { first = p; p = prevCard(first); }

  const group = [first];
  let n = nextCard(first);
  while (n) { group.push(n); n = nextCard(n); }

  const cells = group.map((card) => buildRow(card, document)).filter(Boolean);
  group.forEach((card) => card.setAttribute(CONSUMED, ''));

  if (!cells.length) {
    element.removeAttribute(CONSUMED);
    element.replaceWith(...element.childNodes);
    return;
  }

  // Replace consumed siblings with empty placeholders (keeps grid sibling count stable).
  group.slice(1).forEach((card) => {
    const placeholder = document.createElement('div');
    placeholder.setAttribute(CONSUMED, '');
    card.replaceWith(placeholder);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-horizontal', cells });
  if (element === first) {
    element.replaceWith(block);
  } else {
    // Called on a later sibling first: the block goes where the first card was.
    first.replaceWith(block);
  }
}
