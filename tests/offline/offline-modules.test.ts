import { describe, it, expect, vi } from "vitest";

// These modules depend on IndexedDB and browser APIs, so we test exports only
// with fake-indexeddb loaded

describe("Offline Module Exports", () => {
  it("should export encryption functions", async () => {
    const mod = await import("@/lib/offline/encryption");
    expect(typeof mod.generate_encryption_key).toBe("function");
    expect(typeof mod.encrypt_data).toBe("function");
    expect(typeof mod.decrypt_data).toBe("function");
    expect(typeof mod.store_encryption_key).toBe("function");
    expect(typeof mod.get_stored_encryption_key).toBe("function");
    expect(typeof mod.clear_encryption_key).toBe("function");
  });
});