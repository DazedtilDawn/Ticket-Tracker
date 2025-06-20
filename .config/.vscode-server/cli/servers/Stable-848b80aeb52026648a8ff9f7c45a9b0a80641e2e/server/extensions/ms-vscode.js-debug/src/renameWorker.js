"use strict";
(() => {
  var d = ((t) =>
    typeof require < "u"
      ? require
      : typeof Proxy < "u"
        ? new Proxy(t, {
            get: (r, s) => (typeof require < "u" ? require : r)[s],
          })
        : t)(function (t) {
    if (typeof require < "u") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + t + '" is not supported');
  });
  var p = d("worker_threads");
  var x = d("./vendor/acorn.js"),
    f = d("./vendor/acorn-loose.js");
  var m = {
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
    b = Object.keys(m);
  for (let t of b) Object.freeze(m[t]);
  Object.freeze(m);
  var u = m;
  var h = {
    ecmaVersion: "latest",
    locations: !0,
    allowAwaitOutsideFunction: !0,
    allowImportExportEverywhere: !0,
    allowReserved: !0,
    allowReturnOutsideFunction: !0,
  };
  var S = (t, r = !1) => (r ? x.parse : f.parse)(t, h);
  var g = (t, r) => {
    y(t, r);
  };
  var y = (t, r, s) => {
    if (!t) return;
    let n = r.enter(t, s);
    if (n === 0) return 0;
    if (n && typeof n == "object") return n;
    if (n === 1) return;
    let i = u[t.type];
    if (i)
      for (let a of i) {
        let e = t[a];
        if (e instanceof Array)
          for (let [o, l] of e.entries()) {
            let c = y(l, r, t);
            if (c === 0) return 0;
            c && typeof c == "object" && (e[o] = c.replace);
          }
        else if (e) {
          let o = y(e, r, t);
          if (o === 0) return 0;
          o && typeof o == "object" && (t[a] = o.replace);
        }
      }
    r.leave?.(t);
  };
  function k(t) {
    let r = S(t),
      s = [],
      n = (e, { loc: o } = e, { loc: l } = e) => {
        if (!o || !l) throw new Error("should include locations");
        s.push({ start: o.start, end: l.end, depth: a.length }), a.push(e);
      },
      i = new Set(),
      a = [];
    return (
      g(r, {
        enter: (e) => {
          switch (e.type) {
            case "FunctionDeclaration":
            case "ArrowFunctionExpression":
              n(e, e.params[0] || e.body, e.body), i.add(e.body);
              break;
            case "Program":
              n(e);
              break;
            case "ForStatement":
            case "ForOfStatement":
            case "ForInStatement":
              n(e), i.add(e.body);
              break;
            case "BlockStatement":
              i.has(e) || n(e);
              break;
          }
        },
        leave: (e) => {
          e === a[a.length - 1] && a.pop();
        },
      }),
      s
    );
  }
  p.isMainThread || p.parentPort?.postMessage(k(p.workerData));
})();
//# sourceMappingURL=renameWorker.js.map
