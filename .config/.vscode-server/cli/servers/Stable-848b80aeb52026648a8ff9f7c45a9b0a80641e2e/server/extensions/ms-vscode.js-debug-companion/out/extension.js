'use strict';
var Eo = Object.create;
var Me = Object.defineProperty;
var vo = Object.getOwnPropertyDescriptor;
var bo = Object.getOwnPropertyNames;
var Co = Object.getPrototypeOf,
  Po = Object.prototype.hasOwnProperty;
var f = (t, e) => () => (e || t((e = { exports: {} }).exports, e), e.exports),
  Oo = (t, e) => {
    for (var r in e) Me(t, r, { get: e[r], enumerable: !0 });
  },
  Hr = (t, e, r, s) => {
    if ((e && typeof e == 'object') || typeof e == 'function')
      for (let n of bo(e))
        !Po.call(t, n) &&
          n !== r &&
          Me(t, n, { get: () => e[n], enumerable: !(s = vo(e, n)) || s.enumerable });
    return t;
  };
var S = (t, e, r) => (
    (r = t != null ? Eo(Co(t)) : {}),
    Hr(e || !t || !t.__esModule ? Me(r, 'default', { value: t, enumerable: !0 }) : r, t)
  ),
  To = t => Hr(Me({}, '__esModule', { value: !0 }), t);
