"use strict";
(exports.id = 425),
  (exports.ids = [425]),
  (exports.modules = {
    425: (_, e, t) => {
      t.a(_, async (_, n) => {
        try {
          t.d(e, { decode_bytes: () => i.pt, init_panic_hook: () => i.d3 });
          var r = t(871),
            i = t(763),
            s = _([r]);
          (r = (s.then ? (await s)() : s)[0]), (0, i.lI)(r), n();
        } catch (_) {
          n(_);
        }
      });
    },
    763: (_, e, t) => {
      let n;
      function r(_) {
        n = _;
      }
      t.d(e, {
        Mq: () => B,
        Qn: () => T,
        Rs: () => C,
        V5: () => A,
        Xu: () => R,
        bU: () => E,
        bk: () => U,
        d3: () => x,
        lI: () => r,
        pt: () => z,
        qN: () => H,
        u$: () => q,
        yc: () => j,
      }),
        (_ = t.hmd(_));
      let i = new (
        "undefined" == typeof TextDecoder
          ? (0, _.require)("util").TextDecoder
          : TextDecoder
      )("utf-8", { ignoreBOM: !0, fatal: !0 });
      i.decode();
      let s = null;
      function g() {
        return (
          (null !== s && 0 !== s.byteLength) ||
            (s = new Uint8Array(n.memory.buffer)),
          s
        );
      }
      function o(_, e) {
        return (_ >>>= 0), i.decode(g().subarray(_, _ + e));
      }
      const a = new Array(128).fill(void 0);
      a.push(void 0, null, !0, !1);
      let d = a.length;
      function c(_) {
        d === a.length && a.push(a.length + 1);
        const e = d;
        return (d = a[e]), (a[e] = _), e;
      }
      function l(_) {
        return a[_];
      }
      function b(_) {
        const e = l(_);
        return (
          (function (_) {
            _ < 132 || ((a[_] = d), (d = _));
          })(_),
          e
        );
      }
      let w = 0,
        p = new (
          "undefined" == typeof TextEncoder
            ? (0, _.require)("util").TextEncoder
            : TextEncoder
        )("utf-8");
      const u =
        "function" == typeof p.encodeInto
          ? function (_, e) {
              return p.encodeInto(_, e);
            }
          : function (_, e) {
              const t = p.encode(_);
              return e.set(t), { read: _.length, written: t.length };
            };
      function h(_, e, t) {
        if (void 0 === t) {
          const t = p.encode(_),
            n = e(t.length, 1) >>> 0;
          return (
            g()
              .subarray(n, n + t.length)
              .set(t),
            (w = t.length),
            n
          );
        }
        let n = _.length,
          r = e(n, 1) >>> 0;
        const i = g();
        let s = 0;
        for (; s < n; s++) {
          const e = _.charCodeAt(s);
          if (e > 127) break;
          i[r + s] = e;
        }
        if (s !== n) {
          0 !== s && (_ = _.slice(s)),
            (r = t(r, n, (n = s + 3 * _.length), 1) >>> 0);
          const e = g().subarray(r + s, r + n);
          s += u(_, e).written;
        }
        return (w = s), r;
      }
      let f = null;
      function y() {
        return (
          (null !== f && 0 !== f.byteLength) ||
            (f = new Int32Array(n.memory.buffer)),
          f
        );
      }
      function z(_) {
        try {
          const r = n.__wbindgen_add_to_stack_pointer(-16),
            i = (function (_, e) {
              const t = e(1 * _.length, 1) >>> 0;
              return g().set(_, t / 1), (w = _.length), t;
            })(_, n.__wbindgen_malloc),
            s = w;
          n.decode_bytes(r, i, s);
          var e = y()[r / 4 + 0],
            t = y()[r / 4 + 1];
          if (y()[r / 4 + 2]) throw b(t);
          return I.__wrap(e);
        } finally {
          n.__wbindgen_add_to_stack_pointer(16);
        }
      }
      function x() {
        n.init_panic_hook();
      }
      let k = null;
      function m() {
        return (
          (null !== k && 0 !== k.byteLength) ||
            (k = new Uint32Array(n.memory.buffer)),
          k
        );
      }
      function v(_, e) {
        _ >>>= 0;
        const t = m().subarray(_ / 4, _ / 4 + e),
          n = [];
        for (let _ = 0; _ < t.length; _++) n.push(b(t[_]));
        return n;
      }
      Object.freeze({
        Context: 0,
        0: "Context",
        Element: 1,
        1: "Element",
        Property: 2,
        2: "Property",
        Internal: 3,
        3: "Internal",
        Hidden: 4,
        4: "Hidden",
        Shortcut: 5,
        5: "Shortcut",
        Weak: 6,
        6: "Weak",
        Invisible: 7,
        7: "Invisible",
        Other: 8,
        8: "Other",
      }),
        Object.freeze({
          Hidden: 0,
          0: "Hidden",
          Array: 1,
          1: "Array",
          String: 2,
          2: "String",
          Object: 3,
          3: "Object",
          Code: 4,
          4: "Code",
          Closure: 5,
          5: "Closure",
          RegExp: 6,
          6: "RegExp",
          Number: 7,
          7: "Number",
          Native: 8,
          8: "Native",
          Syntheic: 9,
          9: "Syntheic",
          ConcatString: 10,
          10: "ConcatString",
          SliceString: 11,
          11: "SliceString",
          BigInt: 12,
          12: "BigInt",
          Other: 13,
          13: "Other",
        }),
        Object.freeze({
          SelfSize: 0,
          0: "SelfSize",
          RetainedSize: 1,
          1: "RetainedSize",
          Name: 2,
          2: "Name",
        });
      class S {
        static __wrap(_) {
          _ >>>= 0;
          const e = Object.create(S.prototype);
          return (e.__wbg_ptr = _), e;
        }
        __destroy_into_raw() {
          const _ = this.__wbg_ptr;
          return (this.__wbg_ptr = 0), _;
        }
        free() {
          const _ = this.__destroy_into_raw();
          n.__wbg_classgroup_free(_);
        }
        get self_size() {
          const _ = n.__wbg_get_classgroup_self_size(this.__wbg_ptr);
          return BigInt.asUintN(64, _);
        }
        set self_size(_) {
          n.__wbg_set_classgroup_self_size(this.__wbg_ptr, _);
        }
        get retained_size() {
          const _ = n.__wbg_get_classgroup_retained_size(this.__wbg_ptr);
          return BigInt.asUintN(64, _);
        }
        set retained_size(_) {
          n.__wbg_set_classgroup_retained_size(this.__wbg_ptr, _);
        }
        get children_len() {
          return n.__wbg_get_classgroup_children_len(this.__wbg_ptr) >>> 0;
        }
        set children_len(_) {
          n.__wbg_set_classgroup_children_len(this.__wbg_ptr, _);
        }
        name() {
          let _, e;
          try {
            const i = n.__wbindgen_add_to_stack_pointer(-16);
            n.classgroup_name(i, this.__wbg_ptr);
            var t = y()[i / 4 + 0],
              r = y()[i / 4 + 1];
            return (_ = t), (e = r), o(t, r);
          } finally {
            n.__wbindgen_add_to_stack_pointer(16), n.__wbindgen_free(_, e, 1);
          }
        }
      }
      class I {
        static __wrap(_) {
          _ >>>= 0;
          const e = Object.create(I.prototype);
          return (e.__wbg_ptr = _), e;
        }
        __destroy_into_raw() {
          const _ = this.__wbg_ptr;
          return (this.__wbg_ptr = 0), _;
        }
        free() {
          const _ = this.__destroy_into_raw();
          n.__wbg_graph_free(_);
        }
        get root_index() {
          return n.__wbg_get_graph_root_index(this.__wbg_ptr) >>> 0;
        }
        set root_index(_) {
          n.__wbg_set_graph_root_index(this.__wbg_ptr, _);
        }
        get_class_groups(_, e, t) {
          try {
            const g = n.__wbindgen_add_to_stack_pointer(-16);
            n.graph_get_class_groups(g, this.__wbg_ptr, _, e, t);
            var r = y()[g / 4 + 0],
              i = y()[g / 4 + 1],
              s = v(r, i).slice();
            return n.__wbindgen_free(r, 4 * i, 4), s;
          } finally {
            n.__wbindgen_add_to_stack_pointer(16);
          }
        }
        get_class_counts(_) {
          try {
            const g = n.__wbindgen_add_to_stack_pointer(-16),
              o = (function (_, e) {
                const t = e(4 * _.length, 4) >>> 0,
                  n = m();
                for (let e = 0; e < _.length; e++) n[t / 4 + e] = c(_[e]);
                return (w = _.length), t;
              })(_, n.__wbindgen_malloc),
              a = w;
            n.graph_get_class_counts(g, this.__wbg_ptr, o, a);
            var e = y()[g / 4 + 0],
              t = y()[g / 4 + 1],
              r = ((i = e),
              (s = t),
              (i >>>= 0),
              m().subarray(i / 4, i / 4 + s)).slice();
            return n.__wbindgen_free(e, 4 * t, 4), r;
          } finally {
            n.__wbindgen_add_to_stack_pointer(16);
          }
          var i, s;
        }
        class_children(_, e, t, r) {
          try {
            const o = n.__wbindgen_add_to_stack_pointer(-16);
            n.graph_class_children(o, this.__wbg_ptr, _, e, t, r);
            var i = y()[o / 4 + 0],
              s = y()[o / 4 + 1],
              g = v(i, s).slice();
            return n.__wbindgen_free(i, 4 * s, 4), g;
          } finally {
            n.__wbindgen_add_to_stack_pointer(16);
          }
        }
        node_children(_, e, t, r) {
          try {
            const o = n.__wbindgen_add_to_stack_pointer(-16);
            n.graph_node_children(o, this.__wbg_ptr, _, e, t, r);
            var i = y()[o / 4 + 0],
              s = y()[o / 4 + 1],
              g = v(i, s).slice();
            return n.__wbindgen_free(i, 4 * s, 4), g;
          } finally {
            n.__wbindgen_add_to_stack_pointer(16);
          }
        }
        get_all_retainers(_, e) {
          try {
            const s = n.__wbindgen_add_to_stack_pointer(-16);
            n.graph_get_all_retainers(s, this.__wbg_ptr, _, e);
            var t = y()[s / 4 + 0],
              r = y()[s / 4 + 1],
              i = v(t, r).slice();
            return n.__wbindgen_free(t, 4 * r, 4), i;
          } finally {
            n.__wbindgen_add_to_stack_pointer(16);
          }
        }
      }
      class N {
        static __wrap(_) {
          _ >>>= 0;
          const e = Object.create(N.prototype);
          return (e.__wbg_ptr = _), e;
        }
        __destroy_into_raw() {
          const _ = this.__wbg_ptr;
          return (this.__wbg_ptr = 0), _;
        }
        free() {
          const _ = this.__destroy_into_raw();
          n.__wbg_node_free(_);
        }
        get children_len() {
          return n.__wbg_get_classgroup_children_len(this.__wbg_ptr) >>> 0;
        }
        set children_len(_) {
          n.__wbg_set_classgroup_children_len(this.__wbg_ptr, _);
        }
        get self_size() {
          const _ = n.__wbg_get_classgroup_self_size(this.__wbg_ptr);
          return BigInt.asUintN(64, _);
        }
        set self_size(_) {
          n.__wbg_set_classgroup_self_size(this.__wbg_ptr, _);
        }
        get retained_size() {
          const _ = n.__wbg_get_classgroup_retained_size(this.__wbg_ptr);
          return BigInt.asUintN(64, _);
        }
        set retained_size(_) {
          n.__wbg_set_classgroup_retained_size(this.__wbg_ptr, _);
        }
        get index() {
          return n.__wbg_get_node_index(this.__wbg_ptr) >>> 0;
        }
        set index(_) {
          n.__wbg_set_node_index(this.__wbg_ptr, _);
        }
        get typ() {
          return n.__wbg_get_node_typ(this.__wbg_ptr);
        }
        set typ(_) {
          n.__wbg_set_node_typ(this.__wbg_ptr, _);
        }
        get id() {
          return n.__wbg_get_node_id(this.__wbg_ptr) >>> 0;
        }
        set id(_) {
          n.__wbg_set_node_id(this.__wbg_ptr, _);
        }
        name() {
          let _, e;
          try {
            const i = n.__wbindgen_add_to_stack_pointer(-16);
            n.node_name(i, this.__wbg_ptr);
            var t = y()[i / 4 + 0],
              r = y()[i / 4 + 1];
            return (_ = t), (e = r), o(t, r);
          } finally {
            n.__wbindgen_add_to_stack_pointer(16), n.__wbindgen_free(_, e, 1);
          }
        }
      }
      class O {
        static __wrap(_) {
          _ >>>= 0;
          const e = Object.create(O.prototype);
          return (e.__wbg_ptr = _), e;
        }
        __destroy_into_raw() {
          const _ = this.__wbg_ptr;
          return (this.__wbg_ptr = 0), _;
        }
        free() {
          const _ = this.__destroy_into_raw();
          n.__wbg_retainernode_free(_);
        }
        get retains_index() {
          return n.__wbg_get_retainernode_retains_index(this.__wbg_ptr) >>> 0;
        }
        set retains_index(_) {
          n.__wbg_set_retainernode_retains_index(this.__wbg_ptr, _);
        }
        get children_len() {
          return n.__wbg_get_classgroup_children_len(this.__wbg_ptr) >>> 0;
        }
        set children_len(_) {
          n.__wbg_set_classgroup_children_len(this.__wbg_ptr, _);
        }
        get self_size() {
          const _ = n.__wbg_get_classgroup_self_size(this.__wbg_ptr);
          return BigInt.asUintN(64, _);
        }
        set self_size(_) {
          n.__wbg_set_classgroup_self_size(this.__wbg_ptr, _);
        }
        get retained_size() {
          const _ = n.__wbg_get_classgroup_retained_size(this.__wbg_ptr);
          return BigInt.asUintN(64, _);
        }
        set retained_size(_) {
          n.__wbg_set_classgroup_retained_size(this.__wbg_ptr, _);
        }
        get index() {
          return n.__wbg_get_node_index(this.__wbg_ptr) >>> 0;
        }
        set index(_) {
          n.__wbg_set_node_index(this.__wbg_ptr, _);
        }
        get typ() {
          return n.__wbg_get_retainernode_typ(this.__wbg_ptr);
        }
        set typ(_) {
          n.__wbg_set_retainernode_typ(this.__wbg_ptr, _);
        }
        get id() {
          return n.__wbg_get_node_id(this.__wbg_ptr) >>> 0;
        }
        set id(_) {
          n.__wbg_set_node_id(this.__wbg_ptr, _);
        }
        get edge_typ() {
          return n.__wbg_get_retainernode_edge_typ(this.__wbg_ptr);
        }
        set edge_typ(_) {
          n.__wbg_set_retainernode_edge_typ(this.__wbg_ptr, _);
        }
        name() {
          let _, e;
          try {
            const i = n.__wbindgen_add_to_stack_pointer(-16);
            n.retainernode_name(i, this.__wbg_ptr);
            var t = y()[i / 4 + 0],
              r = y()[i / 4 + 1];
            return (_ = t), (e = r), o(t, r);
          } finally {
            n.__wbindgen_add_to_stack_pointer(16), n.__wbindgen_free(_, e, 1);
          }
        }
      }
      function j(_, e) {
        return c(o(_, e));
      }
      function U(_) {
        b(_);
      }
      function B(_) {
        return c(S.__wrap(_));
      }
      function C(_) {
        return c(N.__wrap(_));
      }
      function E(_) {
        return c(O.__wrap(_));
      }
      function A() {
        return c(new Error());
      }
      function q(_, e) {
        const t = h(l(e).stack, n.__wbindgen_malloc, n.__wbindgen_realloc),
          r = w;
        (y()[_ / 4 + 1] = r), (y()[_ / 4 + 0] = t);
      }
      function R(_, e) {
        let t, r;
        try {
          (t = _), (r = e), console.error(o(_, e));
        } finally {
          n.__wbindgen_free(t, r, 1);
        }
      }
      function T(_, e) {
        throw new Error(o(_, e));
      }
      function H(_, e) {
        const t = l(e),
          r = "string" == typeof t ? t : void 0;
        var i = null == r ? 0 : h(r, n.__wbindgen_malloc, n.__wbindgen_realloc),
          s = w;
        (y()[_ / 4 + 1] = s), (y()[_ / 4 + 0] = i);
      }
    },
    871: (_, e, t) => {
      var n = t(763);
      _.exports = t.v(e, _.id, "a443ca1a33b96237dd48", {
        "./v8_heap_parser_bg.js": {
          __wbindgen_string_new: n.yc,
          __wbindgen_object_drop_ref: n.bk,
          __wbg_classgroup_new: n.Mq,
          __wbg_node_new: n.Rs,
          __wbg_retainernode_new: n.bU,
          __wbg_new_abda76e883ba8a5f: n.V5,
          __wbg_stack_658279fe44541cf6: n.u$,
          __wbg_error_f851667af71bcfc6: n.Xu,
          __wbindgen_throw: n.Qn,
          __wbindgen_string_get: n.qN,
        },
      });
    },
  });
