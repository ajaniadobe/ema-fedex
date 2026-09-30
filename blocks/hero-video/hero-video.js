const VIDEO_EXT = /\.(mp4|webm|m3u8|mov)$/i;

function button(cls, label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `hero-video-${cls}`;
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function buildControls(video) {
  const controls = document.createElement('div');
  controls.className = 'hero-video-controls';
  const play = button('play-toggle', 'Pause', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  const mute = button('mute-toggle', 'Unmute', () => {
    video.muted = !video.muted;
  });
  // data-state is the styling hook for the play/pause and mute/unmute icons.
  play.dataset.state = 'playing';
  mute.dataset.state = 'muted';
  video.addEventListener('play', () => {
    play.textContent = 'Pause';
    play.dataset.state = 'playing';
  });
  video.addEventListener('pause', () => {
    play.textContent = 'Play';
    play.dataset.state = 'paused';
  });
  video.addEventListener('volumechange', () => {
    mute.textContent = video.muted ? 'Unmute' : 'Mute';
    mute.dataset.state = video.muted ? 'muted' : 'unmuted';
  });
  controls.append(play, mute);
  return controls;
}

function decorateMedia(media, block) {
  media.classList.add('hero-video-media');
  const pic = media.querySelector('picture');
  const img = pic?.querySelector('img');
  if (img) {
    img.loading = 'eager';
    img.fetchPriority = 'high';
  }
  // Row 1 carries the poster plus desktop (first) and mobile (second) video links.
  const links = [...media.querySelectorAll('a[href]')];
  const videos = links.filter((a) => VIDEO_EXT.test(new URL(a.href).pathname));
  const [desktop, mobile] = (videos.length ? videos : links).map((a) => a.href);
  const frame = document.createElement('div');
  frame.className = 'hero-video-frame';
  if (pic) frame.append(pic);
  media.replaceChildren(frame);
  if (!desktop) return;

  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.preload = 'none';
  video.src = (mobile && window.matchMedia('(width < 600px)').matches) ? mobile : desktop;
  video.addEventListener('playing', () => block.classList.add('hero-video-playing'), { once: true });
  frame.append(video);
  block.append(buildControls(video));

  // Respect reduced motion and data saver: keep the poster, let the user opt in via Play.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || navigator.connection?.saveData) {
    video.dispatchEvent(new Event('pause'));
    return;
  }

  // Pause while scrolled out of view (saves bandwidth/battery); never override a user pause.
  let userPaused = false;
  block.querySelector('.hero-video-play-toggle').addEventListener('click', () => {
    userPaused = video.paused;
  });
  const start = () => {
    new IntersectionObserver(([entry]) => {
      if (userPaused) return;
      if (entry.isIntersecting) video.play().catch(() => video.dispatchEvent(new Event('pause')));
      else video.pause();
    }).observe(block);
  };

  // Start the video only after the poster (the LCP image) has loaded, so they don't compete.
  if (!img || img.complete) start();
  else img.addEventListener('load', start, { once: true });
}

export default function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const content = rows.pop();
  if (!content) return;
  content.classList.add('hero-video-content');
  // Unwrap the authored cell(s) so heading/CTA are direct children of the content row.
  content.replaceChildren(...[...content.children].flatMap((cell) => (
    cell.tagName === 'DIV' ? [...cell.childNodes] : [cell])));
  const heading = content.querySelector('h1, h2, h3');
  heading?.classList.add('hero-video-heading');
  // Space after each <br> so CSS can hide the break on mobile without merging words.
  heading?.querySelectorAll('br').forEach((br) => br.after(' '));
  content.querySelectorAll('a[href]').forEach((a) => {
    a.classList.add('hero-video-cta');
    // Generic CTA text ("learn more") gets screen-reader-only context from the heading.
    if (heading && /^(learn|read|see|find out|discover) more$/i.test(a.textContent.trim())) {
      const context = document.createElement('span');
      context.className = 'visually-hidden';
      const label = heading.cloneNode(true);
      label.querySelectorAll('sup').forEach((sup) => sup.remove());
      context.textContent = ` about ${label.textContent.replace(/\s+/g, ' ').trim()}`;
      a.append(context);
    }
  });
  const media = rows.pop();
  if (media) decorateMedia(media, el);
}