var is = f((Vu, ns) => {
  'use strict';
  var { Duplex: qo } = require('stream');
  function rs(t) {
    t.emit('close');
  }
  function No() {
    !this.destroyed && this._writableState.finished && this.destroy();
  }
  function ss(t) {
    this.removeListener('error', ss),
      this.destroy(),
      this.listenerCount('error') === 0 && this.emit('error', t);
  }
  function Mo(t, e) {
    let r = !0,
      s = new qo({ ...e, autoDestroy: !1, emitClose: !1, objectMode: !1, writableObjectMode: !1 });
    return (
      t.on('message', function (i, o) {
        let a = !o && s._readableState.objectMode ? i.toString() : i;
        s.push(a) || t.pause();
      }),
      t.once('error', function (i) {
        s.destroyed || ((r = !1), s.destroy(i));
      }),
      t.once('close', function () {
        s.destroyed || s.push(null);
      }),
      (s._destroy = function (n, i) {
        if (t.readyState === t.CLOSED) {
          i(n), process.nextTick(rs, s);
          return;
        }
        let o = !1;
        t.once('error', function (c) {
          (o = !0), i(c);
        }),
          t.once('close', function () {
            o || i(n), process.nextTick(rs, s);
          }),
          r && t.terminate();
      }),
      (s._final = function (n) {
        if (t.readyState === t.CONNECTING) {
          t.once('open', function () {
            s._final(n);
          });
          return;
        }
        t._socket !== null &&
          (t._socket._writableState.finished
            ? (n(), s._readableState.endEmitted && s.destroy())
            : (t._socket.once('finish', function () {
                n();
              }),
              t.close()));
      }),
      (s._read = function () {
        t.isPaused && t.resume();
      }),
      (s._write = function (n, i, o) {
        if (t.readyState === t.CONNECTING) {
          t.once('open', function () {
            s._write(n, i, o);
          });
          return;
        }
        t.send(n, o);
      }),
      s.on('end', No),
      s.on('error', ss),
      s
    );
  }
  ns.exports = Mo;
});
var U = f((zu, os) => {
  'use strict';
  os.exports = {
    BINARY_TYPES: ['nodebuffer', 'arraybuffer', 'fragments'],
    EMPTY_BUFFER: Buffer.alloc(0),
    GUID: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',
    kForOnEventAttribute: Symbol('kIsForOnEventAttribute'),
    kListener: Symbol('kListener'),
    kStatusCode: Symbol('status-code'),
    kWebSocket: Symbol('websocket'),
    NOOP: () => {},
  };
});
var ge = f((Ku, Ue) => {
  'use strict';
  var { EMPTY_BUFFER: Fo } = U(),
    Gt = Buffer[Symbol.species];
  function Do(t, e) {
    if (t.length === 0) return Fo;
    if (t.length === 1) return t[0];
    let r = Buffer.allocUnsafe(e),
      s = 0;
    for (let n = 0; n < t.length; n++) {
      let i = t[n];
      r.set(i, s), (s += i.length);
    }
    return s < e ? new Gt(r.buffer, r.byteOffset, s) : r;
  }
  function as(t, e, r, s, n) {
    for (let i = 0; i < n; i++) r[s + i] = t[i] ^ e[i & 3];
  }
  function cs(t, e) {
    for (let r = 0; r < t.length; r++) t[r] ^= e[r & 3];
  }
  function $o(t) {
    return t.length === t.buffer.byteLength
      ? t.buffer
      : t.buffer.slice(t.byteOffset, t.byteOffset + t.length);
  }
  function Wt(t) {
    if (((Wt.readOnly = !0), Buffer.isBuffer(t))) return t;
    let e;
    return (
      t instanceof ArrayBuffer
        ? (e = new Gt(t))
        : ArrayBuffer.isView(t)
          ? (e = new Gt(t.buffer, t.byteOffset, t.byteLength))
          : ((e = Buffer.from(t)), (Wt.readOnly = !1)),
      e
    );
  }
  Ue.exports = { concat: Do, mask: as, toArrayBuffer: $o, toBuffer: Wt, unmask: cs };
  if (!process.env.WS_NO_BUFFER_UTIL)
    try {
      let t = require('bufferutil');
      (Ue.exports.mask = function (e, r, s, n, i) {
        i < 48 ? as(e, r, s, n, i) : t.mask(e, r, s, n, i);
      }),
        (Ue.exports.unmask = function (e, r) {
          e.length < 32 ? cs(e, r) : t.unmask(e, r);
        });
    } catch {}
});
var fs = f((Xu, us) => {
  'use strict';
  var ls = Symbol('kDone'),
    jt = Symbol('kRun'),
    Ht = class {
      constructor(e) {
        (this[ls] = () => {
          this.pending--, this[jt]();
        }),
          (this.concurrency = e || 1 / 0),
          (this.jobs = []),
          (this.pending = 0);
      }
      add(e) {
        this.jobs.push(e), this[jt]();
      }
      [jt]() {
        if (this.pending !== this.concurrency && this.jobs.length) {
          let e = this.jobs.shift();
          this.pending++, e(this[ls]);
        }
      }
    };
  us.exports = Ht;
});
var we = f((Yu, ms) => {
  'use strict';
  var ye = require('zlib'),
    ds = ge(),
    Uo = fs(),
    { kStatusCode: hs } = U(),
    Go = Buffer[Symbol.species],
    Wo = Buffer.from([0, 0, 255, 255]),
    je = Symbol('permessage-deflate'),
    q = Symbol('total-length'),
    _e = Symbol('callback'),
    G = Symbol('buffers'),
    We = Symbol('error'),
    Ge,
    Vt = class {
      constructor(e, r, s) {
        if (
          ((this._maxPayload = s | 0),
          (this._options = e || {}),
          (this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024),
          (this._isServer = !!r),
          (this._deflate = null),
          (this._inflate = null),
          (this.params = null),
          !Ge)
        ) {
          let n = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          Ge = new Uo(n);
        }
      }
      static get extensionName() {
        return 'permessage-deflate';
      }
      offer() {
        let e = {};
        return (
          this._options.serverNoContextTakeover && (e.server_no_context_takeover = !0),
          this._options.clientNoContextTakeover && (e.client_no_context_takeover = !0),
          this._options.serverMaxWindowBits &&
            (e.server_max_window_bits = this._options.serverMaxWindowBits),
          this._options.clientMaxWindowBits
            ? (e.client_max_window_bits = this._options.clientMaxWindowBits)
            : this._options.clientMaxWindowBits == null && (e.client_max_window_bits = !0),
          e
        );
      }
      accept(e) {
        return (
          (e = this.normalizeParams(e)),
          (this.params = this._isServer ? this.acceptAsServer(e) : this.acceptAsClient(e)),
          this.params
        );
      }
      cleanup() {
        if ((this._inflate && (this._inflate.close(), (this._inflate = null)), this._deflate)) {
          let e = this._deflate[_e];
          this._deflate.close(),
            (this._deflate = null),
            e && e(new Error('The deflate stream was closed while data was being processed'));
        }
      }
      acceptAsServer(e) {
        let r = this._options,
          s = e.find(
            n =>
              !(
                (r.serverNoContextTakeover === !1 && n.server_no_context_takeover) ||
                (n.server_max_window_bits &&
                  (r.serverMaxWindowBits === !1 ||
                    (typeof r.serverMaxWindowBits == 'number' &&
                      r.serverMaxWindowBits > n.server_max_window_bits))) ||
                (typeof r.clientMaxWindowBits == 'number' && !n.client_max_window_bits)
              ),
          );
        if (!s) throw new Error('None of the extension offers can be accepted');
        return (
          r.serverNoContextTakeover && (s.server_no_context_takeover = !0),
          r.clientNoContextTakeover && (s.client_no_context_takeover = !0),
          typeof r.serverMaxWindowBits == 'number' &&
            (s.server_max_window_bits = r.serverMaxWindowBits),
          typeof r.clientMaxWindowBits == 'number'
            ? (s.client_max_window_bits = r.clientMaxWindowBits)
            : (s.client_max_window_bits === !0 || r.clientMaxWindowBits === !1) &&
              delete s.client_max_window_bits,
          s
        );
      }
      acceptAsClient(e) {
        let r = e[0];
        if (this._options.clientNoContextTakeover === !1 && r.client_no_context_takeover)
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        if (!r.client_max_window_bits)
          typeof this._options.clientMaxWindowBits == 'number' &&
            (r.client_max_window_bits = this._options.clientMaxWindowBits);
        else if (
          this._options.clientMaxWindowBits === !1 ||
          (typeof this._options.clientMaxWindowBits == 'number' &&
            r.client_max_window_bits > this._options.clientMaxWindowBits)
        )
          throw new Error('Unexpected or invalid parameter "client_max_window_bits"');
        return r;
      }
      normalizeParams(e) {
        return (
          e.forEach(r => {
            Object.keys(r).forEach(s => {
              let n = r[s];
              if (n.length > 1) throw new Error(`Parameter "${s}" must have only a single value`);
              if (((n = n[0]), s === 'client_max_window_bits')) {
                if (n !== !0) {
                  let i = +n;
                  if (!Number.isInteger(i) || i < 8 || i > 15)
                    throw new TypeError(`Invalid value for parameter "${s}": ${n}`);
                  n = i;
                } else if (!this._isServer)
                  throw new TypeError(`Invalid value for parameter "${s}": ${n}`);
              } else if (s === 'server_max_window_bits') {
                let i = +n;
                if (!Number.isInteger(i) || i < 8 || i > 15)
                  throw new TypeError(`Invalid value for parameter "${s}": ${n}`);
                n = i;
              } else if (s === 'client_no_context_takeover' || s === 'server_no_context_takeover') {
                if (n !== !0) throw new TypeError(`Invalid value for parameter "${s}": ${n}`);
              } else throw new Error(`Unknown parameter "${s}"`);
              r[s] = n;
            });
          }),
          e
        );
      }
      decompress(e, r, s) {
        Ge.add(n => {
          this._decompress(e, r, (i, o) => {
            n(), s(i, o);
          });
        });
      }
      compress(e, r, s) {
        Ge.add(n => {
          this._compress(e, r, (i, o) => {
            n(), s(i, o);
          });
        });
      }
      _decompress(e, r, s) {
        let n = this._isServer ? 'client' : 'server';
        if (!this._inflate) {
          let i = `${n}_max_window_bits`,
            o = typeof this.params[i] != 'number' ? ye.Z_DEFAULT_WINDOWBITS : this.params[i];
          (this._inflate = ye.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits: o,
          })),
            (this._inflate[je] = this),
            (this._inflate[q] = 0),
            (this._inflate[G] = []),
            this._inflate.on('error', Ho),
            this._inflate.on('data', ps);
        }
        (this._inflate[_e] = s),
          this._inflate.write(e),
          r && this._inflate.write(Wo),
          this._inflate.flush(() => {
            let i = this._inflate[We];
            if (i) {
              this._inflate.close(), (this._inflate = null), s(i);
              return;
            }
            let o = ds.concat(this._inflate[G], this._inflate[q]);
            this._inflate._readableState.endEmitted
              ? (this._inflate.close(), (this._inflate = null))
              : ((this._inflate[q] = 0),
                (this._inflate[G] = []),
                r && this.params[`${n}_no_context_takeover`] && this._inflate.reset()),
              s(null, o);
          });
      }
      _compress(e, r, s) {
        let n = this._isServer ? 'server' : 'client';
        if (!this._deflate) {
          let i = `${n}_max_window_bits`,
            o = typeof this.params[i] != 'number' ? ye.Z_DEFAULT_WINDOWBITS : this.params[i];
          (this._deflate = ye.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits: o,
          })),
            (this._deflate[q] = 0),
            (this._deflate[G] = []),
            this._deflate.on('data', jo);
        }
        (this._deflate[_e] = s),
          this._deflate.write(e),
          this._deflate.flush(ye.Z_SYNC_FLUSH, () => {
            if (!this._deflate) return;
            let i = ds.concat(this._deflate[G], this._deflate[q]);
            r && (i = new Go(i.buffer, i.byteOffset, i.length - 4)),
              (this._deflate[_e] = null),
              (this._deflate[q] = 0),
              (this._deflate[G] = []),
              r && this.params[`${n}_no_context_takeover`] && this._deflate.reset(),
              s(null, i);
          });
      }
    };
  ms.exports = Vt;
  function jo(t) {
    this[G].push(t), (this[q] += t.length);
  }
  function ps(t) {
    if (((this[q] += t.length), this[je]._maxPayload < 1 || this[q] <= this[je]._maxPayload)) {
      this[G].push(t);
      return;
    }
    (this[We] = new RangeError('Max payload size exceeded')),
      (this[We].code = 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH'),
      (this[We][hs] = 1009),
      this.removeListener('data', ps),
      this.reset();
  }
  function Ho(t) {
    (this[je]._inflate = null), (t[hs] = 1007), this[_e](t);
  }
});
var xe = f((Qu, He) => {
  'use strict';
  var { isUtf8: gs } = require('buffer'),
    Vo = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
      0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      1, 0, 1, 0,
    ];
  function zo(t) {
    return (
      (t >= 1e3 && t <= 1014 && t !== 1004 && t !== 1005 && t !== 1006) || (t >= 3e3 && t <= 4999)
    );
  }
  function zt(t) {
    let e = t.length,
      r = 0;
    for (; r < e; )
      if (!(t[r] & 128)) r++;
      else if ((t[r] & 224) === 192) {
        if (r + 1 === e || (t[r + 1] & 192) !== 128 || (t[r] & 254) === 192) return !1;
        r += 2;
      } else if ((t[r] & 240) === 224) {
        if (
          r + 2 >= e ||
          (t[r + 1] & 192) !== 128 ||
          (t[r + 2] & 192) !== 128 ||
          (t[r] === 224 && (t[r + 1] & 224) === 128) ||
          (t[r] === 237 && (t[r + 1] & 224) === 160)
        )
          return !1;
        r += 3;
      } else if ((t[r] & 248) === 240) {
        if (
          r + 3 >= e ||
          (t[r + 1] & 192) !== 128 ||
          (t[r + 2] & 192) !== 128 ||
          (t[r + 3] & 192) !== 128 ||
          (t[r] === 240 && (t[r + 1] & 240) === 128) ||
          (t[r] === 244 && t[r + 1] > 143) ||
          t[r] > 244
        )
          return !1;
        r += 4;
      } else return !1;
    return !0;
  }
  He.exports = { isValidStatusCode: zo, isValidUTF8: zt, tokenChars: Vo };
  if (gs)
    He.exports.isValidUTF8 = function (t) {
      return t.length < 24 ? zt(t) : gs(t);
    };
  else if (!process.env.WS_NO_UTF_8_VALIDATE)
    try {
      let t = require('utf-8-validate');
      He.exports.isValidUTF8 = function (e) {
        return e.length < 32 ? zt(e) : t(e);
      };
    } catch {}
});
var Zt = f((Zu, vs) => {
  'use strict';
  var { Writable: Ko } = require('stream'),
    ys = we(),
    { BINARY_TYPES: Xo, EMPTY_BUFFER: _s, kStatusCode: Yo, kWebSocket: Qo } = U(),
    { concat: Kt, toArrayBuffer: Zo, unmask: Jo } = ge(),
    { isValidStatusCode: ea, isValidUTF8: ws } = xe(),
    Ve = Buffer[Symbol.species],
    T = 0,
    xs = 1,
    Ss = 2,
    Es = 3,
    Xt = 4,
    Yt = 5,
    ze = 6,
    Qt = class extends Ko {
      constructor(e = {}) {
        super(),
          (this._allowSynchronousEvents =
            e.allowSynchronousEvents !== void 0 ? e.allowSynchronousEvents : !0),
          (this._binaryType = e.binaryType || Xo[0]),
          (this._extensions = e.extensions || {}),
          (this._isServer = !!e.isServer),
          (this._maxPayload = e.maxPayload | 0),
          (this._skipUTF8Validation = !!e.skipUTF8Validation),
          (this[Qo] = void 0),
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
          (this._state = T);
      }
      _write(e, r, s) {
        if (this._opcode === 8 && this._state == T) return s();
        (this._bufferedBytes += e.length), this._buffers.push(e), this.startLoop(s);
      }
      consume(e) {
        if (((this._bufferedBytes -= e), e === this._buffers[0].length))
          return this._buffers.shift();
        if (e < this._buffers[0].length) {
          let s = this._buffers[0];
          return (
            (this._buffers[0] = new Ve(s.buffer, s.byteOffset + e, s.length - e)),
            new Ve(s.buffer, s.byteOffset, e)
          );
        }
        let r = Buffer.allocUnsafe(e);
        do {
          let s = this._buffers[0],
            n = r.length - e;
          e >= s.length
            ? r.set(this._buffers.shift(), n)
            : (r.set(new Uint8Array(s.buffer, s.byteOffset, e), n),
              (this._buffers[0] = new Ve(s.buffer, s.byteOffset + e, s.length - e))),
            (e -= s.length);
        } while (e > 0);
        return r;
      }
      startLoop(e) {
        this._loop = !0;
        do
          switch (this._state) {
            case T:
              this.getInfo(e);
              break;
            case xs:
              this.getPayloadLength16(e);
              break;
            case Ss:
              this.getPayloadLength64(e);
              break;
            case Es:
              this.getMask();
              break;
            case Xt:
              this.getData(e);
              break;
            case Yt:
            case ze:
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
        let r = this.consume(2);
        if (r[0] & 48) {
          let n = this.createError(
            RangeError,
            'RSV2 and RSV3 must be clear',
            !0,
            1002,
            'WS_ERR_UNEXPECTED_RSV_2_3',
          );
          e(n);
          return;
        }
        let s = (r[0] & 64) === 64;
        if (s && !this._extensions[ys.extensionName]) {
          let n = this.createError(
            RangeError,
            'RSV1 must be clear',
            !0,
            1002,
            'WS_ERR_UNEXPECTED_RSV_1',
          );
          e(n);
          return;
        }
        if (
          ((this._fin = (r[0] & 128) === 128),
          (this._opcode = r[0] & 15),
          (this._payloadLength = r[1] & 127),
          this._opcode === 0)
        ) {
          if (s) {
            let n = this.createError(
              RangeError,
              'RSV1 must be clear',
              !0,
              1002,
              'WS_ERR_UNEXPECTED_RSV_1',
            );
            e(n);
            return;
          }
          if (!this._fragmented) {
            let n = this.createError(
              RangeError,
              'invalid opcode 0',
              !0,
              1002,
              'WS_ERR_INVALID_OPCODE',
            );
            e(n);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            let n = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              !0,
              1002,
              'WS_ERR_INVALID_OPCODE',
            );
            e(n);
            return;
          }
          this._compressed = s;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            let n = this.createError(
              RangeError,
              'FIN must be set',
              !0,
              1002,
              'WS_ERR_EXPECTED_FIN',
            );
            e(n);
            return;
          }
          if (s) {
            let n = this.createError(
              RangeError,
              'RSV1 must be clear',
              !0,
              1002,
              'WS_ERR_UNEXPECTED_RSV_1',
            );
            e(n);
            return;
          }
          if (this._payloadLength > 125 || (this._opcode === 8 && this._payloadLength === 1)) {
            let n = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              !0,
              1002,
              'WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH',
            );
            e(n);
            return;
          }
        } else {
          let n = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            !0,
            1002,
            'WS_ERR_INVALID_OPCODE',
          );
          e(n);
          return;
        }
        if (
          (!this._fin && !this._fragmented && (this._fragmented = this._opcode),
          (this._masked = (r[1] & 128) === 128),
          this._isServer)
        ) {
          if (!this._masked) {
            let n = this.createError(
              RangeError,
              'MASK must be set',
              !0,
              1002,
              'WS_ERR_EXPECTED_MASK',
            );
            e(n);
            return;
          }
        } else if (this._masked) {
          let n = this.createError(
            RangeError,
            'MASK must be clear',
            !0,
            1002,
            'WS_ERR_UNEXPECTED_MASK',
          );
          e(n);
          return;
        }
        this._payloadLength === 126
          ? (this._state = xs)
          : this._payloadLength === 127
            ? (this._state = Ss)
            : this.haveLength(e);
      }
      getPayloadLength16(e) {
        if (this._bufferedBytes < 2) {
          this._loop = !1;
          return;
        }
        (this._payloadLength = this.consume(2).readUInt16BE(0)), this.haveLength(e);
      }
      getPayloadLength64(e) {
        if (this._bufferedBytes < 8) {
          this._loop = !1;
          return;
        }
        let r = this.consume(8),
          s = r.readUInt32BE(0);
        if (s > Math.pow(2, 21) - 1) {
          let n = this.createError(
            RangeError,
            'Unsupported WebSocket frame: payload length > 2^53 - 1',
            !1,
            1009,
            'WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH',
          );
          e(n);
          return;
        }
        (this._payloadLength = s * Math.pow(2, 32) + r.readUInt32BE(4)), this.haveLength(e);
      }
      haveLength(e) {
        if (
          this._payloadLength &&
          this._opcode < 8 &&
          ((this._totalPayloadLength += this._payloadLength),
          this._totalPayloadLength > this._maxPayload && this._maxPayload > 0)
        ) {
          let r = this.createError(
            RangeError,
            'Max payload size exceeded',
            !1,
            1009,
            'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH',
          );
          e(r);
          return;
        }
        this._masked ? (this._state = Es) : (this._state = Xt);
      }
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = !1;
          return;
        }
        (this._mask = this.consume(4)), (this._state = Xt);
      }
      getData(e) {
        let r = _s;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = !1;
            return;
          }
          (r = this.consume(this._payloadLength)),
            this._masked &&
              this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3] &&
              Jo(r, this._mask);
        }
        if (this._opcode > 7) {
          this.controlMessage(r, e);
          return;
        }
        if (this._compressed) {
          (this._state = Yt), this.decompress(r, e);
          return;
        }
        r.length && ((this._messageLength = this._totalPayloadLength), this._fragments.push(r)),
          this.dataMessage(e);
      }
      decompress(e, r) {
        this._extensions[ys.extensionName].decompress(e, this._fin, (n, i) => {
          if (n) return r(n);
          if (i.length) {
            if (
              ((this._messageLength += i.length),
              this._messageLength > this._maxPayload && this._maxPayload > 0)
            ) {
              let o = this.createError(
                RangeError,
                'Max payload size exceeded',
                !1,
                1009,
                'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH',
              );
              r(o);
              return;
            }
            this._fragments.push(i);
          }
          this.dataMessage(r), this._state === T && this.startLoop(r);
        });
      }
      dataMessage(e) {
        if (!this._fin) {
          this._state = T;
          return;
        }
        let r = this._messageLength,
          s = this._fragments;
        if (
          ((this._totalPayloadLength = 0),
          (this._messageLength = 0),
          (this._fragmented = 0),
          (this._fragments = []),
          this._opcode === 2)
        ) {
          let n;
          this._binaryType === 'nodebuffer'
            ? (n = Kt(s, r))
            : this._binaryType === 'arraybuffer'
              ? (n = Zo(Kt(s, r)))
              : (n = s),
            this._allowSynchronousEvents
              ? (this.emit('message', n, !0), (this._state = T))
              : ((this._state = ze),
                setImmediate(() => {
                  this.emit('message', n, !0), (this._state = T), this.startLoop(e);
                }));
        } else {
          let n = Kt(s, r);
          if (!this._skipUTF8Validation && !ws(n)) {
            let i = this.createError(
              Error,
              'invalid UTF-8 sequence',
              !0,
              1007,
              'WS_ERR_INVALID_UTF8',
            );
            e(i);
            return;
          }
          this._state === Yt || this._allowSynchronousEvents
            ? (this.emit('message', n, !1), (this._state = T))
            : ((this._state = ze),
              setImmediate(() => {
                this.emit('message', n, !1), (this._state = T), this.startLoop(e);
              }));
        }
      }
      controlMessage(e, r) {
        if (this._opcode === 8) {
          if (e.length === 0) (this._loop = !1), this.emit('conclude', 1005, _s), this.end();
          else {
            let s = e.readUInt16BE(0);
            if (!ea(s)) {
              let i = this.createError(
                RangeError,
                `invalid status code ${s}`,
                !0,
                1002,
                'WS_ERR_INVALID_CLOSE_CODE',
              );
              r(i);
              return;
            }
            let n = new Ve(e.buffer, e.byteOffset + 2, e.length - 2);
            if (!this._skipUTF8Validation && !ws(n)) {
              let i = this.createError(
                Error,
                'invalid UTF-8 sequence',
                !0,
                1007,
                'WS_ERR_INVALID_UTF8',
              );
              r(i);
              return;
            }
            (this._loop = !1), this.emit('conclude', s, n), this.end();
          }
          this._state = T;
          return;
        }
        this._allowSynchronousEvents
          ? (this.emit(this._opcode === 9 ? 'ping' : 'pong', e), (this._state = T))
          : ((this._state = ze),
            setImmediate(() => {
              this.emit(this._opcode === 9 ? 'ping' : 'pong', e),
                (this._state = T),
                this.startLoop(r);
            }));
      }
      createError(e, r, s, n, i) {
        (this._loop = !1), (this._errored = !0);
        let o = new e(s ? `Invalid WebSocket frame: ${r}` : r);
        return Error.captureStackTrace(o, this.createError), (o.code = i), (o[Yo] = n), o;
      }
    };
  vs.exports = Qt;
});
var er = f((ef, Ps) => {
  'use strict';
  var { Duplex: Ju } = require('stream'),
    { randomFillSync: ta } = require('crypto'),
    bs = we(),
    { EMPTY_BUFFER: ra } = U(),
    { isValidStatusCode: sa } = xe(),
    { mask: Cs, toBuffer: J } = ge(),
    I = Symbol('kByteLength'),
    na = Buffer.alloc(4),
    Ke = 8 * 1024,
    H,
    ee = Ke,
    Jt = class t {
      constructor(e, r, s) {
        (this._extensions = r || {}),
          s && ((this._generateMask = s), (this._maskBuffer = Buffer.alloc(4))),
          (this._socket = e),
          (this._firstFragment = !0),
          (this._compress = !1),
          (this._bufferedBytes = 0),
          (this._deflating = !1),
          (this._queue = []);
      }
      static frame(e, r) {
        let s,
          n = !1,
          i = 2,
          o = !1;
        r.mask &&
          ((s = r.maskBuffer || na),
          r.generateMask
            ? r.generateMask(s)
            : (ee === Ke && (H === void 0 && (H = Buffer.alloc(Ke)), ta(H, 0, Ke), (ee = 0)),
              (s[0] = H[ee++]),
              (s[1] = H[ee++]),
              (s[2] = H[ee++]),
              (s[3] = H[ee++])),
          (o = (s[0] | s[1] | s[2] | s[3]) === 0),
          (i = 6));
        let a;
        typeof e == 'string'
          ? (!r.mask || o) && r[I] !== void 0
            ? (a = r[I])
            : ((e = Buffer.from(e)), (a = e.length))
          : ((a = e.length), (n = r.mask && r.readOnly && !o));
        let c = a;
        a >= 65536 ? ((i += 8), (c = 127)) : a > 125 && ((i += 2), (c = 126));
        let l = Buffer.allocUnsafe(n ? a + i : i);
        return (
          (l[0] = r.fin ? r.opcode | 128 : r.opcode),
          r.rsv1 && (l[0] |= 64),
          (l[1] = c),
          c === 126
            ? l.writeUInt16BE(a, 2)
            : c === 127 && ((l[2] = l[3] = 0), l.writeUIntBE(a, 4, 6)),
          r.mask
            ? ((l[1] |= 128),
              (l[i - 4] = s[0]),
              (l[i - 3] = s[1]),
              (l[i - 2] = s[2]),
              (l[i - 1] = s[3]),
              o ? [l, e] : n ? (Cs(e, s, l, i, a), [l]) : (Cs(e, s, e, 0, a), [l, e]))
            : [l, e]
        );
      }
      close(e, r, s, n) {
        let i;
        if (e === void 0) i = ra;
        else {
          if (typeof e != 'number' || !sa(e))
            throw new TypeError('First argument must be a valid error code number');
          if (r === void 0 || !r.length) (i = Buffer.allocUnsafe(2)), i.writeUInt16BE(e, 0);
          else {
            let a = Buffer.byteLength(r);
            if (a > 123) throw new RangeError('The message must not be greater than 123 bytes');
            (i = Buffer.allocUnsafe(2 + a)),
              i.writeUInt16BE(e, 0),
              typeof r == 'string' ? i.write(r, 2) : i.set(r, 2);
          }
        }
        let o = {
          [I]: i.length,
          fin: !0,
          generateMask: this._generateMask,
          mask: s,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: !1,
          rsv1: !1,
        };
        this._deflating
          ? this.enqueue([this.dispatch, i, !1, o, n])
          : this.sendFrame(t.frame(i, o), n);
      }
      ping(e, r, s) {
        let n, i;
        if (
          (typeof e == 'string'
            ? ((n = Buffer.byteLength(e)), (i = !1))
            : ((e = J(e)), (n = e.length), (i = J.readOnly)),
          n > 125)
        )
          throw new RangeError('The data size must not be greater than 125 bytes');
        let o = {
          [I]: n,
          fin: !0,
          generateMask: this._generateMask,
          mask: r,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly: i,
          rsv1: !1,
        };
        this._deflating
          ? this.enqueue([this.dispatch, e, !1, o, s])
          : this.sendFrame(t.frame(e, o), s);
      }
      pong(e, r, s) {
        let n, i;
        if (
          (typeof e == 'string'
            ? ((n = Buffer.byteLength(e)), (i = !1))
            : ((e = J(e)), (n = e.length), (i = J.readOnly)),
          n > 125)
        )
          throw new RangeError('The data size must not be greater than 125 bytes');
        let o = {
          [I]: n,
          fin: !0,
          generateMask: this._generateMask,
          mask: r,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly: i,
          rsv1: !1,
        };
        this._deflating
          ? this.enqueue([this.dispatch, e, !1, o, s])
          : this.sendFrame(t.frame(e, o), s);
      }
      send(e, r, s) {
        let n = this._extensions[bs.extensionName],
          i = r.binary ? 2 : 1,
          o = r.compress,
          a,
          c;
        if (
          (typeof e == 'string'
            ? ((a = Buffer.byteLength(e)), (c = !1))
            : ((e = J(e)), (a = e.length), (c = J.readOnly)),
          this._firstFragment
            ? ((this._firstFragment = !1),
              o &&
                n &&
                n.params[
                  n._isServer ? 'server_no_context_takeover' : 'client_no_context_takeover'
                ] &&
                (o = a >= n._threshold),
              (this._compress = o))
            : ((o = !1), (i = 0)),
          r.fin && (this._firstFragment = !0),
          n)
        ) {
          let l = {
            [I]: a,
            fin: r.fin,
            generateMask: this._generateMask,
            mask: r.mask,
            maskBuffer: this._maskBuffer,
            opcode: i,
            readOnly: c,
            rsv1: o,
          };
          this._deflating
            ? this.enqueue([this.dispatch, e, this._compress, l, s])
            : this.dispatch(e, this._compress, l, s);
        } else
          this.sendFrame(
            t.frame(e, {
              [I]: a,
              fin: r.fin,
              generateMask: this._generateMask,
              mask: r.mask,
              maskBuffer: this._maskBuffer,
              opcode: i,
              readOnly: c,
              rsv1: !1,
            }),
            s,
          );
      }
      dispatch(e, r, s, n) {
        if (!r) {
          this.sendFrame(t.frame(e, s), n);
          return;
        }
        let i = this._extensions[bs.extensionName];
        (this._bufferedBytes += s[I]),
          (this._deflating = !0),
          i.compress(e, s.fin, (o, a) => {
            if (this._socket.destroyed) {
              let c = new Error('The socket was closed while data was being compressed');
              typeof n == 'function' && n(c);
              for (let l = 0; l < this._queue.length; l++) {
                let u = this._queue[l],
                  d = u[u.length - 1];
                typeof d == 'function' && d(c);
              }
              return;
            }
            (this._bufferedBytes -= s[I]),
              (this._deflating = !1),
              (s.readOnly = !1),
              this.sendFrame(t.frame(a, s), n),
              this.dequeue();
          });
      }
      dequeue() {
        for (; !this._deflating && this._queue.length; ) {
          let e = this._queue.shift();
          (this._bufferedBytes -= e[3][I]), Reflect.apply(e[0], this, e.slice(1));
        }
      }
      enqueue(e) {
        (this._bufferedBytes += e[3][I]), this._queue.push(e);
      }
      sendFrame(e, r) {
        e.length === 2
          ? (this._socket.cork(),
            this._socket.write(e[0]),
            this._socket.write(e[1], r),
            this._socket.uncork())
          : this._socket.write(e[0], r);
      }
    };
  Ps.exports = Jt;
});
var qs = f((tf, Bs) => {
  'use strict';
  var { kForOnEventAttribute: Se, kListener: tr } = U(),
    Os = Symbol('kCode'),
    Ts = Symbol('kData'),
    ks = Symbol('kError'),
    Is = Symbol('kMessage'),
    As = Symbol('kReason'),
    te = Symbol('kTarget'),
    Ls = Symbol('kType'),
    Rs = Symbol('kWasClean'),
    N = class {
      constructor(e) {
        (this[te] = null), (this[Ls] = e);
      }
      get target() {
        return this[te];
      }
      get type() {
        return this[Ls];
      }
    };
  Object.defineProperty(N.prototype, 'target', { enumerable: !0 });
  Object.defineProperty(N.prototype, 'type', { enumerable: !0 });
  var V = class extends N {
    constructor(e, r = {}) {
      super(e),
        (this[Os] = r.code === void 0 ? 0 : r.code),
        (this[As] = r.reason === void 0 ? '' : r.reason),
        (this[Rs] = r.wasClean === void 0 ? !1 : r.wasClean);
    }
    get code() {
      return this[Os];
    }
    get reason() {
      return this[As];
    }
    get wasClean() {
      return this[Rs];
    }
  };
  Object.defineProperty(V.prototype, 'code', { enumerable: !0 });
  Object.defineProperty(V.prototype, 'reason', { enumerable: !0 });
  Object.defineProperty(V.prototype, 'wasClean', { enumerable: !0 });
  var re = class extends N {
    constructor(e, r = {}) {
      super(e),
        (this[ks] = r.error === void 0 ? null : r.error),
        (this[Is] = r.message === void 0 ? '' : r.message);
    }
    get error() {
      return this[ks];
    }
    get message() {
      return this[Is];
    }
  };
  Object.defineProperty(re.prototype, 'error', { enumerable: !0 });
  Object.defineProperty(re.prototype, 'message', { enumerable: !0 });
  var Ee = class extends N {
    constructor(e, r = {}) {
      super(e), (this[Ts] = r.data === void 0 ? null : r.data);
    }
    get data() {
      return this[Ts];
    }
  };
  Object.defineProperty(Ee.prototype, 'data', { enumerable: !0 });
  var ia = {
    addEventListener(t, e, r = {}) {
      for (let n of this.listeners(t)) if (!r[Se] && n[tr] === e && !n[Se]) return;
      let s;
      if (t === 'message')
        s = function (i, o) {
          let a = new Ee('message', { data: o ? i : i.toString() });
          (a[te] = this), Xe(e, this, a);
        };
      else if (t === 'close')
        s = function (i, o) {
          let a = new V('close', {
            code: i,
            reason: o.toString(),
            wasClean: this._closeFrameReceived && this._closeFrameSent,
          });
          (a[te] = this), Xe(e, this, a);
        };
      else if (t === 'error')
        s = function (i) {
          let o = new re('error', { error: i, message: i.message });
          (o[te] = this), Xe(e, this, o);
        };
      else if (t === 'open')
        s = function () {
          let i = new N('open');
          (i[te] = this), Xe(e, this, i);
        };
      else return;
      (s[Se] = !!r[Se]), (s[tr] = e), r.once ? this.once(t, s) : this.on(t, s);
    },
    removeEventListener(t, e) {
      for (let r of this.listeners(t))
        if (r[tr] === e && !r[Se]) {
          this.removeListener(t, r);
          break;
        }
    },
  };
  Bs.exports = { CloseEvent: V, ErrorEvent: re, Event: N, EventTarget: ia, MessageEvent: Ee };
  function Xe(t, e, r) {
    typeof t == 'object' && t.handleEvent ? t.handleEvent.call(t, r) : t.call(e, r);
  }
});
var rr = f((rf, Ns) => {
  'use strict';
  var { tokenChars: ve } = xe();
  function L(t, e, r) {
    t[e] === void 0 ? (t[e] = [r]) : t[e].push(r);
  }
  function oa(t) {
    let e = Object.create(null),
      r = Object.create(null),
      s = !1,
      n = !1,
      i = !1,
      o,
      a,
      c = -1,
      l = -1,
      u = -1,
      d = 0;
    for (; d < t.length; d++)
      if (((l = t.charCodeAt(d)), o === void 0))
        if (u === -1 && ve[l] === 1) c === -1 && (c = d);
        else if (d !== 0 && (l === 32 || l === 9)) u === -1 && c !== -1 && (u = d);
        else if (l === 59 || l === 44) {
          if (c === -1) throw new SyntaxError(`Unexpected character at index ${d}`);
          u === -1 && (u = d);
          let g = t.slice(c, u);
          l === 44 ? (L(e, g, r), (r = Object.create(null))) : (o = g), (c = u = -1);
        } else throw new SyntaxError(`Unexpected character at index ${d}`);
      else if (a === void 0)
        if (u === -1 && ve[l] === 1) c === -1 && (c = d);
        else if (l === 32 || l === 9) u === -1 && c !== -1 && (u = d);
        else if (l === 59 || l === 44) {
          if (c === -1) throw new SyntaxError(`Unexpected character at index ${d}`);
          u === -1 && (u = d),
            L(r, t.slice(c, u), !0),
            l === 44 && (L(e, o, r), (r = Object.create(null)), (o = void 0)),
            (c = u = -1);
        } else if (l === 61 && c !== -1 && u === -1) (a = t.slice(c, d)), (c = u = -1);
        else throw new SyntaxError(`Unexpected character at index ${d}`);
      else if (n) {
        if (ve[l] !== 1) throw new SyntaxError(`Unexpected character at index ${d}`);
        c === -1 ? (c = d) : s || (s = !0), (n = !1);
      } else if (i)
        if (ve[l] === 1) c === -1 && (c = d);
        else if (l === 34 && c !== -1) (i = !1), (u = d);
        else if (l === 92) n = !0;
        else throw new SyntaxError(`Unexpected character at index ${d}`);
      else if (l === 34 && t.charCodeAt(d - 1) === 61) i = !0;
      else if (u === -1 && ve[l] === 1) c === -1 && (c = d);
      else if (c !== -1 && (l === 32 || l === 9)) u === -1 && (u = d);
      else if (l === 59 || l === 44) {
        if (c === -1) throw new SyntaxError(`Unexpected character at index ${d}`);
        u === -1 && (u = d);
        let g = t.slice(c, u);
        s && ((g = g.replace(/\\/g, '')), (s = !1)),
          L(r, a, g),
          l === 44 && (L(e, o, r), (r = Object.create(null)), (o = void 0)),
          (a = void 0),
          (c = u = -1);
      } else throw new SyntaxError(`Unexpected character at index ${d}`);
    if (c === -1 || i || l === 32 || l === 9) throw new SyntaxError('Unexpected end of input');
    u === -1 && (u = d);
    let p = t.slice(c, u);
    return (
      o === void 0
        ? L(e, p, r)
        : (a === void 0 ? L(r, p, !0) : s ? L(r, a, p.replace(/\\/g, '')) : L(r, a, p), L(e, o, r)),
      e
    );
  }
  function aa(t) {
    return Object.keys(t)
      .map(e => {
        let r = t[e];
        return (
          Array.isArray(r) || (r = [r]),
          r
            .map(s =>
              [e]
                .concat(
                  Object.keys(s).map(n => {
                    let i = s[n];
                    return (
                      Array.isArray(i) || (i = [i]),
                      i.map(o => (o === !0 ? n : `${n}=${o}`)).join('; ')
                    );
                  }),
                )
                .join('; '),
            )
            .join(', ')
        );
      })
      .join(', ');
  }
  Ns.exports = { format: aa, parse: oa };
});
var ar = f((of, zs) => {
  'use strict';
  var ca = require('events'),
    la = require('https'),
    ua = require('http'),
    Ds = require('net'),
    fa = require('tls'),
    { randomBytes: da, createHash: ha } = require('crypto'),
    { Duplex: sf, Readable: nf } = require('stream'),
    { URL: sr } = require('url'),
    W = we(),
    pa = Zt(),
    ma = er(),
    {
      BINARY_TYPES: Ms,
      EMPTY_BUFFER: Ye,
      GUID: ga,
      kForOnEventAttribute: nr,
      kListener: ya,
      kStatusCode: _a,
      kWebSocket: E,
      NOOP: $s,
    } = U(),
    {
      EventTarget: { addEventListener: wa, removeEventListener: xa },
    } = qs(),
    { format: Sa, parse: Ea } = rr(),
    { toBuffer: va } = ge(),
    ba = 30 * 1e3,
    Us = Symbol('kAborted'),
    ir = [8, 13],
    M = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'],
    Ca = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/,
    w = class t extends ca {
      constructor(e, r, s) {
        super(),
          (this._binaryType = Ms[0]),
          (this._closeCode = 1006),
          (this._closeFrameReceived = !1),
          (this._closeFrameSent = !1),
          (this._closeMessage = Ye),
          (this._closeTimer = null),
          (this._extensions = {}),
          (this._paused = !1),
          (this._protocol = ''),
          (this._readyState = t.CONNECTING),
          (this._receiver = null),
          (this._sender = null),
          (this._socket = null),
          e !== null
            ? ((this._bufferedAmount = 0),
              (this._isServer = !1),
              (this._redirects = 0),
              r === void 0
                ? (r = [])
                : Array.isArray(r) ||
                  (typeof r == 'object' && r !== null ? ((s = r), (r = [])) : (r = [r])),
              Gs(this, e, r, s))
            : ((this._autoPong = s.autoPong), (this._isServer = !0));
      }
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(e) {
        Ms.includes(e) &&
          ((this._binaryType = e), this._receiver && (this._receiver._binaryType = e));
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
      setSocket(e, r, s) {
        let n = new pa({
          allowSynchronousEvents: s.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxPayload: s.maxPayload,
          skipUTF8Validation: s.skipUTF8Validation,
        });
        (this._sender = new ma(e, this._extensions, s.generateMask)),
          (this._receiver = n),
          (this._socket = e),
          (n[E] = this),
          (e[E] = this),
          n.on('conclude', Ta),
          n.on('drain', ka),
          n.on('error', Ia),
          n.on('message', Aa),
          n.on('ping', La),
          n.on('pong', Ra),
          e.setTimeout && e.setTimeout(0),
          e.setNoDelay && e.setNoDelay(),
          r.length > 0 && e.unshift(r),
          e.on('close', js),
          e.on('data', Ze),
          e.on('end', Hs),
          e.on('error', Vs),
          (this._readyState = t.OPEN),
          this.emit('open');
      }
      emitClose() {
        if (!this._socket) {
          (this._readyState = t.CLOSED), this.emit('close', this._closeCode, this._closeMessage);
          return;
        }
        this._extensions[W.extensionName] && this._extensions[W.extensionName].cleanup(),
          this._receiver.removeAllListeners(),
          (this._readyState = t.CLOSED),
          this.emit('close', this._closeCode, this._closeMessage);
      }
      close(e, r) {
        if (this.readyState !== t.CLOSED) {
          if (this.readyState === t.CONNECTING) {
            C(this, this._req, 'WebSocket was closed before the connection was established');
            return;
          }
          if (this.readyState === t.CLOSING) {
            this._closeFrameSent &&
              (this._closeFrameReceived || this._receiver._writableState.errorEmitted) &&
              this._socket.end();
            return;
          }
          (this._readyState = t.CLOSING),
            this._sender.close(e, r, !this._isServer, s => {
              s ||
                ((this._closeFrameSent = !0),
                (this._closeFrameReceived || this._receiver._writableState.errorEmitted) &&
                  this._socket.end());
            }),
            (this._closeTimer = setTimeout(this._socket.destroy.bind(this._socket), ba));
        }
      }
      pause() {
        this.readyState === t.CONNECTING ||
          this.readyState === t.CLOSED ||
          ((this._paused = !0), this._socket.pause());
      }
      ping(e, r, s) {
        if (this.readyState === t.CONNECTING)
          throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
        if (
          (typeof e == 'function'
            ? ((s = e), (e = r = void 0))
            : typeof r == 'function' && ((s = r), (r = void 0)),
          typeof e == 'number' && (e = e.toString()),
          this.readyState !== t.OPEN)
        ) {
          or(this, e, s);
          return;
        }
        r === void 0 && (r = !this._isServer), this._sender.ping(e || Ye, r, s);
      }
      pong(e, r, s) {
        if (this.readyState === t.CONNECTING)
          throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
        if (
          (typeof e == 'function'
            ? ((s = e), (e = r = void 0))
            : typeof r == 'function' && ((s = r), (r = void 0)),
          typeof e == 'number' && (e = e.toString()),
          this.readyState !== t.OPEN)
        ) {
          or(this, e, s);
          return;
        }
        r === void 0 && (r = !this._isServer), this._sender.pong(e || Ye, r, s);
      }
      resume() {
        this.readyState === t.CONNECTING ||
          this.readyState === t.CLOSED ||
          ((this._paused = !1), this._receiver._writableState.needDrain || this._socket.resume());
      }
      send(e, r, s) {
        if (this.readyState === t.CONNECTING)
          throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
        if (
          (typeof r == 'function' && ((s = r), (r = {})),
          typeof e == 'number' && (e = e.toString()),
          this.readyState !== t.OPEN)
        ) {
          or(this, e, s);
          return;
        }
        let n = {
          binary: typeof e != 'string',
          mask: !this._isServer,
          compress: !0,
          fin: !0,
          ...r,
        };
        this._extensions[W.extensionName] || (n.compress = !1), this._sender.send(e || Ye, n, s);
      }
      terminate() {
        if (this.readyState !== t.CLOSED) {
          if (this.readyState === t.CONNECTING) {
            C(this, this._req, 'WebSocket was closed before the connection was established');
            return;
          }
          this._socket && ((this._readyState = t.CLOSING), this._socket.destroy());
        }
      }
    };
  Object.defineProperty(w, 'CONNECTING', { enumerable: !0, value: M.indexOf('CONNECTING') });
  Object.defineProperty(w.prototype, 'CONNECTING', {
    enumerable: !0,
    value: M.indexOf('CONNECTING'),
  });
  Object.defineProperty(w, 'OPEN', { enumerable: !0, value: M.indexOf('OPEN') });
  Object.defineProperty(w.prototype, 'OPEN', { enumerable: !0, value: M.indexOf('OPEN') });
  Object.defineProperty(w, 'CLOSING', { enumerable: !0, value: M.indexOf('CLOSING') });
  Object.defineProperty(w.prototype, 'CLOSING', { enumerable: !0, value: M.indexOf('CLOSING') });
  Object.defineProperty(w, 'CLOSED', { enumerable: !0, value: M.indexOf('CLOSED') });
  Object.defineProperty(w.prototype, 'CLOSED', { enumerable: !0, value: M.indexOf('CLOSED') });
  [
    'binaryType',
    'bufferedAmount',
    'extensions',
    'isPaused',
    'protocol',
    'readyState',
    'url',
  ].forEach(t => {
    Object.defineProperty(w.prototype, t, { enumerable: !0 });
  });
  ['open', 'error', 'close', 'message'].forEach(t => {
    Object.defineProperty(w.prototype, `on${t}`, {
      enumerable: !0,
      get() {
        for (let e of this.listeners(t)) if (e[nr]) return e[ya];
        return null;
      },
      set(e) {
        for (let r of this.listeners(t))
          if (r[nr]) {
            this.removeListener(t, r);
            break;
          }
        typeof e == 'function' && this.addEventListener(t, e, { [nr]: !0 });
      },
    });
  });
  w.prototype.addEventListener = wa;
  w.prototype.removeEventListener = xa;
  zs.exports = w;
  function Gs(t, e, r, s) {
    let n = {
      allowSynchronousEvents: !0,
      autoPong: !0,
      protocolVersion: ir[1],
      maxPayload: 104857600,
      skipUTF8Validation: !1,
      perMessageDeflate: !0,
      followRedirects: !1,
      maxRedirects: 10,
      ...s,
      socketPath: void 0,
      hostname: void 0,
      protocol: void 0,
      timeout: void 0,
      method: 'GET',
      host: void 0,
      path: void 0,
      port: void 0,
    };
    if (((t._autoPong = n.autoPong), !ir.includes(n.protocolVersion)))
      throw new RangeError(
        `Unsupported protocol version: ${n.protocolVersion} (supported versions: ${ir.join(', ')})`,
      );
    let i;
    if (e instanceof sr) i = e;
    else
      try {
        i = new sr(e);
      } catch {
        throw new SyntaxError(`Invalid URL: ${e}`);
      }
    i.protocol === 'http:'
      ? (i.protocol = 'ws:')
      : i.protocol === 'https:' && (i.protocol = 'wss:'),
      (t._url = i.href);
    let o = i.protocol === 'wss:',
      a = i.protocol === 'ws+unix:',
      c;
    if (
      (i.protocol !== 'ws:' && !o && !a
        ? (c = `The URL's protocol must be one of "ws:", "wss:", "http:", "https", or "ws+unix:"`)
        : a && !i.pathname
          ? (c = "The URL's pathname is empty")
          : i.hash && (c = 'The URL contains a fragment identifier'),
      c)
    ) {
      let h = new SyntaxError(c);
      if (t._redirects === 0) throw h;
      Qe(t, h);
      return;
    }
    let l = o ? 443 : 80,
      u = da(16).toString('base64'),
      d = o ? la.request : ua.request,
      p = new Set(),
      g;
    if (
      ((n.createConnection = n.createConnection || (o ? Oa : Pa)),
      (n.defaultPort = n.defaultPort || l),
      (n.port = i.port || l),
      (n.host = i.hostname.startsWith('[') ? i.hostname.slice(1, -1) : i.hostname),
      (n.headers = {
        ...n.headers,
        'Sec-WebSocket-Version': n.protocolVersion,
        'Sec-WebSocket-Key': u,
        Connection: 'Upgrade',
        Upgrade: 'websocket',
      }),
      (n.path = i.pathname + i.search),
      (n.timeout = n.handshakeTimeout),
      n.perMessageDeflate &&
        ((g = new W(n.perMessageDeflate !== !0 ? n.perMessageDeflate : {}, !1, n.maxPayload)),
        (n.headers['Sec-WebSocket-Extensions'] = Sa({ [W.extensionName]: g.offer() }))),
      r.length)
    ) {
      for (let h of r) {
        if (typeof h != 'string' || !Ca.test(h) || p.has(h))
          throw new SyntaxError('An invalid or duplicated subprotocol was specified');
        p.add(h);
      }
      n.headers['Sec-WebSocket-Protocol'] = r.join(',');
    }
    if (
      (n.origin &&
        (n.protocolVersion < 13
          ? (n.headers['Sec-WebSocket-Origin'] = n.origin)
          : (n.headers.Origin = n.origin)),
      (i.username || i.password) && (n.auth = `${i.username}:${i.password}`),
      a)
    ) {
      let h = n.path.split(':');
      (n.socketPath = h[0]), (n.path = h[1]);
    }
    let m;
    if (n.followRedirects) {
      if (t._redirects === 0) {
        (t._originalIpc = a),
          (t._originalSecure = o),
          (t._originalHostOrSocketPath = a ? n.socketPath : i.host);
        let h = s && s.headers;
        if (((s = { ...s, headers: {} }), h))
          for (let [_, k] of Object.entries(h)) s.headers[_.toLowerCase()] = k;
      } else if (t.listenerCount('redirect') === 0) {
        let h = a
          ? t._originalIpc
            ? n.socketPath === t._originalHostOrSocketPath
            : !1
          : t._originalIpc
            ? !1
            : i.host === t._originalHostOrSocketPath;
        (!h || (t._originalSecure && !o)) &&
          (delete n.headers.authorization,
          delete n.headers.cookie,
          h || delete n.headers.host,
          (n.auth = void 0));
      }
      n.auth &&
        !s.headers.authorization &&
        (s.headers.authorization = 'Basic ' + Buffer.from(n.auth).toString('base64')),
        (m = t._req = d(n)),
        t._redirects && t.emit('redirect', t.url, m);
    } else m = t._req = d(n);
    n.timeout &&
      m.on('timeout', () => {
        C(t, m, 'Opening handshake has timed out');
      }),
      m.on('error', h => {
        m === null || m[Us] || ((m = t._req = null), Qe(t, h));
      }),
      m.on('response', h => {
        let _ = h.headers.location,
          k = h.statusCode;
        if (_ && n.followRedirects && k >= 300 && k < 400) {
          if (++t._redirects > n.maxRedirects) {
            C(t, m, 'Maximum redirects exceeded');
            return;
          }
          m.abort();
          let A;
          try {
            A = new sr(_, e);
          } catch {
            let B = new SyntaxError(`Invalid URL: ${_}`);
            Qe(t, B);
            return;
          }
          Gs(t, A, r, s);
        } else
          t.emit('unexpected-response', m, h) ||
            C(t, m, `Unexpected server response: ${h.statusCode}`);
      }),
      m.on('upgrade', (h, _, k) => {
        if ((t.emit('upgrade', h), t.readyState !== w.CONNECTING)) return;
        m = t._req = null;
        let A = h.headers.upgrade;
        if (A === void 0 || A.toLowerCase() !== 'websocket') {
          C(t, _, 'Invalid Upgrade header');
          return;
        }
        let Ne = ha('sha1')
          .update(u + ga)
          .digest('base64');
        if (h.headers['sec-websocket-accept'] !== Ne) {
          C(t, _, 'Invalid Sec-WebSocket-Accept header');
          return;
        }
        let B = h.headers['sec-websocket-protocol'],
          $;
        if (
          (B !== void 0
            ? p.size
              ? p.has(B) || ($ = 'Server sent an invalid subprotocol')
              : ($ = 'Server sent a subprotocol but none was requested')
            : p.size && ($ = 'Server sent no subprotocol'),
          $)
        ) {
          C(t, _, $);
          return;
        }
        B && (t._protocol = B);
        let pe = h.headers['sec-websocket-extensions'];
        if (pe !== void 0) {
          if (!g) {
            C(t, _, 'Server sent a Sec-WebSocket-Extensions header but no extension was requested');
            return;
          }
          let Z;
          try {
            Z = Ea(pe);
          } catch {
            C(t, _, 'Invalid Sec-WebSocket-Extensions header');
            return;
          }
          let jr = Object.keys(Z);
          if (jr.length !== 1 || jr[0] !== W.extensionName) {
            C(t, _, 'Server indicated an extension that was not requested');
            return;
          }
          try {
            g.accept(Z[W.extensionName]);
          } catch {
            C(t, _, 'Invalid Sec-WebSocket-Extensions header');
            return;
          }
          t._extensions[W.extensionName] = g;
        }
        t.setSocket(_, k, {
          allowSynchronousEvents: n.allowSynchronousEvents,
          generateMask: n.generateMask,
          maxPayload: n.maxPayload,
          skipUTF8Validation: n.skipUTF8Validation,
        });
      }),
      n.finishRequest ? n.finishRequest(m, t) : m.end();
  }
  function Qe(t, e) {
    (t._readyState = w.CLOSING), t.emit('error', e), t.emitClose();
  }
  function Pa(t) {
    return (t.path = t.socketPath), Ds.connect(t);
  }
  function Oa(t) {
    return (
      (t.path = void 0),
      !t.servername && t.servername !== '' && (t.servername = Ds.isIP(t.host) ? '' : t.host),
      fa.connect(t)
    );
  }
  function C(t, e, r) {
    t._readyState = w.CLOSING;
    let s = new Error(r);
    Error.captureStackTrace(s, C),
      e.setHeader
        ? ((e[Us] = !0),
          e.abort(),
          e.socket && !e.socket.destroyed && e.socket.destroy(),
          process.nextTick(Qe, t, s))
        : (e.destroy(s),
          e.once('error', t.emit.bind(t, 'error')),
          e.once('close', t.emitClose.bind(t)));
  }
  function or(t, e, r) {
    if (e) {
      let s = va(e).length;
      t._socket ? (t._sender._bufferedBytes += s) : (t._bufferedAmount += s);
    }
    if (r) {
      let s = new Error(`WebSocket is not open: readyState ${t.readyState} (${M[t.readyState]})`);
      process.nextTick(r, s);
    }
  }
  function Ta(t, e) {
    let r = this[E];
    (r._closeFrameReceived = !0),
      (r._closeMessage = e),
      (r._closeCode = t),
      r._socket[E] !== void 0 &&
        (r._socket.removeListener('data', Ze),
        process.nextTick(Ws, r._socket),
        t === 1005 ? r.close() : r.close(t, e));
  }
  function ka() {
    let t = this[E];
    t.isPaused || t._socket.resume();
  }
  function Ia(t) {
    let e = this[E];
    e._socket[E] !== void 0 &&
      (e._socket.removeListener('data', Ze), process.nextTick(Ws, e._socket), e.close(t[_a])),
      e.emit('error', t);
  }
  function Fs() {
    this[E].emitClose();
  }
  function Aa(t, e) {
    this[E].emit('message', t, e);
  }
  function La(t) {
    let e = this[E];
    e._autoPong && e.pong(t, !this._isServer, $s), e.emit('ping', t);
  }
  function Ra(t) {
    this[E].emit('pong', t);
  }
  function Ws(t) {
    t.resume();
  }
  function js() {
    let t = this[E];
    this.removeListener('close', js),
      this.removeListener('data', Ze),
      this.removeListener('end', Hs),
      (t._readyState = w.CLOSING);
    let e;
    !this._readableState.endEmitted &&
      !t._closeFrameReceived &&
      !t._receiver._writableState.errorEmitted &&
      (e = t._socket.read()) !== null &&
      t._receiver.write(e),
      t._receiver.end(),
      (this[E] = void 0),
      clearTimeout(t._closeTimer),
      t._receiver._writableState.finished || t._receiver._writableState.errorEmitted
        ? t.emitClose()
        : (t._receiver.on('error', Fs), t._receiver.on('finish', Fs));
  }
  function Ze(t) {
    this[E]._receiver.write(t) || this.pause();
  }
  function Hs() {
    let t = this[E];
    (t._readyState = w.CLOSING), t._receiver.end(), this.end();
  }
  function Vs() {
    let t = this[E];
    this.removeListener('error', Vs),
      this.on('error', $s),
      t && ((t._readyState = w.CLOSING), this.destroy());
  }
});
var Xs = f((af, Ks) => {
  'use strict';
  var { tokenChars: Ba } = xe();
  function qa(t) {
    let e = new Set(),
      r = -1,
      s = -1,
      n = 0;
    for (n; n < t.length; n++) {
      let o = t.charCodeAt(n);
      if (s === -1 && Ba[o] === 1) r === -1 && (r = n);
      else if (n !== 0 && (o === 32 || o === 9)) s === -1 && r !== -1 && (s = n);
      else if (o === 44) {
        if (r === -1) throw new SyntaxError(`Unexpected character at index ${n}`);
        s === -1 && (s = n);
        let a = t.slice(r, s);
        if (e.has(a)) throw new SyntaxError(`The "${a}" subprotocol is duplicated`);
        e.add(a), (r = s = -1);
      } else throw new SyntaxError(`Unexpected character at index ${n}`);
    }
    if (r === -1 || s !== -1) throw new SyntaxError('Unexpected end of input');
    let i = t.slice(r, n);
    if (e.has(i)) throw new SyntaxError(`The "${i}" subprotocol is duplicated`);
    return e.add(i), e;
  }
  Ks.exports = { parse: qa };
});
var rn = f((lf, tn) => {
  'use strict';
  var Na = require('events'),
    Je = require('http'),
    { Duplex: cf } = require('stream'),
    { createHash: Ma } = require('crypto'),
    Ys = rr(),
    z = we(),
    Fa = Xs(),
    Da = ar(),
    { GUID: $a, kWebSocket: Ua } = U(),
    Ga = /^[+/0-9A-Za-z]{22}==$/,
    Qs = 0,
    Zs = 1,
    en = 2,
    cr = class extends Na {
      constructor(e, r) {
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
            WebSocket: Da,
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
            ? ((this._server = Je.createServer((s, n) => {
                let i = Je.STATUS_CODES[426];
                n.writeHead(426, { 'Content-Length': i.length, 'Content-Type': 'text/plain' }),
                  n.end(i);
              })),
              this._server.listen(e.port, e.host, e.backlog, r))
            : e.server && (this._server = e.server),
          this._server)
        ) {
          let s = this.emit.bind(this, 'connection');
          this._removeListeners = Wa(this._server, {
            listening: this.emit.bind(this, 'listening'),
            error: this.emit.bind(this, 'error'),
            upgrade: (n, i, o) => {
              this.handleUpgrade(n, i, o, s);
            },
          });
        }
        e.perMessageDeflate === !0 && (e.perMessageDeflate = {}),
          e.clientTracking && ((this.clients = new Set()), (this._shouldEmitClose = !1)),
          (this.options = e),
          (this._state = Qs);
      }
      address() {
        if (this.options.noServer) throw new Error('The server is operating in "noServer" mode');
        return this._server ? this._server.address() : null;
      }
      close(e) {
        if (this._state === en) {
          e &&
            this.once('close', () => {
              e(new Error('The server is not running'));
            }),
            process.nextTick(be, this);
          return;
        }
        if ((e && this.once('close', e), this._state !== Zs))
          if (((this._state = Zs), this.options.noServer || this.options.server))
            this._server &&
              (this._removeListeners(), (this._removeListeners = this._server = null)),
              this.clients
                ? this.clients.size
                  ? (this._shouldEmitClose = !0)
                  : process.nextTick(be, this)
                : process.nextTick(be, this);
          else {
            let r = this._server;
            this._removeListeners(),
              (this._removeListeners = this._server = null),
              r.close(() => {
                be(this);
              });
          }
      }
      shouldHandle(e) {
        if (this.options.path) {
          let r = e.url.indexOf('?');
          if ((r !== -1 ? e.url.slice(0, r) : e.url) !== this.options.path) return !1;
        }
        return !0;
      }
      handleUpgrade(e, r, s, n) {
        r.on('error', Js);
        let i = e.headers['sec-websocket-key'],
          o = e.headers.upgrade,
          a = +e.headers['sec-websocket-version'];
        if (e.method !== 'GET') {
          K(this, e, r, 405, 'Invalid HTTP method');
          return;
        }
        if (o === void 0 || o.toLowerCase() !== 'websocket') {
          K(this, e, r, 400, 'Invalid Upgrade header');
          return;
        }
        if (i === void 0 || !Ga.test(i)) {
          K(this, e, r, 400, 'Missing or invalid Sec-WebSocket-Key header');
          return;
        }
        if (a !== 8 && a !== 13) {
          K(this, e, r, 400, 'Missing or invalid Sec-WebSocket-Version header');
          return;
        }
        if (!this.shouldHandle(e)) {
          Ce(r, 400);
          return;
        }
        let c = e.headers['sec-websocket-protocol'],
          l = new Set();
        if (c !== void 0)
          try {
            l = Fa.parse(c);
          } catch {
            K(this, e, r, 400, 'Invalid Sec-WebSocket-Protocol header');
            return;
          }
        let u = e.headers['sec-websocket-extensions'],
          d = {};
        if (this.options.perMessageDeflate && u !== void 0) {
          let p = new z(this.options.perMessageDeflate, !0, this.options.maxPayload);
          try {
            let g = Ys.parse(u);
            g[z.extensionName] && (p.accept(g[z.extensionName]), (d[z.extensionName] = p));
          } catch {
            K(this, e, r, 400, 'Invalid or unacceptable Sec-WebSocket-Extensions header');
            return;
          }
        }
        if (this.options.verifyClient) {
          let p = {
            origin: e.headers[`${a === 8 ? 'sec-websocket-origin' : 'origin'}`],
            secure: !!(e.socket.authorized || e.socket.encrypted),
            req: e,
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(p, (g, m, h, _) => {
              if (!g) return Ce(r, m || 401, h, _);
              this.completeUpgrade(d, i, l, e, r, s, n);
            });
            return;
          }
          if (!this.options.verifyClient(p)) return Ce(r, 401);
        }
        this.completeUpgrade(d, i, l, e, r, s, n);
      }
      completeUpgrade(e, r, s, n, i, o, a) {
        if (!i.readable || !i.writable) return i.destroy();
        if (i[Ua])
          throw new Error(
            'server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration',
          );
        if (this._state > Qs) return Ce(i, 503);
        let l = [
            'HTTP/1.1 101 Switching Protocols',
            'Upgrade: websocket',
            'Connection: Upgrade',
            `Sec-WebSocket-Accept: ${Ma('sha1')
              .update(r + $a)
              .digest('base64')}`,
          ],
          u = new this.options.WebSocket(null, void 0, this.options);
        if (s.size) {
          let d = this.options.handleProtocols
            ? this.options.handleProtocols(s, n)
            : s.values().next().value;
          d && (l.push(`Sec-WebSocket-Protocol: ${d}`), (u._protocol = d));
        }
        if (e[z.extensionName]) {
          let d = e[z.extensionName].params,
            p = Ys.format({ [z.extensionName]: [d] });
          l.push(`Sec-WebSocket-Extensions: ${p}`), (u._extensions = e);
        }
        this.emit('headers', l, n),
          i.write(
            l.concat(`\r
`).join(`\r
`),
          ),
          i.removeListener('error', Js),
          u.setSocket(i, o, {
            allowSynchronousEvents: this.options.allowSynchronousEvents,
            maxPayload: this.options.maxPayload,
            skipUTF8Validation: this.options.skipUTF8Validation,
          }),
          this.clients &&
            (this.clients.add(u),
            u.on('close', () => {
              this.clients.delete(u),
                this._shouldEmitClose && !this.clients.size && process.nextTick(be, this);
            })),
          a(u, n);
      }
    };
  tn.exports = cr;
  function Wa(t, e) {
    for (let r of Object.keys(e)) t.on(r, e[r]);
    return function () {
      for (let s of Object.keys(e)) t.removeListener(s, e[s]);
    };
  }
  function be(t) {
    (t._state = en), t.emit('close');
  }
  function Js() {
    this.destroy();
  }
  function Ce(t, e, r, s) {
    (r = r || Je.STATUS_CODES[e]),
      (s = {
        Connection: 'close',
        'Content-Type': 'text/html',
        'Content-Length': Buffer.byteLength(r),
        ...s,
      }),
      t.once('finish', t.destroy),
      t.end(
        `HTTP/1.1 ${e} ${Je.STATUS_CODES[e]}\r
` +
          Object.keys(s).map(n => `${n}: ${s[n]}`).join(`\r
`) +
          `\r
\r
` +
          r,
      );
  }
  function K(t, e, r, s, n) {
    if (t.listenerCount('wsClientError')) {
      let i = new Error(n);
      Error.captureStackTrace(i, K), t.emit('wsClientError', i, r, e);
    } else Ce(r, s, n);
  }
});
var fn = f((mf, un) => {
  'use strict';
  var { Transform: Xa } = require('stream'),
    { StringDecoder: Ya } = require('string_decoder'),
    j = Symbol('last'),
    rt = Symbol('decoder');
  function Qa(t, e, r) {
    let s;
    if (this.overflow) {
      if (((s = this[rt].write(t).split(this.matcher)), s.length === 1)) return r();
      s.shift(), (this.overflow = !1);
    } else (this[j] += this[rt].write(t)), (s = this[j].split(this.matcher));
    this[j] = s.pop();
    for (let n = 0; n < s.length; n++)
      try {
        ln(this, this.mapper(s[n]));
      } catch (i) {
        return r(i);
      }
    if (((this.overflow = this[j].length > this.maxLength), this.overflow && !this.skipOverflow)) {
      r(new Error('maximum buffer reached'));
      return;
    }
    r();
  }
  function Za(t) {
    if (((this[j] += this[rt].end()), this[j]))
      try {
        ln(this, this.mapper(this[j]));
      } catch (e) {
        return t(e);
      }
    t();
  }
  function ln(t, e) {
    e !== void 0 && t.push(e);
  }
  function cn(t) {
    return t;
  }
  function Ja(t, e, r) {
    switch (((t = t || /\r?\n/), (e = e || cn), (r = r || {}), arguments.length)) {
      case 1:
        typeof t == 'function'
          ? ((e = t), (t = /\r?\n/))
          : typeof t == 'object' &&
            !(t instanceof RegExp) &&
            !t[Symbol.split] &&
            ((r = t), (t = /\r?\n/));
        break;
      case 2:
        typeof t == 'function'
          ? ((r = e), (e = t), (t = /\r?\n/))
          : typeof e == 'object' && ((r = e), (e = cn));
    }
    (r = Object.assign({}, r)),
      (r.autoDestroy = !0),
      (r.transform = Qa),
      (r.flush = Za),
      (r.readableObjectMode = !0);
    let s = new Xa(r);
    return (
      (s[j] = ''),
      (s[rt] = new Ya('utf8')),
      (s.matcher = t),
      (s.mapper = e),
      (s.maxLength = r.maxLength),
      (s.skipOverflow = r.skipOverflow || !1),
      (s.overflow = !1),
      (s._destroy = function (n, i) {
        (this._writableState.errorEmitted = !1), i(n);
      }),
      s
    );
  }
  un.exports = Ja;
});
var F = f(v => {
  'use strict';
  Object.defineProperty(v, '__esModule', { value: !0 });
  v.findWindowsCandidates =
    v.sort =
    v.preferredEdgePath =
    v.preferredFirefoxPath =
    v.preferredChromePath =
    v.escapeRegexSpecialChars =
    v.canAccess =
      void 0;
  var rc = require('path');
  async function Te({ access: t }, e) {
    if (!e) return !1;
    try {
      return await t(e), !0;
    } catch {
      return !1;
    }
  }
  v.canAccess = Te;
  var sc = '/\\.?*()^${}|[]+';
  function nc(t, e) {
    let r = sc
        .split('')
        .filter(n => !e || e.indexOf(n) < 0)
        .join('')
        .replace(/[\\\]]/g, '\\$&'),
      s = new RegExp(`[${r}]`, 'g');
    return t.replace(s, '\\$&');
  }
  v.escapeRegexSpecialChars = nc;
  async function ic(t, e) {
    if (await Te(t, e.CHROME_PATH)) return e.CHROME_PATH;
  }
  v.preferredChromePath = ic;
  async function oc(t, e) {
    if (await Te(t, e.FIREFOX_PATH)) return e.FIREFOX_PATH;
  }
  v.preferredFirefoxPath = oc;
  async function ac(t, e) {
    if (await Te(t, e.EDGE_PATH)) return e.EDGE_PATH;
  }
  v.preferredEdgePath = ac;
  function cc(t, e) {
    return [...t]
      .filter(s => !!s)
      .map(s => {
        let n = e.find(i => i.regex.test(s));
        return n
          ? { path: s, weight: n.weight, quality: n.quality }
          : { path: s, weight: 10, quality: 'dev' };
      })
      .sort((s, n) => n.weight - s.weight)
      .map(s => ({ path: s.path, quality: s.quality }));
  }
  v.sort = cc;
  async function lc(t, e, r) {
    let s = [t.LOCALAPPDATA, t.PROGRAMFILES, t['PROGRAMFILES(X86)']].filter(i => !!i),
      n = [];
    for (let i of s)
      for (let o of r) {
        let a = rc.win32.join(i, o.name);
        n.push(Te(e, a).then(c => (c ? { path: a, quality: o.type } : void 0)));
      }
    return (await Promise.all(n)).filter(i => !!i);
  }
  v.findWindowsCandidates = lc;
});
var at = f(ot => {
  'use strict';
  Object.defineProperty(ot, '__esModule', { value: !0 });
  ot.DarwinFinderBase = void 0;
  var uc = require('path'),
    fc = require('fs'),
    fr = F(),
    _n = /( \(0x[a-f0-9]+\))/,
    dr = class {
      constructor(e = process.env, r = fc.promises, s = s) {
        (this.env = e),
          (this.fs = r),
          (this.execa = s),
          (this.lsRegisterCommand =
            '/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -dump'),
          (this.wellKnownPaths = []);
      }
      async findWhere(e) {
        for (let r of this.wellKnownPaths)
          if (e(r) && (await (0, fr.canAccess)(this.fs, r.path))) return r;
        return (await this.findAll()).find(e);
      }
      findAll() {
        var e;
        return (
          ((e = this.foundAll) !== null && e !== void 0) || (this.foundAll = this.findAllInner()),
          this.foundAll
        );
      }
      async findLaunchRegisteredApps(e, r, s) {
        let { stdout: n } = await this.execa.command(
            `${this.lsRegisterCommand} | awk 'tolower($0) ~ /${e.toLowerCase()}${_n.source}?$/ { $1=""; print $0 }'`,
            { shell: !0, stdio: 'pipe' },
          ),
          i = [
            ...r,
            ...n
              .split(
                `
`,
              )
              .map(c => c.trim().replace(_n, '')),
          ].filter(c => !!c),
          o = this.getPreferredPath();
        o && i.push(o);
        let a = new Set();
        for (let c of i)
          for (let l of s) {
            let u = uc.posix.join(c.trim(), l);
            try {
              await this.fs.access(u), a.add(u);
            } catch {}
          }
        return a;
      }
      createPriorities(e) {
        let r = this.env.HOME && (0, fr.escapeRegexSpecialChars)(this.env.HOME),
          s = this.getPreferredPath(),
          n = e.reduce(
            (i, o) => [
              ...i,
              {
                regex: new RegExp(`^/Applications/.*${o.name}`),
                weight: o.weight + 100,
                quality: o.quality,
              },
              {
                regex: new RegExp(`^${r}/Applications/.*${o.name}`),
                weight: o.weight,
                quality: o.quality,
              },
              {
                regex: new RegExp(`^/Volumes/.*${o.name}`),
                weight: o.weight - 100,
                quality: o.quality,
              },
            ],
            [],
          );
        return (
          s &&
            n.unshift({
              regex: new RegExp((0, fr.escapeRegexSpecialChars)(s)),
              weight: 151,
              quality: 'custom',
            }),
          n
        );
      }
    };
  ot.DarwinFinderBase = dr;
});
var wn = f(ct => {
  'use strict';
  Object.defineProperty(ct, '__esModule', { value: !0 });
  ct.DarwinChromeBrowserFinder = void 0;
  var dc = F(),
    hc = at(),
    hr = class extends hc.DarwinFinderBase {
      constructor() {
        super(...arguments),
          (this.wellKnownPaths = [
            {
              path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
              quality: 'stable',
            },
            {
              path: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
              quality: 'canary',
            },
            {
              path: '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
              quality: 'beta',
            },
            {
              path: '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev',
              quality: 'dev',
            },
          ]);
      }
      async findAllInner() {
        let e = [
            '/Contents/MacOS/Google Chrome Canary',
            '/Contents/MacOS/Google Chrome Beta',
            '/Contents/MacOS/Google Chrome Dev',
            '/Contents/MacOS/Google Chrome',
          ],
          r = ['/Applications/Google Chrome.app', '/Applications/Google Chrome Canary.app'],
          s = await this.findLaunchRegisteredApps('google chrome[A-Za-z() ]*.app', r, e);
        return (0, dc.sort)(
          s,
          this.createPriorities([
            { name: 'Chrome.app', weight: 0, quality: 'stable' },
            { name: 'Chrome Canary.app', weight: 1, quality: 'canary' },
            { name: 'Chrome Beta.app', weight: 2, quality: 'beta' },
            { name: 'Chrome Dev.app', weight: 3, quality: 'dev' },
          ]),
        );
      }
      getPreferredPath() {
        return this.env.CHROME_PATH;
      }
    };
  ct.DarwinChromeBrowserFinder = hr;
});
var xn = f(lt => {
  'use strict';
  Object.defineProperty(lt, '__esModule', { value: !0 });
  lt.DarwinEdgeBrowserFinder = void 0;
  var pc = F(),
    mc = at(),
    pr = class extends mc.DarwinFinderBase {
      constructor() {
        super(...arguments),
          (this.wellKnownPaths = [
            {
              path: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
              quality: 'stable',
            },
            {
              path: '/Applications/Microsoft Edge Canary.app/Contents/MacOS/Microsoft Edge Canary',
              quality: 'canary',
            },
            {
              path: '/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta',
              quality: 'beta',
            },
            {
              path: '/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev',
              quality: 'dev',
            },
          ]);
      }
      async findAllInner() {
        let e = [
            '/Contents/MacOS/Microsoft Edge Canary',
            '/Contents/MacOS/Microsoft Edge Beta',
            '/Contents/MacOS/Microsoft Edge Dev',
            '/Contents/MacOS/Microsoft Edge',
          ],
          r = ['/Applications/Microsoft Edge.app'],
          s = await this.findLaunchRegisteredApps('Microsoft Edge[A-Za-z ]*.app', r, e);
        return (0, pc.sort)(
          s,
          this.createPriorities([
            { name: 'Microsoft Edge.app', weight: 0, quality: 'stable' },
            { name: 'Microsoft Edge Canary.app', weight: 1, quality: 'canary' },
            { name: 'Microsoft Edge Beta.app', weight: 2, quality: 'beta' },
            { name: 'Microsoft Edge Dev.app', weight: 3, quality: 'dev' },
          ]),
        );
      }
      getPreferredPath() {
        return this.env.EDGE_PATH;
      }
    };
  lt.DarwinEdgeBrowserFinder = pr;
});
var Sn = f(ut => {
  'use strict';
  Object.defineProperty(ut, '__esModule', { value: !0 });
  ut.DarwinFirefoxBrowserFinder = void 0;
  var gc = F(),
    yc = at(),
    mr = class extends yc.DarwinFinderBase {
      constructor() {
        super(...arguments),
          (this.wellKnownPaths = [
            { path: '/Applications/Firefox.app/Contents/MacOS/firefox', quality: 'stable' },
            {
              path: '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox',
              quality: 'dev',
            },
            { path: '/Applications/Firefox Nightly.app/Contents/MacOS/firefox', quality: 'canary' },
          ]);
      }
      async findAllInner() {
        let e = ['/Contents/MacOS/firefox'],
          r = ['/Applications/Firefox.app'],
          s = await this.findLaunchRegisteredApps('Firefox[A-Za-z ]*.app', r, e);
        return (0, gc.sort)(
          s,
          this.createPriorities([
            { name: 'Firefox.app', weight: 0, quality: 'stable' },
            { name: 'Firefox Nightly.app', weight: 1, quality: 'canary' },
            { name: 'Firefox Developer Edition.app', weight: 2, quality: 'dev' },
          ]),
        );
      }
      getPreferredPath() {
        return this.env.FIREFOX_PATH;
      }
    };
  ut.DarwinFirefoxBrowserFinder = mr;
});
var dt = f(ft => {
  'use strict';
  Object.defineProperty(ft, '__esModule', { value: !0 });
  ft.LinuxChromeBrowserFinder = void 0;
  var _c = require('path'),
    ne = F(),
    gr = require('child_process'),
    wc = require('os'),
    xc = require('fs'),
    En = /\r?\n/,
    yr = class {
      constructor(e = process.env, r = xc.promises) {
        (this.env = e),
          (this.fs = r),
          (this.pathEnvironmentVar = 'CHROME_PATH'),
          (this.priorities = [
            { regex: /chrome-wrapper$/, weight: 54, quality: 'custom' },
            { regex: /google-chrome-dev$/, weight: 53, quality: 'dev' },
            { regex: /google-chrome-canary$/, weight: 52, quality: 'canary' },
            { regex: /google-chrome-unstable$/, weight: 51, quality: 'canary' },
            { regex: /google-chrome-canary$/, weight: 51, quality: 'canary' },
            { regex: /google-chrome-stable$/, weight: 50, quality: 'stable' },
            { regex: /(google-)?chrome$/, weight: 49, quality: 'stable' },
            { regex: /chromium-browser$/, weight: 48, quality: 'custom' },
            { regex: /chromium$/, weight: 47, quality: 'custom' },
          ]),
          (this.executablesOnPath = [
            'google-chrome-unstable',
            'google-chrome-dev',
            'google-chrome-beta',
            'google-chrome-canary',
            'google-chrome-stable',
            'google-chrome',
            'chromium-browser',
            'chromium',
          ]);
      }
      async findWhere(e) {
        return (await this.findAll()).find(e);
      }
      async findAll() {
        let e = new Set(),
          r = this.env[this.pathEnvironmentVar];
        r && (await (0, ne.canAccess)(this.fs, r)) && e.add(r),
          [
            _c.posix.join((0, wc.homedir)(), '.local/share/applications/'),
            '/usr/share/applications/',
            '/usr/bin',
            '/opt/google',
          ].forEach(o => {
            for (let a in this.findChromeExecutables(o)) e.add(a);
          }),
          await Promise.all(
            this.executablesOnPath.map(async o => {
              try {
                let a = (0, gr.execFileSync)('which', [o], { stdio: 'pipe' })
                  .toString()
                  .split(En)[0];
                (await (0, ne.canAccess)(this.fs, a)) && e.add(a);
              } catch {}
            }),
          );
        let i = r
          ? [
              {
                regex: new RegExp((0, ne.escapeRegexSpecialChars)(r)),
                weight: 101,
                quality: 'custom',
              },
            ].concat(this.priorities)
          : this.priorities;
        return (0, ne.sort)(e, i);
      }
      async findChromeExecutables(e) {
        let r = /(^[^ ]+).*/,
          s = `^Exec=/.*/(${this.executablesOnPath.join('|')})-.*`,
          n = [];
        if (await (0, ne.canAccess)(this.fs, e)) {
          let i;
          try {
            i = (0, gr.execSync)(`grep -ERI "${s}" ${e} | awk -F '=' '{print $2}'`);
          } catch {
            i = (0, gr.execSync)(`grep -Er "${s}" ${e} | awk -F '=' '{print $2}'`);
          }
          let o = i
            .toString()
            .split(En)
            .map(a => a.replace(r, '$1'));
          await Promise.all(
            o.map(async a => {
              (await (0, ne.canAccess)(this.fs, a)) && n.push(a);
            }),
          );
        }
        return n;
      }
    };
  ft.LinuxChromeBrowserFinder = yr;
});
var vn = f(ht => {
  'use strict';
  Object.defineProperty(ht, '__esModule', { value: !0 });
  ht.LinuxEdgeBrowserFinder = void 0;
  var Sc = dt(),
    _r = class extends Sc.LinuxChromeBrowserFinder {
      constructor() {
        super(...arguments),
          (this.pathEnvironmentVar = 'EDGE_PATH'),
          (this.executablesOnPath = [
            'microsoft-edge-dev',
            'microsoft-edge-beta',
            'microsoft-edge-stable',
            'microsoft-edge',
          ]),
          (this.priorities = [
            { regex: /microsoft-edge\-wrapper$/, weight: 52, quality: 'custom' },
            { regex: /microsoft-edge\-dev$/, weight: 51, quality: 'dev' },
            { regex: /microsoft-edge\-beta$/, weight: 51, quality: 'beta' },
            { regex: /microsoft-edge\-stable$/, weight: 50, quality: 'stable' },
            { regex: /microsoft-edge$/, weight: 49, quality: 'stable' },
          ]);
      }
    };
  ht.LinuxEdgeBrowserFinder = _r;
});
var bn = f(pt => {
  'use strict';
  Object.defineProperty(pt, '__esModule', { value: !0 });
  pt.LinuxFirefoxBrowserFinder = void 0;
  var Ec = dt(),
    wr = class extends Ec.LinuxChromeBrowserFinder {
      constructor() {
        super(...arguments),
          (this.pathEnvironmentVar = 'FIREFOX_PATH'),
          (this.executablesOnPath = [
            'firefox-aurora',
            'firefox-dev',
            'firefox-developer',
            'firefox-trunk',
            'firefox-nightly',
            'firefox',
          ]),
          (this.priorities = [
            { regex: /firefox\-aurora$/, weight: 51, quality: 'dev' },
            { regex: /firefox\-dev$/, weight: 51, quality: 'dev' },
            { regex: /firefox\-developer$/, weight: 51, quality: 'dev' },
            { regex: /firefox\-trunk'$/, weight: 50, quality: 'canary' },
            { regex: /firefox\-nightly'$/, weight: 50, quality: 'canary' },
            { regex: /firefox$/, weight: 49, quality: 'stable' },
          ]);
      }
    };
  pt.LinuxFirefoxBrowserFinder = wr;
});
var Pn = f(mt => {
  'use strict';
  Object.defineProperty(mt, '__esModule', { value: !0 });
  mt.WindowsChromeBrowserFinder = void 0;
  var vc = require('path'),
    Cn = F(),
    bc = require('fs'),
    xr = class {
      constructor(e = process.env, r = bc.promises) {
        (this.env = e), (this.fs = r);
      }
      async findWhere(e) {
        return (await this.findAll()).find(e);
      }
      async findAll() {
        let e = vc.win32.sep,
          r = [
            { name: `${e}Google${e}Chrome Dev${e}Application${e}chrome.exe`, type: 'dev' },
            { name: `${e}Google${e}Chrome SxS${e}Application${e}chrome.exe`, type: 'canary' },
            { name: `${e}Google${e}Chrome Beta${e}Application${e}chrome.exe`, type: 'beta' },
            { name: `${e}Google${e}Chrome${e}Application${e}chrome.exe`, type: 'stable' },
          ],
          s = await (0, Cn.findWindowsCandidates)(this.env, this.fs, r),
          n = await (0, Cn.preferredChromePath)(this.fs, this.env);
        return n && s.unshift({ path: n, quality: 'custom' }), s;
      }
    };
  mt.WindowsChromeBrowserFinder = xr;
});
var Tn = f(gt => {
  'use strict';
  Object.defineProperty(gt, '__esModule', { value: !0 });
  gt.WindowsEdgeBrowserFinder = void 0;
  var b = require('path'),
    Cc = require('fs'),
    On = F(),
    Sr = class {
      constructor(e = process.env, r = Cc.promises) {
        (this.env = e), (this.fs = r);
      }
      async findWhere(e) {
        return (await this.findAll()).find(e);
      }
      async findAll() {
        let e = [
            {
              name: `${b.sep}Microsoft${b.sep}Edge SxS${b.sep}Application${b.sep}msedge.exe`,
              type: 'canary',
            },
            {
              name: `${b.sep}Microsoft${b.sep}Edge Dev${b.sep}Application${b.sep}msedge.exe`,
              type: 'dev',
            },
            {
              name: `${b.sep}Microsoft${b.sep}Edge Beta${b.sep}Application${b.sep}msedge.exe`,
              type: 'beta',
            },
            {
              name: `${b.sep}Microsoft${b.sep}Edge${b.sep}Application${b.sep}msedge.exe`,
              type: 'stable',
            },
          ],
          r = await (0, On.findWindowsCandidates)(this.env, this.fs, e),
          s = await (0, On.preferredEdgePath)(this.fs, this.env);
        return s && r.unshift({ path: s, quality: 'custom' }), r;
      }
    };
  gt.WindowsEdgeBrowserFinder = Sr;
});
var In = f(yt => {
  'use strict';
  Object.defineProperty(yt, '__esModule', { value: !0 });
  yt.WindowsFirefoxBrowserFinder = void 0;
  var Pc = require('path'),
    kn = F(),
    Oc = require('fs'),
    Er = class {
      constructor(e = process.env, r = Oc.promises) {
        (this.env = e), (this.fs = r);
      }
      async findWhere(e) {
        return (await this.findAll()).find(e);
      }
      async findAll() {
        let e = Pc.win32.sep,
          r = [
            { name: `${e}Firefox Developer Edition${e}firefox.exe`, type: 'dev' },
            { name: `${e}Firefox Nightly${e}firefox.exe`, type: 'canary' },
            { name: `${e}Mozilla Firefox${e}firefox.exe`, type: 'stable' },
          ],
          s = await (0, kn.findWindowsCandidates)(this.env, this.fs, r),
          n = await (0, kn.preferredFirefoxPath)(this.fs, this.env);
        return n && s.unshift({ path: n, quality: 'custom' }), s;
      }
    };
  yt.WindowsFirefoxBrowserFinder = Er;
});
var An = f(O => {
  'use strict';
  Object.defineProperty(O, '__esModule', { value: !0 });
  O.FirefoxBrowserFinder =
    O.EdgeBrowserFinder =
    O.ChromeBrowserFinder =
    O.isQuality =
    O.allQualities =
      void 0;
  var Tc = wn(),
    kc = xn(),
    Ic = Sn(),
    Ac = dt(),
    Lc = vn(),
    Rc = bn(),
    Bc = Pn(),
    qc = Tn(),
    Nc = In(),
    Mc = { canary: null, stable: null, beta: null, dev: null, custom: null };
  O.allQualities = new Set(Object.keys(Mc));
  var Fc = t => O.allQualities.has(t);
  O.isQuality = Fc;
  O.ChromeBrowserFinder =
    process.platform === 'win32'
      ? Bc.WindowsChromeBrowserFinder
      : process.platform === 'darwin'
        ? Tc.DarwinChromeBrowserFinder
        : Ac.LinuxChromeBrowserFinder;
  O.EdgeBrowserFinder =
    process.platform === 'win32'
      ? qc.WindowsEdgeBrowserFinder
      : process.platform === 'darwin'
        ? kc.DarwinEdgeBrowserFinder
        : Lc.LinuxEdgeBrowserFinder;
  O.FirefoxBrowserFinder =
    process.platform === 'win32'
      ? Nc.WindowsFirefoxBrowserFinder
      : process.platform === 'darwin'
        ? Ic.DarwinFirefoxBrowserFinder
        : Rc.LinuxFirefoxBrowserFinder;
});
var Nn = f((Nf, qn) => {
  'use strict';
  qn.exports = Bn;
  Bn.sync = $c;
  var Ln = require('fs');
  function Dc(t, e) {
    var r = e.pathExt !== void 0 ? e.pathExt : process.env.PATHEXT;
    if (!r || ((r = r.split(';')), r.indexOf('') !== -1)) return !0;
    for (var s = 0; s < r.length; s++) {
      var n = r[s].toLowerCase();
      if (n && t.substr(-n.length).toLowerCase() === n) return !0;
    }
    return !1;
  }
  function Rn(t, e, r) {
    return !t.isSymbolicLink() && !t.isFile() ? !1 : Dc(e, r);
  }
  function Bn(t, e, r) {
    Ln.stat(t, function (s, n) {
      r(s, s ? !1 : Rn(n, t, e));
    });
  }
  function $c(t, e) {
    return Rn(Ln.statSync(t), t, e);
  }
});
var Un = f((Mf, $n) => {
  'use strict';
  $n.exports = Fn;
  Fn.sync = Uc;
  var Mn = require('fs');
  function Fn(t, e, r) {
    Mn.stat(t, function (s, n) {
      r(s, s ? !1 : Dn(n, e));
    });
  }
  function Uc(t, e) {
    return Dn(Mn.statSync(t), e);
  }
  function Dn(t, e) {
    return t.isFile() && Gc(t, e);
  }
  function Gc(t, e) {
    var r = t.mode,
      s = t.uid,
      n = t.gid,
      i = e.uid !== void 0 ? e.uid : process.getuid && process.getuid(),
      o = e.gid !== void 0 ? e.gid : process.getgid && process.getgid(),
      a = parseInt('100', 8),
      c = parseInt('010', 8),
      l = parseInt('001', 8),
      u = a | c,
      d = r & l || (r & c && n === o) || (r & a && s === i) || (r & u && i === 0);
    return d;
  }
});
var Wn = f((Df, Gn) => {
  'use strict';
  var Ff = require('fs'),
    _t;
  process.platform === 'win32' || global.TESTING_WINDOWS ? (_t = Nn()) : (_t = Un());
  Gn.exports = vr;
  vr.sync = Wc;
  function vr(t, e, r) {
    if ((typeof e == 'function' && ((r = e), (e = {})), !r)) {
      if (typeof Promise != 'function') throw new TypeError('callback not provided');
      return new Promise(function (s, n) {
        vr(t, e || {}, function (i, o) {
          i ? n(i) : s(o);
        });
      });
    }
    _t(t, e || {}, function (s, n) {
      s && (s.code === 'EACCES' || (e && e.ignoreErrors)) && ((s = null), (n = !1)), r(s, n);
    });
  }
  function Wc(t, e) {
    try {
      return _t.sync(t, e || {});
    } catch (r) {
      if ((e && e.ignoreErrors) || r.code === 'EACCES') return !1;
      throw r;
    }
  }
});
var Yn = f(($f, Xn) => {
  'use strict';
  var ie =
      process.platform === 'win32' ||
      process.env.OSTYPE === 'cygwin' ||
      process.env.OSTYPE === 'msys',
    jn = require('path'),
    jc = ie ? ';' : ':',
    Hn = Wn(),
    Vn = t => Object.assign(new Error(`not found: ${t}`), { code: 'ENOENT' }),
    zn = (t, e) => {
      let r = e.colon || jc,
        s =
          t.match(/\//) || (ie && t.match(/\\/))
            ? ['']
            : [...(ie ? [process.cwd()] : []), ...(e.path || process.env.PATH || '').split(r)],
        n = ie ? e.pathExt || process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM' : '',
        i = ie ? n.split(r) : [''];
      return (
        ie && t.indexOf('.') !== -1 && i[0] !== '' && i.unshift(''),
        { pathEnv: s, pathExt: i, pathExtExe: n }
      );
    },
    Kn = (t, e, r) => {
      typeof e == 'function' && ((r = e), (e = {})), e || (e = {});
      let { pathEnv: s, pathExt: n, pathExtExe: i } = zn(t, e),
        o = [],
        a = l =>
          new Promise((u, d) => {
            if (l === s.length) return e.all && o.length ? u(o) : d(Vn(t));
            let p = s[l],
              g = /^".*"$/.test(p) ? p.slice(1, -1) : p,
              m = jn.join(g, t),
              h = !g && /^\.[\\\/]/.test(t) ? t.slice(0, 2) + m : m;
            u(c(h, l, 0));
          }),
        c = (l, u, d) =>
          new Promise((p, g) => {
            if (d === n.length) return p(a(u + 1));
            let m = n[d];
            Hn(l + m, { pathExt: i }, (h, _) => {
              if (!h && _)
                if (e.all) o.push(l + m);
                else return p(l + m);
              return p(c(l, u, d + 1));
            });
          });
      return r ? a(0).then(l => r(null, l), r) : a(0);
    },
    Hc = (t, e) => {
      e = e || {};
      let { pathEnv: r, pathExt: s, pathExtExe: n } = zn(t, e),
        i = [];
      for (let o = 0; o < r.length; o++) {
        let a = r[o],
          c = /^".*"$/.test(a) ? a.slice(1, -1) : a,
          l = jn.join(c, t),
          u = !c && /^\.[\\\/]/.test(t) ? t.slice(0, 2) + l : l;
        for (let d = 0; d < s.length; d++) {
          let p = u + s[d];
          try {
            if (Hn.sync(p, { pathExt: n }))
              if (e.all) i.push(p);
              else return p;
          } catch {}
        }
      }
      if (e.all && i.length) return i;
      if (e.nothrow) return null;
      throw Vn(t);
    };
  Xn.exports = Kn;
  Kn.sync = Hc;
});
var Cr = f((Uf, br) => {
  'use strict';
  var Qn = (t = {}) => {
    let e = t.env || process.env;
    return (t.platform || process.platform) !== 'win32'
      ? 'PATH'
      : Object.keys(e)
          .reverse()
          .find(s => s.toUpperCase() === 'PATH') || 'Path';
  };
  br.exports = Qn;
  br.exports.default = Qn;
});
var ti = f((Gf, ei) => {
  'use strict';
  var Zn = require('path'),
    Vc = Yn(),
    zc = Cr();
  function Jn(t, e) {
    let r = t.options.env || process.env,
      s = process.cwd(),
      n = t.options.cwd != null,
      i = n && process.chdir !== void 0 && !process.chdir.disabled;
    if (i)
      try {
        process.chdir(t.options.cwd);
      } catch {}
    let o;
    try {
      o = Vc.sync(t.command, { path: r[zc({ env: r })], pathExt: e ? Zn.delimiter : void 0 });
    } catch {
    } finally {
      i && process.chdir(s);
    }
    return o && (o = Zn.resolve(n ? t.options.cwd : '', o)), o;
  }
  function Kc(t) {
    return Jn(t) || Jn(t, !0);
  }
  ei.exports = Kc;
});
var ri = f((Wf, Or) => {
  'use strict';
  var Pr = /([()\][%!^"`<>&|;, *?])/g;
  function Xc(t) {
    return (t = t.replace(Pr, '^$1')), t;
  }
  function Yc(t, e) {
    return (
      (t = `${t}`),
      (t = t.replace(/(\\*)"/g, '$1$1\\"')),
      (t = t.replace(/(\\*)$/, '$1$1')),
      (t = `"${t}"`),
      (t = t.replace(Pr, '^$1')),
      e && (t = t.replace(Pr, '^$1')),
      t
    );
  }
  Or.exports.command = Xc;
  Or.exports.argument = Yc;
});
var ni = f((jf, si) => {
  'use strict';
  si.exports = /^#!(.*)/;
});
var oi = f((Hf, ii) => {
  'use strict';
  var Qc = ni();
  ii.exports = (t = '') => {
    let e = t.match(Qc);
    if (!e) return null;
    let [r, s] = e[0].replace(/#! ?/, '').split(' '),
      n = r.split('/').pop();
    return n === 'env' ? s : s ? `${n} ${s}` : n;
  };
});
var ci = f((Vf, ai) => {
  'use strict';
  var Tr = require('fs'),
    Zc = oi();
  function Jc(t) {
    let r = Buffer.alloc(150),
      s;
    try {
      (s = Tr.openSync(t, 'r')), Tr.readSync(s, r, 0, 150, 0), Tr.closeSync(s);
    } catch {}
    return Zc(r.toString());
  }
  ai.exports = Jc;
});
var di = f((zf, fi) => {
  'use strict';
  var el = require('path'),
    li = ti(),
    ui = ri(),
    tl = ci(),
    rl = process.platform === 'win32',
    sl = /\.(?:com|exe)$/i,
    nl = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
  function il(t) {
    t.file = li(t);
    let e = t.file && tl(t.file);
    return e ? (t.args.unshift(t.file), (t.command = e), li(t)) : t.file;
  }
  function ol(t) {
    if (!rl) return t;
    let e = il(t),
      r = !sl.test(e);
    if (t.options.forceShell || r) {
      let s = nl.test(e);
      (t.command = el.normalize(t.command)),
        (t.command = ui.command(t.command)),
        (t.args = t.args.map(i => ui.argument(i, s)));
      let n = [t.command].concat(t.args).join(' ');
      (t.args = ['/d', '/s', '/c', `"${n}"`]),
        (t.command = process.env.comspec || 'cmd.exe'),
        (t.options.windowsVerbatimArguments = !0);
    }
    return t;
  }
  function al(t, e, r) {
    e && !Array.isArray(e) && ((r = e), (e = null)),
      (e = e ? e.slice(0) : []),
      (r = Object.assign({}, r));
    let s = { command: t, args: e, options: r, file: void 0, original: { command: t, args: e } };
    return r.shell ? s : ol(s);
  }
  fi.exports = al;
});
var mi = f((Kf, pi) => {
  'use strict';
  var kr = process.platform === 'win32';
  function Ir(t, e) {
    return Object.assign(new Error(`${e} ${t.command} ENOENT`), {
      code: 'ENOENT',
      errno: 'ENOENT',
      syscall: `${e} ${t.command}`,
      path: t.command,
      spawnargs: t.args,
    });
  }
  function cl(t, e) {
    if (!kr) return;
    let r = t.emit;
    t.emit = function (s, n) {
      if (s === 'exit') {
        let i = hi(n, e, 'spawn');
        if (i) return r.call(t, 'error', i);
      }
      return r.apply(t, arguments);
    };
  }
  function hi(t, e) {
    return kr && t === 1 && !e.file ? Ir(e.original, 'spawn') : null;
  }
  function ll(t, e) {
    return kr && t === 1 && !e.file ? Ir(e.original, 'spawnSync') : null;
  }
  pi.exports = { hookChildProcess: cl, verifyENOENT: hi, verifyENOENTSync: ll, notFoundError: Ir };
});
var _i = f((Xf, oe) => {
  'use strict';
  var gi = require('child_process'),
    Ar = di(),
    Lr = mi();
  function yi(t, e, r) {
    let s = Ar(t, e, r),
      n = gi.spawn(s.command, s.args, s.options);
    return Lr.hookChildProcess(n, s), n;
  }
  function ul(t, e, r) {
    let s = Ar(t, e, r),
      n = gi.spawnSync(s.command, s.args, s.options);
    return (n.error = n.error || Lr.verifyENOENTSync(n.status, s)), n;
  }
  oe.exports = yi;
  oe.exports.spawn = yi;
  oe.exports.sync = ul;
  oe.exports._parse = Ar;
  oe.exports._enoent = Lr;
});
var xi = f((Yf, wi) => {
  'use strict';
  wi.exports = t => {
    let e =
        typeof t == 'string'
          ? `
`
          : 10,
      r = typeof t == 'string' ? '\r' : 13;
    return (
      t[t.length - 1] === e && (t = t.slice(0, t.length - 1)),
      t[t.length - 1] === r && (t = t.slice(0, t.length - 1)),
      t
    );
  };
});
var vi = f((Qf, Ie) => {
  'use strict';
  var ke = require('path'),
    Si = Cr(),
    Ei = t => {
      t = { cwd: process.cwd(), path: process.env[Si()], execPath: process.execPath, ...t };
      let e,
        r = ke.resolve(t.cwd),
        s = [];
      for (; e !== r; ) s.push(ke.join(r, 'node_modules/.bin')), (e = r), (r = ke.resolve(r, '..'));
      let n = ke.resolve(t.cwd, t.execPath, '..');
      return s.push(n), s.concat(t.path).join(ke.delimiter);
    };
  Ie.exports = Ei;
  Ie.exports.default = Ei;
  Ie.exports.env = t => {
    t = { env: process.env, ...t };
    let e = { ...t.env },
      r = Si({ env: e });
    return (t.path = e[r]), (e[r] = Ie.exports(t)), e;
  };
});
var Ci = f((Zf, Rr) => {
  'use strict';
  var bi = (t, e) => {
    for (let r of Reflect.ownKeys(e))
      Object.defineProperty(t, r, Object.getOwnPropertyDescriptor(e, r));
    return t;
  };
  Rr.exports = bi;
  Rr.exports.default = bi;
});
var Oi = f((Jf, xt) => {
  'use strict';
  var fl = Ci(),
    wt = new WeakMap(),
    Pi = (t, e = {}) => {
      if (typeof t != 'function') throw new TypeError('Expected a function');
      let r,
        s = 0,
        n = t.displayName || t.name || '<anonymous>',
        i = function (...o) {
          if ((wt.set(i, ++s), s === 1)) (r = t.apply(this, o)), (t = null);
          else if (e.throw === !0) throw new Error(`Function \`${n}\` can only be called once`);
          return r;
        };
      return fl(i, t), wt.set(i, s), i;
    };
  xt.exports = Pi;
  xt.exports.default = Pi;
  xt.exports.callCount = t => {
    if (!wt.has(t))
      throw new Error(`The given function \`${t.name}\` is not wrapped by the \`onetime\` package`);
    return wt.get(t);
  };
});
var Ti = f(St => {
  'use strict';
  Object.defineProperty(St, '__esModule', { value: !0 });
  St.SIGNALS = void 0;
  var dl = [
    {
      name: 'SIGHUP',
      number: 1,
      action: 'terminate',
      description: 'Terminal closed',
      standard: 'posix',
    },
    {
      name: 'SIGINT',
      number: 2,
      action: 'terminate',
      description: 'User interruption with CTRL-C',
      standard: 'ansi',
    },
    {
      name: 'SIGQUIT',
      number: 3,
      action: 'core',
      description: 'User interruption with CTRL-\\',
      standard: 'posix',
    },
    {
      name: 'SIGILL',
      number: 4,
      action: 'core',
      description: 'Invalid machine instruction',
      standard: 'ansi',
    },
    {
      name: 'SIGTRAP',
      number: 5,
      action: 'core',
      description: 'Debugger breakpoint',
      standard: 'posix',
    },
    { name: 'SIGABRT', number: 6, action: 'core', description: 'Aborted', standard: 'ansi' },
    { name: 'SIGIOT', number: 6, action: 'core', description: 'Aborted', standard: 'bsd' },
    {
      name: 'SIGBUS',
      number: 7,
      action: 'core',
      description: 'Bus error due to misaligned, non-existing address or paging error',
      standard: 'bsd',
    },
    {
      name: 'SIGEMT',
      number: 7,
      action: 'terminate',
      description: 'Command should be emulated but is not implemented',
      standard: 'other',
    },
    {
      name: 'SIGFPE',
      number: 8,
      action: 'core',
      description: 'Floating point arithmetic error',
      standard: 'ansi',
    },
    {
      name: 'SIGKILL',
      number: 9,
      action: 'terminate',
      description: 'Forced termination',
      standard: 'posix',
      forced: !0,
    },
    {
      name: 'SIGUSR1',
      number: 10,
      action: 'terminate',
      description: 'Application-specific signal',
      standard: 'posix',
    },
    {
      name: 'SIGSEGV',
      number: 11,
      action: 'core',
      description: 'Segmentation fault',
      standard: 'ansi',
    },
    {
      name: 'SIGUSR2',
      number: 12,
      action: 'terminate',
      description: 'Application-specific signal',
      standard: 'posix',
    },
    {
      name: 'SIGPIPE',
      number: 13,
      action: 'terminate',
      description: 'Broken pipe or socket',
      standard: 'posix',
    },
    {
      name: 'SIGALRM',
      number: 14,
      action: 'terminate',
      description: 'Timeout or timer',
      standard: 'posix',
    },
    {
      name: 'SIGTERM',
      number: 15,
      action: 'terminate',
      description: 'Termination',
      standard: 'ansi',
    },
    {
      name: 'SIGSTKFLT',
      number: 16,
      action: 'terminate',
      description: 'Stack is empty or overflowed',
      standard: 'other',
    },
    {
      name: 'SIGCHLD',
      number: 17,
      action: 'ignore',
      description: 'Child process terminated, paused or unpaused',
      standard: 'posix',
    },
    {
      name: 'SIGCLD',
      number: 17,
      action: 'ignore',
      description: 'Child process terminated, paused or unpaused',
      standard: 'other',
    },
    {
      name: 'SIGCONT',
      number: 18,
      action: 'unpause',
      description: 'Unpaused',
      standard: 'posix',
      forced: !0,
    },
    {
      name: 'SIGSTOP',
      number: 19,
      action: 'pause',
      description: 'Paused',
      standard: 'posix',
      forced: !0,
    },
    {
      name: 'SIGTSTP',
      number: 20,
      action: 'pause',
      description: 'Paused using CTRL-Z or "suspend"',
      standard: 'posix',
    },
    {
      name: 'SIGTTIN',
      number: 21,
      action: 'pause',
      description: 'Background process cannot read terminal input',
      standard: 'posix',
    },
    {
      name: 'SIGBREAK',
      number: 21,
      action: 'terminate',
      description: 'User interruption with CTRL-BREAK',
      standard: 'other',
    },
    {
      name: 'SIGTTOU',
      number: 22,
      action: 'pause',
      description: 'Background process cannot write to terminal output',
      standard: 'posix',
    },
    {
      name: 'SIGURG',
      number: 23,
      action: 'ignore',
      description: 'Socket received out-of-band data',
      standard: 'bsd',
    },
    {
      name: 'SIGXCPU',
      number: 24,
      action: 'core',
      description: 'Process timed out',
      standard: 'bsd',
    },
    { name: 'SIGXFSZ', number: 25, action: 'core', description: 'File too big', standard: 'bsd' },
    {
      name: 'SIGVTALRM',
      number: 26,
      action: 'terminate',
      description: 'Timeout or timer',
      standard: 'bsd',
    },
    {
      name: 'SIGPROF',
      number: 27,
      action: 'terminate',
      description: 'Timeout or timer',
      standard: 'bsd',
    },
    {
      name: 'SIGWINCH',
      number: 28,
      action: 'ignore',
      description: 'Terminal window size changed',
      standard: 'bsd',
    },
    {
      name: 'SIGIO',
      number: 29,
      action: 'terminate',
      description: 'I/O is available',
      standard: 'other',
    },
    {
      name: 'SIGPOLL',
      number: 29,
      action: 'terminate',
      description: 'Watched event',
      standard: 'other',
    },
    {
      name: 'SIGINFO',
      number: 29,
      action: 'ignore',
      description: 'Request for process information',
      standard: 'other',
    },
    {
      name: 'SIGPWR',
      number: 30,
      action: 'terminate',
      description: 'Device running out of power',
      standard: 'systemv',
    },
    {
      name: 'SIGSYS',
      number: 31,
      action: 'core',
      description: 'Invalid system call',
      standard: 'other',
    },
    {
      name: 'SIGUNUSED',
      number: 31,
      action: 'terminate',
      description: 'Invalid system call',
      standard: 'other',
    },
  ];
  St.SIGNALS = dl;
});
var Br = f(ae => {
  'use strict';
  Object.defineProperty(ae, '__esModule', { value: !0 });
  ae.SIGRTMAX = ae.getRealtimeSignals = void 0;
  var hl = function () {
    let t = Ii - ki + 1;
    return Array.from({ length: t }, pl);
  };
  ae.getRealtimeSignals = hl;
  var pl = function (t, e) {
      return {
        name: `SIGRT${e + 1}`,
        number: ki + e,
        action: 'terminate',
        description: 'Application-specific signal (realtime)',
        standard: 'posix',
      };
    },
    ki = 34,
    Ii = 64;
  ae.SIGRTMAX = Ii;
});
var Ai = f(Et => {
  'use strict';
  Object.defineProperty(Et, '__esModule', { value: !0 });
  Et.getSignals = void 0;
  var ml = require('os'),
    gl = Ti(),
    yl = Br(),
    _l = function () {
      let t = (0, yl.getRealtimeSignals)();
      return [...gl.SIGNALS, ...t].map(wl);
    };
  Et.getSignals = _l;
  var wl = function ({
    name: t,
    number: e,
    description: r,
    action: s,
    forced: n = !1,
    standard: i,
  }) {
    let {
        signals: { [t]: o },
      } = ml.constants,
      a = o !== void 0;
    return {
      name: t,
      number: a ? o : e,
      description: r,
      supported: a,
      action: s,
      forced: n,
      standard: i,
    };
  };
});
var Ri = f(ce => {
  'use strict';
  Object.defineProperty(ce, '__esModule', { value: !0 });
  ce.signalsByNumber = ce.signalsByName = void 0;
  var xl = require('os'),
    Li = Ai(),
    Sl = Br(),
    El = function () {
      return (0, Li.getSignals)().reduce(vl, {});
    },
    vl = function (
      t,
      { name: e, number: r, description: s, supported: n, action: i, forced: o, standard: a },
    ) {
      return {
        ...t,
        [e]: {
          name: e,
          number: r,
          description: s,
          supported: n,
          action: i,
          forced: o,
          standard: a,
        },
      };
    },
    bl = El();
  ce.signalsByName = bl;
  var Cl = function () {
      let t = (0, Li.getSignals)(),
        e = Sl.SIGRTMAX + 1,
        r = Array.from({ length: e }, (s, n) => Pl(n, t));
      return Object.assign({}, ...r);
    },
    Pl = function (t, e) {
      let r = Ol(t, e);
      if (r === void 0) return {};
      let { name: s, description: n, supported: i, action: o, forced: a, standard: c } = r;
      return {
        [t]: {
          name: s,
          number: t,
          description: n,
          supported: i,
          action: o,
          forced: a,
          standard: c,
        },
      };
    },
    Ol = function (t, e) {
      let r = e.find(({ name: s }) => xl.constants.signals[s] === t);
      return r !== void 0 ? r : e.find(s => s.number === t);
    },
    Tl = Cl();
  ce.signalsByNumber = Tl;
});
var qi = f((nd, Bi) => {
  'use strict';
  var { signalsByName: kl } = Ri(),
    Il = ({
      timedOut: t,
      timeout: e,
      errorCode: r,
      signal: s,
      signalDescription: n,
      exitCode: i,
      isCanceled: o,
    }) =>
      t
        ? `timed out after ${e} milliseconds`
        : o
          ? 'was canceled'
          : r !== void 0
            ? `failed with ${r}`
            : s !== void 0
              ? `was killed with ${s} (${n})`
              : i !== void 0
                ? `failed with exit code ${i}`
                : 'failed',
    Al = ({
      stdout: t,
      stderr: e,
      all: r,
      error: s,
      signal: n,
      exitCode: i,
      command: o,
      escapedCommand: a,
      timedOut: c,
      isCanceled: l,
      killed: u,
      parsed: {
        options: { timeout: d },
      },
    }) => {
      (i = i === null ? void 0 : i), (n = n === null ? void 0 : n);
      let p = n === void 0 ? void 0 : kl[n].description,
        g = s && s.code,
        h = `Command ${Il({ timedOut: c, timeout: d, errorCode: g, signal: n, signalDescription: p, exitCode: i, isCanceled: l })}: ${o}`,
        _ = Object.prototype.toString.call(s) === '[object Error]',
        k = _
          ? `${h}
${s.message}`
          : h,
        A = [k, e, t].filter(Boolean).join(`
`);
      return (
        _ ? ((s.originalMessage = s.message), (s.message = A)) : (s = new Error(A)),
        (s.shortMessage = k),
        (s.command = o),
        (s.escapedCommand = a),
        (s.exitCode = i),
        (s.signal = n),
        (s.signalDescription = p),
        (s.stdout = t),
        (s.stderr = e),
        r !== void 0 && (s.all = r),
        'bufferedData' in s && delete s.bufferedData,
        (s.failed = !0),
        (s.timedOut = !!c),
        (s.isCanceled = l),
        (s.killed = u && !c),
        s
      );
    };
  Bi.exports = Al;
});
var Mi = f((id, qr) => {
  'use strict';
  var vt = ['stdin', 'stdout', 'stderr'],
    Ll = t => vt.some(e => t[e] !== void 0),
    Ni = t => {
      if (!t) return;
      let { stdio: e } = t;
      if (e === void 0) return vt.map(s => t[s]);
      if (Ll(t))
        throw new Error(
          `It's not possible to provide \`stdio\` in combination with one of ${vt.map(s => `\`${s}\``).join(', ')}`,
        );
      if (typeof e == 'string') return e;
      if (!Array.isArray(e))
        throw new TypeError(
          `Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof e}\``,
        );
      let r = Math.max(e.length, vt.length);
      return Array.from({ length: r }, (s, n) => e[n]);
    };
  qr.exports = Ni;
  qr.exports.node = t => {
    let e = Ni(t);
    return e === 'ipc'
      ? 'ipc'
      : e === void 0 || typeof e == 'string'
        ? [e, e, e, 'ipc']
        : e.includes('ipc')
          ? e
          : [...e, 'ipc'];
  };
});
var Fi = f((od, bt) => {
  'use strict';
  bt.exports = ['SIGABRT', 'SIGALRM', 'SIGHUP', 'SIGINT', 'SIGTERM'];
  process.platform !== 'win32' &&
    bt.exports.push(
      'SIGVTALRM',
      'SIGXCPU',
      'SIGXFSZ',
      'SIGUSR2',
      'SIGTRAP',
      'SIGSYS',
      'SIGQUIT',
      'SIGIOT',
    );
  process.platform === 'linux' &&
    bt.exports.push('SIGIO', 'SIGPOLL', 'SIGPWR', 'SIGSTKFLT', 'SIGUNUSED');
});
var Wi = f((ad, fe) => {
  'use strict';
  var y = global.process,
    X = function (t) {
      return (
        t &&
        typeof t == 'object' &&
        typeof t.removeListener == 'function' &&
        typeof t.emit == 'function' &&
        typeof t.reallyExit == 'function' &&
        typeof t.listeners == 'function' &&
        typeof t.kill == 'function' &&
        typeof t.pid == 'number' &&
        typeof t.on == 'function'
      );
    };
  X(y)
    ? ((Di = require('assert')),
      (le = Fi()),
      ($i = /^win/i.test(y.platform)),
      (Ae = require('events')),
      typeof Ae != 'function' && (Ae = Ae.EventEmitter),
      y.__signal_exit_emitter__
        ? (x = y.__signal_exit_emitter__)
        : ((x = y.__signal_exit_emitter__ = new Ae()), (x.count = 0), (x.emitted = {})),
      x.infinite || (x.setMaxListeners(1 / 0), (x.infinite = !0)),
      (fe.exports = function (t, e) {
        if (!X(global.process)) return function () {};
        Di.equal(typeof t, 'function', 'a callback must be provided for exit handler'),
          ue === !1 && Nr();
        var r = 'exit';
        e && e.alwaysLast && (r = 'afterexit');
        var s = function () {
          x.removeListener(r, t),
            x.listeners('exit').length === 0 && x.listeners('afterexit').length === 0 && Ct();
        };
        return x.on(r, t), s;
      }),
      (Ct = function () {
        !ue ||
          !X(global.process) ||
          ((ue = !1),
          le.forEach(function (e) {
            try {
              y.removeListener(e, Pt[e]);
            } catch {}
          }),
          (y.emit = Ot),
          (y.reallyExit = Mr),
          (x.count -= 1));
      }),
      (fe.exports.unload = Ct),
      (Y = function (e, r, s) {
        x.emitted[e] || ((x.emitted[e] = !0), x.emit(e, r, s));
      }),
      (Pt = {}),
      le.forEach(function (t) {
        Pt[t] = function () {
          if (X(global.process)) {
            var r = y.listeners(t);
            r.length === x.count &&
              (Ct(),
              Y('exit', null, t),
              Y('afterexit', null, t),
              $i && t === 'SIGHUP' && (t = 'SIGINT'),
              y.kill(y.pid, t));
          }
        };
      }),
      (fe.exports.signals = function () {
        return le;
      }),
      (ue = !1),
      (Nr = function () {
        ue ||
          !X(global.process) ||
          ((ue = !0),
          (x.count += 1),
          (le = le.filter(function (e) {
            try {
              return y.on(e, Pt[e]), !0;
            } catch {
              return !1;
            }
          })),
          (y.emit = Gi),
          (y.reallyExit = Ui));
      }),
      (fe.exports.load = Nr),
      (Mr = y.reallyExit),
      (Ui = function (e) {
        X(global.process) &&
          ((y.exitCode = e || 0),
          Y('exit', y.exitCode, null),
          Y('afterexit', y.exitCode, null),
          Mr.call(y, y.exitCode));
      }),
      (Ot = y.emit),
      (Gi = function (e, r) {
        if (e === 'exit' && X(global.process)) {
          r !== void 0 && (y.exitCode = r);
          var s = Ot.apply(this, arguments);
          return Y('exit', y.exitCode, null), Y('afterexit', y.exitCode, null), s;
        } else return Ot.apply(this, arguments);
      }))
    : (fe.exports = function () {
        return function () {};
      });
  var Di, le, $i, Ae, x, Ct, Y, Pt, ue, Nr, Mr, Ui, Ot, Gi;
});
var Hi = f((cd, ji) => {
  'use strict';
  var Rl = require('os'),
    Bl = Wi(),
    ql = 1e3 * 5,
    Nl = (t, e = 'SIGTERM', r = {}) => {
      let s = t(e);
      return Ml(t, e, r, s), s;
    },
    Ml = (t, e, r, s) => {
      if (!Fl(e, r, s)) return;
      let n = $l(r),
        i = setTimeout(() => {
          t('SIGKILL');
        }, n);
      i.unref && i.unref();
    },
    Fl = (t, { forceKillAfterTimeout: e }, r) => Dl(t) && e !== !1 && r,
    Dl = t =>
      t === Rl.constants.signals.SIGTERM || (typeof t == 'string' && t.toUpperCase() === 'SIGTERM'),
    $l = ({ forceKillAfterTimeout: t = !0 }) => {
      if (t === !0) return ql;
      if (!Number.isFinite(t) || t < 0)
        throw new TypeError(
          `Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${t}\` (${typeof t})`,
        );
      return t;
    },
    Ul = (t, e) => {
      t.kill() && (e.isCanceled = !0);
    },
    Gl = (t, e, r) => {
      t.kill(e), r(Object.assign(new Error('Timed out'), { timedOut: !0, signal: e }));
    },
    Wl = (t, { timeout: e, killSignal: r = 'SIGTERM' }, s) => {
      if (e === 0 || e === void 0) return s;
      let n,
        i = new Promise((a, c) => {
          n = setTimeout(() => {
            Gl(t, r, c);
          }, e);
        }),
        o = s.finally(() => {
          clearTimeout(n);
        });
      return Promise.race([i, o]);
    },
    jl = ({ timeout: t }) => {
      if (t !== void 0 && (!Number.isFinite(t) || t < 0))
        throw new TypeError(
          `Expected the \`timeout\` option to be a non-negative integer, got \`${t}\` (${typeof t})`,
        );
    },
    Hl = async (t, { cleanup: e, detached: r }, s) => {
      if (!e || r) return s;
      let n = Bl(() => {
        t.kill();
      });
      return s.finally(() => {
        n();
      });
    };
  ji.exports = {
    spawnedKill: Nl,
    spawnedCancel: Ul,
    setupTimeout: Wl,
    validateTimeout: jl,
    setExitHandler: Hl,
  };
});
var zi = f((ld, Vi) => {
  'use strict';
  var R = t => t !== null && typeof t == 'object' && typeof t.pipe == 'function';
  R.writable = t =>
    R(t) &&
    t.writable !== !1 &&
    typeof t._write == 'function' &&
    typeof t._writableState == 'object';
  R.readable = t =>
    R(t) &&
    t.readable !== !1 &&
    typeof t._read == 'function' &&
    typeof t._readableState == 'object';
  R.duplex = t => R.writable(t) && R.readable(t);
  R.transform = t =>
    R.duplex(t) && typeof t._transform == 'function' && typeof t._transformState == 'object';
  Vi.exports = R;
});
var Xi = f((ud, Ki) => {
  'use strict';
  var { PassThrough: Vl } = require('stream');
  Ki.exports = t => {
    t = { ...t };
    let { array: e } = t,
      { encoding: r } = t,
      s = r === 'buffer',
      n = !1;
    e ? (n = !(r || s)) : (r = r || 'utf8'), s && (r = null);
    let i = new Vl({ objectMode: n });
    r && i.setEncoding(r);
    let o = 0,
      a = [];
    return (
      i.on('data', c => {
        a.push(c), n ? (o = a.length) : (o += c.length);
      }),
      (i.getBufferedValue = () => (e ? a : s ? Buffer.concat(a, o) : a.join(''))),
      (i.getBufferedLength = () => o),
      i
    );
  };
});
var Yi = f((fd, Le) => {
  'use strict';
  var { constants: zl } = require('buffer'),
    Kl = require('stream'),
    { promisify: Xl } = require('util'),
    Yl = Xi(),
    Ql = Xl(Kl.pipeline),
    Tt = class extends Error {
      constructor() {
        super('maxBuffer exceeded'), (this.name = 'MaxBufferError');
      }
    };
  async function Fr(t, e) {
    if (!t) throw new Error('Expected a stream');
    e = { maxBuffer: 1 / 0, ...e };
    let { maxBuffer: r } = e,
      s = Yl(e);
    return (
      await new Promise((n, i) => {
        let o = a => {
          a && s.getBufferedLength() <= zl.MAX_LENGTH && (a.bufferedData = s.getBufferedValue()),
            i(a);
        };
        (async () => {
          try {
            await Ql(t, s), n();
          } catch (a) {
            o(a);
          }
        })(),
          s.on('data', () => {
            s.getBufferedLength() > r && o(new Tt());
          });
      }),
      s.getBufferedValue()
    );
  }
  Le.exports = Fr;
  Le.exports.buffer = (t, e) => Fr(t, { ...e, encoding: 'buffer' });
  Le.exports.array = (t, e) => Fr(t, { ...e, array: !0 });
  Le.exports.MaxBufferError = Tt;
});
var Zi = f((dd, Qi) => {
  'use strict';
  var { PassThrough: Zl } = require('stream');
  Qi.exports = function () {
    var t = [],
      e = new Zl({ objectMode: !0 });
    return (
      e.setMaxListeners(0),
      (e.add = r),
      (e.isEmpty = s),
      e.on('unpipe', n),
      Array.prototype.slice.call(arguments).forEach(r),
      e
    );
    function r(i) {
      return Array.isArray(i)
        ? (i.forEach(r), this)
        : (t.push(i),
          i.once('end', n.bind(null, i)),
          i.once('error', e.emit.bind(e, 'error')),
          i.pipe(e, { end: !1 }),
          this);
    }
    function s() {
      return t.length == 0;
    }
    function n(i) {
      (t = t.filter(function (o) {
        return o !== i;
      })),
        !t.length && e.readable && e.end();
    }
  };
});
var ro = f((hd, to) => {
  'use strict';
  var eo = zi(),
    Ji = Yi(),
    Jl = Zi(),
    eu = (t, e) => {
      e === void 0 || t.stdin === void 0 || (eo(e) ? e.pipe(t.stdin) : t.stdin.end(e));
    },
    tu = (t, { all: e }) => {
      if (!e || (!t.stdout && !t.stderr)) return;
      let r = Jl();
      return t.stdout && r.add(t.stdout), t.stderr && r.add(t.stderr), r;
    },
    Dr = async (t, e) => {
      if (t) {
        t.destroy();
        try {
          return await e;
        } catch (r) {
          return r.bufferedData;
        }
      }
    },
    $r = (t, { encoding: e, buffer: r, maxBuffer: s }) => {
      if (!(!t || !r))
        return e ? Ji(t, { encoding: e, maxBuffer: s }) : Ji.buffer(t, { maxBuffer: s });
    },
    ru = async ({ stdout: t, stderr: e, all: r }, { encoding: s, buffer: n, maxBuffer: i }, o) => {
      let a = $r(t, { encoding: s, buffer: n, maxBuffer: i }),
        c = $r(e, { encoding: s, buffer: n, maxBuffer: i }),
        l = $r(r, { encoding: s, buffer: n, maxBuffer: i * 2 });
      try {
        return await Promise.all([o, a, c, l]);
      } catch (u) {
        return Promise.all([
          { error: u, signal: u.signal, timedOut: u.timedOut },
          Dr(t, a),
          Dr(e, c),
          Dr(r, l),
        ]);
      }
    },
    su = ({ input: t }) => {
      if (eo(t)) throw new TypeError('The `input` option cannot be a stream in sync mode');
    };
  to.exports = { handleInput: eu, makeAllStream: tu, getSpawnedResult: ru, validateInputSync: su };
});
var no = f((pd, so) => {
  'use strict';
  var nu = (async () => {})().constructor.prototype,
    iu = ['then', 'catch', 'finally'].map(t => [t, Reflect.getOwnPropertyDescriptor(nu, t)]),
    ou = (t, e) => {
      for (let [r, s] of iu) {
        let n = typeof e == 'function' ? (...i) => Reflect.apply(s.value, e(), i) : s.value.bind(e);
        Reflect.defineProperty(t, r, { ...s, value: n });
      }
      return t;
    },
    au = t =>
      new Promise((e, r) => {
        t.on('exit', (s, n) => {
          e({ exitCode: s, signal: n });
        }),
          t.on('error', s => {
            r(s);
          }),
          t.stdin &&
            t.stdin.on('error', s => {
              r(s);
            });
      });
  so.exports = { mergePromise: ou, getSpawnedPromise: au };
});
var ao = f((md, oo) => {
  'use strict';
  var io = (t, e = []) => (Array.isArray(e) ? [t, ...e] : [t]),
    cu = /^[\w.-]+$/,
    lu = /"/g,
    uu = t => (typeof t != 'string' || cu.test(t) ? t : `"${t.replace(lu, '\\"')}"`),
    fu = (t, e) => io(t, e).join(' '),
    du = (t, e) =>
      io(t, e)
        .map(r => uu(r))
        .join(' '),
    hu = / +/g,
    pu = t => {
      let e = [];
      for (let r of t.trim().split(hu)) {
        let s = e[e.length - 1];
        s && s.endsWith('\\') ? (e[e.length - 1] = `${s.slice(0, -1)} ${r}`) : e.push(r);
      }
      return e;
    };
  oo.exports = { joinCommand: fu, getEscapedCommand: du, parseCommand: pu };
});
var mo = f((gd, de) => {
  'use strict';
  var mu = require('path'),
    Ur = require('child_process'),
    gu = _i(),
    yu = xi(),
    _u = vi(),
    wu = Oi(),
    kt = qi(),
    lo = Mi(),
    {
      spawnedKill: xu,
      spawnedCancel: Su,
      setupTimeout: Eu,
      validateTimeout: vu,
      setExitHandler: bu,
    } = Hi(),
    { handleInput: Cu, getSpawnedResult: Pu, makeAllStream: Ou, validateInputSync: Tu } = ro(),
    { mergePromise: co, getSpawnedPromise: ku } = no(),
    { joinCommand: uo, parseCommand: fo, getEscapedCommand: ho } = ao(),
    Iu = 1e3 * 1e3 * 100,
    Au = ({ env: t, extendEnv: e, preferLocal: r, localDir: s, execPath: n }) => {
      let i = e ? { ...process.env, ...t } : t;
      return r ? _u.env({ env: i, cwd: s, execPath: n }) : i;
    },
    po = (t, e, r = {}) => {
      let s = gu._parse(t, e, r);
      return (
        (t = s.command),
        (e = s.args),
        (r = s.options),
        (r = {
          maxBuffer: Iu,
          buffer: !0,
          stripFinalNewline: !0,
          extendEnv: !0,
          preferLocal: !1,
          localDir: r.cwd || process.cwd(),
          execPath: process.execPath,
          encoding: 'utf8',
          reject: !0,
          cleanup: !0,
          all: !1,
          windowsHide: !0,
          ...r,
        }),
        (r.env = Au(r)),
        (r.stdio = lo(r)),
        process.platform === 'win32' && mu.basename(t, '.exe') === 'cmd' && e.unshift('/q'),
        { file: t, args: e, options: r, parsed: s }
      );
    },
    Re = (t, e, r) =>
      typeof e != 'string' && !Buffer.isBuffer(e)
        ? r === void 0
          ? void 0
          : ''
        : t.stripFinalNewline
          ? yu(e)
          : e,
    It = (t, e, r) => {
      let s = po(t, e, r),
        n = uo(t, e),
        i = ho(t, e);
      vu(s.options);
      let o;
      try {
        o = Ur.spawn(s.file, s.args, s.options);
      } catch (g) {
        let m = new Ur.ChildProcess(),
          h = Promise.reject(
            kt({
              error: g,
              stdout: '',
              stderr: '',
              all: '',
              command: n,
              escapedCommand: i,
              parsed: s,
              timedOut: !1,
              isCanceled: !1,
              killed: !1,
            }),
          );
        return co(m, h);
      }
      let a = ku(o),
        c = Eu(o, s.options, a),
        l = bu(o, s.options, c),
        u = { isCanceled: !1 };
      (o.kill = xu.bind(null, o.kill.bind(o))), (o.cancel = Su.bind(null, o, u));
      let p = wu(async () => {
        let [{ error: g, exitCode: m, signal: h, timedOut: _ }, k, A, Ne] = await Pu(
            o,
            s.options,
            l,
          ),
          B = Re(s.options, k),
          $ = Re(s.options, A),
          pe = Re(s.options, Ne);
        if (g || m !== 0 || h !== null) {
          let Z = kt({
            error: g,
            exitCode: m,
            signal: h,
            stdout: B,
            stderr: $,
            all: pe,
            command: n,
            escapedCommand: i,
            parsed: s,
            timedOut: _,
            isCanceled: u.isCanceled,
            killed: o.killed,
          });
          if (!s.options.reject) return Z;
          throw Z;
        }
        return {
          command: n,
          escapedCommand: i,
          exitCode: 0,
          stdout: B,
          stderr: $,
          all: pe,
          failed: !1,
          timedOut: !1,
          isCanceled: !1,
          killed: !1,
        };
      });
      return Cu(o, s.options.input), (o.all = Ou(o, s.options)), co(o, p);
    };
  de.exports = It;
  de.exports.sync = (t, e, r) => {
    let s = po(t, e, r),
      n = uo(t, e),
      i = ho(t, e);
    Tu(s.options);
    let o;
    try {
      o = Ur.spawnSync(s.file, s.args, s.options);
    } catch (l) {
      throw kt({
        error: l,
        stdout: '',
        stderr: '',
        all: '',
        command: n,
        escapedCommand: i,
        parsed: s,
        timedOut: !1,
        isCanceled: !1,
        killed: !1,
      });
    }
    let a = Re(s.options, o.stdout, o.error),
      c = Re(s.options, o.stderr, o.error);
    if (o.error || o.status !== 0 || o.signal !== null) {
      let l = kt({
        stdout: a,
        stderr: c,
        error: o.error,
        signal: o.signal,
        exitCode: o.status,
        command: n,
        escapedCommand: i,
        parsed: s,
        timedOut: o.error && o.error.code === 'ETIMEDOUT',
        isCanceled: !1,
        killed: o.signal !== null,
      });
      if (!s.options.reject) return l;
      throw l;
    }
    return {
      command: n,
      escapedCommand: i,
      exitCode: 0,
      stdout: a,
      stderr: c,
      failed: !1,
      timedOut: !1,
      isCanceled: !1,
      killed: !1,
    };
  };
  de.exports.command = (t, e) => {
    let [r, ...s] = fo(t);
    return It(r, s, e);
  };
  de.exports.commandSync = (t, e) => {
    let [r, ...s] = fo(t);
    return It.sync(r, s, e);
  };
  de.exports.node = (t, e, r = {}) => {
    e && !Array.isArray(e) && typeof e == 'object' && ((r = e), (e = []));
    let s = lo.node(r),
      n = process.execArgv.filter(a => !a.startsWith('--inspect')),
      { nodePath: i = process.execPath, nodeOptions: o = n } = r;
    return It(i, [...o, t, ...(Array.isArray(e) ? e : [])], {
      ...r,
      stdin: void 0,
      stdout: void 0,
      stderr: void 0,
      stdio: s,
      shell: !1,
    });
  };
});
var Bu = {};
Oo(Bu, { activate: () => Lu, deactivate: () => Ru });
module.exports = To(Bu);
var es = require('node:util'),
  De = S(require('node:process'), 1),
  ts = require('node:child_process');
var Vr = require('node:util'),
  zr = S(require('node:process'), 1),
  Kr = require('node:child_process'),
  ko = (0, Vr.promisify)(Kr.execFile);
async function Nt() {
  if (zr.default.platform !== 'darwin') throw new Error('macOS only');
  let { stdout: t } = await ko('defaults', [
    'read',
    'com.apple.LaunchServices/com.apple.launchservices.secure',
    'LSHandlers',
  ]);
  return (
    /LSHandlerRoleAll = "(?!-)(?<id>[^"]+?)";\s+?LSHandlerURLScheme = (?:http|https);/.exec(t)
      ?.groups.id ?? 'com.apple.Safari'
  );
}
var Xr = S(require('node:process'), 1),
  Yr = require('node:util'),
  Mt = require('node:child_process'),
  Io = (0, Yr.promisify)(Mt.execFile);
async function Qr(t, { humanReadableOutput: e = !0 } = {}) {
  if (Xr.default.platform !== 'darwin') throw new Error('macOS only');
  let r = e ? [] : ['-ss'],
    { stdout: s } = await Io('osascript', ['-e', t, r]);
  return s.trim();
}
async function Ft(t) {
  return Qr(`tell application "Finder" to set app_path to application file id "${t}" as string
tell application "System Events" to get value of property list item "CFBundleName" of property list file (app_path & ":Contents:Info.plist")`);
}
var Zr = require('node:util'),
  Jr = require('node:child_process'),
  Ao = (0, Zr.promisify)(Jr.execFile),
  Lo = {
    AppXq0fevzme2pys62n3e0fbqa7peapykr8v: { name: 'Edge', id: 'com.microsoft.edge.old' },
    MSEdgeDHTML: { name: 'Edge', id: 'com.microsoft.edge' },
    MSEdgeHTM: { name: 'Edge', id: 'com.microsoft.edge' },
    'IE.HTTP': { name: 'Internet Explorer', id: 'com.microsoft.ie' },
    FirefoxURL: { name: 'Firefox', id: 'org.mozilla.firefox' },
    ChromeHTML: { name: 'Chrome', id: 'com.google.chrome' },
    BraveHTML: { name: 'Brave', id: 'com.brave.Browser' },
    BraveBHTML: { name: 'Brave Beta', id: 'com.brave.Browser.beta' },
    BraveSSHTM: { name: 'Brave Nightly', id: 'com.brave.Browser.nightly' },
  },
  Fe = class extends Error {};
async function Dt(t = Ao) {
  let { stdout: e } = await t('reg', [
      'QUERY',
      ' HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice',
      '/v',
      'ProgId',
    ]),
    r = /ProgId\s*REG_SZ\s*(?<id>\S+)/.exec(e);
  if (!r) throw new Fe(`Cannot find Windows browser in stdout: ${JSON.stringify(e)}`);
  let { id: s } = r.groups,
    n = Lo[s];
  if (!n) throw new Fe(`Unknown browser ID: ${s}`);
  return n;
}
var Ro = (0, es.promisify)(ts.execFile),
  Bo = t => t.toLowerCase().replaceAll(/(?:^|\s|-)\S/g, e => e.toUpperCase());
async function $t() {
  if (De.default.platform === 'darwin') {
    let t = await Nt();
    return { name: await Ft(t), id: t };
  }
  if (De.default.platform === 'linux') {
    let { stdout: t } = await Ro('xdg-mime', ['query', 'default', 'x-scheme-handler/http']),
      e = t.trim();
    return { name: Bo(e.replace(/.desktop$/, '').replace('-', ' ')), id: e };
  }
  if (De.default.platform === 'win32') return Dt();
  throw new Error('Only macOS, Linux, and Windows are supported');
}
var xo = require('os'),
  Q = S(require('vscode'));
var yn = S(require('vscode'));
var nn = require('child_process');
var $e = S(require('node:stream'), 1);
function me(t, e, r) {
  typeof r > 'u' && ((r = e), (e = t), (t = void 0)),
    $e.default.Duplex.call(this, t),
    typeof r.read != 'function' && (r = new $e.default.Readable(t).wrap(r)),
    (this._writable = e),
    (this._readable = r),
    (this._waiting = !1),
    e.once('finish', () => {
      this.end();
    }),
    this.once('finish', () => {
      e.end();
    }),
    r.on('readable', () => {
      this._waiting && ((this._waiting = !1), this._read());
    }),
    r.once('end', () => {
      this.push(null);
    }),
    (!t || typeof t.bubbleErrors > 'u' || t.bubbleErrors) &&
      (e.on('error', s => {
        this.emit('error', s);
      }),
      r.on('error', s => {
        this.emit('error', s);
      }));
}
me.prototype = Object.create($e.default.Duplex.prototype, { constructor: { value: me } });
me.prototype._write = function (t, e, r) {
  this._writable.write(t, e, r);
};
me.prototype._read = function () {
  let t,
    e = 0;
  for (; (t = this._readable.read()) !== null; ) this.push(t), e++;
  e === 0 && (this._waiting = !0);
};
function Ut(t, e, r) {
  return new me(t, e, r);
}
var on = require('http'),
  an = require('url'),
  lr = require('vscode');
var ja = S(is(), 1),
  Ha = S(Zt(), 1),
  Va = S(er(), 1),
  sn = S(ar(), 1),
  za = S(rn(), 1);
var Pe = sn.default;
var et = class {
    qOrFn = [];
    push(e) {
      typeof this.qOrFn == 'function' ? this.qOrFn(e) : this.qOrFn.push(e);
    }
    connect(e) {
      if (typeof this.qOrFn == 'function') throw new Error('Already connected');
      let r = this.qOrFn;
      this.qOrFn = e;
      for (let s of r) e(s);
    }
  },
  tt = class {
    errorEmitter = new lr.EventEmitter();
    onError = this.errorEmitter.event;
    closeEmitter = new lr.EventEmitter();
    onClose = this.closeEmitter.event;
    disposed = !1;
    browserProcess;
    socket;
    fromSocketQueue = new et();
    fromBrowserQueue = new et();
    constructor() {
      this.onClose(() => this.dispose()), this.onError(() => this.dispose());
    }
    attachSocket(e, r, s, n) {
      let i = new an.URL(`ws://${e}:${r}${s}`),
        o = Date.now() + 5e3;
      n ? this.attachSocketWsl(i, n, o) : this.attachSocketLoop(i, o);
    }
    attachChild(e) {
      if (this.disposed) {
        e.dispose();
        return;
      }
      (this.browserProcess = e),
        e.onClose(() => this.closeEmitter.fire()),
        e.onError(r => this.errorEmitter.fire(r)),
        e.onMessage(r => this.fromBrowserQueue.push(r)),
        this.fromSocketQueue.connect(r => e.send(r));
    }
    dispose() {
      this.disposed || (this.browserProcess?.dispose(), this.socket?.close(), (this.disposed = !0));
    }
    attachSocketWsl(e, r, s) {
      let n = new on.Agent();
      n.createConnection = (o, a) => {
        let c = (0, nn.spawn)('wsl.exe', [
          '-d',
          r.distro,
          '-u',
          r.user,
          '--',
          r.execPath,
          '-e',
          `'s=net.connect(${e.port});s.pipe(process.stdout);process.stdin.pipe(s)'`,
        ]);
        c.on('error', a),
          c.on('spawn', () => {
            a(null, Ka(Ut(c.stdin, c.stdout)));
          });
      };
      let i = new Pe(e, { agent: n });
      this.setupSocket(i, e, s);
    }
    attachSocketLoop(e, r) {
      if (this.disposed) return;
      let s = new Pe(e, { perMessageDeflate: !0 });
      this.setupSocket(s, e, r);
    }
    setupSocket(e, r, s) {
      e.on('open', () => {
        if (this.disposed) {
          e.close();
          return;
        }
        (this.socket = e),
          this.socket.on('close', () => this.closeEmitter.fire()),
          this.socket.on('message', n => this.fromSocketQueue.push(n)),
          this.fromBrowserQueue.connect(n => e.send(n));
      }),
        e.on('error', n => {
          this.socket === e || Date.now() > s
            ? this.errorEmitter.fire(n)
            : setTimeout(() => this.attachSocketLoop(r, s), 100);
        });
    }
  },
  Ka = t => {
    let e = t;
    return Object.assign(t, {
      bufferSize: 0,
      bytesRead: 0,
      bytesWritten: 0,
      connecting: !1,
      localAddress: '127.0.0.1',
      localPort: 1,
      remoteAddress: '127.0.0.1',
      remoteFamily: 'tcp',
      remotePort: 1,
      address: () => ({ address: '127.0.0.1', family: 'tcp', port: 1 }),
      unref: () => e,
      ref: () => e,
      connect: (s, n, i) => (i && setImmediate(i), e),
      setKeepAlive: () => e,
      setNoDelay: () => e,
      setTimeout: (s, n) => (n?.(), e),
    });
  };
var mn = S(fn()),
  P = require('vscode');
var pn = S(require('http')),
  se = require('url');
async function ur(t, e) {
  try {
    return await ec(t, e);
  } catch (r) {
    if (e.isCancellationRequested)
      throw new Error(`Could not connect to debug target at ${t}: ${r}`);
    return await new Promise(s => setTimeout(s, 200)), ur(t, e);
  }
}
async function ec(t, e) {
  let r = await dn((0, se.resolve)(t, '/json/version'), e);
  if (r?.webSocketDebuggerUrl) return hn(t, r.webSocketDebuggerUrl);
  let s = await dn((0, se.resolve)(t, '/json/list'), e);
  if (s?.length) return hn(t, s[0].webSocketDebuggerUrl);
  throw new Error('Could not find any debuggable target');
}
async function dn(t, e) {
  return JSON.parse(await tc(t, e));
}
function tc(t, e) {
  let r = [];
  return new Promise((s, n) => {
    let i = pn.request(t, { headers: { host: 'localhost' } }, o => {
      r.push(e.onCancellationRequested(() => o.destroy()));
      let a = '';
      o.setEncoding('utf8'), o.on('data', c => (a += c)), o.on('end', () => s(a)), o.on('error', n);
    });
    r.push(
      e.onCancellationRequested(() => {
        i.destroy(), n(new Error(`Cancelled GET ${t}`));
      }),
    ),
      i.on('error', n),
      i.end();
  }).finally(() => r.forEach(s => s.dispose()));
}
function hn(t, e) {
  let r = new se.URL(t),
    s = new se.URL(e);
  return (s.host = r.host), s.toString();
}
var gn = async t => {
    t.exitCode ||
      (await Promise.race([
        new Promise(e => t.on('exit', e)),
        new Promise(e => setTimeout(e, 1e3)),
      ]));
  },
  st = class {
    constructor(e) {
      this.process = e;
      if (this.process.stdio.length < 5) throw new Error('Insufficient fd number on child process');
      e.on('error', r => this.errorEmitter.fire(r)),
        e.on('exit', () => this.closeEmitter.fire()),
        e.stdio[4]
          .pipe((0, mn.default)('\0'))
          .on('data', r => this.messageEmitter.fire(r))
          .resume();
    }
    errorEmitter = new P.EventEmitter();
    closeEmitter = new P.EventEmitter();
    messageEmitter = new P.EventEmitter();
    onError = this.errorEmitter.event;
    onClose = this.closeEmitter.event;
    onMessage = this.messageEmitter.event;
    send(e) {
      let r = this.process.stdio[3];
      if (e instanceof Uint8Array) r.write(e);
      else if (e instanceof ArrayBuffer) r.write(new Uint8Array(e));
      else for (let s of e) r.write(s);
      r.write('\0');
    }
    async dispose() {
      await gn(this.process), this.process.kill();
    }
  },
  Oe = class t {
    constructor(e) {
      this.ws = e;
      e.on('error', r => this.errorEmitter.fire(r)),
        e.on('close', () => this.closeEmitter.fire()),
        e.on('message', r => this.messageEmitter.fire(r));
    }
    errorEmitter = new P.EventEmitter();
    closeEmitter = new P.EventEmitter();
    messageEmitter = new P.EventEmitter();
    onError = this.errorEmitter.event;
    onClose = this.closeEmitter.event;
    onMessage = this.messageEmitter.event;
    static async create(e, r) {
      let s = new P.CancellationTokenSource();
      setTimeout(() => s.cancel(), 10 * 1e3);
      let n = await ur(`http://${e}:${r}`, s.token),
        i = new Pe(n, [], {
          headers: { host: 'localhost' },
          perMessageDeflate: !1,
          maxPayload: 256 * 1024 * 1024,
          followRedirects: !0,
        });
      return await new Promise((o, a) => {
        i.addEventListener('open', () => o(new t(i))), i.addEventListener('error', c => a(c.error));
      });
    }
    send(e) {
      this.ws.send(e.toString());
    }
    async dispose() {
      await new Promise(e => {
        this.ws.on('close', e), this.ws.close();
      });
    }
  },
  nt = class t {
    constructor(e, r) {
      this.process = e;
      this.attach = r;
      e.on('error', s => this.errorEmitter.fire(s)),
        e.on('close', () => this.closeEmitter.fire()),
        r.onError(s => this.errorEmitter.fire(s)),
        r.onClose(() => this.closeEmitter.fire()),
        r.onMessage(s => this.messageEmitter.fire(s));
    }
    errorEmitter = new P.EventEmitter();
    closeEmitter = new P.EventEmitter();
    messageEmitter = new P.EventEmitter();
    onError = this.errorEmitter.event;
    onClose = this.closeEmitter.event;
    onMessage = this.messageEmitter.event;
    static async create(e, r) {
      let s = new P.CancellationTokenSource();
      setTimeout(() => s.cancel(), 10 * 1e3);
      try {
        let n = await Oe.create('localhost', r);
        return new t(e, n);
      } catch (n) {
        throw (e.kill(), n);
      }
    }
    send(e) {
      this.attach.send(e);
    }
    async dispose() {
      this.attach.dispose(), await gn(this.process), this.process.kill();
    }
  };
var it = class {
  constructor(e) {
    this.spawn = e;
  }
  sessions = new Map();
  async create(e) {
    let r = new tt();
    this.sessions.set(e.launchId, r),
      r.onClose(() => this.sessions.delete(e.launchId)),
      r.onError(s => {
        yn.window.showErrorMessage(`Error running browser: ${s.message || s.stack}`),
          this.sessions.delete(e.launchId);
      }),
      await Promise.all([
        this.addChildSocket(r, e),
        e.attach ? this.addChildAttach(r, e.attach) : this.addChildBrowser(r, e),
      ]);
  }
  destroy(e) {
    this.sessions.get(e)?.dispose(), this.sessions.delete(e);
  }
  dispose() {
    for (let e of this.sessions.values()) e.dispose();
    this.sessions.clear();
  }
  async addChildSocket(e, r) {
    let [s, n] = r.proxyUri.split(':');
    e.attachSocket(s, Number(n), r.path, r.wslInfo);
  }
  async addChildBrowser(e, r) {
    let s = await this.spawn.launch(r);
    e.attachChild(s);
  }
  async addChildAttach(e, r) {
    let s = await Oe.create(r.host, r.port);
    e.attachChild(s);
  }
};
var D = S(An()),
  At = require('child_process'),
  Lt = S(mo()),
  Rt = require('fs'),
  wo = require('path'),
  Be = S(require('vscode'));
var he = class extends Error {};
var go = require('fs');
async function Gr(t) {
  try {
    return await go.promises.access(t), !0;
  } catch {
    return !1;
  }
}
var yo = '--remote-debugging-port=',
  _o = '--remote-debugging-port=',
  Wr = 'availableBrowsers_',
  Bt = class {
    constructor(e, r) {
      this.storagePath = e;
      this.context = r;
    }
    finders = {
      edge: new D.EdgeBrowserFinder(process.env, Rt.promises, Lt.default),
      chrome: new D.ChromeBrowserFinder(process.env, Rt.promises, Lt.default),
      firefox: new D.FirefoxBrowserFinder(process.env, Rt.promises, Lt.default),
    };
    async findBrowserPath(e, r) {
      if (r !== '*' && !(0, D.isQuality)(r)) return r;
      if (!(e in this.finders)) throw new he(`Browser type "${e}" is not supported.`);
      let s = this.context.globalState.get(Wr + e) || (await this.finders[e].findAll()),
        n =
          r === '*' ? (s.find(i => i.quality === 'stable') ?? s[0]) : s.find(i => i.quality === r);
      if (!n)
        throw (
          (await this.context.globalState.update(Wr + e, void 0),
          r === 'stable' && !s.length
            ? new he(
                Be.l10n.t(
                  'Unable to find a {0} installation on your system. Try installing it, or providing an absolute path to the browser in the "runtimeExecutable" in your launch.json.',
                  e,
                ),
              )
            : new he(
                Be.l10n.t(
                  'Unable to find {0} version {1}. Available auto-discovered versions are: {2}. You can set the "runtimeExecutable" in your launch.json to one of these, or provide an absolute path to the browser executable.',
                  e,
                  r,
                  JSON.stringify([...new Set(s)]),
                ),
              ))
        );
      return await this.context.globalState.update(Wr + e, s), n.path;
    }
    async findBrowserByExe(e, r) {
      return r === '*'
        ? ((await e.findWhere(n => n.quality === 'stable')) || (await e.findAll())[0])?.path
        : (0, D.isQuality)(r)
          ? (await e.findWhere(s => s.quality === r))?.path
          : r;
    }
    async getUserDataDir(e) {
      let r = e.params.userDataDir;
      if (r === !1) return;
      let s = (0, wo.join)(
        this.storagePath,
        e.browserArgs?.includes('--headless') ? '.headless-profile' : '.profile',
      );
      return r === !0 || !(await Gr(r)) ? s : r;
    }
    async launchBrowserOnly(e, r) {
      let s = await this.findBrowserPath(e, '*');
      (0, At.spawn)(s, [r], { detached: !0, stdio: 'ignore' }).on('error', n => {
        Be.window.showErrorMessage(`Error running browser: ${n.message || n.stack}`);
      });
    }
    async launch(e) {
      let r = await this.findBrowserPath(e.type, e.params.runtimeExecutable),
        s = e.browserArgs.slice(),
        n = await this.getUserDataDir(e);
      n !== void 0 && s.unshift(`--user-data-dir=${n}`);
      let i = e.params.cwd || e.params.webRoot;
      (!i || !(await Gr(i))) && (i = process.cwd());
      let o = s.find(c => c.startsWith(yo))?.slice(yo.length);
      if (!o)
        return new st(
          (0, At.spawn)(r, s, {
            detached: process.platform !== 'win32',
            env: {
              ...process.env,
              GDK_PIXBUF_MODULEDIR: void 0,
              GDK_PIXBUF_MODULE_FILE: void 0,
              ELECTRON_RUN_AS_NODE: void 0,
              ...e.params.env,
            },
            stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'],
            cwd: i,
          }),
        );
      s.includes(_o) || s.unshift(_o);
      let a = (0, At.spawn)(r, s, {
        detached: process.platform !== 'win32',
        env: { ELECTRON_RUN_AS_NODE: void 0, ...e.params.env },
        stdio: 'ignore',
        cwd: i,
      });
      return await nt.create(a, Number(o));
    }
  };
var qe;
function Lu(t) {
  let e = new Bt(t.storageUri?.fsPath ?? (0, xo.tmpdir)(), t);
  (qe = new it(e)),
    t.subscriptions.push(
      Q.commands.registerCommand(
        'js-debug-companion.defaultBrowser',
        async () => (await $t()).name,
      ),
      Q.commands.registerCommand('js-debug-companion.launchAndAttach', r => {
        qe?.create(r).catch(s => Q.window.showErrorMessage(s.message));
      }),
      Q.commands.registerCommand('js-debug-companion.kill', ({ launchId: r }) => {
        qe?.destroy(r);
      }),
      Q.commands.registerCommand('js-debug-companion.launch', ({ browserType: r, URL: s }) => {
        e.launchBrowserOnly(r, s);
      }),
    );
}
function Ru() {
  qe?.dispose(), (qe = void 0);
}
0 && (module.exports = { activate, deactivate });
