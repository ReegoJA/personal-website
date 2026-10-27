const panel = document.querySelector('#lastlabel-replay');

function element(tag, text, attributes = {}) {
  const result = document.createElement(tag);
  result.textContent = text;
  for (const [key, value] of Object.entries(attributes)) result.setAttribute(key, value);
  return result;
}

function comparisonChart(example) {
  const figure = element('div', '', {class: 'finding-bars'});
  for (const [key, title, maximum, multiplier] of [['labels', 'Average labels requested / fewer means less work', 400, 1], ['macro_f1', 'Average test score / higher is better', 1, 100]]) {
    figure.append(element('p', title, {class: 'finding-metric'}));
    for (const [method, label] of [['fixed', 'Broad checking sample'], ['easy', 'Initially confident sample']]) {
      const value = example.values[method][key];
      const row = element('div', '', {class: 'finding-row'});
      row.append(element('span', label));
      const track = element('div', '', {class: 'finding-track', 'aria-hidden': 'true'});
      const bar = element('div', '', {class: `finding-bar ${method}`});
      bar.style.width = `${100 * value / maximum}%`;
      track.append(bar);
      row.append(track, element('strong', (value * multiplier).toFixed(1)));
      figure.append(row);
    }
  }
  return figure;
}

async function setupComparison() {
  try {
    const response = await fetch('assets/lastlabel-findings.json');
    if (!response.ok) throw new Error('Unavailable');
    const data = await response.json();
    const label = element('label', 'What is the model predicting?');
    const select = element('select', '', {'aria-label': 'Prediction task'});
    for (const example of data.cases) select.append(element('option', example.title, {value: example.task}));
    label.append(select);
    const chart = element('div');
    const takeaway = element('p', '', {class: 'comparison-takeaway', 'aria-live': 'polite'});
    const detail = element('details', '', {class: 'demo-caption'});
    const intervals = element('p');
    detail.append(element('summary', 'Evidence and uncertainty'), intervals,
      element('p', '30 matched runs per task, 15% simulated labeling errors, a linear SVM, and the stabilizing-predictions stopping rule. The model chooses uncertain examples to label. Each comparison changes only the examples used to check whether predictions have settled. All six tasks from the published comparison are included.'),
      element('p', 'The 95% ranges come from resampling matched runs. They are not adjusted for multiple comparisons. Four text tasks share one collection of articles. These results describe this experiment, not a universal best method.'),
      element('a', 'Read the research findings ↗', {href: data.source, target: '_blank', rel: 'noopener noreferrer'}));
    function draw() {
      const example = data.cases.find(row => row.task === select.value);
      const d = example.delta;
      chart.replaceChildren(comparisonChart(example));
      if (example.values.fixed.stopped === 0 && example.values.easy.stopped === 0) {
        takeaway.textContent = 'No difference in this condition: both approaches reached the 400-label limit in all 30 runs. Equal results here do not mean either approach successfully detected when to stop.';
      } else if (example.task.startsWith('synthetic')) {
        takeaway.textContent = `Checking examples the model initially found easy saved ${(-d.labels_delta).toFixed(1)} labels on average, but reduced the test score by ${(-100 * d.f1_delta).toFixed(2)} points. Earlier stopping traded predictive performance for less labeling work.`;
      } else {
        takeaway.textContent = `The difference was small: ${(-d.labels_delta).toFixed(1)} fewer labels on average and ${(-100 * d.f1_delta).toFixed(2)} fewer test-score points. The large savings seen on simulated tasks did not carry over to this text task.`;
      }
      intervals.textContent = `Initially confident minus broad sample: labels ${d.labels_delta.toFixed(2)} (95% range ${d.labels_low.toFixed(2)} to ${d.labels_high.toFixed(2)}). Test score ${(100*d.f1_delta).toFixed(2)} points (95% range ${(100*d.f1_low).toFixed(2)} to ${(100*d.f1_high).toFixed(2)}).`;
    }
    select.addEventListener('change', draw);
    panel.replaceChildren(element('h4', 'What the experiments found'),
      element('p', 'Can a model stop asking people for labels without losing useful predictive ability? These results compare two ways of checking whether its predictions have settled, averaged over 30 runs.'), label, chart, takeaway,
      element('p', 'Key: checking sample = examples used to judge stability. Test score = macro F1 on a 0–100 scale, balancing false alarms and missed cases across both categories. It is not percent accuracy.', {class: 'demo-caption'}), detail);
    draw();
  } catch {
    panel.replaceChildren(element('p', 'The findings could not load. The study release below contains the complete results.'));
  }
}

if (panel) setupComparison();

const lightPosition = document.querySelector('#lumen-position');
if (lightPosition) {
  const view = document.querySelector('#lumen-light-view');
  lightPosition.addEventListener('input', () => {
    const frame = Number(lightPosition.value);
    view.style.backgroundPosition = `${100 * frame / 12}% center`;
    const position = frame < 6 ? 'Left of center' : frame > 6 ? 'Right of center' : 'Centered';
    lightPosition.setAttribute('aria-valuetext', `${position}, position ${frame + 1} of 13`);
    view.setAttribute('aria-label', `LUMEN rendering with the ceiling light ${position.toLowerCase()}`);
  });
}
