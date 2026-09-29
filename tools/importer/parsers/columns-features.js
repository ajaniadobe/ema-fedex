/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-features. Base: columns. Source: https://www.fedex.com/en-us/home.html
 * Structure (blocks/columns-features/README.md): 2 columns, 1 row:
 *   [h2 heading, 4 x (p > strong title + p text), footnote paragraph(s)] [image]
 * Selectors validated against migration-work/block-context/columns-features/source.html:
 *   :scope > .row > .fxg-col (left = text column, right = image column),
 *   h3.fxg-title (heading, authored as h2), .cc-aem-c-richtext > p (feature pairs + footnotes),
 *   .fxg-image-component.fxg-desktop-image img (image; tablet/mobile copies are duplicates).
 * A duplicate footnote richtext hidden on all breakpoints
 * (.fxg-desktop--hide.fxg-tablet--hide.fxg-mobile--hide) is skipped.
 */
function isHiddenEverywhere(el) {
  const hidden = el.closest('.fxg-desktop--hide.fxg-tablet--hide.fxg-mobile--hide');
  return !!hidden;
}

export default function parse(element, { document }) {
  // Do not depend on the .row > .fxg-col wrapper count (it can differ between the live DOM
  // and the html2md pipeline DOM); locate content by component class across the element.
  const textCol = element;

  // Left cell
  const left = [];
  const titleEl = textCol.querySelector('.fxg-title, h1, h2, h3');
  if (titleEl && titleEl.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.innerHTML = titleEl.innerHTML.trim();
    left.push(h2);
  }

  const richtexts = [...textCol.querySelectorAll('.cc-aem-c-richtext')]
    .filter((rt) => !isHiddenEverywhere(rt));
  richtexts.forEach((rt) => {
    [...rt.querySelectorAll(':scope > p')].forEach((p) => {
      if (!p.textContent.trim()) return;
      // Title paragraphs use <b>; author them as <strong>
      p.querySelectorAll('b').forEach((b) => {
        const strong = document.createElement('strong');
        strong.append(...b.childNodes);
        b.replaceWith(strong);
      });
      left.push(p);
    });
  });

  // Right cell - single image (desktop rendition preferred)
  const right = [];
  const img = element.querySelector('.image_v2 .fxg-desktop-image img')
    || element.querySelector('.image_v2 img, .fxg-image-component img')
    || [...element.querySelectorAll('img')].find((i) => !i.closest('.richtext, .cc-aem-c-richtext'))
    || null;
  if (img) right.push(img);

  if (!left.length && !right.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[left, right.length ? right : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-features', cells });
  element.replaceWith(block);
}
