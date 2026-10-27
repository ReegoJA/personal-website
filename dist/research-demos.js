const panel = document.querySelector('#lastlabel-replay');

function element(tag, text, attributes = {}) {
  const result = document.createElement(tag);
  result.textContent = text;
  for (const [key, value] of Object.entries(attributes)) result.setAttribute(key, value);
  return result;
}

function svgElement(tag, attributes, text = '') {
  const result = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) result.setAttribute(key, value);
  result.textContent = text;
  return result;
}

function drawCurve(record, outcome) {
  const chart = svgElement('svg', {viewBox: '0 0 560 290', role: 'img', 'aria-label': 'Learning curve showing test score versus examples labeled, with the selected stopping point'});
  const x = labels => 56 + 478 * labels / 400;
  const y = score => 240 - 200 * score;
  for (const score of [0, .25, .5, .75, 1]) {
    chart.append(svgElement('line', {x1: 56, x2: 534, y1: y(score), y2: y(score), stroke: '#d8e5ed'}));
    chart.append(svgElement('text', {x: 46, y: y(score) + 4, 'text-anchor': 'end'}, String(score * 100)));
  }
  for (const labels of [0, 100, 200, 300, 400]) chart.append(svgElement('text', {x: x(labels), y: 259, 'text-anchor': 'middle'}, String(labels)));
  chart.append(svgElement('text', {x: 56, y: 22}, 'Test score / higher is better'));
  chart.append(svgElement('text', {x: 300, y: 284, 'text-anchor': 'middle'}, 'Examples labeled by a person'));
  const points = rows => rows.map(row => `${x(row.labels)},${y(row.f1)}`).join(' ');
  chart.append(svgElement('polyline', {points: points(record.trace), fill: 'none', stroke: '#a3b9c9', 'stroke-width': 2, 'stroke-dasharray': '4 4'}));
  chart.append(svgElement('polyline', {points: points(record.trace.filter(row => row.labels <= outcome.labels)), fill: 'none', stroke: '#286b9d', 'stroke-width': 3}));
  chart.append(svgElement('line', {x1: x(outcome.labels), x2: x(outcome.labels), y1: 40, y2: 240, stroke: '#a24f87', 'stroke-dasharray': '3 4'}));
  chart.append(svgElement('circle', {cx: x(outcome.labels), cy: y(outcome.macro_f1), r: 6, fill: '#a24f87'}));
  chart.append(svgElement('text', {x: Math.min(x(outcome.labels) + 8, 414), y: 55, fill: '#a24f87'}, outcome.stopped ? 'Training stops' : 'Label limit reached'));
  return chart;
}

async function setupComparison() {
  try {
    const response = await fetch('assets/lastlabel-replay.json');
    if (!response.ok) throw new Error('Unavailable');
    const data = await response.json();
    const record = data.records.find(row => row.task === 'graphics-vs-windows' && row.config.noise === .3);
    const controls = element('div', '', {class: 'comparison-toggle', role: 'group', 'aria-label': 'Examples used to judge progress'});
    const chart = element('div', '', {class: 'replay-chart'});
    const numbers = element('div', '', {class: 'comparison-numbers', 'aria-live': 'polite'});
    const conclusion = element('p', '', {class: 'comparison-takeaway'});
    const choices = [['fixed', 'A random sample'], ['easy', 'The easiest examples']];
    const buttons = choices.map(([key, title]) => {
      const button = element('button', title, {type: 'button', 'aria-pressed': 'false'});
      button.addEventListener('click', () => choose(key));
      controls.append(button);
      return button;
    });
    function choose(key) {
      const outcome = record.outcomes.find(row => row.rule === `pcf:${key}`);
      buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(choices[index][0] === key)));
      chart.replaceChildren(drawCurve(record, outcome));
      const work = element('div');
      work.append(element('strong', String(outcome.labels)), element('span', 'examples labeled'));
      const score = element('div');
      score.append(element('strong', (100 * outcome.macro_f1).toFixed(1)), element('span', 'test score / 100'));
      numbers.replaceChildren(work, score);
      conclusion.textContent = key === 'easy'
        ? 'Judging progress on easy examples stopped training after 100 labels. That saved 300 labels, but the test score was 13.4 points lower.'
        : 'With a random sample, the stopping rule kept asking for labels until the 400-label limit. More labeling produced a higher test score in this run.';
    }
    const details = element('details', '', {class: 'demo-caption'});
    details.append(element('summary', 'About this example'), element('p', `Selected to illustrate a visible trade-off, not an average result. One saved text-classification run with 30% simulated labeling errors. Same training sequence and stopping rule in both views, only the checking sample changes. PCF rule, seed 100, ${record.id.split('/').at(-1)}. The dashed line shows what happened when training continued. Test scores never controlled stopping.`));
    panel.replaceChildren(element('h4', 'When should the labeling stop?'),
      element('p', 'A model learns from examples labeled by people. LastLabel studies when it can stop asking for more without sacrificing too much performance.'),
      element('p', 'Judge its progress using:'), controls, chart, numbers, conclusion,
      element('p', 'Key: test score = macro F1, a score balancing false alarms and missed cases, averaged across the two categories. It is not percent accuracy.', {class: 'demo-caption'}), details);
    choose('fixed');
  } catch {
    panel.replaceChildren(element('p', 'The example could not load. The study release below contains the complete results.'));
  }
}

if (panel) setupComparison();

const motion = document.querySelector('#lumen-motion');
if (motion) {
  const image = document.querySelector('#lumen-animation');
  let playing = false;
  motion.addEventListener('click', () => {
    playing = !playing;
    image.src = playing ? 'assets/lumen-light-motion.webp' : 'assets/lumen-light-still.png';
    motion.textContent = playing ? 'Stop animation' : 'Move the light';
    motion.setAttribute('aria-pressed', String(playing));
  });
  document.querySelector('#lumen').addEventListener('entrychange', () => {
    if (document.querySelector('#lumen').dataset.open !== 'true') {
      playing = false;
      image.src = 'assets/lumen-light-still.png';
      motion.textContent = 'Move the light';
      motion.setAttribute('aria-pressed', 'false');
    }
  });
}
