"use strict";
(() => {
  var L = Object.create;
  var O = Object.defineProperty;
  var I = Object.getOwnPropertyDescriptor;
  var G = Object.getOwnPropertyNames;
  var J = Object.getPrototypeOf,
    K = Object.prototype.hasOwnProperty;
  var h = ((e) =>
    typeof require < "u"
      ? require
      : typeof Proxy < "u"
        ? new Proxy(e, {
            get: (t, r) => (typeof require < "u" ? require : t)[r],
          })
        : e)(function (e) {
    if (typeof require < "u") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + e + '" is not supported');
  });
  var A = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
  var Q = (e, t, r, n) => {
    if ((t && typeof t == "object") || typeof t == "function")
      for (let s of G(t))
        !K.call(e, s) &&
          s !== r &&
          O(e, s, {
            get: () => t[s],
            enumerable: !(n = I(t, s)) || n.enumerable,
          });
    return e;
  };
  var X = (e, t, r) => (
    (r = e != null ? L(J(e)) : {}),
    Q(
      t || !e || !e.__esModule
        ? O(r, "default", { value: e, enumerable: !0 })
        : r,
      e,
    )
  );
  var U = A((Te, f) => {
    var N = {};
    N.__wbindgen_placeholder__ = f.exports;
    var l,
      { TextDecoder: Y } = h("util"),
      p = null;
    function q() {
      return (
        (p === null || p.byteLength === 0) &&
          (p = new Uint8Array(l.memory.buffer)),
        p
      );
    }
    function Z(e, t) {
      return (e = e >>> 0), q().subarray(e / 1, e / 1 + t);
    }
    var u = new Array(128).fill(void 0);
    u.push(void 0, null, !0, !1);
    function y(e) {
      return u[e];
    }
    var _ = u.length;
    function $(e) {
      e < 132 || ((u[e] = _), (_ = e));
    }
    function ee(e) {
      let t = y(e);
      return $(e), t;
    }
    var P = new Y("utf-8", { ignoreBOM: !0, fatal: !0 });
    P.decode();
    function te(e, t) {
      return (e = e >>> 0), P.decode(q().subarray(e, e + t));
    }
    var R = 0;
    function M(e, t) {
      let r = t(e.length * 1, 1) >>> 0;
      return q().set(e, r / 1), (R = e.length), r;
    }
    function re(e) {
      _ === u.length && u.push(u.length + 1);
      let t = _;
      return (_ = u[t]), (u[t] = e), t;
    }
    var v =
        typeof FinalizationRegistry > "u"
          ? { register: () => {}, unregister: () => {} }
          : new FinalizationRegistry((e) => l.__wbg_hasher_free(e >>> 0, 1)),
      F = class {
        __destroy_into_raw() {
          let t = this.__wbg_ptr;
          return (this.__wbg_ptr = 0), v.unregister(this), t;
        }
        free() {
          let t = this.__destroy_into_raw();
          l.__wbg_hasher_free(t, 0);
        }
        constructor() {
          let t = l.hasher_new();
          return (
            (this.__wbg_ptr = t >>> 0),
            v.register(this, this.__wbg_ptr, this),
            this
          );
        }
        update(t) {
          let r = M(t, l.__wbindgen_malloc),
            n = R;
          l.hasher_update(this.__wbg_ptr, r, n);
        }
        digest(t) {
          var r = M(t, l.__wbindgen_malloc),
            n = R;
          l.hasher_digest(this.__wbg_ptr, r, n, re(t));
        }
      };
    f.exports.Hasher = F;
    f.exports.__wbindgen_copy_to_typed_array = function (e, t, r) {
      new Uint8Array(y(r).buffer, y(r).byteOffset, y(r).byteLength).set(
        Z(e, t),
      );
    };
    f.exports.__wbindgen_object_drop_ref = function (e) {
      ee(e);
    };
    f.exports.__wbindgen_throw = function (e, t) {
      throw new Error(te(e, t));
    };
    var ne = h("path").join(__dirname, "chromehash_bg.wasm"),
      se = h("fs").readFileSync(ne),
      ae = new WebAssembly.Module(se),
      ie = new WebAssembly.Instance(ae, N);
    l = ie.exports;
    f.exports.__wasm = l;
  });
  var W = A((o) => {
    "use strict";
    Object.defineProperty(o, "__esModule", { value: !0 });
    o.normalizeShaBuffer =
      o.shaHashFile =
      o.hashFile =
      o.shaHash =
      o.hash =
        void 0;
    var j = U(),
      E = h("fs"),
      z = h("string_decoder"),
      V = h("crypto"),
      w = Buffer.alloc(4 * 5),
      oe = (e) => {
        let t = new j.Hasher();
        return t.update(ue(e)), t.digest(w), t.free(), w.toString("hex");
      };
    o.hash = oe;
    var ce = (e) => {
      let t = (0, V.createHash)("sha256");
      return t.update((0, o.normalizeShaBuffer)(e)), t.digest("hex");
    };
    o.shaHash = ce;
    var le = async (e, t = 4096) => {
      t % 2 === 1 && t++;
      let r = Buffer.alloc(t),
        n = new j.Hasher(),
        s;
      try {
        s = await E.promises.open(e, "r");
        let a = await s.read(r, 0, r.length, null),
          i = r.slice(0, a.bytesRead);
        if (B(i))
          for (n.update(i.slice(2)); a.bytesRead === r.length; )
            (a = await s.read(r, 0, r.length, null)),
              n.update(r.slice(0, a.bytesRead));
        else if (b(i))
          for (n.update(i.slice(2).swap16()); a.bytesRead === r.length; )
            (a = await s.read(r, 0, r.length, null)),
              n.update(r.slice(0, a.bytesRead).swap16());
        else if (g(i)) {
          let c = new z.StringDecoder("utf8");
          for (
            n.update(Buffer.from(c.write(i.slice(3)), "utf16le"));
            a.bytesRead === r.length;

          )
            (a = await s.read(r, 0, r.length, null)),
              n.update(
                Buffer.from(c.write(r.slice(0, a.bytesRead)), "utf16le"),
              );
        } else {
          let c = new z.StringDecoder("utf8");
          for (
            n.update(Buffer.from(c.write(i), "utf16le"));
            a.bytesRead === r.length;

          )
            (a = await s.read(r, 0, r.length, null)),
              n.update(
                Buffer.from(c.write(r.slice(0, a.bytesRead)), "utf16le"),
              );
        }
        return n.digest(w), w.toString("hex");
      } finally {
        n.free(), s !== void 0 && (await s.close());
      }
    };
    o.hashFile = le;
    var m = { stream: !0 },
      he = async (e, t = 4096) => {
        t % 2 === 1 && t++;
        let r = Buffer.alloc(t),
          n = (0, V.createHash)("sha256"),
          s;
        try {
          s = await E.promises.open(e, "r");
          let a = await s.read(r, 0, r.length, null),
            i = r.slice(0, a.bytesRead);
          if (B(i)) {
            let c = new TextDecoder("utf-16le");
            for (n.update(c.decode(i.slice(2), m)); a.bytesRead > 0; )
              (a = await s.read(r, 0, r.length, null)),
                n.update(c.decode(r.slice(0, a.bytesRead), m));
          } else if (b(i)) {
            let c = new TextDecoder("utf-16be");
            for (n.update(c.decode(i.slice(2), m)); a.bytesRead > 0; )
              (a = await s.read(r, 0, r.length, null)),
                n.update(c.decode(r.slice(0, a.bytesRead), m));
          } else if (g(i))
            for (n.update(i.slice(3)); a.bytesRead > 0; )
              (a = await s.read(r, 0, r.length, null)),
                n.update(r.slice(0, a.bytesRead));
          else
            for (n.update(i); a.bytesRead > 0; )
              (a = await s.read(r, 0, r.length, null)),
                n.update(r.slice(0, a.bytesRead));
          return n.digest("hex");
        } finally {
          await s?.close();
        }
      };
    o.shaHashFile = he;
    var g = (e) =>
        e.length >= 3 && e[0] === 239 && e[1] === 187 && e[2] === 191,
      B = (e) => e.length >= 2 && e[0] === 255 && e[1] === 254,
      b = (e) => e.length >= 2 && e[0] === 254 && e[1] === 255,
      ue = (e) =>
        g(e)
          ? D(e.slice(3))
          : B(e)
            ? e.slice(2)
            : b(e)
              ? e.slice(2).swap16()
              : D(e),
      de = (e) =>
        g(e)
          ? e.slice(3)
          : B(e)
            ? new TextEncoder().encode(
                new TextDecoder("utf-16le").decode(e.slice(2)),
              )
            : b(e)
              ? new TextEncoder().encode(
                  new TextDecoder("utf-16be").decode(e.slice(2)),
                )
              : e;
    o.normalizeShaBuffer = de;
    var D = (e) => Buffer.from(e.toString("utf8"), "utf16le");
  });
  var d = X(W()),
    H = h("crypto"),
    T = h("fs"),
    S = h("worker_threads"),
    fe = ((s) => (
      (s[(s.HashFile = 0)] = "HashFile"),
      (s[(s.HashBytes = 1)] = "HashBytes"),
      (s[(s.VerifyFile = 2)] = "VerifyFile"),
      (s[(s.VerifyBytes = 3)] = "VerifyBytes"),
      s
    ))(fe || {}),
    _e = ((n) => (
      (n[(n.Chromehash = 0)] = "Chromehash"),
      (n[(n.SHA256 = 1)] = "SHA256"),
      (n[(n.SHA256Naive = 2)] = "SHA256Naive"),
      n
    ))(_e || {}),
    pe = (e) => (0, H.createHash)("sha256").update(e).digest("hex"),
    ye = Buffer.from(
      "(function (exports, require, module, __filename, __dirname) { ",
    ),
    me = Buffer.from(`
});`),
    we = Buffer.from(
      "(function (exports, require, module, __filename, __dirname, process, global, Buffer) { return function (exports, require, module, __filename, __dirname) { ",
    ),
    ge = Buffer.from(`
}.call(this, exports, require, module, __filename, __dirname); });`),
    Be = Buffer.from("#!"),
    be = Buffer.from("\r")[0],
    xe = Buffer.from(`
`)[0],
    He = (e, t) => e.slice(0, t.length).equals(t),
    x = (e, ...t) => {
      if (e.length !== 64)
        return (0, d.hash)(t.length === 1 ? t[0] : Buffer.concat(t)) === e;
      let r = (0, H.createHash)("sha256");
      for (let a of t) r.update(a);
      if (r.digest("hex") === e) return !0;
      let n = t.length === 1 ? t[0] : Buffer.concat(t),
        s = (0, d.normalizeShaBuffer)(n);
      return n === s
        ? !1
        : (0, H.createHash)("sha256").update(s).digest("hex") === e;
    },
    k = (e, t, r) => {
      if (x(t, e)) return !0;
      if (r) {
        if (He(e, Be)) {
          let n = e.indexOf(xe);
          return e[n - 1] === be && n--, x(t, e.subarray(n));
        }
        if (x(t, ye, e, me)) return !0;
      }
      return !!x(t, we, e, ge);
    },
    C = (e) => (e instanceof Buffer ? e : Buffer.from(e, "utf-8"));
  async function Re(e) {
    switch (e.type) {
      case 0:
        try {
          let t = await T.promises.readFile(e.file);
          return {
            id: e.id,
            hash:
              e.mode === 0
                ? (0, d.hash)(t)
                : e.mode === 2
                  ? pe(t)
                  : (0, d.shaHash)(t),
          };
        } catch {
          return { id: e.id };
        }
      case 1:
        try {
          return { id: e.id, hash: (0, d.hash)(C(e.data)) };
        } catch {
          return { id: e.id };
        }
      case 2:
        try {
          let t = await T.promises.readFile(e.file);
          return { id: e.id, matches: k(t, e.expected, e.checkNode) };
        } catch {
          return { id: e.id, matches: !1 };
        }
      case 3:
        try {
          return { id: e.id, matches: k(C(e.data), e.expected, e.checkNode) };
        } catch {
          return { id: e.id, matches: !1 };
        }
    }
  }
  function Fe(e) {
    e.on("message", (t) => {
      Re(t).then((r) => e.postMessage(r));
    });
  }
  S.parentPort && Fe(S.parentPort);
})();
//# sourceMappingURL=hash.js.map
