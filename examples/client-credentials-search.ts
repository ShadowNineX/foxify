import { clientCredentialsToken, createSpotifyClient } from "../src/index.ts";

const clientId = requiredEnv("SPOTIFY_CLIENT_ID");
const clientSecret = requiredEnv("SPOTIFY_CLIENT_SECRET");
const query = process.env.SPOTIFY_QUERY ?? "Daft Punk";
const market = process.env.SPOTIFY_MARKET ?? "US";

const token = await clientCredentialsToken({
  clientId,
  clientSecret,
});

const spotify = createSpotifyClient({
  accessToken: token.access_token,
});

const results = await spotify.search.items(query, ["artist", "track"], {
  market,
  limit: 5,
});

console.log(`Top Spotify results for "${query}" in ${market}:`);

for (const artist of results["artists"]?.items ?? []) {
  console.log(`Artist: ${artist.name ?? artist.id}`);
}

for (const track of results["tracks"]?.items ?? []) {
  console.log(`Track: ${track.name ?? track.id}`);
}

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}
