"use strict";
(() => {
  var Gf = Object.create;
  var Yr = Object.defineProperty;
  var Ko = Object.getOwnPropertyDescriptor;
  var Wf = Object.getOwnPropertyNames;
  var Vf = Object.getPrototypeOf,
    $f = Object.prototype.hasOwnProperty;
  var I = ((t) =>
    typeof require < "u"
      ? require
      : typeof Proxy < "u"
        ? new Proxy(t, {
            get: (e, n) => (typeof require < "u" ? require : e)[n],
          })
        : t)(function (t) {
    if (typeof require < "u") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + t + '" is not supported');
  });
  var g = (t, e) => () => (e || t((e = { exports: {} }).exports, e), e.exports);
  var Hf = (t, e, n, r) => {
    if ((e && typeof e == "object") || typeof e == "function")
      for (let i of Wf(e))
        !$f.call(t, i) &&
          i !== n &&
          Yr(t, i, {
            get: () => e[i],
            enumerable: !(r = Ko(e, i)) || r.enumerable,
          });
    return t;
  };
  var Z = (t, e, n) => (
    (n = t != null ? Gf(Vf(t)) : {}),
    Hf(
      e || !t || !t.__esModule
        ? Yr(n, "default", { value: t, enumerable: !0 })
        : n,
      t,
    )
  );
  var bn = (t, e, n, r) => {
    for (
      var i = r > 1 ? void 0 : r ? Ko(e, n) : e, o = t.length - 1, s;
      o >= 0;
      o--
    )
      (s = t[o]) && (i = (r ? s(e, n, i) : s(i)) || i);
    return r && i && Yr(e, n, i), i;
  };
  var zo = g(() => {
    var Yo;
    (function (t) {
      (function (e) {
        var n =
            typeof globalThis == "object"
              ? globalThis
              : typeof global == "object"
                ? global
                : typeof self == "object"
                  ? self
                  : typeof this == "object"
                    ? this
                    : u(),
          r = i(t);
        typeof n.Reflect < "u" && (r = i(n.Reflect, r)),
          e(r, n),
          typeof n.Reflect > "u" && (n.Reflect = t);
        function i(c, a) {
          return function (l, p) {
            Object.defineProperty(c, l, {
              configurable: !0,
              writable: !0,
              value: p,
            }),
              a && a(l, p);
          };
        }
        function o() {
          try {
            return Function("return this;")();
          } catch {}
        }
        function s() {
          try {
            return (0, eval)("(function() { return this; })()");
          } catch {}
        }
        function u() {
          return o() || s();
        }
      })(function (e, n) {
        var r = Object.prototype.hasOwnProperty,
          i = typeof Symbol == "function",
          o =
            i && typeof Symbol.toPrimitive < "u"
              ? Symbol.toPrimitive
              : "@@toPrimitive",
          s =
            i && typeof Symbol.iterator < "u" ? Symbol.iterator : "@@iterator",
          u = typeof Object.create == "function",
          c = { __proto__: [] } instanceof Array,
          a = !u && !c,
          l = {
            create: u
              ? function () {
                  return Kr(Object.create(null));
                }
              : c
                ? function () {
                    return Kr({ __proto__: null });
                  }
                : function () {
                    return Kr({});
                  },
            has: a
              ? function (f, d) {
                  return r.call(f, d);
                }
              : function (f, d) {
                  return d in f;
                },
            get: a
              ? function (f, d) {
                  return r.call(f, d) ? f[d] : void 0;
                }
              : function (f, d) {
                  return f[d];
                },
          },
          p = Object.getPrototypeOf(Function),
          m =
            typeof Map == "function" &&
            typeof Map.prototype.entries == "function"
              ? Map
              : Lf(),
          b =
            typeof Set == "function" &&
            typeof Set.prototype.entries == "function"
              ? Set
              : jf(),
          T = typeof WeakMap == "function" ? WeakMap : Ff(),
          w = i ? Symbol.for("@reflect-metadata:registry") : void 0,
          R = Df(),
          K = kf(R);
        function ue(f, d, h, y) {
          if (O(h)) {
            if (!Fo(f)) throw new TypeError();
            if (!Uo(d)) throw new TypeError();
            return Af(f, d);
          } else {
            if (!Fo(f)) throw new TypeError();
            if (!k(d)) throw new TypeError();
            if (!k(y) && !O(y) && !ht(y)) throw new TypeError();
            return ht(y) && (y = void 0), (h = we(h)), Cf(f, d, h, y);
          }
        }
        e("decorate", ue);
        function pt(f, d) {
          function h(y, C) {
            if (!k(y)) throw new TypeError();
            if (!O(C) && !Rf(C)) throw new TypeError();
            Do(f, d, y, C);
          }
          return h;
        }
        e("metadata", pt);
        function ge(f, d, h, y) {
          if (!k(h)) throw new TypeError();
          return O(y) || (y = we(y)), Do(f, d, h, y);
        }
        e("defineMetadata", ge);
        function be(f, d, h) {
          if (!k(d)) throw new TypeError();
          return O(h) || (h = we(h)), Po(f, d, h);
        }
        e("hasMetadata", be);
        function Ze(f, d, h) {
          if (!k(d)) throw new TypeError();
          return O(h) || (h = we(h)), Vr(f, d, h);
        }
        e("hasOwnMetadata", Ze);
        function Ke(f, d, h) {
          if (!k(d)) throw new TypeError();
          return O(h) || (h = we(h)), Ro(f, d, h);
        }
        e("getMetadata", Ke);
        function vn(f, d, h) {
          if (!k(d)) throw new TypeError();
          return O(h) || (h = we(h)), Mo(f, d, h);
        }
        e("getOwnMetadata", vn);
        function jt(f, d) {
          if (!k(f)) throw new TypeError();
          return O(d) || (d = we(d)), ko(f, d);
        }
        e("getMetadataKeys", jt);
        function Wr(f, d) {
          if (!k(f)) throw new TypeError();
          return O(d) || (d = we(d)), Bo(f, d);
        }
        e("getOwnMetadataKeys", Wr);
        function xf(f, d, h) {
          if (!k(d)) throw new TypeError();
          if ((O(h) || (h = we(h)), !k(d))) throw new TypeError();
          O(h) || (h = we(h));
          var y = Ft(d, h, !1);
          return O(y) ? !1 : y.OrdinaryDeleteMetadata(f, d, h);
        }
        e("deleteMetadata", xf);
        function Af(f, d) {
          for (var h = f.length - 1; h >= 0; --h) {
            var y = f[h],
              C = y(d);
            if (!O(C) && !ht(C)) {
              if (!Uo(C)) throw new TypeError();
              d = C;
            }
          }
          return d;
        }
        function Cf(f, d, h, y) {
          for (var C = f.length - 1; C >= 0; --C) {
            var B = f[C],
              G = B(d, h, y);
            if (!O(G) && !ht(G)) {
              if (!k(G)) throw new TypeError();
              y = G;
            }
          }
          return y;
        }
        function Po(f, d, h) {
          var y = Vr(f, d, h);
          if (y) return !0;
          var C = Hr(d);
          return ht(C) ? !1 : Po(f, C, h);
        }
        function Vr(f, d, h) {
          var y = Ft(d, h, !1);
          return O(y) ? !1 : jo(y.OrdinaryHasOwnMetadata(f, d, h));
        }
        function Ro(f, d, h) {
          var y = Vr(f, d, h);
          if (y) return Mo(f, d, h);
          var C = Hr(d);
          if (!ht(C)) return Ro(f, C, h);
        }
        function Mo(f, d, h) {
          var y = Ft(d, h, !1);
          if (!O(y)) return y.OrdinaryGetOwnMetadata(f, d, h);
        }
        function Do(f, d, h, y) {
          var C = Ft(h, y, !0);
          C.OrdinaryDefineOwnMetadata(f, d, h, y);
        }
        function ko(f, d) {
          var h = Bo(f, d),
            y = Hr(f);
          if (y === null) return h;
          var C = ko(y, d);
          if (C.length <= 0) return h;
          if (h.length <= 0) return C;
          for (var B = new b(), G = [], N = 0, _ = h; N < _.length; N++) {
            var x = _[N],
              E = B.has(x);
            E || (B.add(x), G.push(x));
          }
          for (var A = 0, P = C; A < P.length; A++) {
            var x = P[A],
              E = B.has(x);
            E || (B.add(x), G.push(x));
          }
          return G;
        }
        function Bo(f, d) {
          var h = Ft(f, d, !1);
          return h ? h.OrdinaryOwnMetadataKeys(f, d) : [];
        }
        function Lo(f) {
          if (f === null) return 1;
          switch (typeof f) {
            case "undefined":
              return 0;
            case "boolean":
              return 2;
            case "string":
              return 3;
            case "symbol":
              return 4;
            case "number":
              return 5;
            case "object":
              return f === null ? 1 : 6;
            default:
              return 6;
          }
        }
        function O(f) {
          return f === void 0;
        }
        function ht(f) {
          return f === null;
        }
        function If(f) {
          return typeof f == "symbol";
        }
        function k(f) {
          return typeof f == "object" ? f !== null : typeof f == "function";
        }
        function Of(f, d) {
          switch (Lo(f)) {
            case 0:
              return f;
            case 1:
              return f;
            case 2:
              return f;
            case 3:
              return f;
            case 4:
              return f;
            case 5:
              return f;
          }
          var h = d === 3 ? "string" : d === 5 ? "number" : "default",
            y = qo(f, o);
          if (y !== void 0) {
            var C = y.call(f, h);
            if (k(C)) throw new TypeError();
            return C;
          }
          return Nf(f, h === "default" ? "number" : h);
        }
        function Nf(f, d) {
          if (d === "string") {
            var h = f.toString;
            if (gt(h)) {
              var y = h.call(f);
              if (!k(y)) return y;
            }
            var C = f.valueOf;
            if (gt(C)) {
              var y = C.call(f);
              if (!k(y)) return y;
            }
          } else {
            var C = f.valueOf;
            if (gt(C)) {
              var y = C.call(f);
              if (!k(y)) return y;
            }
            var B = f.toString;
            if (gt(B)) {
              var y = B.call(f);
              if (!k(y)) return y;
            }
          }
          throw new TypeError();
        }
        function jo(f) {
          return !!f;
        }
        function Pf(f) {
          return "" + f;
        }
        function we(f) {
          var d = Of(f, 3);
          return If(d) ? d : Pf(d);
        }
        function Fo(f) {
          return Array.isArray
            ? Array.isArray(f)
            : f instanceof Object
              ? f instanceof Array
              : Object.prototype.toString.call(f) === "[object Array]";
        }
        function gt(f) {
          return typeof f == "function";
        }
        function Uo(f) {
          return typeof f == "function";
        }
        function Rf(f) {
          switch (Lo(f)) {
            case 3:
              return !0;
            case 4:
              return !0;
            default:
              return !1;
          }
        }
        function $r(f, d) {
          return f === d || (f !== f && d !== d);
        }
        function qo(f, d) {
          var h = f[d];
          if (h != null) {
            if (!gt(h)) throw new TypeError();
            return h;
          }
        }
        function Go(f) {
          var d = qo(f, s);
          if (!gt(d)) throw new TypeError();
          var h = d.call(f);
          if (!k(h)) throw new TypeError();
          return h;
        }
        function Wo(f) {
          return f.value;
        }
        function Vo(f) {
          var d = f.next();
          return d.done ? !1 : d;
        }
        function $o(f) {
          var d = f.return;
          d && d.call(f);
        }
        function Hr(f) {
          var d = Object.getPrototypeOf(f);
          if (typeof f != "function" || f === p || d !== p) return d;
          var h = f.prototype,
            y = h && Object.getPrototypeOf(h);
          if (y == null || y === Object.prototype) return d;
          var C = y.constructor;
          return typeof C != "function" || C === f ? d : C;
        }
        function Mf() {
          var f;
          !O(w) &&
            typeof n.Reflect < "u" &&
            !(w in n.Reflect) &&
            typeof n.Reflect.defineMetadata == "function" &&
            (f = Bf(n.Reflect));
          var d,
            h,
            y,
            C = new T(),
            B = { registerProvider: G, getProvider: _, setProvider: E };
          return B;
          function G(A) {
            if (!Object.isExtensible(B))
              throw new Error("Cannot add provider to a frozen registry.");
            switch (!0) {
              case f === A:
                break;
              case O(d):
                d = A;
                break;
              case d === A:
                break;
              case O(h):
                h = A;
                break;
              case h === A:
                break;
              default:
                y === void 0 && (y = new b()), y.add(A);
                break;
            }
          }
          function N(A, P) {
            if (!O(d)) {
              if (d.isProviderFor(A, P)) return d;
              if (!O(h)) {
                if (h.isProviderFor(A, P)) return d;
                if (!O(y))
                  for (var D = Go(y); ; ) {
                    var L = Vo(D);
                    if (!L) return;
                    var me = Wo(L);
                    if (me.isProviderFor(A, P)) return $o(D), me;
                  }
              }
            }
            if (!O(f) && f.isProviderFor(A, P)) return f;
          }
          function _(A, P) {
            var D = C.get(A),
              L;
            return (
              O(D) || (L = D.get(P)),
              O(L) &&
                ((L = N(A, P)),
                O(L) || (O(D) && ((D = new m()), C.set(A, D)), D.set(P, L))),
              L
            );
          }
          function x(A) {
            if (O(A)) throw new TypeError();
            return d === A || h === A || (!O(y) && y.has(A));
          }
          function E(A, P, D) {
            if (!x(D)) throw new Error("Metadata provider not registered.");
            var L = _(A, P);
            if (L !== D) {
              if (!O(L)) return !1;
              var me = C.get(A);
              O(me) && ((me = new m()), C.set(A, me)), me.set(P, D);
            }
            return !0;
          }
        }
        function Df() {
          var f;
          return (
            !O(w) &&
              k(n.Reflect) &&
              Object.isExtensible(n.Reflect) &&
              (f = n.Reflect[w]),
            O(f) && (f = Mf()),
            !O(w) &&
              k(n.Reflect) &&
              Object.isExtensible(n.Reflect) &&
              Object.defineProperty(n.Reflect, w, {
                enumerable: !1,
                configurable: !1,
                writable: !1,
                value: f,
              }),
            f
          );
        }
        function kf(f) {
          var d = new T(),
            h = {
              isProviderFor: function (x, E) {
                var A = d.get(x);
                return O(A) ? !1 : A.has(E);
              },
              OrdinaryDefineOwnMetadata: G,
              OrdinaryHasOwnMetadata: C,
              OrdinaryGetOwnMetadata: B,
              OrdinaryOwnMetadataKeys: N,
              OrdinaryDeleteMetadata: _,
            };
          return R.registerProvider(h), h;
          function y(x, E, A) {
            var P = d.get(x),
              D = !1;
            if (O(P)) {
              if (!A) return;
              (P = new m()), d.set(x, P), (D = !0);
            }
            var L = P.get(E);
            if (O(L)) {
              if (!A) return;
              if (((L = new m()), P.set(E, L), !f.setProvider(x, E, h)))
                throw (
                  (P.delete(E),
                  D && d.delete(x),
                  new Error("Wrong provider for target."))
                );
            }
            return L;
          }
          function C(x, E, A) {
            var P = y(E, A, !1);
            return O(P) ? !1 : jo(P.has(x));
          }
          function B(x, E, A) {
            var P = y(E, A, !1);
            if (!O(P)) return P.get(x);
          }
          function G(x, E, A, P) {
            var D = y(A, P, !0);
            D.set(x, E);
          }
          function N(x, E) {
            var A = [],
              P = y(x, E, !1);
            if (O(P)) return A;
            for (var D = P.keys(), L = Go(D), me = 0; ; ) {
              var Ho = Vo(L);
              if (!Ho) return (A.length = me), A;
              var Uf = Wo(Ho);
              try {
                A[me] = Uf;
              } catch (qf) {
                try {
                  $o(L);
                } finally {
                  throw qf;
                }
              }
              me++;
            }
          }
          function _(x, E, A) {
            var P = y(E, A, !1);
            if (O(P) || !P.delete(x)) return !1;
            if (P.size === 0) {
              var D = d.get(E);
              O(D) || (D.delete(A), D.size === 0 && d.delete(D));
            }
            return !0;
          }
        }
        function Bf(f) {
          var d = f.defineMetadata,
            h = f.hasOwnMetadata,
            y = f.getOwnMetadata,
            C = f.getOwnMetadataKeys,
            B = f.deleteMetadata,
            G = new T(),
            N = {
              isProviderFor: function (_, x) {
                var E = G.get(_);
                return O(E)
                  ? C(_, x).length
                    ? (O(E) && ((E = new b()), G.set(_, E)), E.add(x), !0)
                    : !1
                  : E.has(x);
              },
              OrdinaryDefineOwnMetadata: d,
              OrdinaryHasOwnMetadata: h,
              OrdinaryGetOwnMetadata: y,
              OrdinaryOwnMetadataKeys: C,
              OrdinaryDeleteMetadata: B,
            };
          return N;
        }
        function Ft(f, d, h) {
          var y = R.getProvider(f, d);
          if (!O(y)) return y;
          if (h) {
            if (R.setProvider(f, d, K)) return K;
            throw new Error("Illegal state.");
          }
        }
        function Lf() {
          var f = {},
            d = [],
            h = (function () {
              function N(_, x, E) {
                (this._index = 0),
                  (this._keys = _),
                  (this._values = x),
                  (this._selector = E);
              }
              return (
                (N.prototype["@@iterator"] = function () {
                  return this;
                }),
                (N.prototype[s] = function () {
                  return this;
                }),
                (N.prototype.next = function () {
                  var _ = this._index;
                  if (_ >= 0 && _ < this._keys.length) {
                    var x = this._selector(this._keys[_], this._values[_]);
                    return (
                      _ + 1 >= this._keys.length
                        ? ((this._index = -1),
                          (this._keys = d),
                          (this._values = d))
                        : this._index++,
                      { value: x, done: !1 }
                    );
                  }
                  return { value: void 0, done: !0 };
                }),
                (N.prototype.throw = function (_) {
                  throw (
                    (this._index >= 0 &&
                      ((this._index = -1),
                      (this._keys = d),
                      (this._values = d)),
                    _)
                  );
                }),
                (N.prototype.return = function (_) {
                  return (
                    this._index >= 0 &&
                      ((this._index = -1),
                      (this._keys = d),
                      (this._values = d)),
                    { value: _, done: !0 }
                  );
                }),
                N
              );
            })(),
            y = (function () {
              function N() {
                (this._keys = []),
                  (this._values = []),
                  (this._cacheKey = f),
                  (this._cacheIndex = -2);
              }
              return (
                Object.defineProperty(N.prototype, "size", {
                  get: function () {
                    return this._keys.length;
                  },
                  enumerable: !0,
                  configurable: !0,
                }),
                (N.prototype.has = function (_) {
                  return this._find(_, !1) >= 0;
                }),
                (N.prototype.get = function (_) {
                  var x = this._find(_, !1);
                  return x >= 0 ? this._values[x] : void 0;
                }),
                (N.prototype.set = function (_, x) {
                  var E = this._find(_, !0);
                  return (this._values[E] = x), this;
                }),
                (N.prototype.delete = function (_) {
                  var x = this._find(_, !1);
                  if (x >= 0) {
                    for (var E = this._keys.length, A = x + 1; A < E; A++)
                      (this._keys[A - 1] = this._keys[A]),
                        (this._values[A - 1] = this._values[A]);
                    return (
                      this._keys.length--,
                      this._values.length--,
                      $r(_, this._cacheKey) &&
                        ((this._cacheKey = f), (this._cacheIndex = -2)),
                      !0
                    );
                  }
                  return !1;
                }),
                (N.prototype.clear = function () {
                  (this._keys.length = 0),
                    (this._values.length = 0),
                    (this._cacheKey = f),
                    (this._cacheIndex = -2);
                }),
                (N.prototype.keys = function () {
                  return new h(this._keys, this._values, C);
                }),
                (N.prototype.values = function () {
                  return new h(this._keys, this._values, B);
                }),
                (N.prototype.entries = function () {
                  return new h(this._keys, this._values, G);
                }),
                (N.prototype["@@iterator"] = function () {
                  return this.entries();
                }),
                (N.prototype[s] = function () {
                  return this.entries();
                }),
                (N.prototype._find = function (_, x) {
                  if (!$r(this._cacheKey, _)) {
                    this._cacheIndex = -1;
                    for (var E = 0; E < this._keys.length; E++)
                      if ($r(this._keys[E], _)) {
                        this._cacheIndex = E;
                        break;
                      }
                  }
                  return (
                    this._cacheIndex < 0 &&
                      x &&
                      ((this._cacheIndex = this._keys.length),
                      this._keys.push(_),
                      this._values.push(void 0)),
                    this._cacheIndex
                  );
                }),
                N
              );
            })();
          return y;
          function C(N, _) {
            return N;
          }
          function B(N, _) {
            return _;
          }
          function G(N, _) {
            return [N, _];
          }
        }
        function jf() {
          var f = (function () {
            function d() {
              this._map = new m();
            }
            return (
              Object.defineProperty(d.prototype, "size", {
                get: function () {
                  return this._map.size;
                },
                enumerable: !0,
                configurable: !0,
              }),
              (d.prototype.has = function (h) {
                return this._map.has(h);
              }),
              (d.prototype.add = function (h) {
                return this._map.set(h, h), this;
              }),
              (d.prototype.delete = function (h) {
                return this._map.delete(h);
              }),
              (d.prototype.clear = function () {
                this._map.clear();
              }),
              (d.prototype.keys = function () {
                return this._map.keys();
              }),
              (d.prototype.values = function () {
                return this._map.keys();
              }),
              (d.prototype.entries = function () {
                return this._map.entries();
              }),
              (d.prototype["@@iterator"] = function () {
                return this.keys();
              }),
              (d.prototype[s] = function () {
                return this.keys();
              }),
              d
            );
          })();
          return f;
        }
        function Ff() {
          var f = 16,
            d = l.create(),
            h = y();
          return (function () {
            function _() {
              this._key = y();
            }
            return (
              (_.prototype.has = function (x) {
                var E = C(x, !1);
                return E !== void 0 ? l.has(E, this._key) : !1;
              }),
              (_.prototype.get = function (x) {
                var E = C(x, !1);
                return E !== void 0 ? l.get(E, this._key) : void 0;
              }),
              (_.prototype.set = function (x, E) {
                var A = C(x, !0);
                return (A[this._key] = E), this;
              }),
              (_.prototype.delete = function (x) {
                var E = C(x, !1);
                return E !== void 0 ? delete E[this._key] : !1;
              }),
              (_.prototype.clear = function () {
                this._key = y();
              }),
              _
            );
          })();
          function y() {
            var _;
            do _ = "@@WeakMap@@" + N();
            while (l.has(d, _));
            return (d[_] = !0), _;
          }
          function C(_, x) {
            if (!r.call(_, h)) {
              if (!x) return;
              Object.defineProperty(_, h, { value: l.create() });
            }
            return _[h];
          }
          function B(_, x) {
            for (var E = 0; E < x; ++E) _[E] = (Math.random() * 255) | 0;
            return _;
          }
          function G(_) {
            return typeof Uint8Array == "function"
              ? typeof crypto < "u"
                ? crypto.getRandomValues(new Uint8Array(_))
                : typeof msCrypto < "u"
                  ? msCrypto.getRandomValues(new Uint8Array(_))
                  : B(new Uint8Array(_), _)
              : B(new Array(_), _);
          }
          function N() {
            var _ = G(f);
            (_[6] = (_[6] & 79) | 64), (_[8] = (_[8] & 191) | 128);
            for (var x = "", E = 0; E < f; ++E) {
              var A = _[E];
              (E === 4 || E === 6 || E === 8) && (x += "-"),
                A < 16 && (x += "0"),
                (x += A.toString(16).toLowerCase());
            }
            return x;
          }
        }
        function Kr(f) {
          return (f.__ = void 0), delete f.__, f;
        }
      });
    })(Yo || (Yo = {}));
  });
  var U = g((M) => {
    "use strict";
    Object.defineProperty(M, "__esModule", { value: !0 });
    M.NON_CUSTOM_TAG_KEYS =
      M.PRE_DESTROY =
      M.POST_CONSTRUCT =
      M.DESIGN_PARAM_TYPES =
      M.PARAM_TYPES =
      M.TAGGED_PROP =
      M.TAGGED =
      M.MULTI_INJECT_TAG =
      M.INJECT_TAG =
      M.OPTIONAL_TAG =
      M.UNMANAGED_TAG =
      M.NAME_TAG =
      M.NAMED_TAG =
        void 0;
    M.NAMED_TAG = "named";
    M.NAME_TAG = "name";
    M.UNMANAGED_TAG = "unmanaged";
    M.OPTIONAL_TAG = "optional";
    M.INJECT_TAG = "inject";
    M.MULTI_INJECT_TAG = "multi_inject";
    M.TAGGED = "inversify:tagged";
    M.TAGGED_PROP = "inversify:tagged_props";
    M.PARAM_TYPES = "inversify:paramtypes";
    M.DESIGN_PARAM_TYPES = "design:paramtypes";
    M.POST_CONSTRUCT = "post_construct";
    M.PRE_DESTROY = "pre_destroy";
    function Yf() {
      return [
        M.INJECT_TAG,
        M.MULTI_INJECT_TAG,
        M.NAME_TAG,
        M.UNMANAGED_TAG,
        M.NAMED_TAG,
        M.OPTIONAL_TAG,
      ];
    }
    M.NON_CUSTOM_TAG_KEYS = Yf();
  });
  var ce = g((Ye) => {
    "use strict";
    Object.defineProperty(Ye, "__esModule", { value: !0 });
    Ye.TargetTypeEnum = Ye.BindingTypeEnum = Ye.BindingScopeEnum = void 0;
    var zf = {
      Request: "Request",
      Singleton: "Singleton",
      Transient: "Transient",
    };
    Ye.BindingScopeEnum = zf;
    var Jf = {
      ConstantValue: "ConstantValue",
      Constructor: "Constructor",
      DynamicValue: "DynamicValue",
      Factory: "Factory",
      Function: "Function",
      Instance: "Instance",
      Invalid: "Invalid",
      Provider: "Provider",
    };
    Ye.BindingTypeEnum = Jf;
    var Xf = {
      ClassProperty: "ClassProperty",
      ConstructorArgument: "ConstructorArgument",
      Variable: "Variable",
    };
    Ye.TargetTypeEnum = Xf;
  });
  var ze = g((wn) => {
    "use strict";
    Object.defineProperty(wn, "__esModule", { value: !0 });
    wn.id = void 0;
    var Qf = 0;
    function Zf() {
      return Qf++;
    }
    wn.id = Zf;
  });
  var Xo = g((Sn) => {
    "use strict";
    Object.defineProperty(Sn, "__esModule", { value: !0 });
    Sn.Binding = void 0;
    var Jo = ce(),
      ed = ze(),
      td = (function () {
        function t(e, n) {
          (this.id = (0, ed.id)()),
            (this.activated = !1),
            (this.serviceIdentifier = e),
            (this.scope = n),
            (this.type = Jo.BindingTypeEnum.Invalid),
            (this.constraint = function (r) {
              return !0;
            }),
            (this.implementationType = null),
            (this.cache = null),
            (this.factory = null),
            (this.provider = null),
            (this.onActivation = null),
            (this.onDeactivation = null),
            (this.dynamicValue = null);
        }
        return (
          (t.prototype.clone = function () {
            var e = new t(this.serviceIdentifier, this.scope);
            return (
              (e.activated =
                e.scope === Jo.BindingScopeEnum.Singleton
                  ? this.activated
                  : !1),
              (e.implementationType = this.implementationType),
              (e.dynamicValue = this.dynamicValue),
              (e.scope = this.scope),
              (e.type = this.type),
              (e.factory = this.factory),
              (e.provider = this.provider),
              (e.constraint = this.constraint),
              (e.onActivation = this.onActivation),
              (e.onDeactivation = this.onDeactivation),
              (e.cache = this.cache),
              e
            );
          }),
          t
        );
      })();
    Sn.Binding = td;
  });
  var Y = g((S) => {
    "use strict";
    Object.defineProperty(S, "__esModule", { value: !0 });
    S.STACK_OVERFLOW =
      S.CIRCULAR_DEPENDENCY_IN_FACTORY =
      S.ON_DEACTIVATION_ERROR =
      S.PRE_DESTROY_ERROR =
      S.POST_CONSTRUCT_ERROR =
      S.ASYNC_UNBIND_REQUIRED =
      S.MULTIPLE_POST_CONSTRUCT_METHODS =
      S.MULTIPLE_PRE_DESTROY_METHODS =
      S.CONTAINER_OPTIONS_INVALID_SKIP_BASE_CHECK =
      S.CONTAINER_OPTIONS_INVALID_AUTO_BIND_INJECTABLE =
      S.CONTAINER_OPTIONS_INVALID_DEFAULT_SCOPE =
      S.CONTAINER_OPTIONS_MUST_BE_AN_OBJECT =
      S.ARGUMENTS_LENGTH_MISMATCH =
      S.INVALID_DECORATOR_OPERATION =
      S.INVALID_TO_SELF_VALUE =
      S.LAZY_IN_SYNC =
      S.INVALID_FUNCTION_BINDING =
      S.INVALID_MIDDLEWARE_RETURN =
      S.NO_MORE_SNAPSHOTS_AVAILABLE =
      S.INVALID_BINDING_TYPE =
      S.NOT_IMPLEMENTED =
      S.CIRCULAR_DEPENDENCY =
      S.UNDEFINED_INJECT_ANNOTATION =
      S.MISSING_INJECT_ANNOTATION =
      S.MISSING_INJECTABLE_ANNOTATION =
      S.NOT_REGISTERED =
      S.CANNOT_UNBIND =
      S.AMBIGUOUS_MATCH =
      S.KEY_NOT_FOUND =
      S.NULL_ARGUMENT =
      S.DUPLICATED_METADATA =
      S.DUPLICATED_INJECTABLE_DECORATOR =
        void 0;
    S.DUPLICATED_INJECTABLE_DECORATOR =
      "Cannot apply @injectable decorator multiple times.";
    S.DUPLICATED_METADATA =
      "Metadata key was used more than once in a parameter:";
    S.NULL_ARGUMENT = "NULL argument";
    S.KEY_NOT_FOUND = "Key Not Found";
    S.AMBIGUOUS_MATCH = "Ambiguous match found for serviceIdentifier:";
    S.CANNOT_UNBIND = "Could not unbind serviceIdentifier:";
    S.NOT_REGISTERED = "No matching bindings found for serviceIdentifier:";
    S.MISSING_INJECTABLE_ANNOTATION =
      "Missing required @injectable annotation in:";
    S.MISSING_INJECT_ANNOTATION =
      "Missing required @inject or @multiInject annotation in:";
    var nd = function (t) {
      return (
        "@inject called with undefined this could mean that the class " +
        t +
        " has a circular dependency problem. You can use a LazyServiceIdentifier to  overcome this limitation."
      );
    };
    S.UNDEFINED_INJECT_ANNOTATION = nd;
    S.CIRCULAR_DEPENDENCY = "Circular dependency found:";
    S.NOT_IMPLEMENTED = "Sorry, this feature is not fully implemented yet.";
    S.INVALID_BINDING_TYPE = "Invalid binding type:";
    S.NO_MORE_SNAPSHOTS_AVAILABLE = "No snapshot available to restore.";
    S.INVALID_MIDDLEWARE_RETURN =
      "Invalid return type in middleware. Middleware must return!";
    S.INVALID_FUNCTION_BINDING =
      "Value provided to function binding must be a function!";
    var rd = function (t) {
      return (
        "You are attempting to construct '" +
        t +
        `' in a synchronous way
 but it has asynchronous dependencies.`
      );
    };
    S.LAZY_IN_SYNC = rd;
    S.INVALID_TO_SELF_VALUE =
      "The toSelf function can only be applied when a constructor is used as service identifier";
    S.INVALID_DECORATOR_OPERATION =
      "The @inject @multiInject @tagged and @named decorators must be applied to the parameters of a class constructor or a class property.";
    var id = function () {
      for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e];
      return (
        "The number of constructor arguments in the derived class " +
        (t[0] +
          " must be >= than the number of constructor arguments of its base class.")
      );
    };
    S.ARGUMENTS_LENGTH_MISMATCH = id;
    S.CONTAINER_OPTIONS_MUST_BE_AN_OBJECT =
      "Invalid Container constructor argument. Container options must be an object.";
    S.CONTAINER_OPTIONS_INVALID_DEFAULT_SCOPE =
      'Invalid Container option. Default scope must be a string ("singleton" or "transient").';
    S.CONTAINER_OPTIONS_INVALID_AUTO_BIND_INJECTABLE =
      "Invalid Container option. Auto bind injectable must be a boolean";
    S.CONTAINER_OPTIONS_INVALID_SKIP_BASE_CHECK =
      "Invalid Container option. Skip base check must be a boolean";
    S.MULTIPLE_PRE_DESTROY_METHODS =
      "Cannot apply @preDestroy decorator multiple times in the same class";
    S.MULTIPLE_POST_CONSTRUCT_METHODS =
      "Cannot apply @postConstruct decorator multiple times in the same class";
    S.ASYNC_UNBIND_REQUIRED =
      "Attempting to unbind dependency with asynchronous destruction (@preDestroy or onDeactivation)";
    var od = function (t, e) {
      return "@postConstruct error in class " + t + ": " + e;
    };
    S.POST_CONSTRUCT_ERROR = od;
    var sd = function (t, e) {
      return "@preDestroy error in class " + t + ": " + e;
    };
    S.PRE_DESTROY_ERROR = sd;
    var ad = function (t, e) {
      return "onDeactivation() error in class " + t + ": " + e;
    };
    S.ON_DEACTIVATION_ERROR = ad;
    var ud = function (t, e) {
      return (
        "It looks like there is a circular dependency in one of the '" +
        t +
        "' bindings. Please investigate bindings with " +
        ("service identifier '" + e + "'.")
      );
    };
    S.CIRCULAR_DEPENDENCY_IN_FACTORY = ud;
    S.STACK_OVERFLOW = "Maximum call stack size exceeded";
  });
  var Jr = g((Se) => {
    "use strict";
    var cd =
        (Se && Se.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      ld =
        (Se && Se.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      fd =
        (Se && Se.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                cd(e, t, n);
          return ld(e, t), e;
        };
    Object.defineProperty(Se, "__esModule", { value: !0 });
    Se.MetadataReader = void 0;
    var zr = fd(U()),
      dd = (function () {
        function t() {}
        return (
          (t.prototype.getConstructorMetadata = function (e) {
            var n = Reflect.getMetadata(zr.PARAM_TYPES, e),
              r = Reflect.getMetadata(zr.TAGGED, e);
            return {
              compilerGeneratedMetadata: n,
              userGeneratedMetadata: r || {},
            };
          }),
          (t.prototype.getPropertiesMetadata = function (e) {
            var n = Reflect.getMetadata(zr.TAGGED_PROP, e) || [];
            return n;
          }),
          t
        );
      })();
    Se.MetadataReader = dd;
  });
  var Qo = g((Tn) => {
    "use strict";
    Object.defineProperty(Tn, "__esModule", { value: !0 });
    Tn.BindingCount = void 0;
    Tn.BindingCount = {
      MultipleBindingsAvailable: 2,
      NoBindingsAvailable: 0,
      OnlyOneBindingAvailable: 1,
    };
  });
  var Xr = g((le) => {
    "use strict";
    var pd =
        (le && le.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      hd =
        (le && le.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      gd =
        (le && le.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                pd(e, t, n);
          return hd(e, t), e;
        };
    Object.defineProperty(le, "__esModule", { value: !0 });
    le.tryAndThrowErrorIfStackOverflow = le.isStackOverflowExeption = void 0;
    var md = gd(Y());
    function Zo(t) {
      return t instanceof RangeError || t.message === md.STACK_OVERFLOW;
    }
    le.isStackOverflowExeption = Zo;
    var yd = function (t, e) {
      try {
        return t();
      } catch (n) {
        throw (Zo(n) && (n = e()), n);
      }
    };
    le.tryAndThrowErrorIfStackOverflow = yd;
  });
  var et = g((q) => {
    "use strict";
    var _d =
        (q && q.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      vd =
        (q && q.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      bd =
        (q && q.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                _d(e, t, n);
          return vd(e, t), e;
        };
    Object.defineProperty(q, "__esModule", { value: !0 });
    q.getSymbolDescription =
      q.circularDependencyToException =
      q.listMetadataForTarget =
      q.listRegisteredBindingsForServiceIdentifier =
      q.getServiceIdentifierAsString =
      q.getFunctionName =
        void 0;
    var wd = bd(Y());
    function es(t) {
      if (typeof t == "function") {
        var e = t;
        return e.name;
      } else {
        if (typeof t == "symbol") return t.toString();
        var e = t;
        return e;
      }
    }
    q.getServiceIdentifierAsString = es;
    function Sd(t, e, n) {
      var r = "",
        i = n(t, e);
      return (
        i.length !== 0 &&
          ((r = `
Registered bindings:`),
          i.forEach(function (o) {
            var s = "Object";
            o.implementationType !== null && (s = rs(o.implementationType)),
              (r =
                r +
                `
 ` +
                s),
              o.constraint.metaData && (r = r + " - " + o.constraint.metaData);
          })),
        r
      );
    }
    q.listRegisteredBindingsForServiceIdentifier = Sd;
    function ts(t, e) {
      return t.parentRequest === null
        ? !1
        : t.parentRequest.serviceIdentifier === e
          ? !0
          : ts(t.parentRequest, e);
    }
    function Td(t) {
      function e(r, i) {
        i === void 0 && (i = []);
        var o = es(r.serviceIdentifier);
        return i.push(o), r.parentRequest !== null ? e(r.parentRequest, i) : i;
      }
      var n = e(t);
      return n.reverse().join(" --> ");
    }
    function ns(t) {
      t.childRequests.forEach(function (e) {
        if (ts(e, e.serviceIdentifier)) {
          var n = Td(e);
          throw new Error(wd.CIRCULAR_DEPENDENCY + " " + n);
        } else ns(e);
      });
    }
    q.circularDependencyToException = ns;
    function Ed(t, e) {
      if (e.isTagged() || e.isNamed()) {
        var n = "",
          r = e.getNamedTag(),
          i = e.getCustomTags();
        return (
          r !== null &&
            (n +=
              r.toString() +
              `
`),
          i !== null &&
            i.forEach(function (o) {
              n +=
                o.toString() +
                `
`;
            }),
          " " +
            t +
            `
 ` +
            t +
            " - " +
            n
        );
      } else return " " + t;
    }
    q.listMetadataForTarget = Ed;
    function rs(t) {
      if (t.name) return t.name;
      var e = t.toString(),
        n = e.match(/^function\s*([^\s(]+)/);
      return n ? n[1] : "Anonymous function: " + e;
    }
    q.getFunctionName = rs;
    function xd(t) {
      return t.toString().slice(7, -1);
    }
    q.getSymbolDescription = xd;
  });
  var is = g((En) => {
    "use strict";
    Object.defineProperty(En, "__esModule", { value: !0 });
    En.Context = void 0;
    var Ad = ze(),
      Cd = (function () {
        function t(e) {
          (this.id = (0, Ad.id)()), (this.container = e);
        }
        return (
          (t.prototype.addPlan = function (e) {
            this.plan = e;
          }),
          (t.prototype.setCurrentRequest = function (e) {
            this.currentRequest = e;
          }),
          t
        );
      })();
    En.Context = Cd;
  });
  var ye = g((Te) => {
    "use strict";
    var Id =
        (Te && Te.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Od =
        (Te && Te.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      Nd =
        (Te && Te.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Id(e, t, n);
          return Od(e, t), e;
        };
    Object.defineProperty(Te, "__esModule", { value: !0 });
    Te.Metadata = void 0;
    var Pd = Nd(U()),
      Rd = (function () {
        function t(e, n) {
          (this.key = e), (this.value = n);
        }
        return (
          (t.prototype.toString = function () {
            return this.key === Pd.NAMED_TAG
              ? "named: " + String(this.value).toString() + " "
              : "tagged: { key:" +
                  this.key.toString() +
                  ", value: " +
                  String(this.value) +
                  " }";
          }),
          t
        );
      })();
    Te.Metadata = Rd;
  });
  var os = g((xn) => {
    "use strict";
    Object.defineProperty(xn, "__esModule", { value: !0 });
    xn.Plan = void 0;
    var Md = (function () {
      function t(e, n) {
        (this.parentContext = e), (this.rootRequest = n);
      }
      return t;
    })();
    xn.Plan = Md;
  });
  var Cn = g((An) => {
    "use strict";
    Object.defineProperty(An, "__esModule", { value: !0 });
    An.LazyServiceIdentifier = void 0;
    var Dd = (function () {
      function t(e) {
        this._cb = e;
      }
      return (
        (t.prototype.unwrap = function () {
          return this._cb();
        }),
        t
      );
    })();
    An.LazyServiceIdentifier = Dd;
  });
  var ss = g((In) => {
    "use strict";
    Object.defineProperty(In, "__esModule", { value: !0 });
    In.QueryableString = void 0;
    var kd = (function () {
      function t(e) {
        this.str = e;
      }
      return (
        (t.prototype.startsWith = function (e) {
          return this.str.indexOf(e) === 0;
        }),
        (t.prototype.endsWith = function (e) {
          var n = "",
            r = e.split("").reverse().join("");
          return (
            (n = this.str.split("").reverse().join("")),
            this.startsWith.call({ str: n }, r)
          );
        }),
        (t.prototype.contains = function (e) {
          return this.str.indexOf(e) !== -1;
        }),
        (t.prototype.equals = function (e) {
          return this.str === e;
        }),
        (t.prototype.value = function () {
          return this.str;
        }),
        t
      );
    })();
    In.QueryableString = kd;
  });
  var Qr = g((Ee) => {
    "use strict";
    var Bd =
        (Ee && Ee.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Ld =
        (Ee && Ee.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      jd =
        (Ee && Ee.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Bd(e, t, n);
          return Ld(e, t), e;
        };
    Object.defineProperty(Ee, "__esModule", { value: !0 });
    Ee.Target = void 0;
    var Ge = jd(U()),
      Fd = ze(),
      Ud = et(),
      as = ye(),
      qd = ss(),
      Gd = (function () {
        function t(e, n, r, i) {
          (this.id = (0, Fd.id)()),
            (this.type = e),
            (this.serviceIdentifier = r);
          var o = typeof n == "symbol" ? (0, Ud.getSymbolDescription)(n) : n;
          (this.name = new qd.QueryableString(o || "")),
            (this.identifier = n),
            (this.metadata = new Array());
          var s = null;
          typeof i == "string"
            ? (s = new as.Metadata(Ge.NAMED_TAG, i))
            : i instanceof as.Metadata && (s = i),
            s !== null && this.metadata.push(s);
        }
        return (
          (t.prototype.hasTag = function (e) {
            for (var n = 0, r = this.metadata; n < r.length; n++) {
              var i = r[n];
              if (i.key === e) return !0;
            }
            return !1;
          }),
          (t.prototype.isArray = function () {
            return this.hasTag(Ge.MULTI_INJECT_TAG);
          }),
          (t.prototype.matchesArray = function (e) {
            return this.matchesTag(Ge.MULTI_INJECT_TAG)(e);
          }),
          (t.prototype.isNamed = function () {
            return this.hasTag(Ge.NAMED_TAG);
          }),
          (t.prototype.isTagged = function () {
            return this.metadata.some(function (e) {
              return Ge.NON_CUSTOM_TAG_KEYS.every(function (n) {
                return e.key !== n;
              });
            });
          }),
          (t.prototype.isOptional = function () {
            return this.matchesTag(Ge.OPTIONAL_TAG)(!0);
          }),
          (t.prototype.getNamedTag = function () {
            return this.isNamed()
              ? this.metadata.filter(function (e) {
                  return e.key === Ge.NAMED_TAG;
                })[0]
              : null;
          }),
          (t.prototype.getCustomTags = function () {
            return this.isTagged()
              ? this.metadata.filter(function (e) {
                  return Ge.NON_CUSTOM_TAG_KEYS.every(function (n) {
                    return e.key !== n;
                  });
                })
              : null;
          }),
          (t.prototype.matchesNamedTag = function (e) {
            return this.matchesTag(Ge.NAMED_TAG)(e);
          }),
          (t.prototype.matchesTag = function (e) {
            var n = this;
            return function (r) {
              for (var i = 0, o = n.metadata; i < o.length; i++) {
                var s = o[i];
                if (s.key === e && s.value === r) return !0;
              }
              return !1;
            };
          }),
          t
        );
      })();
    Ee.Target = Gd;
  });
  var gs = g((z) => {
    "use strict";
    var Wd =
        (z && z.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Vd =
        (z && z.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      us =
        (z && z.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Wd(e, t, n);
          return Vd(e, t), e;
        },
      On =
        (z && z.__spreadArray) ||
        function (t, e, n) {
          if (n || arguments.length === 2)
            for (var r = 0, i = e.length, o; r < i; r++)
              (o || !(r in e)) &&
                (o || (o = Array.prototype.slice.call(e, 0, r)), (o[r] = e[r]));
          return t.concat(o || Array.prototype.slice.call(e));
        };
    Object.defineProperty(z, "__esModule", { value: !0 });
    z.getFunctionName =
      z.getBaseClassDependencyCount =
      z.getDependencies =
        void 0;
    var $d = Cn(),
      Zr = us(Y()),
      cs = ce(),
      Ut = us(U()),
      ei = et();
    Object.defineProperty(z, "getFunctionName", {
      enumerable: !0,
      get: function () {
        return ei.getFunctionName;
      },
    });
    var ls = Qr();
    function Hd(t, e) {
      var n = (0, ei.getFunctionName)(e);
      return fs(t, n, e, !1);
    }
    z.getDependencies = Hd;
    function fs(t, e, n, r) {
      var i = t.getConstructorMetadata(n),
        o = i.compilerGeneratedMetadata;
      if (o === void 0) {
        var s = Zr.MISSING_INJECTABLE_ANNOTATION + " " + e + ".";
        throw new Error(s);
      }
      var u = i.userGeneratedMetadata,
        c = Object.keys(u),
        a = n.length === 0 && c.length > 0,
        l = c.length > n.length,
        p = a || l ? c.length : n.length,
        m = Yd(r, e, o, u, p),
        b = ds(t, n, e),
        T = On(On([], m, !0), b, !0);
      return T;
    }
    function Kd(t, e, n, r, i) {
      var o = i[t.toString()] || [],
        s = hs(o),
        u = s.unmanaged !== !0,
        c = r[t],
        a = s.inject || s.multiInject;
      if (
        ((c = a || c),
        c instanceof $d.LazyServiceIdentifier && (c = c.unwrap()),
        u)
      ) {
        var l = c === Object,
          p = c === Function,
          m = c === void 0,
          b = l || p || m;
        if (!e && b) {
          var T =
            Zr.MISSING_INJECT_ANNOTATION +
            " argument " +
            t +
            " in class " +
            n +
            ".";
          throw new Error(T);
        }
        var w = new ls.Target(
          cs.TargetTypeEnum.ConstructorArgument,
          s.targetName,
          c,
        );
        return (w.metadata = o), w;
      }
      return null;
    }
    function Yd(t, e, n, r, i) {
      for (var o = [], s = 0; s < i; s++) {
        var u = s,
          c = Kd(u, t, e, n, r);
        c !== null && o.push(c);
      }
      return o;
    }
    function zd(t, e, n, r) {
      var i = t || e;
      if (i === void 0) {
        var o =
          Zr.MISSING_INJECTABLE_ANNOTATION +
          " for property " +
          String(n) +
          " in class " +
          r +
          ".";
        throw new Error(o);
      }
      return i;
    }
    function ds(t, e, n) {
      for (
        var r = t.getPropertiesMetadata(e),
          i = [],
          o = Object.getOwnPropertySymbols(r),
          s = Object.keys(r),
          u = s.concat(o),
          c = 0,
          a = u;
        c < a.length;
        c++
      ) {
        var l = a[c],
          p = r[l],
          m = hs(p),
          b = m.targetName || l,
          T = zd(m.inject, m.multiInject, l, n),
          w = new ls.Target(cs.TargetTypeEnum.ClassProperty, b, T);
        (w.metadata = p), i.push(w);
      }
      var R = Object.getPrototypeOf(e.prototype).constructor;
      if (R !== Object) {
        var K = ds(t, R, n);
        i = On(On([], i, !0), K, !0);
      }
      return i;
    }
    function ps(t, e) {
      var n = Object.getPrototypeOf(e.prototype).constructor;
      if (n !== Object) {
        var r = (0, ei.getFunctionName)(n),
          i = fs(t, r, n, !0),
          o = i.map(function (c) {
            return c.metadata.filter(function (a) {
              return a.key === Ut.UNMANAGED_TAG;
            });
          }),
          s = [].concat.apply([], o).length,
          u = i.length - s;
        return u > 0 ? u : ps(t, n);
      } else return 0;
    }
    z.getBaseClassDependencyCount = ps;
    function hs(t) {
      var e = {};
      return (
        t.forEach(function (n) {
          e[n.key.toString()] = n.value;
        }),
        {
          inject: e[Ut.INJECT_TAG],
          multiInject: e[Ut.MULTI_INJECT_TAG],
          targetName: e[Ut.NAME_TAG],
          unmanaged: e[Ut.UNMANAGED_TAG],
        }
      );
    }
  });
  var ms = g((Nn) => {
    "use strict";
    Object.defineProperty(Nn, "__esModule", { value: !0 });
    Nn.Request = void 0;
    var Jd = ze(),
      Xd = (function () {
        function t(e, n, r, i, o) {
          (this.id = (0, Jd.id)()),
            (this.serviceIdentifier = e),
            (this.parentContext = n),
            (this.parentRequest = r),
            (this.target = o),
            (this.childRequests = []),
            (this.bindings = Array.isArray(i) ? i : [i]),
            (this.requestScope = r === null ? new Map() : null);
        }
        return (
          (t.prototype.addChildRequest = function (e, n, r) {
            var i = new t(e, this.parentContext, this, n, r);
            return this.childRequests.push(i), i;
          }),
          t
        );
      })();
    Nn.Request = Xd;
  });
  var oi = g((ie) => {
    "use strict";
    var Qd =
        (ie && ie.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Zd =
        (ie && ie.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      vs =
        (ie && ie.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Qd(e, t, n);
          return Zd(e, t), e;
        };
    Object.defineProperty(ie, "__esModule", { value: !0 });
    ie.getBindingDictionary = ie.createMockRequest = ie.plan = void 0;
    var Pn = Qo(),
      ni = vs(Y()),
      bs = ce(),
      ys = vs(U()),
      ep = Xr(),
      mt = et(),
      ws = is(),
      ri = ye(),
      tp = os(),
      ti = gs(),
      ii = ms(),
      Ss = Qr();
    function Ts(t) {
      return t._bindingDictionary;
    }
    ie.getBindingDictionary = Ts;
    function np(t, e, n, r, i, o) {
      var s = t ? ys.MULTI_INJECT_TAG : ys.INJECT_TAG,
        u = new ri.Metadata(s, n),
        c = new Ss.Target(e, r, n, u);
      if (i !== void 0) {
        var a = new ri.Metadata(i, o);
        c.metadata.push(a);
      }
      return c;
    }
    function _s(t, e, n, r, i) {
      var o = qt(n.container, i.serviceIdentifier),
        s = [];
      return (
        o.length === Pn.BindingCount.NoBindingsAvailable &&
          n.container.options.autoBindInjectable &&
          typeof i.serviceIdentifier == "function" &&
          t.getConstructorMetadata(i.serviceIdentifier)
            .compilerGeneratedMetadata &&
          (n.container.bind(i.serviceIdentifier).toSelf(),
          (o = qt(n.container, i.serviceIdentifier))),
        e
          ? (s = o)
          : (s = o.filter(function (u) {
              var c = new ii.Request(u.serviceIdentifier, n, r, u, i);
              return u.constraint(c);
            })),
        rp(i.serviceIdentifier, s, i, n.container),
        s
      );
    }
    function rp(t, e, n, r) {
      switch (e.length) {
        case Pn.BindingCount.NoBindingsAvailable:
          if (n.isOptional()) return e;
          var i = (0, mt.getServiceIdentifierAsString)(t),
            o = ni.NOT_REGISTERED;
          throw (
            ((o += (0, mt.listMetadataForTarget)(i, n)),
            (o += (0, mt.listRegisteredBindingsForServiceIdentifier)(r, i, qt)),
            new Error(o))
          );
        case Pn.BindingCount.OnlyOneBindingAvailable:
          return e;
        case Pn.BindingCount.MultipleBindingsAvailable:
        default:
          if (n.isArray()) return e;
          var i = (0, mt.getServiceIdentifierAsString)(t),
            o = ni.AMBIGUOUS_MATCH + " " + i;
          throw (
            ((o += (0, mt.listRegisteredBindingsForServiceIdentifier)(
              r,
              i,
              qt,
            )),
            new Error(o))
          );
      }
    }
    function Es(t, e, n, r, i, o) {
      var s, u;
      if (i === null) {
        (s = _s(t, e, r, null, o)), (u = new ii.Request(n, r, null, s, o));
        var c = new tp.Plan(r, u);
        r.addPlan(c);
      } else
        (s = _s(t, e, r, i, o)),
          (u = i.addChildRequest(o.serviceIdentifier, s, o));
      s.forEach(function (a) {
        var l = null;
        if (o.isArray()) l = u.addChildRequest(a.serviceIdentifier, a, o);
        else {
          if (a.cache) return;
          l = u;
        }
        if (
          a.type === bs.BindingTypeEnum.Instance &&
          a.implementationType !== null
        ) {
          var p = (0, ti.getDependencies)(t, a.implementationType);
          if (!r.container.options.skipBaseClassChecks) {
            var m = (0, ti.getBaseClassDependencyCount)(
              t,
              a.implementationType,
            );
            if (p.length < m) {
              var b = ni.ARGUMENTS_LENGTH_MISMATCH(
                (0, ti.getFunctionName)(a.implementationType),
              );
              throw new Error(b);
            }
          }
          p.forEach(function (T) {
            Es(t, !1, T.serviceIdentifier, r, l, T);
          });
        }
      });
    }
    function qt(t, e) {
      var n = [],
        r = Ts(t);
      return (
        r.hasKey(e)
          ? (n = r.get(e))
          : t.parent !== null && (n = qt(t.parent, e)),
        n
      );
    }
    function ip(t, e, n, r, i, o, s, u) {
      u === void 0 && (u = !1);
      var c = new ws.Context(e),
        a = np(n, r, i, "", o, s);
      try {
        return Es(t, u, i, c, null, a), c;
      } catch (l) {
        throw (
          ((0, ep.isStackOverflowExeption)(l) &&
            (0, mt.circularDependencyToException)(c.plan.rootRequest),
          l)
        );
      }
    }
    ie.plan = ip;
    function op(t, e, n, r) {
      var i = new Ss.Target(
          bs.TargetTypeEnum.Variable,
          "",
          e,
          new ri.Metadata(n, r),
        ),
        o = new ws.Context(t),
        s = new ii.Request(e, o, null, [], i);
      return s;
    }
    ie.createMockRequest = op;
  });
  var Gt = g((yt) => {
    "use strict";
    Object.defineProperty(yt, "__esModule", { value: !0 });
    yt.isPromiseOrContainsPromise = yt.isPromise = void 0;
    function si(t) {
      var e = (typeof t == "object" && t !== null) || typeof t == "function";
      return e && typeof t.then == "function";
    }
    yt.isPromise = si;
    function sp(t) {
      return si(t) ? !0 : Array.isArray(t) && t.some(si);
    }
    yt.isPromiseOrContainsPromise = sp;
  });
  var xs = g((xe) => {
    "use strict";
    var ap =
        (xe && xe.__awaiter) ||
        function (t, e, n, r) {
          function i(o) {
            return o instanceof n
              ? o
              : new n(function (s) {
                  s(o);
                });
          }
          return new (n || (n = Promise))(function (o, s) {
            function u(l) {
              try {
                a(r.next(l));
              } catch (p) {
                s(p);
              }
            }
            function c(l) {
              try {
                a(r.throw(l));
              } catch (p) {
                s(p);
              }
            }
            function a(l) {
              l.done ? o(l.value) : i(l.value).then(u, c);
            }
            a((r = r.apply(t, e || [])).next());
          });
        },
      up =
        (xe && xe.__generator) ||
        function (t, e) {
          var n = {
              label: 0,
              sent: function () {
                if (o[0] & 1) throw o[1];
                return o[1];
              },
              trys: [],
              ops: [],
            },
            r,
            i,
            o,
            s;
          return (
            (s = { next: u(0), throw: u(1), return: u(2) }),
            typeof Symbol == "function" &&
              (s[Symbol.iterator] = function () {
                return this;
              }),
            s
          );
          function u(a) {
            return function (l) {
              return c([a, l]);
            };
          }
          function c(a) {
            if (r) throw new TypeError("Generator is already executing.");
            for (; n; )
              try {
                if (
                  ((r = 1),
                  i &&
                    (o =
                      a[0] & 2
                        ? i.return
                        : a[0]
                          ? i.throw || ((o = i.return) && o.call(i), 0)
                          : i.next) &&
                    !(o = o.call(i, a[1])).done)
                )
                  return o;
                switch (((i = 0), o && (a = [a[0] & 2, o.value]), a[0])) {
                  case 0:
                  case 1:
                    o = a;
                    break;
                  case 4:
                    return n.label++, { value: a[1], done: !1 };
                  case 5:
                    n.label++, (i = a[1]), (a = [0]);
                    continue;
                  case 7:
                    (a = n.ops.pop()), n.trys.pop();
                    continue;
                  default:
                    if (
                      ((o = n.trys),
                      !(o = o.length > 0 && o[o.length - 1]) &&
                        (a[0] === 6 || a[0] === 2))
                    ) {
                      n = 0;
                      continue;
                    }
                    if (a[0] === 3 && (!o || (a[1] > o[0] && a[1] < o[3]))) {
                      n.label = a[1];
                      break;
                    }
                    if (a[0] === 6 && n.label < o[1]) {
                      (n.label = o[1]), (o = a);
                      break;
                    }
                    if (o && n.label < o[2]) {
                      (n.label = o[2]), n.ops.push(a);
                      break;
                    }
                    o[2] && n.ops.pop(), n.trys.pop();
                    continue;
                }
                a = e.call(t, n);
              } catch (l) {
                (a = [6, l]), (i = 0);
              } finally {
                r = o = 0;
              }
            if (a[0] & 5) throw a[1];
            return { value: a[0] ? a[1] : void 0, done: !0 };
          }
        };
    Object.defineProperty(xe, "__esModule", { value: !0 });
    xe.saveToScope = xe.tryGetFromScope = void 0;
    var Rn = ce(),
      cp = Gt(),
      lp = function (t, e) {
        return e.scope === Rn.BindingScopeEnum.Singleton && e.activated
          ? e.cache
          : e.scope === Rn.BindingScopeEnum.Request && t.has(e.id)
            ? t.get(e.id)
            : null;
      };
    xe.tryGetFromScope = lp;
    var fp = function (t, e, n) {
      e.scope === Rn.BindingScopeEnum.Singleton && pp(e, n),
        e.scope === Rn.BindingScopeEnum.Request && dp(t, e, n);
    };
    xe.saveToScope = fp;
    var dp = function (t, e, n) {
        t.has(e.id) || t.set(e.id, n);
      },
      pp = function (t, e) {
        (t.cache = e), (t.activated = !0), (0, cp.isPromise)(e) && hp(t, e);
      },
      hp = function (t, e) {
        return ap(void 0, void 0, void 0, function () {
          var n, r;
          return up(this, function (i) {
            switch (i.label) {
              case 0:
                return i.trys.push([0, 2, , 3]), [4, e];
              case 1:
                return (n = i.sent()), (t.cache = n), [3, 3];
              case 2:
                throw ((r = i.sent()), (t.cache = null), (t.activated = !1), r);
              case 3:
                return [2];
            }
          });
        });
      };
  });
  var As = g((Wt) => {
    "use strict";
    Object.defineProperty(Wt, "__esModule", { value: !0 });
    Wt.FactoryType = void 0;
    var gp;
    (function (t) {
      (t.DynamicValue = "toDynamicValue"),
        (t.Factory = "toFactory"),
        (t.Provider = "toProvider");
    })((gp = Wt.FactoryType || (Wt.FactoryType = {})));
  });
  var ui = g((oe) => {
    "use strict";
    var mp =
        (oe && oe.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      yp =
        (oe && oe.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      _p =
        (oe && oe.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                mp(e, t, n);
          return yp(e, t), e;
        };
    Object.defineProperty(oe, "__esModule", { value: !0 });
    oe.getFactoryDetails = oe.ensureFullyBound = oe.multiBindToService = void 0;
    var vp = et(),
      bp = _p(Y()),
      Ae = ce(),
      ai = As(),
      wp = function (t) {
        return function (e) {
          return function () {
            for (var n = [], r = 0; r < arguments.length; r++)
              n[r] = arguments[r];
            return n.forEach(function (i) {
              return t.bind(i).toService(e);
            });
          };
        };
      };
    oe.multiBindToService = wp;
    var Sp = function (t) {
      var e = null;
      switch (t.type) {
        case Ae.BindingTypeEnum.ConstantValue:
        case Ae.BindingTypeEnum.Function:
          e = t.cache;
          break;
        case Ae.BindingTypeEnum.Constructor:
        case Ae.BindingTypeEnum.Instance:
          e = t.implementationType;
          break;
        case Ae.BindingTypeEnum.DynamicValue:
          e = t.dynamicValue;
          break;
        case Ae.BindingTypeEnum.Provider:
          e = t.provider;
          break;
        case Ae.BindingTypeEnum.Factory:
          e = t.factory;
          break;
      }
      if (e === null) {
        var n = (0, vp.getServiceIdentifierAsString)(t.serviceIdentifier);
        throw new Error(bp.INVALID_BINDING_TYPE + " " + n);
      }
    };
    oe.ensureFullyBound = Sp;
    var Tp = function (t) {
      switch (t.type) {
        case Ae.BindingTypeEnum.Factory:
          return { factory: t.factory, factoryType: ai.FactoryType.Factory };
        case Ae.BindingTypeEnum.Provider:
          return { factory: t.provider, factoryType: ai.FactoryType.Provider };
        case Ae.BindingTypeEnum.DynamicValue:
          return {
            factory: t.dynamicValue,
            factoryType: ai.FactoryType.DynamicValue,
          };
        default:
          throw new Error("Unexpected factory type " + t.type);
      }
    };
    oe.getFactoryDetails = Tp;
  });
  var Rs = g((V) => {
    "use strict";
    var _t =
        (V && V.__assign) ||
        function () {
          return (
            (_t =
              Object.assign ||
              function (t) {
                for (var e, n = 1, r = arguments.length; n < r; n++) {
                  e = arguments[n];
                  for (var i in e)
                    Object.prototype.hasOwnProperty.call(e, i) && (t[i] = e[i]);
                }
                return t;
              }),
            _t.apply(this, arguments)
          );
        },
      Ep =
        (V && V.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      xp =
        (V && V.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      Ap =
        (V && V.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Ep(e, t, n);
          return xp(e, t), e;
        },
      Os =
        (V && V.__awaiter) ||
        function (t, e, n, r) {
          function i(o) {
            return o instanceof n
              ? o
              : new n(function (s) {
                  s(o);
                });
          }
          return new (n || (n = Promise))(function (o, s) {
            function u(l) {
              try {
                a(r.next(l));
              } catch (p) {
                s(p);
              }
            }
            function c(l) {
              try {
                a(r.throw(l));
              } catch (p) {
                s(p);
              }
            }
            function a(l) {
              l.done ? o(l.value) : i(l.value).then(u, c);
            }
            a((r = r.apply(t, e || [])).next());
          });
        },
      Ns =
        (V && V.__generator) ||
        function (t, e) {
          var n = {
              label: 0,
              sent: function () {
                if (o[0] & 1) throw o[1];
                return o[1];
              },
              trys: [],
              ops: [],
            },
            r,
            i,
            o,
            s;
          return (
            (s = { next: u(0), throw: u(1), return: u(2) }),
            typeof Symbol == "function" &&
              (s[Symbol.iterator] = function () {
                return this;
              }),
            s
          );
          function u(a) {
            return function (l) {
              return c([a, l]);
            };
          }
          function c(a) {
            if (r) throw new TypeError("Generator is already executing.");
            for (; n; )
              try {
                if (
                  ((r = 1),
                  i &&
                    (o =
                      a[0] & 2
                        ? i.return
                        : a[0]
                          ? i.throw || ((o = i.return) && o.call(i), 0)
                          : i.next) &&
                    !(o = o.call(i, a[1])).done)
                )
                  return o;
                switch (((i = 0), o && (a = [a[0] & 2, o.value]), a[0])) {
                  case 0:
                  case 1:
                    o = a;
                    break;
                  case 4:
                    return n.label++, { value: a[1], done: !1 };
                  case 5:
                    n.label++, (i = a[1]), (a = [0]);
                    continue;
                  case 7:
                    (a = n.ops.pop()), n.trys.pop();
                    continue;
                  default:
                    if (
                      ((o = n.trys),
                      !(o = o.length > 0 && o[o.length - 1]) &&
                        (a[0] === 6 || a[0] === 2))
                    ) {
                      n = 0;
                      continue;
                    }
                    if (a[0] === 3 && (!o || (a[1] > o[0] && a[1] < o[3]))) {
                      n.label = a[1];
                      break;
                    }
                    if (a[0] === 6 && n.label < o[1]) {
                      (n.label = o[1]), (o = a);
                      break;
                    }
                    if (o && n.label < o[2]) {
                      (n.label = o[2]), n.ops.push(a);
                      break;
                    }
                    o[2] && n.ops.pop(), n.trys.pop();
                    continue;
                }
                a = e.call(t, n);
              } catch (l) {
                (a = [6, l]), (i = 0);
              } finally {
                r = o = 0;
              }
            if (a[0] & 5) throw a[1];
            return { value: a[0] ? a[1] : void 0, done: !0 };
          }
        },
      Cp =
        (V && V.__spreadArray) ||
        function (t, e, n) {
          if (n || arguments.length === 2)
            for (var r = 0, i = e.length, o; r < i; r++)
              (o || !(r in e)) &&
                (o || (o = Array.prototype.slice.call(e, 0, r)), (o[r] = e[r]));
          return t.concat(o || Array.prototype.slice.call(e));
        };
    Object.defineProperty(V, "__esModule", { value: !0 });
    V.resolveInstance = void 0;
    var ci = Y(),
      fi = ce(),
      li = Ap(U()),
      di = Gt();
    function Ip(t, e) {
      return t.reduce(
        function (n, r) {
          var i = e(r),
            o = r.target.type;
          return (
            o === fi.TargetTypeEnum.ConstructorArgument
              ? n.constructorInjections.push(i)
              : (n.propertyRequests.push(r), n.propertyInjections.push(i)),
            n.isAsync || (n.isAsync = (0, di.isPromiseOrContainsPromise)(i)),
            n
          );
        },
        {
          constructorInjections: [],
          propertyInjections: [],
          propertyRequests: [],
          isAsync: !1,
        },
      );
    }
    function Op(t, e, n) {
      var r;
      if (e.length > 0) {
        var i = Ip(e, n),
          o = _t(_t({}, i), { constr: t });
        i.isAsync ? (r = Np(o)) : (r = Ps(o));
      } else r = new t();
      return r;
    }
    function Ps(t) {
      var e,
        n = new ((e = t.constr).bind.apply(
          e,
          Cp([void 0], t.constructorInjections, !1),
        ))();
      return (
        t.propertyRequests.forEach(function (r, i) {
          var o = r.target.identifier,
            s = t.propertyInjections[i];
          (!r.target.isOptional() || s !== void 0) && (n[o] = s);
        }),
        n
      );
    }
    function Np(t) {
      return Os(this, void 0, void 0, function () {
        var e, n;
        return Ns(this, function (r) {
          switch (r.label) {
            case 0:
              return [4, Cs(t.constructorInjections)];
            case 1:
              return (e = r.sent()), [4, Cs(t.propertyInjections)];
            case 2:
              return (
                (n = r.sent()),
                [
                  2,
                  Ps(
                    _t(_t({}, t), {
                      constructorInjections: e,
                      propertyInjections: n,
                    }),
                  ),
                ]
              );
          }
        });
      });
    }
    function Cs(t) {
      return Os(this, void 0, void 0, function () {
        var e, n, r, i;
        return Ns(this, function (o) {
          for (e = [], n = 0, r = t; n < r.length; n++)
            (i = r[n]), Array.isArray(i) ? e.push(Promise.all(i)) : e.push(i);
          return [2, Promise.all(e)];
        });
      });
    }
    function Is(t, e) {
      var n = Pp(t, e);
      return (0, di.isPromise)(n)
        ? n.then(function () {
            return e;
          })
        : e;
    }
    function Pp(t, e) {
      var n, r;
      if (Reflect.hasMetadata(li.POST_CONSTRUCT, t)) {
        var i = Reflect.getMetadata(li.POST_CONSTRUCT, t);
        try {
          return (r = (n = e)[i.value]) === null || r === void 0
            ? void 0
            : r.call(n);
        } catch (o) {
          if (o instanceof Error)
            throw new Error((0, ci.POST_CONSTRUCT_ERROR)(t.name, o.message));
        }
      }
    }
    function Rp(t, e) {
      t.scope !== fi.BindingScopeEnum.Singleton && Mp(t, e);
    }
    function Mp(t, e) {
      var n =
        "Class cannot be instantiated in " +
        (t.scope === fi.BindingScopeEnum.Request ? "request" : "transient") +
        " scope.";
      if (typeof t.onDeactivation == "function")
        throw new Error((0, ci.ON_DEACTIVATION_ERROR)(e.name, n));
      if (Reflect.hasMetadata(li.PRE_DESTROY, e))
        throw new Error((0, ci.PRE_DESTROY_ERROR)(e.name, n));
    }
    function Dp(t, e, n, r) {
      Rp(t, e);
      var i = Op(e, n, r);
      return (0, di.isPromise)(i)
        ? i.then(function (o) {
            return Is(e, o);
          })
        : Is(e, i);
    }
    V.resolveInstance = Dp;
  });
  var Ls = g((se) => {
    "use strict";
    var kp =
        (se && se.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Bp =
        (se && se.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      Lp =
        (se && se.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                kp(e, t, n);
          return Bp(e, t), e;
        },
      jp =
        (se && se.__awaiter) ||
        function (t, e, n, r) {
          function i(o) {
            return o instanceof n
              ? o
              : new n(function (s) {
                  s(o);
                });
          }
          return new (n || (n = Promise))(function (o, s) {
            function u(l) {
              try {
                a(r.next(l));
              } catch (p) {
                s(p);
              }
            }
            function c(l) {
              try {
                a(r.throw(l));
              } catch (p) {
                s(p);
              }
            }
            function a(l) {
              l.done ? o(l.value) : i(l.value).then(u, c);
            }
            a((r = r.apply(t, e || [])).next());
          });
        },
      Fp =
        (se && se.__generator) ||
        function (t, e) {
          var n = {
              label: 0,
              sent: function () {
                if (o[0] & 1) throw o[1];
                return o[1];
              },
              trys: [],
              ops: [],
            },
            r,
            i,
            o,
            s;
          return (
            (s = { next: u(0), throw: u(1), return: u(2) }),
            typeof Symbol == "function" &&
              (s[Symbol.iterator] = function () {
                return this;
              }),
            s
          );
          function u(a) {
            return function (l) {
              return c([a, l]);
            };
          }
          function c(a) {
            if (r) throw new TypeError("Generator is already executing.");
            for (; n; )
              try {
                if (
                  ((r = 1),
                  i &&
                    (o =
                      a[0] & 2
                        ? i.return
                        : a[0]
                          ? i.throw || ((o = i.return) && o.call(i), 0)
                          : i.next) &&
                    !(o = o.call(i, a[1])).done)
                )
                  return o;
                switch (((i = 0), o && (a = [a[0] & 2, o.value]), a[0])) {
                  case 0:
                  case 1:
                    o = a;
                    break;
                  case 4:
                    return n.label++, { value: a[1], done: !1 };
                  case 5:
                    n.label++, (i = a[1]), (a = [0]);
                    continue;
                  case 7:
                    (a = n.ops.pop()), n.trys.pop();
                    continue;
                  default:
                    if (
                      ((o = n.trys),
                      !(o = o.length > 0 && o[o.length - 1]) &&
                        (a[0] === 6 || a[0] === 2))
                    ) {
                      n = 0;
                      continue;
                    }
                    if (a[0] === 3 && (!o || (a[1] > o[0] && a[1] < o[3]))) {
                      n.label = a[1];
                      break;
                    }
                    if (a[0] === 6 && n.label < o[1]) {
                      (n.label = o[1]), (o = a);
                      break;
                    }
                    if (o && n.label < o[2]) {
                      (n.label = o[2]), n.ops.push(a);
                      break;
                    }
                    o[2] && n.ops.pop(), n.trys.pop();
                    continue;
                }
                a = e.call(t, n);
              } catch (l) {
                (a = [6, l]), (i = 0);
              } finally {
                r = o = 0;
              }
            if (a[0] & 5) throw a[1];
            return { value: a[0] ? a[1] : void 0, done: !0 };
          }
        };
    Object.defineProperty(se, "__esModule", { value: !0 });
    se.resolve = void 0;
    var Up = Lp(Y()),
      Mn = ce(),
      qp = oi(),
      Ms = xs(),
      pi = Gt(),
      ks = ui(),
      Gp = Xr(),
      Wp = Rs(),
      hi = function (t) {
        return function (e) {
          e.parentContext.setCurrentRequest(e);
          var n = e.bindings,
            r = e.childRequests,
            i = e.target && e.target.isArray(),
            o =
              !e.parentRequest ||
              !e.parentRequest.target ||
              !e.target ||
              !e.parentRequest.target.matchesArray(e.target.serviceIdentifier);
          if (i && o)
            return r.map(function (u) {
              var c = hi(t);
              return c(u);
            });
          if (e.target.isOptional() && n.length === 0) return;
          var s = n[0];
          return Kp(t, e, s);
        };
      },
      Vp = function (t, e) {
        var n = (0, ks.getFactoryDetails)(t);
        return (0, Gp.tryAndThrowErrorIfStackOverflow)(
          function () {
            return n.factory.bind(t)(e);
          },
          function () {
            return new Error(
              Up.CIRCULAR_DEPENDENCY_IN_FACTORY(
                n.factoryType,
                e.currentRequest.serviceIdentifier.toString(),
              ),
            );
          },
        );
      },
      $p = function (t, e, n) {
        var r,
          i = e.childRequests;
        switch (((0, ks.ensureFullyBound)(n), n.type)) {
          case Mn.BindingTypeEnum.ConstantValue:
          case Mn.BindingTypeEnum.Function:
            r = n.cache;
            break;
          case Mn.BindingTypeEnum.Constructor:
            r = n.implementationType;
            break;
          case Mn.BindingTypeEnum.Instance:
            r = (0, Wp.resolveInstance)(n, n.implementationType, i, hi(t));
            break;
          default:
            r = Vp(n, e.parentContext);
        }
        return r;
      },
      Hp = function (t, e, n) {
        var r = (0, Ms.tryGetFromScope)(t, e);
        return r !== null || ((r = n()), (0, Ms.saveToScope)(t, e, r)), r;
      },
      Kp = function (t, e, n) {
        return Hp(t, n, function () {
          var r = $p(t, e, n);
          return (
            (0, pi.isPromise)(r)
              ? (r = r.then(function (i) {
                  return Ds(e, n, i);
                }))
              : (r = Ds(e, n, r)),
            r
          );
        });
      };
    function Ds(t, e, n) {
      var r = Yp(t.parentContext, e, n),
        i = Xp(t.parentContext.container),
        o,
        s = i.next();
      do {
        o = s.value;
        var u = t.parentContext,
          c = t.serviceIdentifier,
          a = Jp(o, c);
        (0, pi.isPromise)(r) ? (r = Bs(a, u, r)) : (r = zp(a, u, r)),
          (s = i.next());
      } while (
        s.done !== !0 &&
        !(0, qp.getBindingDictionary)(o).hasKey(t.serviceIdentifier)
      );
      return r;
    }
    var Yp = function (t, e, n) {
        var r;
        return (
          typeof e.onActivation == "function"
            ? (r = e.onActivation(t, n))
            : (r = n),
          r
        );
      },
      zp = function (t, e, n) {
        for (var r = t.next(); !r.done; ) {
          if (((n = r.value(e, n)), (0, pi.isPromise)(n))) return Bs(t, e, n);
          r = t.next();
        }
        return n;
      },
      Bs = function (t, e, n) {
        return jp(void 0, void 0, void 0, function () {
          var r, i;
          return Fp(this, function (o) {
            switch (o.label) {
              case 0:
                return [4, n];
              case 1:
                (r = o.sent()), (i = t.next()), (o.label = 2);
              case 2:
                return i.done ? [3, 4] : [4, i.value(e, r)];
              case 3:
                return (r = o.sent()), (i = t.next()), [3, 2];
              case 4:
                return [2, r];
            }
          });
        });
      },
      Jp = function (t, e) {
        var n = t._activations;
        return n.hasKey(e) ? n.get(e).values() : [].values();
      },
      Xp = function (t) {
        for (var e = [t], n = t.parent; n !== null; ) e.push(n), (n = n.parent);
        var r = function () {
            var o = e.pop();
            return o !== void 0
              ? { done: !1, value: o }
              : { done: !0, value: void 0 };
          },
          i = { next: r };
        return i;
      };
    function Qp(t) {
      var e = hi(t.plan.rootRequest.requestScope);
      return e(t.plan.rootRequest);
    }
    se.resolve = Qp;
  });
  var gi = g((J) => {
    "use strict";
    var Zp =
        (J && J.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      eh =
        (J && J.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      th =
        (J && J.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Zp(e, t, n);
          return eh(e, t), e;
        };
    Object.defineProperty(J, "__esModule", { value: !0 });
    J.typeConstraint =
      J.namedConstraint =
      J.taggedConstraint =
      J.traverseAncerstors =
        void 0;
    var nh = th(U()),
      rh = ye(),
      js = function (t, e) {
        var n = t.parentRequest;
        return n !== null ? (e(n) ? !0 : js(n, e)) : !1;
      };
    J.traverseAncerstors = js;
    var Fs = function (t) {
      return function (e) {
        var n = function (r) {
          return r !== null && r.target !== null && r.target.matchesTag(t)(e);
        };
        return (n.metaData = new rh.Metadata(t, e)), n;
      };
    };
    J.taggedConstraint = Fs;
    var ih = Fs(nh.NAMED_TAG);
    J.namedConstraint = ih;
    var oh = function (t) {
      return function (e) {
        var n = null;
        if (e !== null)
          if (((n = e.bindings[0]), typeof t == "string")) {
            var r = n.serviceIdentifier;
            return r === t;
          } else {
            var i = e.bindings[0].implementationType;
            return t === i;
          }
        return !1;
      };
    };
    J.typeConstraint = oh;
  });
  var kn = g((Dn) => {
    "use strict";
    Object.defineProperty(Dn, "__esModule", { value: !0 });
    Dn.BindingWhenSyntax = void 0;
    var ee = Bn(),
      W = gi(),
      sh = (function () {
        function t(e) {
          this._binding = e;
        }
        return (
          (t.prototype.when = function (e) {
            return (
              (this._binding.constraint = e),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenTargetNamed = function (e) {
            return (
              (this._binding.constraint = (0, W.namedConstraint)(e)),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenTargetIsDefault = function () {
            return (
              (this._binding.constraint = function (e) {
                if (e === null) return !1;
                var n =
                  e.target !== null &&
                  !e.target.isNamed() &&
                  !e.target.isTagged();
                return n;
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenTargetTagged = function (e, n) {
            return (
              (this._binding.constraint = (0, W.taggedConstraint)(e)(n)),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenInjectedInto = function (e) {
            return (
              (this._binding.constraint = function (n) {
                return n !== null && (0, W.typeConstraint)(e)(n.parentRequest);
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenParentNamed = function (e) {
            return (
              (this._binding.constraint = function (n) {
                return n !== null && (0, W.namedConstraint)(e)(n.parentRequest);
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenParentTagged = function (e, n) {
            return (
              (this._binding.constraint = function (r) {
                return (
                  r !== null && (0, W.taggedConstraint)(e)(n)(r.parentRequest)
                );
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenAnyAncestorIs = function (e) {
            return (
              (this._binding.constraint = function (n) {
                return (
                  n !== null &&
                  (0, W.traverseAncerstors)(n, (0, W.typeConstraint)(e))
                );
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenNoAncestorIs = function (e) {
            return (
              (this._binding.constraint = function (n) {
                return (
                  n !== null &&
                  !(0, W.traverseAncerstors)(n, (0, W.typeConstraint)(e))
                );
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenAnyAncestorNamed = function (e) {
            return (
              (this._binding.constraint = function (n) {
                return (
                  n !== null &&
                  (0, W.traverseAncerstors)(n, (0, W.namedConstraint)(e))
                );
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenNoAncestorNamed = function (e) {
            return (
              (this._binding.constraint = function (n) {
                return (
                  n !== null &&
                  !(0, W.traverseAncerstors)(n, (0, W.namedConstraint)(e))
                );
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenAnyAncestorTagged = function (e, n) {
            return (
              (this._binding.constraint = function (r) {
                return (
                  r !== null &&
                  (0, W.traverseAncerstors)(r, (0, W.taggedConstraint)(e)(n))
                );
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenNoAncestorTagged = function (e, n) {
            return (
              (this._binding.constraint = function (r) {
                return (
                  r !== null &&
                  !(0, W.traverseAncerstors)(r, (0, W.taggedConstraint)(e)(n))
                );
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenAnyAncestorMatches = function (e) {
            return (
              (this._binding.constraint = function (n) {
                return n !== null && (0, W.traverseAncerstors)(n, e);
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          (t.prototype.whenNoAncestorMatches = function (e) {
            return (
              (this._binding.constraint = function (n) {
                return n !== null && !(0, W.traverseAncerstors)(n, e);
              }),
              new ee.BindingOnSyntax(this._binding)
            );
          }),
          t
        );
      })();
    Dn.BindingWhenSyntax = sh;
  });
  var Bn = g((Ln) => {
    "use strict";
    Object.defineProperty(Ln, "__esModule", { value: !0 });
    Ln.BindingOnSyntax = void 0;
    var Us = kn(),
      ah = (function () {
        function t(e) {
          this._binding = e;
        }
        return (
          (t.prototype.onActivation = function (e) {
            return (
              (this._binding.onActivation = e),
              new Us.BindingWhenSyntax(this._binding)
            );
          }),
          (t.prototype.onDeactivation = function (e) {
            return (
              (this._binding.onDeactivation = e),
              new Us.BindingWhenSyntax(this._binding)
            );
          }),
          t
        );
      })();
    Ln.BindingOnSyntax = ah;
  });
  var mi = g((jn) => {
    "use strict";
    Object.defineProperty(jn, "__esModule", { value: !0 });
    jn.BindingWhenOnSyntax = void 0;
    var uh = Bn(),
      ch = kn(),
      lh = (function () {
        function t(e) {
          (this._binding = e),
            (this._bindingWhenSyntax = new ch.BindingWhenSyntax(this._binding)),
            (this._bindingOnSyntax = new uh.BindingOnSyntax(this._binding));
        }
        return (
          (t.prototype.when = function (e) {
            return this._bindingWhenSyntax.when(e);
          }),
          (t.prototype.whenTargetNamed = function (e) {
            return this._bindingWhenSyntax.whenTargetNamed(e);
          }),
          (t.prototype.whenTargetIsDefault = function () {
            return this._bindingWhenSyntax.whenTargetIsDefault();
          }),
          (t.prototype.whenTargetTagged = function (e, n) {
            return this._bindingWhenSyntax.whenTargetTagged(e, n);
          }),
          (t.prototype.whenInjectedInto = function (e) {
            return this._bindingWhenSyntax.whenInjectedInto(e);
          }),
          (t.prototype.whenParentNamed = function (e) {
            return this._bindingWhenSyntax.whenParentNamed(e);
          }),
          (t.prototype.whenParentTagged = function (e, n) {
            return this._bindingWhenSyntax.whenParentTagged(e, n);
          }),
          (t.prototype.whenAnyAncestorIs = function (e) {
            return this._bindingWhenSyntax.whenAnyAncestorIs(e);
          }),
          (t.prototype.whenNoAncestorIs = function (e) {
            return this._bindingWhenSyntax.whenNoAncestorIs(e);
          }),
          (t.prototype.whenAnyAncestorNamed = function (e) {
            return this._bindingWhenSyntax.whenAnyAncestorNamed(e);
          }),
          (t.prototype.whenAnyAncestorTagged = function (e, n) {
            return this._bindingWhenSyntax.whenAnyAncestorTagged(e, n);
          }),
          (t.prototype.whenNoAncestorNamed = function (e) {
            return this._bindingWhenSyntax.whenNoAncestorNamed(e);
          }),
          (t.prototype.whenNoAncestorTagged = function (e, n) {
            return this._bindingWhenSyntax.whenNoAncestorTagged(e, n);
          }),
          (t.prototype.whenAnyAncestorMatches = function (e) {
            return this._bindingWhenSyntax.whenAnyAncestorMatches(e);
          }),
          (t.prototype.whenNoAncestorMatches = function (e) {
            return this._bindingWhenSyntax.whenNoAncestorMatches(e);
          }),
          (t.prototype.onActivation = function (e) {
            return this._bindingOnSyntax.onActivation(e);
          }),
          (t.prototype.onDeactivation = function (e) {
            return this._bindingOnSyntax.onDeactivation(e);
          }),
          t
        );
      })();
    jn.BindingWhenOnSyntax = lh;
  });
  var qs = g((Fn) => {
    "use strict";
    Object.defineProperty(Fn, "__esModule", { value: !0 });
    Fn.BindingInSyntax = void 0;
    var yi = ce(),
      _i = mi(),
      fh = (function () {
        function t(e) {
          this._binding = e;
        }
        return (
          (t.prototype.inRequestScope = function () {
            return (
              (this._binding.scope = yi.BindingScopeEnum.Request),
              new _i.BindingWhenOnSyntax(this._binding)
            );
          }),
          (t.prototype.inSingletonScope = function () {
            return (
              (this._binding.scope = yi.BindingScopeEnum.Singleton),
              new _i.BindingWhenOnSyntax(this._binding)
            );
          }),
          (t.prototype.inTransientScope = function () {
            return (
              (this._binding.scope = yi.BindingScopeEnum.Transient),
              new _i.BindingWhenOnSyntax(this._binding)
            );
          }),
          t
        );
      })();
    Fn.BindingInSyntax = fh;
  });
  var Gs = g((Un) => {
    "use strict";
    Object.defineProperty(Un, "__esModule", { value: !0 });
    Un.BindingInWhenOnSyntax = void 0;
    var dh = qs(),
      ph = Bn(),
      hh = kn(),
      gh = (function () {
        function t(e) {
          (this._binding = e),
            (this._bindingWhenSyntax = new hh.BindingWhenSyntax(this._binding)),
            (this._bindingOnSyntax = new ph.BindingOnSyntax(this._binding)),
            (this._bindingInSyntax = new dh.BindingInSyntax(e));
        }
        return (
          (t.prototype.inRequestScope = function () {
            return this._bindingInSyntax.inRequestScope();
          }),
          (t.prototype.inSingletonScope = function () {
            return this._bindingInSyntax.inSingletonScope();
          }),
          (t.prototype.inTransientScope = function () {
            return this._bindingInSyntax.inTransientScope();
          }),
          (t.prototype.when = function (e) {
            return this._bindingWhenSyntax.when(e);
          }),
          (t.prototype.whenTargetNamed = function (e) {
            return this._bindingWhenSyntax.whenTargetNamed(e);
          }),
          (t.prototype.whenTargetIsDefault = function () {
            return this._bindingWhenSyntax.whenTargetIsDefault();
          }),
          (t.prototype.whenTargetTagged = function (e, n) {
            return this._bindingWhenSyntax.whenTargetTagged(e, n);
          }),
          (t.prototype.whenInjectedInto = function (e) {
            return this._bindingWhenSyntax.whenInjectedInto(e);
          }),
          (t.prototype.whenParentNamed = function (e) {
            return this._bindingWhenSyntax.whenParentNamed(e);
          }),
          (t.prototype.whenParentTagged = function (e, n) {
            return this._bindingWhenSyntax.whenParentTagged(e, n);
          }),
          (t.prototype.whenAnyAncestorIs = function (e) {
            return this._bindingWhenSyntax.whenAnyAncestorIs(e);
          }),
          (t.prototype.whenNoAncestorIs = function (e) {
            return this._bindingWhenSyntax.whenNoAncestorIs(e);
          }),
          (t.prototype.whenAnyAncestorNamed = function (e) {
            return this._bindingWhenSyntax.whenAnyAncestorNamed(e);
          }),
          (t.prototype.whenAnyAncestorTagged = function (e, n) {
            return this._bindingWhenSyntax.whenAnyAncestorTagged(e, n);
          }),
          (t.prototype.whenNoAncestorNamed = function (e) {
            return this._bindingWhenSyntax.whenNoAncestorNamed(e);
          }),
          (t.prototype.whenNoAncestorTagged = function (e, n) {
            return this._bindingWhenSyntax.whenNoAncestorTagged(e, n);
          }),
          (t.prototype.whenAnyAncestorMatches = function (e) {
            return this._bindingWhenSyntax.whenAnyAncestorMatches(e);
          }),
          (t.prototype.whenNoAncestorMatches = function (e) {
            return this._bindingWhenSyntax.whenNoAncestorMatches(e);
          }),
          (t.prototype.onActivation = function (e) {
            return this._bindingOnSyntax.onActivation(e);
          }),
          (t.prototype.onDeactivation = function (e) {
            return this._bindingOnSyntax.onDeactivation(e);
          }),
          t
        );
      })();
    Un.BindingInWhenOnSyntax = gh;
  });
  var $s = g((Ce) => {
    "use strict";
    var mh =
        (Ce && Ce.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      yh =
        (Ce && Ce.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      _h =
        (Ce && Ce.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                mh(e, t, n);
          return yh(e, t), e;
        };
    Object.defineProperty(Ce, "__esModule", { value: !0 });
    Ce.BindingToSyntax = void 0;
    var Ws = _h(Y()),
      te = ce(),
      Vs = Gs(),
      vt = mi(),
      vh = (function () {
        function t(e) {
          this._binding = e;
        }
        return (
          (t.prototype.to = function (e) {
            return (
              (this._binding.type = te.BindingTypeEnum.Instance),
              (this._binding.implementationType = e),
              new Vs.BindingInWhenOnSyntax(this._binding)
            );
          }),
          (t.prototype.toSelf = function () {
            if (typeof this._binding.serviceIdentifier != "function")
              throw new Error("" + Ws.INVALID_TO_SELF_VALUE);
            var e = this._binding.serviceIdentifier;
            return this.to(e);
          }),
          (t.prototype.toConstantValue = function (e) {
            return (
              (this._binding.type = te.BindingTypeEnum.ConstantValue),
              (this._binding.cache = e),
              (this._binding.dynamicValue = null),
              (this._binding.implementationType = null),
              (this._binding.scope = te.BindingScopeEnum.Singleton),
              new vt.BindingWhenOnSyntax(this._binding)
            );
          }),
          (t.prototype.toDynamicValue = function (e) {
            return (
              (this._binding.type = te.BindingTypeEnum.DynamicValue),
              (this._binding.cache = null),
              (this._binding.dynamicValue = e),
              (this._binding.implementationType = null),
              new Vs.BindingInWhenOnSyntax(this._binding)
            );
          }),
          (t.prototype.toConstructor = function (e) {
            return (
              (this._binding.type = te.BindingTypeEnum.Constructor),
              (this._binding.implementationType = e),
              (this._binding.scope = te.BindingScopeEnum.Singleton),
              new vt.BindingWhenOnSyntax(this._binding)
            );
          }),
          (t.prototype.toFactory = function (e) {
            return (
              (this._binding.type = te.BindingTypeEnum.Factory),
              (this._binding.factory = e),
              (this._binding.scope = te.BindingScopeEnum.Singleton),
              new vt.BindingWhenOnSyntax(this._binding)
            );
          }),
          (t.prototype.toFunction = function (e) {
            if (typeof e != "function")
              throw new Error(Ws.INVALID_FUNCTION_BINDING);
            var n = this.toConstantValue(e);
            return (
              (this._binding.type = te.BindingTypeEnum.Function),
              (this._binding.scope = te.BindingScopeEnum.Singleton),
              n
            );
          }),
          (t.prototype.toAutoFactory = function (e) {
            return (
              (this._binding.type = te.BindingTypeEnum.Factory),
              (this._binding.factory = function (n) {
                var r = function () {
                  return n.container.get(e);
                };
                return r;
              }),
              (this._binding.scope = te.BindingScopeEnum.Singleton),
              new vt.BindingWhenOnSyntax(this._binding)
            );
          }),
          (t.prototype.toAutoNamedFactory = function (e) {
            return (
              (this._binding.type = te.BindingTypeEnum.Factory),
              (this._binding.factory = function (n) {
                return function (r) {
                  return n.container.getNamed(e, r);
                };
              }),
              new vt.BindingWhenOnSyntax(this._binding)
            );
          }),
          (t.prototype.toProvider = function (e) {
            return (
              (this._binding.type = te.BindingTypeEnum.Provider),
              (this._binding.provider = e),
              (this._binding.scope = te.BindingScopeEnum.Singleton),
              new vt.BindingWhenOnSyntax(this._binding)
            );
          }),
          (t.prototype.toService = function (e) {
            this.toDynamicValue(function (n) {
              return n.container.get(e);
            });
          }),
          t
        );
      })();
    Ce.BindingToSyntax = vh;
  });
  var Hs = g((qn) => {
    "use strict";
    Object.defineProperty(qn, "__esModule", { value: !0 });
    qn.ContainerSnapshot = void 0;
    var bh = (function () {
      function t() {}
      return (
        (t.of = function (e, n, r, i, o) {
          var s = new t();
          return (
            (s.bindings = e),
            (s.middleware = n),
            (s.deactivations = i),
            (s.activations = r),
            (s.moduleActivationStore = o),
            s
          );
        }),
        t
      );
    })();
    qn.ContainerSnapshot = bh;
  });
  var Ks = g((Gn) => {
    "use strict";
    Object.defineProperty(Gn, "__esModule", { value: !0 });
    Gn.isClonable = void 0;
    function wh(t) {
      return (
        typeof t == "object" &&
        t !== null &&
        "clone" in t &&
        typeof t.clone == "function"
      );
    }
    Gn.isClonable = wh;
  });
  var vi = g((Ie) => {
    "use strict";
    var Sh =
        (Ie && Ie.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Th =
        (Ie && Ie.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      Eh =
        (Ie && Ie.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Sh(e, t, n);
          return Th(e, t), e;
        };
    Object.defineProperty(Ie, "__esModule", { value: !0 });
    Ie.Lookup = void 0;
    var tt = Eh(Y()),
      xh = Ks(),
      Ah = (function () {
        function t() {
          this._map = new Map();
        }
        return (
          (t.prototype.getMap = function () {
            return this._map;
          }),
          (t.prototype.add = function (e, n) {
            if (e == null) throw new Error(tt.NULL_ARGUMENT);
            if (n == null) throw new Error(tt.NULL_ARGUMENT);
            var r = this._map.get(e);
            r !== void 0 ? r.push(n) : this._map.set(e, [n]);
          }),
          (t.prototype.get = function (e) {
            if (e == null) throw new Error(tt.NULL_ARGUMENT);
            var n = this._map.get(e);
            if (n !== void 0) return n;
            throw new Error(tt.KEY_NOT_FOUND);
          }),
          (t.prototype.remove = function (e) {
            if (e == null) throw new Error(tt.NULL_ARGUMENT);
            if (!this._map.delete(e)) throw new Error(tt.KEY_NOT_FOUND);
          }),
          (t.prototype.removeIntersection = function (e) {
            var n = this;
            this.traverse(function (r, i) {
              var o = e.hasKey(r) ? e.get(r) : void 0;
              if (o !== void 0) {
                var s = i.filter(function (u) {
                  return !o.some(function (c) {
                    return u === c;
                  });
                });
                n._setValue(r, s);
              }
            });
          }),
          (t.prototype.removeByCondition = function (e) {
            var n = this,
              r = [];
            return (
              this._map.forEach(function (i, o) {
                for (var s = [], u = 0, c = i; u < c.length; u++) {
                  var a = c[u],
                    l = e(a);
                  l ? r.push(a) : s.push(a);
                }
                n._setValue(o, s);
              }),
              r
            );
          }),
          (t.prototype.hasKey = function (e) {
            if (e == null) throw new Error(tt.NULL_ARGUMENT);
            return this._map.has(e);
          }),
          (t.prototype.clone = function () {
            var e = new t();
            return (
              this._map.forEach(function (n, r) {
                n.forEach(function (i) {
                  return e.add(r, (0, xh.isClonable)(i) ? i.clone() : i);
                });
              }),
              e
            );
          }),
          (t.prototype.traverse = function (e) {
            this._map.forEach(function (n, r) {
              e(r, n);
            });
          }),
          (t.prototype._setValue = function (e, n) {
            n.length > 0 ? this._map.set(e, n) : this._map.delete(e);
          }),
          t
        );
      })();
    Ie.Lookup = Ah;
  });
  var zs = g((Wn) => {
    "use strict";
    Object.defineProperty(Wn, "__esModule", { value: !0 });
    Wn.ModuleActivationStore = void 0;
    var Ys = vi(),
      Ch = (function () {
        function t() {
          this._map = new Map();
        }
        return (
          (t.prototype.remove = function (e) {
            if (this._map.has(e)) {
              var n = this._map.get(e);
              return this._map.delete(e), n;
            }
            return this._getEmptyHandlersStore();
          }),
          (t.prototype.addDeactivation = function (e, n, r) {
            this._getModuleActivationHandlers(e).onDeactivations.add(n, r);
          }),
          (t.prototype.addActivation = function (e, n, r) {
            this._getModuleActivationHandlers(e).onActivations.add(n, r);
          }),
          (t.prototype.clone = function () {
            var e = new t();
            return (
              this._map.forEach(function (n, r) {
                e._map.set(r, {
                  onActivations: n.onActivations.clone(),
                  onDeactivations: n.onDeactivations.clone(),
                });
              }),
              e
            );
          }),
          (t.prototype._getModuleActivationHandlers = function (e) {
            var n = this._map.get(e);
            return (
              n === void 0 &&
                ((n = this._getEmptyHandlersStore()), this._map.set(e, n)),
              n
            );
          }),
          (t.prototype._getEmptyHandlersStore = function () {
            var e = {
              onActivations: new Ys.Lookup(),
              onDeactivations: new Ys.Lookup(),
            };
            return e;
          }),
          t
        );
      })();
    Wn.ModuleActivationStore = Ch;
  });
  var Xs = g(($) => {
    "use strict";
    var $n =
        ($ && $.__assign) ||
        function () {
          return (
            ($n =
              Object.assign ||
              function (t) {
                for (var e, n = 1, r = arguments.length; n < r; n++) {
                  e = arguments[n];
                  for (var i in e)
                    Object.prototype.hasOwnProperty.call(e, i) && (t[i] = e[i]);
                }
                return t;
              }),
            $n.apply(this, arguments)
          );
        },
      Ih =
        ($ && $.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Oh =
        ($ && $.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      Js =
        ($ && $.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Ih(e, t, n);
          return Oh(e, t), e;
        },
      fe =
        ($ && $.__awaiter) ||
        function (t, e, n, r) {
          function i(o) {
            return o instanceof n
              ? o
              : new n(function (s) {
                  s(o);
                });
          }
          return new (n || (n = Promise))(function (o, s) {
            function u(l) {
              try {
                a(r.next(l));
              } catch (p) {
                s(p);
              }
            }
            function c(l) {
              try {
                a(r.throw(l));
              } catch (p) {
                s(p);
              }
            }
            function a(l) {
              l.done ? o(l.value) : i(l.value).then(u, c);
            }
            a((r = r.apply(t, e || [])).next());
          });
        },
      de =
        ($ && $.__generator) ||
        function (t, e) {
          var n = {
              label: 0,
              sent: function () {
                if (o[0] & 1) throw o[1];
                return o[1];
              },
              trys: [],
              ops: [],
            },
            r,
            i,
            o,
            s;
          return (
            (s = { next: u(0), throw: u(1), return: u(2) }),
            typeof Symbol == "function" &&
              (s[Symbol.iterator] = function () {
                return this;
              }),
            s
          );
          function u(a) {
            return function (l) {
              return c([a, l]);
            };
          }
          function c(a) {
            if (r) throw new TypeError("Generator is already executing.");
            for (; n; )
              try {
                if (
                  ((r = 1),
                  i &&
                    (o =
                      a[0] & 2
                        ? i.return
                        : a[0]
                          ? i.throw || ((o = i.return) && o.call(i), 0)
                          : i.next) &&
                    !(o = o.call(i, a[1])).done)
                )
                  return o;
                switch (((i = 0), o && (a = [a[0] & 2, o.value]), a[0])) {
                  case 0:
                  case 1:
                    o = a;
                    break;
                  case 4:
                    return n.label++, { value: a[1], done: !1 };
                  case 5:
                    n.label++, (i = a[1]), (a = [0]);
                    continue;
                  case 7:
                    (a = n.ops.pop()), n.trys.pop();
                    continue;
                  default:
                    if (
                      ((o = n.trys),
                      !(o = o.length > 0 && o[o.length - 1]) &&
                        (a[0] === 6 || a[0] === 2))
                    ) {
                      n = 0;
                      continue;
                    }
                    if (a[0] === 3 && (!o || (a[1] > o[0] && a[1] < o[3]))) {
                      n.label = a[1];
                      break;
                    }
                    if (a[0] === 6 && n.label < o[1]) {
                      (n.label = o[1]), (o = a);
                      break;
                    }
                    if (o && n.label < o[2]) {
                      (n.label = o[2]), n.ops.push(a);
                      break;
                    }
                    o[2] && n.ops.pop(), n.trys.pop();
                    continue;
                }
                a = e.call(t, n);
              } catch (l) {
                (a = [6, l]), (i = 0);
              } finally {
                r = o = 0;
              }
            if (a[0] & 5) throw a[1];
            return { value: a[0] ? a[1] : void 0, done: !0 };
          }
        },
      Nh =
        ($ && $.__spreadArray) ||
        function (t, e, n) {
          if (n || arguments.length === 2)
            for (var r = 0, i = e.length, o; r < i; r++)
              (o || !(r in e)) &&
                (o || (o = Array.prototype.slice.call(e, 0, r)), (o[r] = e[r]));
          return t.concat(o || Array.prototype.slice.call(e));
        };
    Object.defineProperty($, "__esModule", { value: !0 });
    $.Container = void 0;
    var Ph = Xo(),
      _e = Js(Y()),
      bt = ce(),
      nt = Js(U()),
      Rh = Jr(),
      Vn = oi(),
      Mh = Ls(),
      Dh = $s(),
      rt = Gt(),
      kh = ze(),
      Bh = et(),
      Lh = Hs(),
      Vt = vi(),
      jh = zs(),
      Fh = (function () {
        function t(e) {
          var n = e || {};
          if (typeof n != "object")
            throw new Error("" + _e.CONTAINER_OPTIONS_MUST_BE_AN_OBJECT);
          if (n.defaultScope === void 0)
            n.defaultScope = bt.BindingScopeEnum.Transient;
          else if (
            n.defaultScope !== bt.BindingScopeEnum.Singleton &&
            n.defaultScope !== bt.BindingScopeEnum.Transient &&
            n.defaultScope !== bt.BindingScopeEnum.Request
          )
            throw new Error("" + _e.CONTAINER_OPTIONS_INVALID_DEFAULT_SCOPE);
          if (n.autoBindInjectable === void 0) n.autoBindInjectable = !1;
          else if (typeof n.autoBindInjectable != "boolean")
            throw new Error(
              "" + _e.CONTAINER_OPTIONS_INVALID_AUTO_BIND_INJECTABLE,
            );
          if (n.skipBaseClassChecks === void 0) n.skipBaseClassChecks = !1;
          else if (typeof n.skipBaseClassChecks != "boolean")
            throw new Error("" + _e.CONTAINER_OPTIONS_INVALID_SKIP_BASE_CHECK);
          (this.options = {
            autoBindInjectable: n.autoBindInjectable,
            defaultScope: n.defaultScope,
            skipBaseClassChecks: n.skipBaseClassChecks,
          }),
            (this.id = (0, kh.id)()),
            (this._bindingDictionary = new Vt.Lookup()),
            (this._snapshots = []),
            (this._middleware = null),
            (this._activations = new Vt.Lookup()),
            (this._deactivations = new Vt.Lookup()),
            (this.parent = null),
            (this._metadataReader = new Rh.MetadataReader()),
            (this._moduleActivationStore = new jh.ModuleActivationStore());
        }
        return (
          (t.merge = function (e, n) {
            for (var r = [], i = 2; i < arguments.length; i++)
              r[i - 2] = arguments[i];
            var o = new t(),
              s = Nh([e, n], r, !0).map(function (a) {
                return (0, Vn.getBindingDictionary)(a);
              }),
              u = (0, Vn.getBindingDictionary)(o);
            function c(a, l) {
              a.traverse(function (p, m) {
                m.forEach(function (b) {
                  l.add(b.serviceIdentifier, b.clone());
                });
              });
            }
            return (
              s.forEach(function (a) {
                c(a, u);
              }),
              o
            );
          }),
          (t.prototype.load = function () {
            for (var e = [], n = 0; n < arguments.length; n++)
              e[n] = arguments[n];
            for (
              var r = this._getContainerModuleHelpersFactory(), i = 0, o = e;
              i < o.length;
              i++
            ) {
              var s = o[i],
                u = r(s.id);
              s.registry(
                u.bindFunction,
                u.unbindFunction,
                u.isboundFunction,
                u.rebindFunction,
                u.unbindAsyncFunction,
                u.onActivationFunction,
                u.onDeactivationFunction,
              );
            }
          }),
          (t.prototype.loadAsync = function () {
            for (var e = [], n = 0; n < arguments.length; n++)
              e[n] = arguments[n];
            return fe(this, void 0, void 0, function () {
              var r, i, o, s, u;
              return de(this, function (c) {
                switch (c.label) {
                  case 0:
                    (r = this._getContainerModuleHelpersFactory()),
                      (i = 0),
                      (o = e),
                      (c.label = 1);
                  case 1:
                    return i < o.length
                      ? ((s = o[i]),
                        (u = r(s.id)),
                        [
                          4,
                          s.registry(
                            u.bindFunction,
                            u.unbindFunction,
                            u.isboundFunction,
                            u.rebindFunction,
                            u.unbindAsyncFunction,
                            u.onActivationFunction,
                            u.onDeactivationFunction,
                          ),
                        ])
                      : [3, 4];
                  case 2:
                    c.sent(), (c.label = 3);
                  case 3:
                    return i++, [3, 1];
                  case 4:
                    return [2];
                }
              });
            });
          }),
          (t.prototype.unload = function () {
            for (var e = this, n = [], r = 0; r < arguments.length; r++)
              n[r] = arguments[r];
            n.forEach(function (i) {
              var o = e._removeModuleBindings(i.id);
              e._deactivateSingletons(o), e._removeModuleHandlers(i.id);
            });
          }),
          (t.prototype.unloadAsync = function () {
            for (var e = [], n = 0; n < arguments.length; n++)
              e[n] = arguments[n];
            return fe(this, void 0, void 0, function () {
              var r, i, o, s;
              return de(this, function (u) {
                switch (u.label) {
                  case 0:
                    (r = 0), (i = e), (u.label = 1);
                  case 1:
                    return r < i.length
                      ? ((o = i[r]),
                        (s = this._removeModuleBindings(o.id)),
                        [4, this._deactivateSingletonsAsync(s)])
                      : [3, 4];
                  case 2:
                    u.sent(), this._removeModuleHandlers(o.id), (u.label = 3);
                  case 3:
                    return r++, [3, 1];
                  case 4:
                    return [2];
                }
              });
            });
          }),
          (t.prototype.bind = function (e) {
            var n = this.options.defaultScope || bt.BindingScopeEnum.Transient,
              r = new Ph.Binding(e, n);
            return this._bindingDictionary.add(e, r), new Dh.BindingToSyntax(r);
          }),
          (t.prototype.rebind = function (e) {
            return this.unbind(e), this.bind(e);
          }),
          (t.prototype.rebindAsync = function (e) {
            return fe(this, void 0, void 0, function () {
              return de(this, function (n) {
                switch (n.label) {
                  case 0:
                    return [4, this.unbindAsync(e)];
                  case 1:
                    return n.sent(), [2, this.bind(e)];
                }
              });
            });
          }),
          (t.prototype.unbind = function (e) {
            if (this._bindingDictionary.hasKey(e)) {
              var n = this._bindingDictionary.get(e);
              this._deactivateSingletons(n);
            }
            this._removeServiceFromDictionary(e);
          }),
          (t.prototype.unbindAsync = function (e) {
            return fe(this, void 0, void 0, function () {
              var n;
              return de(this, function (r) {
                switch (r.label) {
                  case 0:
                    return this._bindingDictionary.hasKey(e)
                      ? ((n = this._bindingDictionary.get(e)),
                        [4, this._deactivateSingletonsAsync(n)])
                      : [3, 2];
                  case 1:
                    r.sent(), (r.label = 2);
                  case 2:
                    return this._removeServiceFromDictionary(e), [2];
                }
              });
            });
          }),
          (t.prototype.unbindAll = function () {
            var e = this;
            this._bindingDictionary.traverse(function (n, r) {
              e._deactivateSingletons(r);
            }),
              (this._bindingDictionary = new Vt.Lookup());
          }),
          (t.prototype.unbindAllAsync = function () {
            return fe(this, void 0, void 0, function () {
              var e,
                n = this;
              return de(this, function (r) {
                switch (r.label) {
                  case 0:
                    return (
                      (e = []),
                      this._bindingDictionary.traverse(function (i, o) {
                        e.push(n._deactivateSingletonsAsync(o));
                      }),
                      [4, Promise.all(e)]
                    );
                  case 1:
                    return (
                      r.sent(), (this._bindingDictionary = new Vt.Lookup()), [2]
                    );
                }
              });
            });
          }),
          (t.prototype.onActivation = function (e, n) {
            this._activations.add(e, n);
          }),
          (t.prototype.onDeactivation = function (e, n) {
            this._deactivations.add(e, n);
          }),
          (t.prototype.isBound = function (e) {
            var n = this._bindingDictionary.hasKey(e);
            return !n && this.parent && (n = this.parent.isBound(e)), n;
          }),
          (t.prototype.isCurrentBound = function (e) {
            return this._bindingDictionary.hasKey(e);
          }),
          (t.prototype.isBoundNamed = function (e, n) {
            return this.isBoundTagged(e, nt.NAMED_TAG, n);
          }),
          (t.prototype.isBoundTagged = function (e, n, r) {
            var i = !1;
            if (this._bindingDictionary.hasKey(e)) {
              var o = this._bindingDictionary.get(e),
                s = (0, Vn.createMockRequest)(this, e, n, r);
              i = o.some(function (u) {
                return u.constraint(s);
              });
            }
            return (
              !i && this.parent && (i = this.parent.isBoundTagged(e, n, r)), i
            );
          }),
          (t.prototype.snapshot = function () {
            this._snapshots.push(
              Lh.ContainerSnapshot.of(
                this._bindingDictionary.clone(),
                this._middleware,
                this._activations.clone(),
                this._deactivations.clone(),
                this._moduleActivationStore.clone(),
              ),
            );
          }),
          (t.prototype.restore = function () {
            var e = this._snapshots.pop();
            if (e === void 0) throw new Error(_e.NO_MORE_SNAPSHOTS_AVAILABLE);
            (this._bindingDictionary = e.bindings),
              (this._activations = e.activations),
              (this._deactivations = e.deactivations),
              (this._middleware = e.middleware),
              (this._moduleActivationStore = e.moduleActivationStore);
          }),
          (t.prototype.createChild = function (e) {
            var n = new t(e || this.options);
            return (n.parent = this), n;
          }),
          (t.prototype.applyMiddleware = function () {
            for (var e = [], n = 0; n < arguments.length; n++)
              e[n] = arguments[n];
            var r = this._middleware
              ? this._middleware
              : this._planAndResolve();
            this._middleware = e.reduce(function (i, o) {
              return o(i);
            }, r);
          }),
          (t.prototype.applyCustomMetadataReader = function (e) {
            this._metadataReader = e;
          }),
          (t.prototype.get = function (e) {
            var n = this._getNotAllArgs(e, !1);
            return this._getButThrowIfAsync(n);
          }),
          (t.prototype.getAsync = function (e) {
            return fe(this, void 0, void 0, function () {
              var n;
              return de(this, function (r) {
                return (n = this._getNotAllArgs(e, !1)), [2, this._get(n)];
              });
            });
          }),
          (t.prototype.getTagged = function (e, n, r) {
            var i = this._getNotAllArgs(e, !1, n, r);
            return this._getButThrowIfAsync(i);
          }),
          (t.prototype.getTaggedAsync = function (e, n, r) {
            return fe(this, void 0, void 0, function () {
              var i;
              return de(this, function (o) {
                return (
                  (i = this._getNotAllArgs(e, !1, n, r)), [2, this._get(i)]
                );
              });
            });
          }),
          (t.prototype.getNamed = function (e, n) {
            return this.getTagged(e, nt.NAMED_TAG, n);
          }),
          (t.prototype.getNamedAsync = function (e, n) {
            return this.getTaggedAsync(e, nt.NAMED_TAG, n);
          }),
          (t.prototype.getAll = function (e) {
            var n = this._getAllArgs(e);
            return this._getButThrowIfAsync(n);
          }),
          (t.prototype.getAllAsync = function (e) {
            var n = this._getAllArgs(e);
            return this._getAll(n);
          }),
          (t.prototype.getAllTagged = function (e, n, r) {
            var i = this._getNotAllArgs(e, !0, n, r);
            return this._getButThrowIfAsync(i);
          }),
          (t.prototype.getAllTaggedAsync = function (e, n, r) {
            var i = this._getNotAllArgs(e, !0, n, r);
            return this._getAll(i);
          }),
          (t.prototype.getAllNamed = function (e, n) {
            return this.getAllTagged(e, nt.NAMED_TAG, n);
          }),
          (t.prototype.getAllNamedAsync = function (e, n) {
            return this.getAllTaggedAsync(e, nt.NAMED_TAG, n);
          }),
          (t.prototype.resolve = function (e) {
            var n = this.isBound(e);
            n || this.bind(e).toSelf();
            var r = this.get(e);
            return n || this.unbind(e), r;
          }),
          (t.prototype._preDestroy = function (e, n) {
            var r, i;
            if (Reflect.hasMetadata(nt.PRE_DESTROY, e)) {
              var o = Reflect.getMetadata(nt.PRE_DESTROY, e);
              return (i = (r = n)[o.value]) === null || i === void 0
                ? void 0
                : i.call(r);
            }
          }),
          (t.prototype._removeModuleHandlers = function (e) {
            var n = this._moduleActivationStore.remove(e);
            this._activations.removeIntersection(n.onActivations),
              this._deactivations.removeIntersection(n.onDeactivations);
          }),
          (t.prototype._removeModuleBindings = function (e) {
            return this._bindingDictionary.removeByCondition(function (n) {
              return n.moduleId === e;
            });
          }),
          (t.prototype._deactivate = function (e, n) {
            var r = this,
              i = Object.getPrototypeOf(n).constructor;
            try {
              if (this._deactivations.hasKey(e.serviceIdentifier)) {
                var o = this._deactivateContainer(
                  n,
                  this._deactivations.get(e.serviceIdentifier).values(),
                );
                if ((0, rt.isPromise)(o))
                  return this._handleDeactivationError(
                    o.then(function () {
                      return r._propagateContainerDeactivationThenBindingAndPreDestroyAsync(
                        e,
                        n,
                        i,
                      );
                    }),
                    i,
                  );
              }
              var s =
                this._propagateContainerDeactivationThenBindingAndPreDestroy(
                  e,
                  n,
                  i,
                );
              if ((0, rt.isPromise)(s))
                return this._handleDeactivationError(s, i);
            } catch (u) {
              if (u instanceof Error)
                throw new Error(_e.ON_DEACTIVATION_ERROR(i.name, u.message));
            }
          }),
          (t.prototype._handleDeactivationError = function (e, n) {
            return fe(this, void 0, void 0, function () {
              var r;
              return de(this, function (i) {
                switch (i.label) {
                  case 0:
                    return i.trys.push([0, 2, , 3]), [4, e];
                  case 1:
                    return i.sent(), [3, 3];
                  case 2:
                    if (((r = i.sent()), r instanceof Error))
                      throw new Error(
                        _e.ON_DEACTIVATION_ERROR(n.name, r.message),
                      );
                    return [3, 3];
                  case 3:
                    return [2];
                }
              });
            });
          }),
          (t.prototype._deactivateContainer = function (e, n) {
            for (var r = this, i = n.next(); i.value; ) {
              var o = i.value(e);
              if ((0, rt.isPromise)(o))
                return o.then(function () {
                  return r._deactivateContainerAsync(e, n);
                });
              i = n.next();
            }
          }),
          (t.prototype._deactivateContainerAsync = function (e, n) {
            return fe(this, void 0, void 0, function () {
              var r;
              return de(this, function (i) {
                switch (i.label) {
                  case 0:
                    (r = n.next()), (i.label = 1);
                  case 1:
                    return r.value ? [4, r.value(e)] : [3, 3];
                  case 2:
                    return i.sent(), (r = n.next()), [3, 1];
                  case 3:
                    return [2];
                }
              });
            });
          }),
          (t.prototype._getContainerModuleHelpersFactory = function () {
            var e = this,
              n = function (l, p) {
                l._binding.moduleId = p;
              },
              r = function (l) {
                return function (p) {
                  var m = e.bind(p);
                  return n(m, l), m;
                };
              },
              i = function () {
                return function (l) {
                  return e.unbind(l);
                };
              },
              o = function () {
                return function (l) {
                  return e.unbindAsync(l);
                };
              },
              s = function () {
                return function (l) {
                  return e.isBound(l);
                };
              },
              u = function (l) {
                return function (p) {
                  var m = e.rebind(p);
                  return n(m, l), m;
                };
              },
              c = function (l) {
                return function (p, m) {
                  e._moduleActivationStore.addActivation(l, p, m),
                    e.onActivation(p, m);
                };
              },
              a = function (l) {
                return function (p, m) {
                  e._moduleActivationStore.addDeactivation(l, p, m),
                    e.onDeactivation(p, m);
                };
              };
            return function (l) {
              return {
                bindFunction: r(l),
                isboundFunction: s(),
                onActivationFunction: c(l),
                onDeactivationFunction: a(l),
                rebindFunction: u(l),
                unbindFunction: i(),
                unbindAsyncFunction: o(),
              };
            };
          }),
          (t.prototype._getAll = function (e) {
            return Promise.all(this._get(e));
          }),
          (t.prototype._get = function (e) {
            var n = $n($n({}, e), {
              contextInterceptor: function (i) {
                return i;
              },
              targetType: bt.TargetTypeEnum.Variable,
            });
            if (this._middleware) {
              var r = this._middleware(n);
              if (r == null) throw new Error(_e.INVALID_MIDDLEWARE_RETURN);
              return r;
            }
            return this._planAndResolve()(n);
          }),
          (t.prototype._getButThrowIfAsync = function (e) {
            var n = this._get(e);
            if ((0, rt.isPromiseOrContainsPromise)(n))
              throw new Error(_e.LAZY_IN_SYNC(e.serviceIdentifier));
            return n;
          }),
          (t.prototype._getAllArgs = function (e) {
            var n = {
              avoidConstraints: !0,
              isMultiInject: !0,
              serviceIdentifier: e,
            };
            return n;
          }),
          (t.prototype._getNotAllArgs = function (e, n, r, i) {
            var o = {
              avoidConstraints: !1,
              isMultiInject: n,
              serviceIdentifier: e,
              key: r,
              value: i,
            };
            return o;
          }),
          (t.prototype._planAndResolve = function () {
            var e = this;
            return function (n) {
              var r = (0, Vn.plan)(
                e._metadataReader,
                e,
                n.isMultiInject,
                n.targetType,
                n.serviceIdentifier,
                n.key,
                n.value,
                n.avoidConstraints,
              );
              r = n.contextInterceptor(r);
              var i = (0, Mh.resolve)(r);
              return i;
            };
          }),
          (t.prototype._deactivateIfSingleton = function (e) {
            var n = this;
            if (e.activated)
              return (0, rt.isPromise)(e.cache)
                ? e.cache.then(function (r) {
                    return n._deactivate(e, r);
                  })
                : this._deactivate(e, e.cache);
          }),
          (t.prototype._deactivateSingletons = function (e) {
            for (var n = 0, r = e; n < r.length; n++) {
              var i = r[n],
                o = this._deactivateIfSingleton(i);
              if ((0, rt.isPromise)(o))
                throw new Error(_e.ASYNC_UNBIND_REQUIRED);
            }
          }),
          (t.prototype._deactivateSingletonsAsync = function (e) {
            return fe(this, void 0, void 0, function () {
              var n = this;
              return de(this, function (r) {
                switch (r.label) {
                  case 0:
                    return [
                      4,
                      Promise.all(
                        e.map(function (i) {
                          return n._deactivateIfSingleton(i);
                        }),
                      ),
                    ];
                  case 1:
                    return r.sent(), [2];
                }
              });
            });
          }),
          (t.prototype._propagateContainerDeactivationThenBindingAndPreDestroy =
            function (e, n, r) {
              return this.parent
                ? this._deactivate.bind(this.parent)(e, n)
                : this._bindingDeactivationAndPreDestroy(e, n, r);
            }),
          (t.prototype._propagateContainerDeactivationThenBindingAndPreDestroyAsync =
            function (e, n, r) {
              return fe(this, void 0, void 0, function () {
                return de(this, function (i) {
                  switch (i.label) {
                    case 0:
                      return this.parent
                        ? [4, this._deactivate.bind(this.parent)(e, n)]
                        : [3, 2];
                    case 1:
                      return i.sent(), [3, 4];
                    case 2:
                      return [
                        4,
                        this._bindingDeactivationAndPreDestroyAsync(e, n, r),
                      ];
                    case 3:
                      i.sent(), (i.label = 4);
                    case 4:
                      return [2];
                  }
                });
              });
            }),
          (t.prototype._removeServiceFromDictionary = function (e) {
            try {
              this._bindingDictionary.remove(e);
            } catch {
              throw new Error(
                _e.CANNOT_UNBIND +
                  " " +
                  (0, Bh.getServiceIdentifierAsString)(e),
              );
            }
          }),
          (t.prototype._bindingDeactivationAndPreDestroy = function (e, n, r) {
            var i = this;
            if (typeof e.onDeactivation == "function") {
              var o = e.onDeactivation(n);
              if ((0, rt.isPromise)(o))
                return o.then(function () {
                  return i._preDestroy(r, n);
                });
            }
            return this._preDestroy(r, n);
          }),
          (t.prototype._bindingDeactivationAndPreDestroyAsync = function (
            e,
            n,
            r,
          ) {
            return fe(this, void 0, void 0, function () {
              return de(this, function (i) {
                switch (i.label) {
                  case 0:
                    return typeof e.onDeactivation != "function"
                      ? [3, 2]
                      : [4, e.onDeactivation(n)];
                  case 1:
                    i.sent(), (i.label = 2);
                  case 2:
                    return [4, this._preDestroy(r, n)];
                  case 3:
                    return i.sent(), [2];
                }
              });
            });
          }),
          t
        );
      })();
    $.Container = Fh;
  });
  var Zs = g((wt) => {
    "use strict";
    Object.defineProperty(wt, "__esModule", { value: !0 });
    wt.AsyncContainerModule = wt.ContainerModule = void 0;
    var Qs = ze(),
      Uh = (function () {
        function t(e) {
          (this.id = (0, Qs.id)()), (this.registry = e);
        }
        return t;
      })();
    wt.ContainerModule = Uh;
    var qh = (function () {
      function t(e) {
        (this.id = (0, Qs.id)()), (this.registry = e);
      }
      return t;
    })();
    wt.AsyncContainerModule = qh;
  });
  var ea = g((Hn) => {
    "use strict";
    Object.defineProperty(Hn, "__esModule", { value: !0 });
    Hn.getFirstArrayDuplicate = void 0;
    function Gh(t) {
      for (var e = new Set(), n = 0, r = t; n < r.length; n++) {
        var i = r[n];
        if (e.has(i)) return i;
        e.add(i);
      }
    }
    Hn.getFirstArrayDuplicate = Gh;
  });
  var We = g((X) => {
    "use strict";
    var Wh =
        (X && X.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Vh =
        (X && X.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      na =
        (X && X.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Wh(e, t, n);
          return Vh(e, t), e;
        };
    Object.defineProperty(X, "__esModule", { value: !0 });
    X.createTaggedDecorator =
      X.tagProperty =
      X.tagParameter =
      X.decorate =
        void 0;
    var Kn = na(Y()),
      ra = na(U()),
      $h = ea();
    function Hh(t) {
      return t.prototype !== void 0;
    }
    function Kh(t) {
      if (t !== void 0) throw new Error(Kn.INVALID_DECORATOR_OPERATION);
    }
    function ia(t, e, n, r) {
      Kh(e), sa(ra.TAGGED, t, n.toString(), r);
    }
    X.tagParameter = ia;
    function oa(t, e, n) {
      if (Hh(t)) throw new Error(Kn.INVALID_DECORATOR_OPERATION);
      sa(ra.TAGGED_PROP, t.constructor, e, n);
    }
    X.tagProperty = oa;
    function Yh(t) {
      var e = [];
      if (Array.isArray(t)) {
        e = t;
        var n = (0, $h.getFirstArrayDuplicate)(
          e.map(function (r) {
            return r.key;
          }),
        );
        if (n !== void 0)
          throw new Error(Kn.DUPLICATED_METADATA + " " + n.toString());
      } else e = [t];
      return e;
    }
    function sa(t, e, n, r) {
      var i = Yh(r),
        o = {};
      Reflect.hasOwnMetadata(t, e) && (o = Reflect.getMetadata(t, e));
      var s = o[n];
      if (s === void 0) s = [];
      else
        for (
          var u = function (p) {
              if (
                i.some(function (m) {
                  return m.key === p.key;
                })
              )
                throw new Error(
                  Kn.DUPLICATED_METADATA + " " + p.key.toString(),
                );
            },
            c = 0,
            a = s;
          c < a.length;
          c++
        ) {
          var l = a[c];
          u(l);
        }
      s.push.apply(s, i), (o[n] = s), Reflect.defineMetadata(t, o, e);
    }
    function zh(t) {
      return function (e, n, r) {
        typeof r == "number" ? ia(e, n, r, t) : oa(e, n, t);
      };
    }
    X.createTaggedDecorator = zh;
    function ta(t, e) {
      Reflect.decorate(t, e);
    }
    function Jh(t, e) {
      return function (n, r) {
        e(n, r, t);
      };
    }
    function Xh(t, e, n) {
      typeof n == "number"
        ? ta([Jh(n, t)], e)
        : typeof n == "string"
          ? Reflect.decorate([t], e, n)
          : ta([t], e);
    }
    X.decorate = Xh;
  });
  var ua = g((Oe) => {
    "use strict";
    var Qh =
        (Oe && Oe.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Zh =
        (Oe && Oe.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      aa =
        (Oe && Oe.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Qh(e, t, n);
          return Zh(e, t), e;
        };
    Object.defineProperty(Oe, "__esModule", { value: !0 });
    Oe.injectable = void 0;
    var eg = aa(Y()),
      bi = aa(U());
    function tg() {
      return function (t) {
        if (Reflect.hasOwnMetadata(bi.PARAM_TYPES, t))
          throw new Error(eg.DUPLICATED_INJECTABLE_DECORATOR);
        var e = Reflect.getMetadata(bi.DESIGN_PARAM_TYPES, t) || [];
        return Reflect.defineMetadata(bi.PARAM_TYPES, e, t), t;
      };
    }
    Oe.injectable = tg;
  });
  var ca = g((Yn) => {
    "use strict";
    Object.defineProperty(Yn, "__esModule", { value: !0 });
    Yn.tagged = void 0;
    var ng = ye(),
      rg = We();
    function ig(t, e) {
      return (0, rg.createTaggedDecorator)(new ng.Metadata(t, e));
    }
    Yn.tagged = ig;
  });
  var la = g((Ne) => {
    "use strict";
    var og =
        (Ne && Ne.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      sg =
        (Ne && Ne.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      ag =
        (Ne && Ne.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                og(e, t, n);
          return sg(e, t), e;
        };
    Object.defineProperty(Ne, "__esModule", { value: !0 });
    Ne.named = void 0;
    var ug = ag(U()),
      cg = ye(),
      lg = We();
    function fg(t) {
      return (0, lg.createTaggedDecorator)(new cg.Metadata(ug.NAMED_TAG, t));
    }
    Ne.named = fg;
  });
  var wi = g((zn) => {
    "use strict";
    Object.defineProperty(zn, "__esModule", { value: !0 });
    zn.injectBase = void 0;
    var dg = Y(),
      pg = ye(),
      hg = We();
    function gg(t) {
      return function (e) {
        return function (n, r, i) {
          if (e === void 0) {
            var o = typeof n == "function" ? n.name : n.constructor.name;
            throw new Error((0, dg.UNDEFINED_INJECT_ANNOTATION)(o));
          }
          return (0, hg.createTaggedDecorator)(new pg.Metadata(t, e))(n, r, i);
        };
      };
    }
    zn.injectBase = gg;
  });
  var fa = g((Pe) => {
    "use strict";
    var mg =
        (Pe && Pe.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      yg =
        (Pe && Pe.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      _g =
        (Pe && Pe.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                mg(e, t, n);
          return yg(e, t), e;
        };
    Object.defineProperty(Pe, "__esModule", { value: !0 });
    Pe.inject = void 0;
    var vg = _g(U()),
      bg = wi(),
      wg = (0, bg.injectBase)(vg.INJECT_TAG);
    Pe.inject = wg;
  });
  var da = g((Re) => {
    "use strict";
    var Sg =
        (Re && Re.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Tg =
        (Re && Re.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      Eg =
        (Re && Re.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Sg(e, t, n);
          return Tg(e, t), e;
        };
    Object.defineProperty(Re, "__esModule", { value: !0 });
    Re.optional = void 0;
    var xg = Eg(U()),
      Ag = ye(),
      Cg = We();
    function Ig() {
      return (0, Cg.createTaggedDecorator)(
        new Ag.Metadata(xg.OPTIONAL_TAG, !0),
      );
    }
    Re.optional = Ig;
  });
  var pa = g((Me) => {
    "use strict";
    var Og =
        (Me && Me.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Ng =
        (Me && Me.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      Pg =
        (Me && Me.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Og(e, t, n);
          return Ng(e, t), e;
        };
    Object.defineProperty(Me, "__esModule", { value: !0 });
    Me.unmanaged = void 0;
    var Rg = Pg(U()),
      Mg = ye(),
      Dg = We();
    function kg() {
      return function (t, e, n) {
        var r = new Mg.Metadata(Rg.UNMANAGED_TAG, !0);
        (0, Dg.tagParameter)(t, e, n, r);
      };
    }
    Me.unmanaged = kg;
  });
  var ha = g((De) => {
    "use strict";
    var Bg =
        (De && De.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Lg =
        (De && De.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      jg =
        (De && De.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Bg(e, t, n);
          return Lg(e, t), e;
        };
    Object.defineProperty(De, "__esModule", { value: !0 });
    De.multiInject = void 0;
    var Fg = jg(U()),
      Ug = wi(),
      qg = (0, Ug.injectBase)(Fg.MULTI_INJECT_TAG);
    De.multiInject = qg;
  });
  var ga = g((ke) => {
    "use strict";
    var Gg =
        (ke && ke.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Wg =
        (ke && ke.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      Vg =
        (ke && ke.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Gg(e, t, n);
          return Wg(e, t), e;
        };
    Object.defineProperty(ke, "__esModule", { value: !0 });
    ke.targetName = void 0;
    var $g = Vg(U()),
      Hg = ye(),
      Kg = We();
    function Yg(t) {
      return function (e, n, r) {
        var i = new Hg.Metadata($g.NAME_TAG, t);
        (0, Kg.tagParameter)(e, n, r, i);
      };
    }
    ke.targetName = Yg;
  });
  var Si = g((Jn) => {
    "use strict";
    Object.defineProperty(Jn, "__esModule", { value: !0 });
    Jn.propertyEventDecorator = void 0;
    var zg = ye();
    function Jg(t, e) {
      return function () {
        return function (n, r) {
          var i = new zg.Metadata(t, r);
          if (Reflect.hasOwnMetadata(t, n.constructor)) throw new Error(e);
          Reflect.defineMetadata(t, i, n.constructor);
        };
      };
    }
    Jn.propertyEventDecorator = Jg;
  });
  var ya = g((Be) => {
    "use strict";
    var Xg =
        (Be && Be.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      Qg =
        (Be && Be.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      ma =
        (Be && Be.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                Xg(e, t, n);
          return Qg(e, t), e;
        };
    Object.defineProperty(Be, "__esModule", { value: !0 });
    Be.postConstruct = void 0;
    var Zg = ma(Y()),
      em = ma(U()),
      tm = Si(),
      nm = (0, tm.propertyEventDecorator)(
        em.POST_CONSTRUCT,
        Zg.MULTIPLE_POST_CONSTRUCT_METHODS,
      );
    Be.postConstruct = nm;
  });
  var va = g((Le) => {
    "use strict";
    var rm =
        (Le && Le.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      im =
        (Le && Le.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      _a =
        (Le && Le.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                rm(e, t, n);
          return im(e, t), e;
        };
    Object.defineProperty(Le, "__esModule", { value: !0 });
    Le.preDestroy = void 0;
    var om = _a(Y()),
      sm = _a(U()),
      am = Si(),
      um = (0, am.propertyEventDecorator)(
        sm.PRE_DESTROY,
        om.MULTIPLE_PRE_DESTROY_METHODS,
      );
    Le.preDestroy = um;
  });
  var ba = g((Xn) => {
    "use strict";
    Object.defineProperty(Xn, "__esModule", { value: !0 });
    Xn.interfaces = void 0;
    var Ti;
    Ti || (Ti = {});
    Xn.interfaces = Ti;
  });
  var xi = g((v) => {
    "use strict";
    var cm =
        (v && v.__createBinding) ||
        (Object.create
          ? function (t, e, n, r) {
              r === void 0 && (r = n),
                Object.defineProperty(t, r, {
                  enumerable: !0,
                  get: function () {
                    return e[n];
                  },
                });
            }
          : function (t, e, n, r) {
              r === void 0 && (r = n), (t[r] = e[n]);
            }),
      lm =
        (v && v.__setModuleDefault) ||
        (Object.create
          ? function (t, e) {
              Object.defineProperty(t, "default", { enumerable: !0, value: e });
            }
          : function (t, e) {
              t.default = e;
            }),
      fm =
        (v && v.__importStar) ||
        function (t) {
          if (t && t.__esModule) return t;
          var e = {};
          if (t != null)
            for (var n in t)
              n !== "default" &&
                Object.prototype.hasOwnProperty.call(t, n) &&
                cm(e, t, n);
          return lm(e, t), e;
        };
    Object.defineProperty(v, "__esModule", { value: !0 });
    v.multiBindToService =
      v.getServiceIdentifierAsString =
      v.typeConstraint =
      v.namedConstraint =
      v.taggedConstraint =
      v.traverseAncerstors =
      v.decorate =
      v.interfaces =
      v.id =
      v.MetadataReader =
      v.preDestroy =
      v.postConstruct =
      v.targetName =
      v.multiInject =
      v.unmanaged =
      v.optional =
      v.LazyServiceIdentifer =
      v.LazyServiceIdentifier =
      v.inject =
      v.named =
      v.tagged =
      v.injectable =
      v.createTaggedDecorator =
      v.ContainerModule =
      v.AsyncContainerModule =
      v.TargetTypeEnum =
      v.BindingTypeEnum =
      v.BindingScopeEnum =
      v.Container =
      v.METADATA_KEY =
        void 0;
    var dm = fm(U());
    v.METADATA_KEY = dm;
    var pm = Xs();
    Object.defineProperty(v, "Container", {
      enumerable: !0,
      get: function () {
        return pm.Container;
      },
    });
    var Ei = ce();
    Object.defineProperty(v, "BindingScopeEnum", {
      enumerable: !0,
      get: function () {
        return Ei.BindingScopeEnum;
      },
    });
    Object.defineProperty(v, "BindingTypeEnum", {
      enumerable: !0,
      get: function () {
        return Ei.BindingTypeEnum;
      },
    });
    Object.defineProperty(v, "TargetTypeEnum", {
      enumerable: !0,
      get: function () {
        return Ei.TargetTypeEnum;
      },
    });
    var wa = Zs();
    Object.defineProperty(v, "AsyncContainerModule", {
      enumerable: !0,
      get: function () {
        return wa.AsyncContainerModule;
      },
    });
    Object.defineProperty(v, "ContainerModule", {
      enumerable: !0,
      get: function () {
        return wa.ContainerModule;
      },
    });
    var hm = We();
    Object.defineProperty(v, "createTaggedDecorator", {
      enumerable: !0,
      get: function () {
        return hm.createTaggedDecorator;
      },
    });
    var gm = ua();
    Object.defineProperty(v, "injectable", {
      enumerable: !0,
      get: function () {
        return gm.injectable;
      },
    });
    var mm = ca();
    Object.defineProperty(v, "tagged", {
      enumerable: !0,
      get: function () {
        return mm.tagged;
      },
    });
    var ym = la();
    Object.defineProperty(v, "named", {
      enumerable: !0,
      get: function () {
        return ym.named;
      },
    });
    var _m = fa();
    Object.defineProperty(v, "inject", {
      enumerable: !0,
      get: function () {
        return _m.inject;
      },
    });
    var vm = Cn();
    Object.defineProperty(v, "LazyServiceIdentifier", {
      enumerable: !0,
      get: function () {
        return vm.LazyServiceIdentifier;
      },
    });
    var bm = Cn();
    Object.defineProperty(v, "LazyServiceIdentifer", {
      enumerable: !0,
      get: function () {
        return bm.LazyServiceIdentifier;
      },
    });
    var wm = da();
    Object.defineProperty(v, "optional", {
      enumerable: !0,
      get: function () {
        return wm.optional;
      },
    });
    var Sm = pa();
    Object.defineProperty(v, "unmanaged", {
      enumerable: !0,
      get: function () {
        return Sm.unmanaged;
      },
    });
    var Tm = ha();
    Object.defineProperty(v, "multiInject", {
      enumerable: !0,
      get: function () {
        return Tm.multiInject;
      },
    });
    var Em = ga();
    Object.defineProperty(v, "targetName", {
      enumerable: !0,
      get: function () {
        return Em.targetName;
      },
    });
    var xm = ya();
    Object.defineProperty(v, "postConstruct", {
      enumerable: !0,
      get: function () {
        return xm.postConstruct;
      },
    });
    var Am = va();
    Object.defineProperty(v, "preDestroy", {
      enumerable: !0,
      get: function () {
        return Am.preDestroy;
      },
    });
    var Cm = Jr();
    Object.defineProperty(v, "MetadataReader", {
      enumerable: !0,
      get: function () {
        return Cm.MetadataReader;
      },
    });
    var Im = ze();
    Object.defineProperty(v, "id", {
      enumerable: !0,
      get: function () {
        return Im.id;
      },
    });
    var Om = ba();
    Object.defineProperty(v, "interfaces", {
      enumerable: !0,
      get: function () {
        return Om.interfaces;
      },
    });
    var Nm = We();
    Object.defineProperty(v, "decorate", {
      enumerable: !0,
      get: function () {
        return Nm.decorate;
      },
    });
    var Qn = gi();
    Object.defineProperty(v, "traverseAncerstors", {
      enumerable: !0,
      get: function () {
        return Qn.traverseAncerstors;
      },
    });
    Object.defineProperty(v, "taggedConstraint", {
      enumerable: !0,
      get: function () {
        return Qn.taggedConstraint;
      },
    });
    Object.defineProperty(v, "namedConstraint", {
      enumerable: !0,
      get: function () {
        return Qn.namedConstraint;
      },
    });
    Object.defineProperty(v, "typeConstraint", {
      enumerable: !0,
      get: function () {
        return Qn.typeConstraint;
      },
    });
    var Pm = et();
    Object.defineProperty(v, "getServiceIdentifierAsString", {
      enumerable: !0,
      get: function () {
        return Pm.getServiceIdentifierAsString;
      },
    });
    var Rm = ui();
    Object.defineProperty(v, "multiBindToService", {
      enumerable: !0,
      get: function () {
        return Rm.multiBindToService;
      },
    });
  });
  var ka = g((uT, Da) => {
    "use strict";
    var { Duplex: Vm } = I("stream");
    function Ra(t) {
      t.emit("close");
    }
    function $m() {
      !this.destroyed && this._writableState.finished && this.destroy();
    }
    function Ma(t) {
      this.removeListener("error", Ma),
        this.destroy(),
        this.listenerCount("error") === 0 && this.emit("error", t);
    }
    function Hm(t, e) {
      let n = !0,
        r = new Vm({
          ...e,
          autoDestroy: !1,
          emitClose: !1,
          objectMode: !1,
          writableObjectMode: !1,
        });
      return (
        t.on("message", function (o, s) {
          let u = !s && r._readableState.objectMode ? o.toString() : o;
          r.push(u) || t.pause();
        }),
        t.once("error", function (o) {
          r.destroyed || ((n = !1), r.destroy(o));
        }),
        t.once("close", function () {
          r.destroyed || r.push(null);
        }),
        (r._destroy = function (i, o) {
          if (t.readyState === t.CLOSED) {
            o(i), process.nextTick(Ra, r);
            return;
          }
          let s = !1;
          t.once("error", function (c) {
            (s = !0), o(c);
          }),
            t.once("close", function () {
              s || o(i), process.nextTick(Ra, r);
            }),
            n && t.terminate();
        }),
        (r._final = function (i) {
          if (t.readyState === t.CONNECTING) {
            t.once("open", function () {
              r._final(i);
            });
            return;
          }
          t._socket !== null &&
            (t._socket._writableState.finished
              ? (i(), r._readableState.endEmitted && r.destroy())
              : (t._socket.once("finish", function () {
                  i();
                }),
                t.close()));
        }),
        (r._read = function () {
          t.isPaused && t.resume();
        }),
        (r._write = function (i, o, s) {
          if (t.readyState === t.CONNECTING) {
            t.once("open", function () {
              r._write(i, o, s);
            });
            return;
          }
          t.send(i, s);
        }),
        r.on("end", $m),
        r.on("error", Ma),
        r
      );
    }
    Da.exports = Hm;
  });
  var Je = g((cT, Ba) => {
    "use strict";
    Ba.exports = {
      BINARY_TYPES: ["nodebuffer", "arraybuffer", "fragments"],
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
      kListener: Symbol("kListener"),
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      NOOP: () => {},
    };
  });
  var Ht = g((lT, or) => {
    "use strict";
    var { EMPTY_BUFFER: Km } = Je(),
      Pi = Buffer[Symbol.species];
    function Ym(t, e) {
      if (t.length === 0) return Km;
      if (t.length === 1) return t[0];
      let n = Buffer.allocUnsafe(e),
        r = 0;
      for (let i = 0; i < t.length; i++) {
        let o = t[i];
        n.set(o, r), (r += o.length);
      }
      return r < e ? new Pi(n.buffer, n.byteOffset, r) : n;
    }
    function La(t, e, n, r, i) {
      for (let o = 0; o < i; o++) n[r + o] = t[o] ^ e[o & 3];
    }
    function ja(t, e) {
      for (let n = 0; n < t.length; n++) t[n] ^= e[n & 3];
    }
    function zm(t) {
      return t.length === t.buffer.byteLength
        ? t.buffer
        : t.buffer.slice(t.byteOffset, t.byteOffset + t.length);
    }
    function Ri(t) {
      if (((Ri.readOnly = !0), Buffer.isBuffer(t))) return t;
      let e;
      return (
        t instanceof ArrayBuffer
          ? (e = new Pi(t))
          : ArrayBuffer.isView(t)
            ? (e = new Pi(t.buffer, t.byteOffset, t.byteLength))
            : ((e = Buffer.from(t)), (Ri.readOnly = !1)),
        e
      );
    }
    or.exports = {
      concat: Ym,
      mask: La,
      toArrayBuffer: zm,
      toBuffer: Ri,
      unmask: ja,
    };
    if (!process.env.WS_NO_BUFFER_UTIL)
      try {
        let t = I("bufferutil");
        (or.exports.mask = function (e, n, r, i, o) {
          o < 48 ? La(e, n, r, i, o) : t.mask(e, n, r, i, o);
        }),
          (or.exports.unmask = function (e, n) {
            e.length < 32 ? ja(e, n) : t.unmask(e, n);
          });
      } catch {}
  });
  var qa = g((fT, Ua) => {
    "use strict";
    var Fa = Symbol("kDone"),
      Mi = Symbol("kRun"),
      Di = class {
        constructor(e) {
          (this[Fa] = () => {
            this.pending--, this[Mi]();
          }),
            (this.concurrency = e || 1 / 0),
            (this.jobs = []),
            (this.pending = 0);
        }
        add(e) {
          this.jobs.push(e), this[Mi]();
        }
        [Mi]() {
          if (this.pending !== this.concurrency && this.jobs.length) {
            let e = this.jobs.shift();
            this.pending++, e(this[Fa]);
          }
        }
      };
    Ua.exports = Di;
  });
  var zt = g((dT, $a) => {
    "use strict";
    var Kt = I("zlib"),
      Ga = Ht(),
      Jm = qa(),
      { kStatusCode: Wa } = Je(),
      Xm = Buffer[Symbol.species],
      Qm = Buffer.from([0, 0, 255, 255]),
      ur = Symbol("permessage-deflate"),
      Ve = Symbol("total-length"),
      Yt = Symbol("callback"),
      Xe = Symbol("buffers"),
      ar = Symbol("error"),
      sr,
      ki = class {
        constructor(e, n, r) {
          if (
            ((this._maxPayload = r | 0),
            (this._options = e || {}),
            (this._threshold =
              this._options.threshold !== void 0
                ? this._options.threshold
                : 1024),
            (this._isServer = !!n),
            (this._deflate = null),
            (this._inflate = null),
            (this.params = null),
            !sr)
          ) {
            let i =
              this._options.concurrencyLimit !== void 0
                ? this._options.concurrencyLimit
                : 10;
            sr = new Jm(i);
          }
        }
        static get extensionName() {
          return "permessage-deflate";
        }
        offer() {
          let e = {};
          return (
            this._options.serverNoContextTakeover &&
              (e.server_no_context_takeover = !0),
            this._options.clientNoContextTakeover &&
              (e.client_no_context_takeover = !0),
            this._options.serverMaxWindowBits &&
              (e.server_max_window_bits = this._options.serverMaxWindowBits),
            this._options.clientMaxWindowBits
              ? (e.client_max_window_bits = this._options.clientMaxWindowBits)
              : this._options.clientMaxWindowBits == null &&
                (e.client_max_window_bits = !0),
            e
          );
        }
        accept(e) {
          return (
            (e = this.normalizeParams(e)),
            (this.params = this._isServer
              ? this.acceptAsServer(e)
              : this.acceptAsClient(e)),
            this.params
          );
        }
        cleanup() {
          if (
            (this._inflate && (this._inflate.close(), (this._inflate = null)),
            this._deflate)
          ) {
            let e = this._deflate[Yt];
            this._deflate.close(),
              (this._deflate = null),
              e &&
                e(
                  new Error(
                    "The deflate stream was closed while data was being processed",
                  ),
                );
          }
        }
        acceptAsServer(e) {
          let n = this._options,
            r = e.find(
              (i) =>
                !(
                  (n.serverNoContextTakeover === !1 &&
                    i.server_no_context_takeover) ||
                  (i.server_max_window_bits &&
                    (n.serverMaxWindowBits === !1 ||
                      (typeof n.serverMaxWindowBits == "number" &&
                        n.serverMaxWindowBits > i.server_max_window_bits))) ||
                  (typeof n.clientMaxWindowBits == "number" &&
                    !i.client_max_window_bits)
                ),
            );
          if (!r)
            throw new Error("None of the extension offers can be accepted");
          return (
            n.serverNoContextTakeover && (r.server_no_context_takeover = !0),
            n.clientNoContextTakeover && (r.client_no_context_takeover = !0),
            typeof n.serverMaxWindowBits == "number" &&
              (r.server_max_window_bits = n.serverMaxWindowBits),
            typeof n.clientMaxWindowBits == "number"
              ? (r.client_max_window_bits = n.clientMaxWindowBits)
              : (r.client_max_window_bits === !0 ||
                  n.clientMaxWindowBits === !1) &&
                delete r.client_max_window_bits,
            r
          );
        }
        acceptAsClient(e) {
          let n = e[0];
          if (
            this._options.clientNoContextTakeover === !1 &&
            n.client_no_context_takeover
          )
            throw new Error(
              'Unexpected parameter "client_no_context_takeover"',
            );
          if (!n.client_max_window_bits)
            typeof this._options.clientMaxWindowBits == "number" &&
              (n.client_max_window_bits = this._options.clientMaxWindowBits);
          else if (
            this._options.clientMaxWindowBits === !1 ||
            (typeof this._options.clientMaxWindowBits == "number" &&
              n.client_max_window_bits > this._options.clientMaxWindowBits)
          )
            throw new Error(
              'Unexpected or invalid parameter "client_max_window_bits"',
            );
          return n;
        }
        normalizeParams(e) {
          return (
            e.forEach((n) => {
              Object.keys(n).forEach((r) => {
                let i = n[r];
                if (i.length > 1)
                  throw new Error(
                    `Parameter "${r}" must have only a single value`,
                  );
                if (((i = i[0]), r === "client_max_window_bits")) {
                  if (i !== !0) {
                    let o = +i;
                    if (!Number.isInteger(o) || o < 8 || o > 15)
                      throw new TypeError(
                        `Invalid value for parameter "${r}": ${i}`,
                      );
                    i = o;
                  } else if (!this._isServer)
                    throw new TypeError(
                      `Invalid value for parameter "${r}": ${i}`,
                    );
                } else if (r === "server_max_window_bits") {
                  let o = +i;
                  if (!Number.isInteger(o) || o < 8 || o > 15)
                    throw new TypeError(
                      `Invalid value for parameter "${r}": ${i}`,
                    );
                  i = o;
                } else if (
                  r === "client_no_context_takeover" ||
                  r === "server_no_context_takeover"
                ) {
                  if (i !== !0)
                    throw new TypeError(
                      `Invalid value for parameter "${r}": ${i}`,
                    );
                } else throw new Error(`Unknown parameter "${r}"`);
                n[r] = i;
              });
            }),
            e
          );
        }
        decompress(e, n, r) {
          sr.add((i) => {
            this._decompress(e, n, (o, s) => {
              i(), r(o, s);
            });
          });
        }
        compress(e, n, r) {
          sr.add((i) => {
            this._compress(e, n, (o, s) => {
              i(), r(o, s);
            });
          });
        }
        _decompress(e, n, r) {
          let i = this._isServer ? "client" : "server";
          if (!this._inflate) {
            let o = `${i}_max_window_bits`,
              s =
                typeof this.params[o] != "number"
                  ? Kt.Z_DEFAULT_WINDOWBITS
                  : this.params[o];
            (this._inflate = Kt.createInflateRaw({
              ...this._options.zlibInflateOptions,
              windowBits: s,
            })),
              (this._inflate[ur] = this),
              (this._inflate[Ve] = 0),
              (this._inflate[Xe] = []),
              this._inflate.on("error", ey),
              this._inflate.on("data", Va);
          }
          (this._inflate[Yt] = r),
            this._inflate.write(e),
            n && this._inflate.write(Qm),
            this._inflate.flush(() => {
              let o = this._inflate[ar];
              if (o) {
                this._inflate.close(), (this._inflate = null), r(o);
                return;
              }
              let s = Ga.concat(this._inflate[Xe], this._inflate[Ve]);
              this._inflate._readableState.endEmitted
                ? (this._inflate.close(), (this._inflate = null))
                : ((this._inflate[Ve] = 0),
                  (this._inflate[Xe] = []),
                  n &&
                    this.params[`${i}_no_context_takeover`] &&
                    this._inflate.reset()),
                r(null, s);
            });
        }
        _compress(e, n, r) {
          let i = this._isServer ? "server" : "client";
          if (!this._deflate) {
            let o = `${i}_max_window_bits`,
              s =
                typeof this.params[o] != "number"
                  ? Kt.Z_DEFAULT_WINDOWBITS
                  : this.params[o];
            (this._deflate = Kt.createDeflateRaw({
              ...this._options.zlibDeflateOptions,
              windowBits: s,
            })),
              (this._deflate[Ve] = 0),
              (this._deflate[Xe] = []),
              this._deflate.on("data", Zm);
          }
          (this._deflate[Yt] = r),
            this._deflate.write(e),
            this._deflate.flush(Kt.Z_SYNC_FLUSH, () => {
              if (!this._deflate) return;
              let o = Ga.concat(this._deflate[Xe], this._deflate[Ve]);
              n && (o = new Xm(o.buffer, o.byteOffset, o.length - 4)),
                (this._deflate[Yt] = null),
                (this._deflate[Ve] = 0),
                (this._deflate[Xe] = []),
                n &&
                  this.params[`${i}_no_context_takeover`] &&
                  this._deflate.reset(),
                r(null, o);
            });
        }
      };
    $a.exports = ki;
    function Zm(t) {
      this[Xe].push(t), (this[Ve] += t.length);
    }
    function Va(t) {
      if (
        ((this[Ve] += t.length),
        this[ur]._maxPayload < 1 || this[Ve] <= this[ur]._maxPayload)
      ) {
        this[Xe].push(t);
        return;
      }
      (this[ar] = new RangeError("Max payload size exceeded")),
        (this[ar].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"),
        (this[ar][Wa] = 1009),
        this.removeListener("data", Va),
        this.reset();
    }
    function ey(t) {
      (this[ur]._inflate = null), (t[Wa] = 1007), this[Yt](t);
    }
  });
  var Jt = g((pT, cr) => {
    "use strict";
    var { isUtf8: Ha } = I("buffer"),
      ty = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 0, 1, 0, 1, 0,
      ];
    function ny(t) {
      return (
        (t >= 1e3 && t <= 1014 && t !== 1004 && t !== 1005 && t !== 1006) ||
        (t >= 3e3 && t <= 4999)
      );
    }
    function Bi(t) {
      let e = t.length,
        n = 0;
      for (; n < e; )
        if ((t[n] & 128) === 0) n++;
        else if ((t[n] & 224) === 192) {
          if (n + 1 === e || (t[n + 1] & 192) !== 128 || (t[n] & 254) === 192)
            return !1;
          n += 2;
        } else if ((t[n] & 240) === 224) {
          if (
            n + 2 >= e ||
            (t[n + 1] & 192) !== 128 ||
            (t[n + 2] & 192) !== 128 ||
            (t[n] === 224 && (t[n + 1] & 224) === 128) ||
            (t[n] === 237 && (t[n + 1] & 224) === 160)
          )
            return !1;
          n += 3;
        } else if ((t[n] & 248) === 240) {
          if (
            n + 3 >= e ||
            (t[n + 1] & 192) !== 128 ||
            (t[n + 2] & 192) !== 128 ||
            (t[n + 3] & 192) !== 128 ||
            (t[n] === 240 && (t[n + 1] & 240) === 128) ||
            (t[n] === 244 && t[n + 1] > 143) ||
            t[n] > 244
          )
            return !1;
          n += 4;
        } else return !1;
      return !0;
    }
    cr.exports = { isValidStatusCode: ny, isValidUTF8: Bi, tokenChars: ty };
    if (Ha)
      cr.exports.isValidUTF8 = function (t) {
        return t.length < 24 ? Bi(t) : Ha(t);
      };
    else if (!process.env.WS_NO_UTF_8_VALIDATE)
      try {
        let t = I("utf-8-validate");
        cr.exports.isValidUTF8 = function (e) {
          return e.length < 32 ? Bi(e) : t(e);
        };
      } catch {}
  });
  var qi = g((hT, Za) => {
    "use strict";
    var { Writable: ry } = I("stream"),
      Ka = zt(),
      {
        BINARY_TYPES: iy,
        EMPTY_BUFFER: Ya,
        kStatusCode: oy,
        kWebSocket: sy,
      } = Je(),
      { concat: Li, toArrayBuffer: ay, unmask: uy } = Ht(),
      { isValidStatusCode: cy, isValidUTF8: za } = Jt(),
      lr = Buffer[Symbol.species],
      he = 0,
      Ja = 1,
      Xa = 2,
      Qa = 3,
      ji = 4,
      Fi = 5,
      fr = 6,
      Ui = class extends ry {
        constructor(e = {}) {
          super(),
            (this._allowSynchronousEvents =
              e.allowSynchronousEvents !== void 0
                ? e.allowSynchronousEvents
                : !0),
            (this._binaryType = e.binaryType || iy[0]),
            (this._extensions = e.extensions || {}),
            (this._isServer = !!e.isServer),
            (this._maxPayload = e.maxPayload | 0),
            (this._skipUTF8Validation = !!e.skipUTF8Validation),
            (this[sy] = void 0),
            (this._bufferedBytes = 0),
            (this._buffers = []),
            (this._compressed = !1),
            (this._payloadLength = 0),
            (this._mask = void 0),
            (this._fragmented = 0),
            (this._masked = !1),
            (this._fin = !1),
            (this._opcode = 0),
            (this._totalPayloadLength = 0),
            (this._messageLength = 0),
            (this._fragments = []),
            (this._errored = !1),
            (this._loop = !1),
            (this._state = he);
        }
        _write(e, n, r) {
          if (this._opcode === 8 && this._state == he) return r();
          (this._bufferedBytes += e.length),
            this._buffers.push(e),
            this.startLoop(r);
        }
        consume(e) {
          if (((this._bufferedBytes -= e), e === this._buffers[0].length))
            return this._buffers.shift();
          if (e < this._buffers[0].length) {
            let r = this._buffers[0];
            return (
              (this._buffers[0] = new lr(
                r.buffer,
                r.byteOffset + e,
                r.length - e,
              )),
              new lr(r.buffer, r.byteOffset, e)
            );
          }
          let n = Buffer.allocUnsafe(e);
          do {
            let r = this._buffers[0],
              i = n.length - e;
            e >= r.length
              ? n.set(this._buffers.shift(), i)
              : (n.set(new Uint8Array(r.buffer, r.byteOffset, e), i),
                (this._buffers[0] = new lr(
                  r.buffer,
                  r.byteOffset + e,
                  r.length - e,
                ))),
              (e -= r.length);
          } while (e > 0);
          return n;
        }
        startLoop(e) {
          this._loop = !0;
          do
            switch (this._state) {
              case he:
                this.getInfo(e);
                break;
              case Ja:
                this.getPayloadLength16(e);
                break;
              case Xa:
                this.getPayloadLength64(e);
                break;
              case Qa:
                this.getMask();
                break;
              case ji:
                this.getData(e);
                break;
              case Fi:
              case fr:
                this._loop = !1;
                return;
            }
          while (this._loop);
          this._errored || e();
        }
        getInfo(e) {
          if (this._bufferedBytes < 2) {
            this._loop = !1;
            return;
          }
          let n = this.consume(2);
          if ((n[0] & 48) !== 0) {
            let i = this.createError(
              RangeError,
              "RSV2 and RSV3 must be clear",
              !0,
              1002,
              "WS_ERR_UNEXPECTED_RSV_2_3",
            );
            e(i);
            return;
          }
          let r = (n[0] & 64) === 64;
          if (r && !this._extensions[Ka.extensionName]) {
            let i = this.createError(
              RangeError,
              "RSV1 must be clear",
              !0,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1",
            );
            e(i);
            return;
          }
          if (
            ((this._fin = (n[0] & 128) === 128),
            (this._opcode = n[0] & 15),
            (this._payloadLength = n[1] & 127),
            this._opcode === 0)
          ) {
            if (r) {
              let i = this.createError(
                RangeError,
                "RSV1 must be clear",
                !0,
                1002,
                "WS_ERR_UNEXPECTED_RSV_1",
              );
              e(i);
              return;
            }
            if (!this._fragmented) {
              let i = this.createError(
                RangeError,
                "invalid opcode 0",
                !0,
                1002,
                "WS_ERR_INVALID_OPCODE",
              );
              e(i);
              return;
            }
            this._opcode = this._fragmented;
          } else if (this._opcode === 1 || this._opcode === 2) {
            if (this._fragmented) {
              let i = this.createError(
                RangeError,
                `invalid opcode ${this._opcode}`,
                !0,
                1002,
                "WS_ERR_INVALID_OPCODE",
              );
              e(i);
              return;
            }
            this._compressed = r;
          } else if (this._opcode > 7 && this._opcode < 11) {
            if (!this._fin) {
              let i = this.createError(
                RangeError,
                "FIN must be set",
                !0,
                1002,
                "WS_ERR_EXPECTED_FIN",
              );
              e(i);
              return;
            }
            if (r) {
              let i = this.createError(
                RangeError,
                "RSV1 must be clear",
                !0,
                1002,
                "WS_ERR_UNEXPECTED_RSV_1",
              );
              e(i);
              return;
            }
            if (
              this._payloadLength > 125 ||
              (this._opcode === 8 && this._payloadLength === 1)
            ) {
              let i = this.createError(
                RangeError,
                `invalid payload length ${this._payloadLength}`,
                !0,
                1002,
                "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH",
              );
              e(i);
              return;
            }
          } else {
            let i = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              !0,
              1002,
              "WS_ERR_INVALID_OPCODE",
            );
            e(i);
            return;
          }
          if (
            (!this._fin &&
              !this._fragmented &&
              (this._fragmented = this._opcode),
            (this._masked = (n[1] & 128) === 128),
            this._isServer)
          ) {
            if (!this._masked) {
              let i = this.createError(
                RangeError,
                "MASK must be set",
                !0,
                1002,
                "WS_ERR_EXPECTED_MASK",
              );
              e(i);
              return;
            }
          } else if (this._masked) {
            let i = this.createError(
              RangeError,
              "MASK must be clear",
              !0,
              1002,
              "WS_ERR_UNEXPECTED_MASK",
            );
            e(i);
            return;
          }
          this._payloadLength === 126
            ? (this._state = Ja)
            : this._payloadLength === 127
              ? (this._state = Xa)
              : this.haveLength(e);
        }
        getPayloadLength16(e) {
          if (this._bufferedBytes < 2) {
            this._loop = !1;
            return;
          }
          (this._payloadLength = this.consume(2).readUInt16BE(0)),
            this.haveLength(e);
        }
        getPayloadLength64(e) {
          if (this._bufferedBytes < 8) {
            this._loop = !1;
            return;
          }
          let n = this.consume(8),
            r = n.readUInt32BE(0);
          if (r > Math.pow(2, 21) - 1) {
            let i = this.createError(
              RangeError,
              "Unsupported WebSocket frame: payload length > 2^53 - 1",
              !1,
              1009,
              "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH",
            );
            e(i);
            return;
          }
          (this._payloadLength = r * Math.pow(2, 32) + n.readUInt32BE(4)),
            this.haveLength(e);
        }
        haveLength(e) {
          if (
            this._payloadLength &&
            this._opcode < 8 &&
            ((this._totalPayloadLength += this._payloadLength),
            this._totalPayloadLength > this._maxPayload && this._maxPayload > 0)
          ) {
            let n = this.createError(
              RangeError,
              "Max payload size exceeded",
              !1,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH",
            );
            e(n);
            return;
          }
          this._masked ? (this._state = Qa) : (this._state = ji);
        }
        getMask() {
          if (this._bufferedBytes < 4) {
            this._loop = !1;
            return;
          }
          (this._mask = this.consume(4)), (this._state = ji);
        }
        getData(e) {
          let n = Ya;
          if (this._payloadLength) {
            if (this._bufferedBytes < this._payloadLength) {
              this._loop = !1;
              return;
            }
            (n = this.consume(this._payloadLength)),
              this._masked &&
                (this._mask[0] |
                  this._mask[1] |
                  this._mask[2] |
                  this._mask[3]) !==
                  0 &&
                uy(n, this._mask);
          }
          if (this._opcode > 7) {
            this.controlMessage(n, e);
            return;
          }
          if (this._compressed) {
            (this._state = Fi), this.decompress(n, e);
            return;
          }
          n.length &&
            ((this._messageLength = this._totalPayloadLength),
            this._fragments.push(n)),
            this.dataMessage(e);
        }
        decompress(e, n) {
          this._extensions[Ka.extensionName].decompress(
            e,
            this._fin,
            (i, o) => {
              if (i) return n(i);
              if (o.length) {
                if (
                  ((this._messageLength += o.length),
                  this._messageLength > this._maxPayload &&
                    this._maxPayload > 0)
                ) {
                  let s = this.createError(
                    RangeError,
                    "Max payload size exceeded",
                    !1,
                    1009,
                    "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH",
                  );
                  n(s);
                  return;
                }
                this._fragments.push(o);
              }
              this.dataMessage(n), this._state === he && this.startLoop(n);
            },
          );
        }
        dataMessage(e) {
          if (!this._fin) {
            this._state = he;
            return;
          }
          let n = this._messageLength,
            r = this._fragments;
          if (
            ((this._totalPayloadLength = 0),
            (this._messageLength = 0),
            (this._fragmented = 0),
            (this._fragments = []),
            this._opcode === 2)
          ) {
            let i;
            this._binaryType === "nodebuffer"
              ? (i = Li(r, n))
              : this._binaryType === "arraybuffer"
                ? (i = ay(Li(r, n)))
                : (i = r),
              this._allowSynchronousEvents
                ? (this.emit("message", i, !0), (this._state = he))
                : ((this._state = fr),
                  setImmediate(() => {
                    this.emit("message", i, !0),
                      (this._state = he),
                      this.startLoop(e);
                  }));
          } else {
            let i = Li(r, n);
            if (!this._skipUTF8Validation && !za(i)) {
              let o = this.createError(
                Error,
                "invalid UTF-8 sequence",
                !0,
                1007,
                "WS_ERR_INVALID_UTF8",
              );
              e(o);
              return;
            }
            this._state === Fi || this._allowSynchronousEvents
              ? (this.emit("message", i, !1), (this._state = he))
              : ((this._state = fr),
                setImmediate(() => {
                  this.emit("message", i, !1),
                    (this._state = he),
                    this.startLoop(e);
                }));
          }
        }
        controlMessage(e, n) {
          if (this._opcode === 8) {
            if (e.length === 0)
              (this._loop = !1), this.emit("conclude", 1005, Ya), this.end();
            else {
              let r = e.readUInt16BE(0);
              if (!cy(r)) {
                let o = this.createError(
                  RangeError,
                  `invalid status code ${r}`,
                  !0,
                  1002,
                  "WS_ERR_INVALID_CLOSE_CODE",
                );
                n(o);
                return;
              }
              let i = new lr(e.buffer, e.byteOffset + 2, e.length - 2);
              if (!this._skipUTF8Validation && !za(i)) {
                let o = this.createError(
                  Error,
                  "invalid UTF-8 sequence",
                  !0,
                  1007,
                  "WS_ERR_INVALID_UTF8",
                );
                n(o);
                return;
              }
              (this._loop = !1), this.emit("conclude", r, i), this.end();
            }
            this._state = he;
            return;
          }
          this._allowSynchronousEvents
            ? (this.emit(this._opcode === 9 ? "ping" : "pong", e),
              (this._state = he))
            : ((this._state = fr),
              setImmediate(() => {
                this.emit(this._opcode === 9 ? "ping" : "pong", e),
                  (this._state = he),
                  this.startLoop(n);
              }));
        }
        createError(e, n, r, i, o) {
          (this._loop = !1), (this._errored = !0);
          let s = new e(r ? `Invalid WebSocket frame: ${n}` : n);
          return (
            Error.captureStackTrace(s, this.createError),
            (s.code = o),
            (s[oy] = i),
            s
          );
        }
      };
    Za.exports = Ui;
  });
  var Wi = g((mT, nu) => {
    "use strict";
    var { Duplex: gT } = I("stream"),
      { randomFillSync: ly } = I("crypto"),
      eu = zt(),
      { EMPTY_BUFFER: fy } = Je(),
      { isValidStatusCode: dy } = Jt(),
      { mask: tu, toBuffer: Et } = Ht(),
      ve = Symbol("kByteLength"),
      py = Buffer.alloc(4),
      dr = 8 * 1024,
      it,
      xt = dr,
      Gi = class t {
        constructor(e, n, r) {
          (this._extensions = n || {}),
            r &&
              ((this._generateMask = r), (this._maskBuffer = Buffer.alloc(4))),
            (this._socket = e),
            (this._firstFragment = !0),
            (this._compress = !1),
            (this._bufferedBytes = 0),
            (this._deflating = !1),
            (this._queue = []);
        }
        static frame(e, n) {
          let r,
            i = !1,
            o = 2,
            s = !1;
          n.mask &&
            ((r = n.maskBuffer || py),
            n.generateMask
              ? n.generateMask(r)
              : (xt === dr &&
                  (it === void 0 && (it = Buffer.alloc(dr)),
                  ly(it, 0, dr),
                  (xt = 0)),
                (r[0] = it[xt++]),
                (r[1] = it[xt++]),
                (r[2] = it[xt++]),
                (r[3] = it[xt++])),
            (s = (r[0] | r[1] | r[2] | r[3]) === 0),
            (o = 6));
          let u;
          typeof e == "string"
            ? (!n.mask || s) && n[ve] !== void 0
              ? (u = n[ve])
              : ((e = Buffer.from(e)), (u = e.length))
            : ((u = e.length), (i = n.mask && n.readOnly && !s));
          let c = u;
          u >= 65536 ? ((o += 8), (c = 127)) : u > 125 && ((o += 2), (c = 126));
          let a = Buffer.allocUnsafe(i ? u + o : o);
          return (
            (a[0] = n.fin ? n.opcode | 128 : n.opcode),
            n.rsv1 && (a[0] |= 64),
            (a[1] = c),
            c === 126
              ? a.writeUInt16BE(u, 2)
              : c === 127 && ((a[2] = a[3] = 0), a.writeUIntBE(u, 4, 6)),
            n.mask
              ? ((a[1] |= 128),
                (a[o - 4] = r[0]),
                (a[o - 3] = r[1]),
                (a[o - 2] = r[2]),
                (a[o - 1] = r[3]),
                s
                  ? [a, e]
                  : i
                    ? (tu(e, r, a, o, u), [a])
                    : (tu(e, r, e, 0, u), [a, e]))
              : [a, e]
          );
        }
        close(e, n, r, i) {
          let o;
          if (e === void 0) o = fy;
          else {
            if (typeof e != "number" || !dy(e))
              throw new TypeError(
                "First argument must be a valid error code number",
              );
            if (n === void 0 || !n.length)
              (o = Buffer.allocUnsafe(2)), o.writeUInt16BE(e, 0);
            else {
              let u = Buffer.byteLength(n);
              if (u > 123)
                throw new RangeError(
                  "The message must not be greater than 123 bytes",
                );
              (o = Buffer.allocUnsafe(2 + u)),
                o.writeUInt16BE(e, 0),
                typeof n == "string" ? o.write(n, 2) : o.set(n, 2);
            }
          }
          let s = {
            [ve]: o.length,
            fin: !0,
            generateMask: this._generateMask,
            mask: r,
            maskBuffer: this._maskBuffer,
            opcode: 8,
            readOnly: !1,
            rsv1: !1,
          };
          this._deflating
            ? this.enqueue([this.dispatch, o, !1, s, i])
            : this.sendFrame(t.frame(o, s), i);
        }
        ping(e, n, r) {
          let i, o;
          if (
            (typeof e == "string"
              ? ((i = Buffer.byteLength(e)), (o = !1))
              : ((e = Et(e)), (i = e.length), (o = Et.readOnly)),
            i > 125)
          )
            throw new RangeError(
              "The data size must not be greater than 125 bytes",
            );
          let s = {
            [ve]: i,
            fin: !0,
            generateMask: this._generateMask,
            mask: n,
            maskBuffer: this._maskBuffer,
            opcode: 9,
            readOnly: o,
            rsv1: !1,
          };
          this._deflating
            ? this.enqueue([this.dispatch, e, !1, s, r])
            : this.sendFrame(t.frame(e, s), r);
        }
        pong(e, n, r) {
          let i, o;
          if (
            (typeof e == "string"
              ? ((i = Buffer.byteLength(e)), (o = !1))
              : ((e = Et(e)), (i = e.length), (o = Et.readOnly)),
            i > 125)
          )
            throw new RangeError(
              "The data size must not be greater than 125 bytes",
            );
          let s = {
            [ve]: i,
            fin: !0,
            generateMask: this._generateMask,
            mask: n,
            maskBuffer: this._maskBuffer,
            opcode: 10,
            readOnly: o,
            rsv1: !1,
          };
          this._deflating
            ? this.enqueue([this.dispatch, e, !1, s, r])
            : this.sendFrame(t.frame(e, s), r);
        }
        send(e, n, r) {
          let i = this._extensions[eu.extensionName],
            o = n.binary ? 2 : 1,
            s = n.compress,
            u,
            c;
          if (
            (typeof e == "string"
              ? ((u = Buffer.byteLength(e)), (c = !1))
              : ((e = Et(e)), (u = e.length), (c = Et.readOnly)),
            this._firstFragment
              ? ((this._firstFragment = !1),
                s &&
                  i &&
                  i.params[
                    i._isServer
                      ? "server_no_context_takeover"
                      : "client_no_context_takeover"
                  ] &&
                  (s = u >= i._threshold),
                (this._compress = s))
              : ((s = !1), (o = 0)),
            n.fin && (this._firstFragment = !0),
            i)
          ) {
            let a = {
              [ve]: u,
              fin: n.fin,
              generateMask: this._generateMask,
              mask: n.mask,
              maskBuffer: this._maskBuffer,
              opcode: o,
              readOnly: c,
              rsv1: s,
            };
            this._deflating
              ? this.enqueue([this.dispatch, e, this._compress, a, r])
              : this.dispatch(e, this._compress, a, r);
          } else
            this.sendFrame(
              t.frame(e, {
                [ve]: u,
                fin: n.fin,
                generateMask: this._generateMask,
                mask: n.mask,
                maskBuffer: this._maskBuffer,
                opcode: o,
                readOnly: c,
                rsv1: !1,
              }),
              r,
            );
        }
        dispatch(e, n, r, i) {
          if (!n) {
            this.sendFrame(t.frame(e, r), i);
            return;
          }
          let o = this._extensions[eu.extensionName];
          (this._bufferedBytes += r[ve]),
            (this._deflating = !0),
            o.compress(e, r.fin, (s, u) => {
              if (this._socket.destroyed) {
                let c = new Error(
                  "The socket was closed while data was being compressed",
                );
                typeof i == "function" && i(c);
                for (let a = 0; a < this._queue.length; a++) {
                  let l = this._queue[a],
                    p = l[l.length - 1];
                  typeof p == "function" && p(c);
                }
                return;
              }
              (this._bufferedBytes -= r[ve]),
                (this._deflating = !1),
                (r.readOnly = !1),
                this.sendFrame(t.frame(u, r), i),
                this.dequeue();
            });
        }
        dequeue() {
          for (; !this._deflating && this._queue.length; ) {
            let e = this._queue.shift();
            (this._bufferedBytes -= e[3][ve]),
              Reflect.apply(e[0], this, e.slice(1));
          }
        }
        enqueue(e) {
          (this._bufferedBytes += e[3][ve]), this._queue.push(e);
        }
        sendFrame(e, n) {
          e.length === 2
            ? (this._socket.cork(),
              this._socket.write(e[0]),
              this._socket.write(e[1], n),
              this._socket.uncork())
            : this._socket.write(e[0], n);
        }
      };
    nu.exports = Gi;
  });
  var fu = g((yT, lu) => {
    "use strict";
    var { kForOnEventAttribute: Xt, kListener: Vi } = Je(),
      ru = Symbol("kCode"),
      iu = Symbol("kData"),
      ou = Symbol("kError"),
      su = Symbol("kMessage"),
      au = Symbol("kReason"),
      At = Symbol("kTarget"),
      uu = Symbol("kType"),
      cu = Symbol("kWasClean"),
      $e = class {
        constructor(e) {
          (this[At] = null), (this[uu] = e);
        }
        get target() {
          return this[At];
        }
        get type() {
          return this[uu];
        }
      };
    Object.defineProperty($e.prototype, "target", { enumerable: !0 });
    Object.defineProperty($e.prototype, "type", { enumerable: !0 });
    var ot = class extends $e {
      constructor(e, n = {}) {
        super(e),
          (this[ru] = n.code === void 0 ? 0 : n.code),
          (this[au] = n.reason === void 0 ? "" : n.reason),
          (this[cu] = n.wasClean === void 0 ? !1 : n.wasClean);
      }
      get code() {
        return this[ru];
      }
      get reason() {
        return this[au];
      }
      get wasClean() {
        return this[cu];
      }
    };
    Object.defineProperty(ot.prototype, "code", { enumerable: !0 });
    Object.defineProperty(ot.prototype, "reason", { enumerable: !0 });
    Object.defineProperty(ot.prototype, "wasClean", { enumerable: !0 });
    var Ct = class extends $e {
      constructor(e, n = {}) {
        super(e),
          (this[ou] = n.error === void 0 ? null : n.error),
          (this[su] = n.message === void 0 ? "" : n.message);
      }
      get error() {
        return this[ou];
      }
      get message() {
        return this[su];
      }
    };
    Object.defineProperty(Ct.prototype, "error", { enumerable: !0 });
    Object.defineProperty(Ct.prototype, "message", { enumerable: !0 });
    var Qt = class extends $e {
      constructor(e, n = {}) {
        super(e), (this[iu] = n.data === void 0 ? null : n.data);
      }
      get data() {
        return this[iu];
      }
    };
    Object.defineProperty(Qt.prototype, "data", { enumerable: !0 });
    var hy = {
      addEventListener(t, e, n = {}) {
        for (let i of this.listeners(t))
          if (!n[Xt] && i[Vi] === e && !i[Xt]) return;
        let r;
        if (t === "message")
          r = function (o, s) {
            let u = new Qt("message", { data: s ? o : o.toString() });
            (u[At] = this), pr(e, this, u);
          };
        else if (t === "close")
          r = function (o, s) {
            let u = new ot("close", {
              code: o,
              reason: s.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent,
            });
            (u[At] = this), pr(e, this, u);
          };
        else if (t === "error")
          r = function (o) {
            let s = new Ct("error", { error: o, message: o.message });
            (s[At] = this), pr(e, this, s);
          };
        else if (t === "open")
          r = function () {
            let o = new $e("open");
            (o[At] = this), pr(e, this, o);
          };
        else return;
        (r[Xt] = !!n[Xt]),
          (r[Vi] = e),
          n.once ? this.once(t, r) : this.on(t, r);
      },
      removeEventListener(t, e) {
        for (let n of this.listeners(t))
          if (n[Vi] === e && !n[Xt]) {
            this.removeListener(t, n);
            break;
          }
      },
    };
    lu.exports = {
      CloseEvent: ot,
      ErrorEvent: Ct,
      Event: $e,
      EventTarget: hy,
      MessageEvent: Qt,
    };
    function pr(t, e, n) {
      typeof t == "object" && t.handleEvent
        ? t.handleEvent.call(t, n)
        : t.call(e, n);
    }
  });
  var $i = g((_T, du) => {
    "use strict";
    var { tokenChars: Zt } = Jt();
    function je(t, e, n) {
      t[e] === void 0 ? (t[e] = [n]) : t[e].push(n);
    }
    function gy(t) {
      let e = Object.create(null),
        n = Object.create(null),
        r = !1,
        i = !1,
        o = !1,
        s,
        u,
        c = -1,
        a = -1,
        l = -1,
        p = 0;
      for (; p < t.length; p++)
        if (((a = t.charCodeAt(p)), s === void 0))
          if (l === -1 && Zt[a] === 1) c === -1 && (c = p);
          else if (p !== 0 && (a === 32 || a === 9))
            l === -1 && c !== -1 && (l = p);
          else if (a === 59 || a === 44) {
            if (c === -1)
              throw new SyntaxError(`Unexpected character at index ${p}`);
            l === -1 && (l = p);
            let b = t.slice(c, l);
            a === 44 ? (je(e, b, n), (n = Object.create(null))) : (s = b),
              (c = l = -1);
          } else throw new SyntaxError(`Unexpected character at index ${p}`);
        else if (u === void 0)
          if (l === -1 && Zt[a] === 1) c === -1 && (c = p);
          else if (a === 32 || a === 9) l === -1 && c !== -1 && (l = p);
          else if (a === 59 || a === 44) {
            if (c === -1)
              throw new SyntaxError(`Unexpected character at index ${p}`);
            l === -1 && (l = p),
              je(n, t.slice(c, l), !0),
              a === 44 &&
                (je(e, s, n), (n = Object.create(null)), (s = void 0)),
              (c = l = -1);
          } else if (a === 61 && c !== -1 && l === -1)
            (u = t.slice(c, p)), (c = l = -1);
          else throw new SyntaxError(`Unexpected character at index ${p}`);
        else if (i) {
          if (Zt[a] !== 1)
            throw new SyntaxError(`Unexpected character at index ${p}`);
          c === -1 ? (c = p) : r || (r = !0), (i = !1);
        } else if (o)
          if (Zt[a] === 1) c === -1 && (c = p);
          else if (a === 34 && c !== -1) (o = !1), (l = p);
          else if (a === 92) i = !0;
          else throw new SyntaxError(`Unexpected character at index ${p}`);
        else if (a === 34 && t.charCodeAt(p - 1) === 61) o = !0;
        else if (l === -1 && Zt[a] === 1) c === -1 && (c = p);
        else if (c !== -1 && (a === 32 || a === 9)) l === -1 && (l = p);
        else if (a === 59 || a === 44) {
          if (c === -1)
            throw new SyntaxError(`Unexpected character at index ${p}`);
          l === -1 && (l = p);
          let b = t.slice(c, l);
          r && ((b = b.replace(/\\/g, "")), (r = !1)),
            je(n, u, b),
            a === 44 && (je(e, s, n), (n = Object.create(null)), (s = void 0)),
            (u = void 0),
            (c = l = -1);
        } else throw new SyntaxError(`Unexpected character at index ${p}`);
      if (c === -1 || o || a === 32 || a === 9)
        throw new SyntaxError("Unexpected end of input");
      l === -1 && (l = p);
      let m = t.slice(c, l);
      return (
        s === void 0
          ? je(e, m, n)
          : (u === void 0
              ? je(n, m, !0)
              : r
                ? je(n, u, m.replace(/\\/g, ""))
                : je(n, u, m),
            je(e, s, n)),
        e
      );
    }
    function my(t) {
      return Object.keys(t)
        .map((e) => {
          let n = t[e];
          return (
            Array.isArray(n) || (n = [n]),
            n
              .map((r) =>
                [e]
                  .concat(
                    Object.keys(r).map((i) => {
                      let o = r[i];
                      return (
                        Array.isArray(o) || (o = [o]),
                        o.map((s) => (s === !0 ? i : `${i}=${s}`)).join("; ")
                      );
                    }),
                  )
                  .join("; "),
              )
              .join(", ")
          );
        })
        .join(", ");
    }
    du.exports = { format: my, parse: gy };
  });
  var Ji = g((wT, Tu) => {
    "use strict";
    var yy = I("events"),
      _y = I("https"),
      vy = I("http"),
      gu = I("net"),
      by = I("tls"),
      { randomBytes: wy, createHash: Sy } = I("crypto"),
      { Duplex: vT, Readable: bT } = I("stream"),
      { URL: Hi } = I("url"),
      Qe = zt(),
      Ty = qi(),
      Ey = Wi(),
      {
        BINARY_TYPES: pu,
        EMPTY_BUFFER: hr,
        GUID: xy,
        kForOnEventAttribute: Ki,
        kListener: Ay,
        kStatusCode: Cy,
        kWebSocket: Q,
        NOOP: mu,
      } = Je(),
      {
        EventTarget: { addEventListener: Iy, removeEventListener: Oy },
      } = fu(),
      { format: Ny, parse: Py } = $i(),
      { toBuffer: Ry } = Ht(),
      My = 30 * 1e3,
      yu = Symbol("kAborted"),
      Yi = [8, 13],
      He = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"],
      Dy = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/,
      j = class t extends yy {
        constructor(e, n, r) {
          super(),
            (this._binaryType = pu[0]),
            (this._closeCode = 1006),
            (this._closeFrameReceived = !1),
            (this._closeFrameSent = !1),
            (this._closeMessage = hr),
            (this._closeTimer = null),
            (this._extensions = {}),
            (this._paused = !1),
            (this._protocol = ""),
            (this._readyState = t.CONNECTING),
            (this._receiver = null),
            (this._sender = null),
            (this._socket = null),
            e !== null
              ? ((this._bufferedAmount = 0),
                (this._isServer = !1),
                (this._redirects = 0),
                n === void 0
                  ? (n = [])
                  : Array.isArray(n) ||
                    (typeof n == "object" && n !== null
                      ? ((r = n), (n = []))
                      : (n = [n])),
                _u(this, e, n, r))
              : ((this._autoPong = r.autoPong), (this._isServer = !0));
        }
        get binaryType() {
          return this._binaryType;
        }
        set binaryType(e) {
          pu.includes(e) &&
            ((this._binaryType = e),
            this._receiver && (this._receiver._binaryType = e));
        }
        get bufferedAmount() {
          return this._socket
            ? this._socket._writableState.length + this._sender._bufferedBytes
            : this._bufferedAmount;
        }
        get extensions() {
          return Object.keys(this._extensions).join();
        }
        get isPaused() {
          return this._paused;
        }
        get onclose() {
          return null;
        }
        get onerror() {
          return null;
        }
        get onopen() {
          return null;
        }
        get onmessage() {
          return null;
        }
        get protocol() {
          return this._protocol;
        }
        get readyState() {
          return this._readyState;
        }
        get url() {
          return this._url;
        }
        setSocket(e, n, r) {
          let i = new Ty({
            allowSynchronousEvents: r.allowSynchronousEvents,
            binaryType: this.binaryType,
            extensions: this._extensions,
            isServer: this._isServer,
            maxPayload: r.maxPayload,
            skipUTF8Validation: r.skipUTF8Validation,
          });
          (this._sender = new Ey(e, this._extensions, r.generateMask)),
            (this._receiver = i),
            (this._socket = e),
            (i[Q] = this),
            (e[Q] = this),
            i.on("conclude", Ly),
            i.on("drain", jy),
            i.on("error", Fy),
            i.on("message", Uy),
            i.on("ping", qy),
            i.on("pong", Gy),
            e.setTimeout && e.setTimeout(0),
            e.setNoDelay && e.setNoDelay(),
            n.length > 0 && e.unshift(n),
            e.on("close", bu),
            e.on("data", mr),
            e.on("end", wu),
            e.on("error", Su),
            (this._readyState = t.OPEN),
            this.emit("open");
        }
        emitClose() {
          if (!this._socket) {
            (this._readyState = t.CLOSED),
              this.emit("close", this._closeCode, this._closeMessage);
            return;
          }
          this._extensions[Qe.extensionName] &&
            this._extensions[Qe.extensionName].cleanup(),
            this._receiver.removeAllListeners(),
            (this._readyState = t.CLOSED),
            this.emit("close", this._closeCode, this._closeMessage);
        }
        close(e, n) {
          if (this.readyState !== t.CLOSED) {
            if (this.readyState === t.CONNECTING) {
              ae(
                this,
                this._req,
                "WebSocket was closed before the connection was established",
              );
              return;
            }
            if (this.readyState === t.CLOSING) {
              this._closeFrameSent &&
                (this._closeFrameReceived ||
                  this._receiver._writableState.errorEmitted) &&
                this._socket.end();
              return;
            }
            (this._readyState = t.CLOSING),
              this._sender.close(e, n, !this._isServer, (r) => {
                r ||
                  ((this._closeFrameSent = !0),
                  (this._closeFrameReceived ||
                    this._receiver._writableState.errorEmitted) &&
                    this._socket.end());
              }),
              (this._closeTimer = setTimeout(
                this._socket.destroy.bind(this._socket),
                My,
              ));
          }
        }
        pause() {
          this.readyState === t.CONNECTING ||
            this.readyState === t.CLOSED ||
            ((this._paused = !0), this._socket.pause());
        }
        ping(e, n, r) {
          if (this.readyState === t.CONNECTING)
            throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
          if (
            (typeof e == "function"
              ? ((r = e), (e = n = void 0))
              : typeof n == "function" && ((r = n), (n = void 0)),
            typeof e == "number" && (e = e.toString()),
            this.readyState !== t.OPEN)
          ) {
            zi(this, e, r);
            return;
          }
          n === void 0 && (n = !this._isServer),
            this._sender.ping(e || hr, n, r);
        }
        pong(e, n, r) {
          if (this.readyState === t.CONNECTING)
            throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
          if (
            (typeof e == "function"
              ? ((r = e), (e = n = void 0))
              : typeof n == "function" && ((r = n), (n = void 0)),
            typeof e == "number" && (e = e.toString()),
            this.readyState !== t.OPEN)
          ) {
            zi(this, e, r);
            return;
          }
          n === void 0 && (n = !this._isServer),
            this._sender.pong(e || hr, n, r);
        }
        resume() {
          this.readyState === t.CONNECTING ||
            this.readyState === t.CLOSED ||
            ((this._paused = !1),
            this._receiver._writableState.needDrain || this._socket.resume());
        }
        send(e, n, r) {
          if (this.readyState === t.CONNECTING)
            throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
          if (
            (typeof n == "function" && ((r = n), (n = {})),
            typeof e == "number" && (e = e.toString()),
            this.readyState !== t.OPEN)
          ) {
            zi(this, e, r);
            return;
          }
          let i = {
            binary: typeof e != "string",
            mask: !this._isServer,
            compress: !0,
            fin: !0,
            ...n,
          };
          this._extensions[Qe.extensionName] || (i.compress = !1),
            this._sender.send(e || hr, i, r);
        }
        terminate() {
          if (this.readyState !== t.CLOSED) {
            if (this.readyState === t.CONNECTING) {
              ae(
                this,
                this._req,
                "WebSocket was closed before the connection was established",
              );
              return;
            }
            this._socket &&
              ((this._readyState = t.CLOSING), this._socket.destroy());
          }
        }
      };
    Object.defineProperty(j, "CONNECTING", {
      enumerable: !0,
      value: He.indexOf("CONNECTING"),
    });
    Object.defineProperty(j.prototype, "CONNECTING", {
      enumerable: !0,
      value: He.indexOf("CONNECTING"),
    });
    Object.defineProperty(j, "OPEN", {
      enumerable: !0,
      value: He.indexOf("OPEN"),
    });
    Object.defineProperty(j.prototype, "OPEN", {
      enumerable: !0,
      value: He.indexOf("OPEN"),
    });
    Object.defineProperty(j, "CLOSING", {
      enumerable: !0,
      value: He.indexOf("CLOSING"),
    });
    Object.defineProperty(j.prototype, "CLOSING", {
      enumerable: !0,
      value: He.indexOf("CLOSING"),
    });
    Object.defineProperty(j, "CLOSED", {
      enumerable: !0,
      value: He.indexOf("CLOSED"),
    });
    Object.defineProperty(j.prototype, "CLOSED", {
      enumerable: !0,
      value: He.indexOf("CLOSED"),
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url",
    ].forEach((t) => {
      Object.defineProperty(j.prototype, t, { enumerable: !0 });
    });
    ["open", "error", "close", "message"].forEach((t) => {
      Object.defineProperty(j.prototype, `on${t}`, {
        enumerable: !0,
        get() {
          for (let e of this.listeners(t)) if (e[Ki]) return e[Ay];
          return null;
        },
        set(e) {
          for (let n of this.listeners(t))
            if (n[Ki]) {
              this.removeListener(t, n);
              break;
            }
          typeof e == "function" && this.addEventListener(t, e, { [Ki]: !0 });
        },
      });
    });
    j.prototype.addEventListener = Iy;
    j.prototype.removeEventListener = Oy;
    Tu.exports = j;
    function _u(t, e, n, r) {
      let i = {
        allowSynchronousEvents: !0,
        autoPong: !0,
        protocolVersion: Yi[1],
        maxPayload: 104857600,
        skipUTF8Validation: !1,
        perMessageDeflate: !0,
        followRedirects: !1,
        maxRedirects: 10,
        ...r,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0,
      };
      if (((t._autoPong = i.autoPong), !Yi.includes(i.protocolVersion)))
        throw new RangeError(
          `Unsupported protocol version: ${i.protocolVersion} (supported versions: ${Yi.join(", ")})`,
        );
      let o;
      if (e instanceof Hi) o = e;
      else
        try {
          o = new Hi(e);
        } catch {
          throw new SyntaxError(`Invalid URL: ${e}`);
        }
      o.protocol === "http:"
        ? (o.protocol = "ws:")
        : o.protocol === "https:" && (o.protocol = "wss:"),
        (t._url = o.href);
      let s = o.protocol === "wss:",
        u = o.protocol === "ws+unix:",
        c;
      if (
        (o.protocol !== "ws:" && !s && !u
          ? (c = `The URL's protocol must be one of "ws:", "wss:", "http:", "https", or "ws+unix:"`)
          : u && !o.pathname
            ? (c = "The URL's pathname is empty")
            : o.hash && (c = "The URL contains a fragment identifier"),
        c)
      ) {
        let w = new SyntaxError(c);
        if (t._redirects === 0) throw w;
        gr(t, w);
        return;
      }
      let a = s ? 443 : 80,
        l = wy(16).toString("base64"),
        p = s ? _y.request : vy.request,
        m = new Set(),
        b;
      if (
        ((i.createConnection = i.createConnection || (s ? By : ky)),
        (i.defaultPort = i.defaultPort || a),
        (i.port = o.port || a),
        (i.host = o.hostname.startsWith("[")
          ? o.hostname.slice(1, -1)
          : o.hostname),
        (i.headers = {
          ...i.headers,
          "Sec-WebSocket-Version": i.protocolVersion,
          "Sec-WebSocket-Key": l,
          Connection: "Upgrade",
          Upgrade: "websocket",
        }),
        (i.path = o.pathname + o.search),
        (i.timeout = i.handshakeTimeout),
        i.perMessageDeflate &&
          ((b = new Qe(
            i.perMessageDeflate !== !0 ? i.perMessageDeflate : {},
            !1,
            i.maxPayload,
          )),
          (i.headers["Sec-WebSocket-Extensions"] = Ny({
            [Qe.extensionName]: b.offer(),
          }))),
        n.length)
      ) {
        for (let w of n) {
          if (typeof w != "string" || !Dy.test(w) || m.has(w))
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified",
            );
          m.add(w);
        }
        i.headers["Sec-WebSocket-Protocol"] = n.join(",");
      }
      if (
        (i.origin &&
          (i.protocolVersion < 13
            ? (i.headers["Sec-WebSocket-Origin"] = i.origin)
            : (i.headers.Origin = i.origin)),
        (o.username || o.password) && (i.auth = `${o.username}:${o.password}`),
        u)
      ) {
        let w = i.path.split(":");
        (i.socketPath = w[0]), (i.path = w[1]);
      }
      let T;
      if (i.followRedirects) {
        if (t._redirects === 0) {
          (t._originalIpc = u),
            (t._originalSecure = s),
            (t._originalHostOrSocketPath = u ? i.socketPath : o.host);
          let w = r && r.headers;
          if (((r = { ...r, headers: {} }), w))
            for (let [R, K] of Object.entries(w))
              r.headers[R.toLowerCase()] = K;
        } else if (t.listenerCount("redirect") === 0) {
          let w = u
            ? t._originalIpc
              ? i.socketPath === t._originalHostOrSocketPath
              : !1
            : t._originalIpc
              ? !1
              : o.host === t._originalHostOrSocketPath;
          (!w || (t._originalSecure && !s)) &&
            (delete i.headers.authorization,
            delete i.headers.cookie,
            w || delete i.headers.host,
            (i.auth = void 0));
        }
        i.auth &&
          !r.headers.authorization &&
          (r.headers.authorization =
            "Basic " + Buffer.from(i.auth).toString("base64")),
          (T = t._req = p(i)),
          t._redirects && t.emit("redirect", t.url, T);
      } else T = t._req = p(i);
      i.timeout &&
        T.on("timeout", () => {
          ae(t, T, "Opening handshake has timed out");
        }),
        T.on("error", (w) => {
          T === null || T[yu] || ((T = t._req = null), gr(t, w));
        }),
        T.on("response", (w) => {
          let R = w.headers.location,
            K = w.statusCode;
          if (R && i.followRedirects && K >= 300 && K < 400) {
            if (++t._redirects > i.maxRedirects) {
              ae(t, T, "Maximum redirects exceeded");
              return;
            }
            T.abort();
            let ue;
            try {
              ue = new Hi(R, e);
            } catch {
              let ge = new SyntaxError(`Invalid URL: ${R}`);
              gr(t, ge);
              return;
            }
            _u(t, ue, n, r);
          } else
            t.emit("unexpected-response", T, w) ||
              ae(t, T, `Unexpected server response: ${w.statusCode}`);
        }),
        T.on("upgrade", (w, R, K) => {
          if ((t.emit("upgrade", w), t.readyState !== j.CONNECTING)) return;
          T = t._req = null;
          let ue = w.headers.upgrade;
          if (ue === void 0 || ue.toLowerCase() !== "websocket") {
            ae(t, R, "Invalid Upgrade header");
            return;
          }
          let pt = Sy("sha1")
            .update(l + xy)
            .digest("base64");
          if (w.headers["sec-websocket-accept"] !== pt) {
            ae(t, R, "Invalid Sec-WebSocket-Accept header");
            return;
          }
          let ge = w.headers["sec-websocket-protocol"],
            be;
          if (
            (ge !== void 0
              ? m.size
                ? m.has(ge) || (be = "Server sent an invalid subprotocol")
                : (be = "Server sent a subprotocol but none was requested")
              : m.size && (be = "Server sent no subprotocol"),
            be)
          ) {
            ae(t, R, be);
            return;
          }
          ge && (t._protocol = ge);
          let Ze = w.headers["sec-websocket-extensions"];
          if (Ze !== void 0) {
            if (!b) {
              ae(
                t,
                R,
                "Server sent a Sec-WebSocket-Extensions header but no extension was requested",
              );
              return;
            }
            let Ke;
            try {
              Ke = Py(Ze);
            } catch {
              ae(t, R, "Invalid Sec-WebSocket-Extensions header");
              return;
            }
            let vn = Object.keys(Ke);
            if (vn.length !== 1 || vn[0] !== Qe.extensionName) {
              ae(t, R, "Server indicated an extension that was not requested");
              return;
            }
            try {
              b.accept(Ke[Qe.extensionName]);
            } catch {
              ae(t, R, "Invalid Sec-WebSocket-Extensions header");
              return;
            }
            t._extensions[Qe.extensionName] = b;
          }
          t.setSocket(R, K, {
            allowSynchronousEvents: i.allowSynchronousEvents,
            generateMask: i.generateMask,
            maxPayload: i.maxPayload,
            skipUTF8Validation: i.skipUTF8Validation,
          });
        }),
        i.finishRequest ? i.finishRequest(T, t) : T.end();
    }
    function gr(t, e) {
      (t._readyState = j.CLOSING), t.emit("error", e), t.emitClose();
    }
    function ky(t) {
      return (t.path = t.socketPath), gu.connect(t);
    }
    function By(t) {
      return (
        (t.path = void 0),
        !t.servername &&
          t.servername !== "" &&
          (t.servername = gu.isIP(t.host) ? "" : t.host),
        by.connect(t)
      );
    }
    function ae(t, e, n) {
      t._readyState = j.CLOSING;
      let r = new Error(n);
      Error.captureStackTrace(r, ae),
        e.setHeader
          ? ((e[yu] = !0),
            e.abort(),
            e.socket && !e.socket.destroyed && e.socket.destroy(),
            process.nextTick(gr, t, r))
          : (e.destroy(r),
            e.once("error", t.emit.bind(t, "error")),
            e.once("close", t.emitClose.bind(t)));
    }
    function zi(t, e, n) {
      if (e) {
        let r = Ry(e).length;
        t._socket ? (t._sender._bufferedBytes += r) : (t._bufferedAmount += r);
      }
      if (n) {
        let r = new Error(
          `WebSocket is not open: readyState ${t.readyState} (${He[t.readyState]})`,
        );
        process.nextTick(n, r);
      }
    }
    function Ly(t, e) {
      let n = this[Q];
      (n._closeFrameReceived = !0),
        (n._closeMessage = e),
        (n._closeCode = t),
        n._socket[Q] !== void 0 &&
          (n._socket.removeListener("data", mr),
          process.nextTick(vu, n._socket),
          t === 1005 ? n.close() : n.close(t, e));
    }
    function jy() {
      let t = this[Q];
      t.isPaused || t._socket.resume();
    }
    function Fy(t) {
      let e = this[Q];
      e._socket[Q] !== void 0 &&
        (e._socket.removeListener("data", mr),
        process.nextTick(vu, e._socket),
        e.close(t[Cy])),
        e.emit("error", t);
    }
    function hu() {
      this[Q].emitClose();
    }
    function Uy(t, e) {
      this[Q].emit("message", t, e);
    }
    function qy(t) {
      let e = this[Q];
      e._autoPong && e.pong(t, !this._isServer, mu), e.emit("ping", t);
    }
    function Gy(t) {
      this[Q].emit("pong", t);
    }
    function vu(t) {
      t.resume();
    }
    function bu() {
      let t = this[Q];
      this.removeListener("close", bu),
        this.removeListener("data", mr),
        this.removeListener("end", wu),
        (t._readyState = j.CLOSING);
      let e;
      !this._readableState.endEmitted &&
        !t._closeFrameReceived &&
        !t._receiver._writableState.errorEmitted &&
        (e = t._socket.read()) !== null &&
        t._receiver.write(e),
        t._receiver.end(),
        (this[Q] = void 0),
        clearTimeout(t._closeTimer),
        t._receiver._writableState.finished ||
        t._receiver._writableState.errorEmitted
          ? t.emitClose()
          : (t._receiver.on("error", hu), t._receiver.on("finish", hu));
    }
    function mr(t) {
      this[Q]._receiver.write(t) || this.pause();
    }
    function wu() {
      let t = this[Q];
      (t._readyState = j.CLOSING), t._receiver.end(), this.end();
    }
    function Su() {
      let t = this[Q];
      this.removeListener("error", Su),
        this.on("error", mu),
        t && ((t._readyState = j.CLOSING), this.destroy());
    }
  });
  var xu = g((ST, Eu) => {
    "use strict";
    var { tokenChars: Wy } = Jt();
    function Vy(t) {
      let e = new Set(),
        n = -1,
        r = -1,
        i = 0;
      for (i; i < t.length; i++) {
        let s = t.charCodeAt(i);
        if (r === -1 && Wy[s] === 1) n === -1 && (n = i);
        else if (i !== 0 && (s === 32 || s === 9))
          r === -1 && n !== -1 && (r = i);
        else if (s === 44) {
          if (n === -1)
            throw new SyntaxError(`Unexpected character at index ${i}`);
          r === -1 && (r = i);
          let u = t.slice(n, r);
          if (e.has(u))
            throw new SyntaxError(`The "${u}" subprotocol is duplicated`);
          e.add(u), (n = r = -1);
        } else throw new SyntaxError(`Unexpected character at index ${i}`);
      }
      if (n === -1 || r !== -1)
        throw new SyntaxError("Unexpected end of input");
      let o = t.slice(n, i);
      if (e.has(o))
        throw new SyntaxError(`The "${o}" subprotocol is duplicated`);
      return e.add(o), e;
    }
    Eu.exports = { parse: Vy };
  });
  var Ru = g((ET, Pu) => {
    "use strict";
    var $y = I("events"),
      yr = I("http"),
      { Duplex: TT } = I("stream"),
      { createHash: Hy } = I("crypto"),
      Au = $i(),
      st = zt(),
      Ky = xu(),
      Yy = Ji(),
      { GUID: zy, kWebSocket: Jy } = Je(),
      Xy = /^[+/0-9A-Za-z]{22}==$/,
      Cu = 0,
      Iu = 1,
      Nu = 2,
      Xi = class extends $y {
        constructor(e, n) {
          if (
            (super(),
            (e = {
              allowSynchronousEvents: !0,
              autoPong: !0,
              maxPayload: 100 * 1024 * 1024,
              skipUTF8Validation: !1,
              perMessageDeflate: !1,
              handleProtocols: null,
              clientTracking: !0,
              verifyClient: null,
              noServer: !1,
              backlog: null,
              server: null,
              host: null,
              path: null,
              port: null,
              WebSocket: Yy,
              ...e,
            }),
            (e.port == null && !e.server && !e.noServer) ||
              (e.port != null && (e.server || e.noServer)) ||
              (e.server && e.noServer))
          )
            throw new TypeError(
              'One and only one of the "port", "server", or "noServer" options must be specified',
            );
          if (
            (e.port != null
              ? ((this._server = yr.createServer((r, i) => {
                  let o = yr.STATUS_CODES[426];
                  i.writeHead(426, {
                    "Content-Length": o.length,
                    "Content-Type": "text/plain",
                  }),
                    i.end(o);
                })),
                this._server.listen(e.port, e.host, e.backlog, n))
              : e.server && (this._server = e.server),
            this._server)
          ) {
            let r = this.emit.bind(this, "connection");
            this._removeListeners = Qy(this._server, {
              listening: this.emit.bind(this, "listening"),
              error: this.emit.bind(this, "error"),
              upgrade: (i, o, s) => {
                this.handleUpgrade(i, o, s, r);
              },
            });
          }
          e.perMessageDeflate === !0 && (e.perMessageDeflate = {}),
            e.clientTracking &&
              ((this.clients = new Set()), (this._shouldEmitClose = !1)),
            (this.options = e),
            (this._state = Cu);
        }
        address() {
          if (this.options.noServer)
            throw new Error('The server is operating in "noServer" mode');
          return this._server ? this._server.address() : null;
        }
        close(e) {
          if (this._state === Nu) {
            e &&
              this.once("close", () => {
                e(new Error("The server is not running"));
              }),
              process.nextTick(en, this);
            return;
          }
          if ((e && this.once("close", e), this._state !== Iu))
            if (
              ((this._state = Iu), this.options.noServer || this.options.server)
            )
              this._server &&
                (this._removeListeners(),
                (this._removeListeners = this._server = null)),
                this.clients
                  ? this.clients.size
                    ? (this._shouldEmitClose = !0)
                    : process.nextTick(en, this)
                  : process.nextTick(en, this);
            else {
              let n = this._server;
              this._removeListeners(),
                (this._removeListeners = this._server = null),
                n.close(() => {
                  en(this);
                });
            }
        }
        shouldHandle(e) {
          if (this.options.path) {
            let n = e.url.indexOf("?");
            if ((n !== -1 ? e.url.slice(0, n) : e.url) !== this.options.path)
              return !1;
          }
          return !0;
        }
        handleUpgrade(e, n, r, i) {
          n.on("error", Ou);
          let o = e.headers["sec-websocket-key"],
            s = e.headers.upgrade,
            u = +e.headers["sec-websocket-version"];
          if (e.method !== "GET") {
            at(this, e, n, 405, "Invalid HTTP method");
            return;
          }
          if (s === void 0 || s.toLowerCase() !== "websocket") {
            at(this, e, n, 400, "Invalid Upgrade header");
            return;
          }
          if (o === void 0 || !Xy.test(o)) {
            at(this, e, n, 400, "Missing or invalid Sec-WebSocket-Key header");
            return;
          }
          if (u !== 8 && u !== 13) {
            at(
              this,
              e,
              n,
              400,
              "Missing or invalid Sec-WebSocket-Version header",
            );
            return;
          }
          if (!this.shouldHandle(e)) {
            tn(n, 400);
            return;
          }
          let c = e.headers["sec-websocket-protocol"],
            a = new Set();
          if (c !== void 0)
            try {
              a = Ky.parse(c);
            } catch {
              at(this, e, n, 400, "Invalid Sec-WebSocket-Protocol header");
              return;
            }
          let l = e.headers["sec-websocket-extensions"],
            p = {};
          if (this.options.perMessageDeflate && l !== void 0) {
            let m = new st(
              this.options.perMessageDeflate,
              !0,
              this.options.maxPayload,
            );
            try {
              let b = Au.parse(l);
              b[st.extensionName] &&
                (m.accept(b[st.extensionName]), (p[st.extensionName] = m));
            } catch {
              at(
                this,
                e,
                n,
                400,
                "Invalid or unacceptable Sec-WebSocket-Extensions header",
              );
              return;
            }
          }
          if (this.options.verifyClient) {
            let m = {
              origin:
                e.headers[`${u === 8 ? "sec-websocket-origin" : "origin"}`],
              secure: !!(e.socket.authorized || e.socket.encrypted),
              req: e,
            };
            if (this.options.verifyClient.length === 2) {
              this.options.verifyClient(m, (b, T, w, R) => {
                if (!b) return tn(n, T || 401, w, R);
                this.completeUpgrade(p, o, a, e, n, r, i);
              });
              return;
            }
            if (!this.options.verifyClient(m)) return tn(n, 401);
          }
          this.completeUpgrade(p, o, a, e, n, r, i);
        }
        completeUpgrade(e, n, r, i, o, s, u) {
          if (!o.readable || !o.writable) return o.destroy();
          if (o[Jy])
            throw new Error(
              "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration",
            );
          if (this._state > Cu) return tn(o, 503);
          let a = [
              "HTTP/1.1 101 Switching Protocols",
              "Upgrade: websocket",
              "Connection: Upgrade",
              `Sec-WebSocket-Accept: ${Hy("sha1")
                .update(n + zy)
                .digest("base64")}`,
            ],
            l = new this.options.WebSocket(null, void 0, this.options);
          if (r.size) {
            let p = this.options.handleProtocols
              ? this.options.handleProtocols(r, i)
              : r.values().next().value;
            p && (a.push(`Sec-WebSocket-Protocol: ${p}`), (l._protocol = p));
          }
          if (e[st.extensionName]) {
            let p = e[st.extensionName].params,
              m = Au.format({ [st.extensionName]: [p] });
            a.push(`Sec-WebSocket-Extensions: ${m}`), (l._extensions = e);
          }
          this.emit("headers", a, i),
            o.write(
              a.concat(`\r
`).join(`\r
`),
            ),
            o.removeListener("error", Ou),
            l.setSocket(o, s, {
              allowSynchronousEvents: this.options.allowSynchronousEvents,
              maxPayload: this.options.maxPayload,
              skipUTF8Validation: this.options.skipUTF8Validation,
            }),
            this.clients &&
              (this.clients.add(l),
              l.on("close", () => {
                this.clients.delete(l),
                  this._shouldEmitClose &&
                    !this.clients.size &&
                    process.nextTick(en, this);
              })),
            u(l, i);
        }
      };
    Pu.exports = Xi;
    function Qy(t, e) {
      for (let n of Object.keys(e)) t.on(n, e[n]);
      return function () {
        for (let r of Object.keys(e)) t.removeListener(r, e[r]);
      };
    }
    function en(t) {
      (t._state = Nu), t.emit("close");
    }
    function Ou() {
      this.destroy();
    }
    function tn(t, e, n, r) {
      (n = n || yr.STATUS_CODES[e]),
        (r = {
          Connection: "close",
          "Content-Type": "text/html",
          "Content-Length": Buffer.byteLength(n),
          ...r,
        }),
        t.once("finish", t.destroy),
        t.end(
          `HTTP/1.1 ${e} ${yr.STATUS_CODES[e]}\r
` +
            Object.keys(r).map((i) => `${i}: ${r[i]}`).join(`\r
`) +
            `\r
\r
` +
            n,
        );
    }
    function at(t, e, n, r, i) {
      if (t.listenerCount("wsClientError")) {
        let o = new Error(i);
        Error.captureStackTrace(o, at), t.emit("wsClientError", o, n, e);
      } else tn(n, r, i);
    }
  });
  var Rc = g((XT, Pc) => {
    Pc.exports = Nc;
    Nc.sync = Z_;
    var Ic = I("fs");
    function Q_(t, e) {
      var n = e.pathExt !== void 0 ? e.pathExt : process.env.PATHEXT;
      if (!n || ((n = n.split(";")), n.indexOf("") !== -1)) return !0;
      for (var r = 0; r < n.length; r++) {
        var i = n[r].toLowerCase();
        if (i && t.substr(-i.length).toLowerCase() === i) return !0;
      }
      return !1;
    }
    function Oc(t, e, n) {
      return !t.isSymbolicLink() && !t.isFile() ? !1 : Q_(e, n);
    }
    function Nc(t, e, n) {
      Ic.stat(t, function (r, i) {
        n(r, r ? !1 : Oc(i, t, e));
      });
    }
    function Z_(t, e) {
      return Oc(Ic.statSync(t), t, e);
    }
  });
  var Lc = g((QT, Bc) => {
    Bc.exports = Dc;
    Dc.sync = ev;
    var Mc = I("fs");
    function Dc(t, e, n) {
      Mc.stat(t, function (r, i) {
        n(r, r ? !1 : kc(i, e));
      });
    }
    function ev(t, e) {
      return kc(Mc.statSync(t), e);
    }
    function kc(t, e) {
      return t.isFile() && tv(t, e);
    }
    function tv(t, e) {
      var n = t.mode,
        r = t.uid,
        i = t.gid,
        o = e.uid !== void 0 ? e.uid : process.getuid && process.getuid(),
        s = e.gid !== void 0 ? e.gid : process.getgid && process.getgid(),
        u = parseInt("100", 8),
        c = parseInt("010", 8),
        a = parseInt("001", 8),
        l = u | c,
        p =
          n & a ||
          (n & c && i === s) ||
          (n & u && r === o) ||
          (n & l && o === 0);
      return p;
    }
  });
  var Fc = g((eE, jc) => {
    var ZT = I("fs"),
      Cr;
    process.platform === "win32" || global.TESTING_WINDOWS
      ? (Cr = Rc())
      : (Cr = Lc());
    jc.exports = uo;
    uo.sync = nv;
    function uo(t, e, n) {
      if ((typeof e == "function" && ((n = e), (e = {})), !n)) {
        if (typeof Promise != "function")
          throw new TypeError("callback not provided");
        return new Promise(function (r, i) {
          uo(t, e || {}, function (o, s) {
            o ? i(o) : r(s);
          });
        });
      }
      Cr(t, e || {}, function (r, i) {
        r &&
          (r.code === "EACCES" || (e && e.ignoreErrors)) &&
          ((r = null), (i = !1)),
          n(r, i);
      });
    }
    function nv(t, e) {
      try {
        return Cr.sync(t, e || {});
      } catch (n) {
        if ((e && e.ignoreErrors) || n.code === "EACCES") return !1;
        throw n;
      }
    }
  });
  var Hc = g((tE, $c) => {
    var Rt =
        process.platform === "win32" ||
        process.env.OSTYPE === "cygwin" ||
        process.env.OSTYPE === "msys",
      Uc = I("path"),
      rv = Rt ? ";" : ":",
      qc = Fc(),
      Gc = (t) =>
        Object.assign(new Error(`not found: ${t}`), { code: "ENOENT" }),
      Wc = (t, e) => {
        let n = e.colon || rv,
          r =
            t.match(/\//) || (Rt && t.match(/\\/))
              ? [""]
              : [
                  ...(Rt ? [process.cwd()] : []),
                  ...(e.path || process.env.PATH || "").split(n),
                ],
          i = Rt
            ? e.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM"
            : "",
          o = Rt ? i.split(n) : [""];
        return (
          Rt && t.indexOf(".") !== -1 && o[0] !== "" && o.unshift(""),
          { pathEnv: r, pathExt: o, pathExtExe: i }
        );
      },
      Vc = (t, e, n) => {
        typeof e == "function" && ((n = e), (e = {})), e || (e = {});
        let { pathEnv: r, pathExt: i, pathExtExe: o } = Wc(t, e),
          s = [],
          u = (a) =>
            new Promise((l, p) => {
              if (a === r.length) return e.all && s.length ? l(s) : p(Gc(t));
              let m = r[a],
                b = /^".*"$/.test(m) ? m.slice(1, -1) : m,
                T = Uc.join(b, t),
                w = !b && /^\.[\\\/]/.test(t) ? t.slice(0, 2) + T : T;
              l(c(w, a, 0));
            }),
          c = (a, l, p) =>
            new Promise((m, b) => {
              if (p === i.length) return m(u(l + 1));
              let T = i[p];
              qc(a + T, { pathExt: o }, (w, R) => {
                if (!w && R)
                  if (e.all) s.push(a + T);
                  else return m(a + T);
                return m(c(a, l, p + 1));
              });
            });
        return n ? u(0).then((a) => n(null, a), n) : u(0);
      },
      iv = (t, e) => {
        e = e || {};
        let { pathEnv: n, pathExt: r, pathExtExe: i } = Wc(t, e),
          o = [];
        for (let s = 0; s < n.length; s++) {
          let u = n[s],
            c = /^".*"$/.test(u) ? u.slice(1, -1) : u,
            a = Uc.join(c, t),
            l = !c && /^\.[\\\/]/.test(t) ? t.slice(0, 2) + a : a;
          for (let p = 0; p < r.length; p++) {
            let m = l + r[p];
            try {
              if (qc.sync(m, { pathExt: i }))
                if (e.all) o.push(m);
                else return m;
            } catch {}
          }
        }
        if (e.all && o.length) return o;
        if (e.nothrow) return null;
        throw Gc(t);
      };
    $c.exports = Vc;
    Vc.sync = iv;
  });
  var lo = g((nE, co) => {
    "use strict";
    var Kc = (t = {}) => {
      let e = t.env || process.env;
      return (t.platform || process.platform) !== "win32"
        ? "PATH"
        : Object.keys(e)
            .reverse()
            .find((r) => r.toUpperCase() === "PATH") || "Path";
    };
    co.exports = Kc;
    co.exports.default = Kc;
  });
  var Xc = g((rE, Jc) => {
    "use strict";
    var Yc = I("path"),
      ov = Hc(),
      sv = lo();
    function zc(t, e) {
      let n = t.options.env || process.env,
        r = process.cwd(),
        i = t.options.cwd != null,
        o = i && process.chdir !== void 0 && !process.chdir.disabled;
      if (o)
        try {
          process.chdir(t.options.cwd);
        } catch {}
      let s;
      try {
        s = ov.sync(t.command, {
          path: n[sv({ env: n })],
          pathExt: e ? Yc.delimiter : void 0,
        });
      } catch {
      } finally {
        o && process.chdir(r);
      }
      return s && (s = Yc.resolve(i ? t.options.cwd : "", s)), s;
    }
    function av(t) {
      return zc(t) || zc(t, !0);
    }
    Jc.exports = av;
  });
  var Qc = g((iE, po) => {
    "use strict";
    var fo = /([()\][%!^"`<>&|;, *?])/g;
    function uv(t) {
      return (t = t.replace(fo, "^$1")), t;
    }
    function cv(t, e) {
      return (
        (t = `${t}`),
        (t = t.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"')),
        (t = t.replace(/(?=(\\+?)?)\1$/, "$1$1")),
        (t = `"${t}"`),
        (t = t.replace(fo, "^$1")),
        e && (t = t.replace(fo, "^$1")),
        t
      );
    }
    po.exports.command = uv;
    po.exports.argument = cv;
  });
  var el = g((oE, Zc) => {
    "use strict";
    Zc.exports = /^#!(.*)/;
  });
  var nl = g((sE, tl) => {
    "use strict";
    var lv = el();
    tl.exports = (t = "") => {
      let e = t.match(lv);
      if (!e) return null;
      let [n, r] = e[0].replace(/#! ?/, "").split(" "),
        i = n.split("/").pop();
      return i === "env" ? r : r ? `${i} ${r}` : i;
    };
  });
  var il = g((aE, rl) => {
    "use strict";
    var ho = I("fs"),
      fv = nl();
    function dv(t) {
      let n = Buffer.alloc(150),
        r;
      try {
        (r = ho.openSync(t, "r")),
          ho.readSync(r, n, 0, 150, 0),
          ho.closeSync(r);
      } catch {}
      return fv(n.toString());
    }
    rl.exports = dv;
  });
  var ul = g((uE, al) => {
    "use strict";
    var pv = I("path"),
      ol = Xc(),
      sl = Qc(),
      hv = il(),
      gv = process.platform === "win32",
      mv = /\.(?:com|exe)$/i,
      yv = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
    function _v(t) {
      t.file = ol(t);
      let e = t.file && hv(t.file);
      return e ? (t.args.unshift(t.file), (t.command = e), ol(t)) : t.file;
    }
    function vv(t) {
      if (!gv) return t;
      let e = _v(t),
        n = !mv.test(e);
      if (t.options.forceShell || n) {
        let r = yv.test(e);
        (t.command = pv.normalize(t.command)),
          (t.command = sl.command(t.command)),
          (t.args = t.args.map((o) => sl.argument(o, r)));
        let i = [t.command].concat(t.args).join(" ");
        (t.args = ["/d", "/s", "/c", `"${i}"`]),
          (t.command = process.env.comspec || "cmd.exe"),
          (t.options.windowsVerbatimArguments = !0);
      }
      return t;
    }
    function bv(t, e, n) {
      e && !Array.isArray(e) && ((n = e), (e = null)),
        (e = e ? e.slice(0) : []),
        (n = Object.assign({}, n));
      let r = {
        command: t,
        args: e,
        options: n,
        file: void 0,
        original: { command: t, args: e },
      };
      return n.shell ? r : vv(r);
    }
    al.exports = bv;
  });
  var fl = g((cE, ll) => {
    "use strict";
    var go = process.platform === "win32";
    function mo(t, e) {
      return Object.assign(new Error(`${e} ${t.command} ENOENT`), {
        code: "ENOENT",
        errno: "ENOENT",
        syscall: `${e} ${t.command}`,
        path: t.command,
        spawnargs: t.args,
      });
    }
    function wv(t, e) {
      if (!go) return;
      let n = t.emit;
      t.emit = function (r, i) {
        if (r === "exit") {
          let o = cl(i, e);
          if (o) return n.call(t, "error", o);
        }
        return n.apply(t, arguments);
      };
    }
    function cl(t, e) {
      return go && t === 1 && !e.file ? mo(e.original, "spawn") : null;
    }
    function Sv(t, e) {
      return go && t === 1 && !e.file ? mo(e.original, "spawnSync") : null;
    }
    ll.exports = {
      hookChildProcess: wv,
      verifyENOENT: cl,
      verifyENOENTSync: Sv,
      notFoundError: mo,
    };
  });
  var hl = g((lE, Mt) => {
    "use strict";
    var dl = I("child_process"),
      yo = ul(),
      _o = fl();
    function pl(t, e, n) {
      let r = yo(t, e, n),
        i = dl.spawn(r.command, r.args, r.options);
      return _o.hookChildProcess(i, r), i;
    }
    function Tv(t, e, n) {
      let r = yo(t, e, n),
        i = dl.spawnSync(r.command, r.args, r.options);
      return (i.error = i.error || _o.verifyENOENTSync(i.status, r)), i;
    }
    Mt.exports = pl;
    Mt.exports.spawn = pl;
    Mt.exports.sync = Tv;
    Mt.exports._parse = yo;
    Mt.exports._enoent = _o;
  });
  var ml = g((fE, gl) => {
    "use strict";
    gl.exports = (t) => {
      let e =
          typeof t == "string"
            ? `
`
            : 10,
        n = typeof t == "string" ? "\r" : 13;
      return (
        t[t.length - 1] === e && (t = t.slice(0, t.length - 1)),
        t[t.length - 1] === n && (t = t.slice(0, t.length - 1)),
        t
      );
    };
  });
  var vl = g((dE, fn) => {
    "use strict";
    var ln = I("path"),
      yl = lo(),
      _l = (t) => {
        t = {
          cwd: process.cwd(),
          path: process.env[yl()],
          execPath: process.execPath,
          ...t,
        };
        let e,
          n = ln.resolve(t.cwd),
          r = [];
        for (; e !== n; )
          r.push(ln.join(n, "node_modules/.bin")),
            (e = n),
            (n = ln.resolve(n, ".."));
        let i = ln.resolve(t.cwd, t.execPath, "..");
        return r.push(i), r.concat(t.path).join(ln.delimiter);
      };
    fn.exports = _l;
    fn.exports.default = _l;
    fn.exports.env = (t) => {
      t = { env: process.env, ...t };
      let e = { ...t.env },
        n = yl({ env: e });
      return (t.path = e[n]), (e[n] = fn.exports(t)), e;
    };
  });
  var wl = g((pE, vo) => {
    "use strict";
    var bl = (t, e) => {
      for (let n of Reflect.ownKeys(e))
        Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(e, n));
      return t;
    };
    vo.exports = bl;
    vo.exports.default = bl;
  });
  var Tl = g((hE, Or) => {
    "use strict";
    var Ev = wl(),
      Ir = new WeakMap(),
      Sl = (t, e = {}) => {
        if (typeof t != "function") throw new TypeError("Expected a function");
        let n,
          r = 0,
          i = t.displayName || t.name || "<anonymous>",
          o = function (...s) {
            if ((Ir.set(o, ++r), r === 1)) (n = t.apply(this, s)), (t = null);
            else if (e.throw === !0)
              throw new Error(`Function \`${i}\` can only be called once`);
            return n;
          };
        return Ev(o, t), Ir.set(o, r), o;
      };
    Or.exports = Sl;
    Or.exports.default = Sl;
    Or.exports.callCount = (t) => {
      if (!Ir.has(t))
        throw new Error(
          `The given function \`${t.name}\` is not wrapped by the \`onetime\` package`,
        );
      return Ir.get(t);
    };
  });
  var El = g((Nr) => {
    "use strict";
    Object.defineProperty(Nr, "__esModule", { value: !0 });
    Nr.SIGNALS = void 0;
    var xv = [
      {
        name: "SIGHUP",
        number: 1,
        action: "terminate",
        description: "Terminal closed",
        standard: "posix",
      },
      {
        name: "SIGINT",
        number: 2,
        action: "terminate",
        description: "User interruption with CTRL-C",
        standard: "ansi",
      },
      {
        name: "SIGQUIT",
        number: 3,
        action: "core",
        description: "User interruption with CTRL-\\",
        standard: "posix",
      },
      {
        name: "SIGILL",
        number: 4,
        action: "core",
        description: "Invalid machine instruction",
        standard: "ansi",
      },
      {
        name: "SIGTRAP",
        number: 5,
        action: "core",
        description: "Debugger breakpoint",
        standard: "posix",
      },
      {
        name: "SIGABRT",
        number: 6,
        action: "core",
        description: "Aborted",
        standard: "ansi",
      },
      {
        name: "SIGIOT",
        number: 6,
        action: "core",
        description: "Aborted",
        standard: "bsd",
      },
      {
        name: "SIGBUS",
        number: 7,
        action: "core",
        description:
          "Bus error due to misaligned, non-existing address or paging error",
        standard: "bsd",
      },
      {
        name: "SIGEMT",
        number: 7,
        action: "terminate",
        description: "Command should be emulated but is not implemented",
        standard: "other",
      },
      {
        name: "SIGFPE",
        number: 8,
        action: "core",
        description: "Floating point arithmetic error",
        standard: "ansi",
      },
      {
        name: "SIGKILL",
        number: 9,
        action: "terminate",
        description: "Forced termination",
        standard: "posix",
        forced: !0,
      },
      {
        name: "SIGUSR1",
        number: 10,
        action: "terminate",
        description: "Application-specific signal",
        standard: "posix",
      },
      {
        name: "SIGSEGV",
        number: 11,
        action: "core",
        description: "Segmentation fault",
        standard: "ansi",
      },
      {
        name: "SIGUSR2",
        number: 12,
        action: "terminate",
        description: "Application-specific signal",
        standard: "posix",
      },
      {
        name: "SIGPIPE",
        number: 13,
        action: "terminate",
        description: "Broken pipe or socket",
        standard: "posix",
      },
      {
        name: "SIGALRM",
        number: 14,
        action: "terminate",
        description: "Timeout or timer",
        standard: "posix",
      },
      {
        name: "SIGTERM",
        number: 15,
        action: "terminate",
        description: "Termination",
        standard: "ansi",
      },
      {
        name: "SIGSTKFLT",
        number: 16,
        action: "terminate",
        description: "Stack is empty or overflowed",
        standard: "other",
      },
      {
        name: "SIGCHLD",
        number: 17,
        action: "ignore",
        description: "Child process terminated, paused or unpaused",
        standard: "posix",
      },
      {
        name: "SIGCLD",
        number: 17,
        action: "ignore",
        description: "Child process terminated, paused or unpaused",
        standard: "other",
      },
      {
        name: "SIGCONT",
        number: 18,
        action: "unpause",
        description: "Unpaused",
        standard: "posix",
        forced: !0,
      },
      {
        name: "SIGSTOP",
        number: 19,
        action: "pause",
        description: "Paused",
        standard: "posix",
        forced: !0,
      },
      {
        name: "SIGTSTP",
        number: 20,
        action: "pause",
        description: 'Paused using CTRL-Z or "suspend"',
        standard: "posix",
      },
      {
        name: "SIGTTIN",
        number: 21,
        action: "pause",
        description: "Background process cannot read terminal input",
        standard: "posix",
      },
      {
        name: "SIGBREAK",
        number: 21,
        action: "terminate",
        description: "User interruption with CTRL-BREAK",
        standard: "other",
      },
      {
        name: "SIGTTOU",
        number: 22,
        action: "pause",
        description: "Background process cannot write to terminal output",
        standard: "posix",
      },
      {
        name: "SIGURG",
        number: 23,
        action: "ignore",
        description: "Socket received out-of-band data",
        standard: "bsd",
      },
      {
        name: "SIGXCPU",
        number: 24,
        action: "core",
        description: "Process timed out",
        standard: "bsd",
      },
      {
        name: "SIGXFSZ",
        number: 25,
        action: "core",
        description: "File too big",
        standard: "bsd",
      },
      {
        name: "SIGVTALRM",
        number: 26,
        action: "terminate",
        description: "Timeout or timer",
        standard: "bsd",
      },
      {
        name: "SIGPROF",
        number: 27,
        action: "terminate",
        description: "Timeout or timer",
        standard: "bsd",
      },
      {
        name: "SIGWINCH",
        number: 28,
        action: "ignore",
        description: "Terminal window size changed",
        standard: "bsd",
      },
      {
        name: "SIGIO",
        number: 29,
        action: "terminate",
        description: "I/O is available",
        standard: "other",
      },
      {
        name: "SIGPOLL",
        number: 29,
        action: "terminate",
        description: "Watched event",
        standard: "other",
      },
      {
        name: "SIGINFO",
        number: 29,
        action: "ignore",
        description: "Request for process information",
        standard: "other",
      },
      {
        name: "SIGPWR",
        number: 30,
        action: "terminate",
        description: "Device running out of power",
        standard: "systemv",
      },
      {
        name: "SIGSYS",
        number: 31,
        action: "core",
        description: "Invalid system call",
        standard: "other",
      },
      {
        name: "SIGUNUSED",
        number: 31,
        action: "terminate",
        description: "Invalid system call",
        standard: "other",
      },
    ];
    Nr.SIGNALS = xv;
  });
  var bo = g((Dt) => {
    "use strict";
    Object.defineProperty(Dt, "__esModule", { value: !0 });
    Dt.SIGRTMAX = Dt.getRealtimeSignals = void 0;
    var Av = function () {
      let t = Al - xl + 1;
      return Array.from({ length: t }, Cv);
    };
    Dt.getRealtimeSignals = Av;
    var Cv = function (t, e) {
        return {
          name: `SIGRT${e + 1}`,
          number: xl + e,
          action: "terminate",
          description: "Application-specific signal (realtime)",
          standard: "posix",
        };
      },
      xl = 34,
      Al = 64;
    Dt.SIGRTMAX = Al;
  });
  var Cl = g((Pr) => {
    "use strict";
    Object.defineProperty(Pr, "__esModule", { value: !0 });
    Pr.getSignals = void 0;
    var Iv = I("os"),
      Ov = El(),
      Nv = bo(),
      Pv = function () {
        let t = (0, Nv.getRealtimeSignals)();
        return [...Ov.SIGNALS, ...t].map(Rv);
      };
    Pr.getSignals = Pv;
    var Rv = function ({
      name: t,
      number: e,
      description: n,
      action: r,
      forced: i = !1,
      standard: o,
    }) {
      let {
          signals: { [t]: s },
        } = Iv.constants,
        u = s !== void 0;
      return {
        name: t,
        number: u ? s : e,
        description: n,
        supported: u,
        action: r,
        forced: i,
        standard: o,
      };
    };
  });
  var Ol = g((kt) => {
    "use strict";
    Object.defineProperty(kt, "__esModule", { value: !0 });
    kt.signalsByNumber = kt.signalsByName = void 0;
    var Mv = I("os"),
      Il = Cl(),
      Dv = bo(),
      kv = function () {
        return (0, Il.getSignals)().reduce(Bv, {});
      },
      Bv = function (
        t,
        {
          name: e,
          number: n,
          description: r,
          supported: i,
          action: o,
          forced: s,
          standard: u,
        },
      ) {
        return {
          ...t,
          [e]: {
            name: e,
            number: n,
            description: r,
            supported: i,
            action: o,
            forced: s,
            standard: u,
          },
        };
      },
      Lv = kv();
    kt.signalsByName = Lv;
    var jv = function () {
        let t = (0, Il.getSignals)(),
          e = Dv.SIGRTMAX + 1,
          n = Array.from({ length: e }, (r, i) => Fv(i, t));
        return Object.assign({}, ...n);
      },
      Fv = function (t, e) {
        let n = Uv(t, e);
        if (n === void 0) return {};
        let {
          name: r,
          description: i,
          supported: o,
          action: s,
          forced: u,
          standard: c,
        } = n;
        return {
          [t]: {
            name: r,
            number: t,
            description: i,
            supported: o,
            action: s,
            forced: u,
            standard: c,
          },
        };
      },
      Uv = function (t, e) {
        let n = e.find(({ name: r }) => Mv.constants.signals[r] === t);
        return n !== void 0 ? n : e.find((r) => r.number === t);
      },
      qv = jv();
    kt.signalsByNumber = qv;
  });
  var Pl = g((vE, Nl) => {
    "use strict";
    var { signalsByName: Gv } = Ol(),
      Wv = ({
        timedOut: t,
        timeout: e,
        errorCode: n,
        signal: r,
        signalDescription: i,
        exitCode: o,
        isCanceled: s,
      }) =>
        t
          ? `timed out after ${e} milliseconds`
          : s
            ? "was canceled"
            : n !== void 0
              ? `failed with ${n}`
              : r !== void 0
                ? `was killed with ${r} (${i})`
                : o !== void 0
                  ? `failed with exit code ${o}`
                  : "failed",
      Vv = ({
        stdout: t,
        stderr: e,
        all: n,
        error: r,
        signal: i,
        exitCode: o,
        command: s,
        escapedCommand: u,
        timedOut: c,
        isCanceled: a,
        killed: l,
        parsed: {
          options: { timeout: p },
        },
      }) => {
        (o = o === null ? void 0 : o), (i = i === null ? void 0 : i);
        let m = i === void 0 ? void 0 : Gv[i].description,
          b = r && r.code,
          w = `Command ${Wv({ timedOut: c, timeout: p, errorCode: b, signal: i, signalDescription: m, exitCode: o, isCanceled: a })}: ${s}`,
          R = Object.prototype.toString.call(r) === "[object Error]",
          K = R
            ? `${w}
${r.message}`
            : w,
          ue = [K, e, t].filter(Boolean).join(`
`);
        return (
          R
            ? ((r.originalMessage = r.message), (r.message = ue))
            : (r = new Error(ue)),
          (r.shortMessage = K),
          (r.command = s),
          (r.escapedCommand = u),
          (r.exitCode = o),
          (r.signal = i),
          (r.signalDescription = m),
          (r.stdout = t),
          (r.stderr = e),
          n !== void 0 && (r.all = n),
          "bufferedData" in r && delete r.bufferedData,
          (r.failed = !0),
          (r.timedOut = !!c),
          (r.isCanceled = a),
          (r.killed = l && !c),
          r
        );
      };
    Nl.exports = Vv;
  });
  var Ml = g((bE, wo) => {
    "use strict";
    var Rr = ["stdin", "stdout", "stderr"],
      $v = (t) => Rr.some((e) => t[e] !== void 0),
      Rl = (t) => {
        if (!t) return;
        let { stdio: e } = t;
        if (e === void 0) return Rr.map((r) => t[r]);
        if ($v(t))
          throw new Error(
            `It's not possible to provide \`stdio\` in combination with one of ${Rr.map((r) => `\`${r}\``).join(", ")}`,
          );
        if (typeof e == "string") return e;
        if (!Array.isArray(e))
          throw new TypeError(
            `Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof e}\``,
          );
        let n = Math.max(e.length, Rr.length);
        return Array.from({ length: n }, (r, i) => e[i]);
      };
    wo.exports = Rl;
    wo.exports.node = (t) => {
      let e = Rl(t);
      return e === "ipc"
        ? "ipc"
        : e === void 0 || typeof e == "string"
          ? [e, e, e, "ipc"]
          : e.includes("ipc")
            ? e
            : [...e, "ipc"];
    };
  });
  var Dl = g((wE, Mr) => {
    Mr.exports = ["SIGABRT", "SIGALRM", "SIGHUP", "SIGINT", "SIGTERM"];
    process.platform !== "win32" &&
      Mr.exports.push(
        "SIGVTALRM",
        "SIGXCPU",
        "SIGXFSZ",
        "SIGUSR2",
        "SIGTRAP",
        "SIGSYS",
        "SIGQUIT",
        "SIGIOT",
      );
    process.platform === "linux" &&
      Mr.exports.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT", "SIGUNUSED");
  });
  var Ll = g((SE, hn) => {
    var Hv = I("assert"),
      dn = Dl(),
      Kv = /^win/i.test(process.platform),
      Dr = I("events");
    typeof Dr != "function" && (Dr = Dr.EventEmitter);
    var H;
    process.__signal_exit_emitter__
      ? (H = process.__signal_exit_emitter__)
      : ((H = process.__signal_exit_emitter__ = new Dr()),
        (H.count = 0),
        (H.emitted = {}));
    H.infinite || (H.setMaxListeners(1 / 0), (H.infinite = !0));
    hn.exports = function (t, e) {
      Hv.equal(
        typeof t,
        "function",
        "a callback must be provided for exit handler",
      ),
        pn === !1 && kl();
      var n = "exit";
      e && e.alwaysLast && (n = "afterexit");
      var r = function () {
        H.removeListener(n, t),
          H.listeners("exit").length === 0 &&
            H.listeners("afterexit").length === 0 &&
            To();
      };
      return H.on(n, t), r;
    };
    hn.exports.unload = To;
    function To() {
      pn &&
        ((pn = !1),
        dn.forEach(function (t) {
          try {
            process.removeListener(t, Eo[t]);
          } catch {}
        }),
        (process.emit = So),
        (process.reallyExit = Bl),
        (H.count -= 1));
    }
    function Bt(t, e, n) {
      H.emitted[t] || ((H.emitted[t] = !0), H.emit(t, e, n));
    }
    var Eo = {};
    dn.forEach(function (t) {
      Eo[t] = function () {
        var n = process.listeners(t);
        n.length === H.count &&
          (To(),
          Bt("exit", null, t),
          Bt("afterexit", null, t),
          Kv && t === "SIGHUP" && (t = "SIGINT"),
          process.kill(process.pid, t));
      };
    });
    hn.exports.signals = function () {
      return dn;
    };
    hn.exports.load = kl;
    var pn = !1;
    function kl() {
      pn ||
        ((pn = !0),
        (H.count += 1),
        (dn = dn.filter(function (t) {
          try {
            return process.on(t, Eo[t]), !0;
          } catch {
            return !1;
          }
        })),
        (process.emit = zv),
        (process.reallyExit = Yv));
    }
    var Bl = process.reallyExit;
    function Yv(t) {
      (process.exitCode = t || 0),
        Bt("exit", process.exitCode, null),
        Bt("afterexit", process.exitCode, null),
        Bl.call(process, process.exitCode);
    }
    var So = process.emit;
    function zv(t, e) {
      if (t === "exit") {
        e !== void 0 && (process.exitCode = e);
        var n = So.apply(this, arguments);
        return (
          Bt("exit", process.exitCode, null),
          Bt("afterexit", process.exitCode, null),
          n
        );
      } else return So.apply(this, arguments);
    }
  });
  var Fl = g((TE, jl) => {
    "use strict";
    var Jv = I("os"),
      Xv = Ll(),
      Qv = 1e3 * 5,
      Zv = (t, e = "SIGTERM", n = {}) => {
        let r = t(e);
        return eb(t, e, n, r), r;
      },
      eb = (t, e, n, r) => {
        if (!tb(e, n, r)) return;
        let i = rb(n),
          o = setTimeout(() => {
            t("SIGKILL");
          }, i);
        o.unref && o.unref();
      },
      tb = (t, { forceKillAfterTimeout: e }, n) => nb(t) && e !== !1 && n,
      nb = (t) =>
        t === Jv.constants.signals.SIGTERM ||
        (typeof t == "string" && t.toUpperCase() === "SIGTERM"),
      rb = ({ forceKillAfterTimeout: t = !0 }) => {
        if (t === !0) return Qv;
        if (!Number.isFinite(t) || t < 0)
          throw new TypeError(
            `Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${t}\` (${typeof t})`,
          );
        return t;
      },
      ib = (t, e) => {
        t.kill() && (e.isCanceled = !0);
      },
      ob = (t, e, n) => {
        t.kill(e),
          n(Object.assign(new Error("Timed out"), { timedOut: !0, signal: e }));
      },
      sb = (t, { timeout: e, killSignal: n = "SIGTERM" }, r) => {
        if (e === 0 || e === void 0) return r;
        let i,
          o = new Promise((u, c) => {
            i = setTimeout(() => {
              ob(t, n, c);
            }, e);
          }),
          s = r.finally(() => {
            clearTimeout(i);
          });
        return Promise.race([o, s]);
      },
      ab = ({ timeout: t }) => {
        if (t !== void 0 && (!Number.isFinite(t) || t < 0))
          throw new TypeError(
            `Expected the \`timeout\` option to be a non-negative integer, got \`${t}\` (${typeof t})`,
          );
      },
      ub = async (t, { cleanup: e, detached: n }, r) => {
        if (!e || n) return r;
        let i = Xv(() => {
          t.kill();
        });
        return r.finally(() => {
          i();
        });
      };
    jl.exports = {
      spawnedKill: Zv,
      spawnedCancel: ib,
      setupTimeout: sb,
      validateTimeout: ab,
      setExitHandler: ub,
    };
  });
  var ql = g((EE, Ul) => {
    "use strict";
    var qe = (t) =>
      t !== null && typeof t == "object" && typeof t.pipe == "function";
    qe.writable = (t) =>
      qe(t) &&
      t.writable !== !1 &&
      typeof t._write == "function" &&
      typeof t._writableState == "object";
    qe.readable = (t) =>
      qe(t) &&
      t.readable !== !1 &&
      typeof t._read == "function" &&
      typeof t._readableState == "object";
    qe.duplex = (t) => qe.writable(t) && qe.readable(t);
    qe.transform = (t) =>
      qe.duplex(t) &&
      typeof t._transform == "function" &&
      typeof t._transformState == "object";
    Ul.exports = qe;
  });
  var Wl = g((xE, Gl) => {
    "use strict";
    var { PassThrough: cb } = I("stream");
    Gl.exports = (t) => {
      t = { ...t };
      let { array: e } = t,
        { encoding: n } = t,
        r = n === "buffer",
        i = !1;
      e ? (i = !(n || r)) : (n = n || "utf8"), r && (n = null);
      let o = new cb({ objectMode: i });
      n && o.setEncoding(n);
      let s = 0,
        u = [];
      return (
        o.on("data", (c) => {
          u.push(c), i ? (s = u.length) : (s += c.length);
        }),
        (o.getBufferedValue = () =>
          e ? u : r ? Buffer.concat(u, s) : u.join("")),
        (o.getBufferedLength = () => s),
        o
      );
    };
  });
  var Vl = g((AE, gn) => {
    "use strict";
    var { constants: lb } = I("buffer"),
      fb = I("stream"),
      { promisify: db } = I("util"),
      pb = Wl(),
      hb = db(fb.pipeline),
      kr = class extends Error {
        constructor() {
          super("maxBuffer exceeded"), (this.name = "MaxBufferError");
        }
      };
    async function xo(t, e) {
      if (!t) throw new Error("Expected a stream");
      e = { maxBuffer: 1 / 0, ...e };
      let { maxBuffer: n } = e,
        r = pb(e);
      return (
        await new Promise((i, o) => {
          let s = (u) => {
            u &&
              r.getBufferedLength() <= lb.MAX_LENGTH &&
              (u.bufferedData = r.getBufferedValue()),
              o(u);
          };
          (async () => {
            try {
              await hb(t, r), i();
            } catch (u) {
              s(u);
            }
          })(),
            r.on("data", () => {
              r.getBufferedLength() > n && s(new kr());
            });
        }),
        r.getBufferedValue()
      );
    }
    gn.exports = xo;
    gn.exports.buffer = (t, e) => xo(t, { ...e, encoding: "buffer" });
    gn.exports.array = (t, e) => xo(t, { ...e, array: !0 });
    gn.exports.MaxBufferError = kr;
  });
  var Hl = g((CE, $l) => {
    "use strict";
    var { PassThrough: gb } = I("stream");
    $l.exports = function () {
      var t = [],
        e = new gb({ objectMode: !0 });
      return (
        e.setMaxListeners(0),
        (e.add = n),
        (e.isEmpty = r),
        e.on("unpipe", i),
        Array.prototype.slice.call(arguments).forEach(n),
        e
      );
      function n(o) {
        return Array.isArray(o)
          ? (o.forEach(n), this)
          : (t.push(o),
            o.once("end", i.bind(null, o)),
            o.once("error", e.emit.bind(e, "error")),
            o.pipe(e, { end: !1 }),
            this);
      }
      function r() {
        return t.length == 0;
      }
      function i(o) {
        (t = t.filter(function (s) {
          return s !== o;
        })),
          !t.length && e.readable && e.end();
      }
    };
  });
  var Jl = g((IE, zl) => {
    "use strict";
    var Yl = ql(),
      Kl = Vl(),
      mb = Hl(),
      yb = (t, e) => {
        e === void 0 ||
          t.stdin === void 0 ||
          (Yl(e) ? e.pipe(t.stdin) : t.stdin.end(e));
      },
      _b = (t, { all: e }) => {
        if (!e || (!t.stdout && !t.stderr)) return;
        let n = mb();
        return t.stdout && n.add(t.stdout), t.stderr && n.add(t.stderr), n;
      },
      Ao = async (t, e) => {
        if (t) {
          t.destroy();
          try {
            return await e;
          } catch (n) {
            return n.bufferedData;
          }
        }
      },
      Co = (t, { encoding: e, buffer: n, maxBuffer: r }) => {
        if (!(!t || !n))
          return e
            ? Kl(t, { encoding: e, maxBuffer: r })
            : Kl.buffer(t, { maxBuffer: r });
      },
      vb = async (
        { stdout: t, stderr: e, all: n },
        { encoding: r, buffer: i, maxBuffer: o },
        s,
      ) => {
        let u = Co(t, { encoding: r, buffer: i, maxBuffer: o }),
          c = Co(e, { encoding: r, buffer: i, maxBuffer: o }),
          a = Co(n, { encoding: r, buffer: i, maxBuffer: o * 2 });
        try {
          return await Promise.all([s, u, c, a]);
        } catch (l) {
          return Promise.all([
            { error: l, signal: l.signal, timedOut: l.timedOut },
            Ao(t, u),
            Ao(e, c),
            Ao(n, a),
          ]);
        }
      },
      bb = ({ input: t }) => {
        if (Yl(t))
          throw new TypeError(
            "The `input` option cannot be a stream in sync mode",
          );
      };
    zl.exports = {
      handleInput: yb,
      makeAllStream: _b,
      getSpawnedResult: vb,
      validateInputSync: bb,
    };
  });
  var Ql = g((OE, Xl) => {
    "use strict";
    var wb = (async () => {})().constructor.prototype,
      Sb = ["then", "catch", "finally"].map((t) => [
        t,
        Reflect.getOwnPropertyDescriptor(wb, t),
      ]),
      Tb = (t, e) => {
        for (let [n, r] of Sb) {
          let i =
            typeof e == "function"
              ? (...o) => Reflect.apply(r.value, e(), o)
              : r.value.bind(e);
          Reflect.defineProperty(t, n, { ...r, value: i });
        }
        return t;
      },
      Eb = (t) =>
        new Promise((e, n) => {
          t.on("exit", (r, i) => {
            e({ exitCode: r, signal: i });
          }),
            t.on("error", (r) => {
              n(r);
            }),
            t.stdin &&
              t.stdin.on("error", (r) => {
                n(r);
              });
        });
    Xl.exports = { mergePromise: Tb, getSpawnedPromise: Eb };
  });
  var tf = g((NE, ef) => {
    "use strict";
    var Zl = (t, e = []) => (Array.isArray(e) ? [t, ...e] : [t]),
      xb = /^[\w.-]+$/,
      Ab = /"/g,
      Cb = (t) =>
        typeof t != "string" || xb.test(t) ? t : `"${t.replace(Ab, '\\"')}"`,
      Ib = (t, e) => Zl(t, e).join(" "),
      Ob = (t, e) =>
        Zl(t, e)
          .map((n) => Cb(n))
          .join(" "),
      Nb = / +/g,
      Pb = (t) => {
        let e = [];
        for (let n of t.trim().split(Nb)) {
          let r = e[e.length - 1];
          r && r.endsWith("\\")
            ? (e[e.length - 1] = `${r.slice(0, -1)} ${n}`)
            : e.push(n);
        }
        return e;
      };
    ef.exports = { joinCommand: Ib, getEscapedCommand: Ob, parseCommand: Pb };
  });
  var cf = g((PE, Lt) => {
    "use strict";
    var Rb = I("path"),
      Io = I("child_process"),
      Mb = hl(),
      Db = ml(),
      kb = vl(),
      Bb = Tl(),
      Br = Pl(),
      rf = Ml(),
      {
        spawnedKill: Lb,
        spawnedCancel: jb,
        setupTimeout: Fb,
        validateTimeout: Ub,
        setExitHandler: qb,
      } = Fl(),
      {
        handleInput: Gb,
        getSpawnedResult: Wb,
        makeAllStream: Vb,
        validateInputSync: $b,
      } = Jl(),
      { mergePromise: nf, getSpawnedPromise: Hb } = Ql(),
      { joinCommand: of, parseCommand: sf, getEscapedCommand: af } = tf(),
      Kb = 1e3 * 1e3 * 100,
      Yb = ({
        env: t,
        extendEnv: e,
        preferLocal: n,
        localDir: r,
        execPath: i,
      }) => {
        let o = e ? { ...process.env, ...t } : t;
        return n ? kb.env({ env: o, cwd: r, execPath: i }) : o;
      },
      uf = (t, e, n = {}) => {
        let r = Mb._parse(t, e, n);
        return (
          (t = r.command),
          (e = r.args),
          (n = r.options),
          (n = {
            maxBuffer: Kb,
            buffer: !0,
            stripFinalNewline: !0,
            extendEnv: !0,
            preferLocal: !1,
            localDir: n.cwd || process.cwd(),
            execPath: process.execPath,
            encoding: "utf8",
            reject: !0,
            cleanup: !0,
            all: !1,
            windowsHide: !0,
            ...n,
          }),
          (n.env = Yb(n)),
          (n.stdio = rf(n)),
          process.platform === "win32" &&
            Rb.basename(t, ".exe") === "cmd" &&
            e.unshift("/q"),
          { file: t, args: e, options: n, parsed: r }
        );
      },
      mn = (t, e, n) =>
        typeof e != "string" && !Buffer.isBuffer(e)
          ? n === void 0
            ? void 0
            : ""
          : t.stripFinalNewline
            ? Db(e)
            : e,
      Lr = (t, e, n) => {
        let r = uf(t, e, n),
          i = of(t, e),
          o = af(t, e);
        Ub(r.options);
        let s;
        try {
          s = Io.spawn(r.file, r.args, r.options);
        } catch (b) {
          let T = new Io.ChildProcess(),
            w = Promise.reject(
              Br({
                error: b,
                stdout: "",
                stderr: "",
                all: "",
                command: i,
                escapedCommand: o,
                parsed: r,
                timedOut: !1,
                isCanceled: !1,
                killed: !1,
              }),
            );
          return nf(T, w);
        }
        let u = Hb(s),
          c = Fb(s, r.options, u),
          a = qb(s, r.options, c),
          l = { isCanceled: !1 };
        (s.kill = Lb.bind(null, s.kill.bind(s))),
          (s.cancel = jb.bind(null, s, l));
        let m = Bb(async () => {
          let [{ error: b, exitCode: T, signal: w, timedOut: R }, K, ue, pt] =
              await Wb(s, r.options, a),
            ge = mn(r.options, K),
            be = mn(r.options, ue),
            Ze = mn(r.options, pt);
          if (b || T !== 0 || w !== null) {
            let Ke = Br({
              error: b,
              exitCode: T,
              signal: w,
              stdout: ge,
              stderr: be,
              all: Ze,
              command: i,
              escapedCommand: o,
              parsed: r,
              timedOut: R,
              isCanceled: l.isCanceled,
              killed: s.killed,
            });
            if (!r.options.reject) return Ke;
            throw Ke;
          }
          return {
            command: i,
            escapedCommand: o,
            exitCode: 0,
            stdout: ge,
            stderr: be,
            all: Ze,
            failed: !1,
            timedOut: !1,
            isCanceled: !1,
            killed: !1,
          };
        });
        return Gb(s, r.options.input), (s.all = Vb(s, r.options)), nf(s, m);
      };
    Lt.exports = Lr;
    Lt.exports.sync = (t, e, n) => {
      let r = uf(t, e, n),
        i = of(t, e),
        o = af(t, e);
      $b(r.options);
      let s;
      try {
        s = Io.spawnSync(r.file, r.args, r.options);
      } catch (a) {
        throw Br({
          error: a,
          stdout: "",
          stderr: "",
          all: "",
          command: i,
          escapedCommand: o,
          parsed: r,
          timedOut: !1,
          isCanceled: !1,
          killed: !1,
        });
      }
      let u = mn(r.options, s.stdout, s.error),
        c = mn(r.options, s.stderr, s.error);
      if (s.error || s.status !== 0 || s.signal !== null) {
        let a = Br({
          stdout: u,
          stderr: c,
          error: s.error,
          signal: s.signal,
          exitCode: s.status,
          command: i,
          escapedCommand: o,
          parsed: r,
          timedOut: s.error && s.error.code === "ETIMEDOUT",
          isCanceled: !1,
          killed: s.signal !== null,
        });
        if (!r.options.reject) return a;
        throw a;
      }
      return {
        command: i,
        escapedCommand: o,
        exitCode: 0,
        stdout: u,
        stderr: c,
        failed: !1,
        timedOut: !1,
        isCanceled: !1,
        killed: !1,
      };
    };
    Lt.exports.command = (t, e) => {
      let [n, ...r] = sf(t);
      return Lr(n, r, e);
    };
    Lt.exports.commandSync = (t, e) => {
      let [n, ...r] = sf(t);
      return Lr.sync(n, r, e);
    };
    Lt.exports.node = (t, e, n = {}) => {
      e && !Array.isArray(e) && typeof e == "object" && ((n = e), (e = []));
      let r = rf.node(n),
        i = process.execArgv.filter((u) => !u.startsWith("--inspect")),
        { nodePath: o = process.execPath, nodeOptions: s = i } = n;
      return Lr(o, [...s, t, ...(Array.isArray(e) ? e : [])], {
        ...n,
        stdin: void 0,
        stdout: void 0,
        stderr: void 0,
        stdio: r,
        shell: !1,
      });
    };
  });
  var eA = Z(zo());
  var Kf = {
      runtime: null,
      "runtime.sourcecreate": null,
      "runtime.assertion": null,
      "runtime.launch": null,
      "runtime.target": null,
      "runtime.welcome": null,
      "runtime.exception": null,
      "runtime.sourcemap": null,
      "runtime.breakpoints": null,
      "sourcemap.parsing": null,
      "perf.function": null,
      "cdp.send": null,
      "cdp.receive": null,
      "dap.send": null,
      "dap.receive": null,
      internal: null,
      proxyActivity: null,
    },
    uw = Object.keys(Kf),
    cw = Symbol("ILogger");
  var Ca = Z(xi()),
    tr = Z(I("os"));
  var Mm = {
      "pwa-extensionHost": null,
      "node-terminal": null,
      "pwa-node": null,
      "pwa-chrome": null,
      "pwa-msedge": null,
    },
    Dm = {
      "extension.js-debug.addCustomBreakpoints": null,
      "extension.js-debug.addXHRBreakpoints": null,
      "extension.js-debug.editXHRBreakpoints": null,
      "extension.pwa-node-debug.attachNodeProcess": null,
      "extension.js-debug.clearAutoAttachVariables": null,
      "extension.js-debug.setAutoAttachVariables": null,
      "extension.js-debug.autoAttachToProcess": null,
      "extension.js-debug.createDebuggerTerminal": null,
      "extension.js-debug.createDiagnostics": null,
      "extension.js-debug.getDiagnosticLogs": null,
      "extension.js-debug.debugLink": null,
      "extension.js-debug.npmScript": null,
      "extension.js-debug.pickNodeProcess": null,
      "extension.js-debug.prettyPrint": null,
      "extension.js-debug.removeXHRBreakpoint": null,
      "extension.js-debug.removeAllCustomBreakpoints": null,
      "extension.js-debug.revealPage": null,
      "extension.js-debug.startProfile": null,
      "extension.js-debug.stopProfile": null,
      "extension.js-debug.toggleSkippingFile": null,
      "extension.node-debug.startWithStopOnEntry": null,
      "extension.js-debug.requestCDPProxy": null,
      "extension.js-debug.openEdgeDevTools": null,
      "extension.js-debug.callers.add": null,
      "extension.js-debug.callers.goToCaller": null,
      "extension.js-debug.callers.gotToTarget": null,
      "extension.js-debug.callers.remove": null,
      "extension.js-debug.callers.removeAll": null,
      "extension.js-debug.enableSourceMapStepping": null,
      "extension.js-debug.disableSourceMapStepping": null,
      "extension.js-debug.network.viewRequest": null,
      "extension.js-debug.network.copyUri": null,
      "extension.js-debug.network.openBody": null,
      "extension.js-debug.network.openBodyInHex": null,
      "extension.js-debug.network.replayXHR": null,
      "extension.js-debug.network.clear": null,
      "extension.js-debug.completion.nodeTool": null,
    },
    lS = new Set(Object.keys(Dm)),
    fS = new Set(Object.keys(Mm));
  var Sa = "<node_internals>";
  var Ai = Symbol("unset");
  function Ci(t) {
    let e = Ai,
      n = (...r) => (e === Ai && (n.value = e = t(...r)), e);
    return (
      (n.forget = () => {
        (e = Ai), (n.value = void 0);
      }),
      (n.value = void 0),
      n
    );
  }
  function Ta(t) {
    let e = new Map(),
      n = (r) => {
        if (e.has(r)) return e.get(r);
        let i = t(r);
        return e.set(r, i), i;
      };
    return (n.clear = () => e.clear()), n;
  }
  var hS = 2 ** 31 - 1;
  var SS = Symbol("AnyLaunchConfiguration"),
    Ea = {
      type: "",
      name: "",
      request: "",
      trace: !1,
      outputCapture: "console",
      timeout: 1e4,
      timeouts: {},
      showAsyncStacks: !0,
      skipFiles: [],
      smartStep: !0,
      sourceMaps: !0,
      sourceMapRenames: !0,
      pauseForSourceMap: !0,
      resolveSourceMapLocations: null,
      rootPath: "${workspaceFolder}",
      outFiles: ["${workspaceFolder}/**/*.(m|c|)js", "!**/node_modules/**"],
      sourceMapPathOverrides: Aa("${workspaceFolder}"),
      enableContentValidation: !0,
      cascadeTerminateToConfigurations: [],
      enableDWARF: !0,
      __workspaceFolder: "",
      __remoteFilePrefix: void 0,
      __breakOnConditionalError: !1,
      customDescriptionGenerator: void 0,
      customPropertiesGenerator: void 0,
    },
    $t = {
      ...Ea,
      cwd: "${workspaceFolder}",
      env: {},
      envFile: null,
      pauseForSourceMap: !1,
      sourceMaps: !0,
      localRoot: null,
      remoteRoot: null,
      resolveSourceMapLocations: ["**", "!**/node_modules/**"],
      autoAttachChildProcesses: !0,
      runtimeSourcemapPausePatterns: [],
      skipFiles: [`${Sa}/**`],
    },
    km = {
      ...$t,
      showAsyncStacks: { onceBreakpointResolved: 16 },
      type: "node-terminal",
      request: "launch",
      name: "JavaScript Debug Terminal",
    },
    TS = {
      ...$t,
      type: "node-terminal",
      request: "attach",
      name: km.name,
      showAsyncStacks: { onceBreakpointResolved: 16 },
      delegateId: -1,
    },
    ES = {
      ...$t,
      type: "pwa-extensionHost",
      name: "Debug Extension",
      request: "launch",
      args: ["--extensionDevelopmentPath=${workspaceFolder}"],
      outFiles: ["${workspaceFolder}/out/**/*.js"],
      resolveSourceMapLocations: [
        "${workspaceFolder}/**",
        "!**/node_modules/**",
      ],
      rendererDebugOptions: {},
      runtimeExecutable: "${execPath}",
      autoAttachChildProcesses: !1,
      debugWebviews: !1,
      debugWebWorkerHost: !1,
      __sessionId: "",
    },
    xS = {
      ...$t,
      type: "pwa-node",
      request: "launch",
      program: "",
      cwd: "${workspaceFolder}",
      stopOnEntry: !1,
      console: "internalConsole",
      restart: !1,
      args: [],
      runtimeExecutable: "node",
      runtimeVersion: "default",
      runtimeArgs: [],
      profileStartup: !1,
      attachSimplePort: null,
      experimentalNetworking: "auto",
      killBehavior: "forceful",
    },
    xa = {
      ...Ea,
      type: "pwa-chrome",
      request: "attach",
      address: "localhost",
      port: 0,
      disableNetworkCache: !0,
      pathMapping: {},
      url: null,
      restart: !1,
      urlFilter: "",
      sourceMapPathOverrides: Aa("${webRoot}"),
      webRoot: "${workspaceFolder}",
      server: null,
      browserAttachLocation: "workspace",
      targetSelection: "automatic",
      vueComponentPaths: ["${workspaceFolder}/**/*.vue", "!**/node_modules/**"],
      perScriptSourcemaps: "auto",
    },
    AS = { ...xa, type: "pwa-msedge", useWebView: !1 },
    Bm = {
      ...xa,
      type: "pwa-chrome",
      request: "launch",
      cwd: null,
      file: null,
      env: {},
      urlFilter: "*",
      includeDefaultArgs: !0,
      includeLaunchArgs: !0,
      runtimeArgs: null,
      runtimeExecutable: "*",
      userDataDir: !0,
      browserLaunchLocation: "workspace",
      profileStartup: !1,
      cleanUp: "wholeBrowser",
    },
    CS = { ...Bm, type: "pwa-msedge", useWebView: !1 },
    IS = {
      ...$t,
      type: "pwa-node",
      attachExistingChildren: !0,
      address: "localhost",
      port: 9229,
      restart: !1,
      request: "attach",
      continueOnAttach: !1,
    };
  function Aa(t) {
    return {
      "webpack:///./~/*": `${t}/node_modules/*`,
      "webpack:////*": "/*",
      "webpack://@?:*/?:*/*": `${t}/*`,
      "webpack://?:*/*": `${t}/*`,
      "webpack:///([a-z]):/(.+)": "$1:/$2",
      "meteor://\u{1F4BB}app/*": `${t}/*`,
      "turbopack://[project]/*": "${workspaceFolder}/*",
    };
  }
  var Zn = "js-debug",
    Ii = "1.100.1",
    Lm = "ms-vscode",
    OS = Zn.includes("nightly"),
    NS = `${Lm}.${Zn}`;
  var er = class {
    async setup() {}
    dispose() {}
    write(e) {
      if (e.level > 2) throw new Error(e.message);
      console.log(JSON.stringify(e));
    }
  };
  var Oi = class {
      constructor(e = 512) {
        this.size = e;
        this.items = [];
        this.i = 0;
      }
      write(e) {
        (this.items[this.i] = e), (this.i = (this.i + 1) % this.size);
      }
      read() {
        return this.items.slice(this.i).concat(this.items.slice(0, this.i));
      }
    },
    pe = class {
      constructor() {
        this.logTarget = { queue: [] };
        this.logBuffer = new Oi(1);
      }
      static async test() {
        let e = new pe();
        return e.setup({ sinks: [new er()], showWelcome: !1 }), e;
      }
      info(e, n, r) {
        this.log({
          tag: e,
          timestamp: Date.now(),
          message: n,
          metadata: r,
          level: 1,
        });
      }
      verbose(e, n, r) {
        this.log({
          tag: e,
          timestamp: Date.now(),
          message: n,
          metadata: r,
          level: 0,
        });
      }
      warn(e, n, r) {
        this.log({
          tag: e,
          timestamp: Date.now(),
          message: n,
          metadata: r,
          level: 2,
        });
      }
      error(e, n, r) {
        this.log({
          tag: e,
          timestamp: Date.now(),
          message: n,
          metadata: r,
          level: 3,
        });
      }
      fatal(e, n, r) {
        this.log({
          tag: e,
          timestamp: Date.now(),
          message: n,
          metadata: r,
          level: 4,
        });
      }
      assert(e, n) {
        if (e === !1 || e === void 0 || e === null) {
          if (
            (this.error("runtime.assertion", n, {
              error: new Error("Assertion failed"),
            }),
            process.env.JS_DEBUG_THROW_ASSERTIONS)
          )
            throw new Error(n);
          debugger;
          return !1;
        }
        return !0;
      }
      log(e) {
        if ((this.logBuffer.write(e), "queue" in this.logTarget)) {
          this.logTarget.queue.push(e);
          return;
        }
        for (let n of this.logTarget.sinks) n.write(e);
      }
      getRecentLogs() {
        return this.logBuffer.read();
      }
      dispose() {
        if ("sinks" in this.logTarget) {
          for (let e of this.logTarget.sinks) e.dispose();
          this.logTarget = { queue: [] };
        }
      }
      forTarget() {
        return this;
      }
      async setup(e) {
        if (
          (await Promise.all(e.sinks.map((r) => r.setup())),
          e.showWelcome !== !1)
        ) {
          let r = Fm();
          for (let i of e.sinks) i.write(r);
        }
        let n = this.logTarget;
        (this.logTarget = { sinks: e.sinks.slice() }),
          "sinks" in n
            ? n.sinks.forEach((r) => r.dispose())
            : n.queue.forEach((r) => this.log(r));
      }
    };
  (pe.null = (() => {
    let e = new pe();
    return e.setup({ sinks: [] }), e;
  })()),
    (pe = bn([(0, Ca.injectable)()], pe));
  var Fm = () => ({
    timestamp: Date.now(),
    tag: "runtime.welcome",
    level: 1,
    message: `${Zn} v${Ii} started`,
    metadata: {
      os: `${tr.platform()} ${tr.arch()}`,
      nodeVersion: process.version,
      adapterVersion: Ii,
    },
  });
  var Ia = Z(xi());
  var ne = class {
    constructor() {
      this._listeners = new Set();
      this.event = (e, n, r) => {
        let i = { listener: e, thisArg: n };
        this._listeners.add(i);
        let o = {
          dispose: () => {
            (o.dispose = () => {}), this._listeners.delete(i);
          },
        };
        return r && r.push(o), o;
      };
    }
    get size() {
      return this._listeners.size;
    }
    fire(e) {
      let n = !this._deliveryQueue;
      this._deliveryQueue || (this._deliveryQueue = []);
      for (let r of this._listeners)
        this._deliveryQueue.push({ data: r, event: e });
      if (n) {
        for (let r = 0; r < this._deliveryQueue.length; r++) {
          let { data: i, event: o } = this._deliveryQueue[r];
          i.listener.call(i.thisArg, o);
        }
        this._deliveryQueue = void 0;
      }
    }
    dispose() {
      this._listeners.clear(),
        this._deliveryQueue && (this._deliveryQueue = []);
    }
  };
  var St = class {
    constructor() {
      this.flushEmitter = new ne();
      this.onFlush = this.flushEmitter.event;
    }
    report() {}
    reportOperation() {}
    attachDap() {}
    flush() {
      this.flushEmitter.fire();
    }
    dispose() {}
  };
  St = bn([(0, Ia.injectable)()], St);
  var nr = Z(I("path"));
  function Na(t, e, n) {
    let r = Oa(t, e, "uncaughtException", n),
      i = Oa(t, e, "unhandledRejection", n);
    return (
      process.addListener("uncaughtException", r),
      process.addListener("unhandledRejection", i),
      {
        dispose: () => {
          process.removeListener("uncaughtException", r),
            process.removeListener("unhandledRejection", i);
        },
      }
    );
  }
  var Oa =
      (t, e, n, r = !0) =>
      (i) => {
        Gm(i) &&
          (e.report("error", {
            "!error": i,
            error: r ? void 0 : i,
            exceptionType: n,
          }),
          t.error("runtime.exception", "Unhandled error in debug adapter", i));
      },
    Um = (t) => typeof t == "object" && !!t && "stack" in t,
    qm = nr.dirname(nr.dirname(nr.dirname(__dirname)));
  function Gm(t) {
    var e;
    return !Wm || (Um(t) && !!((e = t.stack) != null && e.includes(qm)));
  }
  var Wm = !1;
  var Ef = Z(I("net"));
  var Tt = class t {
    constructor(e = process.hrtime()) {
      this.value = e;
    }
    get ms() {
      return this.s * 1e3;
    }
    get s() {
      return this.value[0] + this.value[1] / 1e9;
    }
    elapsed() {
      return new t().subtract(this);
    }
    subtract(e) {
      let n = this.value[1] - e.value[1],
        r = this.value[0] - e.value[0];
      return n < 0 && ((n += 1e9), r--), new t([r, n]);
    }
  };
  var Pa = I("stream"),
    rr = class extends Pa.Transform {
      constructor(n) {
        super();
        this.prefix = [];
        this.splitSuffix = Buffer.alloc(0);
        if (typeof n == "string" && n.length === 1)
          this.splitter = n.charCodeAt(0);
        else if (typeof n == "number") this.splitter = n;
        else throw new Error("not implemented here");
      }
      _transform(n, r, i) {
        let o = 0;
        for (; o < n.length; ) {
          let s = n.indexOf(this.splitter, o);
          if (s === -1) break;
          let u = n.subarray(o, s),
            c =
              this.prefix.length || this.splitSuffix.length
                ? Buffer.concat([...this.prefix, u, this.splitSuffix])
                : u;
          this.push(c), (this.prefix.length = 0), (o = s + 1);
        }
        o < n.length && this.prefix.push(n.subarray(o)), i();
      }
      _flush(n) {
        this.prefix.length &&
          this.push(Buffer.concat([...this.prefix, this.splitSuffix])),
          n();
      }
    };
  var ir = class {
    constructor(e, n, r) {
      this.logger = e;
      this.pipeWrite = n;
      this.pipeRead = r;
      this.messageEmitter = new ne();
      this.endEmitter = new ne();
      this.onMessage = this.messageEmitter.event;
      this.onEnd = this.endEmitter.event;
      this.onceEnded = Ci(() => {
        var e;
        this.streams &&
          (this.beforeClose(),
          this.streams.read.removeAllListeners(),
          (e = this.pipeRead) == null || e.destroy(),
          this.streams.write.removeListener("end", this.onceEnded),
          this.streams.write.removeListener("error", this.onWriteError),
          this.streams.write.on("error", () => {}),
          this.streams.write.end(),
          (this.streams = void 0),
          this.endEmitter.fire());
      });
      this.onWriteError = (e) => {
        this.logger.error("internal", "pipeWrite error", { error: e });
      };
      let i = r || n;
      this.streams = {
        read: i
          .on("error", (o) =>
            this.logger.error("internal", "pipeRead error", { error: o }),
          )
          .pipe(new rr(0))
          .on("data", (o) => this.messageEmitter.fire([o.toString(), new Tt()]))
          .on("end", this.onceEnded),
        write: n.on("end", this.onceEnded).on("error", this.onWriteError),
      };
    }
    send(e) {
      var n;
      (n = this.streams) == null || n.write.write(e + "\0");
    }
    dispose() {
      this.onceEnded();
    }
    beforeClose() {}
  };
  var Zy = Z(ka(), 1),
    e_ = Z(qi(), 1),
    t_ = Z(Wi(), 1),
    Mu = Z(Ji(), 1),
    n_ = Z(Ru(), 1);
  var Du = Mu.default;
  var nn = class extends Error {
    get cause() {
      return this._cause;
    }
    constructor(e) {
      super("__errorMarker" in e ? e.error.format : e.format),
        (this._cause = "__errorMarker" in e ? e.error : e);
    }
  };
  var ku = (t) =>
    isFinite(t) ? new Promise((e) => setTimeout(e, t)) : new Promise(() => {});
  function Bu() {
    let t = null,
      e = null,
      n = !1,
      r,
      i = new Promise((o, s) => {
        (t = (u) => {
          (n = !0), (r = u), o(u);
        }),
          (e = (u) => {
            (n = !0), s(u);
          });
      });
    return {
      resolve: t,
      reject: e,
      promise: i,
      get settledValue() {
        return r;
      },
      hasSettled: () => n,
    };
  }
  var _r = class extends nn {
    constructor(e) {
      super({ id: 9243, format: e, showUser: !0 }),
        (this._cause = { id: 9243, format: e, showUser: !0 });
    }
  };
  function Lu(t, e, n) {
    if (e.isCancellationRequested)
      return Promise.reject(new _r(n || "Task cancelled"));
    let r = Bu(),
      i = e.onCancellationRequested(r.resolve);
    return Promise.race([
      r.promise.then(() => {
        throw new _r(n || "Task cancelled");
      }),
      t
        .then((o) => (i.dispose(), o))
        .catch((o) => {
          throw (i.dispose(), o);
        }),
    ]);
  }
  var ju = Object.freeze(function (t, e) {
      let n = setTimeout(t.bind(e), 0);
      return {
        dispose() {
          clearTimeout(n);
        },
      };
    }),
    r_ = Object.freeze({
      isCancellationRequested: !1,
      onCancellationRequested: () => ({ dispose: () => {} }),
    }),
    i_ = Object.freeze({
      isCancellationRequested: !0,
      onCancellationRequested: ju,
    }),
    Ot = class t {
      constructor(e) {
        this._token = void 0;
        this._parentListener = void 0;
        this._parentListener =
          e && e.onCancellationRequested(this.cancel, this);
      }
      static withTimeout(e, n) {
        let r = new t(n),
          i = (r._token = new It()),
          o = setTimeout(() => i.cancel(), e);
        return i.onCancellationRequested(() => clearTimeout(o)), r;
      }
      get token() {
        return this._token || (this._token = new It()), this._token;
      }
      cancel() {
        this._token
          ? this._token instanceof It && this._token.cancel()
          : (this._token = i_);
      }
      dispose(e = !1) {
        e && this.cancel(),
          this._parentListener && this._parentListener.dispose(),
          this._token
            ? this._token instanceof It && this._token.dispose()
            : (this._token = r_);
      }
    },
    It = class {
      constructor() {
        this._isCancelled = !1;
        this._emitter = null;
      }
      cancel() {
        this._isCancelled ||
          ((this._isCancelled = !0),
          this._emitter && (this._emitter.fire(void 0), this.dispose()));
      }
      get isCancellationRequested() {
        return this._isCancelled;
      }
      get onCancellationRequested() {
        return this._isCancelled
          ? ju
          : (this._emitter || (this._emitter = new ne()), this._emitter.event);
      }
      dispose() {
        this._emitter && (this._emitter.dispose(), (this._emitter = null));
      }
    };
  var vf = I("dns"),
    dt = Z(I("path")),
    _n = I("url");
  var Fu,
    Nt,
    o_,
    rn = class {
      constructor() {
        (this._indexes = { __proto__: null }), (this.array = []);
      }
    };
  (Fu = (t, e) => t._indexes[e]),
    (Nt = (t, e) => {
      let n = Fu(t, e);
      if (n !== void 0) return n;
      let { array: r, _indexes: i } = t;
      return (i[e] = r.push(e) - 1);
    }),
    (o_ = (t) => {
      let { array: e, _indexes: n } = t;
      if (e.length === 0) return;
      let r = e.pop();
      n[r] = void 0;
    });
  var Uu = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    Gu = new Uint8Array(64),
    Wu = new Uint8Array(128);
  for (let t = 0; t < Uu.length; t++) {
    let e = Uu.charCodeAt(t);
    (Gu[t] = e), (Wu[e] = t);
  }
  var Qi =
    typeof TextDecoder < "u"
      ? new TextDecoder()
      : typeof Buffer < "u"
        ? {
            decode(t) {
              return Buffer.from(
                t.buffer,
                t.byteOffset,
                t.byteLength,
              ).toString();
            },
          }
        : {
            decode(t) {
              let e = "";
              for (let n = 0; n < t.length; n++) e += String.fromCharCode(t[n]);
              return e;
            },
          };
  function Vu(t) {
    let e = new Int32Array(5),
      n = [],
      r = 0;
    do {
      let i = s_(t, r),
        o = [],
        s = !0,
        u = 0;
      e[0] = 0;
      for (let c = r; c < i; c++) {
        let a;
        c = on(t, c, e, 0);
        let l = e[0];
        l < u && (s = !1),
          (u = l),
          qu(t, c, i)
            ? ((c = on(t, c, e, 1)),
              (c = on(t, c, e, 2)),
              (c = on(t, c, e, 3)),
              qu(t, c, i)
                ? ((c = on(t, c, e, 4)), (a = [l, e[1], e[2], e[3], e[4]]))
                : (a = [l, e[1], e[2], e[3]]))
            : (a = [l]),
          o.push(a);
      }
      s || a_(o), n.push(o), (r = i + 1);
    } while (r <= t.length);
    return n;
  }
  function s_(t, e) {
    let n = t.indexOf(";", e);
    return n === -1 ? t.length : n;
  }
  function on(t, e, n, r) {
    let i = 0,
      o = 0,
      s = 0;
    do {
      let c = t.charCodeAt(e++);
      (s = Wu[c]), (i |= (s & 31) << o), (o += 5);
    } while (s & 32);
    let u = i & 1;
    return (i >>>= 1), u && (i = -2147483648 | -i), (n[r] += i), e;
  }
  function qu(t, e, n) {
    return e >= n ? !1 : t.charCodeAt(e) !== 44;
  }
  function a_(t) {
    t.sort(u_);
  }
  function u_(t, e) {
    return t[0] - e[0];
  }
  function vr(t) {
    let e = new Int32Array(5),
      n = 1024 * 16,
      r = n - 36,
      i = new Uint8Array(n),
      o = i.subarray(0, r),
      s = 0,
      u = "";
    for (let c = 0; c < t.length; c++) {
      let a = t[c];
      if (
        (c > 0 && (s === n && ((u += Qi.decode(i)), (s = 0)), (i[s++] = 59)),
        a.length !== 0)
      ) {
        e[0] = 0;
        for (let l = 0; l < a.length; l++) {
          let p = a[l];
          s > r && ((u += Qi.decode(o)), i.copyWithin(0, r, s), (s -= r)),
            l > 0 && (i[s++] = 44),
            (s = sn(i, s, e, p, 0)),
            p.length !== 1 &&
              ((s = sn(i, s, e, p, 1)),
              (s = sn(i, s, e, p, 2)),
              (s = sn(i, s, e, p, 3)),
              p.length !== 4 && (s = sn(i, s, e, p, 4)));
        }
      }
    }
    return u + Qi.decode(i.subarray(0, s));
  }
  function sn(t, e, n, r, i) {
    let o = r[i],
      s = o - n[i];
    (n[i] = o), (s = s < 0 ? (-s << 1) | 1 : s << 1);
    do {
      let u = s & 31;
      (s >>>= 5), s > 0 && (u |= 32), (t[e++] = Gu[u]);
    } while (s > 0);
    return e;
  }
  var c_ = /^[\w+.-]+:\/\//,
    l_ =
      /^([\w+.-]+:)\/\/([^@/#?]*@)?([^:/#?]*)(:\d+)?(\/[^#?]*)?(\?[^#]*)?(#.*)?/,
    f_ = /^file:(?:\/\/((?![a-z]:)[^/#?]*)?)?(\/?[^#?]*)(\?[^#]*)?(#.*)?/i,
    F;
  (function (t) {
    (t[(t.Empty = 1)] = "Empty"),
      (t[(t.Hash = 2)] = "Hash"),
      (t[(t.Query = 3)] = "Query"),
      (t[(t.RelativePath = 4)] = "RelativePath"),
      (t[(t.AbsolutePath = 5)] = "AbsolutePath"),
      (t[(t.SchemeRelative = 6)] = "SchemeRelative"),
      (t[(t.Absolute = 7)] = "Absolute");
  })(F || (F = {}));
  function d_(t) {
    return c_.test(t);
  }
  function p_(t) {
    return t.startsWith("//");
  }
  function Ku(t) {
    return t.startsWith("/");
  }
  function h_(t) {
    return t.startsWith("file:");
  }
  function $u(t) {
    return /^[.?#]/.test(t);
  }
  function br(t) {
    let e = l_.exec(t);
    return Yu(
      e[1],
      e[2] || "",
      e[3],
      e[4] || "",
      e[5] || "/",
      e[6] || "",
      e[7] || "",
    );
  }
  function g_(t) {
    let e = f_.exec(t),
      n = e[2];
    return Yu(
      "file:",
      "",
      e[1] || "",
      "",
      Ku(n) ? n : "/" + n,
      e[3] || "",
      e[4] || "",
    );
  }
  function Yu(t, e, n, r, i, o, s) {
    return {
      scheme: t,
      user: e,
      host: n,
      port: r,
      path: i,
      query: o,
      hash: s,
      type: F.Absolute,
    };
  }
  function Hu(t) {
    if (p_(t)) {
      let n = br("http:" + t);
      return (n.scheme = ""), (n.type = F.SchemeRelative), n;
    }
    if (Ku(t)) {
      let n = br("http://foo.com" + t);
      return (n.scheme = ""), (n.host = ""), (n.type = F.AbsolutePath), n;
    }
    if (h_(t)) return g_(t);
    if (d_(t)) return br(t);
    let e = br("http://foo.com/" + t);
    return (
      (e.scheme = ""),
      (e.host = ""),
      (e.type = t
        ? t.startsWith("?")
          ? F.Query
          : t.startsWith("#")
            ? F.Hash
            : F.RelativePath
        : F.Empty),
      e
    );
  }
  function m_(t) {
    if (t.endsWith("/..")) return t;
    let e = t.lastIndexOf("/");
    return t.slice(0, e + 1);
  }
  function y_(t, e) {
    zu(e, e.type),
      t.path === "/" ? (t.path = e.path) : (t.path = m_(e.path) + t.path);
  }
  function zu(t, e) {
    let n = e <= F.RelativePath,
      r = t.path.split("/"),
      i = 1,
      o = 0,
      s = !1;
    for (let c = 1; c < r.length; c++) {
      let a = r[c];
      if (!a) {
        s = !0;
        continue;
      }
      if (((s = !1), a !== ".")) {
        if (a === "..") {
          o ? ((s = !0), o--, i--) : n && (r[i++] = a);
          continue;
        }
        (r[i++] = a), o++;
      }
    }
    let u = "";
    for (let c = 1; c < i; c++) u += "/" + r[c];
    (!u || (s && !u.endsWith("/.."))) && (u += "/"), (t.path = u);
  }
  function Ju(t, e) {
    if (!t && !e) return "";
    let n = Hu(t),
      r = n.type;
    if (e && r !== F.Absolute) {
      let o = Hu(e),
        s = o.type;
      switch (r) {
        case F.Empty:
          n.hash = o.hash;
        case F.Hash:
          n.query = o.query;
        case F.Query:
        case F.RelativePath:
          y_(n, o);
        case F.AbsolutePath:
          (n.user = o.user), (n.host = o.host), (n.port = o.port);
        case F.SchemeRelative:
          n.scheme = o.scheme;
      }
      s > r && (r = s);
    }
    zu(n, r);
    let i = n.query + n.hash;
    switch (r) {
      case F.Hash:
      case F.Query:
        return i;
      case F.RelativePath: {
        let o = n.path.slice(1);
        return o ? ($u(e || t) && !$u(o) ? "./" + o + i : o + i) : i || ".";
      }
      case F.AbsolutePath:
        return n.path + i;
      default:
        return n.scheme + "//" + n.user + n.host + n.port + n.path + i;
    }
  }
  function Xu(t, e) {
    return e && !e.endsWith("/") && (e += "/"), Ju(t, e);
  }
  function __(t) {
    if (!t) return "";
    let e = t.lastIndexOf("/");
    return t.slice(0, e + 1);
  }
  var Ue = 0,
    nc = 1,
    rc = 2,
    ic = 3,
    v_ = 4,
    oc = 1,
    sc = 2;
  function b_(t, e) {
    let n = Qu(t, 0);
    if (n === t.length) return t;
    e || (t = t.slice());
    for (let r = n; r < t.length; r = Qu(t, r + 1)) t[r] = S_(t[r], e);
    return t;
  }
  function Qu(t, e) {
    for (let n = e; n < t.length; n++) if (!w_(t[n])) return n;
    return t.length;
  }
  function w_(t) {
    for (let e = 1; e < t.length; e++) if (t[e][Ue] < t[e - 1][Ue]) return !1;
    return !0;
  }
  function S_(t, e) {
    return e || (t = t.slice()), t.sort(T_);
  }
  function T_(t, e) {
    return t[Ue] - e[Ue];
  }
  var ut = !1;
  function E_(t, e, n, r) {
    for (; n <= r; ) {
      let i = n + ((r - n) >> 1),
        o = t[i][Ue] - e;
      if (o === 0) return (ut = !0), i;
      o < 0 ? (n = i + 1) : (r = i - 1);
    }
    return (ut = !1), n - 1;
  }
  function eo(t, e, n) {
    for (let r = n + 1; r < t.length && t[r][Ue] === e; n = r++);
    return n;
  }
  function ac(t, e, n) {
    for (let r = n - 1; r >= 0 && t[r][Ue] === e; n = r--);
    return n;
  }
  function uc() {
    return { lastKey: -1, lastNeedle: -1, lastIndex: -1 };
  }
  function cc(t, e, n, r) {
    let { lastKey: i, lastNeedle: o, lastIndex: s } = n,
      u = 0,
      c = t.length - 1;
    if (r === i) {
      if (e === o) return (ut = s !== -1 && t[s][Ue] === e), s;
      e >= o ? (u = s === -1 ? 0 : s) : (c = s);
    }
    return (n.lastKey = r), (n.lastNeedle = e), (n.lastIndex = E_(t, e, u, c));
  }
  function x_(t, e) {
    let n = e.map(C_);
    for (let r = 0; r < t.length; r++) {
      let i = t[r];
      for (let o = 0; o < i.length; o++) {
        let s = i[o];
        if (s.length === 1) continue;
        let u = s[nc],
          c = s[rc],
          a = s[ic],
          l = n[u],
          p = l[c] || (l[c] = []),
          m = e[u],
          b = eo(p, a, cc(p, a, m, c));
        A_(p, (m.lastIndex = b + 1), [a, r, s[Ue]]);
      }
    }
    return n;
  }
  function A_(t, e, n) {
    for (let r = t.length; r > e; r--) t[r] = t[r - 1];
    t[e] = n;
  }
  function C_() {
    return { __proto__: null };
  }
  var Zu = "`line` must be greater than 0 (lines start at line 1)",
    ec =
      "`column` must be greater than or equal to 0 (columns start at column 0)",
    Tr = -1,
    ct = 1,
    tc,
    Fe,
    I_,
    to,
    no,
    ro,
    io,
    O_,
    N_,
    P_,
    R_,
    un = class {
      constructor(e, n) {
        let r = typeof e == "string";
        if (!r && e._decodedMemo) return e;
        let i = r ? JSON.parse(e) : e,
          {
            version: o,
            file: s,
            names: u,
            sourceRoot: c,
            sources: a,
            sourcesContent: l,
          } = i;
        (this.version = o),
          (this.file = s),
          (this.names = u || []),
          (this.sourceRoot = c),
          (this.sources = a),
          (this.sourcesContent = l);
        let p = Xu(c || "", __(n));
        this.resolvedSources = a.map((b) => Xu(b || "", p));
        let { mappings: m } = i;
        typeof m == "string"
          ? ((this._encoded = m), (this._decoded = void 0))
          : ((this._encoded = void 0), (this._decoded = b_(m, r))),
          (this._decodedMemo = uc()),
          (this._bySources = void 0),
          (this._bySourceMemos = void 0);
      }
    };
  (() => {
    (tc = (e) => {
      var n;
      return (n = e._encoded) !== null && n !== void 0
        ? n
        : (e._encoded = vr(e._decoded));
    }),
      (Fe = (e) => e._decoded || (e._decoded = Vu(e._encoded))),
      (I_ = (e, n, r) => {
        let i = Fe(e);
        if (n >= i.length) return null;
        let o = i[n],
          s = Sr(o, e._decodedMemo, n, r, ct);
        return s === -1 ? null : o[s];
      }),
      (to = (e, { line: n, column: r, bias: i }) => {
        if ((n--, n < 0)) throw new Error(Zu);
        if (r < 0) throw new Error(ec);
        let o = Fe(e);
        if (n >= o.length) return wr(null, null, null, null);
        let s = o[n],
          u = Sr(s, e._decodedMemo, n, r, i || ct);
        if (u === -1) return wr(null, null, null, null);
        let c = s[u];
        if (c.length === 1) return wr(null, null, null, null);
        let { names: a, resolvedSources: l } = e;
        return wr(l[c[nc]], c[rc] + 1, c[ic], c.length === 5 ? a[c[v_]] : null);
      }),
      (ro = (e, { source: n, line: r, column: i, bias: o }) =>
        t(e, n, r, i, o || Tr, !0)),
      (no = (e, { source: n, line: r, column: i, bias: o }) =>
        t(e, n, r, i, o || ct, !1)),
      (io = (e, n) => {
        let r = Fe(e),
          { names: i, resolvedSources: o } = e;
        for (let s = 0; s < r.length; s++) {
          let u = r[s];
          for (let c = 0; c < u.length; c++) {
            let a = u[c],
              l = s + 1,
              p = a[0],
              m = null,
              b = null,
              T = null,
              w = null;
            a.length !== 1 && ((m = o[a[1]]), (b = a[2] + 1), (T = a[3])),
              a.length === 5 && (w = i[a[4]]),
              n({
                generatedLine: l,
                generatedColumn: p,
                source: m,
                originalLine: b,
                originalColumn: T,
                name: w,
              });
          }
        }
      }),
      (O_ = (e, n) => {
        let { sources: r, resolvedSources: i, sourcesContent: o } = e;
        if (o == null) return null;
        let s = r.indexOf(n);
        return s === -1 && (s = i.indexOf(n)), s === -1 ? null : o[s];
      }),
      (N_ = (e, n) => {
        let r = new un(Zi(e, []), n);
        return (r._decoded = e.mappings), r;
      }),
      (P_ = (e) => Zi(e, Fe(e))),
      (R_ = (e) => Zi(e, tc(e)));
    function t(e, n, r, i, o, s) {
      if ((r--, r < 0)) throw new Error(Zu);
      if (i < 0) throw new Error(ec);
      let { sources: u, resolvedSources: c } = e,
        a = u.indexOf(n);
      if ((a === -1 && (a = c.indexOf(n)), a === -1))
        return s ? [] : an(null, null);
      let p = (e._bySources ||
        (e._bySources = x_(Fe(e), (e._bySourceMemos = u.map(uc)))))[a][r];
      if (p == null) return s ? [] : an(null, null);
      let m = e._bySourceMemos[a];
      if (s) return M_(p, m, r, i, o);
      let b = Sr(p, m, r, i, o);
      if (b === -1) return an(null, null);
      let T = p[b];
      return an(T[oc] + 1, T[sc]);
    }
  })();
  function Zi(t, e) {
    return {
      version: t.version,
      file: t.file,
      names: t.names,
      sourceRoot: t.sourceRoot,
      sources: t.sources,
      sourcesContent: t.sourcesContent,
      mappings: e,
    };
  }
  function wr(t, e, n, r) {
    return { source: t, line: e, column: n, name: r };
  }
  function an(t, e) {
    return { line: t, column: e };
  }
  function Sr(t, e, n, r, i) {
    let o = cc(t, r, e, n);
    return (
      ut ? (o = (i === Tr ? eo : ac)(t, r, o)) : i === Tr && o++,
      o === -1 || o === t.length ? -1 : o
    );
  }
  function M_(t, e, n, r, i) {
    let o = Sr(t, e, n, r, ct);
    if ((!ut && i === Tr && o++, o === -1 || o === t.length)) return [];
    let s = ut ? r : t[o][Ue];
    ut || (o = ac(t, s, o));
    let u = eo(t, s, o),
      c = [];
    for (; o <= u; o++) {
      let a = t[o];
      c.push(an(a[oc] + 1, a[sc]));
    }
    return c;
  }
  var pc = 0,
    hc = 1,
    gc = 2,
    mc = 3,
    yc = 4,
    _c = -1,
    vc,
    D_,
    k_,
    B_,
    bc,
    oo,
    L_,
    j_,
    F_,
    cn,
    Er = class {
      constructor({ file: e, sourceRoot: n } = {}) {
        (this._names = new rn()),
          (this._sources = new rn()),
          (this._sourcesContent = []),
          (this._mappings = []),
          (this.file = e),
          (this.sourceRoot = n);
      }
    };
  (vc = (t, e, n, r, i, o, s, u) => cn(!1, t, e, n, r, i, o, s, u)),
    (k_ = (t, e, n, r, i, o, s, u) => cn(!0, t, e, n, r, i, o, s, u)),
    (D_ = (t, e) => dc(!1, t, e)),
    (B_ = (t, e) => dc(!0, t, e)),
    (bc = (t, e, n) => {
      let { _sources: r, _sourcesContent: i } = t;
      i[Nt(r, e)] = n;
    }),
    (oo = (t) => {
      let {
        file: e,
        sourceRoot: n,
        _mappings: r,
        _sources: i,
        _sourcesContent: o,
        _names: s,
      } = t;
      return (
        G_(r),
        {
          version: 3,
          file: e || void 0,
          names: s.array,
          sourceRoot: n || void 0,
          sources: i.array,
          sourcesContent: o,
          mappings: r,
        }
      );
    }),
    (L_ = (t) => {
      let e = oo(t);
      return Object.assign(Object.assign({}, e), { mappings: vr(e.mappings) });
    }),
    (F_ = (t) => {
      let e = [],
        { _mappings: n, _sources: r, _names: i } = t;
      for (let o = 0; o < n.length; o++) {
        let s = n[o];
        for (let u = 0; u < s.length; u++) {
          let c = s[u],
            a = { line: o + 1, column: c[pc] },
            l,
            p,
            m;
          c.length !== 1 &&
            ((l = r.array[c[hc]]),
            (p = { line: c[gc] + 1, column: c[mc] }),
            c.length === 5 && (m = i.array[c[yc]])),
            e.push({ generated: a, source: l, original: p, name: m });
        }
      }
      return e;
    }),
    (j_ = (t) => {
      let e = new un(t),
        n = new Er({ file: e.file, sourceRoot: e.sourceRoot });
      return (
        fc(n._names, e.names),
        fc(n._sources, e.sources),
        (n._sourcesContent = e.sourcesContent || e.sources.map(() => null)),
        (n._mappings = Fe(e)),
        n
      );
    }),
    (cn = (t, e, n, r, i, o, s, u, c) => {
      let { _mappings: a, _sources: l, _sourcesContent: p, _names: m } = e,
        b = U_(a, n),
        T = q_(b, r);
      if (!i) return t && W_(b, T) ? void 0 : lc(b, T, [r]);
      let w = Nt(l, i),
        R = u ? Nt(m, u) : _c;
      if (
        (w === p.length && (p[w] = c != null ? c : null),
        !(t && V_(b, T, w, o, s, R)))
      )
        return lc(b, T, u ? [r, w, o, s, R] : [r, w, o, s]);
    });
  function U_(t, e) {
    for (let n = t.length; n <= e; n++) t[n] = [];
    return t[e];
  }
  function q_(t, e) {
    let n = t.length;
    for (let r = n - 1; r >= 0; n = r--) {
      let i = t[r];
      if (e >= i[pc]) break;
    }
    return n;
  }
  function lc(t, e, n) {
    for (let r = t.length; r > e; r--) t[r] = t[r - 1];
    t[e] = n;
  }
  function G_(t) {
    let { length: e } = t,
      n = e;
    for (let r = n - 1; r >= 0 && !(t[r].length > 0); n = r, r--);
    n < e && (t.length = n);
  }
  function fc(t, e) {
    for (let n = 0; n < e.length; n++) Nt(t, e[n]);
  }
  function W_(t, e) {
    return e === 0 ? !0 : t[e - 1].length === 1;
  }
  function V_(t, e, n, r, i, o) {
    if (e === 0) return !1;
    let s = t[e - 1];
    return s.length === 1
      ? !1
      : n === s[hc] &&
          r === s[gc] &&
          i === s[mc] &&
          o === (s.length === 5 ? s[yc] : _c);
  }
  function dc(t, e, n) {
    let { generated: r, source: i, original: o, name: s, content: u } = n;
    if (!i) return cn(t, e, r.line - 1, r.column, null, null, null, null, null);
    let c = i;
    return cn(t, e, r.line - 1, r.column, c, o.line - 1, o.column, s, u);
  }
  var { stringify: H_ } = JSON;
  if (!String.prototype.repeat)
    throw new Error(
      "String.prototype.repeat is undefined, see https://github.com/davidbonnet/astring#installation",
    );
  if (!String.prototype.endsWith)
    throw new Error(
      "String.prototype.endsWith is undefined, see https://github.com/davidbonnet/astring#installation",
    );
  var xr = {
      "||": 2,
      "??": 3,
      "&&": 4,
      "|": 5,
      "^": 6,
      "&": 7,
      "==": 8,
      "!=": 8,
      "===": 8,
      "!==": 8,
      "<": 9,
      ">": 9,
      "<=": 9,
      ">=": 9,
      in: 9,
      instanceof: 9,
      "<<": 10,
      ">>": 10,
      ">>>": 10,
      "+": 11,
      "-": 11,
      "*": 12,
      "%": 12,
      "/": 12,
      "**": 13,
    },
    lt = 17;
  function Pt(t, e) {
    let { generator: n } = t;
    if ((t.write("("), e != null && e.length > 0)) {
      n[e[0].type](e[0], t);
      let { length: r } = e;
      for (let i = 1; i < r; i++) {
        let o = e[i];
        t.write(", "), n[o.type](o, t);
      }
    }
    t.write(")");
  }
  function Cc(t, e, n, r) {
    let i = t.expressionsPrecedence[e.type];
    if (i === lt) return !0;
    let o = t.expressionsPrecedence[n.type];
    return i !== o
      ? (!r && i === 15 && o === 14 && n.operator === "**") || i < o
      : i !== 13 && i !== 14
        ? !1
        : e.operator === "**" && n.operator === "**"
          ? !r
          : i === 13 && o === 13 && (e.operator === "??" || n.operator === "??")
            ? !0
            : r
              ? xr[e.operator] <= xr[n.operator]
              : xr[e.operator] < xr[n.operator];
  }
  function Ar(t, e, n, r) {
    let { generator: i } = t;
    Cc(t, e, n, r)
      ? (t.write("("), i[e.type](e, t), t.write(")"))
      : i[e.type](e, t);
  }
  function K_(t, e, n, r) {
    let i = e.split(`
`),
      o = i.length - 1;
    if ((t.write(i[0].trim()), o > 0)) {
      t.write(r);
      for (let s = 1; s < o; s++) t.write(n + i[s].trim() + r);
      t.write(n + i[o].trim());
    }
  }
  function re(t, e, n, r) {
    let { length: i } = e;
    for (let o = 0; o < i; o++) {
      let s = e[o];
      t.write(n),
        s.type[0] === "L"
          ? t.write(
              "// " +
                s.value.trim() +
                `
`,
              s,
            )
          : (t.write("/*"), K_(t, s.value, n, r), t.write("*/" + r));
    }
  }
  function Y_(t) {
    let e = t;
    for (; e != null; ) {
      let { type: n } = e;
      if (n[0] === "C" && n[1] === "a") return !0;
      if (n[0] === "M" && n[1] === "e" && n[2] === "m") e = e.object;
      else return !1;
    }
  }
  function so(t, e) {
    let { generator: n } = t,
      { declarations: r } = e;
    t.write(e.kind + " ");
    let { length: i } = r;
    if (i > 0) {
      n.VariableDeclarator(r[0], t);
      for (let o = 1; o < i; o++) t.write(", "), n.VariableDeclarator(r[o], t);
    }
  }
  var wc,
    Sc,
    Tc,
    Ec,
    xc,
    Ac,
    HT = {
      Program(t, e) {
        let n = e.indent.repeat(e.indentLevel),
          { lineEnd: r, writeComments: i } = e;
        i && t.comments != null && re(e, t.comments, n, r);
        let o = t.body,
          { length: s } = o;
        for (let u = 0; u < s; u++) {
          let c = o[u];
          i && c.comments != null && re(e, c.comments, n, r),
            e.write(n),
            this[c.type](c, e),
            e.write(r);
        }
        i && t.trailingComments != null && re(e, t.trailingComments, n, r);
      },
      BlockStatement: (Ac = function (t, e) {
        let n = e.indent.repeat(e.indentLevel++),
          { lineEnd: r, writeComments: i } = e,
          o = n + e.indent;
        e.write("{");
        let s = t.body;
        if (s != null && s.length > 0) {
          e.write(r), i && t.comments != null && re(e, t.comments, o, r);
          let { length: u } = s;
          for (let c = 0; c < u; c++) {
            let a = s[c];
            i && a.comments != null && re(e, a.comments, o, r),
              e.write(o),
              this[a.type](a, e),
              e.write(r);
          }
          e.write(n);
        } else
          i &&
            t.comments != null &&
            (e.write(r), re(e, t.comments, o, r), e.write(n));
        i && t.trailingComments != null && re(e, t.trailingComments, o, r),
          e.write("}"),
          e.indentLevel--;
      }),
      ClassBody: Ac,
      StaticBlock(t, e) {
        e.write("static "), this.BlockStatement(t, e);
      },
      EmptyStatement(t, e) {
        e.write(";");
      },
      ExpressionStatement(t, e) {
        let n = e.expressionsPrecedence[t.expression.type];
        n === lt || (n === 3 && t.expression.left.type[0] === "O")
          ? (e.write("("),
            this[t.expression.type](t.expression, e),
            e.write(")"))
          : this[t.expression.type](t.expression, e),
          e.write(";");
      },
      IfStatement(t, e) {
        e.write("if ("),
          this[t.test.type](t.test, e),
          e.write(") "),
          this[t.consequent.type](t.consequent, e),
          t.alternate != null &&
            (e.write(" else "), this[t.alternate.type](t.alternate, e));
      },
      LabeledStatement(t, e) {
        this[t.label.type](t.label, e),
          e.write(": "),
          this[t.body.type](t.body, e);
      },
      BreakStatement(t, e) {
        e.write("break"),
          t.label != null && (e.write(" "), this[t.label.type](t.label, e)),
          e.write(";");
      },
      ContinueStatement(t, e) {
        e.write("continue"),
          t.label != null && (e.write(" "), this[t.label.type](t.label, e)),
          e.write(";");
      },
      WithStatement(t, e) {
        e.write("with ("),
          this[t.object.type](t.object, e),
          e.write(") "),
          this[t.body.type](t.body, e);
      },
      SwitchStatement(t, e) {
        let n = e.indent.repeat(e.indentLevel++),
          { lineEnd: r, writeComments: i } = e;
        e.indentLevel++;
        let o = n + e.indent,
          s = o + e.indent;
        e.write("switch ("),
          this[t.discriminant.type](t.discriminant, e),
          e.write(") {" + r);
        let { cases: u } = t,
          { length: c } = u;
        for (let a = 0; a < c; a++) {
          let l = u[a];
          i && l.comments != null && re(e, l.comments, o, r),
            l.test
              ? (e.write(o + "case "),
                this[l.test.type](l.test, e),
                e.write(":" + r))
              : e.write(o + "default:" + r);
          let { consequent: p } = l,
            { length: m } = p;
          for (let b = 0; b < m; b++) {
            let T = p[b];
            i && T.comments != null && re(e, T.comments, s, r),
              e.write(s),
              this[T.type](T, e),
              e.write(r);
          }
        }
        (e.indentLevel -= 2), e.write(n + "}");
      },
      ReturnStatement(t, e) {
        e.write("return"),
          t.argument && (e.write(" "), this[t.argument.type](t.argument, e)),
          e.write(";");
      },
      ThrowStatement(t, e) {
        e.write("throw "), this[t.argument.type](t.argument, e), e.write(";");
      },
      TryStatement(t, e) {
        if ((e.write("try "), this[t.block.type](t.block, e), t.handler)) {
          let { handler: n } = t;
          n.param == null
            ? e.write(" catch ")
            : (e.write(" catch ("),
              this[n.param.type](n.param, e),
              e.write(") ")),
            this[n.body.type](n.body, e);
        }
        t.finalizer &&
          (e.write(" finally "), this[t.finalizer.type](t.finalizer, e));
      },
      WhileStatement(t, e) {
        e.write("while ("),
          this[t.test.type](t.test, e),
          e.write(") "),
          this[t.body.type](t.body, e);
      },
      DoWhileStatement(t, e) {
        e.write("do "),
          this[t.body.type](t.body, e),
          e.write(" while ("),
          this[t.test.type](t.test, e),
          e.write(");");
      },
      ForStatement(t, e) {
        if ((e.write("for ("), t.init != null)) {
          let { init: n } = t;
          n.type[0] === "V" ? so(e, n) : this[n.type](n, e);
        }
        e.write("; "),
          t.test && this[t.test.type](t.test, e),
          e.write("; "),
          t.update && this[t.update.type](t.update, e),
          e.write(") "),
          this[t.body.type](t.body, e);
      },
      ForInStatement: (wc = function (t, e) {
        e.write(`for ${t.await ? "await " : ""}(`);
        let { left: n } = t;
        n.type[0] === "V" ? so(e, n) : this[n.type](n, e),
          e.write(t.type[3] === "I" ? " in " : " of "),
          this[t.right.type](t.right, e),
          e.write(") "),
          this[t.body.type](t.body, e);
      }),
      ForOfStatement: wc,
      DebuggerStatement(t, e) {
        e.write("debugger;", t);
      },
      FunctionDeclaration: (Sc = function (t, e) {
        e.write(
          (t.async ? "async " : "") +
            (t.generator ? "function* " : "function ") +
            (t.id ? t.id.name : ""),
          t,
        ),
          Pt(e, t.params),
          e.write(" "),
          this[t.body.type](t.body, e);
      }),
      FunctionExpression: Sc,
      VariableDeclaration(t, e) {
        so(e, t), e.write(";");
      },
      VariableDeclarator(t, e) {
        this[t.id.type](t.id, e),
          t.init != null && (e.write(" = "), this[t.init.type](t.init, e));
      },
      ClassDeclaration(t, e) {
        if (
          (e.write("class " + (t.id ? `${t.id.name} ` : ""), t), t.superClass)
        ) {
          e.write("extends ");
          let { superClass: n } = t,
            { type: r } = n,
            i = e.expressionsPrecedence[r];
          (r[0] !== "C" || r[1] !== "l" || r[5] !== "E") &&
          (i === lt || i < e.expressionsPrecedence.ClassExpression)
            ? (e.write("("), this[t.superClass.type](n, e), e.write(")"))
            : this[n.type](n, e),
            e.write(" ");
        }
        this.ClassBody(t.body, e);
      },
      ImportDeclaration(t, e) {
        e.write("import ");
        let { specifiers: n } = t,
          { length: r } = n,
          i = 0;
        if (r > 0) {
          for (; i < r; ) {
            i > 0 && e.write(", ");
            let o = n[i],
              s = o.type[6];
            if (s === "D") e.write(o.local.name, o), i++;
            else if (s === "N") e.write("* as " + o.local.name, o), i++;
            else break;
          }
          if (i < r) {
            for (e.write("{"); ; ) {
              let o = n[i],
                { name: s } = o.imported;
              if (
                (e.write(s, o),
                s !== o.local.name && e.write(" as " + o.local.name),
                ++i < r)
              )
                e.write(", ");
              else break;
            }
            e.write("}");
          }
          e.write(" from ");
        }
        this.Literal(t.source, e), e.write(";");
      },
      ImportExpression(t, e) {
        e.write("import("), this[t.source.type](t.source, e), e.write(")");
      },
      ExportDefaultDeclaration(t, e) {
        e.write("export default "),
          this[t.declaration.type](t.declaration, e),
          e.expressionsPrecedence[t.declaration.type] != null &&
            t.declaration.type[0] !== "F" &&
            e.write(";");
      },
      ExportNamedDeclaration(t, e) {
        if ((e.write("export "), t.declaration))
          this[t.declaration.type](t.declaration, e);
        else {
          e.write("{");
          let { specifiers: n } = t,
            { length: r } = n;
          if (r > 0)
            for (let i = 0; ; ) {
              let o = n[i],
                { name: s } = o.local;
              if (
                (e.write(s, o),
                s !== o.exported.name && e.write(" as " + o.exported.name),
                ++i < r)
              )
                e.write(", ");
              else break;
            }
          e.write("}"),
            t.source && (e.write(" from "), this.Literal(t.source, e)),
            e.write(";");
        }
      },
      ExportAllDeclaration(t, e) {
        t.exported != null
          ? e.write("export * as " + t.exported.name + " from ")
          : e.write("export * from "),
          this.Literal(t.source, e),
          e.write(";");
      },
      MethodDefinition(t, e) {
        t.static && e.write("static ");
        let n = t.kind[0];
        (n === "g" || n === "s") && e.write(t.kind + " "),
          t.value.async && e.write("async "),
          t.value.generator && e.write("*"),
          t.computed
            ? (e.write("["), this[t.key.type](t.key, e), e.write("]"))
            : this[t.key.type](t.key, e),
          Pt(e, t.value.params),
          e.write(" "),
          this[t.value.body.type](t.value.body, e);
      },
      ClassExpression(t, e) {
        this.ClassDeclaration(t, e);
      },
      ArrowFunctionExpression(t, e) {
        e.write(t.async ? "async " : "", t);
        let { params: n } = t;
        n != null &&
          (n.length === 1 && n[0].type[0] === "I"
            ? e.write(n[0].name, n[0])
            : Pt(e, t.params)),
          e.write(" => "),
          t.body.type[0] === "O"
            ? (e.write("("), this.ObjectExpression(t.body, e), e.write(")"))
            : this[t.body.type](t.body, e);
      },
      ThisExpression(t, e) {
        e.write("this", t);
      },
      Super(t, e) {
        e.write("super", t);
      },
      RestElement: (Tc = function (t, e) {
        e.write("..."), this[t.argument.type](t.argument, e);
      }),
      SpreadElement: Tc,
      YieldExpression(t, e) {
        e.write(t.delegate ? "yield*" : "yield"),
          t.argument && (e.write(" "), this[t.argument.type](t.argument, e));
      },
      AwaitExpression(t, e) {
        e.write("await ", t), Ar(e, t.argument, t);
      },
      TemplateLiteral(t, e) {
        let { quasis: n, expressions: r } = t;
        e.write("`");
        let { length: i } = r;
        for (let s = 0; s < i; s++) {
          let u = r[s],
            c = n[s];
          e.write(c.value.raw, c),
            e.write("${"),
            this[u.type](u, e),
            e.write("}");
        }
        let o = n[n.length - 1];
        e.write(o.value.raw, o), e.write("`");
      },
      TemplateElement(t, e) {
        e.write(t.value.raw, t);
      },
      TaggedTemplateExpression(t, e) {
        Ar(e, t.tag, t), this[t.quasi.type](t.quasi, e);
      },
      ArrayExpression: (xc = function (t, e) {
        if ((e.write("["), t.elements.length > 0)) {
          let { elements: n } = t,
            { length: r } = n;
          for (let i = 0; ; ) {
            let o = n[i];
            if ((o != null && this[o.type](o, e), ++i < r)) e.write(", ");
            else {
              o == null && e.write(", ");
              break;
            }
          }
        }
        e.write("]");
      }),
      ArrayPattern: xc,
      ObjectExpression(t, e) {
        let n = e.indent.repeat(e.indentLevel++),
          { lineEnd: r, writeComments: i } = e,
          o = n + e.indent;
        if ((e.write("{"), t.properties.length > 0)) {
          e.write(r), i && t.comments != null && re(e, t.comments, o, r);
          let s = "," + r,
            { properties: u } = t,
            { length: c } = u;
          for (let a = 0; ; ) {
            let l = u[a];
            if (
              (i && l.comments != null && re(e, l.comments, o, r),
              e.write(o),
              this[l.type](l, e),
              ++a < c)
            )
              e.write(s);
            else break;
          }
          e.write(r),
            i && t.trailingComments != null && re(e, t.trailingComments, o, r),
            e.write(n + "}");
        } else
          i
            ? t.comments != null
              ? (e.write(r),
                re(e, t.comments, o, r),
                t.trailingComments != null && re(e, t.trailingComments, o, r),
                e.write(n + "}"))
              : t.trailingComments != null
                ? (e.write(r),
                  re(e, t.trailingComments, o, r),
                  e.write(n + "}"))
                : e.write("}")
            : e.write("}");
        e.indentLevel--;
      },
      Property(t, e) {
        t.method || t.kind[0] !== "i"
          ? this.MethodDefinition(t, e)
          : (t.shorthand ||
              (t.computed
                ? (e.write("["), this[t.key.type](t.key, e), e.write("]"))
                : this[t.key.type](t.key, e),
              e.write(": ")),
            this[t.value.type](t.value, e));
      },
      PropertyDefinition(t, e) {
        if (
          (t.static && e.write("static "),
          t.computed && e.write("["),
          this[t.key.type](t.key, e),
          t.computed && e.write("]"),
          t.value == null)
        ) {
          t.key.type[0] !== "F" && e.write(";");
          return;
        }
        e.write(" = "), this[t.value.type](t.value, e), e.write(";");
      },
      ObjectPattern(t, e) {
        if ((e.write("{"), t.properties.length > 0)) {
          let { properties: n } = t,
            { length: r } = n;
          for (let i = 0; this[n[i].type](n[i], e), ++i < r; ) e.write(", ");
        }
        e.write("}");
      },
      SequenceExpression(t, e) {
        Pt(e, t.expressions);
      },
      UnaryExpression(t, e) {
        if (t.prefix) {
          let {
            operator: n,
            argument: r,
            argument: { type: i },
          } = t;
          e.write(n);
          let o = Cc(e, r, t);
          !o &&
            (n.length > 1 ||
              (i[0] === "U" &&
                (i[1] === "n" || i[1] === "p") &&
                r.prefix &&
                r.operator[0] === n &&
                (n === "+" || n === "-"))) &&
            e.write(" "),
            o
              ? (e.write(n.length > 1 ? " (" : "("),
                this[i](r, e),
                e.write(")"))
              : this[i](r, e);
        } else this[t.argument.type](t.argument, e), e.write(t.operator);
      },
      UpdateExpression(t, e) {
        t.prefix
          ? (e.write(t.operator), this[t.argument.type](t.argument, e))
          : (this[t.argument.type](t.argument, e), e.write(t.operator));
      },
      AssignmentExpression(t, e) {
        this[t.left.type](t.left, e),
          e.write(" " + t.operator + " "),
          this[t.right.type](t.right, e);
      },
      AssignmentPattern(t, e) {
        this[t.left.type](t.left, e),
          e.write(" = "),
          this[t.right.type](t.right, e);
      },
      BinaryExpression: (Ec = function (t, e) {
        let n = t.operator === "in";
        n && e.write("("),
          Ar(e, t.left, t, !1),
          e.write(" " + t.operator + " "),
          Ar(e, t.right, t, !0),
          n && e.write(")");
      }),
      LogicalExpression: Ec,
      ConditionalExpression(t, e) {
        let { test: n } = t,
          r = e.expressionsPrecedence[n.type];
        r === lt || r <= e.expressionsPrecedence.ConditionalExpression
          ? (e.write("("), this[n.type](n, e), e.write(")"))
          : this[n.type](n, e),
          e.write(" ? "),
          this[t.consequent.type](t.consequent, e),
          e.write(" : "),
          this[t.alternate.type](t.alternate, e);
      },
      NewExpression(t, e) {
        e.write("new ");
        let n = e.expressionsPrecedence[t.callee.type];
        n === lt || n < e.expressionsPrecedence.CallExpression || Y_(t.callee)
          ? (e.write("("), this[t.callee.type](t.callee, e), e.write(")"))
          : this[t.callee.type](t.callee, e),
          Pt(e, t.arguments);
      },
      CallExpression(t, e) {
        let n = e.expressionsPrecedence[t.callee.type];
        n === lt || n < e.expressionsPrecedence.CallExpression
          ? (e.write("("), this[t.callee.type](t.callee, e), e.write(")"))
          : this[t.callee.type](t.callee, e),
          t.optional && e.write("?."),
          Pt(e, t.arguments);
      },
      ChainExpression(t, e) {
        this[t.expression.type](t.expression, e);
      },
      MemberExpression(t, e) {
        let n = e.expressionsPrecedence[t.object.type];
        n === lt || n < e.expressionsPrecedence.MemberExpression
          ? (e.write("("), this[t.object.type](t.object, e), e.write(")"))
          : this[t.object.type](t.object, e),
          t.computed
            ? (t.optional && e.write("?."),
              e.write("["),
              this[t.property.type](t.property, e),
              e.write("]"))
            : (t.optional ? e.write("?.") : e.write("."),
              this[t.property.type](t.property, e));
      },
      MetaProperty(t, e) {
        e.write(t.meta.name + "." + t.property.name, t);
      },
      Identifier(t, e) {
        e.write(t.name, t);
      },
      PrivateIdentifier(t, e) {
        e.write(`#${t.name}`, t);
      },
      Literal(t, e) {
        t.raw != null
          ? e.write(t.raw, t)
          : t.regex != null
            ? this.RegExpLiteral(t, e)
            : t.bigint != null
              ? e.write(t.bigint + "n", t)
              : e.write(H_(t.value), t);
      },
      RegExpLiteral(t, e) {
        let { regex: n } = t;
        e.write(`/${n.pattern}/${n.flags}`, t);
      },
    };
  var ao = {
      ArrayExpression: ["elements"],
      ArrayPattern: ["elements"],
      ArrowFunctionExpression: ["params", "body"],
      AssignmentExpression: ["left", "right"],
      AssignmentPattern: ["left", "right"],
      AwaitExpression: ["argument"],
      BinaryExpression: ["left", "right"],
      BlockStatement: ["body"],
      BreakStatement: ["label"],
      CallExpression: ["callee", "arguments"],
      CatchClause: ["param", "body"],
      ChainExpression: ["expression"],
      ClassBody: ["body"],
      ClassDeclaration: ["id", "superClass", "body"],
      ClassExpression: ["id", "superClass", "body"],
      ConditionalExpression: ["test", "consequent", "alternate"],
      ContinueStatement: ["label"],
      DebuggerStatement: [],
      DoWhileStatement: ["body", "test"],
      EmptyStatement: [],
      ExperimentalRestProperty: ["argument"],
      ExperimentalSpreadProperty: ["argument"],
      ExportAllDeclaration: ["exported", "source"],
      ExportDefaultDeclaration: ["declaration"],
      ExportNamedDeclaration: ["declaration", "specifiers", "source"],
      ExportSpecifier: ["exported", "local"],
      ExpressionStatement: ["expression"],
      ForInStatement: ["left", "right", "body"],
      ForOfStatement: ["left", "right", "body"],
      ForStatement: ["init", "test", "update", "body"],
      FunctionDeclaration: ["id", "params", "body"],
      FunctionExpression: ["id", "params", "body"],
      Identifier: [],
      IfStatement: ["test", "consequent", "alternate"],
      ImportDeclaration: ["specifiers", "source"],
      ImportDefaultSpecifier: ["local"],
      ImportExpression: ["source"],
      ImportNamespaceSpecifier: ["local"],
      ImportSpecifier: ["imported", "local"],
      JSXAttribute: ["name", "value"],
      JSXClosingElement: ["name"],
      JSXClosingFragment: [],
      JSXElement: ["openingElement", "children", "closingElement"],
      JSXEmptyExpression: [],
      JSXExpressionContainer: ["expression"],
      JSXFragment: ["openingFragment", "children", "closingFragment"],
      JSXIdentifier: [],
      JSXMemberExpression: ["object", "property"],
      JSXNamespacedName: ["namespace", "name"],
      JSXOpeningElement: ["name", "attributes"],
      JSXOpeningFragment: [],
      JSXSpreadAttribute: ["argument"],
      JSXSpreadChild: ["expression"],
      JSXText: [],
      LabeledStatement: ["label", "body"],
      Literal: [],
      LogicalExpression: ["left", "right"],
      MemberExpression: ["object", "property"],
      MetaProperty: ["meta", "property"],
      MethodDefinition: ["key", "value"],
      NewExpression: ["callee", "arguments"],
      ObjectExpression: ["properties"],
      ObjectPattern: ["properties"],
      PrivateIdentifier: [],
      Program: ["body"],
      Property: ["key", "value"],
      PropertyDefinition: ["key", "value"],
      RestElement: ["argument"],
      ReturnStatement: ["argument"],
      SequenceExpression: ["expressions"],
      SpreadElement: ["argument"],
      StaticBlock: ["body"],
      Super: [],
      SwitchCase: ["test", "consequent"],
      SwitchStatement: ["discriminant", "cases"],
      TaggedTemplateExpression: ["tag", "quasi"],
      TemplateElement: [],
      TemplateLiteral: ["quasis", "expressions"],
      ThisExpression: [],
      ThrowStatement: ["argument"],
      TryStatement: ["block", "handler", "finalizer"],
      UnaryExpression: ["argument"],
      UpdateExpression: ["argument"],
      VariableDeclaration: ["declarations"],
      VariableDeclarator: ["id", "init"],
      WhileStatement: ["test", "body"],
      WithStatement: ["object", "body"],
      YieldExpression: ["argument"],
    },
    z_ = Object.keys(ao);
  for (let t of z_) Object.freeze(ao[t]);
  Object.freeze(ao);
  var zb = Z(cf()),
    ff = I("os");
  var ft = Z(I("fs")),
    lf = Z(I("util"));
  var RE = lf.promisify(ft.writeFile);
  var ME = Symbol("FsUtils");
  var FE = process.platform === "win32" ? "\\\\.\\pipe\\" : (0, ff.tmpdir)();
  var yn = "file:///",
    df = (t) => t.startsWith(yn) && t[yn.length + 1] === ":";
  function Jb(t, e = !1) {
    if (!t) return t;
    if (df(t)) {
      let n = yn.length;
      t = yn + t[n].toLowerCase() + t.substr(n + 1);
    } else
      hf(t) &&
        (t = (e ? t[0].toUpperCase() : t[0].toLowerCase()) + t.substr(1));
    return t;
  }
  function Oo(t, e = !1) {
    if (!t) return t;
    if (((t = Jb(t, e)), df(t))) {
      let n = yn.length;
      t = t.substr(0, n + 1) + t.substr(n + 1).replace(/\//g, "\\");
    } else hf(t) && (t = t.replace(/\//g, "\\"));
    return t;
  }
  var pf = (t) => t.startsWith("\\\\"),
    hf = (t) => /^[A-Za-z]:/.test(t) || pf(t);
  var jr = class jr {
    constructor(e, n, r, i, o) {
      this.original = e;
      this.metadata = n;
      this.actualRoot = r;
      this.actualSources = i;
      this.hasNames = o;
      this.sourceActualToOriginal = new Map();
      this.sourceOriginalToActual = new Map();
      this.id = jr.idCounter++;
      if (i.length !== e.sources.length)
        throw new Error(
          "Expected actualSources.length === original.source.length",
        );
      for (let s = 0; s < i.length; s++) {
        let u = i[s],
          c = e.sources[s];
        u !== null &&
          c !== null &&
          (this.sourceActualToOriginal.set(u, c),
          this.sourceOriginalToActual.set(c, u));
      }
    }
    get sources() {
      return this.actualSources.slice();
    }
    get sourceRoot() {
      return this.actualRoot;
    }
    computedSourceUrl(e) {
      return Oo(
        gf(
          mf(this.metadata.sourceMapUrl)
            ? this.metadata.compiledPath
            : this.metadata.sourceMapUrl,
          this.sourceRoot + e,
        ),
      );
    }
    originalPositionFor(e) {
      var r;
      let n = to(this.original, e);
      return (
        n.source &&
          (n.source =
            (r = this.sourceOriginalToActual.get(n.source)) != null
              ? r
              : n.source),
        n
      );
    }
    generatedPositionFor(e) {
      var r;
      let n =
        (r = this.sourceActualToOriginal.get(e.source)) != null ? r : e.source;
      if (!isFinite(e.line)) {
        let i = e.bias || ct;
        return this.getBestGeneratedForOriginal(n, (o, s) => Xb(o, s) * i);
      }
      return no(this.original, { ...e, source: n });
    }
    allGeneratedPositionsFor(e) {
      var n;
      return ro(this.original, {
        ...e,
        source:
          (n = this.sourceActualToOriginal.get(e.source)) != null
            ? n
            : e.source,
      });
    }
    sourceContentFor(e) {
      var r, i, o;
      e = (r = this.sourceActualToOriginal.get(e)) != null ? r : e;
      let n = this.original.sources.indexOf(e);
      return n === -1
        ? null
        : (o = (i = this.original.sourcesContent) == null ? void 0 : i[n]) !=
            null
          ? o
          : null;
    }
    eachMapping(e) {
      io(this.original, e);
    }
    decodedMappings() {
      return Fe(this.original);
    }
    names() {
      return this.original.names;
    }
    getBestGeneratedForOriginal(e, n) {
      let r;
      return (
        this.eachMapping((i) => {
          i.source === e && (!r || n(i, r) > 0) && (r = i);
        }),
        r
          ? { column: r.generatedColumn, line: r.generatedLine }
          : { column: null, line: null }
      );
    }
  };
  jr.idCounter = 0;
  var No = jr,
    Xb = (
      { originalLine: t, originalColumn: e },
      { originalLine: n, originalColumn: r },
    ) => (t || 0) - (n || 0) || (e || 0) - (r || 0);
  var Bx = process.platform !== "win32";
  var _f,
    Lx =
      process.platform === "win32"
        ? (_f = process.env.PATHEXT) == null
          ? void 0
          : _f.toLowerCase().split(";")
        : void 0;
  var Zb = new Set(["localhost", "127.0.0.1", "::1"]);
  var yf = (t) => Zb.has(t.toLowerCase()),
    ew = (t) => {
      try {
        return new _n.URL(t).hostname.replace(/^\[|\]$/g, "");
      } catch {
        return t;
      }
    };
  var bf = Ta(async (t) => {
    let e = ew(t);
    if (yf(e)) return !0;
    try {
      let n = await vf.promises.lookup(e);
      return yf(n.address);
    } catch {
      return !1;
    }
  });
  function gf(t, e) {
    try {
      return new _n.URL(e), e;
    } catch {}
    let n;
    try {
      n = new _n.URL(t || "");
    } catch {
      return e;
    }
    let r = n.protocol + "//";
    return (
      n.username && (r += n.username + ":" + n.password + "@"),
      (r += n.host),
      (r += dt.dirname(n.pathname)),
      r[r.length - 1] !== "/" && (r += "/"),
      (r += e),
      r
    );
  }
  function mf(t) {
    return !!t && t.startsWith("data:");
  }
  var jx = process.platform;
  var tw = 50,
    Fr = class t {
      constructor(e) {
        this.messageEmitter = new ne();
        this.endEmitter = new ne();
        this.onMessage = this.messageEmitter.event;
        this.onEnd = this.endEmitter.event;
        (this._ws = e),
          this._ws.addEventListener("message", (n) => {
            this.messageEmitter.fire([n.data.toString("utf-8"), new Tt()]);
          }),
          this._ws.addEventListener("close", () => {
            this.endEmitter.fire(), (this._ws = void 0);
          }),
          this._ws.addEventListener("error", () => {});
      }
      static async create(e, n, r) {
        let i = !e.startsWith("ws://"),
          o = await bf(e);
        for (;;) {
          let s = Date.now() + tw;
          try {
            let u = {
                headers: { host: r != null ? r : "localhost" },
                perMessageDeflate: !1,
                maxPayload: 268435456,
                rejectUnauthorized: !(i && o),
                followRedirects: !0,
              },
              c = new Du(e, [], u);
            return await Lu(
              new Promise((a, l) => {
                c.addEventListener("open", () => a(new t(c))),
                  c.addEventListener("error", (p) => {
                    let m =
                      e === c.url ? e : c.url.replace(/^http(s?):/, "ws$1:");
                    if (m === e) {
                      l(p.error);
                      return;
                    }
                    this.create(m, n, r).then(a, l);
                  });
              }),
              Ot.withTimeout(2e3, n).token,
              `Could not open ${e}`,
            ).catch((a) => {
              throw (c.close(), a);
            });
          } catch (u) {
            if (n.isCancellationRequested) throw u;
            let c = s - Date.now();
            c > 0 && (await ku(c));
          }
        }
      }
      send(e) {
        var n;
        (n = this._ws) == null || n.send(e);
      }
      dispose() {
        return new Promise((e) => {
          if (!this._ws) return e();
          this._ws.addEventListener("close", () => e()), this._ws.close();
        });
      }
    };
  var wf = I("crypto"),
    Sf = () => (0, wf.randomBytes)(12).toString("hex");
  var Tf,
    Ur = class t {
      constructor(e, n) {
        this.info = e;
        this.server = n;
        this.onEndEmitter = new ne();
        this.cts = new Ot();
        this.gracefulExit = !1;
        this.targetAlive = !1;
        this.targetInfo = {
          targetId: (Tf = this.info.ownId) != null ? Tf : Sf(),
          processId: Number(this.info.pid) || 0,
          type: this.info.waitForDebugger ? "waitingForDebugger" : "",
          title: this.info.scriptName,
          url: "file://" + this.info.scriptName,
          openerId: this.info.openerId,
          attached: !0,
          canAccessOpener: !1,
          processInspectorPort: Number(new URL(this.info.inspectorURL).port),
        };
        this.onEnd = this.onEndEmitter.event;
        this.listenToServer();
      }
      get isTargetAlive() {
        return this.targetAlive;
      }
      static async attach(e) {
        let n = await new Promise((i, o) => {
            let s = Ef.createConnection(e.ipcAddress, () => i(s));
            s.on("error", o);
          }),
          r = new ir(pe.null, n);
        return new t(e, r);
      }
      listenToServer() {
        let { server: e, targetInfo: n } = this;
        e.send(
          JSON.stringify({
            method: "Target.targetCreated",
            params: { targetInfo: n },
          }),
        ),
          e.onMessage(async ([r]) => {
            if (
              this.target &&
              !r.includes("Target.attachToTarget") &&
              !r.includes("Target.detachFromTarget")
            ) {
              this.target.send(r);
              return;
            }
            let i = await this.execute(r);
            i && e.send(JSON.stringify(i));
          }),
          e.onEnd(() => {
            this.disposeTarget(),
              this.onEndEmitter.fire({
                killed: this.gracefulExit,
                code: this.gracefulExit ? 0 : 1,
              });
          });
      }
      dispose() {
        (this.gracefulExit = !0),
          this.cts.dispose(!0),
          this.disposeTarget(),
          this.server.dispose();
      }
      async execute(e) {
        var r;
        let n = JSON.parse(e);
        switch (n.method) {
          case "Target.attachToTarget":
            return (
              this.target && this.disposeTarget(),
              (this.target = await this.createTarget()),
              {
                id: n.id,
                result: {
                  sessionId: this.targetInfo.targetId,
                  __dynamicAttach: this.info.dynamicAttach ? !0 : void 0,
                },
              }
            );
          case "Target.detachFromTarget":
            return (
              (this.gracefulExit = !0),
              this.disposeTarget(),
              { id: n.id, result: {} }
            );
          default:
            (r = this.target) == null || r.send(n);
            return;
        }
      }
      async createTarget() {
        this.gracefulExit = !1;
        let e = await Fr.create(
          this.info.inspectorURL,
          this.cts.token,
          this.info.remoteHostHeader,
        );
        return (
          e.onMessage(([n]) => this.server.send(n)),
          e.onEnd(() => {
            e &&
              this.server.send(
                JSON.stringify({
                  method: "Target.targetDestroyed",
                  params: {
                    targetId: this.targetInfo.targetId,
                    sessionId: this.targetInfo.targetId,
                  },
                }),
              ),
              (this.targetAlive = !1),
              this.server.dispose();
          }),
          e
        );
      }
      disposeTarget() {
        this.target && (this.target.dispose(), (this.target = void 0));
      }
    };
  var qr = JSON.parse(process.env.NODE_INSPECTOR_INFO),
    Gr = new pe();
  Gr.setup({ sinks: [] });
  Na(Gr, new St());
  (async () => {
    process.on("exit", () => {
      Gr.info("runtime", "Process exiting"),
        Gr.dispose(),
        qr.pid &&
          !qr.dynamicAttach &&
          (!t || t.isTargetAlive) &&
          process.kill(Number(qr.pid));
    });
    let t = await Ur.attach(qr);
    t.onEnd(() => process.exit());
  })();
})();
/*! Bundled license information:

reflect-metadata/Reflect.js:
  (*! *****************************************************************************
  Copyright (C) Microsoft. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0
  
  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.
  
  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** *)
*/
//# sourceMappingURL=watchdog.js.map
