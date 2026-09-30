import { expect } from '@esm-bundle/chai';
import init from '../../blocks/footer/footer.js';

const FOOTER_HTML = `<div>
  <h2>Our Company</h2>
  <ul><li><a href="/about">About</a></li></ul>
  <ul><li><a href="/blog">Blog</a></li></ul>
  <h2>Policy Center</h2>
  <ul><li><a href="/terms">Terms of Use</a></li></ul>
</div>
<div>
  <p><a href="/?location=home"><img src="images/globe.svg" alt=""> United States</a></p>
  <ul>
    <li><a href="https://www.example.com/en-us/home.html">English</a></li>
    <li><a href="https://www.example.com/es-us/home.html">Español</a></li>
  </ul>
</div>
<div>
  <p>Follow Us</p>
  <ul><li><a href="https://social.example.com/"><img src="images/social.svg" alt="Social"></a></li></ul>
</div>
<div>
  <p>© Example</p>
  <ul><li><a href="/sitemap">Site Map</a></li></ul>
</div>`;

const originalFetch = window.fetch;
const mounted = [];
let requested;

async function mountFooter({ contentOk = true } = {}) {
  requested = [];
  window.fetch = async (path) => {
    requested.push(path);
    const ok = path === '/content/fragments/nav/footer.plain.html' ? contentOk : true;
    return {
      ok,
      url: new URL(path, window.location.origin).href,
      text: async () => FOOTER_HTML,
    };
  };
  const el = document.createElement('footer');
  document.body.append(el);
  mounted.push(el);
  await init(el);
  return el;
}

afterEach(() => {
  window.fetch = originalFetch;
  mounted.splice(0).forEach((el) => el.remove());
});

describe('footer source', () => {
  it('loads /content/fragments/nav/footer.plain.html first', async () => {
    await mountFooter();
    expect(requested).to.deep.equal(['/content/fragments/nav/footer.plain.html']);
  });

  it('falls back to /fragments/nav/footer.plain.html when the content path is missing', async () => {
    await mountFooter({ contentOk: false });
    expect(requested).to.deep.equal(['/content/fragments/nav/footer.plain.html', '/fragments/nav/footer.plain.html']);
  });
});

describe('footer structure', () => {
  it('renders three bands: links, social, copyright', async () => {
    const el = await mountFooter();
    const bands = [...el.children].map((c) => c.className);
    expect(bands).to.deep.equal([
      'footer-band footer-band-primary',
      'footer-band footer-band-social',
      'footer-band footer-copyright',
    ]);
  });

  it('groups lists under each heading as one column', async () => {
    const el = await mountFooter();
    const columns = [...el.querySelectorAll('.footer-column')];
    expect(columns.map((c) => c.querySelector('.footer-column-title').textContent)).to.deep.equal(['Our Company', 'Policy Center']);
    expect(columns[0].querySelectorAll('.footer-column-lists ul').length).to.equal(2);
  });

  it('resolves fragment-relative images against the fragment URL', async () => {
    const el = await mountFooter();
    expect(el.querySelector('.footer-country-icon').src).to.equal(new URL('/content/fragments/nav/images/globe.svg', window.location.origin).href);
  });
});

describe('footer language dropdown', () => {
  it('toggles the language list', async () => {
    const el = await mountFooter();
    const toggle = el.querySelector('.footer-language-toggle');
    expect(toggle.getAttribute('aria-expanded')).to.equal('false');
    expect(document.getElementById(toggle.getAttribute('aria-controls'))).to.exist;
    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).to.equal('true');
    toggle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(toggle.getAttribute('aria-expanded')).to.equal('false');
  });
});
