async function p(t) {
  let o = await t.getRenderer("vscode.markdown-it-renderer");
  if (!o) throw new Error("Could not load 'vscode.markdown-it-renderer'");
  o.extendMarkdownIt((a) => {
    let d = a.renderer.rules.image;
    a.renderer.rules.image = (e, r, c, i, s) => {
      let m = e[r],
        n = m.attrGet("src"),
        k = i.outputItem.metadata?.attachments;
      if (k && n && n.startsWith("attachment:")) {
        let w = k[g(n.replace("attachment:", ""))];
        if (w) {
          let I = Object.entries(w);
          if (I.length) {
            let [f, u] = I[0],
              h = "data:" + f + ";base64," + u;
            m.attrSet("src", h);
          }
        }
      }
      return d ? d(e, r, c, i, s) : s.renderToken(e, r, c);
    };
  });
}
function g(t) {
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}
export { p as activate };
