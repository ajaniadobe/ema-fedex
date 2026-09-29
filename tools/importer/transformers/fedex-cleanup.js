/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: FedEx site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (https://www.fedex.com/en-us/home.html).
 *
 * IMPORTANT: parser/section selectors rely on :nth-child() positions of the direct
 * children of the main XF grid
 * (.cmp-container > .experiencefragment:first-child .xf-content-height > .aem-Grid).
 * Anything that is a direct child of that grid (spacers, hidden icon-link table/column
 * controls, mobile featured-offer copy) is therefore removed in afterTransform only,
 * so the indices stay stable while parsers run.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const MAIN_GRID = '.fxg-main-content .cmp-container > .experiencefragment:first-child .xf-content-height > .aem-Grid';

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / widgets / hidden hero content that could leak into block parsing.
    // None of these are direct children of the main XF grid, so nth-child indices are unaffected.
    WebImporter.DOMUtils.remove(element, [
      'fedex-cookie-consent', // <fedex-cookie-consent> inside header
      '#usercentrics-cmp-ui', // <aside id="usercentrics-cmp-ui">
      '#uc-cross-domain-consent-sharing-bridge', // consent iframe
      '.browser-support', // unsupported-browser modal
      '#nuanMessagingFrame', // Nuance chat widget
      '#inqDivResizeCorner',
      '#inqResizeBox',
      '#inqTitleBar',
      '#cubeOnePar-tab', // hidden hero apps (rate/ship, etc.)
      '#cubeThreePar-tab',
      '.homepage-a-hero_caption-overlay', // hero caption overlay text
      '.homepage-a-hero_controls', // hero video play/pause buttons
    ]);

    // Source CTA buttons -> Author Kit button markup (bold = primary/outline, bold+italic = accent/solid).
    // Wraps inside the link's own parent, so main-grid child positions are unaffected.
    element.querySelectorAll('a.fxg-button--transparent, a.fxg-button--orange').forEach((a) => {
      if (a.closest('strong')) return;
      const strong = document.createElement('strong');
      a.replaceWith(strong);
      if (a.classList.contains('fxg-button--orange')) {
        const em = document.createElement('em');
        em.append(a);
        strong.append(em);
      } else {
        strong.append(a);
      }
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome
    WebImporter.DOMUtils.remove(element, [
      'header.fxg-header',
      'footer.fxg-footer',
      '.breadcrumbs_v1',
      'fedex-smart-banner',
      'fedex-alert-header',
      'fedex-alert-footer',
      'fedex-geo-locator',
      '.js-geo-locator',
      '#fedex-abtest-icon-sprite',
    ]);

    // Hidden / duplicate content in the main XF grid (removed after parsing to keep nth-child stable)
    WebImporter.DOMUtils.remove(element, [
      `${MAIN_GRID} > .advanced_table_v1`, // hidden icon-link table
      `${MAIN_GRID} > .column_control_v1.at-element-marker`, // hidden icon-link column_control before features
      `${MAIN_GRID} > .featured_offer_v2 + .column_control_v1`, // mobile-only copy of featured offer
    ]);

    // Spacers and personalization slots
    WebImporter.DOMUtils.remove(element, [
      '.spacer',
      '.personalization-slot',
    ]);

    // Tracking pixels, scripts, embeds and leftover non-content elements
    WebImporter.DOMUtils.remove(element, [
      '[id^="batBeacon"]',
      'iframe',
      'script',
      'noscript',
      'link',
      'style',
      'input',
    ]);

    // Runtime-injected tracking images (blob: URLs, analytics hosts) anywhere in the page
    element.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (src.startsWith('blob:') || /scriptseai\d*\.fedex\.com/.test(src)) {
        (img.closest('picture') || img).remove();
      }
    });

    // Everything outside the main content container is chrome or injected widgets
    const mainContent = element.querySelector('.fxg-main-content');
    if (mainContent) {
      [...element.children].forEach((child) => {
        if (child !== mainContent && !child.contains(mainContent)) child.remove();
      });
    }
  }
}
