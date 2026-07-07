# @shadownine/foxify

A modern TypeScript client for the Spotify Web API.

`@shadownine/foxify` wraps Spotify's REST API in a grouped, autocomplete-friendly client:

```ts
import { createSpotifyClient } from "@shadownine/foxify";

const spotify = createSpotifyClient({
  accessToken: process.env.SPOTIFY_ACCESS_TOKEN!,
});

const album = await spotify.albums.get("4aawyAB9vmqN3uQ7FjRGTy", {
  market: "US",
});

console.log(album.name);
```

The library is ESM-first, typed, fetch-based, and works in runtimes with Web Fetch APIs such as Bun, modern Node, browsers, and edge runtimes.

## Install

```bash
bun add @shadownine/foxify
```

```bash
npm install @shadownine/foxify
```

## Quick Start

Create a client with an access token:

```ts
import { createSpotifyClient } from "@shadownine/foxify";

const spotify = createSpotifyClient({
  accessToken: "spotify-access-token",
});

const profile = await spotify.users.getCurrentProfile();
const playlists = await spotify.playlists.getCurrentUserPlaylists({ limit: 10 });
```

Or provide a token getter if your app refreshes tokens:

```ts
const spotify = createSpotifyClient({
  async getAccessToken() {
    return await loadFreshSpotifyAccessToken();
  },
});
```

You can also inject `fetch`, change the base URL for tests, or enable simple 429 retry behavior:

```ts
const spotify = createSpotifyClient({
  accessToken: "token",
  fetch: globalThis.fetch,
  baseUrl: "https://api.spotify.com/v1",
  autoRetry: { retries: 1 },
});
```

## API Shape

Endpoints are grouped by Spotify resource:

```ts
spotify.albums.get(id);
spotify.artists.getTopTracks(id, { market: "US" });
spotify.playlists.addItems(playlistId, ["spotify:track:..."]);
spotify.player.pause({ device_id: "device-id" });
spotify.search.items("Daft Punk", ["artist", "track"]);
spotify.users.follow("artist", ["artist-id"]);
```

Available groups:

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

There is also a raw request escape hatch:

```ts
const result = await spotify.request("GET", "/me/player", {
  query: { market: "US" },
});
```

## OAuth Helpers

`@shadownine/foxify` includes helpers for common Spotify OAuth flows.

### Authorization URL + PKCE

```ts
import {
  createAuthorizeUrl,
  createPkceChallenge,
  exchangeAuthorizationCode,
} from "@shadownine/foxify";

const pkce = await createPkceChallenge();

const authorizationUrl = createAuthorizeUrl({
  clientId: "spotify-client-id",
  redirectUri: "https://your-app.test/callback",
  scopes: ["user-read-email", "playlist-read-private"],
  state: "csrf-state",
  codeChallenge: pkce.codeChallenge,
});

// Redirect the user to authorizationUrl, then exchange the callback code:
const tokens = await exchangeAuthorizationCode({
  clientId: "spotify-client-id",
  code: "callback-code",
  codeVerifier: pkce.codeVerifier,
  redirectUri: "https://your-app.test/callback",
});
```

### Refresh Token

```ts
import { refreshAccessToken } from "@shadownine/foxify";

const tokens = await refreshAccessToken({
  clientId: "spotify-client-id",
  clientSecret: "spotify-client-secret",
  refreshToken: "refresh-token",
});
```

### Client Credentials

```ts
import { clientCredentialsToken } from "@shadownine/foxify";

const tokens = await clientCredentialsToken({
  clientId: "spotify-client-id",
  clientSecret: "spotify-client-secret",
});
```

## Examples

### Search

```ts
const results = await spotify.search.items("lofi", ["playlist", "track"], {
  market: "US",
  limit: 10,
});
```

### Save Tracks

```ts
await spotify.tracks.save(["spotify-track-id"]);

const saved = await spotify.tracks.checkSaved(["spotify-track-id"]);
```

### Create a Playlist

```ts
const playlist = await spotify.playlists.create({
  name: "Weekend Flight Deck",
  description: "Fresh tracks for late-night building.",
  public: false,
});

await spotify.playlists.addItems(playlist.id, [
  "spotify:track:...",
]);
```

### Playback

```ts
await spotify.player.startResumePlayback({
  uris: ["spotify:track:..."],
});

await spotify.player.setVolume(65);
await spotify.player.pause();
```

## Errors

Spotify Web API errors throw `SpotifyApiError`:

```ts
import { SpotifyApiError } from "@shadownine/foxify";

try {
  await spotify.tracks.get("missing-track");
} catch (error) {
  if (error instanceof SpotifyApiError) {
    console.error(error.status);
    console.error(error.message);
    console.error(error.retryAfter);
  }
}
```

OAuth helper failures throw `SpotifyOAuthError`:

```ts
import { SpotifyOAuthError } from "@shadownine/foxify";

try {
  await refreshAccessToken({ clientId, refreshToken });
} catch (error) {
  if (error instanceof SpotifyOAuthError) {
    console.error(error.message);
  }
}
```

## Development

```bash
bun install
bun run typecheck
bun run test
bun run build
```

Build output is generated with `tsdown` into `dist/`.

## Publishing

The plain `foxify` npm name is already taken, so this package is configured as `@shadownine/foxify`.

Before publishing, make sure the npm scope is yours. If you use a different npm username or org, update `package.json` and the import examples in this README.

Dry-run the package contents:

```bash
bun run pack:dry
```

Publish from a version tag:

```bash
npm version patch
git push --follow-tags
```

Pushing the tag starts the workflow and publishes the package to npm.

Manual fallback:

```bash
npm publish --access public
```

## Notes

- Spotify access tokens are required for Web API requests.
- Query arrays are serialized as Spotify-style comma lists.
- Empty `204` responses resolve to `undefined`.
- Deprecated playlist item endpoints are still available with `Deprecated` suffixes for compatibility.
