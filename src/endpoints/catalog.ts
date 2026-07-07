import { encodePath, ids } from "../core";
import {
  filterRecommendationOptions,
  pickQuery,
  requestOptions,
  saveIds,
} from "../internal";
import type {
  ArtistAlbumsOptions,
  CountryPagingOptions,
  LocaleOptions,
  MarketOptions,
  PagingLocaleOptions,
  PagingMarketOptions,
  PagingOptions,
  RecommendationsOptions,
  Requester,
  SaveOptions,
  SearchOptions,
} from "../internal";
import type {
  Album,
  Artist,
  AudioAnalysis,
  AudioFeatures,
  Audiobook,
  Category,
  Chapter,
  Episode,
  Paging,
  RequestOptions,
  SearchType,
  Show,
  SpotifyObject,
  Track,
} from "../types";

export function createAlbumsApi(request: Requester) {
  return {
    get: (albumId: string, options?: MarketOptions) =>
      request<Album>({
        method: "GET",
        path: `/albums/${encodePath(albumId)}`,
        query: pickQuery(options, ["market"]),
        ...requestOptions(options),
      }),
    getSeveral: (albumIds: readonly string[], options?: MarketOptions) =>
      request<{ albums: Album[] }>({
        method: "GET",
        path: "/albums",
        query: { ids: ids(albumIds), ...pickQuery(options, ["market"]) },
        ...requestOptions(options),
      }),
    getTracks: (albumId: string, options?: PagingMarketOptions) =>
      request<Paging<Track>>({
        method: "GET",
        path: `/albums/${encodePath(albumId)}/tracks`,
        query: pickQuery(options, ["market", "limit", "offset"]),
        ...requestOptions(options),
      }),
    getSaved: (options?: PagingMarketOptions) =>
      request<Paging<{ added_at: string; album: Album }>>({
        method: "GET",
        path: "/me/albums",
        query: pickQuery(options, ["limit", "offset", "market"]),
        ...requestOptions(options),
      }),
    save: (albumIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "PUT", "/me/albums", albumIds, options),
    removeSaved: (albumIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "DELETE", "/me/albums", albumIds, options),
    checkSaved: (albumIds: readonly string[], options?: RequestOptions) =>
      request<boolean[]>({
        method: "GET",
        path: "/me/albums/contains",
        query: { ids: ids(albumIds) },
        ...requestOptions(options),
      }),
    getNewReleases: (options?: CountryPagingOptions) =>
      request<{ albums: Paging<Album> }>({
        method: "GET",
        path: "/browse/new-releases",
        query: pickQuery(options, ["country", "limit", "offset"]),
        ...requestOptions(options),
      }),
  };
}

export function createArtistsApi(request: Requester) {
  return {
    get: (artistId: string, options?: RequestOptions) =>
      request<Artist>({
        method: "GET",
        path: `/artists/${encodePath(artistId)}`,
        ...requestOptions(options),
      }),
    getSeveral: (artistIds: readonly string[], options?: RequestOptions) =>
      request<{ artists: Artist[] }>({
        method: "GET",
        path: "/artists",
        query: { ids: ids(artistIds) },
        ...requestOptions(options),
      }),
    getAlbums: (artistId: string, options?: ArtistAlbumsOptions) =>
      request<Paging<Album>>({
        method: "GET",
        path: `/artists/${encodePath(artistId)}/albums`,
        query: pickQuery(options, ["include_groups", "market", "limit", "offset"]),
        ...requestOptions(options),
      }),
    getTopTracks: (artistId: string, options?: MarketOptions) =>
      request<{ tracks: Track[] }>({
        method: "GET",
        path: `/artists/${encodePath(artistId)}/top-tracks`,
        query: pickQuery(options, ["market"]),
        ...requestOptions(options),
      }),
    getRelatedArtists: (artistId: string, options?: RequestOptions) =>
      request<{ artists: Artist[] }>({
        method: "GET",
        path: `/artists/${encodePath(artistId)}/related-artists`,
        ...requestOptions(options),
      }),
  };
}

