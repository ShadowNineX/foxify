# Foxify Examples

These examples are runnable TypeScript files for local development.

Install dependencies first:

```bash
bun install
```

Fill in the example credential file:

```bash
examples/.env
```

## App-only search

Uses Spotify's client credentials flow, then searches public catalog data.

Required environment variables:

```bash
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
```

Optional:

```bash
SPOTIFY_QUERY="Daft Punk"
SPOTIFY_MARKET=US
```

Run:

```bash
bun run example:client-credentials-search
```

## User profile and playlists

Fetches the current Spotify profile and recent playlists.

Run OAuth once first. It opens Spotify in your browser and writes the tokens into
`examples/.env` automatically:

```bash
bun run example:oauth-login
```

Required before OAuth login:

```bash
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
```

Run:

```bash
bun run example:user-profile-playlists
```
