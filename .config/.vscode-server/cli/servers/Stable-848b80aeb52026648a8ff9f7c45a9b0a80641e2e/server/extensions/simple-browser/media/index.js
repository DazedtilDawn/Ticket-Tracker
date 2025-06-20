function s(e) {
  document.readyState === "loading" || document.readyState === "uninitialized"
    ? document.addEventListener("DOMContentLoaded", e)
    : e();
}
var d = acquireVsCodeApi();
function l() {
  let e = document.getElementById("simple-browser-settings");
  if (e) {
    let t = e.getAttribute("data-settings");
    if (t) return JSON.parse(t);
  }
  throw new Error("Could not load settings");
}
var r = l(),
  c = document.querySelector("iframe"),
  o = document.querySelector(".header"),
  a = o.querySelector(".url-input"),
  m = o.querySelector(".forward-button"),
  g = o.querySelector(".back-button"),
  L = o.querySelector(".reload-button"),
  E = o.querySelector(".open-external-button");
window.addEventListener("message", (e) => {
  switch (e.data.type) {
    case "focus": {
      c.focus();
      break;
    }
    case "didChangeFocusLockIndicatorEnabled": {
      i(e.data.enabled);
      break;
    }
  }
});
s(() => {
  setInterval(() => {
    let t = document.activeElement?.tagName === "IFRAME";
    document.body.classList.toggle("iframe-focused", t);
  }, 50),
    c.addEventListener("load", () => {}),
    a.addEventListener("change", (t) => {
      let n = t.target.value;
      e(n);
    }),
    m.addEventListener("click", () => {
      history.forward();
    }),
    g.addEventListener("click", () => {
      history.back();
    }),
    E.addEventListener("click", () => {
      d.postMessage({ type: "openExternal", url: a.value });
    }),
    L.addEventListener("click", () => {
      e(a.value);
    }),
    e(r.url),
    (a.value = r.url),
    i(r.focusLockIndicatorEnabled);
  function e(t) {
    try {
      let n = new URL(t),
        u = new URLSearchParams(location.search);
      n.searchParams.append("id", u.get("id")),
        n.searchParams.append("vscodeBrowserReqId", Date.now().toString()),
        (c.src = n.toString());
    } catch {
      c.src = t;
    }
    d.setState({ url: t });
  }
});
function i(e) {
  document.body.classList.toggle("enable-focus-lock-indicator", e);
}
