/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-services. Base: cards. Source: https://www.fedex.com/en-us/home.html
 * Structure (blocks/cards-services/README.md): 2 columns per row (1 row per card):
 *   [image] [h3 title, p text, p link]
 * Selectors validated against migration-work/block-context/cards-services/source.html:
 *   each card = .fxg-col containing .image_v2 (.fxg-desktop-image img), .title_v1 h5.fxg-title,
 *   .richtext .cc-aem-c-richtext p, .button_v1 a.fxg-link.
 * Iteration is keyed on the .title_v1 component (one per card) and paired with its
 * enclosing column, rather than on the column wrappers themselves.
 */
export default function parse(element, { document }) {
  let cards = [...element.querySelectorAll('.title_v1')]
    .map((title) => title.closest('.fxg-col') || title.closest('.aem-Grid') || title.parentElement)
    .filter((c, i, arr) => c && arr.indexOf(c) === i);
  if (!cards.length) {
    cards = [...element.querySelectorAll(':scope > .row > .fxg-col')];
  }

  const cells = [];
  cards.forEach((card) => {
    const img = card.querySelector('.fxg-desktop-image img')
      || card.querySelector('.image_v2 img, .fxg-image-component img, img');

    const text = [];
    const titleEl = card.querySelector('.fxg-title, h2, h3, h4, h5, h6');
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

    if (!img && !text.length) return;
    cells.push([img || '', text]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-services', cells });
  element.replaceWith(block);
}
