const MEDIA = 'picture, img, .icon, svg';
const TOKEN = /^:([a-z0-9-]+):$/i;

// An icon cell is either rendered media (picture / span.icon / svg) or a raw
// `:name:` token (the delivery pipeline converts it to span.icon.icon-name,
// but local previews and some renderers leave the token as plain text).
const iconToken = (cell) => cell.textContent.trim().match(TOKEN)?.[1].toLowerCase();
const isIconCell = (cell) => !cell.querySelector('a[href]')
  && (!!cell.querySelector(MEDIA) || !!iconToken(cell));

function buildIcon(cell, pending) {
  const icon = document.createElement('span');
  icon.className = 'cards-quick-actions-icon';
  icon.setAttribute('aria-hidden', 'true');
  if (!cell) return icon;
  const media = cell.querySelector(MEDIA);
  const name = iconToken(cell)
    || [...(media?.classList || [])].find((c) => c.startsWith('icon-'))?.substring(5);
  if (name) icon.dataset.icon = name;
  if (media) {
    icon.append(media);
  } else if (name) {
    const span = document.createElement('span');
    span.className = `icon icon-${name}`;
    icon.append(span);
    pending.push(span);
  }
  return icon;
}

function buildItem(row, pending) {
  const cells = [...row.children];
  const iconCell = cells.find(isIconCell);
  const labelCell = cells.find((c) => c !== iconCell);
  const link = row.querySelector('a[href]');
  const li = document.createElement('li');
  li.className = 'cards-quick-actions-item';
  const label = document.createElement('span');
  label.className = 'cards-quick-actions-label';
  // Source sets labels on two lines ("Get a / quote"): break before the last word.
  // Kept as spans + a text space so the accessible name stays "Get a quote".
  const words = (link || labelCell || row).textContent.trim().split(/\s+/);
  const tail = words.length > 1 ? words.pop() : null;
  label.append(Object.assign(document.createElement('span'), { textContent: words.join(' ') }));
  if (tail) label.append(' ', Object.assign(document.createElement('span'), { textContent: tail }));
  // Reuse the authored anchor so href localization, title and target survive.
  const target = link || document.createElement('div');
  target.className = 'cards-quick-actions-link';
  target.replaceChildren(buildIcon(iconCell, pending), label);
  li.append(target);
  return li;
}

function buildTracker(row) {
  const link = row.querySelector('a[href]');
  const hint = [...row.querySelectorAll('p')].find((p) => !p.querySelector('a'));
  const placeholder = hint?.textContent.trim() || 'Tracking number';
  const form = document.createElement('form');
  form.className = 'cards-quick-actions-track';
  const input = document.createElement('input');
  input.type = 'text';
  input.name = 'trknbr';
  input.required = true;
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = link?.textContent.trim() || 'Track';
  form.append(input, submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = new URL(link?.href || 'https://www.fedex.com/fedextrack/', window.location.href);
    url.searchParams.set('trknbr', input.value.trim());
    window.location.assign(url);
  });
  return form;
}

export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const list = document.createElement('ul');
  list.className = 'cards-quick-actions-list';
  const pending = [];
  let tracker;
  rows.forEach((row) => {
    const isTracker = row.children.length === 1 && !isIconCell(row.firstElementChild);
    if (isTracker && !tracker) tracker = buildTracker(row);
    else list.append(buildItem(row, pending));
  });
  el.replaceChildren(list);
  if (tracker) el.append(tracker);
  // Icons built from raw tokens were created after ak.js ran loadIcons().
  if (pending.length) {
    const { default: loadIcons } = await import('../../scripts/utils/svg.js');
    loadIcons(pending);
  }
}
