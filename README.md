# Personal website

An expandable research resume for Reego John-Annaselvan.

Created: 2026-10-12. Current release: 0.2.0.

## Goal

Present education, research, industry experience, and planned projects in a single blueprint-style page. Entries expand in place, public GitHub code and activity can be explored without changing the page.

## Status

The website interface is implemented. STOPLAB, SENSORLAB, and LUMEN are planned projects. Research visualizations and demos are deliberately empty placeholders. The site does not present placeholder images or simulated benchmarks as completed results.

The GitHub panel starts on the owner's public profile. It supports public profiles, repository search, user search, stars, followers, following, branches, directory navigation, text files, issues and comments, pull requests, commit diffs, releases, and paginated lists. Enter `owner/repository` to jump to a repository, or `@username` to open a profile.

This is a themed public REST API client, not the GitHub website or an authenticated session. Sign in opens GitHub's actual login page in a separate tab. Projects, packages, release downloads, and unsupported files link to GitHub. API rate limits and data availability apply. The activity calendar counts only returned public events, it does not claim to reproduce the contribution graph. File content and Markdown are displayed as plain text.

The paper initially fits approximately 86% of a desktop window. The fixed grid-pattern minus and plus buttons adjust its scale. Narrow screens use a single column. Hovering over bullets highlights the matching title, only a click or keyboard activation opens an entry.

## Download and run

Download the repository ZIP and extract it, or clone `https://github.com/ReegoJA/personal-website.git` .

Install Node.js 22 or later from its official distribution. No package installation or build step is required.

```sh
cd personal-website
npm start
```

Open `http://127.0.0.1:4173`. Serve `dist/` rather than opening its HTML with a file URL, because the scripts use browser modules. Stop the server with Ctrl+C.

```sh
npm test
```


## Files

| File | Purpose |
| --- | --- |
| `dist/index.html` | Semantic resume content, expandable sections, placeholders, sources |
| `dist/styles.css` | Original resume typography, paper, palette, and grid |
| `dist/interactions.css` | Expansion, margin prompts, repository panel, responsive and motion styles |
| `dist/app.js` | Click expansion, margin prompts, email copying, page zoom, GitHub initialization |
| `dist/github.js` | Public API requests, profile and repository routing, search, activity, file decoding |
| `dist/favicon.svg` | Original vector lettermark |
| `scripts/serve.js` | Local static server limited to `dist/` |
| `tests/github.test.js` | UTC activity counts, UTF-8, file limits, rate limits, and cache checks |
| `package.json` | Project metadata and local commands, no dependencies |
| `.editorconfig` | Two-space indentation and UTF-8/LF conventions |
| `.gitignore` | Excludes dependencies, secrets, local hosting state, and QA images |
| `README.md` | Project goal, usage, file map, credits, limitations, history |
| `CONTRIBUTING.md` | Editing, style, validation, and commit conventions |
| `LICENSE` | Current rights statement, no open-source license selected yet |

Only `dist/` is served. Repository documentation is not part of the website's deployed assets.

## Coding conventions

