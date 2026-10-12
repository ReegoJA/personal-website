import {mountGithub} from './github.js';

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
  const startHeight = wrapper.getBoundingClientRect().height;
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
  const endHeight = incoming.getBoundingClientRect().height;
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
}

for (const entry of document.querySelectorAll('.interactive-entry')) {
  entry.addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    if (event.target.closest('.collapse-button')) {
      setEntryOpen(entry, false).then(() => {
        entry.querySelector('.entry-trigger').focus({preventScroll: true});
      });
    } else if (event.target.closest('.entry-trigger, .entry-bullets')) {
      setEntryOpen(entry, true);
    }
  });
  entry.addEventListener('keydown', (event) => {
    if (!event.target.matches('.entry-trigger, .entry-bullets')) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setEntryOpen(entry, true);
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
      if (name === 'github') panel.dispatchEvent(new Event('github-open'));
    }
  });
  collapse.addEventListener('click', () => {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus({preventScroll: true});
  });
}

bindPanel('github');
bindPanel('sources');
mountGithub('ReegoJA');

const marginHint = document.createElement('div');
marginHint.className = 'margin-hint';
marginHint.setAttribute('role', 'status');
document.body.append(marginHint);
let hintTarget;

function showHint(target, message) {
  const paper = document.querySelector('.page').getBoundingClientRect();
  const bounds = target.getBoundingClientRect();
  const right = bounds.left + bounds.width / 2 > innerWidth / 2;
  const space = right ? innerWidth - paper.right : paper.left;
  marginHint.style.width = `${Math.max(0, space - 32)}px`;
  marginHint.style.left = `${right ? paper.right + 16 : 16}px`;
  marginHint.style.top = `${Math.max(16, Math.min(bounds.top, innerHeight - 70))}px`;
  marginHint.textContent = message;
  marginHint.hidden = space < 110;
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
    if (entry.dataset.open === 'true') {
      marginHint.hidden = true;
      return;
    }
    message = `Expand ${entry.dataset.label}?`;
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
