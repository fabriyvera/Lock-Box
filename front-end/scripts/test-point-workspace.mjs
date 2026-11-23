import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";

const require = createRequire(import.meta.url);
const source = readFileSync(
  new URL(
    "../src/components/collection-point/PointDashboard.tsx",
    import.meta.url,
  ),
  "utf8",
);
const model = ts.transpileModule(
  readFileSync(
    new URL("../src/lib/collection-point/model.ts", import.meta.url),
    "utf8",
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const component = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
}).outputText;
const orderId = "12345678-1234-4123-8123-123456789abc";
const pointId = "point-1";
const tick = () => new Promise((resolve) => setImmediate(resolve));

// Exercise the actual UI handlers with a small hook host and a mocked API.
// This covers request/confirmation behavior; it does not simulate browser focus.
function workspace(initialStatus = "dispatched", options = {}) {
  const hooks = [];
  const effects = [];
  const calls = [];
  let cursor = 0;
  let currentStatus = initialStatus;
  let tree;
  const mod = { exports: {} };
  const hooksApi = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks))
        hooks[index] = typeof initial === "function" ? initial() : initial;
      return [
        hooks[index],
        (value) => {
          hooks[index] =
            typeof value === "function" ? value(hooks[index]) : value;
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = hooks[index];
      if (
        !previous ||
        dependencies.some((value, i) => !Object.is(value, previous[i]))
      )
        effects.push(effect);
      hooks[index] = dependencies;
    },
  };
  const order = () => ({
    id: orderId,
    pointId,
    status: currentStatus,
    buyerLabel: "Comprador de prueba",
    productTitle: "Producto de prueba",
  });
  const state = () => ({
    points: [
      {
        id: pointId,
        name: "Punto de prueba",
        address: "Dirección de prueba",
        capacity: 50,
        occupied: 1,
        pending: currentStatus === "ready" ? 1 : 0,
        deliveredToday: 0,
      },
    ],
    orders: [order()],
    activity: [],
  });
  async function pointRequest(path, init = {}) {
    calls.push({ path, init });
    if (options.request) await options.request(path, init);
    if (path === "/state") return { state: state() };
    if (path.startsWith("/scan/")) return { order: order() };
    if (init.method === "PATCH") {
      currentStatus = JSON.parse(init.body).status;
      return { order: order() };
    }
    throw new Error("Unexpected request");
  }
  const modelModule = { exports: {} };
  vm.runInThisContext("(function(module,exports){" + model + "\n})")(
    modelModule,
    modelModule.exports,
  );
  function localRequire(id) {
    if (id === "react") return hooksApi;
    if (id.endsWith(".css"))
      return {
        __esModule: true,
        default: new Proxy({}, { get: (_, key) => String(key) }),
      };
    if (id === "@/lib/collection-point/model") return modelModule.exports;
    if (id === "@/lib/collection-point/api") return { pointRequest };
    if (id === "@/lib/supabase/client")
      return {
        createClient: () => {
          throw new Error("Auth is outside these tests");
        },
      };
    if (id === "@/components/seller/Dialog")
      return { __esModule: true, default: function Dialog() {} };
    if (id === "./QrCameraScanner")
      return { __esModule: true, default: function QrCameraScanner() {} };
    return require(id);
  }
  vm.runInThisContext(
    "(function(require,module,exports){" + component + "\n})",
  )(localRequire, mod, mod.exports);
  function render() {
    cursor = 0;
    tree = mod.exports.default({ name: "Operador de prueba" });
    return tree;
  }
  function nodes() {
    const found = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== "object" || !node.props) return;
      found.push(node);
      walk(node.props.children);
    }
    walk(tree);
    return found;
  }
  async function settle() {
    await tick();
    render();
  }
  return {
    calls,
    render,
    settle,
    nodes,
    find: (predicate) => {
      const found = nodes().find(predicate);
      assert.ok(found, "Expected UI control");
      return found;
    },
    async mount() {
      render();
      effects.splice(0).forEach((effect) => effect());
      await settle();
    },
    async scan(code = "LBX-123456") {
      this.find((node) => node.props.id === "qr-code").props.onChange({
        target: { value: code },
      });
      render();
      this.find((node) => node.type === "form").props.onSubmit({
        preventDefault() {},
      });
      await settle();
    },
  };
}

