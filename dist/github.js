const API_ORIGIN = 'https://api.github.com';
const PAGE_SIZE = 30;
const MAX_FILE_SIZE = 250000;
const cache = new Map();

/**
 * Reads public GitHub data without storing credentials in the browser.
 * @param {string} path API path relative to the GitHub origin.
 * @return {Promise<*>} Parsed response data.
 */
export async function requestGithub(path) {
  if (cache.has(path)) {
    return cache.get(path);
  }
  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: {'Accept': 'application/vnd.github+json'},
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new Error('GitHub is limiting requests. Please try again later.');
    }
    if (response.status === 404) {
      throw new Error('This public repository or file is not available.');
    }
    if (response.status === 409) {
      throw new Error('This repository has no commits yet.');
    }
    throw new Error('GitHub could not be reached. Please try again.');
  }
  const data = await response.json();
  cache.set(path, data);
  return data;
}

/**
 * Decodes small text files; binary and oversized files stay out of the viewer.
 * @param {!Object} file GitHub content response.
 * @return {string} UTF-8 source text.
 */
export function decodeFile(file) {
  if (file.size > MAX_FILE_SIZE || file.encoding !== 'base64') {
    throw new Error('Preview supports text files up to 250 KB.');
  }
  const bytes = Uint8Array.from(atob(file.content.replace(/\s/g, '')),
      (character) => character.charCodeAt(0));
  if (bytes.includes(0)) {
    throw new Error('Binary files are not displayed in the code viewer.');
  }
  return new TextDecoder('utf-8', {fatal: true}).decode(bytes);
}

/**
 * Mounts a read-only repository browser within the portfolio.
 * @param {string} username Public GitHub account name.
 */
