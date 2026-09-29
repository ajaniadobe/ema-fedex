export default function init(el) {
  const row = el.querySelector(':scope > div');
  if (!row) return;
  row.classList.add('columns-offer-row');
  [...row.children].forEach((cell) => {
    const imageOnly = cell.querySelector('picture') && !cell.textContent.trim();
    cell.classList.add(imageOnly ? 'columns-offer-media' : 'columns-offer-text');
  });
}
