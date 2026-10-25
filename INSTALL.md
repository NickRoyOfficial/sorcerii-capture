# Install Sorcerii Capture 0.2.1

This is an unpacked development build. Browser-specific end-to-end verification is still pending.

1. Download the version ZIP and extract it into a permanent folder.
2. Open your browser's extension manager:
   - Opera: `opera://extensions`
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Enable Developer mode, choose Load unpacked, and select the extracted folder containing `manifest.json`.
4. Pin Sorcerii Capture to the toolbar if desired.
5. Open the source website and choose Select a section or Entire page.
6. Review the root and hierarchy, then press Confirm capture.
7. Open Sorcerii Studio in another tab, reopen the extension, and send to that tab.
8. Review the destination and insertion position inside Sorcerii, then insert.

If direct delivery cannot reach the editor, reload the editor tab and retry. Download JSON is a portable fallback; use Sorcerii's Import project action to review the capture.

The extension requests access to the page you activate it on and the named Sorcerii editor domains. It has no conversion server, AI API, broad all-sites permission or background browsing tracker. Capture content remains in local extension storage until you insert or discard it. Download a backup before clearing browser data or uninstalling.

## Version 0.2 behavior and limits

- Retains readable authored widths, percentages, auto sizing, CSS variables and width media queries. Source rules retain their own boundaries, including 479px/767px/991px. Sorcerii class/element edits override imported defaults.
- Blocked stylesheets, container/layer rules, non-width media conditions, pseudo-elements and JavaScript-driven layouts are reported as limitations. This is not a complete runtime clone.
- Recognized split-text reveal effects can be finished before import. The source DOM is not modified. Hidden menus and unrelated layout transforms remain intact.
- Optional lazy-loading scroll is bounded. Sites with infinite scrolling or virtualized content may have additional content that was never loaded.
- Maximum 8,000 elements, 36 nested element levels and 6 MB per capture. Oversized selections fail explicitly.
- SVGs, canvases and embedded frames become labeled placeholders. Open/closed shadow-tree internals and pseudo-elements are not imported.
- Images, backgrounds, video sources and available font faces remain linked to their original URLs. Google Fonts stylesheet references are retained. Font files are not downloaded into project assets. Replace unavailable resources in Sorcerii.
- Live form values, textarea contents, scripts and event handlers are excluded.
- One pending capture at a time. Insert or discard it before capturing again.
- Initial target browsers: Opera, Chrome, Edge and Brave. None is claimed verified merely because they share Chromium.

## Updating your permanent GitHub clone

1. In GitHub Desktop, select sorcerii-capture and click Fetch origin, then Pull origin when available.
2. In Opera, open opera://extensions and click Reload on Sorcerii Capture.
3. Refresh any source website and Sorcerii tabs that were already open.
4. Open the extension to confirm its version reads 0.2.1.

Load the clone's extension/ folder once. Keep that folder in place so future pulls update the installed files without reinstalling. Other Chromium browsers follow the same steps in their extension manager.

Development extensions cannot silently replace their executable code. Pull and Reload are required until a signed browser-store release supplies browser-managed updates.

Capture the source again after this update. Old 0.1 files remain importable, but contain no source breakpoint rules to recover. Clear or download an older pending capture before making a new one. JSON downloads now contain a compact capture envelope rather than two copies of the element tree.
