/*
 * Header block: builds the site header from the authored nav fragment (nav.plain.html).
 *
 * Fragment contract (flat, semantic):
 *   section 1: brand link (logo image)
 *   section 2: primary nav list - <li><p>Label</p><ul>…links…</ul></li> becomes a click dropdown
 *   section 3: tools list - dropdowns as above, plus a search item:
 *              <li><p><a href="…?q=">Search</a></p><p>placeholder</p></li>
 * Inside dropdowns:
 *   <strong><a></a></strong>              -> emphasized "all services" link
 *   <li><p>Label</p><p><em><a href="…=">Submit</a></em></p></li> -> inline input form
 *   <li><p>text with <a>link</a></p></li> -> note paragraph
 */

const NAV_PATHS = ['/content/nav.plain.html', '/nav.plain.html'];
const DESKTOP = window.matchMedia('(width >= 900px)');

async function fetchNav() {
  for (const path of NAV_PATHS) {
    // metadata-independent: /content first (local preview), then site root (DA/EDS)
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(path);
    if (resp.ok) {
      const wrapper = document.createElement('div');
      // eslint-disable-next-line no-await-in-loop
      wrapper.innerHTML = await resp.text();
      // relative media paths in the fragment resolve against the fragment, not the page
      wrapper.querySelectorAll('img[src]').forEach((img) => {
        img.src = new URL(img.getAttribute('src'), resp.url).href;
      });
      return wrapper;
    }
  }
  return null;
}

function closeAll(header) {
  header.querySelectorAll('.nav-item.is-open').forEach((item) => {
    item.classList.remove('is-open');
    item.querySelector(':scope > .nav-trigger')?.setAttribute('aria-expanded', 'false');
  });
  header.classList.remove('is-dropdown-open');
}

function toggleItem(header, item) {
  const wasOpen = item.classList.contains('is-open');
  closeAll(header);
  if (wasOpen) return;
  item.classList.add('is-open');
  item.querySelector(':scope > .nav-trigger').setAttribute('aria-expanded', 'true');
  header.classList.add('is-dropdown-open');
}

// <li><p>Label</p><p><em><a href="…=">Submit</a></em></p></li> -> label + input + submit button
function buildInputForm(li, id) {
  const [labelP, submitP] = li.querySelectorAll(':scope > p');
  const link = submitP.querySelector('a');
  const form = document.createElement('form');
  form.className = 'nav-panel-form';
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelP.textContent.trim();
  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.name = id;
  input.placeholder = label.textContent;
  input.autocomplete = 'off';
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = link.textContent.trim();
  form.append(label, input, button);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) {
      input.focus();
      return;
    }
    window.location.href = `${link.href}${encodeURIComponent(value)}`;
  });
  li.replaceChildren(form);
  li.classList.add('nav-panel-form-item');
}

function decoratePanelItems(list, prefix) {
  [...list.children].forEach((li, idx) => {
    const paragraphs = li.querySelectorAll(':scope > p');
    if (paragraphs.length === 2 && paragraphs[1].querySelector('em > a')) {
      buildInputForm(li, `${prefix}-input-${idx}`);
    } else if (li.querySelector(':scope > strong > a')) {
      li.classList.add('nav-panel-strong');
    } else if (paragraphs.length === 1) {
      li.classList.add('nav-panel-note');
    }
  });
}

let panelId = 0;

// <li><p>Label</p><ul>…</ul></li> -> trigger button + dropdown panel
function decorateDropdown(li, header) {
  const labelP = li.querySelector(':scope > p');
  const list = li.querySelector(':scope > ul');
  if (!labelP || !list) return;
  panelId += 1;
  const id = `nav-panel-${panelId}`;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', id);
  const text = document.createElement('span');
  text.className = 'nav-trigger-text';
  text.textContent = labelP.textContent.trim();
  trigger.append(text);
  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  panel.id = id;
  const inner = document.createElement('div');
  inner.className = 'nav-panel-inner';
  list.classList.add('nav-panel-list');
  decoratePanelItems(list, id);
  inner.append(list);
  panel.append(inner);
  li.classList.add('nav-item');
  li.replaceChildren(trigger, panel);
  trigger.addEventListener('click', () => toggleItem(header, li));
}

// <li><p><a href="…?q=">Search</a></p><p>placeholder</p></li> -> icon toggle + search bar
function decorateSearch(li, header, bar) {
  const link = li.querySelector('a');
  const placeholder = li.querySelectorAll(':scope > p')[1]?.textContent.trim() || '';
  const label = link.textContent.trim();

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-search-toggle';
  toggle.setAttribute('aria-label', label);
  toggle.setAttribute('aria-expanded', 'false');

  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder || label);
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', label);
  const field = document.createElement('div');
  field.className = 'nav-search-field';
  field.append(input, submit);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-search-close';
  close.setAttribute('aria-label', `Exit ${label}`);
  form.append(field, close);

  const setOpen = (open) => {
    header.classList.toggle('is-search-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      closeAll(header);
      input.focus();
    } else {
      toggle.focus();
    }
  };
  toggle.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) {
      input.focus();
      return;
    }
    window.location.href = `${link.href}${encodeURIComponent(q)}`;
  });
  form.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  li.classList.add('nav-search-item');
  li.replaceChildren(toggle);
  bar.append(form);
}

function decorateList(list, header, bar) {
  [...list.children].forEach((li) => {
    if (li.querySelector(':scope > ul')) decorateDropdown(li, header);
    else if (li.querySelectorAll(':scope > p').length === 2 && li.querySelector(':scope > p > a')) {
      decorateSearch(li, header, bar);
    }
  });
}

// authored "#main" link in the brand section becomes the skip link
function decorateSkipLink(header, brand) {
  const skip = brand?.querySelector('a[href^="#"]');
  const main = document.querySelector('main');
  if (!skip || !main) return;
  if (!main.id) main.id = skip.hash.slice(1) || 'main';
  skip.href = `#${main.id}`;
  skip.className = 'skip-link';
  skip.closest('p')?.remove();
  header.prepend(skip);
}

/**
 * loads and decorates the header
 * @param {Element} el The header element
 */
export default async function init(el) {
  const fragment = await fetchNav();
  if (!fragment) return;
  const [brand, sections, tools] = fragment.querySelectorAll(':scope > div');

  const bar = document.createElement('div');
  bar.className = 'nav-bar';
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Main');

  if (brand) {
    brand.className = 'nav-brand';
    bar.append(brand);
  }
  [sections, tools].forEach((section, idx) => {
    const list = section?.querySelector(':scope > ul');
    if (!list) return;
    list.className = `nav-list ${idx === 0 ? 'nav-sections' : 'nav-tools'}`;
    decorateList(list, el, bar);
    nav.append(list);
  });
  bar.insertBefore(nav, bar.querySelector('.nav-search'));

  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.addEventListener('click', () => closeAll(el));

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(bar);
  el.replaceChildren(wrapper, overlay);
  decorateSkipLink(el, brand);

  document.addEventListener('click', (e) => { if (!el.contains(e.target)) closeAll(el); });
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = el.querySelector('.nav-item.is-open > .nav-trigger');
    closeAll(el);
    open?.focus();
  });
  // Crossing the desktop breakpoint resets any open panel / search state.
  DESKTOP.addEventListener('change', () => {
    closeAll(el);
    el.classList.remove('is-search-open', 'is-menu-open');
  });
}
