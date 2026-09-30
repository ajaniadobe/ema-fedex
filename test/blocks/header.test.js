import { expect } from '@esm-bundle/chai';
import init from '../../blocks/header/header.js';

const NAV_HTML = `<div>
  <p><a href="#main">Skip to main content</a></p>
  <p><a href="https://www.example.com/"><img src="images/logo.png" alt="Logo"></a></p>
</div>
<div>
  <ul>
    <li>
      <p>Shipping</p>
      <ul>
        <li><a href="/ship">Create a Shipment</a></li>
        <li><strong><a href="/shipping">All shipping services</a></strong></li>
      </ul>
    </li>
    <li>
      <p>Tracking</p>
      <ul>
        <li><p>Tracking ID</p><p><em><a href="https://www.example.com/track/?trknbr=">TRACK</a></em></p></li>
        <li><a href="/advanced">Advanced Shipment Tracking</a></li>
      </ul>
    </li>
  </ul>
</div>
<div>
  <ul>
    <li>
      <p>Sign Up or Log In</p>
      <ul><li><p><a href="/open">Open an account</a> to save on shipping.</p></li></ul>
    </li>
    <li><p><a href="https://www.example.com/search?q=">Search</a></p><p>Search or Tracking Numbers</p></li>
  </ul>
</div>`;

const originalFetch = window.fetch;
const mounted = [];
let requested;

async function mountHeader({ contentOk = true } = {}) {
  requested = [];
  window.fetch = async (path) => {
    requested.push(path);
    const ok = path === '/content/nav.plain.html' ? contentOk : true;
    return {
      ok,
      url: new URL(path, window.location.origin).href,
      text: async () => NAV_HTML,
    };
  };
  if (!document.querySelector('main')) document.body.append(document.createElement('main'));
  const el = document.createElement('header');
  document.body.append(el);
  mounted.push(el);
  await init(el);
  return el;
}

afterEach(() => {
  window.fetch = originalFetch;
  document.body.style.overflow = '';
  mounted.splice(0).forEach((el) => el.remove());
});

describe('header nav source', () => {
  it('loads /content/nav.plain.html first', async () => {
    await mountHeader();
    expect(requested).to.deep.equal(['/content/nav.plain.html']);
  });

  it('falls back to /nav.plain.html when the content path is missing', async () => {
    await mountHeader({ contentOk: false });
    expect(requested).to.deep.equal(['/content/nav.plain.html', '/nav.plain.html']);
  });

  it('resolves fragment-relative images against the fragment URL', async () => {
    const el = await mountHeader();
    const img = el.querySelector('.nav-brand img');
    expect(img.src).to.equal(new URL('/content/images/logo.png', window.location.origin).href);
  });
});

describe('header structure', () => {
  it('turns the authored #main link into the skip link', async () => {
    const el = await mountHeader();
    const skip = el.querySelector('.skip-link');
    expect(skip.textContent).to.equal('Skip to main content');
    expect(skip.getAttribute('href')).to.equal(`#${document.querySelector('main').id}`);
  });

  it('builds a button trigger and panel for every dropdown item', async () => {
    const el = await mountHeader();
    const triggers = [...el.querySelectorAll('.nav-trigger')].map((t) => t.textContent);
    expect(triggers).to.deep.equal(['Shipping', 'Tracking', 'Sign Up or Log In']);
    el.querySelectorAll('.nav-trigger').forEach((t) => {
      expect(t.tagName).to.equal('BUTTON');
      expect(document.getElementById(t.getAttribute('aria-controls'))).to.exist;
    });
  });

  it('marks emphasized links, notes and the inline form', async () => {
    const el = await mountHeader();
    expect(el.querySelector('.nav-panel-strong a').textContent).to.equal('All shipping services');
    expect(el.querySelector('.nav-panel-note a').textContent).to.equal('Open an account');
    const form = el.querySelector('.nav-panel-form');
    const input = form.querySelector('input');
    expect(form.querySelector('label').htmlFor).to.equal(input.id);
    expect(input.placeholder).to.equal('Tracking ID');
    expect(form.querySelector('button[type="submit"]').textContent).to.equal('TRACK');
  });

  it('builds the search toggle and search form from the search item', async () => {
    const el = await mountHeader();
    const toggle = el.querySelector('.nav-search-toggle');
    expect(toggle.getAttribute('aria-label')).to.equal('Search');
    expect(el.querySelector('.nav-search input').placeholder).to.equal('Search or Tracking Numbers');
    toggle.click();
    expect(el.classList.contains('is-search-open')).to.be.true;
    el.querySelector('.nav-search-close').click();
    expect(el.classList.contains('is-search-open')).to.be.false;
  });
});

describe('header dropdowns', () => {
  it('opens one dropdown at a time and toggles closed', async () => {
    const el = await mountHeader();
    const [shipping, tracking] = el.querySelectorAll('.nav-sections .nav-trigger');
    shipping.click();
    expect(shipping.getAttribute('aria-expanded')).to.equal('true');
    expect(el.classList.contains('is-dropdown-open')).to.be.true;
    tracking.click();
    expect(shipping.getAttribute('aria-expanded')).to.equal('false');
    expect(tracking.getAttribute('aria-expanded')).to.equal('true');
    tracking.click();
    expect(el.querySelectorAll('.nav-item.is-open').length).to.equal(0);
    expect(el.classList.contains('is-dropdown-open')).to.be.false;
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const el = await mountHeader();
    const shipping = el.querySelector('.nav-trigger');
    shipping.click();
    el.querySelector('.nav-panel a').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(shipping.getAttribute('aria-expanded')).to.equal('false');
    expect(document.activeElement).to.equal(shipping);
  });
});

describe('header mobile menu', () => {
  it('toggles the menu and hamburger label', async () => {
    const el = await mountHeader();
    const btn = el.querySelector('.nav-hamburger');
    expect(btn.getAttribute('aria-expanded')).to.equal('false');
    expect(btn.getAttribute('aria-label')).to.equal('Open Menu');
    btn.click();
    expect(el.classList.contains('is-menu-open')).to.be.true;
    expect(btn.getAttribute('aria-label')).to.equal('Close Menu');
    expect(document.body.style.overflow).to.equal('hidden');
    btn.click();
    expect(el.classList.contains('is-menu-open')).to.be.false;
    expect(document.body.style.overflow).to.equal('');
  });
});
