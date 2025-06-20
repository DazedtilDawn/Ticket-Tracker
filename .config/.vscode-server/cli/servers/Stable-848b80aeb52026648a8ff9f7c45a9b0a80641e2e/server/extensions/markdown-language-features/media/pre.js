function a() {
  let s = document.getElementById("vscode-markdown-preview-data");
  if (s) {
    let e = s.getAttribute("data-strings");
    if (e) return JSON.parse(e);
  }
  throw new Error("Could not load strings");
}
var i = class {
  constructor(e) {
    this._settingsManager = e;
    this._didShow = !1;
    this._didHaveCspWarning = !1;
    document.addEventListener("securitypolicyviolation", () => {
      this._onCspWarning();
    }),
      window.addEventListener("message", (t) => {
        t &&
          t.data &&
          t.data.name === "vscode-did-block-svg" &&
          this._onCspWarning();
      });
  }
  setPoster(e) {
    (this._messaging = e), this._didHaveCspWarning && this._showCspWarning();
  }
  _onCspWarning() {
    (this._didHaveCspWarning = !0), this._showCspWarning();
  }
  _showCspWarning() {
    let e = a(),
      t = this._settingsManager.settings;
    if (this._didShow || t.disableSecurityWarnings || !this._messaging) return;
    this._didShow = !0;
    let r = document.createElement("a");
    (r.innerText = e.cspAlertMessageText),
      r.setAttribute("id", "code-csp-warning"),
      r.setAttribute("title", e.cspAlertMessageTitle),
      r.setAttribute("role", "button"),
      r.setAttribute("aria-label", e.cspAlertMessageLabel),
      (r.onclick = () => {
        this._messaging.postMessage("showPreviewSecuritySelector", {
          source: t.source,
        });
      }),
      document.body.appendChild(r);
  }
};
var n = class {
  constructor() {
    this._unloadedStyles = [];
    this._finishedLoading = !1;
    let e = (t) => {
      let r = t.target.dataset.source;
      this._unloadedStyles.push(r);
    };
    window.addEventListener("DOMContentLoaded", () => {
      for (let t of document.getElementsByClassName("code-user-style"))
        t.dataset.source && (t.onerror = e);
    }),
      window.addEventListener("load", () => {
        this._unloadedStyles.length &&
          ((this._finishedLoading = !0),
          this._poster?.postMessage("previewStyleLoadError", {
            unloadedStyles: this._unloadedStyles,
          }));
      });
  }
  setPoster(e) {
    (this._poster = e),
      this._finishedLoading &&
        e.postMessage("previewStyleLoadError", {
          unloadedStyles: this._unloadedStyles,
        });
  }
};
function d(s) {
  let e = document.getElementById("vscode-markdown-preview-data");
  if (e) {
    let t = e.getAttribute(s);
    if (t) return t;
  }
  throw new Error(`Could not load data for ${s}`);
}
function l(s) {
  return JSON.parse(d(s));
}
var o = class {
  constructor() {
    this._settings = l("data-settings");
  }
  get settings() {
    return this._settings;
  }
  updateSettings(e) {
    this._settings = e;
  }
};
window.cspAlerter = new i(new o());
window.styleLoadingMonitor = new n();
