import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createBackendServer } from "./index.mjs";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("runtime hardening smoke exposes DOCX fetch diagnostics and removes node-fetch dependency", async () => {
  const server = createBackendServer();

  try {
    const baseUrl = await listen(server);
    const response = await fetch(`${baseUrl}/api/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.ok(payload.runtime, "health response should include runtime diagnostics");
    assert.match(payload.runtime.nodeVersion, /^v\d+/);
    assert.equal(payload.runtime.hasGlobalFetch, true);
    assert.equal(payload.runtime.docxObjectDownloadFetchMode, "global-fetch");

    const source = await readFile(new URL("./index.mjs", import.meta.url), "utf8");
    assert.equal(
      source.includes("node-fetch"),
      false,
      "current backend source should not depend on node-fetch for DOCX object parsing",
    );
  } finally {
    await close(server);
  }
});
