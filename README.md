# Sorcerii Capture

Browser extension for capturing an entire web page or a selected section and importing its element hierarchy into Sorcerii Studio.

**Status: development build 0.2.1.** Page/section capture, source width rules, fluid sizing, font references, motion cleanup, local conversion and confirmed editor delivery are implemented. Browser-specific end-to-end verification is pending.

See [INSTALL.md](INSTALL.md) for installation and current limitations.

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

Development distribution uses the permanent GitHub clone or the downloadable unpacked ZIP. See INSTALL.md for installation and updates.

## Development

No runtime or build dependencies are required. Use Node 22+, run `npm ci` to install the DOM test dependency, then `npm test`. Use Python 3 for `npm run package`. The ZIP is written into `artifacts/`. For a source download from GitHub, load its `extension/` folder in the browser. The packaged ZIP has `manifest.json` at its root.

The receiving integration lives in Sorcerii Studio. `extension/shared/capture-format.js` is mirrored there as `public/capture-format.js`; update and test both copies together when the format changes.
