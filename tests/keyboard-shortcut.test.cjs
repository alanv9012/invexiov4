const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadKeyboardShortcut() {
  let listener;
  const window = {
    addEventListener(type, callback) {
      assert.equal(type, "keydown");
      listener = callback;
    },
    removeEventListener() {},
  };
  const module = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync("src/lib/ui/use-keyboard-shortcut.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }
  ).outputText;

  vm.runInNewContext(
    source,
    {
      module,
      exports: module.exports,
      require(name) {
        if (name === "react") {
          return { useEffect: (effect) => effect() };
        }
        throw new Error(`Unexpected dependency: ${name}`);
      },
      window,
      HTMLElement: class HTMLElement {},
      navigator: undefined,
    },
    { filename: "src/lib/ui/use-keyboard-shortcut.ts" }
  );

  return {
    useKeyboardShortcut: module.exports.useKeyboardShortcut,
    dispatch(event) {
      assert.equal(typeof listener, "function");
      listener(event);
    },
  };
}

test("ignores a keydown-like event without a key", () => {
  const shortcut = loadKeyboardShortcut();
  let handled = false;
  shortcut.useKeyboardShortcut("k", () => {
    handled = true;
  });

  assert.doesNotThrow(() => {
    shortcut.dispatch({ target: null, preventDefault() {} });
  });
  assert.equal(handled, false);
});

test("still handles a case-insensitive Ctrl shortcut", () => {
  const shortcut = loadKeyboardShortcut();
  let handled = false;
  let prevented = false;
  shortcut.useKeyboardShortcut(
    "k",
    () => {
      handled = true;
    },
    { metaOrCtrl: true }
  );

  shortcut.dispatch({
    key: "K",
    ctrlKey: true,
    metaKey: false,
    shiftKey: false,
    target: null,
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(handled, true);
  assert.equal(prevented, true);
});

test("still handles a Shift+Command shortcut", () => {
  const shortcut = loadKeyboardShortcut();
  let handled = false;
  shortcut.useKeyboardShortcut(
    "p",
    () => {
      handled = true;
    },
    { metaOrCtrl: true, shift: true }
  );

  shortcut.dispatch({
    key: "p",
    ctrlKey: false,
    metaKey: true,
    shiftKey: true,
    target: null,
    preventDefault() {},
  });

  assert.equal(handled, true);
});
