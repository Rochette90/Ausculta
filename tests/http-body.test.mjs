import assert from "node:assert/strict";
import test from "node:test";
import { BodyTooLargeError, readLimitedBody } from "../lib/http/body.ts";
const request = (body) => new Request("http://localhost/api/test", { method: "POST", body, duplex: "half" });
test("bounded body reader preserves UTF-8 split across chunks", async () => {
  const bytes = new TextEncoder().encode('{"été":"cœur"}');
  const stream = new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
  assert.equal(await readLimitedBody(request(stream), bytes.length), '{"été":"cœur"}');
});
test("oversized chunked requests are cancelled before buffering the remainder", async () => {
  let cancelled = false;
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(32)); }, cancel() { cancelled = true; } });
  await assert.rejects(readLimitedBody(request(stream), 16), BodyTooLargeError);
  assert.equal(cancelled, true);
});
test("empty and exactly-at-limit bodies are accepted", async () => {
  assert.equal(await readLimitedBody(new Request("http://localhost"), 16), "");
  assert.equal(await readLimitedBody(request("12345678"), 8), "12345678");
});
