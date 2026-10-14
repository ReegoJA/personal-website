# Personal website

Reego John-Annaselvan's research portfolio: an expandable resume with a blueprint layout and an integrated [GitHub browser](https://github.com/ReegoJA/repoport).

Created October 12, 2026 / Version 0.3.0

Research and project entries open in place, with each column expanding independently. The site includes keyboard navigation, responsive layouts, and page zoom.

[LastLabel](https://github.com/ReegoJA/lastlabel) is the active-learning research project. SENSORLAB and LUMEN are planned, interactive project demos are not yet included in the website.

## Structure

| Path | Contents |
| --- | --- |
| `dist/index.html` | Resume content and expandable sections |
| `dist/styles.css` | Typography, paper layout, and grid |
| `dist/interactions.css` | Animations, responsive styles, and interactive states |
| `dist/app.js` | Section expansion, email copying, zoom, and GitHub integration |
| `dist/github-theme/` | Bundled GitHub framework and its MIT license |
| `dist/favicon.svg` | Site icon |
| `scripts/`, `tests/` | Development server and API-client tests |

## Credits and references

- [Repoport](https://github.com/ReegoJA/repoport), maintained by Reego John-Annaselvan - MIT-licensed component, no external runtime libraries.
- GitHub - public repository data and profile images through its REST API and avatar service.
- Node.js contributors / OpenJS Foundation - development server and tests, using built-in Node modules.
- Kristories and contributors, [awesome-guidelines](https://github.com/Kristories/awesome-guidelines), Google and contributors, [JavaScript](https://google.github.io/styleguide/jsguide.html) and [HTML/CSS](https://google.github.io/styleguide/htmlcssguide.html) guides - style references.

Research references:

- Bloodgood and Vijay-Shanker, [A Method for Stopping Active Learning Based on Stabilizing Predictions](https://aclanthology.org/W09-1107/).
- Kurlandski and Bloodgood, [Impact of Stop Sets on Stopping Active Learning](https://arxiv.org/abs/2201.05460).
- Elaine Louise Rhoades, *Semiconductor Particle Detector Based on Work Function Modulation*, Georgia Tech dissertation, 2021.
- [PDEBench](https://github.com/pdebench/PDEBench), [DiffTaichi](https://github.com/taichi-dev/difftaichi), and [Pyro optimal experimental design](https://docs.pyro.ai/en/dev/contrib.oed.html).
- Pharr, Jakob, and Humphreys, [Physically Based Rendering, 4th edition](https://www.pbr-book.org/4ed/Introduction).

## License

Portfolio code, design, and personal content: [all rights reserved](LICENSE). The bundled GitHub framework is [MIT-licensed](dist/github-theme/LICENSE).

## History

| Date | Update |
| --- | --- |
| October 12, 2026 | Initial portfolio |
| October 12, 2026 | GitHub browsing and zoom controls |
| October 12, 2026 | Unified entry highlighting, reusable GitHub theme integration, simplified contact line |
| October 12â€“13, 2026 | Resume alignment, GPA update, footer cleanup, and hover refinements |
| October 13, 2026 | STOPLAB scope documented, prior resume wording restored |
