import { describe, expect, it } from "vitest";

import {
  SpotifyOAuthError,
  clientCredentialsToken,
  createAuthorizeUrl,
  createPkceChallenge,
  exchangeAuthorizationCode,
  exchangePkceCode,
  refreshAccessToken,
} from "../src/index";
import {
  firstCall,
  jsonResponse,
  mockFetch,
  requestBodyToString,
  requestUrlToString,
  tokenResponse,
} from "./helpers";

describe("OAuth helpers", () => {
  it("builds authorization URLs with optional values", () => {
    const url = new URL(
      createAuthorizeUrl({
        clientId: "client",
        redirectUri: "https://example.test/callback",
        scopes: ["playlist-read-private", "user-read-email"],
        state: "state",
        showDialog: true,
        codeChallenge: "challenge",
        accountsBaseUrl: "https://accounts.example.test///",
      }),
    );

    expect(url.origin).toBe("https://accounts.example.test");
    expect(url.pathname).toBe("/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("client");
    expect(url.searchParams.get("redirect_uri")).toBe("https://example.test/callback");
    expect(url.searchParams.get("scope")).toBe(
      "playlist-read-private user-read-email",
    );
    expect(url.searchParams.get("state")).toBe("state");
    expect(url.searchParams.get("show_dialog")).toBe("true");
    expect(url.searchParams.get("code_challenge")).toBe("challenge");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("creates PKCE challenge values", async () => {
    const challenge = await createPkceChallenge();

    expect(challenge.codeVerifier.length).toBeGreaterThan(40);
    expect(challenge.codeChallenge.length).toBeGreaterThan(40);
    expect(challenge.codeChallengeMethod).toBe("S256");
  });

  it("exchanges authorization codes through oauth4webapi", async () => {
    const fetch = mockFetch(async () => tokenResponse({ refresh_token: "refresh" }));

    await expect(
      exchangeAuthorizationCode({
        clientId: "client",
        code: "code",
        codeVerifier: "verifier",
        redirectUri: "https://example.test/callback",
        fetch,
      }),
    ).resolves.toMatchObject({
      access_token: "access",
      refresh_token: "refresh",
    });

    const [url, init] = firstCall(fetch);
    expect(requestUrlToString(url)).toBe("https://accounts.spotify.com/api/token");
    expect(init?.method).toBe("POST");
    const body = requestBodyToString(init?.body);
    expect(body).toContain("grant_type=authorization_code");
    expect(body).toContain("code=code");
    expect(body).toContain("code_verifier=verifier");
    expect(body).toContain("client_id=client");
  });

  it("keeps exchangePkceCode as the authorization-code alias", async () => {
    const fetch = mockFetch(async () => tokenResponse());

    await exchangePkceCode({
      clientId: "client",
      code: "code",
      codeVerifier: "verifier",
      redirectUri: "https://example.test/callback",
      fetch,
    });

    expect(requestBodyToString(firstCall(fetch)[1]?.body)).toContain(
      "grant_type=authorization_code",
    );
  });

  it("supports refresh grants with client secret auth", async () => {
    const fetch = mockFetch(async () => tokenResponse());

    await refreshAccessToken({
      clientId: "client",
      clientSecret: "secret",
      refreshToken: "refresh",
      fetch,
    });

    const [, init] = firstCall(fetch);
    const body = requestBodyToString(init?.body);
    expect(body).toContain("grant_type=refresh_token");
    expect(body).toContain("refresh_token=refresh");
    expect(new Headers(init?.headers).get("authorization")).toMatch(/^Basic /);
  });

  it("supports client credentials grants with scopes", async () => {
    const fetch = mockFetch(async () => tokenResponse());

    await clientCredentialsToken({
      clientId: "client",
      clientSecret: "secret",
      scopes: ["user-read-email"],
      fetch,
    });

    const [, init] = firstCall(fetch);
    const body = requestBodyToString(init?.body);
    expect(body).toContain("grant_type=client_credentials");
    expect(body).toContain("scope=user-read-email");
    expect(new Headers(init?.headers).get("authorization")).toMatch(/^Basic /);
  });

  it("wraps OAuth token errors", async () => {
    const fetch = mockFetch(async () =>
      jsonResponse(
        { error: "invalid_client", error_description: "Bad client" },
        { status: 401, statusText: "Unauthorized" },
      ),
    );

    await expect(
      refreshAccessToken({
        clientId: "client",
        refreshToken: "refresh",
        fetch,
      }),
    ).rejects.toBeInstanceOf(SpotifyOAuthError);
  });
});
