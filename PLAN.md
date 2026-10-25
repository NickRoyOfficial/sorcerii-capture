# Implementation plan

Status: development build 0.2.0 implements milestones 1 to 3. Automated checks cover the contract, hierarchy preservation, native insertion and failure paths. Whole-page edge cases and per-browser verification remain in progress. Readable source CSS width queries now remain scoped to captured elements. Cross-origin stylesheet restrictions and source JavaScript behavior remain limitations.

## User requirements

1. Capture an entire page or a selected section.
2. Preserve the selected root and all supported descendants, their order and parent-child relationships.
3. Prioritize native editable elements and hierarchy over exact visual reproduction.
4. Include explicit source-selection and destination-insertion confirmation.
5. Insert regular elements, without automatic component bindings.
6. Support Opera, Chrome, Edge and Brave. Opera must be specifically verified.
7. SVG conversion is not required for the initial release.

## User workflow

1. Activate the extension on the source website.
2. Choose Entire page or Select section.
3. For section selection, hover to highlight and click to freeze the target. Parent/child controls adjust the selection; Escape cancels.
4. Review the selected root, element count and expandable hierarchy. Choose Capture, Reselect or Cancel.
5. Capture into a local pending item. Report omissions and failures instead of silently truncating the hierarchy.
6. Send the item to a chosen open Sorcerii Studio editor tab.
7. In Sorcerii, review the hierarchy, destination project/page, placement and warnings.
8. Choose Insert elements or Discard. Merely receiving an item must not change the authored page.
9. Insert as one undoable editor operation. A whole-page capture defaults to a new page; a section defaults to a chosen position on the current page.

## Architecture

- **Extension UI and selection overlay:** capture mode, selection review, progress, cancellation and pending captures.
- **Capture engine:** read DOM hierarchy, allowlisted content/attributes and basic layout styles. Exclude executable source and live form values.
- **Versioned capture format:** retain source context, root nodes, child order, styles, asset references and explicit warnings independently of editor identifiers.
- **Native converter:** map supported captures to Sorcerii's existing tree and style schema; allocate fresh IDs and prevent style/HTML-ID collisions.
- **Editor receiver:** validate incoming data, stage it for review and use existing editor transactions for insertion.

The extension and converter live here. Receiver changes live in the existing Sorcerii Studio source repository. Share the format contract across both without duplicating the editor's validation rules.

Use local deterministic conversion for the initial design. No AI API, conversion server or recurring conversion charge is planned.

## Milestones and acceptance

### 1. Native hierarchy proof

Capture a representative section and import it through the existing project JSON path to prove schema compatibility before building a direct bridge.

Verify parent-child relationships and sibling order, editable text/links/images, basic flex/grid layout, fresh identifiers and absence of component bindings. Unsupported SVGs must not prevent surrounding content from importing.

### 2. Selection and confirmation

Add whole-page/section modes, selection adjustment, explicit confirmation, progress and cancellation. Cancellation restores temporary capture UI and does not modify authored source content.

### 3. Editor delivery

Add the direct transfer and Sorcerii review panel. Confirm destination and position before inserting. Test malformed payloads, repeated delivery, stale destinations and failed imports. Do not consume a pending capture until insertion succeeds.

### 4. Whole-page reliability and browser verification

Test long pages, lazy-loaded content, deeply nested trees, inaccessible assets and editor size limits. Preserve partial work only with an explicit warning and user choice.

Verify installation, permissions, capture, transfer, confirmation and undo in each target browser before marking it supported. Automated Chromium checks alone do not establish Opera, Edge or Brave support.

### 5. Visual and responsive improvements

Improve style fidelity after hierarchy is reliable. Prototype breakpoint capture separately; a single-width snapshot must not be labeled a responsive reconstruction. Match Sorcerii's actual breakpoint model and show which widths were captured.

## Deliberate limits

Backend behavior, authentication flows, shopping carts, canvas/WebGL effects and arbitrary source JavaScript are not reconstructed. Complex motion and unavailable assets need explicit handling. No automatic wrapper simplification in the initial release.

## Reference inspection

WP Graft was studied as a workflow reference, including its published extension 1.3.0 and WordPress plugin 1.2.3. Its browser capture is distinct from its server-side builder conversion. Its code also simplifies the source hierarchy, which differs from Sorcerii's default preservation requirement.

Build an original Sorcerii implementation. Do not commit third-party inspection packages, copy their implementation, call their paid conversion service, or assume their private converter is available.

References:
- https://wpgraft.com/
- https://wpgraft.com/releases
- https://wpgraft.com/privacy