export function createAudiobooksApi(request: Requester) {
  return {
    get: (audiobookId: string, options?: MarketOptions) =>
      request<Audiobook>({
        method: "GET",
        path: `/audiobooks/${encodePath(audiobookId)}`,
        query: pickQuery(options, ["market"]),
        ...requestOptions(options),
      }),
    getSeveral: (audiobookIds: readonly string[], options?: MarketOptions) =>
      request<{ audiobooks: Audiobook[] }>({
        method: "GET",
        path: "/audiobooks",
        query: { ids: ids(audiobookIds), ...pickQuery(options, ["market"]) },
        ...requestOptions(options),
      }),
    getChapters: (audiobookId: string, options?: PagingMarketOptions) =>
      request<Paging<Chapter>>({
        method: "GET",
        path: `/audiobooks/${encodePath(audiobookId)}/chapters`,
        query: pickQuery(options, ["market", "limit", "offset"]),
        ...requestOptions(options),
      }),
    getSaved: (options?: PagingOptions) =>
      request<Paging<{ added_at: string; audiobook: Audiobook }>>({
        method: "GET",
        path: "/me/audiobooks",
        query: pickQuery(options, ["limit", "offset"]),
        ...requestOptions(options),
      }),
    save: (audiobookIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "PUT", "/me/audiobooks", audiobookIds, options),
    removeSaved: (audiobookIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "DELETE", "/me/audiobooks", audiobookIds, options),
    checkSaved: (audiobookIds: readonly string[], options?: RequestOptions) =>
      request<boolean[]>({
        method: "GET",
        path: "/me/audiobooks/contains",
        query: { ids: ids(audiobookIds) },
        ...requestOptions(options),
      }),
  };
}

export function createCategoriesApi(request: Requester) {
  return {
    list: (options?: PagingLocaleOptions) =>
      request<{ categories: Paging<Category> }>({
        method: "GET",
        path: "/browse/categories",
        query: pickQuery(options, ["locale", "limit", "offset"]),
        ...requestOptions(options),
      }),
    get: (categoryId: string, options?: LocaleOptions) =>
      request<Category>({
        method: "GET",
        path: `/browse/categories/${encodePath(categoryId)}`,
        query: pickQuery(options, ["locale"]),
        ...requestOptions(options),
      }),
  };
}

export function createChaptersApi(request: Requester) {
  return {
    get: (chapterId: string, options?: MarketOptions) =>
      request<Chapter>({
        method: "GET",
        path: `/chapters/${encodePath(chapterId)}`,
        query: pickQuery(options, ["market"]),
        ...requestOptions(options),
      }),
    getSeveral: (chapterIds: readonly string[], options?: MarketOptions) =>
      request<{ chapters: Chapter[] }>({
        method: "GET",
        path: "/chapters",
        query: { ids: ids(chapterIds), ...pickQuery(options, ["market"]) },
        ...requestOptions(options),
      }),
  };
}

export function createEpisodesApi(request: Requester) {
  return {
    get: (episodeId: string, options?: MarketOptions) =>
      request<Episode>({
        method: "GET",
        path: `/episodes/${encodePath(episodeId)}`,
        query: pickQuery(options, ["market"]),
        ...requestOptions(options),
      }),
    getSeveral: (episodeIds: readonly string[], options?: MarketOptions) =>
      request<{ episodes: Episode[] }>({
        method: "GET",
        path: "/episodes",
        query: { ids: ids(episodeIds), ...pickQuery(options, ["market"]) },
        ...requestOptions(options),
      }),
    getSaved: (options?: PagingMarketOptions) =>
      request<Paging<{ added_at: string; episode: Episode }>>({
        method: "GET",
        path: "/me/episodes",
        query: pickQuery(options, ["limit", "offset", "market"]),
        ...requestOptions(options),
      }),
    save: (episodeIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "PUT", "/me/episodes", episodeIds, options),
    removeSaved: (episodeIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "DELETE", "/me/episodes", episodeIds, options),
    checkSaved: (episodeIds: readonly string[], options?: RequestOptions) =>
      request<boolean[]>({
        method: "GET",
        path: "/me/episodes/contains",
        query: { ids: ids(episodeIds) },
        ...requestOptions(options),
      }),
  };
}

export function createGenresApi(request: Requester) {
  return {
    getAvailableSeeds: (options?: RequestOptions) =>
      request<{ genres: string[] }>({
        method: "GET",
        path: "/recommendations/available-genre-seeds",
        ...requestOptions(options),
      }),
  };
}

export function createMarketsApi(request: Requester) {
  return {
    getAvailable: (options?: RequestOptions) =>
      request<{ markets: string[] }>({
        method: "GET",
        path: "/markets",
        ...requestOptions(options),
      }),
  };
}

