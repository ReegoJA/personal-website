/** Places brief prompts in the paper margins until their actions are completed. */
export function setupNotes() {
  const prompts = [
    {key: 'github', selector: '#open-github', text: 'Explore my GitHub', side: 'right', offset: -75},
    {key: 'entry', selector: '#vip .entry-trigger', text: 'Click an entry to explore', side: 'left', offset: 0},
    {key: 'download', selector: '#download-resume', text: 'Take a copy with you', side: 'right', offset: 45},
  ];
  const notes = [];
  function completed(key) {
    try { return sessionStorage.getItem(`resume-note-${key}`) === 'done'; }
    catch { return false; }
  }
  function dismiss(note) {
    if (note.dataset.leaving) return;
    note.dataset.leaving = 'true';
    try { sessionStorage.setItem(`resume-note-${note.dataset.key}`, 'done'); }
    catch { /* Prompts still work when session storage is unavailable. */ }
    setTimeout(() => note.remove(), 350);
  }
  for (const prompt of prompts) {
    if (completed(prompt.key)) continue;
    const target = document.querySelector(prompt.selector);
    if (!target) continue;
    const note = document.createElement('aside');
    note.className = 'sticky-note';
    note.dataset.key = prompt.key;
    note.dataset.side = prompt.side;
    note.setAttribute('aria-hidden', 'true');
    note.style.setProperty('--tilt', prompt.side === 'left' ? '-5deg' : '5deg');
    const label = document.createElement('span');
    label.textContent = prompt.text;
    note.append(label);
    note.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 40 25" aria-hidden="true"><path d="M35 3Q30 19 6 17M12 10L5 17L13 23"/></svg>');
    document.body.append(note);
    notes.push({note, target, prompt});
    if (prompt.key === 'entry') {
      document.addEventListener('entrychange', (event) => {
        if (event.detail.open) dismiss(note);
      });
    } else {
      target.addEventListener('click', () => {
        if (prompt.key === 'download' || target.getAttribute('aria-expanded') === 'true') dismiss(note);
      });
    }
  }
  function place() {
    const paper = document.querySelector('.page').getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    for (const {note, target, prompt} of notes) {
      if (!note.isConnected) continue;
      const bounds = target.getBoundingClientRect();
      const gap = prompt.side === 'left' ? paper.left : viewport - paper.right;
      note.hidden = gap < 55 || bounds.bottom < 0 || bounds.top > innerHeight;
      const width = Math.min(112, gap + 16);
      note.style.width = `${Math.max(0, width)}px`;
      note.style.left = `${prompt.side === 'left' ? 12 : viewport - width - 12}px`;
      note.style.top = `${Math.max(80, Math.min(bounds.top + prompt.offset, innerHeight - 150))}px`;
    }
  }
  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; place(); });
  }
  document.addEventListener('pointermove', (event) => {
    for (const {note, target} of notes) {
      const bounds = target.getBoundingClientRect();
      const near = event.clientX > bounds.left - 35 && event.clientX < bounds.right + 35 &&
          event.clientY > bounds.top - 35 && event.clientY < bounds.bottom + 35;
      note.dataset.near = String(near);
    }
  }, {passive: true});
  document.addEventListener('pointerleave', () => {
    for (const {note} of notes) note.dataset.near = 'false';
  });
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  document.addEventListener('entrychange', schedule);
  document.addEventListener('pagezoom', schedule);
  new ResizeObserver(schedule).observe(document.querySelector('.page'));
  place();
}
