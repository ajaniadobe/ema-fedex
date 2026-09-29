import { loadArea, setConfig } from './ak.js';

// Satisfies require-trusted-types-for; runs before loadPage reaches any sink.
if (window.trustedTypes?.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (input) => input,
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

const hostnames = ['authorkit.dev'];

const locales = {
  '': { lang: 'en' },
  '/de': { lang: 'de' },
  '/es': { lang: 'es' },
  '/fr': { lang: 'fr' },
  '/hi': { lang: 'hi' },
  '/ja': { lang: 'ja' },
  '/zh': { lang: 'zh' },
};

const linkBlocks = [
  { fragment: '/fragments/' },
  { schedule: '/schedules/' },
  { youtube: 'https://www.youtube' },
];

// Blocks with self-managed styles
const components = ['fragment', 'schedule'];

// How to decorate an area before loading it
const decorateArea = ({ area = document }) => {
  const eagerLoad = (parent, selector) => {
    const img = parent.querySelector(selector);
    if (!img) return;
    img.removeAttribute('loading');
    img.fetchPriority = 'high';
  };

  eagerLoad(area, 'img');

  // Unprocessed section-metadata tables (raw .plain.html, e.g. local preview) -> section attrs,
  // matching what the delivery pipeline does: "style" becomes classes, other keys data-*.
  area.querySelectorAll(':scope main > div > .section-metadata, :scope > div > .section-metadata').forEach((meta) => {
    const section = meta.parentElement;
    [...meta.children].forEach((row) => {
      const [key, value] = [...row.children].map((cell) => cell.textContent.trim());
      if (!key || !value) return;
      const name = key.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (name === 'style') {
        value.split(',').map((s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))
          .filter(Boolean).forEach((cls) => section.classList.add(cls));
      } else {
        section.dataset[name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())] = value;
      }
    });
    meta.remove();
  });
};

export async function loadPage() {
  setConfig({ hostnames, locales, linkBlocks, components, decorateArea });
  await loadArea();
}
await loadPage();

(function da() {
  const { searchParams } = new URL(window.location.href);
  const hasPreview = searchParams.has('dapreview');
  if (hasPreview) import('../tools/da/da.js').then((mod) => mod.default(loadPage));
  const hasQE = searchParams.has('quick-edit');
  if (hasQE) import('../tools/quick-edit/quick-edit.js').then((mod) => mod.default());
}());
