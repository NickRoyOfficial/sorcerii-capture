# Development instructions

Read README.md and PLAN.md before implementation. They describe the agreed scope, planned workflow and current status.

- Preserve the selected root, supported descendants, sibling order and nesting by default. Do not automatically collapse wrappers.
- Support both whole-page and selected-section capture.
- Keep source selection review and destination insertion confirmation explicit.
- Receiving or previewing a capture must not mutate the authored Sorcerii page.
- Use ordinary native elements without automatic component bindings.
- Treat capture data as untrusted. Apply bounded validation, allowlisted attributes/styles and the editor's existing import guards.
- Exclude executable scripts, event-handler attributes and live form values.
- Allocate fresh native IDs and isolate imported styles and HTML identifiers.
- Make insertion one undoable operation. Retain pending data until insertion succeeds; guard against duplicate delivery.
- Restore temporary source-page changes after capture, cancellation and failure.
- Keep normal conversion local and deterministic. Do not add a backend or AI dependency without a concrete requirement.
- Do not mark a browser supported until its installation and full capture/import flow have been verified. Opera is the user's browser.
- Do not imply that current-width computed styles reconstruct unmeasured breakpoints.
- SVG conversion is outside the initial scope; unsupported graphics must not block surrounding hierarchy.
- Keep extension implementation here and editor integration in the existing Sorcerii Studio project.
- Use original implementation code. Do not commit downloaded WP Graft packages or inspection material.
- Add focused hierarchy, cancellation, hostile-input, transfer and undo checks as those behaviors are implemented.
- Keep README status and browser verification status accurate.
