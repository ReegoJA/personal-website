/** Anchors prompts to the paper, so they move with the document when scrolling. */
export function setupNotes() {
  const paper = document.querySelector('#research-paper');
  const prompts = [
    {key: 'contacts', text: 'Click these!', arrow: true},
    {key: 'modules', text: 'Expand a module!'},
    {key: 'personal', text: 'View personal interests'},
  ];
  const notes = new Map();
  for (const prompt of prompts) {
    try { if (sessionStorage.getItem(`paper-note-${prompt.key}`)) continue; }
    catch { /* Notes remain usable without session storage. */ }
    const note = document.createElement(prompt.key === 'personal' ? 'button' : 'aside');
    note.className = `sticky-note note-${prompt.key}`;
    if (prompt.key === 'personal') {
      note.type = 'button';
      note.addEventListener('click', () => document.dispatchEvent(new Event('showpersonal')));
    } else note.setAttribute('aria-hidden', 'true');
    note.textContent = prompt.text;
    if (prompt.arrow) note.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 40 25" aria-hidden="true"><path d="M35 3Q30 19 6 17M12 10L5 17L13 23"/></svg>');
    paper.append(note);
    notes.set(prompt.key, note);
  }
  function dismiss(key) {
    const note = notes.get(key);
    if (!note || note.dataset.leaving) return;
    note.dataset.leaving = 'true';
    try { sessionStorage.setItem(`paper-note-${key}`, 'done'); }
    catch { /* Dismissal also works without storage. */ }
    setTimeout(() => note.remove(), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 330);
  }
  document.querySelector('.contact').addEventListener('click', (event) => {
    if (event.target.closest('a, button')) dismiss('contacts');
  });
  document.addEventListener('entrychange', (event) => {
    if (event.detail.open) dismiss('modules');
  });
  document.addEventListener('paperchange', () => dismiss('personal'));
  function place() {
    const contact = paper.querySelector('.contact');
    const columns = paper.querySelector('.columns');
    if (notes.has('contacts')) notes.get('contacts').style.top = `${contact.offsetTop - 12}px`;
    if (notes.has('modules')) notes.get('modules').style.top = `${columns.offsetTop - (innerWidth <= 560 ? 60 : 26)}px`;
  }
  paper.addEventListener('pointermove', (event) => {
    for (const [key, note] of notes) {
      if (key === 'personal') continue;
      const bounds = note.getBoundingClientRect();
      const near = event.clientX > bounds.left - 24 && event.clientX < bounds.right + 24 &&
        event.clientY > bounds.top - 24 && event.clientY < bounds.bottom + 24;
      note.dataset.near = String(near && !!event.target.closest('a, button, .entry-trigger, .entry-bullets'));
    }
  }, {passive: true});
  paper.addEventListener('pointerleave', () => {
    for (const note of notes.values()) note.dataset.near = 'false';
  });
  new ResizeObserver(place).observe(paper.querySelector('.sheet'));
  addEventListener('resize', place);
  document.addEventListener('pagezoom', place);
  place();
}
