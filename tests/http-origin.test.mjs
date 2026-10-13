import assert from "node:assert/strict";
import test from "node:test";
import { isTrustedOrigin, publicOrigin } from "../lib/http/origin.ts";

const PUBLIC = "https://app.example.ch";

test("the request origin is always trusted", () => {
  assert.equal(isTrustedOrigin("https://x.test", "https://x.test/api/contact", undefined), true);
  assert.equal(isTrustedOrigin("http://localhost:3000", "http://localhost:3000/api/contact", undefined), true);
});

test("behind a proxy that drops x-forwarded-proto, the configured public origin is trusted", () => {
  assert.equal(isTrustedOrigin(PUBLIC, "http://app.example.ch/api/contact", PUBLIC), true);
  assert.equal(isTrustedOrigin(PUBLIC, "http://10.0.0.5:8080/api/contact", PUBLIC), true);
});

test("foreign, null and malformed origins are rejected", () => {
  assert.equal(isTrustedOrigin("https://evil.test", "https://app.example.ch/api/contact", PUBLIC), false);
  assert.equal(isTrustedOrigin("https://app.example.ch.evil.test", "http://app.example.ch/api/contact", PUBLIC), false);
  assert.equal(isTrustedOrigin("null", "https://app.example.ch/api/contact", PUBLIC), false);
  assert.equal(isTrustedOrigin("not a url", "https://app.example.ch/api/contact", PUBLIC), false);
});

test("the configured origin only counts when it is https or localhost", () => {
  assert.equal(publicOrigin("http://app.example.ch"), null);
  assert.equal(publicOrigin("http://localhost:3000"), "http://localhost:3000");
  assert.equal(publicOrigin("https://app.example.ch/some/path"), PUBLIC);
  assert.equal(publicOrigin("garbage"), null);
  assert.equal(publicOrigin(undefined), null);
  assert.equal(isTrustedOrigin("http://app.example.ch", "http://10.0.0.5:8080/api", "http://app.example.ch"), false);
});
