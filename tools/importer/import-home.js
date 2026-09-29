/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroVideoParser from './parsers/hero-video.js';
import cardsQuickActionsParser from './parsers/cards-quick-actions.js';
import notificationInfoParser from './parsers/notification-info.js';
import columnsFeaturesParser from './parsers/columns-features.js';
import cardsServicesParser from './parsers/cards-services.js';
import columnsOfferParser from './parsers/columns-offer.js';
import cardsHorizontalParser from './parsers/cards-horizontal.js';

// TRANSFORMER IMPORTS
import fedexCleanupTransformer from './transformers/fedex-cleanup.js';
import fedexSectionsTransformer from './transformers/fedex-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-video': heroVideoParser,
  'cards-quick-actions': cardsQuickActionsParser,
  'notification-info': notificationInfoParser,
  'columns-features': columnsFeaturesParser,
  'cards-services': cardsServicesParser,
  'columns-offer': columnsOfferParser,
  'cards-horizontal': cardsHorizontalParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const G = '.fxg-main-content .cmp-container > .experiencefragment:first-child .xf-content-height > .aem-Grid';
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'FedEx US homepage: video hero with quick actions, info notice, feature columns, service cards, featured offer, horizontal promo cards and legal notes',
  urls: [
    'https://www.fedex.com/en-us/home.html',
  ],
  blocks: [
    { name: 'hero-video', instances: ['.fxg-hero_homepage .fxg-hero__header'] },
    { name: 'cards-quick-actions', instances: ['.fxg-hero_homepage div.homepage-b-links'] },
    { name: 'notification-info', instances: ['.fxg-notifications--theme-informational'] },
    { name: 'columns-features', instances: [`${G} > .column_control_v1:has(.column_control_v1)`] },
    { name: 'cards-services', instances: [`${G} > .title_v1:nth-child(10) ~ .column_control_v1:nth-child(12)`] },
    { name: 'columns-offer', instances: ['.featured_offer_v2'] },
    { name: 'cards-horizontal', instances: [`${G} > .title_v1:nth-child(19) ~ .column_control_v1`] },
  ],
  sections: [
    {
      id: '1',
      name: 'Hero with quick actions',
      selector: ['.hero_homepage_v1'],
      style: null,
      blocks: ['hero-video', 'cards-quick-actions'],
      defaultContent: [],
    },
    {
      id: '2',
      name: 'Informational notice',
      selector: [`${G} > .notifications`],
      style: null,
      blocks: ['notification-info'],
      defaultContent: [],
    },
    {
      id: '3',
      name: 'Why ship with FedEx',
      selector: [`${G} > .column_control_v1:has(.column_control_v1)`],
      style: 'grey',
      blocks: ['columns-features'],
      defaultContent: [`${G} > .column_control_v1:nth-child(8)`],
    },
    {
      id: '4',
      name: 'Delivery that works around you',
      selector: [`${G} > .title_v1:nth-child(10)`],
      style: null,
      blocks: ['cards-services'],
      defaultContent: [`${G} > .title_v1:nth-child(10)`],
    },
    {
      id: '5',
      name: 'Go global with confidence',
      selector: [`${G} > .title_v1:nth-child(14)`],
      style: null,
      blocks: ['columns-offer'],
      defaultContent: [`${G} > .title_v1:nth-child(14)`],
    },
    {
      id: '6',
      name: 'Smarter shipping for growing businesses + legal notes',
      selector: [`${G} > .title_v1:nth-child(19)`],
      style: null,
      blocks: ['cards-horizontal'],
      defaultContent: [
        `${G} > .title_v1:nth-child(19)`,
        '.fxg-main-content .cmp-container > .experiencefragment:nth-child(2)',
      ],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, sections last (section breaks + metadata)
const transformers = [
  fedexCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [fedexSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * All elements are collected before any parser runs, so :nth-child selectors
 * resolve against the unmodified grid.
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup + section markers)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements detached by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path: /en-us/home.html -> /en-us/home (root maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: [...new Set(pageBlocks.map((b) => b.name))],
      },
    }];
  },
};
