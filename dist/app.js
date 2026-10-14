import {setupNotes} from './notes.js';
import './github-theme/github-theme.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Replaces bullets with an expanded view without moving the other column.
 * @param {!HTMLElement} entry Resume entry containing both views.
 * @param {boolean} open Whether to show the expanded view.
 */
async function setEntryOpen(entry, open) {
  if (entry.dataset.busy || (entry.dataset.open === 'true') === open) return;
  entry.dataset.busy = 'true';
  entry.dataset.open = String(open);
  const wrapper = entry.querySelector('.entry-content');
  const bullets = entry.querySelector('.entry-bullets');
  const expanded = entry.querySelector('.expanded-content');
  const outgoing = open ? bullets : expanded;
  const incoming = open ? expanded : bullets;
  const duration = reducedMotion.matches ? 0 : 230;
  const scale = Number(document.querySelector('.page').style.zoom) || 1;
  const startHeight = wrapper.getBoundingClientRect().height / scale;
  wrapper.style.height = `${startHeight}px`;
  wrapper.style.overflow = 'hidden';
  for (const trigger of entry.querySelectorAll('[aria-expanded]')) {
    trigger.setAttribute('aria-expanded', String(open));
  }
  await outgoing.animate([{opacity: 1}, {opacity: 0}], {
    duration: duration / 2,
    fill: 'forwards',
  }).finished;
  outgoing.hidden = true;
  incoming.hidden = false;
  const endHeight = incoming.getBoundingClientRect().height / scale;
  await Promise.all([
    wrapper.animate([
      {height: `${startHeight}px`}, {height: `${endHeight}px`},
    ], {duration, easing: 'ease-out'}).finished,
    incoming.animate([{opacity: 0}, {opacity: 1}], {
      duration,
      fill: 'forwards',
    }).finished,
  ]);
  wrapper.style.height = '';
  wrapper.style.overflow = '';
  delete entry.dataset.busy;
  entry.dispatchEvent(new CustomEvent('entrychange', {bubbles: true, detail: {open}}));
}

for (const entry of document.querySelectorAll('.interactive-entry')) {
  entry.addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    if (event.target.closest('.collapse-button')) {
      setEntryOpen(entry, false).then(() => {
        if (event.detail === 0) entry.querySelector('.entry-trigger').focus({preventScroll: true});
      });
    } else if (event.target.closest('.entry-trigger, .entry-bullets')) {
      setEntryOpen(entry, entry.dataset.open !== 'true');
    }
  });
  entry.addEventListener('keydown', (event) => {
    if (!event.target.matches('.entry-trigger, .entry-bullets')) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setEntryOpen(entry, entry.dataset.open !== 'true');
    }
    if (event.key === 'Escape') setEntryOpen(entry, false);
  });
}

function bindPanel(name) {
  const trigger = document.querySelector(`#open-${name}`);
  const panel = document.querySelector(
      name === 'github' ? '#github-section' : '#sources');
  const collapse = document.querySelector(`#collapse-${name}`);
  trigger.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      panel.animate([{opacity: 0}, {opacity: 1}], {
        duration: reducedMotion.matches ? 0 : 220,
      });
      if (name === 'github') panel.querySelector('github-profile').load();
    }
  });
  collapse.addEventListener('click', () => {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (document.activeElement === collapse) trigger.focus({preventScroll: true});
  });
}

bindPanel('github');
bindPanel('sources');

const marginHint = document.createElement('div');
marginHint.className = 'margin-hint';
marginHint.setAttribute('role', 'status');
document.body.append(marginHint);
let hintTarget;

function showHint(target, message) {
  const paper = document.querySelector('.page').getBoundingClientRect();
  const bounds = target.getBoundingClientRect();
  const viewport = document.documentElement.clientWidth;
  const right = bounds.left + bounds.width / 2 > viewport / 2;
  const space = right ? viewport - paper.right : paper.left;
  const width = Math.min(150, Math.max(0, space - 32));
  marginHint.hidden = width < 60;
  marginHint.style.width = `${width}px`;
  marginHint.style.left = `${right ? viewport - 16 - width : 16}px`;
  marginHint.textContent = message;
  marginHint.style.top = `${Math.max(75, Math.min(bounds.top,
      innerHeight - marginHint.offsetHeight - 16))}px`;
}

function updateHint(event) {
  hintTarget = event.target.closest('a[href^="mailto:"], .entry-trigger, .entry-bullets, .inline-trigger');
  if (!hintTarget) {
    marginHint.hidden = true;
    return;
  }
  const entry = hintTarget.closest('.interactive-entry');
  let message = '';
  if (hintTarget.matches('a')) {
    message = 'Copy email to clipboard?';
  } else if (entry) {
    message = `${entry.dataset.open === 'true' ? 'Collapse' : 'Expand'} ${entry.dataset.label}?`;
  } else {
    const label = hintTarget.id === 'open-github' ? 'GitHub' : 'sources';
    message = `${hintTarget.getAttribute('aria-expanded') === 'true' ? 'Collapse' : 'Expand'} ${label}?`;
  }
  showHint(hintTarget, message);
}

document.addEventListener('pointerover', updateHint);
document.addEventListener('focusin', updateHint);
document.addEventListener('click', () => { marginHint.hidden = true; });
window.addEventListener('scroll', () => { marginHint.hidden = true; }, {passive: true});
window.addEventListener('resize', () => { marginHint.hidden = true; });
for (const email of document.querySelectorAll('a[href^="mailto:"]')) {
  email.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(email.getAttribute('href').slice(7));
      showHint(email, 'Email copied');
    } catch {
      showHint(email, 'Unable to copy. Select the email text to copy it.');
    }
  });
}

let zoom = 1;
const zoomOut = document.querySelector('#zoom-out');
const zoomIn = document.querySelector('#zoom-in');

function applyZoom() {
  const fit = innerWidth > 850 ? Math.min(2.5, innerWidth * .86 / 816) : 1;
  document.querySelector('.page').style.zoom = String(fit * zoom);
  document.dispatchEvent(new Event('pagezoom'));
  zoomOut.disabled = zoom <= .7;
  zoomIn.disabled = zoom >= 1.5;
  marginHint.hidden = true;
}

zoomOut.addEventListener('click', () => {
  zoom = Math.max(.7, Number((zoom - .1).toFixed(1)));
  applyZoom();
});
zoomIn.addEventListener('click', () => {
  zoom = Math.min(1.5, Number((zoom + .1).toFixed(1)));
  applyZoom();
});
window.addEventListener('resize', applyZoom);
applyZoom();

setupNotes();

document.querySelector('#download-resume').addEventListener('click', async (event) => {
  event.preventDefault();
  const link = event.currentTarget;
  try {
    const response = await fetch('https://raw.githubusercontent.com/ReegoJA/personal-website/main/dist/Resume.pdf', {cache: 'no-store'});
    if (!response.ok) throw new Error('Resume unavailable');
    const url = URL.createObjectURL(await response.blob());
    const download = document.createElement('a');
    download.href = url;
    download.download = link.download;
    download.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    location.href = link.href;
  }
});
