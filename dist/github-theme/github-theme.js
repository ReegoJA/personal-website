import {mountGithub} from './github-browser.js';

const stylesheet = new URL('./github-theme.css', import.meta.url).href;

/**
 * Embeds an isolated public GitHub browser for the requested username.
 * Set loading="lazy" to defer API requests until load() is called.
 */
export class GithubProfile extends HTMLElement {
  static observedAttributes = ['username'];

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.active = false;
    this.ready = false;
  }

  connectedCallback() {
    if (!this.ready) this.render();
  }

  attributeChangedCallback(name, previous, next) {
    if (previous !== next && this.isConnected) this.render();
  }

  /** Starts loading the profile when the component becomes visible. */
  load() {
    this.active = true;
    if (!this.ready) return;
    this.shadowRoot.querySelector('#github-section')?.dispatchEvent(
        new Event('github-open'));
  }

  render() {
    const username = this.getAttribute('username') || 'octocat';
    this.shadowRoot.replaceChildren();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = stylesheet;
    this.shadowRoot.append(link);
    if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)) {
      const error = document.createElement('p');
      error.textContent = 'Enter a valid GitHub username.';
      error.setAttribute('role', 'alert');
      this.shadowRoot.append(error);
      this.ready = false;
      return;
    }
    const template = document.createElement('template');
    template.innerHTML = `
      <section id="github-section" class="gh-shell" aria-label="Public GitHub browser">
        <div class="gh-topbar">
          <button id="gh-back" class="gh-icon" type="button" aria-label="Previous GitHub view" disabled>←</button>
          <button id="gh-home" class="gh-brand" type="button" aria-label="Open initial GitHub profile">GitHub</button>
          <span id="gh-context"></span>
          <form id="gh-search-form" role="search">
            <input id="gh-search" type="search" aria-label="Search GitHub repositories or enter owner/repository" placeholder="Search or jump to…">
            <button type="submit" aria-label="Search GitHub">⌕</button>
          </form>
          <a class="gh-login" href="https://github.com/login" target="_blank" rel="noopener noreferrer">Sign in ↗</a>
        </div>
        <nav id="gh-tabs" class="gh-tabs" aria-label="GitHub sections"></nav>
        <div id="gh-content" class="gh-content" aria-live="polite"></div>
        <div class="gh-bottom"><span>Public GitHub view</span><button id="gh-refresh" type="button">Refresh</button></div>
      </section>`;
    this.shadowRoot.append(template.content.cloneNode(true));
    this.shadowRoot.querySelector('#gh-context').textContent = username;
    mountGithub(username, this.shadowRoot);
    this.ready = true;
    if (this.active || this.getAttribute('loading') !== 'lazy') this.load();
  }
}

if (!customElements.get('github-profile')) {
  customElements.define('github-profile', GithubProfile);
}
