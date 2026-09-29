export default function init(el) {
  const ul = document.createElement('ul');
  ul.className = 'cards-services-list';
  [...el.querySelectorAll(':scope > div')].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-services-card';
    [...row.children].forEach((cell) => {
      const imageOnly = cell.querySelector('picture') && !cell.textContent.trim();
      cell.className = imageOnly ? 'cards-services-image' : 'cards-services-body';
      li.append(cell);
    });
    ul.append(li);
  });
  el.replaceChildren(ul);
}
