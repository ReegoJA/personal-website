const panel = document.querySelector('#lastlabel-replay');

function node(tag, text, attributes = {}) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

function select(label, values) {
  const wrapper = node('label', label);
  const input = node('select', '', {'aria-label': label});
  for (const [value, title] of values) input.append(node('option', title, {value}));
  wrapper.append(input);
  return {wrapper, input};
}

function svgNode(tag, attributes, text = '') {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  element.textContent = text;
  return element;
}

function plot(record, index, outcomes) {
  const svg = svgNode('svg', {viewBox: '0 0 560 300', role: 'img', 'aria-label': 'Held-out macro F1 by requested annotations, with SP and PCF decisions'});
  const trace = record.trace;
  const x = (labels) => 56 + 480 * labels / record.config.budget;
  const y = (score) => 254 - 220 * score;
  for (const value of [0, .25, .5, .75, 1]) {
    svg.append(svgNode('line', {x1: 56, x2: 536, y1: y(value), y2: y(value), stroke: '#d8e5ed'}));
    svg.append(svgNode('text', {x: 47, y: y(value) + 4, 'text-anchor': 'end'}, value.toFixed(2)));
  }
  for (const value of [0, 100, 200, 300, 400]) {
    svg.append(svgNode('text', {x: x(value), y: 273, 'text-anchor': 'middle'}, String(value)));
  }
  svg.append(svgNode('text', {x: 56, y: 19}, 'Held-out macro F1'));
  svg.append(svgNode('text', {x: 300, y: 295, 'text-anchor': 'middle'}, 'Requested annotations'));
  svg.append(svgNode('polyline', {points: trace.map(p => `${x(p.labels)},${y(p.f1)}`).join(' '), fill: 'none', stroke: '#a9c1d1', 'stroke-width': 2, 'stroke-dasharray': '4 4'}));
  svg.append(svgNode('polyline', {points: trace.slice(0, index + 1).map(p => `${x(p.labels)},${y(p.f1)}`).join(' '), fill: 'none', stroke: '#24679a', 'stroke-width': 3}));
  outcomes.forEach((outcome, i) => {
    if (outcome.labels > trace[index].labels) return;
    const color = i ? '#a24f87' : '#927029';
    svg.append(svgNode('line', {x1: x(outcome.labels), x2: x(outcome.labels), y1: 34, y2: 254, stroke: color, 'stroke-dasharray': '3 4'}));
    svg.append(svgNode('circle', {cx: x(outcome.labels), cy: y(outcome.macro_f1), r: i ? 4 : 7, fill: i ? color : 'none', stroke: color, 'stroke-width': 2}));
    svg.append(svgNode('text', {x: Math.min(x(outcome.labels) + 5, 463), y: 48 + i * 19, fill: color}, `${i ? 'PCF' : 'SP'} ${outcome.stopped ? 'stop' : 'budget'}`));
  });
  const current = trace[index];
  svg.append(svgNode('circle', {cx: x(current.labels), cy: y(current.f1), r: 4, fill: '#24679a'}));
  return svg;
}

async function setupReplay() {
  try {
    const response = await fetch('assets/lastlabel-replay.json');
    if (!response.ok) throw new Error('Unavailable');
    const data = await response.json();
    const task = select('Task', [...new Set(data.records.map(r => r.task))].map(value => [value, value.replaceAll('-', ' ')]));
    const noise = select('Label noise', [...new Set(data.records.map(r => r.config.noise))].sort().map(value => [value, `${value * 100}% symmetric flips`]));
    const stop = select('Stop set', [['fixed', 'Fixed random sample'], ['remaining', 'Remaining unlabeled pool'], ['easy', 'Initially confident sample']]);
    const controls = node('div', '', {class: 'replay-controls'});
    controls.append(task.wrapper, noise.wrapper, stop.wrapper);
    const chart = node('div', '', {class: 'replay-chart'});
    const sliderLabel = node('label', 'Replay learning round');
    const slider = node('input', '', {type: 'range', min: 0, step: 1, 'aria-label': 'Learning round'});
    sliderLabel.append(slider);
    const position = node('p', '', {class: 'replay-position', 'aria-live': 'polite'});
    const results = node('div', '', {class: 'replay-results'});
    const evidence = node('p', '', {class: 'demo-caption'});
    let record;
    function draw() {
      const index = Number(slider.value);
      const outcomes = ['sp', 'pcf'].map(rule => record.outcomes.find(row => row.rule === `${rule}:${stop.input.value}`));
      chart.replaceChildren(plot(record, index, outcomes));
      const point = record.trace[index];
      position.textContent = `${point.labels} annotations requested / macro F1 ${point.f1.toFixed(3)}`;
      results.replaceChildren();
      outcomes.forEach((outcome, i) => {
        const card = node('div');
        card.append(node('strong', `${i ? 'PCF' : 'SP'} / ${outcome.stopped ? 'rule triggered' : 'budget fallback'}`));
        const difference = outcome.macro_f1 - record.trace.at(-1).f1;
        card.append(node('p', `${record.config.budget - outcome.labels} labels saved (${(outcome.label_savings * 100).toFixed(0)}%)`));
        card.append(node('p', `F1 ${outcome.macro_f1.toFixed(3)} / ${difference >= 0 ? '+' : ''}${(100 * difference).toFixed(2)} points vs budget`));
        results.append(card);
      });
      evidence.textContent = `Saved run ${record.id.split('/').at(-1)} / seed ${record.config.seed}. Cards show final decisions. Dashed curve shows the full retrospective trace.`;
    }
    function choose() {
      record = data.records.find(r => r.task === task.input.value && r.config.noise === Number(noise.input.value));
      slider.max = record.trace.length - 1;
      slider.value = slider.max;
      draw();
    }
    task.input.addEventListener('change', choose);
    noise.input.addEventListener('change', choose);
    stop.input.addEventListener('change', draw);
    slider.addEventListener('input', draw);
    panel.replaceChildren(node('h4', 'When is another label worth it?'), controls, chart, sliderLabel, position, results, evidence,
      node('p', 'One predetermined seed across six tasks and four noise levels, using uncertainty sampling and a linear SVM. SP threshold 0.99, PCF threshold 0.01, window 3. Test F1 is retrospective evaluation, never a stopping input. Individual runs illustrate behavior, not aggregate evidence.', {class: 'demo-caption'}));
    choose();
  } catch {
    panel.replaceChildren(node('p', 'The experiment replay could not load. The study release below contains the complete results.'));
  }
}

if (panel) setupReplay();
