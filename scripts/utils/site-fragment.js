import { getConfig, getMetadata } from '../ak.js';

async function firstOk([url, ...rest]) {
  if (!url) return null;
  const resp = await fetch(url);
  return resp.ok ? resp : firstOk(rest);
}

// relative media paths in the fragment resolve against the fragment, not the page
function resolveMedia(wrapper, base) {
  wrapper.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), base).href;
  });
  wrapper.querySelectorAll('source[srcset]').forEach((source) => {
    const [url, ...descriptor] = source.getAttribute('srcset').trim().split(/\s+/);
    source.srcset = [new URL(url, base).href, ...descriptor].join(' ');
  });
}

/**
 * Fetches a site-wide fragment (header, footer) as a detached element, or null.
 *
 * Path: the page's `<name>-source` metadata, else `defaultPath`, under the page's locale,
 * falling back to the root locale. Each path is tried under /content first (local preview),
 * then as-is (DA/EDS). Metadata is normalised to a bare path so a value like
 * `/content/fragments/nav/header` can't turn both attempts into the local-only path.
 * @param {string} name metadata prefix, e.g. 'header' reads `header-source`
 * @param {string} defaultPath e.g. '/fragments/nav/header'
 */
export default async function fetchSiteFragment(name, defaultPath) {
  const meta = getMetadata(`${name}-source`);
  const path = (meta ? new URL(meta, window.location.href).pathname : defaultPath)
    .replace(/^\/content(?=\/)/, '')
    .replace(/(\.plain)?\.html$/, '');
  const { prefix } = getConfig().locale;
  const localized = !prefix || path.startsWith(`${prefix}/`) ? path : `${prefix}${path}`;
  const paths = [...new Set([localized, path])];
  const resp = await firstOk(paths.flatMap((p) => [`/content${p}.plain.html`, `${p}.plain.html`]));
  if (!resp) return null;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = await resp.text();
  resolveMedia(wrapper, resp.url);
  return wrapper;
}
