(() => {
  var e,
    t,
    n,
    r,
    o,
    i,
    s,
    a,
    c,
    l,
    u,
    d,
    m,
    h = {
      572: (e, t) => {
        t.jz = function () {
          return "/tmp";
        };
      },
      115: (e) => {
        "use strict";
        function t(e) {
          if ("string" != typeof e)
            throw new TypeError(
              "Path must be a string. Received " + JSON.stringify(e),
            );
        }
        function n(e, t) {
          for (var n, r = "", o = 0, i = -1, s = 0, a = 0; a <= e.length; ++a) {
            if (a < e.length) n = e.charCodeAt(a);
            else {
              if (47 === n) break;
              n = 47;
            }
            if (47 === n) {
              if (i === a - 1 || 1 === s);
              else if (i !== a - 1 && 2 === s) {
                if (
                  r.length < 2 ||
                  2 !== o ||
                  46 !== r.charCodeAt(r.length - 1) ||
                  46 !== r.charCodeAt(r.length - 2)
                )
                  if (r.length > 2) {
                    var c = r.lastIndexOf("/");
                    if (c !== r.length - 1) {
                      -1 === c
                        ? ((r = ""), (o = 0))
                        : (o =
                            (r = r.slice(0, c)).length -
                            1 -
                            r.lastIndexOf("/")),
                        (i = a),
                        (s = 0);
                      continue;
                    }
                  } else if (2 === r.length || 1 === r.length) {
                    (r = ""), (o = 0), (i = a), (s = 0);
                    continue;
                  }
                t && (r.length > 0 ? (r += "/..") : (r = ".."), (o = 2));
              } else
                r.length > 0
                  ? (r += "/" + e.slice(i + 1, a))
                  : (r = e.slice(i + 1, a)),
                  (o = a - i - 1);
              (i = a), (s = 0);
            } else 46 === n && -1 !== s ? ++s : (s = -1);
          }
          return r;
        }
        var r = {
          resolve: function () {
            for (
              var e, r = "", o = !1, i = arguments.length - 1;
              i >= -1 && !o;
              i--
            ) {
              var s;
              i >= 0
                ? (s = arguments[i])
                : (void 0 === e && (e = process.cwd()), (s = e)),
                t(s),
                0 !== s.length &&
                  ((r = s + "/" + r), (o = 47 === s.charCodeAt(0)));
            }
            return (
              (r = n(r, !o)),
              o ? (r.length > 0 ? "/" + r : "/") : r.length > 0 ? r : "."
            );
          },
          normalize: function (e) {
            if ((t(e), 0 === e.length)) return ".";
            var r = 47 === e.charCodeAt(0),
              o = 47 === e.charCodeAt(e.length - 1);
            return (
              0 !== (e = n(e, !r)).length || r || (e = "."),
              e.length > 0 && o && (e += "/"),
              r ? "/" + e : e
            );
          },
          isAbsolute: function (e) {
            return t(e), e.length > 0 && 47 === e.charCodeAt(0);
          },
          join: function () {
            if (0 === arguments.length) return ".";
            for (var e, n = 0; n < arguments.length; ++n) {
              var o = arguments[n];
              t(o), o.length > 0 && (void 0 === e ? (e = o) : (e += "/" + o));
            }
            return void 0 === e ? "." : r.normalize(e);
          },
          relative: function (e, n) {
            if ((t(e), t(n), e === n)) return "";
            if ((e = r.resolve(e)) === (n = r.resolve(n))) return "";
            for (var o = 1; o < e.length && 47 === e.charCodeAt(o); ++o);
            for (
              var i = e.length, s = i - o, a = 1;
              a < n.length && 47 === n.charCodeAt(a);
              ++a
            );
            for (
              var c = n.length - a, l = s < c ? s : c, u = -1, d = 0;
              d <= l;
              ++d
            ) {
              if (d === l) {
                if (c > l) {
                  if (47 === n.charCodeAt(a + d)) return n.slice(a + d + 1);
                  if (0 === d) return n.slice(a + d);
                } else
                  s > l &&
                    (47 === e.charCodeAt(o + d) ? (u = d) : 0 === d && (u = 0));
                break;
              }
              var m = e.charCodeAt(o + d);
              if (m !== n.charCodeAt(a + d)) break;
              47 === m && (u = d);
            }
            var h = "";
            for (d = o + u + 1; d <= i; ++d)
              (d !== i && 47 !== e.charCodeAt(d)) ||
                (0 === h.length ? (h += "..") : (h += "/.."));
            return h.length > 0
              ? h + n.slice(a + u)
              : ((a += u), 47 === n.charCodeAt(a) && ++a, n.slice(a));
          },
          _makeLong: function (e) {
            return e;
          },
          dirname: function (e) {
            if ((t(e), 0 === e.length)) return ".";
            for (
              var n = e.charCodeAt(0),
                r = 47 === n,
                o = -1,
                i = !0,
                s = e.length - 1;
              s >= 1;
              --s
            )
              if (47 === (n = e.charCodeAt(s))) {
                if (!i) {
                  o = s;
                  break;
                }
              } else i = !1;
            return -1 === o
              ? r
                ? "/"
                : "."
              : r && 1 === o
                ? "//"
                : e.slice(0, o);
          },
          basename: function (e, n) {
            if (void 0 !== n && "string" != typeof n)
              throw new TypeError('"ext" argument must be a string');
            t(e);
            var r,
              o = 0,
              i = -1,
              s = !0;
            if (void 0 !== n && n.length > 0 && n.length <= e.length) {
              if (n.length === e.length && n === e) return "";
              var a = n.length - 1,
                c = -1;
              for (r = e.length - 1; r >= 0; --r) {
                var l = e.charCodeAt(r);
                if (47 === l) {
                  if (!s) {
                    o = r + 1;
                    break;
                  }
                } else
                  -1 === c && ((s = !1), (c = r + 1)),
                    a >= 0 &&
                      (l === n.charCodeAt(a)
                        ? -1 == --a && (i = r)
                        : ((a = -1), (i = c)));
              }
              return (
                o === i ? (i = c) : -1 === i && (i = e.length), e.slice(o, i)
              );
            }
            for (r = e.length - 1; r >= 0; --r)
              if (47 === e.charCodeAt(r)) {
                if (!s) {
                  o = r + 1;
                  break;
                }
              } else -1 === i && ((s = !1), (i = r + 1));
            return -1 === i ? "" : e.slice(o, i);
          },
          extname: function (e) {
            t(e);
            for (
              var n = -1, r = 0, o = -1, i = !0, s = 0, a = e.length - 1;
              a >= 0;
              --a
            ) {
              var c = e.charCodeAt(a);
              if (47 !== c)
                -1 === o && ((i = !1), (o = a + 1)),
                  46 === c
                    ? -1 === n
                      ? (n = a)
                      : 1 !== s && (s = 1)
                    : -1 !== n && (s = -1);
              else if (!i) {
                r = a + 1;
                break;
              }
            }
            return -1 === n ||
              -1 === o ||
              0 === s ||
              (1 === s && n === o - 1 && n === r + 1)
              ? ""
              : e.slice(n, o);
          },
          format: function (e) {
            if (null === e || "object" != typeof e)
              throw new TypeError(
                'The "pathObject" argument must be of type Object. Received type ' +
                  typeof e,
              );
            return (function (e, t) {
              var n = t.dir || t.root,
                r = t.base || (t.name || "") + (t.ext || "");
              return n ? (n === t.root ? n + r : n + "/" + r) : r;
            })(0, e);
          },
          parse: function (e) {
            t(e);
            var n = { root: "", dir: "", base: "", ext: "", name: "" };
            if (0 === e.length) return n;
            var r,
              o = e.charCodeAt(0),
              i = 47 === o;
            i ? ((n.root = "/"), (r = 1)) : (r = 0);
            for (
              var s = -1, a = 0, c = -1, l = !0, u = e.length - 1, d = 0;
              u >= r;
              --u
            )
              if (47 !== (o = e.charCodeAt(u)))
                -1 === c && ((l = !1), (c = u + 1)),
                  46 === o
                    ? -1 === s
                      ? (s = u)
                      : 1 !== d && (d = 1)
                    : -1 !== s && (d = -1);
              else if (!l) {
                a = u + 1;
                break;
              }
            return (
              -1 === s ||
              -1 === c ||
              0 === d ||
              (1 === d && s === c - 1 && s === a + 1)
                ? -1 !== c &&
                  (n.base = n.name =
                    0 === a && i ? e.slice(1, c) : e.slice(a, c))
                : (0 === a && i
                    ? ((n.name = e.slice(1, s)), (n.base = e.slice(1, c)))
                    : ((n.name = e.slice(a, s)), (n.base = e.slice(a, c))),
                  (n.ext = e.slice(s, c))),
              a > 0 ? (n.dir = e.slice(0, a - 1)) : i && (n.dir = "/"),
              n
            );
          },
          sep: "/",
          delimiter: ":",
          win32: null,
          posix: null,
        };
        (r.posix = r), (e.exports = r);
      },
      126: (e, t, n) => {
        "use strict";
        n.r(t), n.d(t, { activate: () => G, deactivate: () => Q });
        const r = require("vscode"),
          o = async (e, t) => {
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
          };
        var i = n(572),
          s = n(115);
        class a {
          static {
            this.scheme = "js-viz-download";
          }
          async provideTextDocumentContent(e) {
            return r.window.withProgress(
              {
                location: r.ProgressLocation.Notification,
                title: `Retrieving ${e.query}...`,
              },
              async () => {
                try {
                  const t = await fetch(e.query, {}),
                    n = await t.text();
                  return t.ok
                    ? n
                    : `Unexpected ${t.status} from ${e.query}: ${n}`;
                } catch (e) {
                  return e.message;
                }
              },
            );
          }
        }
        function c(e, t) {
          return s.posix?.isAbsolute(e)
            ? s.posix.relative(e, t)
            : s.win32?.isAbsolute(e)
              ? s.win32.relative(e, t)
              : s.relative(e, t);
        }
        let l = "undefined" != typeof process && "win32" !== process.platform;
        function u(e) {
          return l ? e : e.toLowerCase();
        }
        function d(e) {
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
          h = async (e) => {
            try {
              const t = v(e);
              return 0 === t.type || (await r.workspace.fs.stat(t.uri)), !0;
            } catch {
              return !1;
            }
          },
          f = async ({
            rootPath: e,
            location: t,
            viewColumn: n,
            callFrame: o,
          }) => {
            (t && (await w(e, t, n))) ||
              (o && (await g(o, n))) ||
              r.window.showErrorMessage(
                "Could not find the file in your workspace",
              );
          },
          p = async (e, t, n, o) => {
            const i = new r.Position(Math.max(0, t - 1), Math.max(0, n - 1));
            await r.window.showTextDocument(e, {
              viewColumn: o,
              selection: new r.Range(i, i),
            });
          },
          w = async (e, t, n) => {
            const o = b(e, t.source),
              i = (await Promise.all(o.map(h))).findIndex((e) => e);
            if (-1 === i) return !1;
            const s = v(o[i]);
            if (0 === s.type)
              return (
                await ((a = s),
                r.commands.executeCommand(a.command, ...a.args)),
                !0
              );
            var a;
            const c = await r.workspace.openTextDocument(s.uri);
            return await p(c, t.lineNumber, t.columnNumber, n), !0;
          },
          g = async ({ url: e, lineNumber: t, columnNumber: n }, o) => {
            let c;
            try {
              c = new URL(e);
            } catch {
              return !1;
            }
            if ("http:" !== c.protocol && "https:" !== c.protocol) return !1;
            const l = (0, s.resolve)(
                r.workspace.workspaceFolders?.[0].uri.fsPath ?? (0, i.jz)(),
                c.pathname.slice(1) || "index.js",
              ),
              u = await r.workspace.openTextDocument(
                r.Uri.file(l).with({ scheme: a.scheme, query: e }),
              );
            return await p(u, t + 1, n + 1, o), !0;
          },
          v = (e) => {
            const t = e?.match(/^command:([\w\.]+)(?:\?(.*))?/);
            if (t) {
              const [e, n] = t.slice(1),
                r = n ? JSON.parse(decodeURIComponent(n)) : [];
              return { type: 0, command: e, args: Array.isArray(r) ? r : [r] };
            }
            return e?.match(/\w\w+:/)
              ? { type: 1, uri: r.Uri.parse(e || ""), isFile: !1 }
              : { type: 1, uri: r.Uri.file(e || ""), isFile: !0 };
          },
          b = (e, t) => {
            if (!t.path) return [];
            const n = v(t.path),
              o = [t.path];
            if (!e || 0 === n.type || !n.isFile) return o;
            for (const n of r.workspace.workspaceFolders ?? [])
              o.push((0, s.resolve)(n.uri.fsPath, c(e, t.path)));
            return o;
          };
        class y {
          constructor(e, t) {
            (this.uri = e), (this.userData = t);
          }
          dispose() {}
        }
        function C(e, t, n, o) {
          return (function (n, i) {
            if (!n || r.extensions.all.some((e) => e.id === n))
              return r.commands.executeCommand(
                "vscode.openWith",
                e,
                t,
                o ? r.ViewColumn.Beside : r.ViewColumn.Active,
              );
            r.commands.executeCommand(
              "workbench.extensions.action.showExtensionsWithIds",
              [n],
            );
          })(n);
        }
        const x = Symbol("unset"),
          S = /[^/\\]+$/,
          T = (e) => S.exec(e)?.[0] ?? e;
        class _ {
          constructor() {
            this.basenamesToExpand = new Map();
          }
          add(e, t) {
            const n = ((e) => {
              let t = x;
              return () => (t === x && (t = e()), t);
            })(() => {
              const n = new Set(),
                o = new r.Position(
                  Math.max(0, t.callFrame.lineNumber),
                  Math.max(0, t.callFrame.columnNumber),
                );
              n.add(`${t.callFrame.url}/${o.line}`),
                this.set(t.callFrame.url, o, t);
              const i = t.src;
              if (
                i &&
                0 === i.source.sourceReference &&
                i.source.path &&
                i.source.path !== t.callFrame.url
              )
                for (const o of b(e, i.source)) {
                  const e = new r.Position(
                      Math.max(0, i.lineNumber - 1),
                      Math.max(0, i.columnNumber - 1),
                    ),
                    s = `${o}/${e.line}`;
                  n.has(s) || (n.add(s), this.set(o, e, t));
                }
            });
            this.addExpansionFn(T(t.callFrame.url), n),
              t.src?.source.path &&
                this.addExpansionFn(T(t.src.source.path), n);
          }
          addExpansionFn(e, t) {
            let n = this.basenamesToExpand.get(e);
            n || ((n = []), this.basenamesToExpand.set(e, n)), n.push(t);
          }
          expandForFile(e) {
            const t = T(e),
              n = this.basenamesToExpand.get(t);
            if (n) {
              for (const e of n) e();
              this.basenamesToExpand.delete(t);
            }
          }
        }
        const k = new Intl.NumberFormat(void 0, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        });
        class F extends _ {
          constructor() {
            super(...arguments), (this.data = new Map());
          }
          set(e, t, n) {
            let o = this.data.get(u(e));
            o || ((o = []), this.data.set(u(e), o));
            let i = 0;
            for (; i < o.length && o[i].position.line < t.line; ) i++;
            if (o[i]?.position.line === t.line) {
              const e = o[i];
              t.character < e.position.character &&
                (e.position = new r.Position(t.line, t.character)),
                (e.data.aggregateTime += n.aggregateTime),
                (e.data.selfTime += n.selfTime),
                (e.data.ticks += n.ticks);
            } else
              o.splice(i, 0, {
                position: new r.Position(t.line, t.character),
                data: {
                  aggregateTime: n.aggregateTime,
                  selfTime: n.selfTime,
                  ticks: n.ticks,
                },
              });
          }
          getLensesForFile(e) {
            return (
              this.expandForFile(e),
              this.data
                .get(u(e))
                ?.map(({ position: e, data: t }) => {
                  if (0 === t.aggregateTime && 0 === t.selfTime) return [];
                  const n = new r.Range(e, e);
                  return [
                    new r.CodeLens(n, {
                      title: `${k.format(t.selfTime / 1e3)}ms Self Time, ${k.format(t.aggregateTime / 1e3)}ms Total`,
                      command: "",
                    }),
                    new r.CodeLens(n, {
                      title: "Clear",
                      command:
                        "extension.jsProfileVisualizer.table.clearCodeLenses",
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
          z = (e, t) =>
            t.source.path && 0 === t.source.sourceReference
              ? { ...t, relativePath: c(e, t.source.path) }
              : t,
          D = (e, t = []) => {
            if (!e.$vscode?.rootPath) return t[0];
            for (const n of t) {
              const t = z(e.$vscode.rootPath, n);
              if (t.relativePath) return t;
            }
            return t[0];
          },
          N = (e, t) => {
            const n = t[e];
            if (n.aggregateTime) return n.aggregateTime;
            let r = n.selfTime;
            for (const e of n.children) r += N(e, t);
            return (n.aggregateTime = r);
          };
        class E {
          constructor(e, t, n = {}) {
            (this.lens = e),
              (this.bundle = t),
              (this.extraConsts = n),
              (this.onDidChangeCustomDocument = new r.EventEmitter().event);
          }
          async openCustomDocument(e) {
            const t = await r.workspace.fs.readFile(e),
              n = JSON.parse(new TextDecoder().decode(t)),
              o = new y(
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
                    r = ((e) => {
                      if (e.$vscode) return e.$vscode.locations;
                      let t = 0;
                      const n = new Map(),
                        r = (e) => {
                          const r = [
                              e.functionName,
                              e.url,
                              e.scriptId,
                              e.lineNumber,
                              e.columnNumber,
                            ].join(":"),
                            o = n.get(r);
                          if (o) return o.id;
                          const i = t++;
                          return (
                            n.set(r, {
                              id: i,
                              callFrame: e,
                              location: {
                                lineNumber: e.lineNumber + 1,
                                columnNumber: e.columnNumber + 1,
                                source: {
                                  name: d(e.url),
                                  path: d(e.url),
                                  sourceReference: 0,
                                },
                              },
                            }),
                            i
                          );
                        };
                      for (const t of e.nodes)
                        (t.locationId = r(t.callFrame)),
                          (t.positionTicks = t.positionTicks?.map((e) => ({
                            ...e,
                            startLocationId: r({
                              ...t.callFrame,
                              lineNumber: e.line - 1,
                              columnNumber: 0,
                            }),
                            endLocationId: r({
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
                      const r = D(e, t.locations);
                      return {
                        id: n,
                        selfTime: 0,
                        aggregateTime: 0,
                        ticks: 0,
                        category: P(t.callFrame, r),
                        callFrame: t.callFrame,
                        src: r,
                      };
                    }),
                    o = new Map(),
                    i = (e) => {
                      let t = o.get(e);
                      return void 0 === t && ((t = o.size), o.set(e, t)), t;
                    },
                    s = new Array(e.nodes.length);
                  for (let t = 0; t < e.nodes.length; t++) {
                    const n = e.nodes[t],
                      o = i(n.id);
                    s[o] = {
                      id: o,
                      selfTime: 0,
                      aggregateTime: 0,
                      locationId: n.locationId,
                      children: n.children?.map(i) || [],
                    };
                    for (const e of n.positionTicks || [])
                      e.startLocationId &&
                        (r[e.startLocationId].ticks += e.ticks);
                  }
                  for (const e of s)
                    for (const t of e.children) s[t].parent = e.id;
                  const a = e.endTime - e.startTime;
                  let c = a - n[0];
                  for (let e = 0; e < n.length - 1; e++) {
                    const r = n[e + 1];
                    (s[i(t[e])].selfTime += r), (c -= r);
                  }
                  s.length &&
                    ((s[i(t[n.length - 1])].selfTime += c), n.push(c));
                  for (let e = 0; e < s.length; e++) {
                    const t = s[e],
                      n = r[t.locationId];
                    (n.aggregateTime += N(e, s)), (n.selfTime += t.selfTime);
                  }
                  return {
                    nodes: s,
                    locations: r,
                    samples: t.map(i),
                    timeDeltas: n,
                    rootPath: e.$vscode?.rootPath,
                    duration: a,
                  };
                })(n),
              ),
              i = new F(),
              s = o.userData.rootPath;
            for (const e of o.userData.locations) i.add(s, e);
            return this.lens.registerLenses(i), o;
          }
          async resolveCustomEditor(e, t) {
            t.webview.onDidReceiveMessage((t) => {
              switch (t.type) {
                case "openDocument":
                  return void f({
                    rootPath: e.userData?.rootPath,
                    viewColumn: t.toSide
                      ? r.ViewColumn.Beside
                      : r.ViewColumn.Active,
                    callFrame: t.callFrame,
                    location: t.location,
                  });
                case "reopenWith":
                  return void C(e.uri, t.viewType, t.requireExtension);
                default:
                  console.warn(
                    `Unknown request from webview: ${JSON.stringify(t)}`,
                  );
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
            return r.workspace.fs.copy(e.uri, t, { overwrite: !0 });
          }
        }
        function j(e, t) {
          if (!e || r.extensions.all.some((t) => t.id === e)) return t();
          r.commands.executeCommand(
            "workbench.extensions.action.showExtensionsWithIds",
            [e],
          );
        }
        const A = (e, t) => t.method === e,
          $ = (e, t) => {
            const n = new Array(e.length);
            for (let r = 0; r < e.length; r++) {
              const o = e[r];
              (n[r] = t(o, r)), o.free();
            }
            return n;
          },
          M = (e) =>
            $(e, (e) => ({
              name: e.name(),
              childrenLen: e.children_len,
              id: e.id,
              index: e.index,
              retainedSize: Number(e.retained_size),
              selfSize: Number(e.self_size),
              type: e.typ,
              retainsIndex: e.retains_index,
              edgeType: e.edge_typ,
            })),
          O = async () => {
            const { decode_bytes: e, init_panic_hook: t } = await n
              .e(848)
              .then(n.bind(n, 848));
            return t(), e;
          };
        class L {
          constructor(e, t) {
            (this.uri = e), (this.value = t);
          }
          dispose() {
            this.value.dispose();
          }
        }
        const U = (globalThis.__jsHeapSnapshotWorkers ??= new (class {
            constructor() {
              this.workers = new Map();
            }
            async create(e) {
              let t = this.workers.get(e.with({ query: "" }).toString());
              if (!t) {
                const n = await (async (e) => {
                  const t = new r.EventEmitter(),
                    n = Promise.all([r.workspace.fs.readFile(e), O()]).then(
                      ([e, t]) => t(e),
                    );
                  return {
                    postMessage: (e) =>
                      ((e, t) =>
                        e
                          .then((e) => {
                            if (A("getClassGroups", t))
                              return $(
                                e.get_class_groups(...t.args, !1),
                                (e, t) => ({
                                  name: e.name(),
                                  index: t,
                                  retainedSize: Number(e.retained_size),
                                  selfSize: Number(e.self_size),
                                  childrenLen: e.children_len,
                                }),
                              );
                            if (A("getClassChildren", t))
                              return M(e.class_children(...t.args));
                            if (A("getNodeChildren", t))
                              return M(e.node_children(...t.args));
                            if (A("getRetainers", t))
                              return M(e.get_all_retainers(...t.args));
                            throw new Error(`unknown method ${t.method}`);
                          })
                          .then((e) => ({ id: t.id, result: { ok: e } }))
                          .catch((e) => ({
                            id: t.id,
                            result: { err: e.stack || e.message || String(e) },
                          })))(n, e).then((e) => t.fire(e)),
                    onMessage: t.event,
                    terminate: () => n.then((e) => e.free()),
                  };
                })(e);
                (t = { worker: n, rc: 0 }), this.workers.set(e.toString(), t);
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
          I = async ({ worker: e }, t, n, o, i) => {
            o.onDidReceiveMessage((t) => {
              switch (t.type) {
                case "reopenWith":
                  return void (function (e, t, n, o) {
                    j(n, () =>
                      r.commands.executeCommand(
                        "vscode.openWith",
                        e,
                        t,
                        o ? r.ViewColumn.Beside : r.ViewColumn.Active,
                      ),
                    );
                  })(
                    n.with({ query: t.withQuery }),
                    t.viewType,
                    t.requireExtension,
                    t.toSide,
                  );
                case "command":
                  return void j(t.requireExtension, () =>
                    r.commands.executeCommand(t.command, ...t.args),
                  );
                case "callGraph":
                  return void e.postMessage(t.inner);
                default:
                  console.warn(
                    `Unknown request from webview: ${JSON.stringify(t)}`,
                  );
              }
            });
            const s = e.onMessage((e) => {
              o.postMessage({ method: "graphRet", message: e });
            });
            return (
              (o.options = { enableScripts: !0 }),
              (o.html = await (async (e, t) => {
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
              })(o.asWebviewUri(t), {
                SNAPSHOT_URI: o.asWebviewUri(n).toString(),
                DOCUMENT_URI: n.toString(),
                ...i,
              })),
              s
            );
          };
        class R {
          constructor(e, t = {}) {
            (this.bundle = e),
              (this.extraConsts = t),
              (this.onDidChangeCustomDocument = new r.EventEmitter().event);
          }
          async openCustomDocument(e) {
            const t = await ((e) => U.create(e))(e);
            return new L(e, t);
          }
          async resolveCustomEditor(e, t) {
            const n = await I(
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
            return r.workspace.fs.copy(e.uri, t, { overwrite: !0 });
          }
        }
        const W = new Intl.NumberFormat(void 0, {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
        });
        class q extends _ {
          constructor() {
            super(...arguments), (this.data = new Map());
          }
          set(e, t, n) {
            let o = this.data.get(u(e));
            o || ((o = []), this.data.set(u(e), o));
            let i = 0;
            for (; i < o.length && o[i].position.line < t.line; ) i++;
            if (o[i]?.position.line === t.line) {
              const e = o[i];
              t.character < e.position.character &&
                (e.position = new r.Position(t.line, t.character)),
                (e.data.totalSize += n.totalSize),
                (e.data.selfSize += n.selfSize);
            } else
              o.splice(i, 0, {
                position: new r.Position(t.line, t.character),
                data: { totalSize: n.totalSize, selfSize: n.selfSize },
              });
          }
          getLensesForFile(e) {
            return (
              this.expandForFile(e),
              this.data
                .get(u(e))
                ?.map(({ position: e, data: t }) => {
                  if (0 === t.totalSize && 0 === t.selfSize) return [];
                  const n = new r.Range(e, e);
                  return [
                    new r.CodeLens(n, {
                      title: `${W.format(t.selfSize / 1e3)}kB Self Size, ${W.format(t.totalSize / 1e3)}kB Total Size`,
                      command: "",
                    }),
                    new r.CodeLens(n, {
                      title: "Clear",
                      command:
                        "extension.jsProfileVisualizer.table.clearCodeLenses",
                    }),
                  ];
                })
                .reduce((e, t) => [...e, ...t], []) ?? []
            );
          }
        }
        class V {
          static root() {
            return new V({
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
        const J = (e, t) => {
          const n = new V(e, t);
          e.children.forEach((e) => {
            const t = J(e, n);
            (n.children[t.id] = t), n.childrenSize++;
          }),
            (n.selfSize = e.selfSize),
            (n.totalSize = e.selfSize);
          for (const e in n.children) n.totalSize += n.children[e].totalSize;
          return n;
        };
        class B {
          constructor(e, t, n = {}) {
            (this.lens = e),
              (this.bundle = t),
              (this.extraConsts = n),
              (this.onDidChangeCustomDocument = new r.EventEmitter().event);
          }
          async openCustomDocument(e) {
            const t = await r.workspace.fs.readFile(e),
              n = JSON.parse(new TextDecoder().decode(t)),
              o = new y(
                e,
                ((e) => {
                  let t = [e.head];
                  const n = ((e) => {
                    if (e.$vscode) return e.$vscode.locations;
                    let t = 0;
                    const n = new Map(),
                      r = (e) => {
                        const r = [
                            e.functionName,
                            e.url,
                            e.scriptId,
                            e.lineNumber,
                            e.columnNumber,
                          ].join(":"),
                          o = n.get(r);
                        if (o) return o.id;
                        const i = t++;
                        return (
                          n.set(r, {
                            id: i,
                            callFrame: e,
                            location: {
                              lineNumber: e.lineNumber + 1,
                              columnNumber: e.columnNumber + 1,
                              source: {
                                name: d(e.url),
                                path: d(e.url),
                                sourceReference: 0,
                              },
                            },
                          }),
                          i
                        );
                      };
                    let o = [e.head];
                    for (; o.length; ) {
                      const e = o.pop();
                      if (e) {
                        const { callFrame: t } = e;
                        (e.locationId = r(t)), (o = o.concat(e.children));
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
                    const r = t.pop();
                    r &&
                      (r.locationId &&
                        (r.src = D(e, n[r.locationId].locations)),
                      (t = t.concat(r.children)));
                  }
                  return {
                    head: e.head,
                    samples: e.samples,
                    rootPath: e.$vscode?.rootPath,
                  };
                })(n),
              ),
              i = ((e) => {
                const t = V.root();
                for (const n of e.head.children) {
                  const e = J(n, t);
                  (t.children[e.id] = e), t.childrenSize++;
                }
                for (const e in t.children)
                  t.totalSize += t.children[e].totalSize;
                return t;
              })(o.userData),
              s = [i];
            let a = [i];
            for (; a.length; ) {
              const e = a.pop();
              e && (s.push(e), (a = a.concat(Object.values(e.children))));
            }
            const c = new q(),
              l = o.userData.rootPath;
            for (const e of s) c.add(l, e);
            return this.lens.registerLenses(c), o;
          }
          async resolveCustomEditor(e, t) {
            t.webview.onDidReceiveMessage((t) => {
              switch (t.type) {
                case "openDocument":
                  return void f({
                    rootPath: void 0,
                    viewColumn: t.toSide
                      ? r.ViewColumn.Beside
                      : r.ViewColumn.Active,
                    callFrame: t.callFrame,
                    location: t.location,
                  });
                case "reopenWith":
                  return void C(e.uri, t.viewType, t.requireExtension);
                default:
                  console.warn(
                    `Unknown request from webview: ${JSON.stringify(t)}`,
                  );
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
            return r.workspace.fs.copy(e.uri, t, { overwrite: !0 });
          }
        }
        class H {
          constructor() {
            (this.changeEmitter = new r.EventEmitter()),
              (this.onDidChangeCodeLenses = this.changeEmitter.event);
          }
          registerLenses(e) {
            return (
              r.commands.executeCommand(
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
              r.commands.executeCommand(
                "setContext",
                "jsProfileVisualizer.hasCodeLenses",
                !1,
              ),
              this.changeEmitter.fire());
          }
          provideCodeLenses(e) {
            const t = this.lenses?.getLensesForFile(u(e.uri.fsPath));
            if (t) return t;
            return (
              (e.uri.scheme === a.scheme
                ? this.lenses?.getLensesForFile(e.uri.query)
                : void 0) || []
            );
          }
        }
        function G(e) {
          const t = new H();
          e.subscriptions.push(
            r.window.registerCustomEditorProvider(
              "jsProfileVisualizer.cpuprofile.table",
              new E(
                t,
                r.Uri.joinPath(e.extensionUri, "out", "cpu-client.bundle.js"),
              ),
              { webviewOptions: { retainContextWhenHidden: !0 } },
            ),
            r.window.registerCustomEditorProvider(
              "jsProfileVisualizer.heapprofile.table",
              new B(
                t,
                r.Uri.joinPath(e.extensionUri, "out", "heap-client.bundle.js"),
              ),
              { webviewOptions: { retainContextWhenHidden: !0 } },
            ),
            r.window.registerCustomEditorProvider(
              "jsProfileVisualizer.heapsnapshot.table",
              new R(
                r.Uri.joinPath(
                  e.extensionUri,
                  "out",
                  "heapsnapshot-client.bundle.js",
                ),
              ),
            ),
            r.workspace.registerTextDocumentContentProvider(
              "js-viz-download",
              new a(),
            ),
            r.languages.registerCodeLensProvider("*", t),
            r.commands.registerCommand(
              "extension.jsProfileVisualizer.table.clearCodeLenses",
              () => t.clear(),
            ),
          );
        }
        function Q() {}
      },
    },
    f = {};
  function p(e) {
    var t = f[e];
    if (void 0 !== t) return t.exports;
    var n = (f[e] = { id: e, loaded: !1, exports: {} });
    return h[e](n, n.exports, p), (n.loaded = !0), n.exports;
  }
  (p.m = h),
    (p.c = f),
    (p.d = (e, t) => {
      for (var n in t)
        p.o(t, n) &&
          !p.o(e, n) &&
          Object.defineProperty(e, n, { enumerable: !0, get: t[n] });
    }),
    (p.f = {}),
    (p.e = (e) =>
      Promise.all(Object.keys(p.f).reduce((t, n) => (p.f[n](e, t), t), []))),
    (p.u = (e) => e + ".extension.web.js"),
    (p.g = (function () {
      if ("object" == typeof globalThis) return globalThis;
      try {
        return this || new Function("return this")();
      } catch (e) {
        if ("object" == typeof window) return window;
      }
    })()),
    (p.hmd = (e) => (
      (e = Object.create(e)).children || (e.children = []),
      Object.defineProperty(e, "exports", {
        enumerable: !0,
        set: () => {
          throw new Error(
            "ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: " +
              e.id,
          );
        },
      }),
      e
    )),
    (p.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t)),
    (p.r = (e) => {
      "undefined" != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
        Object.defineProperty(e, "__esModule", { value: !0 });
    }),
    (() => {
      var e;
      p.g.importScripts && (e = p.g.location + "");
      var t = p.g.document;
      if (
        !e &&
        t &&
        (t.currentScript &&
          "SCRIPT" === t.currentScript.tagName.toUpperCase() &&
          (e = t.currentScript.src),
        !e)
      ) {
        var n = t.getElementsByTagName("script");
        if (n.length)
          for (var r = n.length - 1; r > -1 && (!e || !/^http(s?):/.test(e)); )
            e = n[r--].src;
      }
      if (!e)
        throw new Error(
          "Automatic publicPath is not supported in this browser",
        );
      (e = e
        .replace(/#.*$/, "")
        .replace(/\?.*$/, "")
        .replace(/\/[^\/]+$/, "/")),
        (p.p = e);
    })(),
    (() => {
      var e = { 792: 1 };
      p.f.i = (t, n) => {
        e[t] || importScripts(p.p + p.u(t));
      };
      var t = (self.webpackChunkvscode_js_profile_table =
          self.webpackChunkvscode_js_profile_table || []),
        n = t.push.bind(t);
      t.push = (t) => {
        var [r, o, i] = t;
        for (var s in o) p.o(o, s) && (p.m[s] = o[s]);
        for (i && i(p); r.length; ) e[r.pop()] = 1;
        n(t);
      };
    })(),
    (u = {}),
    (d = {
      16: function () {
        return {
          "./v8_heap_parser_bg.js": {
            __wbindgen_string_new: function (t, n) {
              return void 0 === e && (e = p.c[4].exports), e.yc(t, n);
            },
            __wbindgen_object_drop_ref: function (e) {
              return void 0 === t && (t = p.c[4].exports), t.bk(e);
            },
            __wbg_classgroup_new: function (e) {
              return void 0 === n && (n = p.c[4].exports), n.Mq(e);
            },
            __wbg_node_new: function (e) {
              return void 0 === r && (r = p.c[4].exports), r.Rs(e);
            },
            __wbg_retainernode_new: function (e) {
              return void 0 === o && (o = p.c[4].exports), o.bU(e);
            },
            __wbg_new_abda76e883ba8a5f: function () {
              return void 0 === i && (i = p.c[4].exports), i.V5();
            },
            __wbg_stack_658279fe44541cf6: function (e, t) {
              return void 0 === s && (s = p.c[4].exports), s.u$(e, t);
            },
            __wbg_error_f851667af71bcfc6: function (e, t) {
              return void 0 === a && (a = p.c[4].exports), a.Xu(e, t);
            },
            __wbindgen_throw: function (e, t) {
              return void 0 === c && (c = p.c[4].exports), c.Qn(e, t);
            },
            __wbindgen_string_get: function (e, t) {
              return void 0 === l && (l = p.c[4].exports), l.qN(e, t);
            },
          },
        };
      },
    }),
    (m = { 848: [16] }),
    (p.w = {}),
    (p.f.wasm = function (e, t) {
      (m[e] || []).forEach(function (n, r) {
        var o = u[n];
        if (o) t.push(o);
        else {
          var i,
            s = d[n](),
            a = fetch(
              p.p +
                "" +
                { 848: { 16: "dbd61d846b1102299709" } }[e][n] +
                ".module.wasm",
            );
          (i =
            s &&
            "function" == typeof s.then &&
            "function" == typeof WebAssembly.compileStreaming
              ? Promise.all([WebAssembly.compileStreaming(a), s]).then(
                  function (e) {
                    return WebAssembly.instantiate(e[0], e[1]);
                  },
                )
              : "function" == typeof WebAssembly.instantiateStreaming
                ? WebAssembly.instantiateStreaming(a, s)
                : a
                    .then(function (e) {
                      return e.arrayBuffer();
                    })
                    .then(function (e) {
                      return WebAssembly.instantiate(e, s);
                    })),
            t.push(
              (u[n] = i.then(function (e) {
                return (p.w[n] = (e.instance || e).exports);
              })),
            );
        }
      });
    });
  var w = p(126);
  module.exports = w;
})();
