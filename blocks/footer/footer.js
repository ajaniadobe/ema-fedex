/*
 * Footer block: builds the site footer from the authored fragment (footer.plain.html).
 *
 * Fragment contract (flat, semantic):
 *   section 1: link columns - each <h2> starts a column; the lists after it are its sub-columns
 *   section 2: locale - <p><a>country</a></p> + <ul> of language links (current page's first)
 *   section 3: social - <p>label</p> + <ul> of icon links
 *   section 4: copyright - <p>text</p> + <ul> of legal links
 */

async function fetchFooter() {
  // metadata-independent: /content first (local preview), then site root (DA/EDS)
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = await resp.text();
  // relative media paths in the fragment resolve against the fragment, not the page
  wrapper.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return wrapper;
}

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

// <h2> + following <ul>s -> one column with sub-columns
function buildColumns(section) {
  const columns = el('div', 'footer-columns');
  let column;
  [...section.children].forEach((child) => {
    if (/^H\d$/.test(child.tagName)) {
      column = el('div', 'footer-column');
      child.className = 'footer-column-title';
      column.append(child, el('div', 'footer-column-lists'));
      columns.append(column);
    } else if (child.tagName === 'UL' && column) {
      column.querySelector('.footer-column-lists').append(child);
    }
  });
  return columns;
}

// country link + language list -> country link and a language dropdown
function buildLocale(section) {
  const locale = el('div', 'footer-locale');
  const country = section.querySelector(':scope > p > a');
  if (country) {
    country.className = 'footer-country';
    country.querySelector('img')?.classList.add('footer-country-icon');
    locale.append(country);
  }
  const list = section.querySelector(':scope > ul');
  if (!list) return locale;
  const links = [...list.querySelectorAll('a')];
  const lang = document.documentElement.lang?.split('-')[0];
  const current = links.find((a) => a.href.includes(`/${lang}-`)) || links[0];

  const dropdown = el('div', 'footer-language');
  const toggle = el('button', 'footer-language-toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.textContent = current.textContent.trim();
  list.className = 'footer-language-list';
  list.id = 'footer-language-list';
  toggle.setAttribute('aria-controls', list.id);
  current.setAttribute('aria-current', 'true');
  const setOpen = (open) => {
    dropdown.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!dropdown.classList.contains('is-open')));
  dropdown.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    setOpen(false);
    toggle.focus();
  });
  document.addEventListener('click', (e) => { if (!dropdown.contains(e.target)) setOpen(false); });
  dropdown.append(toggle, list);
  locale.append(dropdown);
  return locale;
}

const CHEVRON = 'M1 1l5 5-5 5';

// prev/next buttons that scroll an overflowing row; hidden when there is nothing to scroll to
function addScrollButtons(band, list) {
  const make = (dir) => {
    const btn = el('button', `footer-scroll footer-scroll-${dir}`);
    btn.type = 'button';
    btn.setAttribute('aria-label', dir === 'prev' ? 'Scroll left' : 'Scroll right');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 7 12');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', CHEVRON);
    svg.append(path);
    btn.append(svg);
    btn.addEventListener('click', () => {
      list.scrollBy({ left: (dir === 'prev' ? -1 : 1) * list.clientWidth * 0.75, behavior: 'smooth' });
    });
    return btn;
  };
  const prev = make('prev');
  const next = make('next');
  const update = () => {
    const max = list.scrollWidth - list.clientWidth;
    prev.hidden = list.scrollLeft <= 1;
    next.hidden = max <= 1 || list.scrollLeft >= max - 1;
  };
  list.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(list);
  band.append(prev, next);
  update();
}

function buildLabelledList(section, className) {
  const band = el('div', className);
  const label = section.querySelector(':scope > p');
  const list = section.querySelector(':scope > ul');
  if (label) {
    label.className = `${className}-label`;
    band.append(label);
  }
  if (list) {
    list.className = `${className}-list`;
    band.append(list);
  }
  return band;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer element
 */
export default async function init(block) {
  const fragment = await fetchFooter();
  if (!fragment) return;
  const [links, locale, social, copyright] = fragment.querySelectorAll(':scope > div');

  // three full-width bands (links + locale, social, copyright), each with a centered content column
  const bands = [];
  const primaryBand = el('div', 'footer-band footer-band-primary');
  const primary = el('div', 'footer-primary');
  if (links) primary.append(buildColumns(links));
  if (locale) primary.append(buildLocale(locale));
  primaryBand.append(primary);
  bands.push(primaryBand);
  if (social) {
    const socialBand = el('div', 'footer-band footer-band-social');
    const content = buildLabelledList(social, 'footer-social');
    const list = content.querySelector('.footer-social-list');
    if (list) addScrollButtons(content, list);
    socialBand.append(content);
    bands.push(socialBand);
  }
  if (copyright) {
    const bar = el('div', 'footer-band footer-copyright');
    bar.append(buildLabelledList(copyright, 'footer-copyright-inner'));
    bands.push(bar);
  }
  block.replaceChildren(...bands);
}