export function createSearchApi(request: Requester) {
  return {
    items: (
      query: string,
      types: SearchType | readonly SearchType[],
      options?: SearchOptions,
    ) =>
      request<Record<string, Paging<SpotifyObject>>>({
        method: "GET",
        path: "/search",
        query: {
          q: query,
          type: Array.isArray(types) ? types.join(",") : types,
          ...pickQuery(options, ["market", "limit", "offset", "include_external"]),
        },
        ...requestOptions(options),
      }),
  };
}

export function createShowsApi(request: Requester) {
  return {
    get: (showId: string, options?: MarketOptions) =>
      request<Show>({
        method: "GET",
        path: `/shows/${encodePath(showId)}`,
        query: pickQuery(options, ["market"]),
        ...requestOptions(options),
      }),
    getSeveral: (showIds: readonly string[], options?: MarketOptions) =>
      request<{ shows: Show[] }>({
        method: "GET",
        path: "/shows",
        query: { ids: ids(showIds), ...pickQuery(options, ["market"]) },
        ...requestOptions(options),
      }),
    getEpisodes: (showId: string, options?: PagingMarketOptions) =>
      request<Paging<Episode>>({
        method: "GET",
        path: `/shows/${encodePath(showId)}/episodes`,
        query: pickQuery(options, ["market", "limit", "offset"]),
        ...requestOptions(options),
      }),
    getSaved: (options?: PagingOptions) =>
      request<Paging<{ added_at: string; show: Show }>>({
        method: "GET",
        path: "/me/shows",
        query: pickQuery(options, ["limit", "offset"]),
        ...requestOptions(options),
      }),
    save: (showIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "PUT", "/me/shows", showIds, options),
    removeSaved: (showIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "DELETE", "/me/shows", showIds, options),
    checkSaved: (showIds: readonly string[], options?: RequestOptions) =>
      request<boolean[]>({
        method: "GET",
        path: "/me/shows/contains",
        query: { ids: ids(showIds) },
        ...requestOptions(options),
      }),
  };
}

export function createTracksApi(request: Requester) {
  return {
    get: (trackId: string, options?: MarketOptions) =>
      request<Track>({
        method: "GET",
        path: `/tracks/${encodePath(trackId)}`,
        query: pickQuery(options, ["market"]),
        ...requestOptions(options),
      }),
    getSeveral: (trackIds: readonly string[], options?: MarketOptions) =>
      request<{ tracks: Track[] }>({
        method: "GET",
        path: "/tracks",
        query: { ids: ids(trackIds), ...pickQuery(options, ["market"]) },
        ...requestOptions(options),
      }),
    getSaved: (options?: PagingMarketOptions) =>
      request<Paging<{ added_at: string; track: Track }>>({
        method: "GET",
        path: "/me/tracks",
        query: pickQuery(options, ["limit", "offset", "market"]),
        ...requestOptions(options),
      }),
    save: (trackIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "PUT", "/me/tracks", trackIds, options),
    removeSaved: (trackIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "DELETE", "/me/tracks", trackIds, options),
    checkSaved: (trackIds: readonly string[], options?: RequestOptions) =>
      request<boolean[]>({
        method: "GET",
        path: "/me/tracks/contains",
        query: { ids: ids(trackIds) },
        ...requestOptions(options),
      }),
    getAudioFeatures: (trackIds: readonly string[], options?: RequestOptions) =>
      request<{ audio_features: AudioFeatures[] }>({
        method: "GET",
        path: "/audio-features",
        query: { ids: ids(trackIds) },
        ...requestOptions(options),
      }),
    getAudioFeature: (trackId: string, options?: RequestOptions) =>
      request<AudioFeatures>({
        method: "GET",
        path: `/audio-features/${encodePath(trackId)}`,
        ...requestOptions(options),
      }),
    getAudioAnalysis: (trackId: string, options?: RequestOptions) =>
      request<AudioAnalysis>({
        method: "GET",
        path: `/audio-analysis/${encodePath(trackId)}`,
        ...requestOptions(options),
      }),
    getRecommendations: (options: RecommendationsOptions) =>
      request<{ tracks: Track[]; seeds: unknown[] }>({
        method: "GET",
        path: "/recommendations",
        query: filterRecommendationOptions(options),
        ...requestOptions(options),
      }),
  };
}
