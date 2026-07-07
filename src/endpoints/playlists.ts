import { encodePath } from "../core";
import { headerRecord, pickQuery, requestOptions } from "../internal";
import type {
  CategoryPlaylistsOptions,
  FeaturedPlaylistsOptions,
  PlaylistItemsOptions,
  PlaylistPositionOptions,
  PlaylistRequestOptions,
  PagingOptions,
  Requester,
} from "../internal";
import type {
  CustomPlaylistCoverImageOptions,
  Episode,
  Paging,
  Playlist,
  PlaylistCoverImage,
  PlaylistDetails,
  PlaylistItemsBody,
  RemovePlaylistItemsBody,
  RequestOptions,
  Track,
} from "../types";

interface CreatePlaylistBody extends PlaylistDetails {
  name: string;
}

const MAX_CUSTOM_COVER_IMAGE_BYTES = 256 * 1024;

export function createPlaylistsApi(request: Requester) {
  const deprecatedTracksPath = (playlistId: string) =>
    `/playlists/${encodePath(playlistId)}/tracks`;
  const itemsPath = (playlistId: string) =>
    `/playlists/${encodePath(playlistId)}/items`;

  return {
    get: (playlistId: string, options?: PlaylistRequestOptions) =>
      request<Playlist>({
        method: "GET",
        path: `/playlists/${encodePath(playlistId)}`,
        query: pickQuery(options, ["market", "fields", "additional_types"]),
        ...requestOptions(options),
      }),
    changeDetails: (playlistId: string, details: PlaylistDetails, options?: RequestOptions) =>
      request<void>({
        method: "PUT",
        path: `/playlists/${encodePath(playlistId)}`,
        body: details,
        ...requestOptions(options),
      }),
    getItems: (playlistId: string, options?: PlaylistItemsOptions) =>
      request<Paging<{ track: Track | Episode }>>({
        method: "GET",
        path: itemsPath(playlistId),
        query: pickQuery(options, ["market", "fields", "limit", "offset", "additional_types"]),
        ...requestOptions(options),
      }),
    updateItems: (playlistId: string, body: PlaylistItemsBody, options?: RequestOptions) =>
      request<{ snapshot_id: string }>({
        method: "PUT",
        path: itemsPath(playlistId),
        body,
        ...requestOptions(options),
      }),
    addItems: (
      playlistId: string,
      uris: readonly string[],
      options?: PlaylistPositionOptions,
    ) =>
      request<{ snapshot_id: string }>({
        method: "POST",
        path: itemsPath(playlistId),
        query: pickQuery(options, ["position"]),
        body: { uris },
        ...requestOptions(options),
      }),
    removeItems: (playlistId: string, body: RemovePlaylistItemsBody, options?: RequestOptions) =>
      request<{ snapshot_id: string }>({
        method: "DELETE",
        path: itemsPath(playlistId),
        body,
        ...requestOptions(options),
      }),
    /** @deprecated Use getItems. */
    getItemsDeprecated: (playlistId: string, options?: PlaylistItemsOptions) =>
      request<Paging<{ track: Track | Episode }>>({
        method: "GET",
        path: deprecatedTracksPath(playlistId),
        query: pickQuery(options, ["market", "fields", "limit", "offset", "additional_types"]),
        ...requestOptions(options),
      }),
    /** @deprecated Use updateItems. */
    updateItemsDeprecated: (playlistId: string, body: PlaylistItemsBody, options?: RequestOptions) =>
      request<{ snapshot_id: string }>({
        method: "PUT",
        path: deprecatedTracksPath(playlistId),
        body,
        ...requestOptions(options),
      }),
    /** @deprecated Use addItems. */
    addItemsDeprecated: (
      playlistId: string,
      uris: readonly string[],
      options?: PlaylistPositionOptions,
    ) =>
      request<{ snapshot_id: string }>({
        method: "POST",
        path: deprecatedTracksPath(playlistId),
        query: pickQuery(options, ["position"]),
        body: { uris },
        ...requestOptions(options),
      }),
    /** @deprecated Use removeItems. */
    removeItemsDeprecated: (
      playlistId: string,
      body: RemovePlaylistItemsBody,
      options?: RequestOptions,
    ) =>
      request<{ snapshot_id: string }>({
        method: "DELETE",
        path: deprecatedTracksPath(playlistId),
        body,
        ...requestOptions(options),
      }),
    getCurrentUserPlaylists: (options?: PagingOptions) =>
      request<Paging<Playlist>>({
        method: "GET",
        path: "/me/playlists",
        query: pickQuery(options, ["limit", "offset"]),
        ...requestOptions(options),
      }),
    create: (body: CreatePlaylistBody, options?: RequestOptions) =>
      request<Playlist>({
        method: "POST",
        path: "/me/playlists",
        body,
        ...requestOptions(options),
      }),
    getUserPlaylists: (userId: string, options?: PagingOptions) =>
      request<Paging<Playlist>>({
        method: "GET",
        path: `/users/${encodePath(userId)}/playlists`,
        query: pickQuery(options, ["limit", "offset"]),
        ...requestOptions(options),
      }),
    createForUser: (userId: string, body: CreatePlaylistBody, options?: RequestOptions) =>
      request<Playlist>({
        method: "POST",
        path: `/users/${encodePath(userId)}/playlists`,
        body,
        ...requestOptions(options),
      }),
    getFeatured: (options?: FeaturedPlaylistsOptions) =>
      request<{ playlists: Paging<Playlist>; message?: string }>({
        method: "GET",
        path: "/browse/featured-playlists",
        query: pickQuery(options, ["country", "locale", "timestamp", "limit", "offset"]),
        ...requestOptions(options),
      }),
    getCategoryPlaylists: (
      categoryId: string,
      options?: CategoryPlaylistsOptions,
    ) =>
      request<{ playlists: Paging<Playlist> }>({
        method: "GET",
        path: `/browse/categories/${encodePath(categoryId)}/playlists`,
        query: pickQuery(options, ["country", "limit", "offset"]),
        ...requestOptions(options),
      }),
    getCoverImage: (playlistId: string, options?: RequestOptions) =>
      request<PlaylistCoverImage[]>({
        method: "GET",
        path: `/playlists/${encodePath(playlistId)}/images`,
        ...requestOptions(options),
      }),
    uploadCustomCoverImage: (
      playlistId: string,
      jpegImageBase64: string,
      options?: CustomPlaylistCoverImageOptions,
    ) => uploadCustomCoverImage(request, playlistId, jpegImageBase64, options),
    /** @deprecated Use uploadCustomCoverImage. */
    addCustomCoverImage: (
      playlistId: string,
      jpegImageBase64: string,
      options?: CustomPlaylistCoverImageOptions,
    ) => uploadCustomCoverImage(request, playlistId, jpegImageBase64, options),
  };
}

function uploadCustomCoverImage(
  request: Requester,
  playlistId: string,
  jpegImageBase64: string,
  options?: CustomPlaylistCoverImageOptions,
) {
  if (options?.validatePayloadSize !== false) {
    assertCustomCoverImageSize(jpegImageBase64);
  }

  return request<void>({
    method: "PUT",
    path: `/playlists/${encodePath(playlistId)}/images`,
    rawBody: jpegImageBase64,
    headers: { ...headerRecord(options?.headers), "content-type": "image/jpeg" },
    signal: options?.signal,
  });
}

function assertCustomCoverImageSize(jpegImageBase64: string): void {
  const byteLength = new TextEncoder().encode(jpegImageBase64).byteLength;

  if (byteLength > MAX_CUSTOM_COVER_IMAGE_BYTES) {
    throw new RangeError(
      `Spotify custom playlist cover image payload must be 256 KB or smaller; got ${byteLength} bytes.`,
    );
  }
}
