import { describe, it, expect, vi, beforeEach } from "vitest";
import { generate_encryption_key, encrypt_data, decrypt_data, store_encryption_key, get_stored_encryption_key, clear_encryption_key } from "@/lib/offline/encryption";

// Mock localStorage (Node environment, so also stub window)
const store: Record<string, string> = {};

// In the encryption module, it checks `typeof window !== 'undefined'`
// so we need to provide a window object with localStorage
vi.stubGlobal("window", {
  localStorage: {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
  },
});

vi.stubGlobal("localStorage", {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  get length() { return Object.keys(store).length; },
});

describe("generate_encryption_key", () => {
  it("should generate a string key", () => {
    const key = generate_encryption_key("user-1");
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(0);
  });

  it("should generate different keys for different users", () => {
    const key1 = generate_encryption_key("user-1");
    const key2 = generate_encryption_key("user-2");
    expect(key1).not.toBe(key2);
  });

  it("should generate the same key for the same user", () => {
    const key1 = generate_encryption_key("user-1");
    const key2 = generate_encryption_key("user-1");
    expect(key1).toBe(key2);
  });

  it("should generate different keys for legacy vs strong iterations", () => {
    const legacyKey = generate_encryption_key("user-1", true);
    const strongKey = generate_encryption_key("user-1", false);
    expect(legacyKey).not.toBe(strongKey);
  });
});

describe("encrypt_data / decrypt_data", () => {
  it("should encrypt and decrypt data correctly", () => {
    const userId = "test-user-encrypt";
    const data = { name: "Spinach", vitaminK: 483 };
    const key = generate_encryption_key(userId);

    const encrypted = encrypt_data(data, key);
    expect(typeof encrypted).toBe("string");
    expect(encrypted).not.toBe(JSON.stringify(data));

    const decrypted = decrypt_data<typeof data>(encrypted, userId);
    expect(decrypted).toEqual(data);
  });

  it("should handle string data", () => {
    const userId = "test-user-string";
    const key = generate_encryption_key(userId);
    const data = "Hello, World!";
    const encrypted = encrypt_data(data, key);
    const decrypted = decrypt_data<string>(encrypted, userId);
    expect(decrypted).toBe(data);
  });

  it("should handle numeric data", () => {
    const userId = "test-user-number";
    const key = generate_encryption_key(userId);
    const data = 42;
    const encrypted = encrypt_data(data, key);
    const decrypted = decrypt_data<number>(encrypted, userId);
    expect(decrypted).toBe(42);
  });

  it("should handle null values", () => {
    const userId = "test-user-null";
    const key = generate_encryption_key(userId);
    const data = null;
    const encrypted = encrypt_data(data, key);
    const decrypted = decrypt_data(encrypted, userId);
    expect(decrypted).toBeNull();
  });

  it("should handle boolean values", () => {
    const userId = "test-user-bool";
    const key = generate_encryption_key(userId);
    const data = true;
    const encrypted = encrypt_data(data, key);
    const decrypted = decrypt_data<boolean>(encrypted, userId);
    expect(decrypted).toBe(true);
  });

  it("should handle complex nested objects", () => {
    const userId = "test-user-complex";
    const key = generate_encryption_key(userId);
    const data = {
      id: "log-1",
      nested: { deep: { value: 123 } },
      array: [1, 2, 3],
      date: "2024-01-01T00:00:00.000Z",
    };
    const encrypted = encrypt_data(data, key);
    const decrypted = decrypt_data<typeof data>(encrypted, userId);
    expect(decrypted).toEqual(data);
  });
});

describe("store_encryption_key / get_stored_encryption_key / clear_encryption_key", () => {
  beforeEach(() => {
    Object.keys(store).forEach(k => delete store[k]);
    vi.clearAllMocks();
  });

  it("should store and retrieve an encryption key", () => {
    const key = "test-encryption-key-12345";
    store_encryption_key(key);
    expect(store["vitak_encryption_key"]).toBe(key);

    const retrieved = get_stored_encryption_key();
    expect(retrieved).toBe(key);
  });

  it("should return null when no key is stored", () => {
    Object.keys(store).forEach(k => delete store[k]);
    const result = get_stored_encryption_key();
    expect(result).toBeNull();
  });

  it("should clear the stored key", () => {
    store_encryption_key("test-key");
    expect(store["vitak_encryption_key"]).toBe("test-key");

    clear_encryption_key();
    expect(store["vitak_encryption_key"]).toBeUndefined();
  });
});