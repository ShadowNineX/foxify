import { SpotifyHttpClient } from "./core";
import {
  createAlbumsApi,
  createArtistsApi,
  createAudiobooksApi,
  createCategoriesApi,
  createChaptersApi,
  createEpisodesApi,
  createGenresApi,
  createMarketsApi,
  createSearchApi,
  createShowsApi,
  createTracksApi,
} from "./endpoints/catalog";
import { createLibraryApi } from "./endpoints/library";
import { createPlayerApi } from "./endpoints/player";
import { createPlaylistsApi } from "./endpoints/playlists";
import { createUsersApi } from "./endpoints/users";
import type { Query, RawRequestOptions } from "./internal";
import type { SpotifyClientOptions } from "./types";

export class SpotifyClient {
  readonly albums: ReturnType<typeof createAlbumsApi>;
  readonly artists: ReturnType<typeof createArtistsApi>;
  readonly audiobooks: ReturnType<typeof createAudiobooksApi>;
  readonly categories: ReturnType<typeof createCategoriesApi>;
  readonly chapters: ReturnType<typeof createChaptersApi>;
  readonly episodes: ReturnType<typeof createEpisodesApi>;
  readonly genres: ReturnType<typeof createGenresApi>;
  readonly library: ReturnType<typeof createLibraryApi>;
  readonly markets: ReturnType<typeof createMarketsApi>;
  readonly player: ReturnType<typeof createPlayerApi>;
  readonly playlists: ReturnType<typeof createPlaylistsApi>;
  readonly search: ReturnType<typeof createSearchApi>;
  readonly shows: ReturnType<typeof createShowsApi>;
  readonly tracks: ReturnType<typeof createTracksApi>;
  readonly users: ReturnType<typeof createUsersApi>;

  private readonly http: SpotifyHttpClient;

  constructor(options: SpotifyClientOptions = {}) {
    this.http = new SpotifyHttpClient(options);
    const request = this.http.request.bind(this.http);

    this.albums = createAlbumsApi(request);
    this.artists = createArtistsApi(request);
    this.audiobooks = createAudiobooksApi(request);
    this.categories = createCategoriesApi(request);
    this.chapters = createChaptersApi(request);
    this.episodes = createEpisodesApi(request);
    this.genres = createGenresApi(request);
    this.library = createLibraryApi(request);
    this.markets = createMarketsApi(request);
    this.player = createPlayerApi(request);
    this.playlists = createPlaylistsApi(request);
    this.search = createSearchApi(request);
    this.shows = createShowsApi(request);
    this.tracks = createTracksApi(request);
    this.users = createUsersApi(request);
  }

  request<T>(
    method: string,
    path: string,
    options: RawRequestOptions = {},
  ): Promise<T> {
    return this.http.request<T>({
      method,
      path,
      query: options.query as Query | undefined,
      body: options.body,
      headers: options.headers,
      signal: options.signal,
    });
  }
}

export function createSpotifyClient(options: SpotifyClientOptions = {}): SpotifyClient {
  return new SpotifyClient(options);
}
