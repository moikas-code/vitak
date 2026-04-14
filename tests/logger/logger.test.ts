import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLogger, logRequest, logResponse, apiLogger, dbLogger, authLogger, trpcLogger } from "@/lib/logger";

describe("createLogger", () => {
  it("should create a logger with a service name", () => {
    const logger = createLogger("test-service");
    expect(logger).toBeDefined();
  });

  it("should have all log level methods", () => {
    const logger = createLogger("test-service");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("should not throw when logging", () => {
    const logger = createLogger("test-service");
    expect(() => logger.info("test message")).not.toThrow();
    expect(() => logger.warn("warning message")).not.toThrow();
    expect(() => logger.debug("debug message")).not.toThrow();
    expect(() => logger.error("error message")).not.toThrow();
  });

  it("should accept context objects", () => {
    const logger = createLogger("test-service");
    expect(() => logger.info("test message", { key: "value" })).not.toThrow();
  });

  it("should accept error objects in error method", () => {
    const logger = createLogger("test-service");
    const error = new Error("test error");
    expect(() => logger.error("error occurred", error, { context: "test" })).not.toThrow();
  });

  it("should create child loggers with additional context", () => {
    const logger = createLogger("parent");
    const child = logger.child({ requestId: "abc-123" });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe("function");
    expect(typeof child.error).toBe("function");
  });
});

describe("pre-configured loggers", () => {
  it("should export apiLogger", () => {
    expect(apiLogger).toBeDefined();
  });

  it("should export dbLogger", () => {
    expect(dbLogger).toBeDefined();
  });

  it("should export authLogger", () => {
    expect(authLogger).toBeDefined();
  });

  it("should export trpcLogger", () => {
    expect(trpcLogger).toBeDefined();
  });
});

describe("logRequest", () => {
  it("should not throw for any logger", () => {
    const logger = createLogger("request-test");
    expect(() => logRequest(logger, "GET", "/api/health")).not.toThrow();
  });

  it("should accept additional context", () => {
    const logger = createLogger("request-test");
    expect(() => logRequest(logger, "POST", "/api/data", { userId: "123" })).not.toThrow();
  });
});

describe("logResponse", () => {
  it("should not throw for success responses", () => {
    const logger = createLogger("response-test");
    expect(() => logResponse(logger, "GET", "/api/health", 200, 50)).not.toThrow();
  });

  it("should not throw for error responses", () => {
    const logger = createLogger("response-test");
    expect(() => logResponse(logger, "GET", "/api/missing", 404, 10)).not.toThrow();
  });

  it("should not throw for 5xx responses", () => {
    const logger = createLogger("response-test");
    expect(() => logResponse(logger, "GET", "/api/error", 500, 100)).not.toThrow();
  });
});