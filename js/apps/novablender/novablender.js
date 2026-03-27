/**
 * Nova OS — NovaBlender App
 * Opens NovaBlender 3D editor in-window and provides a download link.
 */
'use strict';

(function (global) {
  function mount(container) {
    container.style.cssText = 'height:100%;display:flex;flex-direction:column;';
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid var(--luna-border);background:rgba(240,237,232,0.6);flex-shrink:0;">
        <div style="width:20px;height:20px;background:var(--luna-accent);clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);flex-shrink:0"></div>
        <span style="font-weight:600;font-size:13px;color:var(--luna-text)">NovaBlender — Browser 3D Editor</span>
        <span style="margin-left:auto;display:flex;gap:8px">
          <a id="nb-download" href="novablender.html" download="NovaBlender.html"
            style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:99px;font-size:11px;font-weight:500;background:var(--luna-accent);color:#fff;text-decoration:none;border:none;cursor:pointer;transition:background .15s"
            onmouseover="this.style.background='#b06e32'" onmouseout="this.style.background='var(--luna-accent)'">
            ⬇ Download
          </a>
          <a href="novablender.html" target="_blank"
            style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:99px;font-size:11px;font-weight:500;background:var(--luna-surface-2);color:var(--luna-text);text-decoration:none;border:1px solid var(--luna-border);cursor:pointer">
            ↗ Open Full
          </a>
        </span>
      </div>
      <iframe
        src="novablender.html"
        style="flex:1;border:none;width:100%;display:block;"
        title="NovaBlender 3D Editor"
      ></iframe>
    `;
  }

  global.NovaOS.AppLoader.register({
    id: 'novablender', title: 'NovaBlender', width: 900, height: 620,
    mount
  });
})(window);
