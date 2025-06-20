(() => {
  "use strict";
  var e,
    r,
    t,
    n,
    a,
    o = {},
    s = {};
  function i(e) {
    var r = s[e];
    if (void 0 !== r) return r.exports;
    var t = (s[e] = { id: e, loaded: !1, exports: {} });
    return o[e](t, t.exports, i), (t.loaded = !0), t.exports;
  }
  (i.m = o),
    (e =
      "function" == typeof Symbol
        ? Symbol("webpack queues")
        : "__webpack_queues__"),
    (r =
      "function" == typeof Symbol
        ? Symbol("webpack exports")
        : "__webpack_exports__"),
    (t =
      "function" == typeof Symbol
        ? Symbol("webpack error")
        : "__webpack_error__"),
    (n = (e) => {
      e &&
        e.d < 1 &&
        ((e.d = 1),
        e.forEach((e) => e.r--),
        e.forEach((e) => (e.r-- ? e.r++ : e())));
    }),
    (i.a = (a, o, s) => {
      var i;
      s && ((i = []).d = -1);
      var d,
        u,
        l,
        c = new Set(),
        p = a.exports,
        f = new Promise((e, r) => {
          (l = r), (u = e);
        });
      (f[r] = p),
        (f[e] = (e) => (i && e(i), c.forEach(e), f.catch((e) => {}))),
        (a.exports = f),
        o(
          (a) => {
            var o;
            d = ((a) =>
              a.map((a) => {
                if (null !== a && "object" == typeof a) {
                  if (a[e]) return a;
                  if (a.then) {
                    var o = [];
                    (o.d = 0),
                      a.then(
                        (e) => {
                          (s[r] = e), n(o);
                        },
                        (e) => {
                          (s[t] = e), n(o);
                        },
                      );
                    var s = {};
                    return (s[e] = (e) => e(o)), s;
                  }
                }
                var i = {};
                return (i[e] = (e) => {}), (i[r] = a), i;
              }))(a);
            var s = () =>
                d.map((e) => {
                  if (e[t]) throw e[t];
                  return e[r];
                }),
              u = new Promise((r) => {
                (o = () => r(s)).r = 0;
                var t = (e) =>
                  e !== i &&
                  !c.has(e) &&
                  (c.add(e), e && !e.d && (o.r++, e.push(o)));
                d.map((r) => r[e](t));
              });
            return o.r ? u : s();
          },
          (e) => (e ? l((f[t] = e)) : u(p), n(i)),
        ),
        i && i.d < 0 && (i.d = 0);
    }),
    (i.d = (e, r) => {
      for (var t in r)
        i.o(r, t) &&
          !i.o(e, t) &&
          Object.defineProperty(e, t, { enumerable: !0, get: r[t] });
    }),
    (i.f = {}),
    (i.e = (e) =>
      Promise.all(Object.keys(i.f).reduce((r, t) => (i.f[t](e, r), r), []))),
    (i.u = (e) => e + ".heapsnapshotWorker.js"),
    (i.hmd = (e) => (
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
    (i.o = (e, r) => Object.prototype.hasOwnProperty.call(e, r)),
    (i.v = (e, r, t, n) =>
      new Promise(function (e, r) {
        try {
          var { readFile: n } = require("fs"),
            { join: a } = require("path");
          n(a(__dirname, t + ".module.wasm"), function (t, n) {
            if (t) return r(t);
            e({ arrayBuffer: () => n });
          });
        } catch (e) {
          r(e);
        }
      })
        .then((e) => e.arrayBuffer())
        .then((e) => WebAssembly.instantiate(e, n))
        .then((r) => Object.assign(e, r.instance.exports))),
    (i.p = ""),
    (a = { 792: 1 }),
    (i.f.require = (e, r) => {
      a[e] ||
        ((e) => {
          var r = e.modules,
            t = e.ids,
            n = e.runtime;
          for (var o in r) i.o(r, o) && (i.m[o] = r[o]);
          n && n(i);
          for (var s = 0; s < t.length; s++) a[t[s]] = 1;
        })(require("./" + i.u(e)));
    });
  const d = require("fs/promises"),
    u = require("worker_threads"),
    l = (e, r) => r.method === e,
    c = (e, r) => {
      const t = new Array(e.length);
      for (let n = 0; n < e.length; n++) {
        const a = e[n];
        (t[n] = r(a, n)), a.free();
      }
      return t;
    },
    p = (e) =>
      c(e, (e) => ({
        name: e.name(),
        childrenLen: e.children_len,
        id: e.id,
        index: e.index,
        retainedSize: Number(e.retained_size),
        selfSize: Number(e.self_size),
        type: e.typ,
        retainsIndex: e.retains_index,
        edgeType: e.edge_typ,
      }));
  if (!u.parentPort) throw new Error("must be run in worker thread");
  const f = Promise.all([
    "string" == typeof u.workerData
      ? (0, d.readFile)(u.workerData)
      : Promise.resolve(u.workerData),
    (async () => {
      const { decode_bytes: e, init_panic_hook: r } = await i
        .e(425)
        .then(i.bind(i, 425));
      return r(), e;
    })(),
  ]).then(async ([e, r]) => r(e));
  u.parentPort.on("message", (e) => {
    ((e, r) =>
      e
        .then((e) => {
          if (l("getClassGroups", r))
            return c(e.get_class_groups(...r.args, !1), (e, r) => ({
              name: e.name(),
              index: r,
              retainedSize: Number(e.retained_size),
              selfSize: Number(e.self_size),
              childrenLen: e.children_len,
            }));
          if (l("getClassChildren", r)) return p(e.class_children(...r.args));
          if (l("getNodeChildren", r)) return p(e.node_children(...r.args));
          if (l("getRetainers", r)) return p(e.get_all_retainers(...r.args));
          throw new Error(`unknown method ${r.method}`);
        })
        .then((e) => ({ id: r.id, result: { ok: e } }))
        .catch((e) => ({
          id: r.id,
          result: { err: e.stack || e.message || String(e) },
        })))(f, e).then((e) => u.parentPort.postMessage(e));
  });
})();
