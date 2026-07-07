import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSpotifyClient, refreshAccessToken } from "../src/index.ts";

const spotify = createSpotifyClient({
  getAccessToken,
});

const profile = await spotify.users.getCurrentProfile();
const playlists = await spotify.playlists.getCurrentUserPlaylists({
  limit: 10,
});
const profileName = typeof profile.display_name === "string"
  ? profile.display_name
  : profile.id;

console.log(`Signed in as ${profileName}`);
console.log("");
console.log("Recent playlists:");

for (const playlist of playlists.items) {
  console.log(`- ${playlist.name ?? playlist.id}`);
}

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

async function getAccessToken(): Promise<string> {
  const accessToken = process.env.SPOTIFY_ACCESS_TOKEN;
  const expiresAt = Number(process.env.SPOTIFY_TOKEN_EXPIRES_AT);

  if (accessToken && Number.isFinite(expiresAt) && expiresAt > Date.now() + 60_000) {
    return accessToken;
  }

  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!refreshToken) {
    return requiredEnv("SPOTIFY_ACCESS_TOKEN");
  }

  const tokens = await refreshAccessToken({
    clientId: requiredEnv("SPOTIFY_CLIENT_ID"),
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    refreshToken,
  });

  updateEnvFile({
    SPOTIFY_ACCESS_TOKEN: tokens.access_token,
    SPOTIFY_TOKEN_EXPIRES_AT: String(Date.now() + tokens.expires_in * 1000),
    ...(tokens.refresh_token ? { SPOTIFY_REFRESH_TOKEN: tokens.refresh_token } : {}),
  });

  return tokens.access_token;
}

function updateEnvFile(values: Record<string, string>): void {
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), ".env");
  const lines = existsSync(envPath)
    ? readFileSync(envPath, "utf8").split(/\r?\n/)
    : [];
  const pending = new Map(Object.entries(values));
  const updated = lines.map((line) => {
    const key = /^([A-Z0-9_]+)=/.exec(line)?.[1];

    if (!key) {
      return line;
    }

    const value = pending.get(key);

    if (value === undefined) {
      return line;
    }

    pending.delete(key);

    return `${key}=${value}`;
  });

  for (const [key, value] of pending) {
    updated.push(`${key}=${value}`);
  }

  writeFileSync(envPath, `${updated.join("\n").trimEnd()}\n`);
}