The user-selected [awesome-guidelines](https://github.com/Kristories/awesome-guidelines) directory led to [Google's JavaScript guide](https://google.github.io/styleguide/jsguide.html) and [HTML/CSS guide](https://google.github.io/styleguide/htmlcssguide.html). The JavaScript guide is archived but provides the requested conventions for this small, buildless JavaScript project.

Use two spaces, semicolons, single-quoted JavaScript strings, named ES exports, lowerCamelCase functions and variables, and descriptive lowercase filenames. Keep exported-function documentation concise. CSS uses semantic hyphenated class names. Short CSS rules and static HTML content use compact formatting intentionally, no claim of mechanically certified Google-style compliance is made.

## Dependencies, credits, and people

There are **no third-party runtime libraries** and no remotely loaded fonts, analytics, or UI frameworks. Profile avatars load from GitHub when its panel is opened.

| Resource | Maintainer / creator | Role / license |
| --- | --- | --- |
| HTML, CSS, JavaScript and browser APIs | Web standards and browser implementers | Native platform features, no library copied |
| Node.js | OpenJS Foundation and Node.js contributors | Local server and tests, MIT with bundled third-party notices |
| GitHub REST API | GitHub | Optional public repository data, GitHub service terms apply |
| awesome-guidelines | Kristories and contributors | Reference directory, CC0-1.0 |
| Google style guides | Google and contributors | Style reference, CC BY 3.0 for guide text, no guide text/code copied |
| Blueprint visual direction | Reego John-Annaselvan's resume concept | Adapted layout and original CSS/SVG |
| Site requirements and research context | Reego John-Annaselvan | Project owner and content reviewer |

The research libraries below are references or planned project technologies, **not dependencies of this website**. Quantum ESPRESSO (Quantum ESPRESSO Foundation/contributors, GPL), LAMMPS (Sandia National Laboratories/contributors, GPL), PyTorch (PyTorch Foundation/contributors, BSD-style), JAX (JAX contributors, Apache-2.0), scikit-learn (contributors, BSD-3-Clause), and SciPy (contributors, BSD-3-Clause) retain their own licenses. Check exact versions and bundled notices when those projects are implemented. CUDA is governed by NVIDIA's terms, OpenGL is a graphics API, not a bundled library here.

No advisor, company, or paper author is credited as a contributor to this website unless they actually contribute. Research relationships do not imply endorsement of this code.

## Sources

- Active learning: Bloodgood and Vijay-Shanker, [A Method for Stopping Active Learning Based on Stabilizing Predictions](https://aclanthology.org/W09-1107/).
- Active learning: Kurlandski and Bloodgood, [Impact of Stop Sets on Stopping Active Learning](https://arxiv.org/abs/2201.05460).
- VIP: Elaine Louise Rhoades, *Semiconductor Particle Detector Based on Work Function Modulation*, Georgia Tech dissertation, 2021, supplied by the project owner.
- VIP: Current-semester subteam work overview supplied by the project owner, atomistic-to-electronic workflow and roadmap.
- SENSORLAB: [PDEBench](https://github.com/pdebench/PDEBench), [DiffTaichi](https://github.com/taichi-dev/difftaichi), [Pyro optimal experimental design](https://docs.pyro.ai/en/dev/contrib.oed.html).
- LUMEN: Pharr, Jakob, and Humphreys, [Physically Based Rendering, 4th edition](https://www.pbr-book.org/4ed/Introduction).
- GitHub: [CORS](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests), [repository contents](https://docs.github.com/en/rest/repos/contents), and [rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).

Papers and uploaded research documents are referenced, not redistributed in this repository. Their authors retain their rights.

## Privacy, security, and accessibility

GitHub requests start only when the visitor opens the repository section. Requests go directly from the visitor's browser to GitHub, which receives normal network metadata. No tokens, tracking, or persistent storage are used. Profile images are requested from avatars.githubusercontent.com. GitHub's unauthenticated limits apply, the panel reports failures and offers refresh and retry controls.

Repository strings are inserted as text, never evaluated as HTML. File previews reject binary content and files larger than 250 KB. Entries open only on click or keyboard activation. Hover and focus show prompts outside the paper when sufficient margin space exists. Email clicks copy the address. Custom disclosure controls support Enter and Space, the collapsed resume remains readable without JavaScript. Focus indicators, a skip link, labeled controls, and reduced-motion preferences are included.

External research references open in a new tab. Core resume exploration and supported GitHub reading stay on this page.

## Deployment

For any static host, publish the contents of `dist/`. Hosting configuration is managed separately from this public source repository.

Do not put credentials in frontend files. A future authenticated GitHub integration would require a separate server-side design and explicit access decisions.

## Licensing

No open-source license has been selected by the owner. `LICENSE` records this explicitly. Public availability is not a general license to reuse the original code or personal content. Third-party references retain their respective licenses. The owner may choose an appropriate software license later.

## Update history

### 2026-10-12 - 0.1.0

Initial implementation, commit/push message:

```text
push local backup
```

Push status and actual commit identifiers should be taken from Git history, this entry describes the prepared release and does not invent a completed remote push. Subsequent updates should append their actual date and concise bullet-style commit message here.

### 2026-10-12 - 0.2.0

Commit/push message: `push local copy 2`

- Profile-first GitHub environment and public browsing routes
- Responsive default paper scale and grid-pattern zoom controls
- Shared bullet/title hover highlighting
- Hosting configuration separated from the public source

Validation: five unit tests, browser checks for profile, repository files, keyboard expansion, independent columns, zoom, and mobile layout. GitHub-only features are linked rather than simulated.
