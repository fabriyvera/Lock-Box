import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/auth/form-readiness.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const fixture = new Module("auth-readiness-test");
fixture.require = createRequire(import.meta.url);
fixture._compile(compiled, "auth-readiness-test.cjs");
const { loginComplete, registrationComplete } = fixture.exports;
const valid = {
  fullName: "María Gonzáles",
  username: "@Maria.Gonzales",
  email: "maria@example.invalid",
  phone: "71234567",
  password: "Password1",
  confirmPassword: "Password1",
};
function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...valid, ...overrides }))
    data.set(key, value);
  return data;
}
test("login waits for a valid email and password without rejecting existing shorter passwords", () => {
  for (const email of ["", "   ", "invalid", "person@"])
    assert.equal(loginComplete(email, "old-pw"), false);
  assert.equal(loginComplete("person@example.invalid", ""), false);
  assert.equal(loginComplete(" person@example.invalid ", "old-pw"), true);
});
test("buyer registration requires every account field, not a seller store", () => {
  assert.equal(registrationComplete(form(), "comprador"), true);
  for (const key of Object.keys(valid))
    assert.equal(
      registrationComplete(form({ [key]: "" }), "comprador"),
      false,
      key,
    );
});
test("seller registration additionally requires a valid store name", () => {
  for (const storeName of ["", " ", "X", "X".repeat(81)])
    assert.equal(registrationComplete(form({ storeName }), "vendedor"), false);
  assert.equal(
    registrationComplete(form({ storeName: "Mi tienda" }), "vendedor"),
    true,
  );
});
test("mismatched or short passwords cannot start registration verification", () => {
  assert.equal(
    registrationComplete(form({ confirmPassword: "different" }), "comprador"),
    false,
  );
  assert.equal(
    registrationComplete(
      form({ password: "short", confirmPassword: "short" }),
      "comprador",
    ),
    false,
  );
});
test("registration verifies normalized handles and eight-digit phones before CAPTCHA", () => {
  for (const username of [
    "a..b",
    ".maria",
    "maria.",
    "maria__x",
    "a",
    "bad handle",
  ])
    assert.equal(registrationComplete(form({ username }), "comprador"), false);
  for (const phone of [
    "7123456",
    "712345678",
    "+59171234567",
    "7123 567",
    "7123a567",
    "not-a-phone",
  ])
    assert.equal(registrationComplete(form({ phone }), "comprador"), false);
  assert.equal(registrationComplete(form(), "comprador"), true);
});

test("both account roles accept exactly eight phone digits before CAPTCHA", () => {
  for (const role of ["comprador", "vendedor"]) {
    assert.equal(
      registrationComplete(
        form({ storeName: "Mi tienda", phone: "71234567" }),
        role,
      ),
      true,
    );
    assert.equal(
      registrationComplete(
        form({ storeName: "Mi tienda", phone: "+59171234567" }),
        role,
      ),
      false,
    );
  }
});
