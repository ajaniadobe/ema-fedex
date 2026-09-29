/* eslint-disable */
/* global WebImporter */
/**
 * Parser for notification-info. Base: notification (custom). Source: https://www.fedex.com/en-us/home.html
 * Structure (blocks/notification-info/README.md): 1 column, 1 row: paragraph(s) with inline link.
 * Selectors validated against migration-work/block-context/notification-info/source.html:
 *   .fxg-notifications__contents__heading (optional bold heading, empty on home page),
 *   .fxg-notifications__contents .cc-aem-c-richtext p (message paragraphs).
 * The decorative icon (.fxg-notifications__icon) is rendered by block JS and is not authored.
 */
export default function parse(element, { document }) {
  const contents = element.querySelector('.fxg-notifications__contents') || element;
  const cell = [];

  // Optional heading paragraph - only if it has text
  const heading = contents.querySelector('.fxg-notifications__contents__heading');
  if (heading && heading.textContent.trim()) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = heading.textContent.trim();
    p.append(strong);
    cell.push(p);
  }

  // Message paragraphs from the rich text area (fallback: any non-heading paragraph)
  let paragraphs = [...contents.querySelectorAll('.cc-aem-c-richtext p, .richtext p')];
  if (!paragraphs.length) {
    paragraphs = [...contents.querySelectorAll('p')].filter((p) => p !== heading);
  }
  paragraphs = paragraphs.filter((p, i, arr) => arr.indexOf(p) === i && p.textContent.trim());
  cell.push(...paragraphs);

  if (!cell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[cell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'notification-info', cells });
  element.replaceWith(block);
}
