import * as oauth from "oauth4webapi";
import type { FetchLike, TokenResponse } from "./types";

const DEFAULT_ACCOUNTS_BASE_URL = "https://accounts.spotify.com";

export interface CreateAuthorizeUrlOptions {
  clientId: string;
  redirectUri: string;
  scopes?: readonly string[];
  state?: string;
  showDialog?: boolean;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  accountsBaseUrl?: string;
}

export class SpotifyOAuthError extends Error {
  override readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "SpotifyOAuthError";
    this.cause = cause;
  }
}

export interface PkceChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
}

export interface TokenRequestOptions {
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
  fetch?: FetchLike;
  accountsBaseUrl?: string;
}

export interface ExchangeAuthorizationCodeOptions extends TokenRequestOptions {
  code: string;
  codeVerifier: string;
}

export interface ExchangePkceCodeOptions extends ExchangeAuthorizationCodeOptions {}

export interface RefreshAccessTokenOptions extends TokenRequestOptions {
  refreshToken: string;
}

export interface ClientCredentialsTokenOptions extends TokenRequestOptions {
  scopes?: readonly string[];
}

export function createAuthorizeUrl(options: CreateAuthorizeUrlOptions): string {
  const url = new URL("/authorize", trimTrailingSlash(options.accountsBaseUrl ?? DEFAULT_ACCOUNTS_BASE_URL));

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("redirect_uri", options.redirectUri);

  if (options.scopes?.length) {
    url.searchParams.set("scope", options.scopes.join(" "));
  }

  if (options.state) {
    url.searchParams.set("state", options.state);
  }

  if (options.showDialog !== undefined) {
    url.searchParams.set("show_dialog", String(options.showDialog));
  }

  if (options.codeChallenge) {
    url.searchParams.set("code_challenge", options.codeChallenge);
    url.searchParams.set(
      "code_challenge_method",
      options.codeChallengeMethod ?? "S256",
    );
  }

  return url.toString();
}

export async function createPkceChallenge(): Promise<PkceChallenge> {
  const codeVerifier = oauth.generateRandomCodeVerifier();

  return {
    codeVerifier,
    codeChallenge: await oauth.calculatePKCECodeChallenge(codeVerifier),
    codeChallengeMethod: "S256",
  };
}

export function exchangeAuthorizationCode(
  options: ExchangeAuthorizationCodeOptions,
): Promise<TokenResponse> {
  return requestToken(options, {
    grant_type: "authorization_code",
    code: options.code,
    redirect_uri: required(options.redirectUri, "redirectUri"),
    code_verifier: options.codeVerifier,
  });
}

export const exchangePkceCode: (
  options: ExchangePkceCodeOptions,
) => Promise<TokenResponse> = exchangeAuthorizationCode;

export function refreshAccessToken(
  options: RefreshAccessTokenOptions,
): Promise<TokenResponse> {
  return requestToken(options, {
    grant_type: "refresh_token",
    refresh_token: options.refreshToken,
  });
}

export function clientCredentialsToken(
  options: ClientCredentialsTokenOptions,
): Promise<TokenResponse> {
  return requestToken(options, {
    grant_type: "client_credentials",
    scope: options.scopes?.join(" "),
  });
}

async function requestToken(
  options: TokenRequestOptions,
  fields: Record<string, string | undefined>,
): Promise<TokenResponse> {
  const server = createAuthorizationServer(options.accountsBaseUrl);
  const client = createClient(options.clientId);
  const clientAuth = createClientAuth(options);
  const requestOptions = createRequestOptions(options.fetch);

  try {
    if (fields.grant_type === "authorization_code") {
      const callbackParameters = oauth.validateAuthResponse(
        server,
        client,
        new URLSearchParams({ code: required(fields.code, "code") }),
        oauth.skipStateCheck,
      );
      const response = await oauth.authorizationCodeGrantRequest(
        server,
        client,
        clientAuth,
        callbackParameters,
        required(fields.redirect_uri, "redirectUri"),
        required(fields.code_verifier, "codeVerifier"),
        requestOptions,
      );

      return await oauth.processAuthorizationCodeResponse(
        server,
        client,
        response,
      ) as TokenResponse;
    }

    if (fields.grant_type === "refresh_token") {
      const response = await oauth.refreshTokenGrantRequest(
        server,
        client,
        clientAuth,
        required(fields.refresh_token, "refreshToken"),
        requestOptions,
      );

      return await oauth.processRefreshTokenResponse(server, client, response) as TokenResponse;
    }

    if (fields.grant_type === "client_credentials") {
      const parameters = new URLSearchParams();
      if (fields.scope) {
        parameters.set("scope", fields.scope);
      }

      const response = await oauth.clientCredentialsGrantRequest(
        server,
        client,
        clientAuth,
        parameters,
        requestOptions,
      );

      return await oauth.processClientCredentialsResponse(server, client, response) as TokenResponse;
    }
  } catch (error) {
    throw new SpotifyOAuthError(resolveOAuthErrorMessage(error), error);
  }

  throw new Error(`Unsupported grant type: ${fields.grant_type ?? "unknown"}`);
}

function createAuthorizationServer(accountsBaseUrl?: string): oauth.AuthorizationServer {
  const baseUrl = trimTrailingSlash(accountsBaseUrl ?? DEFAULT_ACCOUNTS_BASE_URL);

  return {
    issuer: baseUrl,
    authorization_endpoint: new URL("/authorize", baseUrl).toString(),
    token_endpoint: new URL("/api/token", baseUrl).toString(),
  };
}

function createClient(clientId: string): oauth.Client {
  return { client_id: clientId };
}

function createClientAuth(options: TokenRequestOptions): oauth.ClientAuth {
  if (options.clientSecret) {
    return oauth.ClientSecretBasic(options.clientSecret);
  }

  return oauth.None();
}

function createRequestOptions(fetcher: FetchLike | undefined): oauth.TokenEndpointRequestOptions | undefined {
  if (!fetcher) {
    return undefined;
  }

  return {
    [oauth.customFetch]: fetcher,
  };
}

function resolveOAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Spotify OAuth request failed.";
}

function required<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function trimTrailingSlash(value: string): string {
  let end = value.length;

  while (end > 0 && value.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return value.slice(0, end);
}
