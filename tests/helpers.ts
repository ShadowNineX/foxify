import { expect, vi } from "vitest";

import type { FetchLike } from "../src/index";

export type FetchCall = [string | URL | Request, RequestInit | undefined];
export type MockFetch = FetchLike & { mock: { calls: FetchCall[] } };

export function jsonResponse(
  body: unknown,
  init: ResponseInit = {},
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
  });
}

export function textResponse(text: string, init: ResponseInit = {}): Response {
  return new Response(text, init);
}

export function tokenResponse(extra: Record<string, unknown> = {}): Response {
  return jsonResponse({
    access_token: "access",
    token_type: "Bearer",
    expires_in: 3600,
    ...extra,
  });
}

export function mockFetch(handler: FetchLike): MockFetch {
  return vi.fn(handler) as unknown as MockFetch;
}

export function mockJsonFetch(body: unknown = {}): MockFetch {
  return mockFetch(async () => jsonResponse(body));
}

export function firstCall(fetch: MockFetch): FetchCall {
  const call = fetch.mock.calls[0];
  if (!call) {
    throw new Error("Expected fetch to be called.");
  }

  return call;
}

export function lastCall(fetch: MockFetch): FetchCall {
  const call = fetch.mock.calls.at(-1);
  if (!call) {
    throw new Error("Expected fetch to be called.");
  }

  return call;
}

export function expectRequest(
  fetch: MockFetch,
  expected: {
    method: string;
    path: string;
    search?: Record<string, string>;
    body?: unknown;
    headers?: Record<string, string | RegExp>;
  },
): void {
  const [urlInput, init] = lastCall(fetch);
  const url = new URL(requestUrlToString(urlInput));

  expect(`${url.origin}${url.pathname}`).toBe(expected.path);
  expect(init?.method).toBe(expected.method);

  for (const [key, value] of Object.entries(expected.search ?? {})) {
    expect(url.searchParams.get(key)).toBe(value);
  }

  if (expected.body !== undefined) {
    expect(JSON.parse(requestBodyToString(init?.body))).toEqual(expected.body);
  }

  const headers = new Headers(init?.headers);
  for (const [key, value] of Object.entries(expected.headers ?? {})) {
    const actual = headers.get(key);
    if (value instanceof RegExp) {
      expect(actual).toMatch(value);
    } else {
      expect(actual).toBe(value);
    }
  }
}

export function requestUrlToString(input: string | URL | Request): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

export function requestBodyToString(body: BodyInit | null | undefined): string {
  if (typeof body === "string") {
    return body;
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (body === undefined || body === null) {
    return "";
  }

  throw new TypeError(`Unsupported request body type: ${body.constructor.name}`);
}
