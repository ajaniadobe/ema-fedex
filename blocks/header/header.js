/*
 * Header block: builds the site header from the authored fragment (/fragments/nav/header, or the
 * page's `header-source` metadata; see scripts/utils/site-fragment.js).
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

import fetchSiteFragment from '../../scripts/utils/site-fragment.js';

const DESKTOP = window.matchMedia('(width >= 1024px)');

const fetchNav = () => fetchSiteFragment('header', '/fragments/nav/header');

function setMenuOpen(header, open) {
  header.classList.toggle('is-menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  const btn = header.querySelector('.nav-hamburger');
  if (!btn) return;
  btn.setAttribute('aria-expanded', String(open));
  btn.setAttribute('aria-label', open ? 'Close Menu' : 'Open Menu');
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
  // the mobile account panel and the mobile menu are mutually exclusive
  if (!DESKTOP.matches && item.closest('.nav-tools')) setMenuOpen(header, false);
  item.classList.add('is-open');
  item.querySelector(':scope > .nav-trigger').setAttribute('aria-expanded', 'true');
  header.classList.add('is-dropdown-open');
}

function buildHamburger(header) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-hamburger';
  btn.setAttribute('aria-controls', 'nav-menu');
  const lines = document.createElement('span');
  lines.className = 'nav-hamburger-lines';
  btn.append(lines);
  btn.addEventListener('click', () => {
    const open = !header.classList.contains('is-menu-open');
    closeAll(header);
    setMenuOpen(header, open);
  });
  return btn;
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
  // Escape closes the open search bar wherever focus is (the toggle is hidden while it is open)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('is-search-open')) setOpen(false);
  });

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

// the brand section's text-only link becomes the skip link (the logo link has the image).
// Matched by role, not href: Document Authoring saves an authored "#main" link as "/".
function decorateSkipLink(header, brand) {
  const links = [...(brand?.querySelectorAll('a') || [])];
  const skip = links.find((a) => a.getAttribute('href')?.startsWith('#'))
    || links.find((a) => !a.querySelector('img, picture, svg') && a.textContent.trim());
  const main = document.querySelector('main');
  if (!skip || !main) return;
  if (!main.id) main.id = skip.hash.slice(1) || 'main';
  skip.href = `#${main.id}`;
  skip.className = 'skip-link';
  skip.closest('p')?.remove();
  header.prepend(skip);
}

// Desktop: everything lives in the bar. Mobile: the account list stays in the bar and the
// search + primary nav move into a full-width drawer under it.
function placeForViewport(parts) {
  const {
    bar, nav, sections, tools, search, hamburger, drawer,
  } = parts;
  if (DESKTOP.matches) {
    nav.append(...[sections, tools].filter(Boolean));
    bar.insertBefore(nav, hamburger);
    if (search) bar.insertBefore(search, hamburger);
  } else {
    if (tools) bar.insertBefore(tools, hamburger);
    if (sections) nav.append(sections);
    drawer.append(...[search, nav].filter(Boolean));
  }
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
  const [sectionsList, toolsList] = [sections, tools].map((section, idx) => {
    const list = section?.querySelector(':scope > ul');
    if (!list) return null;
    list.className = `nav-list ${idx === 0 ? 'nav-sections' : 'nav-tools'}`;
    decorateList(list, el, bar);
    return list;
  });
  nav.id = 'nav-menu';
  const hamburger = buildHamburger(el);
  bar.append(hamburger);
  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  const parts = {
    bar, nav, sections: sectionsList, tools: toolsList, search: bar.querySelector('.nav-search'), hamburger, drawer,
  };
  placeForViewport(parts);

  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.addEventListener('click', () => {
    closeAll(el);
    setMenuOpen(el, false);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(bar);
  el.replaceChildren(wrapper, overlay, drawer);
  decorateSkipLink(el, brand);
  setMenuOpen(el, false);

  document.addEventListener('click', (e) => { if (!el.contains(e.target)) closeAll(el); });
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = el.querySelector('.nav-item.is-open > .nav-trigger');
    closeAll(el);
    if (open) {
      open.focus();
    } else if (el.classList.contains('is-menu-open')) {
      setMenuOpen(el, false);
      hamburger.focus();
    }
  });
  // Crossing the desktop breakpoint resets any open panel / search / mobile menu state.
  DESKTOP.addEventListener('change', () => {
    closeAll(el);
    el.classList.remove('is-search-open');
    setMenuOpen(el, false);
    placeForViewport(parts);
  });
}