export function mountGithub(username) {
  const panel = document.querySelector('#github-section');
  const status = document.querySelector('#github-status');
  const list = document.querySelector('#repo-list');
  const heading = document.querySelector('#repo-heading');
  const view = document.querySelector('#repo-view');
  const tabs = document.querySelector('#repo-tabs');
  const search = document.querySelector('#repo-search');
  const more = document.querySelector('#more-repos');
  const refresh = document.querySelector('#refresh-github');
  let repositories = [];
  let selected = null;
  let page = 1;
  let loaded = false;
  let loading = false;
  let revision = 0;

  function node(tag, text, className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    element.className = className;
    return element;
  }

  function showError(error, target) {
    const message = error.name === 'TimeoutError' ?
      'GitHub took too long to respond. Please retry.' :
      error.message || 'Unable to load GitHub content.';
    target.replaceChildren(node('p', message, 'detail-note'));
  }

  function renderRepositories() {
    list.replaceChildren();
    const query = search.value.trim().toLowerCase();
    const matches = repositories.filter((repo) =>
      repo.name.toLowerCase().includes(query));
    for (const repo of matches) {
      const button = node('button', repo.name, 'repo-choice');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(selected?.id === repo.id));
      button.append(node('small', repo.language || 'Repository'));
      button.addEventListener('click', () => selectRepository(repo));
      list.append(button);
    }
    if (!matches.length) {
      list.append(node('p', 'No matching public repositories.', 'detail-note'));
    }
  }

  async function loadRepositories(reset = false) {
    if (loading) return;
    loading = true;
    more.disabled = true;
    refresh.disabled = true;
    status.textContent = 'Loading public repositories…';
    try {
      if (reset) {
        cache.clear();
        page = 1;
        repositories = [];
        selected = null;
        revision++;
        heading.replaceChildren(node('p', 'Select a repository.'));
        view.replaceChildren();
        tabs.hidden = true;
      }
      const owner = encodeURIComponent(username);
      const data = await requestGithub(
          `/users/${owner}/repos?sort=updated&per_page=${PAGE_SIZE}&page=${page}`);
      if (!Array.isArray(data)) throw new Error('Unexpected GitHub response.');
      repositories.push(...data);
      page++;
      loaded = true;
      more.hidden = data.length < PAGE_SIZE;
      renderRepositories();
      status.textContent = `${repositories.length} public repositories loaded.`;
    } catch (error) {
      status.textContent = error.message;
      more.hidden = true;
    } finally {
      loading = false;
      more.disabled = false;
      refresh.disabled = false;
    }
  }

  function selectRepository(repo) {
    selected = repo;
    heading.replaceChildren(node('h3', repo.name));
    if (repo.description) heading.append(node('p', repo.description));
    heading.append(node('p',
        `${repo.language || 'Code'} / ${repo.stargazers_count} stars / ` +
        `${repo.forks_count} forks`, 'repo-heading-meta'));
    tabs.hidden = false;
    renderRepositories();
    showTab('code');
  }

  async function showTab(tab, path = '') {
    if (!selected) return;
    const current = ++revision;
    const repo = selected;
    const base = `/repos/${encodeURIComponent(username)}/` +
      encodeURIComponent(repo.name);
    for (const button of tabs.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.tab === tab));
    }
    view.replaceChildren(node('p', 'Loading…', 'detail-note'));
    try {
      const encodedPath = path.split('/').map(encodeURIComponent).join('/');
      const suffix = tab === 'code' ? `/contents/${encodedPath}` :
        `/${tab}?per_page=30&state=all`;
      const data = await requestGithub(base + suffix);
      // Ignore slow responses after the visitor chooses another view.
      if (current !== revision) return;
      view.replaceChildren();
      if (tab === 'code') renderCode(data, path);
      else renderActivity(data, tab);
    } catch (error) {
      if (current === revision) showError(error, view);
    }
  }

  function renderCode(data, path) {
    if (path) {
      const back = node('button', '← Parent directory', 'file-back');
      back.type = 'button';
      back.addEventListener('click', () => {
        showTab('code', path.split('/').slice(0, -1).join('/'));
      });
      view.append(back);
    }
    if (!Array.isArray(data)) {
      const title = node('p', path, 'repo-heading-meta');
      const code = node('code', decodeFile(data));
      const pre = document.createElement('pre');
      pre.tabIndex = 0;
      pre.append(code);
      view.append(title, pre);
      return;
    }
    const entries = data.filter((entry) =>
      !/\.(md|txt)$/i.test(entry.name) && entry.name !== 'LICENSE');
    entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of entries) {
      const prefix = entry.type === 'dir' ? '+ ' : '  ';
      const button = node('button', prefix + entry.name, 'file-choice');
      button.type = 'button';
      button.addEventListener('click', () => showTab('code', entry.path));
      view.append(button);
    }
    if (!entries.length) {
      view.append(node('p', 'No previewable code in this directory.',
          'detail-note'));
    }
    view.append(node('p',
        'README and text documentation remain in the GitHub repository.',
        'detail-note'));
  }

  function renderActivity(data, tab) {
    const entries = tab === 'issues' ?
      data.filter((item) => !item.pull_request) : data;
    if (!entries.length) {
      view.append(node('p', `No ${tab} to display.`, 'detail-note'));
    }
    for (const item of entries) {
      const article = node('article', '', 'activity-item');
      if (tab === 'commits') {
        article.append(node('small', item.sha.slice(0, 7)));
        article.append(node('p', item.commit.message));
        article.append(node('small', item.commit.author.date.slice(0, 10)));
      } else {
        article.append(node('small', `#${item.number} / ${item.state}`));
        article.append(node('p', item.title));
        if (item.body) article.append(node('p', item.body));
      }
      view.append(article);
    }
    view.append(node('p', 'Showing up to 30 recent items.', 'detail-note'));
  }

  panel.addEventListener('github-open', () => {
    if (!loaded) loadRepositories();
  });
  search.addEventListener('input', renderRepositories);
  more.addEventListener('click', () => loadRepositories());
  refresh.addEventListener('click', () => loadRepositories(true));
  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-tab]');
    if (button) showTab(button.dataset.tab);
  });
}
