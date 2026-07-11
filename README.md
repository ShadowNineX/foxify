# @shadownine/foxify

[![npm version](https://img.shields.io/npm/v/@shadownine/foxify)](https://www.npmjs.com/package/@shadownine/foxify)
[![license](https://img.shields.io/npm/l/@shadownine/foxify)](./LICENSE)

A typed, ESM-first client for the [Spotify Web API](https://developer.spotify.com/documentation/web-api). Foxify groups endpoints by resource, includes OAuth helpers, and uses the standard Fetch API, so it works with Bun, Node.js 18.17+, browsers, and edge runtimes.

> Foxify is an independent project and is not affiliated with or endorsed by Spotify.

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [Authentication](#authentication)
- [Client configuration](#client-configuration)
- [API overview](#api-overview)
- [Errors and rate limits](#errors-and-rate-limits)
- [Examples](#examples)
- [Development](#development)
- [Publishing](#publishing)

## Install

```bash
npm install @shadownine/foxify
```

```bash
bun add @shadownine/foxify
```

Foxify is published as an ES module. TypeScript declarations are included in the package.

## Quick start

Create a client with a Spotify access token and call a resource group:

```ts
import { createSpotifyClient } from "@shadownine/foxify";

const spotify = createSpotifyClient({
  accessToken: process.env.SPOTIFY_ACCESS_TOKEN,
});

const profile = await spotify.users.getCurrentProfile();
const playlists = await spotify.playlists.getCurrentUserPlaylists({ limit: 10 });

console.log(`${profile.display_name} has ${playlists.total} playlists`);
```

Spotify access tokens are short-lived. For long-running applications, pass a token getter so each request can use a current token:

```ts
const spotify = createSpotifyClient({
  async getAccessToken() {
    const tokens = await loadOrRefreshSpotifyTokens();
    return tokens.access_token;
  },
});
```

The client does not persist tokens. Store and refresh them in your application.

## Authentication

Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), register every redirect URI exactly, and choose the flow that matches your application.

### Authorization Code with PKCE

Use PKCE for applications that cannot safely hold a client secret, including browser and desktop applications.

```ts
import {
  createAuthorizeUrl,
  createPkceChallenge,
  exchangeAuthorizationCode,
} from "@shadownine/foxify";

const redirectUri = "http://127.0.0.1:5173/callback";
const state = crypto.randomUUID();
const pkce = await createPkceChallenge();

const authorizationUrl = createAuthorizeUrl({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  redirectUri,
  scopes: ["user-read-email", "playlist-read-private"],
  state,
  codeChallenge: pkce.codeChallenge,
  codeChallengeMethod: pkce.codeChallengeMethod,
});

// Redirect the user to authorizationUrl. In the callback, verify `state`
// before exchanging the returned authorization code.
const tokens = await exchangeAuthorizationCode({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  redirectUri,
  code: callbackCode,
  codeVerifier: pkce.codeVerifier,
});
```

Always verify the callback `state` value before exchanging a code. Keep access and refresh tokens out of source control and client-visible logs.

### Refresh token

```ts
import { refreshAccessToken } from "@shadownine/foxify";

const tokens = await refreshAccessToken({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  refreshToken: storedRefreshToken,
});
```

A refreshed response may not include a new refresh token. Preserve the existing one unless Spotify returns a replacement.

### Client credentials

Use client credentials for server-side access to public catalog data. This flow does not represent a Spotify user and cannot call user-specific endpoints.

```ts
import {
  clientCredentialsToken,
  createSpotifyClient,
} from "@shadownine/foxify";

const tokens = await clientCredentialsToken({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
});

const spotify = createSpotifyClient({ accessToken: tokens.access_token });
const results = await spotify.search.items("Daft Punk", ["artist", "track"], {
  market: "US",
  limit: 10,
});
```

Never ship a Spotify client secret to a browser or other public client.

## Client configuration

```ts
const spotify = createSpotifyClient({
  accessToken: "spotify-access-token",
  getAccessToken: async () => "fresh-spotify-access-token",
  fetch: globalThis.fetch,
  baseUrl: "https://api.spotify.com/v1",
  autoRetry: { retries: 1 },
});
```

| Option | Type | Purpose |
| --- | --- | --- |
| `accessToken` | `string` | Static bearer token used for Web API requests. |
| `getAccessToken` | `() => string \| Promise<string>` | Called before each request. Takes precedence over `accessToken`. |
| `fetch` | Fetch-compatible function | Replaces the runtime's global `fetch`, useful for tests and custom networking. |
| `baseUrl` | `string` | Overrides `https://api.spotify.com/v1`, primarily for tests or proxies. |
| `autoRetry` | `boolean \| { retries: number }` | Retries HTTP 429 responses that include a valid `Retry-After` header. |

If neither token option produces a value, authenticated requests throw before making a network request.

## API overview

Endpoints are grouped by Spotify resource and are fully typed:

```ts
spotify.albums
spotify.artists
spotify.audiobooks
spotify.categories
spotify.chapters
spotify.episodes
spotify.genres
spotify.library
spotify.markets
spotify.player
spotify.playlists
spotify.search
spotify.shows
spotify.tracks
spotify.users
```

Representative calls:

```ts
const album = await spotify.albums.get("album-id", { market: "US" });
const topTracks = await spotify.artists.getTopTracks("artist-id", { market: "US" });
const saved = await spotify.tracks.checkSaved(["track-id"]);

await spotify.playlists.addItems("playlist-id", ["spotify:track:track-id"]);
await spotify.player.startResumePlayback({ uris: ["spotify:track:track-id"] });
await spotify.users.follow("artist", ["artist-id"]);
```

Methods accept an optional final options object for supported query parameters, request headers, and an `AbortSignal`. Your token must include the scopes required by the corresponding Spotify endpoint.

### Raw requests

Use `request` when Spotify adds an endpoint before Foxify exposes a typed wrapper:

```ts
interface PlaybackState {
  is_playing: boolean;
}

const playback = await spotify.request<PlaybackState>("GET", "/me/player", {
  query: { market: "US" },
  signal: AbortSignal.timeout(5_000),
});
```

Paths are relative to the configured API base URL. Query arrays are serialized as comma-separated values. Successful `204 No Content` responses resolve to `undefined`.

### Playlist cover images

```ts
const images = await spotify.playlists.getCoverImage("playlist-id");

await spotify.playlists.uploadCustomCoverImage(
  "playlist-id",
  jpegImageBase64,
);
```

The upload value must be raw base64-encoded JPEG data, not a data URL. Spotify limits the request body to 256 KB and requires the `ugc-image-upload` scope.

## Errors and rate limits

Web API failures throw `SpotifyApiError`:

```ts
import { SpotifyApiError } from "@shadownine/foxify";

try {
  await spotify.tracks.get("missing-track");
} catch (error) {
  if (error instanceof SpotifyApiError) {
    console.error(error.status);      // HTTP status
    console.error(error.message);     // Spotify error message when available
    console.error(error.retryAfter);  // Retry-After seconds when provided
    console.error(error.body);        // Parsed response body
  }
}
```

OAuth token endpoint failures throw `SpotifyOAuthError` and preserve the original error in `cause`.

Automatic retry is disabled by default. Set `autoRetry: true` for one retry, or `autoRetry: { retries: n }` for an explicit limit. Foxify only retries `429 Too Many Requests` responses with a valid non-negative `Retry-After` header; other errors are returned immediately.

## Examples

Runnable TypeScript examples live in [`examples/`](./examples):

| Command | What it demonstrates |
| --- | --- |
| `bun run example:client-credentials-search` | App-only authentication and catalog search. |
| `bun run example:oauth-login` | Local Authorization Code with PKCE login. |
| `bun run example:user-profile-playlists` | Token refresh, current profile, and playlist paging. |

Install dependencies, then create the ignored `examples/.env` file with only the values needed by your chosen example:

```dotenv
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
SPOTIFY_SCOPES=user-read-email playlist-read-private
SPOTIFY_QUERY=Daft Punk
SPOTIFY_MARKET=US
```

Add the same redirect URI to your Spotify app settings. The OAuth login example writes access, expiry, and refresh-token values back to `examples/.env`; never commit that file. See [`examples/README.md`](./examples/README.md) for the per-example requirements.

## Development

### Prerequisites

- [Bun](https://bun.sh/) 1.3.14 or a compatible release
- Node.js 18.17+ for consuming the built package
- A Spotify developer app for live examples

### Set up the repository

```bash
git clone https://github.com/ShadowNineX/foxify.git
cd foxify
bun install --frozen-lockfile
```

Run the local quality checks:

```bash
bun run typecheck
bun run test
bun run build
```

Use `bun run test:watch` while developing. Build artifacts are generated in `dist/` by `tsdown` and should not be edited directly.

### Project layout

```text
src/client.ts       Public SpotifyClient and client factory
src/core.ts         HTTP transport, authentication, errors, and rate limits
src/oauth.ts        OAuth URL, PKCE, token exchange, and refresh helpers
src/endpoints/      Resource-specific endpoint groups
src/types.ts        Public Spotify response and option types
tests/              Vitest request/response contract tests
examples/           Runnable authentication and API examples
```

When adding or changing an endpoint:

1. Match Spotify's HTTP method, path, query, body, and response shape in the relevant `src/endpoints/` module.
2. Add or update public types in `src/types.ts` or the matching internal option types.
3. Add a deterministic Vitest contract test that asserts the observable request and response behavior.
4. Run type checking, tests, and the build before opening a pull request.

## Publishing

The package is published as `@shadownine/foxify` because the unscoped `foxify` name is already in use.

Before creating a release:

```bash
bun run typecheck
bun run test
bun run build
bun run pack:dry
```

Create and push a version tag:

```bash
npm version patch
git push --follow-tags
```

Tags matching `v*` trigger [the npm publishing workflow](./.github/workflows/npm-publish.yml). The manual fallback is:

```bash
npm publish --access public
```

## License

[MIT](./LICENSE)
