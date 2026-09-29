const SVG_NS = 'http://www.w3.org/2000/svg';

// FedEx "information" glyph (32x32), taken from the source notification component.
const INFO_PATH = 'M16 0C7.14771 0 0 7.14771 0 16C0 24.8523 7.14771 32 16 32C24.8523 32 32 24.8523 32 16C32 7.14771 24.8523 0 16 0ZM2 16C2 8.25229 8.25229 2 16 2C23.7477 2 30 8.25229 30 16C30 23.7477 23.7477 30 16 30C8.25229 30 2 23.7477 2 16ZM15 11C16.1046 11 17 10.1046 17 9C17 7.89543 16.1046 7 15 7C13.8954 7 13 7.89543 13 9C13 10.1046 13.8954 11 15 11ZM15 15H13V13H16C16.5523 13 17 13.4477 17 14V22H19V24H17H15H13V22H15V15Z';

function buildIcon() {
  const icon = document.createElement('span');
  icon.className = 'notification-info-icon';
  icon.setAttribute('aria-hidden', 'true');

  // Built with DOM APIs (not innerHTML) so it works under require-trusted-types-for.
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '32');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('fill-rule', 'evenodd');
  path.setAttribute('clip-rule', 'evenodd');
  path.setAttribute('d', INFO_PATH);
  svg.append(path);
  icon.append(svg);
  return icon;
}

export default function init(el) {
  const cells = [...el.querySelectorAll(':scope > div > div')];
  const message = document.createElement('div');
  message.className = 'notification-info-message';
  cells.forEach((cell) => message.append(...cell.childNodes));
  el.setAttribute('role', 'note');
  el.replaceChildren(buildIcon(), message);
}
