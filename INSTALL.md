# Install Sorcerii Capture 0.1.0

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

## Version 0.1 limits

- Captures the loaded DOM at its current browser width. No responsive reconstruction or behavior conversion.
- Optional lazy-loading scroll is bounded. Sites with infinite scrolling or virtualized content may have additional content that was never loaded.
- Maximum 8,000 elements, 36 nested element levels and 6 MB per capture. Oversized selections fail explicitly.
- SVGs, canvases and embedded frames become labeled placeholders. Open/closed shadow-tree internals and pseudo-elements are not imported.
- Images and backgrounds remain linked to their original URLs. Custom font files are not copied. Replace unavailable resources in Sorcerii.
- Live form values, textarea contents, scripts and event handlers are excluded.
- One pending capture at a time. Insert or discard it before capturing again.
- Initial target browsers: Opera, Chrome, Edge and Brave. None is claimed verified merely because they share Chromium.

For updates, replace the files in the installed folder and press Reload on its extension card. Keep the same folder to preserve the extension's development identity and storage.
