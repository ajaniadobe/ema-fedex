/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-video. Base: hero. Source: https://www.fedex.com/en-us/home.html
 * Structure (blocks/hero-video/README.md): 1 column.
 *   Row 1: poster image + link to desktop mp4 (+ optional 2nd link to mobile mp4)
 *   Row 2: h1 + CTA link
 * Selectors validated against migration-work/block-context/hero-video/source.html:
 *   h1 (.homepage-a-hero_title h1), .homepage-a-hero_content a, .homepage-a-hero_image img,
 *   video.homepage-a-hero_video (desktop) / video.homepage-a-hero_video--mobile (mobile)
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('.homepage-a-hero_title h1, h1, h2');

  // Poster image (skip data-URI control icons inside buttons)
  const poster = [...element.querySelectorAll('.homepage-a-hero_image img, img')]
    .find((img) => !img.closest('button') && !(img.getAttribute('src') || '').startsWith('data:'));

  // Videos: desktop = without the --mobile modifier, mobile = with it
  const videos = [...element.querySelectorAll('video')];
  const videoSrc = (v) => (v ? (v.getAttribute('src') || v.querySelector('source')?.getAttribute('src') || '') : '');
  const mobileVideo = videos.find((v) => v.classList.contains('homepage-a-hero_video--mobile'));
  const desktopVideo = videos.find((v) => v !== mobileVideo) || null;
  const desktopSrc = videoSrc(desktopVideo);
  const mobileSrc = videoSrc(mobileVideo);

  // CTA links in the content area (exclude any link inside the heading)
  const ctas = [...element.querySelectorAll('.homepage-a-hero_content a[href], .homepage-a-hero_text a[href]')]
    .filter((a, i, arr) => arr.indexOf(a) === i && !a.closest('h1, h2'));

  // Description paragraphs with actual text
  const paragraphs = [...element.querySelectorAll('.homepage-a-hero_content p')]
    .filter((p) => p.textContent.trim());

  if (!heading && !poster && !desktopSrc) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const makeLink = (href) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = href;
    p.append(a);
    return p;
  };

  const cells = [];

  // Row 1: media (poster + video links)
  const mediaCell = [];
  if (poster) mediaCell.push(poster);
  if (desktopSrc) mediaCell.push(makeLink(desktopSrc));
  if (mobileSrc && mobileSrc !== desktopSrc) mediaCell.push(makeLink(mobileSrc));
  if (mediaCell.length) cells.push([mediaCell]);

  // Row 2: heading + text + CTA(s)
  const contentCell = [];
  if (heading) contentCell.push(heading);
  contentCell.push(...paragraphs);
  ctas.forEach((a) => {
    const p = document.createElement('p');
    p.append(a);
    contentCell.push(p);
  });
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-video', cells });
  element.replaceWith(block);
}
