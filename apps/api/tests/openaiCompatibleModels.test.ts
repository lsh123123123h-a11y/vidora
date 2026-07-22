import assert from "node:assert/strict";
import test from "node:test";
import { buildModelsUrl, fetchCompatibleModelIds, parseModelIds } from "../src/lib/openaiCompatibleModels";

test("buildModelsUrl appends models once to an OpenAI-compatible base URL", () => {
  assert.equal(buildModelsUrl("https://relay.example.com/v1/"), "https://relay.example.com/v1/models");
  assert.equal(buildModelsUrl("https://relay.example.com/v1/models"), "https://relay.example.com/v1/models");
});

test("buildModelsUrl rejects URLs with embedded credentials or unsupported protocols", () => {
  assert.throws(() => buildModelsUrl("ftp://relay.example.com/v1"), /http/i);
  assert.throws(() => buildModelsUrl("https://key@relay.example.com/v1"), /credentials/i);
});

test("parseModelIds returns unique non-empty model IDs from an OpenAI response", () => {
  assert.deepEqual(
    parseModelIds({ data: [{ id: "gpt-4o" }, { id: "" }, { id: "gpt-4o" }, { id: "seedance-1.5" }] }),
    ["gpt-4o", "seedance-1.5"],
  );
});

test("parseModelIds rejects a response without a model list", () => {
  assert.throws(() => parseModelIds({ models: [] }), /data/i);
});

test("fetchCompatibleModelIds forwards the API key only as a Bearer header", async () => {
  let requestUrl = "";
  let requestHeaders: HeadersInit | undefined;
  const modelIds = await fetchCompatibleModelIds("https://relay.example.com/v1", "secret-key", async (url, init) => {
    requestUrl = String(url);
    requestHeaders = init?.headers;
    return new Response(JSON.stringify({ data: [{ id: "gpt-4o" }] }), { status: 200 });
  });

  assert.equal(requestUrl, "https://relay.example.com/v1/models");
  assert.deepEqual(requestHeaders, { Authorization: "Bearer secret-key" });
  assert.deepEqual(modelIds, ["gpt-4o"]);
});