globalThis.requestAnimationFrame = (callback) => {
  callback(0);
  return 0;
};

test("point lookup validates empty input and encodes the trimmed code", async () => {
  const ui = workspace();
  await ui.mount();
  await ui.scan("   ");
  assert.equal(ui.calls.length, 1);
  assert.ok(ui.find((node) => node.props.id === "qr-error"));
  await ui.scan(" LBX-a/b?c ");
  assert.equal(ui.calls.at(-1).path, "/scan/LBX-a%2Fb%3Fc");
  assert.equal(
    ui.find((node) => node.props.id === "qr-code").props["aria-invalid"],
    undefined,
  );
});

test("physical transitions require review; delivery also sends the explicit balance declaration", async () => {
  for (const [status, next] of [
    ["dispatched", "in_lockbox"],
    ["in_lockbox", "ready"],
    ["ready", "delivered"],
  ]) {
    const ui = workspace(status);
    await ui.mount();
    await ui.scan();
    const inline = ui.find((node) => node.props.className === "confirmation");
    inline.props.children
      .find((node) => node?.type === "button")
      .props.onClick();
    ui.render();
    assert.equal(
      ui.calls.filter((call) => call.init.method === "PATCH").length,
      0,
    );
    const dialog = ui.find(
      (node) => typeof node.type === "function" && node.type.name === "Dialog",
    );
    dialog.props.onClose();
    ui.render();
    assert.equal(
      ui.calls.filter((call) => call.init.method === "PATCH").length,
      0,
    );
    inline.props.children
      .find((node) => node?.type === "button")
      .props.onClick();
    ui.render();
    if (next === "delivered") {
      const disabledSubmit = ui.nodes().filter((node) => node.type === "button").at(-1);
      assert.equal(disabledSubmit.props.disabled, true);
      ui.find((node) => node.type === "input" && node.props.type === "checkbox").props.onChange({ target: { checked: true } });
      ui.render();
    }
    const submit = ui
      .nodes()
      .filter((node) => node.type === "button")
      .at(-1);
    submit.props.onClick();
    await ui.settle();
    const write = ui.calls.find((call) => call.init.method === "PATCH");
    assert.equal(write.path, `/${orderId}/status`);
    assert.deepEqual(JSON.parse(write.init.body), {
      qrCode: "LBX-123456",
      status: next,
      ...(next === "delivered" ? { balanceConfirmed: true } : {}),
    });
    assert.equal(ui.calls.at(-1).path, "/state");
    assert.equal(
      ui.find((node) => node.props.id === "qr-code").props.value,
      "",
    );
  }
});

test("point confirmation prevents duplicate writes and explains a failed refresh after saving", async () => {
  let release;
  let written = false;
  const deferred = new Promise((resolve) => {
    release = resolve;
  });
  const ui = workspace("ready", {
    request: async (path, init) => {
      if (init.method === "PATCH") {
        written = true;
        await deferred;
      }
      if (path === "/state" && written) throw new Error("Refresh failed");
    },
  });
  await ui.mount();
  await ui.scan();
  ui.find((node) => node.props.className === "confirmation")
    .props.children.find((node) => node?.type === "button")
    .props.onClick();
  ui.render();
  ui.find((node) => node.type === "input" && node.props.type === "checkbox").props.onChange({ target: { checked: true } });
  ui.render();
  const submit = ui
    .nodes()
    .filter((node) => node.type === "button")
    .at(-1);
  submit.props.onClick();
  submit.props.onClick();
  assert.equal(
    ui.calls.filter((call) => call.init.method === "PATCH").length,
    1,
  );
  release();
  await ui.settle();
  const notice = ui.find((node) => node.props.className === "error");
  assert.match(notice.props.children, /El cambio se guardó/);
  assert.equal(
    ui
      .nodes()
      .filter(
        (node) =>
          typeof node.type === "function" && node.type.name === "Dialog",
      ).length,
    0,
  );
});
