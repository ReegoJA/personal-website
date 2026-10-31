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
| `dist/notes.js`, `dist/papers.js` | Paper-attached prompts and sheet transitions |
| `dist/fonts/` | Caveat handwriting font and OFL license |
| `dist/resume.html`, `dist/Resume.pdf` | Printable resume source and current download |
| `dist/research-demos.js`, `dist/research-demos.css` | Saved-experiment replay and research visuals |
| `dist/assets/` | Public experiment excerpts, original diagrams, and rendered images |
| `dist/favicon.svg` | Site icon |
| `scripts/`, `tests/` | Development server and API-client tests |

## Credits and references

- [Caveat](https://github.com/googlefonts/caveat), the Caveat Project Authors - bundled handwriting font under the SIL Open Font License 1.1.

- [Repoport](https://github.com/ReegoJA/repoport), maintained by Reego John-Annaselvan - MIT-licensed component, no external runtime libraries.
- GitHub - public repository data and profile images through its REST API and avatar service.
- Node.js contributors / OpenJS Foundation - development server and tests, using built-in Node modules.
- Kristories and contributors, [awesome-guidelines](https://github.com/Kristories/awesome-guidelines), Google and contributors, [JavaScript](https://google.github.io/styleguide/jsguide.html) and [HTML/CSS](https://google.github.io/styleguide/htmlcssguide.html) guides - style references.

Research references:

The LastLabel demo presents all six tasks from the main-study comparison: 30 matched seeds, linear SVM, uncertainty sampling, 15% symmetric noise, SP, initially confident versus fixed checking samples. Values and paired intervals are extracted from the committed summary and paired tables. The data file records their SHA-256 hashes. Results include adverse effects, small effects, and shared-budget fallbacks.

The SP and GaN diagrams are original explanatory illustrations, not reproduced figures or experimental results. The GaN image contains no private project data. LUMEN's image is an actual CPU render from the [renderer](https://github.com/ReegoJA/lumen).

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

| October 14, 2026 | Last Label naming, resume download, margin prompts, and interaction fixes |

| October 14, 2026 | Paper-attached handwritten prompts and personal-interest sheet transitions |
| October 14, 2026 | Collapse open content before paper switches and refine stationary prompts |
| October 26, 2026 | Repository-backed project descriptions, research figures, and refreshed resume download |
| October 26, 2026 | LastLabel experiment replay and original active-learning and GaN diagrams |

| October 27, 2026 | Simplified research demonstrations, rendered light animation, and confirmed Nano PV experience |

| October 27, 2026 | Task-based research findings and expanded technologies |

| October 27, 2026 | Direct light-position slider using 13 rendered positions |

| October 30, 2026 | SENSORLAB project description, research interests, and GPA formatting |
