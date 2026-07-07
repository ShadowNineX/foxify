import { ids } from "./core";
import type { SpotifyHttpClient } from "./core";
import type {
  AdditionalTypesQuery,
  CursorPagingQuery,
  FieldsQuery,
  LocaleQuery,
  MarketQuery,
  PagingQuery,
  RecommendationQuery,
  RequestOptions,
} from "./types";

export type Requester = SpotifyHttpClient["request"];
export type QueryValue = string | number | boolean | readonly string[] | undefined;
export type Query = Record<string, QueryValue>;

export interface RawRequestOptions extends RequestOptions {
  query?: Query;
  body?: unknown;
}

export interface SaveOptions extends RequestOptions {
  idsInBody?: boolean;
}

export interface MarketOptions extends MarketQuery, RequestOptions {}

export interface PagingOptions extends PagingQuery, RequestOptions {}

export interface PagingMarketOptions extends PagingQuery, MarketQuery, RequestOptions {}

export interface CountryPagingOptions extends PagingQuery, RequestOptions {
  country?: string;
}

export interface PagingLocaleOptions extends PagingQuery, LocaleQuery, RequestOptions {}

export interface LocaleOptions extends LocaleQuery, RequestOptions {}

export interface ArtistAlbumsOptions extends PagingQuery, MarketQuery, RequestOptions {
  include_groups?: string | readonly string[];
}

export interface SearchOptions extends PagingQuery, MarketQuery, RequestOptions {
  include_external?: "audio";
}

export interface PlaylistItemsOptions
  extends PagingQuery,
    MarketQuery,
    FieldsQuery,
    AdditionalTypesQuery,
    RequestOptions {}

export interface PlaylistRequestOptions
  extends MarketQuery,
    FieldsQuery,
    AdditionalTypesQuery,
    RequestOptions {}

export interface FeaturedPlaylistsOptions extends PagingQuery, RequestOptions {
  country?: string;
  locale?: string;
  timestamp?: string;
}

export interface CategoryPlaylistsOptions extends PagingQuery, RequestOptions {
  country?: string;
}

export interface PlaylistPositionOptions extends RequestOptions {
  position?: number;
}

export interface PlayerStateOptions
  extends MarketQuery,
    AdditionalTypesQuery,
    RequestOptions {}

export interface TransferPlaybackOptions extends RequestOptions {
  play?: boolean;
}

export interface DeviceTargetOptions extends RequestOptions {
  device_id?: string;
}

export interface RecentlyPlayedOptions extends RequestOptions {
  limit?: number;
  after?: number;
  before?: number;
}

export interface FollowPlaylistOptions extends RequestOptions {
  public?: boolean;
}

export interface TopItemsOptions extends PagingQuery, RequestOptions {
  time_range?: "long_term" | "medium_term" | "short_term";
}

export interface CursorPagingOptions extends CursorPagingQuery, RequestOptions {}

export type RecommendationsOptions = RecommendationQuery & RequestOptions;

interface IdsBody {
  ids: readonly string[];
}

export function saveIds(
  request: Requester,
  method: "PUT" | "DELETE",
  path: string,
  targetIds: readonly string[],
  options?: SaveOptions,
  extraQuery: Query = {},
): Promise<void> {
  const idsBody = { ids: targetIds } satisfies IdsBody;
  const query = options?.idsInBody
    ? extraQuery
    : { ...extraQuery, ids: ids(targetIds) };

  return request<void>({
    method,
    path,
    query,
    body: options?.idsInBody ? idsBody : undefined,
    ...requestOptions(options),
  });
}

export function pickQuery<T extends object, K extends Extract<keyof T, string>>(
  source: T | undefined,
  keys: readonly K[],
): Pick<T, K> {
  const output: Partial<T> = {};

  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined) {
      output[key] = value;
    }
  }

  return output as Pick<T, K>;
}

export function requestOptions(options: RequestOptions | undefined): RequestOptions {
  return {
    headers: options?.headers,
    signal: options?.signal,
  };
}

export function filterRecommendationOptions(options: RecommendationsOptions): Query {
  const output: Query = {};

  for (const [key, value] of Object.entries(options)) {
    if (key !== "headers" && key !== "signal") {
      output[key] = value as QueryValue;
    }
  }

  return output;
}

export function headerRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) {
    return {};
  }

  return Object.fromEntries(new Headers(headers).entries());
}
