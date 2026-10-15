/** Swaps the two sheets while keeping the concealed paper keyboard accessible. */
export function setupPapers(collapsePaper) {
  const stack = document.querySelector('.paper-stack');
  const papers = [...stack.querySelectorAll(':scope > .page')];
  let busy = false;
  async function swap(incoming) {
    if (busy || !incoming.classList.contains('is-back')) return;
    busy = true;
    const outgoing = papers.find((paper) => paper !== incoming);
    for (const child of outgoing.children) child.inert = true;
    await collapsePaper(outgoing);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 0 : 300;
    const lift = incoming.animate([
      {transform: 'translate(38px, 58px) rotate(4deg)'},
      {transform: 'translate(105px, 12px) rotate(7deg)'},
    ], {duration, easing: 'ease-in-out', fill: 'forwards'});
    await lift.finished;
    incoming.classList.remove('is-back');
    outgoing.classList.add('is-back');
    for (const paper of papers) {
      const back = paper === outgoing;
      paper.tabIndex = back ? 0 : -1;
      if (back) paper.setAttribute('role', 'button');
      else paper.removeAttribute('role');
      paper.setAttribute('aria-label', back ?
        (paper.id === 'personal-paper' ? 'View personal interests' : 'Return to research paper') :
        (paper.id === 'personal-paper' ? 'Personal interests' : 'Research paper'));
      for (const child of paper.children) child.inert = back;
    }
    lift.cancel();
    await Promise.all([
      incoming.animate([
        {transform: 'translate(105px, 12px) rotate(7deg)'}, {transform: 'none'},
      ], {duration, easing: 'ease-out'}).finished,
      outgoing.animate([
        {transform: 'none'}, {transform: 'translate(38px, 58px) rotate(4deg)'},
      ], {duration, easing: 'ease-in-out'}).finished,
    ]);
    incoming.focus({preventScroll: true});
    stack.dispatchEvent(new CustomEvent('paperchange', {bubbles: true, detail: {id: incoming.id}}));
    busy = false;
  }
  for (const paper of papers) {
    paper.addEventListener('click', () => swap(paper));
    paper.addEventListener('keydown', (event) => {
      if (event.target === paper && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        swap(paper);
      }
    });
  }
  document.addEventListener('showpersonal', () => swap(document.querySelector('#personal-paper')));
}
