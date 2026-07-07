import { FetchError, ofetch } from "ofetch";
import type { $Fetch, FetchOptions, FetchResponse } from "ofetch";
import type {
  AutoRetryOption,
  SpotifyApiErrorBody,
  SpotifyClientOptions,
} from "./types";

const DEFAULT_API_BASE_URL = "https://api.spotify.com/v1";

type QueryValue = string | number | boolean | readonly string[] | undefined | null;

interface InternalRequestOptions {
  method: string;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  rawBody?: BodyInit | string;
  headers?: HeadersInit;
  signal?: AbortSignal;
  auth?: boolean;
}

export class SpotifyApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly body: unknown;
  readonly retryAfter?: number;

  constructor(response: Response, body: unknown) {
    super(resolveErrorMessage(response, body));
    this.name = "SpotifyApiError";
    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.body = body;

    const retryAfter = response.headers.get("retry-after");
    if (retryAfter !== null) {
      const parsed = Number(retryAfter);
      this.retryAfter = Number.isFinite(parsed) ? parsed : undefined;
    }
  }
}

export class SpotifyHttpClient {
  readonly baseUrl: string;
  private readonly accessToken?: string;
  private readonly getAccessToken?: () => string | Promise<string>;
  private readonly fetcher: $Fetch;
  private readonly retries: number;

  constructor(options: SpotifyClientOptions = {}) {
    this.baseUrl = trimTrailingSlash(options.baseUrl ?? DEFAULT_API_BASE_URL);
    this.accessToken = options.accessToken;
    this.getAccessToken = options.getAccessToken;
    this.fetcher = ofetch.create(
      {
        baseURL: this.baseUrl,
      },
      {
        fetch: (options.fetch ?? globalThis.fetch?.bind(globalThis)) as typeof globalThis.fetch,
      },
    );
    this.retries = normalizeRetries(options.autoRetry);
  }

  async request<T>(options: InternalRequestOptions): Promise<T> {
    return this.requestWithRetry<T>(options, this.retries);
  }

  private async requestWithRetry<T>(
    options: InternalRequestOptions,
    retriesRemaining: number,
  ): Promise<T> {
    let response: FetchResponse<T>;

    try {
      response = await this.fetcher.raw<T>(options.path, {
        method: options.method as FetchOptions["method"],
        headers: await this.buildHeaders(options),
        query: normalizeQuery(options.query),
        body: serializeBody(options),
        signal: options.signal,
        retry: false,
        ignoreResponseError: true,
        parseResponse,
      });
    } catch (error) {
      if (error instanceof FetchError) {
        throw error;
      }

      throw error;
    }

    if (response.status === 429 && retriesRemaining > 0) {
      const retryAfter = Number(response.headers.get("retry-after"));
      if (Number.isFinite(retryAfter) && retryAfter >= 0) {
        await delay(retryAfter * 1000);
        return this.requestWithRetry<T>(options, retriesRemaining - 1);
      }
    }

    const body = response._data;

    if (!response.ok) {
      throw new SpotifyApiError(response, body);
    }

    return body as T;
  }

  private async buildHeaders(options: InternalRequestOptions): Promise<Headers> {
    const headers = new Headers(options.headers);

    if (options.auth !== false) {
      headers.set("authorization", `Bearer ${await this.resolveAccessToken()}`);
    }

    if (options.body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return headers;
  }

  private async resolveAccessToken(): Promise<string> {
    const token = this.getAccessToken ? await this.getAccessToken() : this.accessToken;

    if (!token) {
      throw new Error("Spotify access token is required for Web API requests.");
    }

    return token;
  }
}

export function encodePath(value: string): string {
  return encodeURIComponent(value);
}

export function ids(values: readonly string[]): string {
  return values.join(",");
}

export function libraryPath(type: string): string {
  return `${type}s`;
}

function normalizeQuery(
  query: Record<string, QueryValue> | undefined,
): Record<string, string | number | boolean | undefined> | undefined {
  if (!query) {
    return undefined;
  }

  const normalized: Record<string, string | number | boolean | undefined> = {};

  for (const [key, value] of Object.entries(query)) {
    normalized[key] = isStringArray(value) ? value.join(",") : value ?? undefined;
  }

  return normalized;
}

function isStringArray(value: QueryValue): value is readonly string[] {
  return Array.isArray(value);
}

function serializeBody(options: InternalRequestOptions): BodyInit | Record<string, unknown> | string | undefined {
  if (options.rawBody !== undefined) {
    return options.rawBody;
  }

  if (options.body !== undefined) {
    return options.body as Record<string, unknown>;
  }

  return undefined;
}

function parseResponse(text: string): unknown {
  if (text.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function resolveErrorMessage(response: Response, body: unknown): string {
  const error = (body as SpotifyApiErrorBody | undefined)?.error;

  if (typeof error === "object" && error?.message) {
    return error.message;
  }

  if (typeof error === "string") {
    return (body as SpotifyApiErrorBody).error_description ?? error;
  }

  return `${response.status} ${response.statusText}`.trim();
}

function normalizeRetries(autoRetry: AutoRetryOption | undefined): number {
  if (autoRetry === true) {
    return 1;
  }

  if (typeof autoRetry === "object") {
    return Math.max(0, autoRetry.retries);
  }

  return 0;
}

function trimTrailingSlash(value: string): string {
  let end = value.length;

  while (end > 0 && value.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return value.slice(0, end);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
