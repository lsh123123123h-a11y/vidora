import { describe, expect, it } from "vitest";
import { getApiBaseUrl, getRuntimeOrigin, getSocketNamespaceUrl, getSocketOrigin } from "@/utils/runtimeUrl";

describe("runtime URL helpers", () => {
  it("uses the browser origin for API and Socket.IO", () => {
    expect(getRuntimeOrigin("http://example.test")).toBe("http://example.test");
    expect(getApiBaseUrl("http://example.test")).toBe("http://example.test/api");
    expect(getSocketOrigin("http://example.test")).toBe("http://example.test");
  });

  it("normalizes an existing API suffix to exactly one /api", () => {
    expect(getApiBaseUrl("http://example.test/api")).toBe("http://example.test/api");
    expect(getApiBaseUrl("http://example.test/api/api/")).toBe("http://example.test/api");
    expect(getApiBaseUrl("http://example.test///api///")).toBe("http://example.test/api");
  });

  it("fails clearly when no browser origin or explicit build override exists", () => {
    expect(() => getRuntimeOrigin(undefined, undefined, {})).toThrow(/runtime origin/i);
  });

  it("builds the script Agent namespace under the API path", () => {
    expect(getSocketNamespaceUrl("http://example.test", "scriptAgent")).toBe("http://example.test/api/socket/scriptAgent");
  });

  it("builds the production Agent namespace under the API path", () => {
    expect(getSocketNamespaceUrl("http://example.test/api", "productionAgent")).toBe("http://example.test/api/socket/productionAgent");
  });
});
