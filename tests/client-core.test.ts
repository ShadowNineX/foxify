import { describe, expect, it } from "vitest";

import { SpotifyApiError, createSpotifyClient } from "../src/index";
import {
  expectRequest,
  firstCall,
  jsonResponse,
  mockFetch,
  mockJsonFetch,
  textResponse,
} from "./helpers";

describe("SpotifyClient core HTTP behavior", () => {
  it("adds bearer auth and serializes query values", async () => {
    const fetch = mockJsonFetch({ id: "album_1", type: "album" });
    const spotify = createSpotifyClient({
      accessToken: "access-token",
      fetch,
    });

    await spotify.albums.get("album 1", { market: "SE" });

    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/albums/album%201",
      search: { market: "SE" },
      headers: { authorization: "Bearer access-token" },
    });
  });

  it("gets tokens from a provider for each request", async () => {
    let count = 0;
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({
      fetch,
      getAccessToken: () => `token-${++count}`,
    });

    await spotify.markets.getAvailable();
    await spotify.genres.getAvailableSeeds();

    expect(new Headers(fetch.mock.calls[0]?.[1]?.headers).get("authorization")).toBe(
      "Bearer token-1",
    );
    expect(new Headers(fetch.mock.calls[1]?.[1]?.headers).get("authorization")).toBe(
      "Bearer token-2",
    );
  });

  it("trims custom base URLs without relying on generated dist output", async () => {
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({
      accessToken: "token",
      baseUrl: "https://spotify.test/api///",
      fetch,
    });

    await spotify.request("GET", "/ping", { query: { ids: ["a", "b"] } });

    expectRequest(fetch, {
      method: "GET",
      path: "https://spotify.test/api/ping",
      search: { ids: "a,b" },
    });
  });

  it("serializes JSON request bodies with ofetch", async () => {
    const fetch = mockJsonFetch({ snapshot_id: "snapshot" });
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.playlists.addItems("playlist", ["spotify:track:one"], {
      position: 2,
    });

    expectRequest(fetch, {
      method: "POST",
      path: "https://api.spotify.com/v1/playlists/playlist/items",
      search: { position: "2" },
      body: { uris: ["spotify:track:one"] },
      headers: { "content-type": /application\/json/ },
    });
  });

  it("returns undefined for empty success responses", async () => {
    const fetch = mockFetch(async () => new Response(null, { status: 204 }));
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await expect(spotify.player.pause()).resolves.toBeUndefined();
  });

  it("parses non-JSON text responses", async () => {
    const fetch = mockFetch(async () => textResponse("ok", {
      headers: { "content-type": "text/plain" },
    }));
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await expect(spotify.request<string>("GET", "/health")).resolves.toBe("ok");
  });

  it("requires an access token for Web API requests", async () => {
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({ fetch });

    await expect(spotify.markets.getAvailable()).rejects.toThrow(
      "Spotify access token is required",
    );
  });

  it("throws SpotifyApiError with parsed body and retry-after", async () => {
    const fetch = mockFetch(async () =>
      jsonResponse(
        { error: { status: 429, message: "rate limited" } },
        {
          status: 429,
          statusText: "Too Many Requests",
          headers: { "retry-after": "3" },
        },
      ),
    );
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await expect(spotify.tracks.get("track")).rejects.toMatchObject({
      name: "SpotifyApiError",
      message: "rate limited",
      status: 429,
      retryAfter: 3,
    } satisfies Partial<SpotifyApiError>);
  });

  it("supports Spotify OAuth-style string errors", async () => {
    const fetch = mockFetch(async () =>
      jsonResponse(
        { error: "invalid_token", error_description: "Bad token" },
        { status: 401, statusText: "Unauthorized" },
      ),
    );
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await expect(spotify.users.getCurrentProfile()).rejects.toMatchObject({
      message: "Bad token",
      status: 401,
    });
  });

  it("passes custom headers and abort signals through", async () => {
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({ accessToken: "token", fetch });
    const controller = new AbortController();

    await spotify.request("POST", "/custom", {
      body: { ok: true },
      headers: { "x-test": "yes" },
      signal: controller.signal,
    });

    const [, init] = firstCall(fetch);
    expect(init?.signal).toBe(controller.signal);
    expect(new Headers(init?.headers).get("x-test")).toBe("yes");
  });
});
