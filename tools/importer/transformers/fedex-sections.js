/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: FedEx section breaks + Section Metadata.
 * Section selectors come from payload.template.sections (page-templates.json, DOM-verified).
 *
 * Why comment markers instead of inserting <hr> in beforeTransform:
 * FedEx parser/section selectors use :nth-child() on the direct children of the main XF grid
 * (e.g. `.aem-Grid > .title_v1:nth-child(10)`). Inserting an <hr> element in beforeTransform
 * would shift those indices and break parsers that run between the hooks. Comment nodes are
 * not counted by :nth-child/:nth-of-type, survive element.replaceWith() of the section element
 * by a parser, and survive cleanup removals of sibling spacers.
 *
 * Section Metadata placement: a styled section may span several sibling elements (section 3
 * "grey" = features column_control + "Start shipping now" CTA column_control), so its
 * Section Metadata block is placed at the END of the section, i.e. immediately before the
 * next section's break. If there is no following section, it is placed after the section start.
 */
const MARKER_PREFIX = 'excat-section:';
const SHOW_COMMENT = 128; // NodeFilter.SHOW_COMMENT

function querySection(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    if (!sel) continue;
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function findMarkers(root) {
  const doc = root.ownerDocument || document;
  const walker = doc.createTreeWalker(root, SHOW_COMMENT);
  const markers = {};
  let node = walker.nextNode();
  while (node) {
    const text = (node.nodeValue || '').trim();
    if (text.startsWith(MARKER_PREFIX)) markers[text.slice(MARKER_PREFIX.length)] = node;
    node = walker.nextNode();
  }
  return markers;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    // Mark each section start with a comment node (reverse order keeps earlier lookups stable).
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue; // selector did not match on this page - never guess
      sectionEl.before(document.createComment(`${MARKER_PREFIX}${section.id}`));
    }
  }

  if (hookName === 'afterTransform') {
    const markers = findMarkers(element);

    // 1) Section Metadata for styled sections, placed at the end of each section.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      // End of section = start marker of the next section that exists on this page.
      let nextMarker = null;
      for (let j = i + 1; j < sections.length && !nextMarker; j += 1) {
        nextMarker = markers[sections[j].id] || null;
      }

      if (nextMarker) {
        nextMarker.before(metadataBlock);
      } else {
        const anchor = markers[section.id] || querySection(element, section.selector);
        if (!anchor) continue; // nothing to anchor to - skip, never guess
        anchor.after(metadataBlock);
      }
    }

    // 2) Convert markers into section breaks (no break before the first section).
    sections.forEach((section, i) => {
      const marker = markers[section.id];
      if (!marker) return;
      if (i === 0) {
        marker.remove();
      } else {
        marker.replaceWith(document.createElement('hr'));
      }
    });
  }
}
