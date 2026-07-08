export type Awaitable<T> = T | Promise<T>;

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type AccessTokenProvider = () => Awaitable<string>;

export type AutoRetryOption = boolean | { retries: number };

export interface SpotifyClientOptions {
  accessToken?: string;
  getAccessToken?: AccessTokenProvider;
  fetch?: FetchLike;
  baseUrl?: string;
  autoRetry?: AutoRetryOption;
}

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: HeadersInit;
}

export interface PagingQuery {
  limit?: number;
  offset?: number;
}

export interface CursorPagingQuery {
  limit?: number;
  after?: string;
  before?: string;
}

export interface MarketQuery {
  market?: string;
}

export interface LocaleQuery {
  locale?: string;
}

export interface FieldsQuery {
  fields?: string;
}

export interface AdditionalTypesQuery {
  additional_types?: string | readonly string[];
}

export interface Paging<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  [key: string]: unknown;
}

export interface CursorPaging<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  cursors?: {
    after?: string;
    before?: string;
    [key: string]: unknown;
  };
  total?: number;
  [key: string]: unknown;
}

export interface ExternalUrls {
  spotify?: string;
  [key: string]: unknown;
}

export interface ImageObject {
  url: string;
  height: number | null;
  width: number | null;
  [key: string]: unknown;
}

export type PlaylistCoverImage = ImageObject;

export interface SpotifyObject {
  id: string;
  name?: string;
  type: string;
  uri?: string;
  href?: string;
  external_urls?: ExternalUrls;
  images?: ImageObject[];
  [key: string]: unknown;
}

export interface Album extends SpotifyObject {
  type: "album";
}

export interface Artist extends SpotifyObject {
  type: "artist";
}

export interface Audiobook extends SpotifyObject {
  type: "audiobook";
}

export interface Category extends SpotifyObject {
  type: "category";
}

export interface Chapter extends SpotifyObject {
  type: "chapter";
}

export interface Episode extends SpotifyObject {
  type: "episode";
}

export interface Playlist extends SpotifyObject {
  type: "playlist";
}

export interface Show extends SpotifyObject {
  type: "show";
}

export interface Track extends SpotifyObject {
  type: "track";
}

export interface UserProfile extends SpotifyObject {
  type: "user";
}

export type PlayableItem = Track | Episode;

export interface Device {
  id: string | null;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
  [key: string]: unknown;
}

export interface PlaybackState {
  device: Device;
  repeat_state: string;
  shuffle_state: boolean;
  context: Record<string, unknown> | null;
  timestamp: number;
  progress_ms: number | null;
  is_playing: boolean;
  item: PlayableItem | null;
  currently_playing_type: string;
  [key: string]: unknown;
}

export interface Queue {
  currently_playing: PlayableItem | null;
  queue: PlayableItem[];
  [key: string]: unknown;
}

export interface AudioFeatures {
  id: string;
  uri: string;
  track_href: string;
  type: "audio_features";
  [key: string]: unknown;
}

export interface AudioAnalysis {
  [key: string]: unknown;
}

export interface SpotifyApiErrorBody {
  error?: {
    status?: number;
    message?: string;
    [key: string]: unknown;
  } | string;
  error_description?: string;
  [key: string]: unknown;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
  [key: string]: unknown;
}

export type LibraryItemType = "album" | "audiobook" | "episode" | "show" | "track";
export type FollowType = "artist" | "user";
export type TopItemType = "artists" | "tracks";
export type SearchType =
  | "album"
  | "artist"
  | "playlist"
  | "track"
  | "show"
  | "episode"
  | "audiobook";

export interface PlaylistDetails {
  name?: string;
  /**
   * Spotify's profile/search publishing flag for the playlist.
   *
   * `false` hides the playlist from the owner's public profile and search, but
   * Spotify's Web API does not control link-private access.
   */
  public?: boolean;
  collaborative?: boolean;
  description?: string;
}

export interface CustomPlaylistCoverImageOptions extends RequestOptions {
  /**
   * Validate Spotify's documented 256 KB raw base64 JPEG request body limit before
   * sending the request. Enabled by default.
   */
  validatePayloadSize?: boolean;
}

export interface PlaylistItem {
  added_at?: string;
  added_by?: UserProfile;
  is_local?: boolean;
  item: PlayableItem | null;
  primary_color?: string | null;
  video_thumbnail?: unknown;
  [key: string]: unknown;
}

export interface PlaylistItemsBody {
  uris?: readonly string[];
  range_start?: number;
  insert_before?: number;
  range_length?: number;
  snapshot_id?: string;
}

export interface RemovePlaylistItemsBody {
  tracks: Array<{ uri: string; positions?: readonly number[] }>;
  snapshot_id?: string;
}

export interface StartPlaybackBody {
  context_uri?: string;
  uris?: readonly string[];
  offset?: { position?: number; uri?: string };
  position_ms?: number;
}

export interface RecommendationQuery {
  limit?: number;
  market?: string;
  seed_artists?: string | readonly string[];
  seed_genres?: string | readonly string[];
  seed_tracks?: string | readonly string[];
  [key: string]: string | number | boolean | readonly string[] | undefined;
}
