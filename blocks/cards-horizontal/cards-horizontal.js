export default function init(el) {
  const ul = document.createElement('ul');
  ul.className = 'cards-horizontal-list';
  [...el.querySelectorAll(':scope > div')].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-horizontal-card';
    [...row.children].forEach((cell) => {
      const imageOnly = cell.querySelector('picture') && !cell.textContent.trim();
      cell.className = imageOnly ? 'cards-horizontal-image' : 'cards-horizontal-body';
      li.append(cell);
    });
    ul.append(li);
  });
  el.replaceChildren(ul);
}
