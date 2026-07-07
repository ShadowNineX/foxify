import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAuthorizeUrl,
  createPkceChallenge,
  exchangeAuthorizationCode,
} from "../src/index.ts";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), ".env");
const clientId = requiredEnv("SPOTIFY_CLIENT_ID");
const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? "http://127.0.0.1:5173/callback";
const scopes = splitScopes(process.env.SPOTIFY_SCOPES)
  ?? ["user-read-email", "playlist-read-private"];
const redirectUrl = new URL(redirectUri);

if (!["127.0.0.1", "localhost"].includes(redirectUrl.hostname)) {
  throw new Error("SPOTIFY_REDIRECT_URI must be localhost or 127.0.0.1 for this example.");
}

const state = crypto.randomUUID();
const pkce = await createPkceChallenge();
const callback = waitForCallback(redirectUrl, state);
const authorizationUrl = createAuthorizeUrl({
  clientId,
  redirectUri,
  scopes,
  state,
  codeChallenge: pkce.codeChallenge,
  codeChallengeMethod: pkce.codeChallengeMethod,
});

console.log("Opening Spotify login...");
console.log("If the browser does not open, paste this URL:");
console.log(authorizationUrl);

openBrowser(authorizationUrl);

const code = await callback;
const tokens = await exchangeAuthorizationCode({
  clientId,
  redirectUri,
  code,
  codeVerifier: pkce.codeVerifier,
});

updateEnvFile(envPath, {
  SPOTIFY_REDIRECT_URI: redirectUri,
  SPOTIFY_ACCESS_TOKEN: tokens.access_token,
  SPOTIFY_TOKEN_EXPIRES_AT: String(Date.now() + tokens.expires_in * 1000),
  ...(tokens.refresh_token ? { SPOTIFY_REFRESH_TOKEN: tokens.refresh_token } : {}),
});

console.log("Login complete. Updated examples/.env with Spotify OAuth tokens.");
console.log("Now run: bun run example:user-profile-playlists");

function waitForCallback(redirectUrl: URL, expectedState: string): Promise<string> {
  return new Promise((resolveCode, rejectCode) => {
    const server = createServer((request, response) => {
      handleCallback(request, response, redirectUrl, expectedState)
        .then((code) => {
          server.close();
          resolveCode(code);
        })
        .catch((error: unknown) => {
          server.close();
          rejectCode(error);
        });
    });

    server.once("error", rejectCode);
    server.listen(getPort(redirectUrl), redirectUrl.hostname);
  });
}

async function handleCallback(
  request: IncomingMessage,
  response: ServerResponse,
  redirectUrl: URL,
  expectedState: string,
): Promise<string> {
  const requestUrl = new URL(request.url ?? "/", redirectUrl.origin);

  if (requestUrl.pathname !== redirectUrl.pathname) {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("Not found.");
    throw new Error(`Unexpected callback path: ${requestUrl.pathname}`);
  }

  const error = requestUrl.searchParams.get("error");

  if (error) {
    response.writeHead(400, { "content-type": "text/plain" });
    response.end(`Spotify authorization failed: ${error}`);
    throw new Error(`Spotify authorization failed: ${error}`);
  }

  if (requestUrl.searchParams.get("state") !== expectedState) {
    response.writeHead(400, { "content-type": "text/plain" });
    response.end("Invalid OAuth state.");
    throw new Error("Invalid OAuth state.");
  }

  const code = requestUrl.searchParams.get("code");

  if (!code) {
    response.writeHead(400, { "content-type": "text/plain" });
    response.end("Missing authorization code.");
    throw new Error("Missing authorization code.");
  }

  response.writeHead(200, { "content-type": "text/plain" });
  response.end("Spotify login complete. You can close this tab.");

  return code;
}

function updateEnvFile(envPath: string, values: Record<string, string>): void {
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

function openBrowser(url: string): void {
  const command = process.platform === "win32"
    ? "rundll32"
    : process.platform === "darwin"
      ? "open"
      : "xdg-open";
  const args = process.platform === "win32"
    ? ["url.dll,FileProtocolHandler", url]
    : [url];
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });

  child.unref();
}

function getPort(url: URL): number {
  if (url.port) {
    return Number(url.port);
  }

  return url.protocol === "https:" ? 443 : 80;
}

function splitScopes(value: string | undefined): string[] | undefined {
  const scopes = value?.split(/\s+/).filter(Boolean);

  return scopes?.length ? scopes : undefined;
}

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}
