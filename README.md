# Sorcerii Capture

Browser extension for capturing an entire web page or a selected section and importing its element hierarchy into Sorcerii Studio.

**Status: planning.** This repository does not yet contain an installable extension.

## Scope

- Capture a whole page or a selected element with all its descendants.
- Preserve element order, nesting, text and basic layout styles.
- Review and confirm the source selection before capture.
- Review the destination and confirm insertion inside Sorcerii.
- Import ordinary, independently editable elements. Component creation remains explicit.
- Support Opera, Chrome, Edge and Brave through one Chromium codebase, with browser-specific verification.
- Keep SVG conversion outside the initial scope.

## Repository boundaries

This repository owns the extension, capture format, conversion code and extension checks. The existing Sorcerii Studio project owns the receiver UI and editor transactions.

Normal capture and conversion are planned to run locally. A server conversion service or AI API is not part of the initial design.

See [PLAN.md](PLAN.md) for the workflow, milestones and acceptance criteria.

## Browser status

| Browser | Intended support | Verified |
| --- | --- | --- |
| Opera | Initial release; primary user browser | No |
| Chrome | Initial release | No |
| Edge | Initial release | No |
| Brave | Initial release | No |
| Firefox | Later compatibility pass | No |
| Safari | Outside initial scope | No |

Initial distribution will be a downloadable unpacked extension. Installation instructions and release packages will be added once a working build has passed checks.
