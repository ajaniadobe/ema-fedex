/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-offer. Base: columns. Source: https://www.fedex.com/en-us/home.html
 * Structure (blocks/columns-offer/README.md): 2 columns, 1 row: [h3 title, p text, p link] [image].
 * Selectors validated against migration-work/block-context/columns-offer/source.html:
 *   .fxg-featured-offer__detail (.title_v1 h4.fxg-title, .cc-aem-c-richtext p, .button_v1 a),
 *   .fxg-featured-offer__detail-image img. The placeholder a.fxg-featured-button.hidden ("Link" -> /#)
 *   is skipped.
 * NOTE: fedex-cleanup.js removes the mobile-only duplicate in afterTransform with
 * `.aem-Grid > .featured_offer_v2 + .column_control_v1`. To keep that rule working after this
 * element is replaced, the block table keeps the `featured_offer_v2` class (no siblings are
 * added/removed, so :nth-child positions in the grid stay stable).
 */
export default function parse(element, { document }) {
  const detail = element.querySelector('.fxg-featured-offer__detail') || element;

  const text = [];
  const titleEl = detail.querySelector('.fxg-title, h2, h3, h4, h5');
  if (titleEl && titleEl.textContent.trim()) {
    const h3 = document.createElement('h3');
    h3.innerHTML = titleEl.innerHTML.trim();
    text.push(h3);
  }
  [...detail.querySelectorAll('.cc-aem-c-richtext p, .richtext p')]
    .filter((p, i, arr) => arr.indexOf(p) === i && p.textContent.trim())
    .forEach((p) => text.push(p));

  const links = [...detail.querySelectorAll('.button_v1 a[href], .fxg-button-link a[href]')];
  // Fallback: featured button, only if it is a real (non-hidden, non-placeholder) link
  if (!links.length) {
    const featured = element.querySelector('a.fxg-featured-button');
    const href = featured ? featured.getAttribute('href') || '' : '';
    if (featured && !featured.classList.contains('hidden') && href && href !== '/#' && href !== '#') {
      links.push(featured);
    }
  }
  links.filter((a, i, arr) => arr.indexOf(a) === i).forEach((a) => {
    const p = document.createElement('p');
    p.append(a);
    text.push(p);
  });

  const img = element.querySelector('.fxg-featured-offer__detail-image img')
    || [...element.querySelectorAll('img')].find((i) => !i.closest('.fxg-featured-offer__detail'))
    || null;

  // Source sets a literal alt="null"; clear bogus alt values.
  if (img && /^(null|undefined)$/i.test((img.getAttribute('alt') || '').trim())) {
    img.setAttribute('alt', '');
  }

  if (!text.length && !img) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[text, img || '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-offer', cells });
  // Preserve the source class so the cleanup transformer's sibling selector still matches.
  block.classList.add('featured_offer_v2');
  element.replaceWith(block);
}
