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

function element(tag, text = '', className = '') {
  const result = document.createElement(tag);
  result.textContent = text;
  result.className = className;
  return result;
}

function button(text, action, className = '') {
  const result = element('button', text, className);
  result.type = 'button';
  result.addEventListener('click', action);
  return result;
}

function external(text, url) {
  const link = element('a', text);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

/**
 * Groups returned public events by UTC date, without estimating contributions.
 * @param {!Array<!Object>} events Events returned by GitHub.
 * @return {!Map<string, number>} Event counts keyed by calendar date.
 */
export function countEventDays(events) {
  const days = new Map();
  for (const event of events) {
    const day = event.created_at.slice(0, 10);
    days.set(day, (days.get(day) || 0) + 1);
  }
  return days;
}

/**
 * Mounts profile, repository, and public activity views inside the resume.
 * @param {string} username Initial GitHub profile.
 * @param {!ShadowRoot} root Isolated component DOM.
 */
export function mountGithub(username, root) {
  const panel = root.querySelector('#github-section');
  const content = root.querySelector('#gh-content');
  const tabs = root.querySelector('#gh-tabs');
  const context = root.querySelector('#gh-context');
  const back = root.querySelector('#gh-back');
  const history = [];
  let current = null;
  let revision = 0;
  const encode = encodeURIComponent;
  const profileRoute = (owner, tab = 'Overview') => ({kind: 'profile', owner, tab});
  const repoRoute = (name, tab = 'Code') => ({kind: 'repo', name, tab});
  const repoBase = (name) => '/repos/' + name.split('/').map(encode).join('/');

  function navigation(labels, active, action) {
    tabs.replaceChildren(...labels.map((label) => {
      const item = button(label, () => action(label));
      item.setAttribute('aria-current', label === active ? 'page' : 'false');
      return item;
    }));
  }

  function repoCard(repo, compact = false) {
    const card = element('article', '', compact ? 'gh-repo-row' : 'gh-repo-card');
    const title = button(repo.full_name, () => go(repoRoute(repo.full_name)), 'gh-link');
    card.append(title, element('span', 'Public', 'gh-badge'));
    card.append(element('p', repo.description || 'No description provided.'));
    card.append(element('small', `${repo.language || 'Code'}  ·  ☆ ${repo.stargazers_count}  ·  Forks ${repo.forks_count}`));
    return card;
  }

  function pagination(target, route, length) {
    const pager = element('div', '', 'gh-pagination');
    const page = route.page || 1;
    const previous = button('Previous', () => go({...route, page: page - 1}));
    previous.disabled = page === 1;
    const next = button('Next', () => go({...route, page: page + 1}));
    next.disabled = length < PAGE_SIZE;
    pager.append(previous, element('span', `Page ${page}`), next);
    target.append(pager);
  }

  async function profile(route, target) {
    const owner = encode(route.owner);
    const user = await requestGithub(`/users/${owner}`);
    const layout = element('div', '', 'gh-profile');
    const sidebar = element('aside', '', 'gh-profile-sidebar');
    const avatar = element('img');
    avatar.src = `https://avatars.githubusercontent.com/u/${Number(user.id)}?s=400`;
    avatar.alt = `${user.login}'s GitHub avatar`;
    avatar.width = 240;
    avatar.height = 240;
    sidebar.append(avatar, element('h3', user.name || user.login), element('p', user.login, 'gh-username'));
    if (user.bio) sidebar.append(element('p', user.bio));
    sidebar.append(external('Follow on GitHub ↗', `https://github.com/${encode(user.login)}`));
    const people = element('p', '', 'gh-people');
    people.append(button(`${user.followers} followers`, () => go(profileRoute(user.login, 'Followers'))), element('span', ' · '), button(`${user.following} following`, () => go(profileRoute(user.login, 'Following'))));
    sidebar.append(people);
    if (user.location) sidebar.append(element('p', user.location));
    const main = element('div', '', 'gh-profile-main');
    layout.append(sidebar, main);
    target.append(layout);
    if (route.tab === 'Overview') {
      const repos = await requestGithub(`/users/${owner}/repos?sort=updated&per_page=30&page=1`);
      main.append(element('h3', 'Popular repositories', 'gh-section-title'));
      const cards = element('div', '', 'gh-repo-grid');
      for (const repo of [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6)) cards.append(repoCard(repo));
      if (!repos.length) cards.append(element('p', 'No public repositories.'));
      main.append(cards);
      const activity = element('section', '', 'gh-activity');
      main.append(activity);
      try {
        const events = await requestGithub(`/users/${owner}/events/public?per_page=100`);
        activity.append(element('h3', 'Recent public activity', 'gh-section-title'));
        const calendar = element('div', '', 'gh-calendar');
        const days = countEventDays(events);
        for (let offset = 90; offset >= 0; offset--) {
          const date = new Date();
          date.setUTCDate(date.getUTCDate() - offset);
          const key = date.toISOString().slice(0, 10);
          const count = days.get(key) || 0;
          const cell = element('span', '', `gh-day gh-level-${Math.min(count, 4)}`);
          cell.title = `${key}: ${count} returned public events`;
          calendar.append(cell);
        }
        activity.append(calendar, element('p', 'Last 91 days · up to 100 returned public events. This is not the full GitHub contribution graph.', 'gh-note'));
        for (const event of events.slice(0, 8)) {
          const row = element('article', '', 'gh-event');
          const labels = {PushEvent: 'Pushed to', CreateEvent: 'Created', WatchEvent: 'Starred', ForkEvent: 'Forked', IssuesEvent: 'Updated an issue in', PullRequestEvent: 'Updated a pull request in'};
          row.append(element('small', event.created_at.slice(0, 10)), element('p', labels[event.type] || event.type.replace(/Event$/, '')));
          row.append(button(event.repo.name, () => go(repoRoute(event.repo.name)), 'gh-link'));
          activity.append(row);
        }
        if (!events.length) activity.append(element('p', 'No recent public events returned.'));
      } catch (error) {
        activity.append(element('p', error.message, 'gh-note'));
      }
      return;
    }
    const endpoints = {Repositories: 'repos?sort=updated', Stars: 'starred?sort=updated', Followers: 'followers?', Following: 'following?'};
    if (!endpoints[route.tab]) {
      main.append(element('h3', route.tab), element('p', `GitHub does not expose this profile's ${route.tab.toLowerCase()} through this public browser.`), external(`View ${route.tab.toLowerCase()} on GitHub ↗`, `https://github.com/${owner}?tab=${route.tab.toLowerCase()}`));
      return;
    }
    const data = await requestGithub(`/users/${owner}/${endpoints[route.tab]}&per_page=30&page=${route.page || 1}`);
    main.append(element('h3', route.tab, 'gh-section-title'));
    if (route.tab === 'Repositories' || route.tab === 'Stars') {
      const filter = element('input');
      filter.type = 'search';
      filter.placeholder = 'Find a repository…';
      filter.setAttribute('aria-label', 'Filter repositories on this page');
      const results = element('div');
      const render = () => {
        const matches = data.filter((repo) => repo.full_name.toLowerCase().includes(filter.value.toLowerCase()));
        results.replaceChildren(...matches.map((repo) => repoCard(repo, true)));
        if (!matches.length) results.append(element('p', 'No matching repositories on this page.'));
      };
      filter.addEventListener('input', render);
      main.append(filter, results);
      render();
    } else {
      for (const person of data) main.append(button(person.login, () => go(profileRoute(person.login)), 'gh-person'));
      if (!data.length) main.append(element('p', 'No public accounts to display.'));
    }
    pagination(main, route, data.length);
  }

  async function repository(route, target) {
    const base = repoBase(route.name);
    const repo = await requestGithub(base);
    const title = element('div', '', 'gh-repo-title');
    title.append(button(repo.owner.login, () => go(profileRoute(repo.owner.login)), 'gh-link'), element('span', ' / '), button(repo.name, () => go(repoRoute(repo.full_name)), 'gh-link'), element('span', 'Public', 'gh-badge'));
    target.append(title);
    const layout = element('div', '', 'gh-repo-layout');
    const main = element('div', '', 'gh-files');
    const about = element('aside', '', 'gh-about');
    about.append(element('h3', 'About'), element('p', repo.description || 'No description provided.'), element('p', `☆ ${repo.stargazers_count} stars`), element('p', `${repo.forks_count} forks`), element('p', repo.language || 'No language detected'));
    about.append(external('View on GitHub ↗', repo.html_url));
    layout.append(main, about);
    target.append(layout);
    if (route.tab === 'Code') {
      const bar = element('div', '', 'gh-file-toolbar');
      const branches = await requestGithub(`${base}/branches?per_page=100`);
      const select = element('select');
      select.setAttribute('aria-label', 'Repository branch');
      for (const branch of branches) {
        const option = element('option', branch.name);
        option.value = branch.name;
        option.selected = branch.name === (route.branch || repo.default_branch);
        select.append(option);
      }
      select.addEventListener('change', () => go({...route, branch: select.value, path: ''}));
      bar.append(select, button('Commits', () => go({...route, tab: 'Commits', page: 1})), external('Download ZIP ↗', `https://github.com/${route.name}/archive/refs/heads/${encode(route.branch || repo.default_branch)}.zip`));
      main.append(bar);
      const path = route.path || '';
      if (path) main.append(button('← Parent directory', () => go({...route, path: path.split('/').slice(0, -1).join('/')}), 'gh-parent'));
      const data = await requestGithub(`${base}/contents/${path.split('/').map(encode).join('/')}?ref=${encode(route.branch || repo.default_branch)}`);
      if (Array.isArray(data)) {
        const files = element('div', '', 'gh-file-table');
        for (const file of [...data].sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1))) {
          files.append(button(`${file.type === 'dir' ? '▱' : '▤'}  ${file.name}`, () => go({...route, path: file.path}), 'gh-file'));
        }
        if (!data.length) files.append(element('p', 'Empty directory.'));
        main.append(files);
      } else {
        main.append(element('p', path, 'gh-file-path'));
        try {
          const pre = element('pre', decodeFile(data), 'gh-code');
          pre.tabIndex = 0;
          main.append(pre);
        } catch (error) {
          main.append(element('p', error.message));
          if (data.html_url) main.append(external('Open file on GitHub ↗', data.html_url));
        }
      }
      return;
    }
    const endpoint = {Issues: 'issues', 'Pull requests': 'pulls', Commits: 'commits', Releases: 'releases'}[route.tab];
    let path = `${base}/${endpoint}`;
    if (route.item) path += `/${route.item}`;
    else path += `?state=all&per_page=30&page=${route.page || 1}${route.branch && endpoint === 'commits' ? `&sha=${encode(route.branch)}` : ''}`;
    const data = await requestGithub(path);
    if (route.item) {
      main.append(button(`← ${route.tab}`, () => go({...route, item: null}), 'gh-parent'));
      main.append(element('h3', data.title || data.commit?.message || data.name || data.tag_name));
      if (data.body) main.append(element('pre', data.body, 'gh-prose'));
      if (data.files) for (const file of data.files) {
        main.append(element('h4', file.filename), element('pre', file.patch || 'Diff unavailable for this file.', 'gh-code'));
      }
      if (endpoint === 'issues' || endpoint === 'pulls') {
        const comments = await requestGithub(`${base}/issues/${route.item}/comments?per_page=30`);
        for (const comment of comments) {
          const card = element('article', '', 'gh-comment');
          card.append(button(comment.user.login, () => go(profileRoute(comment.user.login)), 'gh-link'), element('pre', comment.body, 'gh-prose'));
          main.append(card);
        }
      }
      if (data.html_url) main.append(external('Continue on GitHub ↗', data.html_url));
      return;
    }
    const items = endpoint === 'issues' ? data.filter((item) => !item.pull_request) : data;
    for (const item of items) {
      const row = element('article', '', 'gh-list-item');
      const text = item.title || item.commit?.message.split('\n')[0] || item.name || item.tag_name;
      if (endpoint === 'releases') {
        row.append(element('h3', text), element('pre', item.body || '', 'gh-prose'), external('Release downloads ↗', item.html_url));
      } else {
        row.append(button(text, () => go({...route, item: item.number || item.sha}), 'gh-link'));
      }
      row.append(element('small', item.sha?.slice(0, 7) || `#${item.number || item.tag_name} · ${item.state || 'Release'}`));
      main.append(row);
    }
    if (!items.length) main.append(element('p', `No ${route.tab.toLowerCase()} on this page.`));
    pagination(main, route, data.length);
  }

  async function search(route, target) {
    const resource = route.tab === 'Users' ? 'users' : 'repositories';
    const data = await requestGithub(`/search/${resource}?q=${encode(route.query)}&per_page=30&page=${route.page || 1}`);
    target.append(element('h3', `${data.total_count} results for “${route.query}”`, 'gh-section-title'));
    for (const item of data.items) {
      target.append(resource === 'users' ? button(item.login, () => go(profileRoute(item.login)), 'gh-person') : repoCard(item, true));
    }
    if (!data.items.length) target.append(element('p', 'No results found.'));
    pagination(target, route, data.items.length);
  }

  async function go(route, remember = true) {
    if (remember && current) history.push(current);
    current = route;
    const active = ++revision;
    back.disabled = !history.length;
    context.textContent = route.owner || route.name || 'Search';
    if (route.kind === 'profile') navigation(['Overview', 'Repositories', 'Projects', 'Packages', 'Stars'], route.tab, (tab) => go(profileRoute(route.owner, tab)));
    else if (route.kind === 'repo') navigation(['Code', 'Issues', 'Pull requests', 'Commits', 'Releases'], route.tab, (tab) => go({...repoRoute(route.name, tab), branch: route.branch}));
    else navigation(['Repositories', 'Users'], route.tab, (tab) => go({...route, tab, page: 1}));
    const result = element('div');
    content.replaceChildren(element('p', 'Loading GitHub…', 'gh-note'));
    try {
      if (route.kind === 'profile') await profile(route, result);
      else if (route.kind === 'repo') await repository(route, result);
      else await search(route, result);
    } catch (error) {
      result.append(element('p', error.message || 'Unable to load GitHub.', 'gh-error'), button('Retry', () => { cache.clear(); go(route, false); }));
    }
    // A slower response must not replace a newer navigation.
    if (active === revision) content.replaceChildren(result);
  }

  panel.addEventListener('github-open', () => {
    if (!current) go(profileRoute(username));
  });
  back.addEventListener('click', () => { if (history.length) go(history.pop(), false); });
  root.querySelector('#gh-home').addEventListener('click', () => go(profileRoute(username)));
  root.querySelector('#gh-refresh').addEventListener('click', () => { cache.clear(); if (current) go(current, false); });
  root.querySelector('#gh-search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const query = root.querySelector('#gh-search').value.trim();
    if (!query) return;
    if (/^[\w.-]+\/[\w.-]+$/.test(query)) go(repoRoute(query));
    else if (/^@[\w-]+$/.test(query)) go(profileRoute(query.slice(1)));
    else go({kind: 'search', query, tab: 'Repositories'});
  });
}
