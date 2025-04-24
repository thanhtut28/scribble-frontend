/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type UrlStateOptions = {
  /**
   * Delay in milliseconds before updating the URL
   * Useful to avoid too many history entries when typing
   */
  debounceMs?: number;
};

/**
 * A hook that syncs state with URL search parameters
 * @param initialState Initial state object
 * @param options Configuration options
 * @returns [state, setters, resetState]
 */
export function useUrlState<T extends Record<string, any>>(
  initialState: T,
  options: UrlStateOptions = {},
): [T, Record<string, (value: any) => void>, () => void] {
  const { debounceMs = 300 } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL or use initialState
  const [state, setState] = useState<T>(() => {
    const stateFromUrl = { ...initialState };
    // For each key in initialState, try to get value from URL
    Object.keys(initialState).forEach((key) => {
      const valueFromUrl = searchParams.get(key);
      if (valueFromUrl !== null) {
        // Try to parse JSON if it's not a simple string
        try {
          stateFromUrl[key as keyof T] = JSON.parse(valueFromUrl);
        } catch {
          stateFromUrl[key as keyof T] = valueFromUrl as any;
        }
      }
    });
    return stateFromUrl;
  });

  // Update URL when state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      // For each key in state, update URL params
      Object.entries(state).forEach(([key, value]) => {
        if (
          value === initialState[key] ||
          value === "" ||
          value === null ||
          value === undefined
        ) {
          params.delete(key);
        } else {
          // Convert objects/arrays to JSON strings
          const paramValue =
            typeof value === "object" ? JSON.stringify(value) : String(value);
          params.set(key, paramValue);
        }
      });
      // Build the new URL
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      // Update URL without refreshing the page
      router.push(newUrl, { scroll: false });
    }, debounceMs);
    return () => clearTimeout(timeoutId);
  }, [state, pathname, router, searchParams, initialState, debounceMs]);

  // Create setters for each key in state
  const setters = Object.keys(initialState).reduce<
    Record<string, (value: any) => void>
  >((acc, key) => {
    acc[`set${key.charAt(0).toUpperCase() + key.slice(1)}`] = (value: any) => {
      setState((prev) => ({ ...prev, [key]: value }));
    };
    return acc;
  }, {});

  // Reset state to initial values
  const resetState = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  return [state, setters, resetState];
}
