/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/lib/hooks/use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 500));
    expect(result.current).toBe("hello");
  });

  it("should debounce value changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "hello", delay: 500 } }
    );

    expect(result.current).toBe("hello");

    // Update value
    rerender({ value: "world", delay: 500 });

    // Should still show old value before delay
    expect(result.current).toBe("hello");

    // Advance time by 499ms (not enough)
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe("hello");

    // Advance by 1ms more to reach the delay
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("world");
  });

  it("should reset debounce timer on rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 500 } }
    );

    rerender({ value: "b", delay: 500 });
    act(() => vi.advanceTimersByTime(300));

    rerender({ value: "c", delay: 500 });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("c");
  });

  it("should handle different delay values", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 100 } }
    );

    rerender({ value: "updated", delay: 1000 });
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe("initial");

    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe("updated");
  });

  it("should handle numeric values", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } }
    );

    rerender({ value: 42, delay: 300 });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe(42);
  });

  it("should handle null values", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: null as string | null, delay: 300 } }
    );

    rerender({ value: "hello", delay: 300 });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("hello");
  });
});