(function (c, s) {
  typeof exports == "object" && typeof module < "u"
    ? s(exports, require("./acorn"))
    : typeof define == "function" && define.amd
      ? define(["exports", "acorn"], s)
      : ((c = typeof globalThis < "u" ? globalThis : c || self),
        s(((c.acorn = c.acorn || {}), (c.acorn.loose = {})), c.acorn));
})(exports, function (c, s) {
  "use strict";
  var N = "\u2716";
  function m(t) {
    return t.name === N;
  }
  function S() {}
  var u = function (e, i) {
    if (
      (i === void 0 && (i = {}),
      (this.toks = this.constructor.BaseParser.tokenizer(e, i)),
      (this.options = this.toks.options),
      (this.input = this.toks.input),
      (this.tok = this.last = { type: s.tokTypes.eof, start: 0, end: 0 }),
      (this.tok.validateRegExpFlags = S),
      (this.tok.validateRegExpPattern = S),
      this.options.locations)
    ) {
      var r = this.toks.curPosition();
      this.tok.loc = new s.SourceLocation(this.toks, r, r);
    }
    (this.ahead = []),
      (this.context = []),
      (this.curIndent = 0),
      (this.curLineStart = 0),
      (this.nextLineStart = this.lineEnd(this.curLineStart) + 1),
      (this.inAsync = !1),
      (this.inGenerator = !1),
      (this.inFunction = !1);
  };
  (u.prototype.startNode = function () {
    return new s.Node(
      this.toks,
      this.tok.start,
      this.options.locations ? this.tok.loc.start : null,
    );
  }),
    (u.prototype.storeCurrentPos = function () {
      return this.options.locations
        ? [this.tok.start, this.tok.loc.start]
        : this.tok.start;
    }),
    (u.prototype.startNodeAt = function (e) {
      return this.options.locations
        ? new s.Node(this.toks, e[0], e[1])
        : new s.Node(this.toks, e);
    }),
    (u.prototype.finishNode = function (e, i) {
      return (
        (e.type = i),
        (e.end = this.last.end),
        this.options.locations && (e.loc.end = this.last.loc.end),
        this.options.ranges && (e.range[1] = this.last.end),
        e
      );
    }),
    (u.prototype.dummyNode = function (e) {
      var i = this.startNode();
      return (
        (i.type = e),
        (i.end = i.start),
        this.options.locations && (i.loc.end = i.loc.start),
        this.options.ranges && (i.range[1] = i.start),
        (this.last = {
          type: s.tokTypes.name,
          start: i.start,
          end: i.start,
          loc: i.loc,
        }),
        i
      );
    }),
    (u.prototype.dummyIdent = function () {
      var e = this.dummyNode("Identifier");
      return (e.name = N), e;
    }),
    (u.prototype.dummyString = function () {
      var e = this.dummyNode("Literal");
      return (e.value = e.raw = N), e;
    }),
    (u.prototype.eat = function (e) {
      return this.tok.type === e ? (this.next(), !0) : !1;
    }),
    (u.prototype.isContextual = function (e) {
      return this.tok.type === s.tokTypes.name && this.tok.value === e;
    }),
    (u.prototype.eatContextual = function (e) {
      return this.tok.value === e && this.eat(s.tokTypes.name);
    }),
    (u.prototype.canInsertSemicolon = function () {
      return (
        this.tok.type === s.tokTypes.eof ||
        this.tok.type === s.tokTypes.braceR ||
        s.lineBreak.test(this.input.slice(this.last.end, this.tok.start))
      );
    }),
    (u.prototype.semicolon = function () {
      return this.eat(s.tokTypes.semi);
    }),
    (u.prototype.expect = function (e) {
      if (this.eat(e)) return !0;
      for (var i = 1; i <= 2; i++)
        if (this.lookAhead(i).type === e) {
          for (var r = 0; r < i; r++) this.next();
          return !0;
        }
    }),
    (u.prototype.pushCx = function () {
      this.context.push(this.curIndent);
    }),
    (u.prototype.popCx = function () {
      this.curIndent = this.context.pop();
    }),
    (u.prototype.lineEnd = function (e) {
      for (; e < this.input.length && !s.isNewLine(this.input.charCodeAt(e)); )
        ++e;
      return e;
    }),
    (u.prototype.indentationAfter = function (e) {
      for (var i = 0; ; ++e) {
        var r = this.input.charCodeAt(e);
        if (r === 32) ++i;
        else if (r === 9) i += this.options.tabSize;
        else return i;
      }
    }),
    (u.prototype.closes = function (e, i, r, o) {
      return this.tok.type === e || this.tok.type === s.tokTypes.eof
        ? !0
        : r !== this.curLineStart &&
            this.curIndent < i &&
            this.tokenStartsLine() &&
            (!o ||
              this.nextLineStart >= this.input.length ||
              this.indentationAfter(this.nextLineStart) < i);
    }),
    (u.prototype.tokenStartsLine = function () {
      for (var e = this.tok.start - 1; e >= this.curLineStart; --e) {
        var i = this.input.charCodeAt(e);
        if (i !== 9 && i !== 32) return !1;
      }
      return !0;
    }),
    (u.prototype.extend = function (e, i) {
      this[e] = i(this[e]);
    }),
    (u.prototype.parse = function () {
      return this.next(), this.parseTopLevel();
    }),
    (u.extend = function () {
      for (var e = [], i = arguments.length; i--; ) e[i] = arguments[i];
      for (var r = this, o = 0; o < e.length; o++) r = e[o](r);
      return r;
    }),
    (u.parse = function (e, i) {
      return new this(e, i).parse();
    }),
    (u.BaseParser = s.Parser);
  var b = u.prototype;
  function E(t) {
    return (t < 14 && t > 8) || t === 32 || t === 160 || s.isNewLine(t);
  }
  (b.next = function () {
    if (
      ((this.last = this.tok),
      this.ahead.length
        ? (this.tok = this.ahead.shift())
        : (this.tok = this.readToken()),
      this.tok.start >= this.nextLineStart)
    ) {
      for (; this.tok.start >= this.nextLineStart; )
        (this.curLineStart = this.nextLineStart),
          (this.nextLineStart = this.lineEnd(this.curLineStart) + 1);
      this.curIndent = this.indentationAfter(this.curLineStart);
    }
  }),
    (b.readToken = function () {
      for (;;)
        try {
          return (
            this.toks.next(),
            this.toks.type === s.tokTypes.dot &&
              this.input.substr(this.toks.end, 1) === "." &&
              this.options.ecmaVersion >= 6 &&
              (this.toks.end++, (this.toks.type = s.tokTypes.ellipsis)),
            new s.Token(this.toks)
          );
        } catch (n) {
          if (!(n instanceof SyntaxError)) throw n;
          var t = n.message,
            e = n.raisedAt,
            i = !0;
          if (/unterminated/i.test(t))
            if (((e = this.lineEnd(n.pos + 1)), /string/.test(t)))
              i = {
                start: n.pos,
                end: e,
                type: s.tokTypes.string,
                value: this.input.slice(n.pos + 1, e),
              };
            else if (/regular expr/i.test(t)) {
              var r = this.input.slice(n.pos, e);
              try {
                r = new RegExp(r);
              } catch {}
              i = { start: n.pos, end: e, type: s.tokTypes.regexp, value: r };
            } else
              /template/.test(t)
                ? (i = {
                    start: n.pos,
                    end: e,
                    type: s.tokTypes.template,
                    value: this.input.slice(n.pos, e),
                  })
                : (i = !1);
          else if (
            /invalid (unicode|regexp|number)|expecting unicode|octal literal|is reserved|directly after number|expected number in radix/i.test(
              t,
            )
          )
            for (; e < this.input.length && !E(this.input.charCodeAt(e)); ) ++e;
          else if (/character escape|expected hexadecimal/i.test(t))
            for (; e < this.input.length; ) {
              var o = this.input.charCodeAt(e++);
              if (o === 34 || o === 39 || s.isNewLine(o)) break;
            }
          else if (/unexpected character/i.test(t)) e++, (i = !1);
          else if (/regular expression/i.test(t)) i = !0;
          else throw n;
          if (
            (this.resetTo(e),
            i === !0 &&
              (i = { start: e, end: e, type: s.tokTypes.name, value: N }),
            i)
          )
            return (
              this.options.locations &&
                (i.loc = new s.SourceLocation(
                  this.toks,
                  s.getLineInfo(this.input, i.start),
                  s.getLineInfo(this.input, i.end),
                )),
              i
            );
        }
    }),
    (b.resetTo = function (t) {
      (this.toks.pos = t), (this.toks.containsEsc = !1);
      var e = this.input.charAt(t - 1);
      if (
        ((this.toks.exprAllowed =
          !e ||
          /[[{(,;:?/*=+\-~!|&%^<>]/.test(e) ||
          (/[enwfd]/.test(e) &&
            /\b(case|else|return|throw|new|in|(instance|type)?of|delete|void)$/.test(
              this.input.slice(t - 10, t),
            ))),
        this.options.locations)
      ) {
        (this.toks.curLine = 1),
          (this.toks.lineStart = s.lineBreakG.lastIndex = 0);
        for (var i; (i = s.lineBreakG.exec(this.input)) && i.index < t; )
          ++this.toks.curLine, (this.toks.lineStart = i.index + i[0].length);
      }
    }),
    (b.lookAhead = function (t) {
      for (; t > this.ahead.length; ) this.ahead.push(this.readToken());
      return this.ahead[t - 1];
    });
  var f = u.prototype;
  (f.parseTopLevel = function () {
    var t = this.startNodeAt(
      this.options.locations ? [0, s.getLineInfo(this.input, 0)] : 0,
    );
    for (t.body = []; this.tok.type !== s.tokTypes.eof; )
      t.body.push(this.parseStatement());
    return (
      this.toks.adaptDirectivePrologue(t.body),
      (this.last = this.tok),
      (t.sourceType = this.options.sourceType),
      this.finishNode(t, "Program")
    );
  }),
    (f.parseStatement = function () {
      var t = this.tok.type,
        e = this.startNode(),
        i;
      switch ((this.toks.isLet() && ((t = s.tokTypes._var), (i = "let")), t)) {
        case s.tokTypes._break:
        case s.tokTypes._continue:
          this.next();
          var r = t === s.tokTypes._break;
          return (
            this.semicolon() || this.canInsertSemicolon()
              ? (e.label = null)
              : ((e.label =
                  this.tok.type === s.tokTypes.name ? this.parseIdent() : null),
                this.semicolon()),
            this.finishNode(e, r ? "BreakStatement" : "ContinueStatement")
          );
        case s.tokTypes._debugger:
          return (
            this.next(),
            this.semicolon(),
            this.finishNode(e, "DebuggerStatement")
          );
        case s.tokTypes._do:
          return (
            this.next(),
            (e.body = this.parseStatement()),
            (e.test = this.eat(s.tokTypes._while)
              ? this.parseParenExpression()
              : this.dummyIdent()),
            this.semicolon(),
            this.finishNode(e, "DoWhileStatement")
          );
        case s.tokTypes._for:
          this.next();
          var o = this.options.ecmaVersion >= 9 && this.eatContextual("await");
          if (
            (this.pushCx(),
            this.expect(s.tokTypes.parenL),
            this.tok.type === s.tokTypes.semi)
          )
            return this.parseFor(e, null);
          var n = this.toks.isLet();
          if (
            n ||
            this.tok.type === s.tokTypes._var ||
            this.tok.type === s.tokTypes._const
          ) {
            var p = this.parseVar(
              this.startNode(),
              !0,
              n ? "let" : this.tok.value,
            );
            return p.declarations.length === 1 &&
              (this.tok.type === s.tokTypes._in || this.isContextual("of"))
              ? (this.options.ecmaVersion >= 9 &&
                  this.tok.type !== s.tokTypes._in &&
                  (e.await = o),
                this.parseForIn(e, p))
              : this.parseFor(e, p);
          }
          var h = this.parseExpression(!0);
          return this.tok.type === s.tokTypes._in || this.isContextual("of")
            ? (this.options.ecmaVersion >= 9 &&
                this.tok.type !== s.tokTypes._in &&
                (e.await = o),
              this.parseForIn(e, this.toAssignable(h)))
            : this.parseFor(e, h);
        case s.tokTypes._function:
          return this.next(), this.parseFunction(e, !0);
        case s.tokTypes._if:
          return (
            this.next(),
            (e.test = this.parseParenExpression()),
            (e.consequent = this.parseStatement()),
            (e.alternate = this.eat(s.tokTypes._else)
              ? this.parseStatement()
              : null),
            this.finishNode(e, "IfStatement")
          );
        case s.tokTypes._return:
          return (
            this.next(),
            this.eat(s.tokTypes.semi) || this.canInsertSemicolon()
              ? (e.argument = null)
              : ((e.argument = this.parseExpression()), this.semicolon()),
            this.finishNode(e, "ReturnStatement")
          );
        case s.tokTypes._switch:
          var y = this.curIndent,
            k = this.curLineStart;
          this.next(),
            (e.discriminant = this.parseParenExpression()),
            (e.cases = []),
            this.pushCx(),
            this.expect(s.tokTypes.braceL);
          for (var l; !this.closes(s.tokTypes.braceR, y, k, !0); )
            if (
              this.tok.type === s.tokTypes._case ||
              this.tok.type === s.tokTypes._default
            ) {
              var v = this.tok.type === s.tokTypes._case;
              l && this.finishNode(l, "SwitchCase"),
                e.cases.push((l = this.startNode())),
                (l.consequent = []),
                this.next(),
                v ? (l.test = this.parseExpression()) : (l.test = null),
                this.expect(s.tokTypes.colon);
            } else
              l ||
                (e.cases.push((l = this.startNode())),
                (l.consequent = []),
                (l.test = null)),
                l.consequent.push(this.parseStatement());
          return (
            l && this.finishNode(l, "SwitchCase"),
            this.popCx(),
            this.eat(s.tokTypes.braceR),
            this.finishNode(e, "SwitchStatement")
          );
        case s.tokTypes._throw:
          return (
            this.next(),
            (e.argument = this.parseExpression()),
            this.semicolon(),
            this.finishNode(e, "ThrowStatement")
          );
        case s.tokTypes._try:
          if (
            (this.next(),
            (e.block = this.parseBlock()),
            (e.handler = null),
            this.tok.type === s.tokTypes._catch)
          ) {
            var d = this.startNode();
            this.next(),
              this.eat(s.tokTypes.parenL)
                ? ((d.param = this.toAssignable(this.parseExprAtom(), !0)),
                  this.expect(s.tokTypes.parenR))
                : (d.param = null),
              (d.body = this.parseBlock()),
              (e.handler = this.finishNode(d, "CatchClause"));
          }
          return (
            (e.finalizer = this.eat(s.tokTypes._finally)
              ? this.parseBlock()
              : null),
            !e.handler && !e.finalizer
              ? e.block
              : this.finishNode(e, "TryStatement")
          );
        case s.tokTypes._var:
        case s.tokTypes._const:
          return this.parseVar(e, !1, i || this.tok.value);
        case s.tokTypes._while:
          return (
            this.next(),
            (e.test = this.parseParenExpression()),
            (e.body = this.parseStatement()),
            this.finishNode(e, "WhileStatement")
          );
        case s.tokTypes._with:
          return (
            this.next(),
            (e.object = this.parseParenExpression()),
            (e.body = this.parseStatement()),
            this.finishNode(e, "WithStatement")
          );
        case s.tokTypes.braceL:
          return this.parseBlock();
        case s.tokTypes.semi:
          return this.next(), this.finishNode(e, "EmptyStatement");
        case s.tokTypes._class:
          return this.parseClass(!0);
        case s.tokTypes._import:
          if (this.options.ecmaVersion > 10) {
            var T = this.lookAhead(1).type;
            if (T === s.tokTypes.parenL || T === s.tokTypes.dot)
              return (
                (e.expression = this.parseExpression()),
                this.semicolon(),
                this.finishNode(e, "ExpressionStatement")
              );
          }
          return this.parseImport();
        case s.tokTypes._export:
          return this.parseExport();
        default:
          if (this.toks.isAsyncFunction())
            return this.next(), this.next(), this.parseFunction(e, !0, !0);
          var x = this.parseExpression();
          return m(x)
            ? (this.next(),
              this.tok.type === s.tokTypes.eof
                ? this.finishNode(e, "EmptyStatement")
                : this.parseStatement())
            : t === s.tokTypes.name &&
                x.type === "Identifier" &&
                this.eat(s.tokTypes.colon)
              ? ((e.body = this.parseStatement()),
                (e.label = x),
                this.finishNode(e, "LabeledStatement"))
              : ((e.expression = x),
                this.semicolon(),
                this.finishNode(e, "ExpressionStatement"));
      }
    }),
    (f.parseBlock = function () {
      var t = this.startNode();
      this.pushCx(), this.expect(s.tokTypes.braceL);
      var e = this.curIndent,
        i = this.curLineStart;
      for (t.body = []; !this.closes(s.tokTypes.braceR, e, i, !0); )
        t.body.push(this.parseStatement());
      return (
        this.popCx(),
        this.eat(s.tokTypes.braceR),
        this.finishNode(t, "BlockStatement")
      );
    }),
    (f.parseFor = function (t, e) {
      return (
        (t.init = e),
        (t.test = t.update = null),
        this.eat(s.tokTypes.semi) &&
          this.tok.type !== s.tokTypes.semi &&
          (t.test = this.parseExpression()),
        this.eat(s.tokTypes.semi) &&
          this.tok.type !== s.tokTypes.parenR &&
          (t.update = this.parseExpression()),
        this.popCx(),
        this.expect(s.tokTypes.parenR),
        (t.body = this.parseStatement()),
        this.finishNode(t, "ForStatement")
      );
    }),
    (f.parseForIn = function (t, e) {
      var i =
        this.tok.type === s.tokTypes._in ? "ForInStatement" : "ForOfStatement";
      return (
        this.next(),
        (t.left = e),
        (t.right = this.parseExpression()),
        this.popCx(),
        this.expect(s.tokTypes.parenR),
        (t.body = this.parseStatement()),
        this.finishNode(t, i)
      );
    }),
    (f.parseVar = function (t, e, i) {
      (t.kind = i), this.next(), (t.declarations = []);
      do {
        var r = this.startNode();
        (r.id =
          this.options.ecmaVersion >= 6
            ? this.toAssignable(this.parseExprAtom(), !0)
            : this.parseIdent()),
          (r.init = this.eat(s.tokTypes.eq) ? this.parseMaybeAssign(e) : null),
          t.declarations.push(this.finishNode(r, "VariableDeclarator"));
      } while (this.eat(s.tokTypes.comma));
      if (!t.declarations.length) {
        var o = this.startNode();
        (o.id = this.dummyIdent()),
          t.declarations.push(this.finishNode(o, "VariableDeclarator"));
      }
      return e || this.semicolon(), this.finishNode(t, "VariableDeclaration");
    }),
    (f.parseClass = function (t) {
      var e = this.startNode();
      this.next(),
        this.tok.type === s.tokTypes.name
          ? (e.id = this.parseIdent())
          : t === !0
            ? (e.id = this.dummyIdent())
            : (e.id = null),
        (e.superClass = this.eat(s.tokTypes._extends)
          ? this.parseExpression()
          : null),
        (e.body = this.startNode()),
        (e.body.body = []),
        this.pushCx();
      var i = this.curIndent + 1,
        r = this.curLineStart;
      for (
        this.eat(s.tokTypes.braceL),
          this.curIndent + 1 < i &&
            ((i = this.curIndent), (r = this.curLineStart));
        !this.closes(s.tokTypes.braceR, i, r);

      ) {
        var o = this.parseClassElement();
        o && e.body.body.push(o);
      }
      return (
        this.popCx(),
        this.eat(s.tokTypes.braceR) ||
          ((this.last.end = this.tok.start),
          this.options.locations && (this.last.loc.end = this.tok.loc.start)),
        this.semicolon(),
        this.finishNode(e.body, "ClassBody"),
        this.finishNode(e, t ? "ClassDeclaration" : "ClassExpression")
      );
    }),
    (f.parseClassElement = function () {
      if (this.eat(s.tokTypes.semi)) return null;
      var t = this.options,
        e = t.ecmaVersion,
        i = t.locations,
        r = this.curIndent,
        o = this.curLineStart,
        n = this.startNode(),
        p = "",
        h = !1,
        y = !1,
        k = "method",
        l = !1;
      if (this.eatContextual("static")) {
        if (e >= 13 && this.eat(s.tokTypes.braceL))
          return this.parseClassStaticBlock(n), n;
        this.isClassElementNameStart() || this.toks.type === s.tokTypes.star
          ? (l = !0)
          : (p = "static");
      }
      if (
        ((n.static = l),
        !p &&
          e >= 8 &&
          this.eatContextual("async") &&
          ((this.isClassElementNameStart() ||
            this.toks.type === s.tokTypes.star) &&
          !this.canInsertSemicolon()
            ? (y = !0)
            : (p = "async")),
        !p)
      ) {
        h = this.eat(s.tokTypes.star);
        var v = this.toks.value;
        (this.eatContextual("get") || this.eatContextual("set")) &&
          (this.isClassElementNameStart() ? (k = v) : (p = v));
      }
      if (p)
        (n.computed = !1),
          (n.key = this.startNodeAt(
            i
              ? [this.toks.lastTokStart, this.toks.lastTokStartLoc]
              : this.toks.lastTokStart,
          )),
          (n.key.name = p),
          this.finishNode(n.key, "Identifier");
      else if ((this.parseClassElementName(n), m(n.key)))
        return (
          m(this.parseMaybeAssign()) && this.next(),
          this.eat(s.tokTypes.comma),
          null
        );
      if (
        e < 13 ||
        this.toks.type === s.tokTypes.parenL ||
        k !== "method" ||
        h ||
        y
      ) {
        var d =
          !n.computed &&
          !n.static &&
          !h &&
          !y &&
          k === "method" &&
          ((n.key.type === "Identifier" && n.key.name === "constructor") ||
            (n.key.type === "Literal" && n.key.value === "constructor"));
        (n.kind = d ? "constructor" : k),
          (n.value = this.parseMethod(h, y)),
          this.finishNode(n, "MethodDefinition");
      } else {
        if (this.eat(s.tokTypes.eq))
          if (
            this.curLineStart !== o &&
            this.curIndent <= r &&
            this.tokenStartsLine()
          )
            n.value = null;
          else {
            var T = this.inAsync,
              x = this.inGenerator;
            (this.inAsync = !1),
              (this.inGenerator = !1),
              (n.value = this.parseMaybeAssign()),
              (this.inAsync = T),
              (this.inGenerator = x);
          }
        else n.value = null;
        this.semicolon(), this.finishNode(n, "PropertyDefinition");
      }
      return n;
    }),
    (f.parseClassStaticBlock = function (t) {
      var e = this.curIndent,
        i = this.curLineStart;
      for (
        t.body = [], this.pushCx();
        !this.closes(s.tokTypes.braceR, e, i, !0);

      )
        t.body.push(this.parseStatement());
      return (
        this.popCx(),
        this.eat(s.tokTypes.braceR),
        this.finishNode(t, "StaticBlock")
      );
    }),
    (f.isClassElementNameStart = function () {
      return this.toks.isClassElementNameStart();
    }),
    (f.parseClassElementName = function (t) {
      this.toks.type === s.tokTypes.privateId
        ? ((t.computed = !1), (t.key = this.parsePrivateIdent()))
        : this.parsePropertyName(t);
    }),
    (f.parseFunction = function (t, e, i) {
      var r = this.inAsync,
        o = this.inGenerator,
        n = this.inFunction;
      return (
        this.initFunction(t),
        this.options.ecmaVersion >= 6 &&
          (t.generator = this.eat(s.tokTypes.star)),
        this.options.ecmaVersion >= 8 && (t.async = !!i),
        this.tok.type === s.tokTypes.name
          ? (t.id = this.parseIdent())
          : e === !0 && (t.id = this.dummyIdent()),
        (this.inAsync = t.async),
        (this.inGenerator = t.generator),
        (this.inFunction = !0),
        (t.params = this.parseFunctionParams()),
        (t.body = this.parseBlock()),
        this.toks.adaptDirectivePrologue(t.body.body),
        (this.inAsync = r),
        (this.inGenerator = o),
        (this.inFunction = n),
        this.finishNode(t, e ? "FunctionDeclaration" : "FunctionExpression")
      );
    }),
    (f.parseExport = function () {
      var t = this.startNode();
      if ((this.next(), this.eat(s.tokTypes.star)))
        return (
          this.options.ecmaVersion >= 11 &&
            (this.eatContextual("as")
              ? (t.exported = this.parseExprAtom())
              : (t.exported = null)),
          (t.source = this.eatContextual("from")
            ? this.parseExprAtom()
            : this.dummyString()),
          this.semicolon(),
          this.finishNode(t, "ExportAllDeclaration")
        );
      if (this.eat(s.tokTypes._default)) {
        var e;
        if (
          this.tok.type === s.tokTypes._function ||
          (e = this.toks.isAsyncFunction())
        ) {
          var i = this.startNode();
          this.next(),
            e && this.next(),
            (t.declaration = this.parseFunction(i, "nullableID", e));
        } else
          this.tok.type === s.tokTypes._class
            ? (t.declaration = this.parseClass("nullableID"))
            : ((t.declaration = this.parseMaybeAssign()), this.semicolon());
        return this.finishNode(t, "ExportDefaultDeclaration");
      }
      return (
        this.tok.type.keyword ||
        this.toks.isLet() ||
        this.toks.isAsyncFunction()
          ? ((t.declaration = this.parseStatement()),
            (t.specifiers = []),
            (t.source = null))
          : ((t.declaration = null),
            (t.specifiers = this.parseExportSpecifierList()),
            (t.source = this.eatContextual("from")
              ? this.parseExprAtom()
              : null),
            this.semicolon()),
        this.finishNode(t, "ExportNamedDeclaration")
      );
    }),
    (f.parseImport = function () {
      var t = this.startNode();
      if ((this.next(), this.tok.type === s.tokTypes.string))
        (t.specifiers = []), (t.source = this.parseExprAtom());
      else {
        var e;
        this.tok.type === s.tokTypes.name &&
          this.tok.value !== "from" &&
          ((e = this.startNode()),
          (e.local = this.parseIdent()),
          this.finishNode(e, "ImportDefaultSpecifier"),
          this.eat(s.tokTypes.comma)),
          (t.specifiers = this.parseImportSpecifiers()),
          (t.source =
            this.eatContextual("from") && this.tok.type === s.tokTypes.string
              ? this.parseExprAtom()
              : this.dummyString()),
          e && t.specifiers.unshift(e);
      }
      return this.semicolon(), this.finishNode(t, "ImportDeclaration");
    }),
    (f.parseImportSpecifiers = function () {
      var t = [];
      if (this.tok.type === s.tokTypes.star) {
        var e = this.startNode();
        this.next(),
          (e.local = this.eatContextual("as")
            ? this.parseIdent()
            : this.dummyIdent()),
          t.push(this.finishNode(e, "ImportNamespaceSpecifier"));
      } else {
        var i = this.curIndent,
          r = this.curLineStart,
          o = this.nextLineStart;
        for (
          this.pushCx(),
            this.eat(s.tokTypes.braceL),
            this.curLineStart > o && (o = this.curLineStart);
          !this.closes(
            s.tokTypes.braceR,
            i + (this.curLineStart <= o ? 1 : 0),
            r,
          );

        ) {
          var n = this.startNode();
          if (this.eat(s.tokTypes.star))
            (n.local = this.eatContextual("as")
              ? this.parseModuleExportName()
              : this.dummyIdent()),
              this.finishNode(n, "ImportNamespaceSpecifier");
          else {
            if (
              this.isContextual("from") ||
              ((n.imported = this.parseModuleExportName()), m(n.imported))
            )
              break;
            (n.local = this.eatContextual("as")
              ? this.parseModuleExportName()
              : n.imported),
              this.finishNode(n, "ImportSpecifier");
          }
          t.push(n), this.eat(s.tokTypes.comma);
        }
        this.eat(s.tokTypes.braceR), this.popCx();
      }
      return t;
    }),
    (f.parseExportSpecifierList = function () {
      var t = [],
        e = this.curIndent,
        i = this.curLineStart,
        r = this.nextLineStart;
      for (
        this.pushCx(),
          this.eat(s.tokTypes.braceL),
          this.curLineStart > r && (r = this.curLineStart);
        !this.closes(
          s.tokTypes.braceR,
          e + (this.curLineStart <= r ? 1 : 0),
          i,
        ) && !this.isContextual("from");

      ) {
        var o = this.startNode();
        if (((o.local = this.parseModuleExportName()), m(o.local))) break;
        (o.exported = this.eatContextual("as")
          ? this.parseModuleExportName()
          : o.local),
          this.finishNode(o, "ExportSpecifier"),
          t.push(o),
          this.eat(s.tokTypes.comma);
      }
      return this.eat(s.tokTypes.braceR), this.popCx(), t;
    }),
    (f.parseModuleExportName = function () {
      return this.options.ecmaVersion >= 13 &&
        this.tok.type === s.tokTypes.string
        ? this.parseExprAtom()
        : this.parseIdent();
    });
  var a = u.prototype;
  (a.checkLVal = function (t) {
    if (!t) return t;
    switch (t.type) {
      case "Identifier":
      case "MemberExpression":
        return t;
      case "ParenthesizedExpression":
        return (t.expression = this.checkLVal(t.expression)), t;
      default:
        return this.dummyIdent();
    }
  }),
    (a.parseExpression = function (t) {
      var e = this.storeCurrentPos(),
        i = this.parseMaybeAssign(t);
      if (this.tok.type === s.tokTypes.comma) {
        var r = this.startNodeAt(e);
        for (r.expressions = [i]; this.eat(s.tokTypes.comma); )
          r.expressions.push(this.parseMaybeAssign(t));
        return this.finishNode(r, "SequenceExpression");
      }
      return i;
    }),
    (a.parseParenExpression = function () {
      this.pushCx(), this.expect(s.tokTypes.parenL);
      var t = this.parseExpression();
      return this.popCx(), this.expect(s.tokTypes.parenR), t;
    }),
    (a.parseMaybeAssign = function (t) {
      if (this.inGenerator && this.toks.isContextual("yield")) {
        var e = this.startNode();
        return (
          this.next(),
          this.semicolon() ||
          this.canInsertSemicolon() ||
          (this.tok.type !== s.tokTypes.star && !this.tok.type.startsExpr)
            ? ((e.delegate = !1), (e.argument = null))
            : ((e.delegate = this.eat(s.tokTypes.star)),
              (e.argument = this.parseMaybeAssign())),
          this.finishNode(e, "YieldExpression")
        );
      }
      var i = this.storeCurrentPos(),
        r = this.parseMaybeConditional(t);
      if (this.tok.type.isAssign) {
        var o = this.startNodeAt(i);
        return (
          (o.operator = this.tok.value),
          (o.left =
            this.tok.type === s.tokTypes.eq
              ? this.toAssignable(r)
              : this.checkLVal(r)),
          this.next(),
          (o.right = this.parseMaybeAssign(t)),
          this.finishNode(o, "AssignmentExpression")
        );
      }
      return r;
    }),
    (a.parseMaybeConditional = function (t) {
      var e = this.storeCurrentPos(),
        i = this.parseExprOps(t);
      if (this.eat(s.tokTypes.question)) {
        var r = this.startNodeAt(e);
        return (
          (r.test = i),
          (r.consequent = this.parseMaybeAssign()),
          (r.alternate = this.expect(s.tokTypes.colon)
            ? this.parseMaybeAssign(t)
            : this.dummyIdent()),
          this.finishNode(r, "ConditionalExpression")
        );
      }
      return i;
    }),
    (a.parseExprOps = function (t) {
      var e = this.storeCurrentPos(),
        i = this.curIndent,
        r = this.curLineStart;
      return this.parseExprOp(this.parseMaybeUnary(!1), e, -1, t, i, r);
    }),
    (a.parseExprOp = function (t, e, i, r, o, n) {
      if (
        this.curLineStart !== n &&
        this.curIndent < o &&
        this.tokenStartsLine()
      )
        return t;
      var p = this.tok.type.binop;
      if (p != null && (!r || this.tok.type !== s.tokTypes._in) && p > i) {
        var h = this.startNodeAt(e);
        if (
          ((h.left = t),
          (h.operator = this.tok.value),
          this.next(),
          this.curLineStart !== n &&
            this.curIndent < o &&
            this.tokenStartsLine())
        )
          h.right = this.dummyIdent();
        else {
          var y = this.storeCurrentPos();
          h.right = this.parseExprOp(this.parseMaybeUnary(!1), y, p, r, o, n);
        }
        return (
          this.finishNode(
            h,
            /&&|\|\||\?\?/.test(h.operator)
              ? "LogicalExpression"
              : "BinaryExpression",
          ),
          this.parseExprOp(h, e, i, r, o, n)
        );
      }
      return t;
    }),
    (a.parseMaybeUnary = function (t) {
      var e = this.storeCurrentPos(),
        i;
      if (
        this.options.ecmaVersion >= 8 &&
        this.toks.isContextual("await") &&
        (this.inAsync ||
          (this.toks.inModule && this.options.ecmaVersion >= 13) ||
          (!this.inFunction && this.options.allowAwaitOutsideFunction))
      )
        (i = this.parseAwait()), (t = !0);
      else if (this.tok.type.prefix) {
        var r = this.startNode(),
          o = this.tok.type === s.tokTypes.incDec;
        o || (t = !0),
          (r.operator = this.tok.value),
          (r.prefix = !0),
          this.next(),
          (r.argument = this.parseMaybeUnary(!0)),
          o && (r.argument = this.checkLVal(r.argument)),
          (i = this.finishNode(r, o ? "UpdateExpression" : "UnaryExpression"));
      } else if (this.tok.type === s.tokTypes.ellipsis) {
        var n = this.startNode();
        this.next(),
          (n.argument = this.parseMaybeUnary(t)),
          (i = this.finishNode(n, "SpreadElement"));
      } else if (!t && this.tok.type === s.tokTypes.privateId)
        i = this.parsePrivateIdent();
      else
        for (
          i = this.parseExprSubscripts();
          this.tok.type.postfix && !this.canInsertSemicolon();

        ) {
          var p = this.startNodeAt(e);
          (p.operator = this.tok.value),
            (p.prefix = !1),
            (p.argument = this.checkLVal(i)),
            this.next(),
            (i = this.finishNode(p, "UpdateExpression"));
        }
      if (!t && this.eat(s.tokTypes.starstar)) {
        var h = this.startNodeAt(e);
        return (
          (h.operator = "**"),
          (h.left = i),
          (h.right = this.parseMaybeUnary(!1)),
          this.finishNode(h, "BinaryExpression")
        );
      }
      return i;
    }),
    (a.parseExprSubscripts = function () {
      var t = this.storeCurrentPos();
      return this.parseSubscripts(
        this.parseExprAtom(),
        t,
        !1,
        this.curIndent,
        this.curLineStart,
      );
    }),
    (a.parseSubscripts = function (t, e, i, r, o) {
      for (var n = this.options.ecmaVersion >= 11, p = !1; ; ) {
        if (
          this.curLineStart !== o &&
          this.curIndent <= r &&
          this.tokenStartsLine()
        )
          if (this.tok.type === s.tokTypes.dot && this.curIndent === r) --r;
          else break;
        var h =
            t.type === "Identifier" &&
            t.name === "async" &&
            !this.canInsertSemicolon(),
          y = n && this.eat(s.tokTypes.questionDot);
        if (
          (y && (p = !0),
          (y &&
            this.tok.type !== s.tokTypes.parenL &&
            this.tok.type !== s.tokTypes.bracketL &&
            this.tok.type !== s.tokTypes.backQuote) ||
            this.eat(s.tokTypes.dot))
        ) {
          var k = this.startNodeAt(e);
          (k.object = t),
            this.curLineStart !== o &&
            this.curIndent <= r &&
            this.tokenStartsLine()
              ? (k.property = this.dummyIdent())
              : (k.property =
                  this.parsePropertyAccessor() || this.dummyIdent()),
            (k.computed = !1),
            n && (k.optional = y),
            (t = this.finishNode(k, "MemberExpression"));
        } else if (this.tok.type === s.tokTypes.bracketL) {
          this.pushCx(), this.next();
          var l = this.startNodeAt(e);
          (l.object = t),
            (l.property = this.parseExpression()),
            (l.computed = !0),
            n && (l.optional = y),
            this.popCx(),
            this.expect(s.tokTypes.bracketR),
            (t = this.finishNode(l, "MemberExpression"));
        } else if (!i && this.tok.type === s.tokTypes.parenL) {
          var v = this.parseExprList(s.tokTypes.parenR);
          if (h && this.eat(s.tokTypes.arrow))
            return this.parseArrowExpression(this.startNodeAt(e), v, !0);
          var d = this.startNodeAt(e);
          (d.callee = t),
            (d.arguments = v),
            n && (d.optional = y),
            (t = this.finishNode(d, "CallExpression"));
        } else if (this.tok.type === s.tokTypes.backQuote) {
          var T = this.startNodeAt(e);
          (T.tag = t),
            (T.quasi = this.parseTemplate()),
            (t = this.finishNode(T, "TaggedTemplateExpression"));
        } else break;
      }
      if (p) {
        var x = this.startNodeAt(e);
        (x.expression = t), (t = this.finishNode(x, "ChainExpression"));
      }
      return t;
    }),
    (a.parseExprAtom = function () {
      var t;
      switch (this.tok.type) {
        case s.tokTypes._this:
        case s.tokTypes._super:
          var e =
            this.tok.type === s.tokTypes._this ? "ThisExpression" : "Super";
          return (t = this.startNode()), this.next(), this.finishNode(t, e);
        case s.tokTypes.name:
          var i = this.storeCurrentPos(),
            r = this.parseIdent(),
            o = !1;
          if (r.name === "async" && !this.canInsertSemicolon()) {
            if (this.eat(s.tokTypes._function))
              return (
                this.toks.overrideContext(s.tokContexts.f_expr),
                this.parseFunction(this.startNodeAt(i), !1, !0)
              );
            this.tok.type === s.tokTypes.name &&
              ((r = this.parseIdent()), (o = !0));
          }
          return this.eat(s.tokTypes.arrow)
            ? this.parseArrowExpression(this.startNodeAt(i), [r], o)
            : r;
        case s.tokTypes.regexp:
          t = this.startNode();
          var n = this.tok.value;
          return (
            (t.regex = { pattern: n.pattern, flags: n.flags }),
            (t.value = n.value),
            (t.raw = this.input.slice(this.tok.start, this.tok.end)),
            this.next(),
            this.finishNode(t, "Literal")
          );
        case s.tokTypes.num:
        case s.tokTypes.string:
          return (
            (t = this.startNode()),
            (t.value = this.tok.value),
            (t.raw = this.input.slice(this.tok.start, this.tok.end)),
            this.tok.type === s.tokTypes.num &&
              t.raw.charCodeAt(t.raw.length - 1) === 110 &&
              (t.bigint = t.raw.slice(0, -1).replace(/_/g, "")),
            this.next(),
            this.finishNode(t, "Literal")
          );
        case s.tokTypes._null:
        case s.tokTypes._true:
        case s.tokTypes._false:
          return (
            (t = this.startNode()),
            (t.value =
              this.tok.type === s.tokTypes._null
                ? null
                : this.tok.type === s.tokTypes._true),
            (t.raw = this.tok.type.keyword),
            this.next(),
            this.finishNode(t, "Literal")
          );
        case s.tokTypes.parenL:
          var p = this.storeCurrentPos();
          this.next();
          var h = this.parseExpression();
          if ((this.expect(s.tokTypes.parenR), this.eat(s.tokTypes.arrow))) {
            var y = h.expressions || [h];
            return (
              y.length && m(y[y.length - 1]) && y.pop(),
              this.parseArrowExpression(this.startNodeAt(p), y)
            );
          }
          if (this.options.preserveParens) {
            var k = this.startNodeAt(p);
            (k.expression = h),
              (h = this.finishNode(k, "ParenthesizedExpression"));
          }
          return h;
        case s.tokTypes.bracketL:
          return (
            (t = this.startNode()),
            (t.elements = this.parseExprList(s.tokTypes.bracketR, !0)),
            this.finishNode(t, "ArrayExpression")
          );
        case s.tokTypes.braceL:
          return (
            this.toks.overrideContext(s.tokContexts.b_expr), this.parseObj()
          );
        case s.tokTypes._class:
          return this.parseClass(!1);
        case s.tokTypes._function:
          return (t = this.startNode()), this.next(), this.parseFunction(t, !1);
        case s.tokTypes._new:
          return this.parseNew();
        case s.tokTypes.backQuote:
          return this.parseTemplate();
        case s.tokTypes._import:
          return this.options.ecmaVersion >= 11
            ? this.parseExprImport()
            : this.dummyIdent();
        default:
          return this.dummyIdent();
      }
    }),
    (a.parseExprImport = function () {
      var t = this.startNode(),
        e = this.parseIdent(!0);
      switch (this.tok.type) {
        case s.tokTypes.parenL:
          return this.parseDynamicImport(t);
        case s.tokTypes.dot:
          return (t.meta = e), this.parseImportMeta(t);
        default:
          return (t.name = "import"), this.finishNode(t, "Identifier");
      }
    }),
    (a.parseDynamicImport = function (t) {
      return (
        (t.source =
          this.parseExprList(s.tokTypes.parenR)[0] || this.dummyString()),
        this.finishNode(t, "ImportExpression")
      );
    }),
    (a.parseImportMeta = function (t) {
      return (
        this.next(),
        (t.property = this.parseIdent(!0)),
        this.finishNode(t, "MetaProperty")
      );
    }),
    (a.parseNew = function () {
      var t = this.startNode(),
        e = this.curIndent,
        i = this.curLineStart,
        r = this.parseIdent(!0);
      if (this.options.ecmaVersion >= 6 && this.eat(s.tokTypes.dot))
        return (
          (t.meta = r),
          (t.property = this.parseIdent(!0)),
          this.finishNode(t, "MetaProperty")
        );
      var o = this.storeCurrentPos();
      return (
        (t.callee = this.parseSubscripts(this.parseExprAtom(), o, !0, e, i)),
        this.tok.type === s.tokTypes.parenL
          ? (t.arguments = this.parseExprList(s.tokTypes.parenR))
          : (t.arguments = []),
        this.finishNode(t, "NewExpression")
      );
    }),
    (a.parseTemplateElement = function () {
      var t = this.startNode();
      return (
        this.tok.type === s.tokTypes.invalidTemplate
          ? (t.value = { raw: this.tok.value, cooked: null })
          : (t.value = {
              raw: this.input.slice(this.tok.start, this.tok.end).replace(
                /\r\n?/g,
                `
`,
              ),
              cooked: this.tok.value,
            }),
        this.next(),
        (t.tail = this.tok.type === s.tokTypes.backQuote),
        this.finishNode(t, "TemplateElement")
      );
    }),
    (a.parseTemplate = function () {
      var t = this.startNode();
      this.next(), (t.expressions = []);
      var e = this.parseTemplateElement();
      for (t.quasis = [e]; !e.tail; )
        this.next(),
          t.expressions.push(this.parseExpression()),
          this.expect(s.tokTypes.braceR)
            ? (e = this.parseTemplateElement())
            : ((e = this.startNode()),
              (e.value = { cooked: "", raw: "" }),
              (e.tail = !0),
              this.finishNode(e, "TemplateElement")),
          t.quasis.push(e);
      return (
        this.expect(s.tokTypes.backQuote), this.finishNode(t, "TemplateLiteral")
      );
    }),
    (a.parseObj = function () {
      var t = this.startNode();
      (t.properties = []), this.pushCx();
      var e = this.curIndent + 1,
        i = this.curLineStart;
      for (
        this.eat(s.tokTypes.braceL),
          this.curIndent + 1 < e &&
            ((e = this.curIndent), (i = this.curLineStart));
        !this.closes(s.tokTypes.braceR, e, i);

      ) {
        var r = this.startNode(),
          o = void 0,
          n = void 0,
          p = void 0;
        if (this.options.ecmaVersion >= 9 && this.eat(s.tokTypes.ellipsis)) {
          (r.argument = this.parseMaybeAssign()),
            t.properties.push(this.finishNode(r, "SpreadElement")),
            this.eat(s.tokTypes.comma);
          continue;
        }
        if (
          (this.options.ecmaVersion >= 6 &&
            ((p = this.storeCurrentPos()),
            (r.method = !1),
            (r.shorthand = !1),
            (o = this.eat(s.tokTypes.star))),
          this.parsePropertyName(r),
          this.toks.isAsyncProp(r)
            ? ((n = !0),
              (o = this.options.ecmaVersion >= 9 && this.eat(s.tokTypes.star)),
              this.parsePropertyName(r))
            : (n = !1),
          m(r.key))
        ) {
          m(this.parseMaybeAssign()) && this.next(), this.eat(s.tokTypes.comma);
          continue;
        }
        if (this.eat(s.tokTypes.colon))
          (r.kind = "init"), (r.value = this.parseMaybeAssign());
        else if (
          this.options.ecmaVersion >= 6 &&
          (this.tok.type === s.tokTypes.parenL ||
            this.tok.type === s.tokTypes.braceL)
        )
          (r.kind = "init"),
            (r.method = !0),
            (r.value = this.parseMethod(o, n));
        else if (
          this.options.ecmaVersion >= 5 &&
          r.key.type === "Identifier" &&
          !r.computed &&
          (r.key.name === "get" || r.key.name === "set") &&
          this.tok.type !== s.tokTypes.comma &&
          this.tok.type !== s.tokTypes.braceR &&
          this.tok.type !== s.tokTypes.eq
        )
          (r.kind = r.key.name),
            this.parsePropertyName(r),
            (r.value = this.parseMethod(!1));
        else {
          if (((r.kind = "init"), this.options.ecmaVersion >= 6))
            if (this.eat(s.tokTypes.eq)) {
              var h = this.startNodeAt(p);
              (h.operator = "="),
                (h.left = r.key),
                (h.right = this.parseMaybeAssign()),
                (r.value = this.finishNode(h, "AssignmentExpression"));
            } else r.value = r.key;
          else r.value = this.dummyIdent();
          r.shorthand = !0;
        }
        t.properties.push(this.finishNode(r, "Property")),
          this.eat(s.tokTypes.comma);
      }
      return (
        this.popCx(),
        this.eat(s.tokTypes.braceR) ||
          ((this.last.end = this.tok.start),
          this.options.locations && (this.last.loc.end = this.tok.loc.start)),
        this.finishNode(t, "ObjectExpression")
      );
    }),
    (a.parsePropertyName = function (t) {
      if (this.options.ecmaVersion >= 6)
        if (this.eat(s.tokTypes.bracketL)) {
          (t.computed = !0),
            (t.key = this.parseExpression()),
            this.expect(s.tokTypes.bracketR);
          return;
        } else t.computed = !1;
      var e =
        this.tok.type === s.tokTypes.num || this.tok.type === s.tokTypes.string
          ? this.parseExprAtom()
          : this.parseIdent();
      t.key = e || this.dummyIdent();
    }),
    (a.parsePropertyAccessor = function () {
      if (this.tok.type === s.tokTypes.name || this.tok.type.keyword)
        return this.parseIdent();
      if (this.tok.type === s.tokTypes.privateId)
        return this.parsePrivateIdent();
    }),
    (a.parseIdent = function () {
      var t =
        this.tok.type === s.tokTypes.name
          ? this.tok.value
          : this.tok.type.keyword;
      if (!t) return this.dummyIdent();
      this.tok.type.keyword && (this.toks.type = s.tokTypes.name);
      var e = this.startNode();
      return this.next(), (e.name = t), this.finishNode(e, "Identifier");
    }),
    (a.parsePrivateIdent = function () {
      var t = this.startNode();
      return (
        (t.name = this.tok.value),
        this.next(),
        this.finishNode(t, "PrivateIdentifier")
      );
    }),
    (a.initFunction = function (t) {
      (t.id = null),
        (t.params = []),
        this.options.ecmaVersion >= 6 &&
          ((t.generator = !1), (t.expression = !1)),
        this.options.ecmaVersion >= 8 && (t.async = !1);
    }),
    (a.toAssignable = function (t, e) {
      if (
        !(
          !t ||
          t.type === "Identifier" ||
          (t.type === "MemberExpression" && !e)
        )
      )
        if (t.type === "ParenthesizedExpression")
          this.toAssignable(t.expression, e);
        else {
          if (this.options.ecmaVersion < 6) return this.dummyIdent();
          if (t.type === "ObjectExpression") {
            t.type = "ObjectPattern";
            for (var i = 0, r = t.properties; i < r.length; i += 1) {
              var o = r[i];
              this.toAssignable(o, e);
            }
          } else if (t.type === "ArrayExpression")
            (t.type = "ArrayPattern"), this.toAssignableList(t.elements, e);
          else if (t.type === "Property") this.toAssignable(t.value, e);
          else if (t.type === "SpreadElement")
            (t.type = "RestElement"), this.toAssignable(t.argument, e);
          else if (t.type === "AssignmentExpression")
            (t.type = "AssignmentPattern"), delete t.operator;
          else return this.dummyIdent();
        }
      return t;
    }),
    (a.toAssignableList = function (t, e) {
      for (var i = 0, r = t; i < r.length; i += 1) {
        var o = r[i];
        this.toAssignable(o, e);
      }
      return t;
    }),
    (a.parseFunctionParams = function (t) {
      return (
        (t = this.parseExprList(s.tokTypes.parenR)),
        this.toAssignableList(t, !0)
      );
    }),
    (a.parseMethod = function (t, e) {
      var i = this.startNode(),
        r = this.inAsync,
        o = this.inGenerator,
        n = this.inFunction;
      return (
        this.initFunction(i),
        this.options.ecmaVersion >= 6 && (i.generator = !!t),
        this.options.ecmaVersion >= 8 && (i.async = !!e),
        (this.inAsync = i.async),
        (this.inGenerator = i.generator),
        (this.inFunction = !0),
        (i.params = this.parseFunctionParams()),
        (i.body = this.parseBlock()),
        this.toks.adaptDirectivePrologue(i.body.body),
        (this.inAsync = r),
        (this.inGenerator = o),
        (this.inFunction = n),
        this.finishNode(i, "FunctionExpression")
      );
    }),
    (a.parseArrowExpression = function (t, e, i) {
      var r = this.inAsync,
        o = this.inGenerator,
        n = this.inFunction;
      return (
        this.initFunction(t),
        this.options.ecmaVersion >= 8 && (t.async = !!i),
        (this.inAsync = t.async),
        (this.inGenerator = !1),
        (this.inFunction = !0),
        (t.params = this.toAssignableList(e, !0)),
        (t.expression = this.tok.type !== s.tokTypes.braceL),
        t.expression
          ? (t.body = this.parseMaybeAssign())
          : ((t.body = this.parseBlock()),
            this.toks.adaptDirectivePrologue(t.body.body)),
        (this.inAsync = r),
        (this.inGenerator = o),
        (this.inFunction = n),
        this.finishNode(t, "ArrowFunctionExpression")
      );
    }),
    (a.parseExprList = function (t, e) {
      this.pushCx();
      var i = this.curIndent,
        r = this.curLineStart,
        o = [];
      for (this.next(); !this.closes(t, i + 1, r); ) {
        if (this.eat(s.tokTypes.comma)) {
          o.push(e ? null : this.dummyIdent());
          continue;
        }
        var n = this.parseMaybeAssign();
        if (m(n)) {
          if (this.closes(t, i, r)) break;
          this.next();
        } else o.push(n);
        this.eat(s.tokTypes.comma);
      }
      return (
        this.popCx(),
        this.eat(t) ||
          ((this.last.end = this.tok.start),
          this.options.locations && (this.last.loc.end = this.tok.loc.start)),
        o
      );
    }),
    (a.parseAwait = function () {
      var t = this.startNode();
      return (
        this.next(),
        (t.argument = this.parseMaybeUnary()),
        this.finishNode(t, "AwaitExpression")
      );
    }),
    (s.defaultOptions.tabSize = 4);
  function I(t, e) {
    return u.parse(t, e);
  }
  (c.LooseParser = u), (c.isDummy = m), (c.parse = I);
});
//# sourceMappingURL=acorn-loose.js.map
