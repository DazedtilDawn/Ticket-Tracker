(() => {
  "use strict";
  var e = {
      d: (t, n) => {
        for (var o in n)
          e.o(n, o) &&
            !e.o(t, o) &&
            Object.defineProperty(t, o, { enumerable: !0, get: n[o] });
      },
      o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
      r: (e) => {
        "undefined" != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
          Object.defineProperty(e, "__esModule", { value: !0 });
      },
    },
    t = {};
  e.r(t), e.d(t, { activate: () => J, deactivate: () => _ });
  const n = require("vscode"),
    o = async (e, t) => {
      const n = (function (e = 32) {
        let t = "";
        for (let n = 0; n < e; n++)
          t += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[
            Math.floor(62 * Math.random())
          ];
        return t;
      })();
      return `<!DOCTYPE html>\n    <html lang="en">\n    <head>\n      <meta charset="UTF-8">\n      <meta name="viewport" content="width=device-width, initial-scale=1.0">\n      ${((e) => `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${e}';">`)(n)}\n      <title>Profile Custom Editor</title>\n    </head>\n    <body>\n      <script type="text/javascript" nonce="${n}">\n        ${Object.entries(
        t,
      )
        .map(([e, t]) => `globalThis.${e} = ${JSON.stringify(t)}`)
        .join(
          ";",
        )}\n      <\/script>\n      <script nonce="${n}" src="${e}"><\/script>\n    </body>\n    </html>\n  `;
    },
    s = require("os"),
    i = require("path");
  class r {
    static {
      this.scheme = "js-viz-download";
    }
    async provideTextDocumentContent(e) {
      return n.window.withProgress(
        {
          location: n.ProgressLocation.Notification,
          title: `Retrieving ${e.query}...`,
        },
        async () => {
          try {
            const t = await fetch(e.query, {}),
              n = await t.text();
            return t.ok ? n : `Unexpected ${t.status} from ${e.query}: ${n}`;
          } catch (e) {
            return e.message;
          }
        },
      );
    }
  }
  function a(e, t) {
    return i.posix?.isAbsolute(e)
      ? i.posix.relative(e, t)
      : i.win32?.isAbsolute(e)
        ? i.win32.relative(e, t)
        : i.relative(e, t);
  }
  let c = "undefined" != typeof process && "win32" !== process.platform;
  function l(e) {
    return c ? e : e.toLowerCase();
  }
  function u(e) {
    return e.startsWith("file:///")
      ? ((e = e.replace("file:///", "")),
        "/" === (e = decodeURIComponent(e))[0] ||
          e.match(/^[A-Za-z]:/) ||
          (e = "/" + e),
        m(e) && (e = e[0].toLowerCase() + e.substr(1)),
        e)
      : e;
  }
  const m = (e) => /^[A-Za-z]:/.test(e),
    d = async (e) => {
      try {
        const t = g(e);
        return 0 === t.type || (await n.workspace.fs.stat(t.uri)), !0;
      } catch {
        return !1;
      }
    },
    h = async ({ rootPath: e, location: t, viewColumn: o, callFrame: s }) => {
      (t && (await w(e, t, o))) ||
        (s && (await f(s, o))) ||
        n.window.showErrorMessage("Could not find the file in your workspace");
    },
    p = async (e, t, o, s) => {
      const i = new n.Position(Math.max(0, t - 1), Math.max(0, o - 1));
      await n.window.showTextDocument(e, {
        viewColumn: s,
        selection: new n.Range(i, i),
      });
    },
    w = async (e, t, o) => {
      const s = v(e, t.source),
        i = (await Promise.all(s.map(d))).findIndex((e) => e);
      if (-1 === i) return !1;
      const r = g(s[i]);
      if (0 === r.type)
        return (
          await ((a = r), n.commands.executeCommand(a.command, ...a.args)), !0
        );
      var a;
      const c = await n.workspace.openTextDocument(r.uri);
      return await p(c, t.lineNumber, t.columnNumber, o), !0;
    },
    f = async ({ url: e, lineNumber: t, columnNumber: o }, a) => {
      let c;
      try {
        c = new URL(e);
      } catch {
        return !1;
      }
      if ("http:" !== c.protocol && "https:" !== c.protocol) return !1;
      const l = (0, i.resolve)(
          n.workspace.workspaceFolders?.[0].uri.fsPath ?? (0, s.tmpdir)(),
          c.pathname.slice(1) || "index.js",
        ),
        u = await n.workspace.openTextDocument(
          n.Uri.file(l).with({ scheme: r.scheme, query: e }),
        );
      return await p(u, t + 1, o + 1, a), !0;
    },
    g = (e) => {
      const t = e?.match(/^command:([\w\.]+)(?:\?(.*))?/);
      if (t) {
        const [e, n] = t.slice(1),
          o = n ? JSON.parse(decodeURIComponent(n)) : [];
        return { type: 0, command: e, args: Array.isArray(o) ? o : [o] };
      }
      return e?.match(/\w\w+:/)
        ? { type: 1, uri: n.Uri.parse(e || ""), isFile: !1 }
        : { type: 1, uri: n.Uri.file(e || ""), isFile: !0 };
    },
    v = (e, t) => {
      if (!t.path) return [];
      const o = g(t.path),
        s = [t.path];
      if (!e || 0 === o.type || !o.isFile) return s;
      for (const o of n.workspace.workspaceFolders ?? [])
        s.push((0, i.resolve)(o.uri.fsPath, a(e, t.path)));
      return s;
    };
  class b {
    constructor(e, t) {
      (this.uri = e), (this.userData = t);
    }
    dispose() {}
  }
  function y(e, t, o, s) {
    return (function (o, i) {
      if (!o || n.extensions.all.some((e) => e.id === o))
        return n.commands.executeCommand(
          "vscode.openWith",
          e,
          t,
          s ? n.ViewColumn.Beside : n.ViewColumn.Active,
        );
      n.commands.executeCommand(
        "workbench.extensions.action.showExtensionsWithIds",
        [o],
      );
    })(o);
  }
  const C = Symbol("unset"),
    x = /[^/\\]+$/,
    S = (e) => x.exec(e)?.[0] ?? e;
  class F {
    constructor() {
      this.basenamesToExpand = new Map();
    }
    add(e, t) {
      const o = ((e) => {
        let t = C;
        return () => (t === C && (t = e()), t);
      })(() => {
        const o = new Set(),
          s = new n.Position(
            Math.max(0, t.callFrame.lineNumber),
            Math.max(0, t.callFrame.columnNumber),
          );
        o.add(`${t.callFrame.url}/${s.line}`), this.set(t.callFrame.url, s, t);
        const i = t.src;
        if (
          i &&
          0 === i.source.sourceReference &&
          i.source.path &&
          i.source.path !== t.callFrame.url
        )
          for (const s of v(e, i.source)) {
            const e = new n.Position(
                Math.max(0, i.lineNumber - 1),
                Math.max(0, i.columnNumber - 1),
              ),
              r = `${s}/${e.line}`;
            o.has(r) || (o.add(r), this.set(s, e, t));
          }
      });
      this.addExpansionFn(S(t.callFrame.url), o),
        t.src?.source.path && this.addExpansionFn(S(t.src.source.path), o);
    }
    addExpansionFn(e, t) {
      let n = this.basenamesToExpand.get(e);
      n || ((n = []), this.basenamesToExpand.set(e, n)), n.push(t);
    }
    expandForFile(e) {
      const t = S(e),
        n = this.basenamesToExpand.get(t);
      if (n) {
        for (const e of n) e();
        this.basenamesToExpand.delete(t);
      }
    }
  }
  const T = new Intl.NumberFormat(void 0, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  class D extends F {
    constructor() {
      super(...arguments), (this.data = new Map());
    }
    set(e, t, o) {
      let s = this.data.get(l(e));
      s || ((s = []), this.data.set(l(e), s));
      let i = 0;
      for (; i < s.length && s[i].position.line < t.line; ) i++;
      if (s[i]?.position.line === t.line) {
        const e = s[i];
        t.character < e.position.character &&
          (e.position = new n.Position(t.line, t.character)),
          (e.data.aggregateTime += o.aggregateTime),
          (e.data.selfTime += o.selfTime),
          (e.data.ticks += o.ticks);
      } else
        s.splice(i, 0, {
          position: new n.Position(t.line, t.character),
          data: {
            aggregateTime: o.aggregateTime,
            selfTime: o.selfTime,
            ticks: o.ticks,
          },
        });
    }
    getLensesForFile(e) {
      return (
        this.expandForFile(e),
        this.data
          .get(l(e))
          ?.map(({ position: e, data: t }) => {
            if (0 === t.aggregateTime && 0 === t.selfTime) return [];
            const o = new n.Range(e, e);
            return [
              new n.CodeLens(o, {
                title: `${T.format(t.selfTime / 1e3)}ms Self Time, ${T.format(t.aggregateTime / 1e3)}ms Total`,
                command: "",
              }),
              new n.CodeLens(o, {
                title: "Clear",
                command: "extension.jsProfileVisualizer.table.clearCodeLenses",
              }),
            ];
          })
          .reduce((e, t) => [...e, ...t], []) ?? []
      );
    }
  }
  const P = (e, t) => (
      (e.functionName = e.functionName || "(anonymous)"),
      e.lineNumber < 0 ? 0 : e.url.includes("node_modules") || !t ? 2 : 1
    ),
    k = (e, t) =>
      t.source.path && 0 === t.source.sourceReference
        ? { ...t, relativePath: a(e, t.source.path) }
        : t,
    z = (e, t = []) => {
      if (!e.$vscode?.rootPath) return t[0];
      for (const n of t) {
        const t = k(e.$vscode.rootPath, n);
        if (t.relativePath) return t;
      }
      return t[0];
    },
    N = (e, t) => {
      const n = t[e];
      if (n.aggregateTime) return n.aggregateTime;
      let o = n.selfTime;
      for (const e of n.children) o += N(e, t);
      return (n.aggregateTime = o);
    };
  class E {
    constructor(e, t, o = {}) {
      (this.lens = e),
        (this.bundle = t),
        (this.extraConsts = o),
        (this.onDidChangeCustomDocument = new n.EventEmitter().event);
    }
    async openCustomDocument(e) {
      const t = await n.workspace.fs.readFile(e),
        o = JSON.parse(new TextDecoder().decode(t)),
        s = new b(
          e,
          ((e) => {
            if (!e.timeDeltas || !e.samples)
              return {
                nodes: [],
                locations: [],
                samples: e.samples || [],
                timeDeltas: e.timeDeltas || [],
                rootPath: e.$vscode?.rootPath,
                duration: e.endTime - e.startTime,
              };
            const { samples: t, timeDeltas: n } = e,
              o = ((e) => {
                if (e.$vscode) return e.$vscode.locations;
                let t = 0;
                const n = new Map(),
                  o = (e) => {
                    const o = [
                        e.functionName,
                        e.url,
                        e.scriptId,
                        e.lineNumber,
                        e.columnNumber,
                      ].join(":"),
                      s = n.get(o);
                    if (s) return s.id;
                    const i = t++;
                    return (
                      n.set(o, {
                        id: i,
                        callFrame: e,
                        location: {
                          lineNumber: e.lineNumber + 1,
                          columnNumber: e.columnNumber + 1,
                          source: {
                            name: u(e.url),
                            path: u(e.url),
                            sourceReference: 0,
                          },
                        },
                      }),
                      i
                    );
                  };
                for (const t of e.nodes)
                  (t.locationId = o(t.callFrame)),
                    (t.positionTicks = t.positionTicks?.map((e) => ({
                      ...e,
                      startLocationId: o({
                        ...t.callFrame,
                        lineNumber: e.line - 1,
                        columnNumber: 0,
                      }),
                      endLocationId: o({
                        ...t.callFrame,
                        lineNumber: e.line,
                        columnNumber: 0,
                      }),
                    })));
                return [...n.values()]
                  .sort((e, t) => e.id - t.id)
                  .map((e) => ({
                    locations: [e.location],
                    callFrame: e.callFrame,
                  }));
              })(e).map((t, n) => {
                const o = z(e, t.locations);
                return {
                  id: n,
                  selfTime: 0,
                  aggregateTime: 0,
                  ticks: 0,
                  category: P(t.callFrame, o),
                  callFrame: t.callFrame,
                  src: o,
                };
              }),
              s = new Map(),
              i = (e) => {
                let t = s.get(e);
                return void 0 === t && ((t = s.size), s.set(e, t)), t;
              },
              r = new Array(e.nodes.length);
            for (let t = 0; t < e.nodes.length; t++) {
              const n = e.nodes[t],
                s = i(n.id);
              r[s] = {
                id: s,
                selfTime: 0,
                aggregateTime: 0,
                locationId: n.locationId,
                children: n.children?.map(i) || [],
              };
              for (const e of n.positionTicks || [])
                e.startLocationId && (o[e.startLocationId].ticks += e.ticks);
            }
            for (const e of r) for (const t of e.children) r[t].parent = e.id;
            const a = e.endTime - e.startTime;
            let c = a - n[0];
            for (let e = 0; e < n.length - 1; e++) {
              const o = n[e + 1];
              (r[i(t[e])].selfTime += o), (c -= o);
            }
            r.length && ((r[i(t[n.length - 1])].selfTime += c), n.push(c));
            for (let e = 0; e < r.length; e++) {
              const t = r[e],
                n = o[t.locationId];
              (n.aggregateTime += N(e, r)), (n.selfTime += t.selfTime);
            }
            return {
              nodes: r,
              locations: o,
              samples: t.map(i),
              timeDeltas: n,
              rootPath: e.$vscode?.rootPath,
              duration: a,
            };
          })(o),
        ),
        i = new D(),
        r = s.userData.rootPath;
      for (const e of s.userData.locations) i.add(r, e);
      return this.lens.registerLenses(i), s;
    }
    async resolveCustomEditor(e, t) {
      t.webview.onDidReceiveMessage((t) => {
        switch (t.type) {
          case "openDocument":
            return void h({
              rootPath: e.userData?.rootPath,
              viewColumn: t.toSide ? n.ViewColumn.Beside : n.ViewColumn.Active,
              callFrame: t.callFrame,
              location: t.location,
            });
          case "reopenWith":
            return void y(e.uri, t.viewType, t.requireExtension);
          default:
            console.warn(`Unknown request from webview: ${JSON.stringify(t)}`);
        }
      }),
        (t.webview.options = { enableScripts: !0 }),
        (t.webview.html = await o(t.webview.asWebviewUri(this.bundle), {
          MODEL: e.userData,
          ...this.extraConsts,
        }));
    }
    async saveCustomDocument() {}
    async revertCustomDocument() {}
    async backupCustomDocument() {
      return { id: "", delete: () => {} };
    }
    saveCustomDocumentAs(e, t) {
      return n.workspace.fs.copy(e.uri, t, { overwrite: !0 });
    }
  }
  function $(e, t) {
    if (!e || n.extensions.all.some((t) => t.id === e)) return t();
    n.commands.executeCommand(
      "workbench.extensions.action.showExtensionsWithIds",
      [e],
    );
  }
  const j = require("worker_threads");
  class M {
    constructor(e, t) {
      (this.uri = e), (this.value = t);
    }
    dispose() {
      this.value.dispose();
    }
  }
  const L = (globalThis.__jsHeapSnapshotWorkers ??= new (class {
      constructor() {
        this.workers = new Map();
      }
      async create(e) {
        let t = this.workers.get(e.with({ query: "" }).toString());
        if (!t) {
          const o = await (async (e) => {
            const t = new j.Worker(`${__dirname}/heapsnapshotWorker.js`, {
              workerData:
                "file" === e.scheme
                  ? e.fsPath
                  : await n.workspace.fs.readFile(e),
            });
            return {
              postMessage: (e) => t.postMessage(e),
              onMessage: (e) => (
                t.on("message", e), { dispose: () => t.off("message", e) }
              ),
              terminate: async () => {
                await t.terminate();
              },
            };
          })(e);
          (t = { worker: o, rc: 0 }), this.workers.set(e.toString(), t);
        }
        return (
          t.rc++,
          t.closer && (clearTimeout(t.closer), (t.closer = void 0)),
          {
            worker: t.worker,
            dispose: () => {
              --t.rc ||
                (t.closer = setTimeout(() => {
                  t.worker.terminate(), this.workers.delete(e.toString());
                }, 5e3));
            },
          }
        );
      }
    })()),
    O = async ({ worker: e }, t, o, s, i) => {
      s.onDidReceiveMessage((t) => {
        switch (t.type) {
          case "reopenWith":
            return void (function (e, t, o, s) {
              $(o, () =>
                n.commands.executeCommand(
                  "vscode.openWith",
                  e,
                  t,
                  s ? n.ViewColumn.Beside : n.ViewColumn.Active,
                ),
              );
            })(
              o.with({ query: t.withQuery }),
              t.viewType,
              t.requireExtension,
              t.toSide,
            );
          case "command":
            return void $(t.requireExtension, () =>
              n.commands.executeCommand(t.command, ...t.args),
            );
          case "callGraph":
            return void e.postMessage(t.inner);
          default:
            console.warn(`Unknown request from webview: ${JSON.stringify(t)}`);
        }
      });
      const r = e.onMessage((e) => {
        s.postMessage({ method: "graphRet", message: e });
      });
      return (
        (s.options = { enableScripts: !0 }),
        (s.html = await (async (e, t) => {
          const n = (function (e = 32) {
            let t = "";
            for (let n = 0; n < e; n++)
              t +=
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[
                  Math.floor(62 * Math.random())
                ];
            return t;
          })();
          return `<!DOCTYPE html>\n    <html lang="en">\n    <head>\n      <meta charset="UTF-8">\n      <meta name="viewport" content="width=device-width, initial-scale=1.0">\n      ${((e) => `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${e}';">`)(n)}\n      <title>Profile Custom Editor</title>\n    </head>\n    <body>\n      <script type="text/javascript" nonce="${n}">\n        ${Object.entries(
            t,
          )
            .map(([e, t]) => `globalThis.${e} = ${JSON.stringify(t)}`)
            .join(
              ";",
            )}\n      <\/script>\n      <script nonce="${n}" src="${e}"><\/script>\n    </body>\n    </html>\n  `;
        })(s.asWebviewUri(t), {
          SNAPSHOT_URI: s.asWebviewUri(o).toString(),
          DOCUMENT_URI: o.toString(),
          ...i,
        })),
        r
      );
    };
  class U {
    constructor(e, t = {}) {
      (this.bundle = e),
        (this.extraConsts = t),
        (this.onDidChangeCustomDocument = new n.EventEmitter().event);
    }
    async openCustomDocument(e) {
      const t = await ((e) => L.create(e))(e);
      return new M(e, t);
    }
    async resolveCustomEditor(e, t) {
      const n = await O(
        e.value,
        this.bundle,
        e.uri,
        t.webview,
        this.extraConsts,
      );
      t.onDidDispose(() => {
        n.dispose();
      });
    }
    async saveCustomDocument() {}
    async revertCustomDocument() {}
    async backupCustomDocument() {
      return { id: "", delete: () => {} };
    }
    saveCustomDocumentAs(e, t) {
      return n.workspace.fs.copy(e.uri, t, { overwrite: !0 });
    }
  }
  const I = new Intl.NumberFormat(void 0, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  class q extends F {
    constructor() {
      super(...arguments), (this.data = new Map());
    }
    set(e, t, o) {
      let s = this.data.get(l(e));
      s || ((s = []), this.data.set(l(e), s));
      let i = 0;
      for (; i < s.length && s[i].position.line < t.line; ) i++;
      if (s[i]?.position.line === t.line) {
        const e = s[i];
        t.character < e.position.character &&
          (e.position = new n.Position(t.line, t.character)),
          (e.data.totalSize += o.totalSize),
          (e.data.selfSize += o.selfSize);
      } else
        s.splice(i, 0, {
          position: new n.Position(t.line, t.character),
          data: { totalSize: o.totalSize, selfSize: o.selfSize },
        });
    }
    getLensesForFile(e) {
      return (
        this.expandForFile(e),
        this.data
          .get(l(e))
          ?.map(({ position: e, data: t }) => {
            if (0 === t.totalSize && 0 === t.selfSize) return [];
            const o = new n.Range(e, e);
            return [
              new n.CodeLens(o, {
                title: `${I.format(t.selfSize / 1e3)}kB Self Size, ${I.format(t.totalSize / 1e3)}kB Total Size`,
                command: "",
              }),
              new n.CodeLens(o, {
                title: "Clear",
                command: "extension.jsProfileVisualizer.table.clearCodeLenses",
              }),
            ];
          })
          .reduce((e, t) => [...e, ...t], []) ?? []
      );
    }
  }
  class R {
    static root() {
      return new R({
        id: -1,
        selfSize: 0,
        children: [],
        callFrame: {
          functionName: "(root)",
          lineNumber: -1,
          columnNumber: -1,
          scriptId: "0",
          url: "",
        },
      });
    }
    get id() {
      return this.node.id;
    }
    get callFrame() {
      return this.node.callFrame;
    }
    get src() {
      return this.node.src;
    }
    constructor(e, t) {
      (this.node = e),
        (this.parent = t),
        (this.children = {}),
        (this.totalSize = 0),
        (this.selfSize = 0),
        (this.childrenSize = 0),
        (this.category = P(e.callFrame, void 0));
    }
    toJSON() {
      return {
        category: this.category,
        children: this.children,
        childrenSize: this.childrenSize,
        selfSize: this.selfSize,
        totalSize: this.totalSize,
        id: this.id,
        callFrame: this.callFrame,
        src: this.src,
      };
    }
  }
  const W = (e, t) => {
    const n = new R(e, t);
    e.children.forEach((e) => {
      const t = W(e, n);
      (n.children[t.id] = t), n.childrenSize++;
    }),
      (n.selfSize = e.selfSize),
      (n.totalSize = e.selfSize);
    for (const e in n.children) n.totalSize += n.children[e].totalSize;
    return n;
  };
  class V {
    constructor(e, t, o = {}) {
      (this.lens = e),
        (this.bundle = t),
        (this.extraConsts = o),
        (this.onDidChangeCustomDocument = new n.EventEmitter().event);
    }
    async openCustomDocument(e) {
      const t = await n.workspace.fs.readFile(e),
        o = JSON.parse(new TextDecoder().decode(t)),
        s = new b(
          e,
          ((e) => {
            let t = [e.head];
            const n = ((e) => {
              if (e.$vscode) return e.$vscode.locations;
              let t = 0;
              const n = new Map(),
                o = (e) => {
                  const o = [
                      e.functionName,
                      e.url,
                      e.scriptId,
                      e.lineNumber,
                      e.columnNumber,
                    ].join(":"),
                    s = n.get(o);
                  if (s) return s.id;
                  const i = t++;
                  return (
                    n.set(o, {
                      id: i,
                      callFrame: e,
                      location: {
                        lineNumber: e.lineNumber + 1,
                        columnNumber: e.columnNumber + 1,
                        source: {
                          name: u(e.url),
                          path: u(e.url),
                          sourceReference: 0,
                        },
                      },
                    }),
                    i
                  );
                };
              let s = [e.head];
              for (; s.length; ) {
                const e = s.pop();
                if (e) {
                  const { callFrame: t } = e;
                  (e.locationId = o(t)), (s = s.concat(e.children));
                }
              }
              return [...n.values()]
                .sort((e, t) => e.id - t.id)
                .map((e) => ({
                  locations: [e.location],
                  callFrame: e.callFrame,
                }));
            })(e);
            for (; t.length; ) {
              const o = t.pop();
              o &&
                (o.locationId && (o.src = z(e, n[o.locationId].locations)),
                (t = t.concat(o.children)));
            }
            return {
              head: e.head,
              samples: e.samples,
              rootPath: e.$vscode?.rootPath,
            };
          })(o),
        ),
        i = ((e) => {
          const t = R.root();
          for (const n of e.head.children) {
            const e = W(n, t);
            (t.children[e.id] = e), t.childrenSize++;
          }
          for (const e in t.children) t.totalSize += t.children[e].totalSize;
          return t;
        })(s.userData),
        r = [i];
      let a = [i];
      for (; a.length; ) {
        const e = a.pop();
        e && (r.push(e), (a = a.concat(Object.values(e.children))));
      }
      const c = new q(),
        l = s.userData.rootPath;
      for (const e of r) c.add(l, e);
      return this.lens.registerLenses(c), s;
    }
    async resolveCustomEditor(e, t) {
      t.webview.onDidReceiveMessage((t) => {
        switch (t.type) {
          case "openDocument":
            return void h({
              rootPath: void 0,
              viewColumn: t.toSide ? n.ViewColumn.Beside : n.ViewColumn.Active,
              callFrame: t.callFrame,
              location: t.location,
            });
          case "reopenWith":
            return void y(e.uri, t.viewType, t.requireExtension);
          default:
            console.warn(`Unknown request from webview: ${JSON.stringify(t)}`);
        }
      }),
        (t.webview.options = { enableScripts: !0 }),
        (t.webview.html = await o(t.webview.asWebviewUri(this.bundle), {
          MODEL: e.userData,
          ...this.extraConsts,
        }));
    }
    async saveCustomDocument() {}
    async revertCustomDocument() {}
    async backupCustomDocument() {
      return { id: "", delete: () => {} };
    }
    saveCustomDocumentAs(e, t) {
      return n.workspace.fs.copy(e.uri, t, { overwrite: !0 });
    }
  }
  class A {
    constructor() {
      (this.changeEmitter = new n.EventEmitter()),
        (this.onDidChangeCodeLenses = this.changeEmitter.event);
    }
    registerLenses(e) {
      return (
        n.commands.executeCommand(
          "setContext",
          "jsProfileVisualizer.hasCodeLenses",
          !0,
        ),
        (this.lenses = e),
        {
          dispose: () => {
            this.lenses === e && this.clear();
          },
        }
      );
    }
    clear() {
      this.lenses &&
        ((this.lenses = void 0),
        n.commands.executeCommand(
          "setContext",
          "jsProfileVisualizer.hasCodeLenses",
          !1,
        ),
        this.changeEmitter.fire());
    }
    provideCodeLenses(e) {
      const t = this.lenses?.getLensesForFile(l(e.uri.fsPath));
      if (t) return t;
      return (
        (e.uri.scheme === r.scheme
          ? this.lenses?.getLensesForFile(e.uri.query)
          : void 0) || []
      );
    }
  }
  function J(e) {
    const t = new A();
    e.subscriptions.push(
      n.window.registerCustomEditorProvider(
        "jsProfileVisualizer.cpuprofile.table",
        new E(t, n.Uri.joinPath(e.extensionUri, "out", "cpu-client.bundle.js")),
        { webviewOptions: { retainContextWhenHidden: !0 } },
      ),
      n.window.registerCustomEditorProvider(
        "jsProfileVisualizer.heapprofile.table",
        new V(
          t,
          n.Uri.joinPath(e.extensionUri, "out", "heap-client.bundle.js"),
        ),
        { webviewOptions: { retainContextWhenHidden: !0 } },
      ),
      n.window.registerCustomEditorProvider(
        "jsProfileVisualizer.heapsnapshot.table",
        new U(
          n.Uri.joinPath(
            e.extensionUri,
            "out",
            "heapsnapshot-client.bundle.js",
          ),
        ),
      ),
      n.workspace.registerTextDocumentContentProvider(
        "js-viz-download",
        new r(),
      ),
      n.languages.registerCodeLensProvider("*", t),
      n.commands.registerCommand(
        "extension.jsProfileVisualizer.table.clearCodeLenses",
        () => t.clear(),
      ),
    );
  }
  function _() {}
  module.exports = t;
})();
