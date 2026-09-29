const isTitle = (node) => node?.tagName === 'P'
  && node.children.length === 1
  && node.firstElementChild.tagName === 'STRONG'
  && node.textContent.trim() === node.firstElementChild.textContent.trim();

const isMedia = (cell) => cell.querySelector('picture')
  && !cell.textContent.trim();

function decorateText(cell) {
  cell.classList.add('columns-features-text');
  const nodes = [...cell.children];
  const first = nodes.findIndex(isTitle);
  if (first < 0) return;
  const grid = document.createElement('div');
  grid.className = 'columns-features-grid';
  const notes = document.createElement('div');
  notes.className = 'columns-features-notes';
  let i = first;
  while (isTitle(nodes[i])) {
    const item = document.createElement('div');
    item.className = 'columns-features-item';
    item.append(nodes[i]);
    if (nodes[i + 1] && !isTitle(nodes[i + 1])) {
      item.append(nodes[i + 1]);
      i += 1;
    }
    grid.append(item);
    i += 1;
  }
  notes.append(...nodes.slice(i));
  if (first > 0) nodes[first - 1].after(grid);
  else cell.prepend(grid);
  if (notes.children.length) grid.after(notes);
}

export default function init(el) {
  const cells = [...el.querySelectorAll(':scope > div > div')];
  el.querySelector(':scope > div')?.classList.add('columns-features-row');
  cells.forEach((cell) => {
    if (isMedia(cell)) cell.classList.add('columns-features-media');
    else decorateText(cell);
  });
}
